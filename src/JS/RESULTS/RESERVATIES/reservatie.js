// Global state variables
let selectedSlot = null;
let currentDate = new Date();
let availableSlots = [];
let loggedInUserInfo = null; // The user who is logged in
let targetInfo = null;     // The user profile being viewed for reservation
let targetId = null;
let targetType = null;

function getCompanyIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  // Check multiple possible parameter names for company ID
  return params.get('bedrijf') || params.get('bedrijfId') || params.get('id');
}

function formatDate(date) {
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatDateForAPI(date) {
  return date.toISOString().split('T')[0];
}

// 1) Info ophalen van de andere partij
async function loadTargetInfo() {
  try {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('student') || params.get('studentId') || params.get('id');
    const bedrijfId = params.get('bedrijf') || params.get('bedrijfId');
    
    if (!studentId && !bedrijfId) {
      throw new Error('Geen student ID gevonden in de URL');
    }

    let resp;
    if (bedrijfId) {
      resp = await window.fetchWithAuth(`/api/bedrijven/${bedrijfId}`);
    } else {
      resp = await window.fetchWithAuth(`/api/studenten/${studentId}`);
    }

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }

    const data = await resp.json();
    const targetInfo = data.data || data;

    if (!targetInfo) {
        throw new Error("Geen geldige data ontvangen van de server.");
    }
    
    if (bedrijfId) {
      // Update company name and logo using the correct IDs from HTML
      const companyNameEl = document.getElementById('companyName');
      const companyLogoEl = document.getElementById('companyLogo');
      
      if (companyNameEl) {
        companyNameEl.textContent = targetInfo.naam || 'Onbekend bedrijf';
      }
      
      if (companyLogoEl) {
        companyLogoEl.src = targetInfo.logo || '/images/default-company-logo.png';
        companyLogoEl.alt = `${targetInfo.naam || 'Bedrijf'} logo`;
      }
      
      // Update role distinction
      const roleDistinctionEl = document.getElementById('roleDistinction');
      if (roleDistinctionEl) {
        roleDistinctionEl.innerHTML = `<strong>Je reserveert bij:</strong> ${targetInfo.naam || 'Bedrijf'}`;
      }
    } else {
      // Update student info
      const companyNameEl = document.getElementById('companyName');
      const companyLogoEl = document.getElementById('companyLogo');
      
      if (companyNameEl) {
        companyNameEl.textContent = `${targetInfo.voornaam} ${targetInfo.achternaam}` || 'Onbekende student';
      }
      
      if (companyLogoEl) {
        companyLogoEl.src = '/images/mystery man avatar.webp'; // Default student avatar
        companyLogoEl.alt = `${targetInfo.voornaam} ${targetInfo.achternaam} avatar`;
      }
      
      // Update role distinction
      const roleDistinctionEl = document.getElementById('roleDistinction');
      if (roleDistinctionEl) {
        roleDistinctionEl.innerHTML = `<strong>Je nodigt uit:</strong> ${targetInfo.voornaam} ${targetInfo.achternaam}`;
      }
    }

    console.log(`✅ Target info loaded: ${bedrijfId ? 'bedrijf' : 'student'} ${bedrijfId || studentId}`);

  } catch (error) {
    console.error('Error loading target info:', error);
    window.showNotification('Kon de informatie van de tegenpartij niet laden.', 'error');
  }
}

async function loadTimeSlots(date) {
  try {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('student') || params.get('studentId') || params.get('id');
    const bedrijfId = params.get('bedrijf') || params.get('bedrijfId');
    
    if (!studentId && !bedrijfId) {
      throw new Error('Geen ID gevonden in de URL');
    }

    console.log(`[RESERVATIE] Loading time slots for ${bedrijfId ? 'bedrijf' : 'student'} ${bedrijfId || studentId} on ${date}`);

    let endpoint;
    if (bedrijfId) {
      endpoint = `/api/bedrijven/${bedrijfId}/slots`;
    } else {
      endpoint = `/api/studenten/${studentId}/slots`;
    }

    const response = await window.fetchWithAuth(endpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      availableSlots = result.data;
      console.log(`[RESERVATIE] Found ${availableSlots.length} time slots:`, availableSlots);
      
      // Update time range display
      const timeRangeEl = document.getElementById('timeRange');
      if (timeRangeEl && availableSlots.length > 0) {
        const first = availableSlots[0].start;
        const last = availableSlots[availableSlots.length - 1].end;
        timeRangeEl.textContent = `Beschikbare tijden: ${first} - ${last}`;
      }
      
      displayTimeSlots();
    } else {
      throw new Error(result.message || 'Geen tijdslots gevonden');
    }

  } catch (error) {
    console.error('[RESERVATIE] Error loading time slots:', error);
    
    // Fallback to mock slots for testing
    console.log('[RESERVATIE] Using fallback mock slots');
    availableSlots = [
      { start: '09:00', end: '09:30', available: true },
      { start: '09:30', end: '10:00', available: true },
      { start: '10:00', end: '10:30', available: true },
      { start: '10:30', end: '11:00', available: true },
      { start: '11:00', end: '11:30', available: true },
      { start: '11:30', end: '12:00', available: true },
      { start: '13:00', end: '13:30', available: true },
      { start: '13:30', end: '14:00', available: true },
      { start: '14:00', end: '14:30', available: true },
      { start: '14:30', end: '15:00', available: true },
      { start: '15:00', end: '15:30', available: true },
      { start: '15:30', end: '16:00', available: true }
    ];
    
    displayTimeSlots();
  }
}

function displayTimeSlots() {
  const container = document.getElementById('timeSlots');
  if (!container) return;
  container.innerHTML = '';

  if (availableSlots.length === 0) {
    container.innerHTML = `<div class="no-data">Geen tijdslots beschikbaar voor deze gebruiker.</div>`;
    return;
  }

  availableSlots.forEach(slot => {
    const el = document.createElement('div');
    // Ensure 'available' property is treated as a boolean
    const isAvailable = slot.available === true || slot.available === 1;
    el.className = `time-slot ${isAvailable ? 'available' : 'occupied'}`;
    el.innerHTML = `<div class="time-label">${slot.start} – ${slot.end}</div>`;
    el.dataset.slotIdentifier = `${slot.start}-${slot.end}`;
    container.appendChild(el);
  });

  if (!container.dataset.listenerAdded) {
    container.addEventListener('click', function(event) {
      const slotElement = event.target.closest('.time-slot.available');
      if (!slotElement) return;

      const identifier = slotElement.dataset.slotIdentifier;
      const clickedSlot = availableSlots.find(s => `${s.start}-${s.end}` === identifier);
      
      if (clickedSlot) {
        selectTimeSlot(clickedSlot);
      }
    });
    container.dataset.listenerAdded = 'true';
  }
}

function selectTimeSlot(slot) {
  const isAvailable = slot.available === true || slot.available === 1;
  if (!isAvailable) {
    window.showNotification('Dit tijdslot is niet beschikbaar.', 'error');
    return;
  }
  
  selectedSlot = slot;

  // Update UI om selectie weer te geven
  document.querySelectorAll('.time-slot').forEach(el => {
    el.classList.remove('selected');
  });

  const identifier = `${slot.start}-${slot.end}`;
  const targetElement = document.querySelector(`.time-slot[data-slot-identifier="${identifier}"]`);

  if (targetElement) {
    targetElement.classList.add('selected');
    const reserveBtn = document.getElementById('reserveBtn');
    if(reserveBtn){
      reserveBtn.disabled = false;
      reserveBtn.textContent = `Reserveer ${slot.start} - ${slot.end}`;
    }
  }

  console.log('[RESERVATIE] Tijdslot geselecteerd:', selectedSlot);
}

// 6) Reservering versturen
async function makeReservation() {
  if (!selectedSlot) {
    window.showNotification('Selecteer eerst een tijdslot.', 'warning');
    return;
  }
  
  const btn = document.getElementById('reserveBtn');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Reserveren…';

  try {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('student') || params.get('studentId') || params.get('id');
    const bedrijfId = params.get('bedrijf') || params.get('bedrijfId');
    
    let payload = {};
    if (bedrijfId) {
      // Student reserving with company
      payload = {
        bedrijfsnummer: parseInt(bedrijfId, 10),
        tijdslot: `${selectedSlot.start}-${selectedSlot.end}`
      };
    } else {
      // Company reserving with student
      payload = {
        studentnummer: parseInt(studentId, 10),
        tijdslot: `${selectedSlot.start}-${selectedSlot.end}`
      };
    }
    
    console.log('[RESERVATIE] Making reservation with payload:', payload);
    
    const response = await window.fetchWithAuth('/api/reservaties/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    if (result.success) {
      window.showNotification('Reservering succesvol aangemaakt!', 'success');
      setTimeout(() => {
        window.location.href = '/gesprekken-overzicht';
      }, 2000);
    } else {
      throw new Error(result.message || 'Reservering mislukt');
    }

  } catch (error) {
    console.error('[RESERVATIE] Error making reservation:', error);
    window.showNotification(error.message || 'Er is een fout opgetreden bij het maken van de reservering.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function goBack() {
  window.history.back();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  try {
    console.log('[RESERVATIE] Initializing reservation page...');
    
    // Get logged in user info
    const userResponse = await window.fetchWithAuth('/api/auth/me');
    if (userResponse.ok) {
      const userData = await userResponse.json();
      loggedInUserInfo = userData.data || userData;
      console.log('[RESERVATIE] Logged in user:', loggedInUserInfo);
    } else {
      console.error('[RESERVATIE] Could not get user info');
      window.location.href = '/login';
      return;
    }
    
    // Load target info
    await loadTargetInfo();
    
    // Load time slots
    await loadTimeSlots(new Date());

    // Event listener voor de reserveerknop
    const reserveBtn = document.getElementById('reserveBtn');
    if (reserveBtn) {
        reserveBtn.addEventListener('click', makeReservation);
    }
  } catch (error) {
    console.error('[RESERVATIE] Fout bij initialisatie:', error);
    window.showNotification(error.message || 'Er is een fout opgetreden bij het laden.', 'error');
  }
});