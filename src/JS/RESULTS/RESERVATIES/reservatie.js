let selectedSlot   = null;
let currentDate    = new Date();
let availableSlots = [];
let userInfo       = null;
let targetId       = null; // bedrijf of student, afhankelijk van rol
let targetType     = null; // 'bedrijf' of 'student'

function getCompanyIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('bedrijfId');
}

const COMPANY_ID = getCompanyIdFromUrl();

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
    let resp;
    if (targetType === 'bedrijf') {
      resp = await window.fetchWithAuth(`/api/bedrijven/${targetId}`);
    } else {
      resp = await window.fetchWithAuth(`/api/studenten/${targetId}`);
    }
    
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    
    const data = await resp.json();
    const target = data.data || data;
    
    if (targetType === 'bedrijf') {
      // Update company name and logo using the correct IDs from HTML
      const companyNameEl = document.getElementById('companyName');
      const companyLogoEl = document.getElementById('companyLogo');
      
      if (companyNameEl) {
        companyNameEl.textContent = target.naam || 'Onbekend bedrijf';
      }
      
      if (companyLogoEl) {
        companyLogoEl.src = target.logo || '/images/default-company-logo.png';
        companyLogoEl.alt = `${target.naam || 'Bedrijf'} logo`;
      }
      
      // Update role distinction
      const roleDistinctionEl = document.getElementById('roleDistinction');
      if (roleDistinctionEl) {
        roleDistinctionEl.innerHTML = `<strong>Je reserveert bij:</strong> ${target.naam || 'Bedrijf'}`;
      }
    } else {
      // Update student info
      const companyNameEl = document.getElementById('companyName');
      const companyLogoEl = document.getElementById('companyLogo');
      
      if (companyNameEl) {
        companyNameEl.textContent = `${target.voornaam} ${target.achternaam}` || 'Onbekende student';
      }
      
      if (companyLogoEl) {
        companyLogoEl.src = '/images/mystery man avatar.webp'; // Default student avatar
        companyLogoEl.alt = `${target.voornaam} ${target.achternaam} avatar`;
      }
      
      // Update role distinction
      const roleDistinctionEl = document.getElementById('roleDistinction');
      if (roleDistinctionEl) {
        roleDistinctionEl.innerHTML = `<strong>Je nodigt uit:</strong> ${target.voornaam} ${target.achternaam}`;
      }
    }
    
    console.log(`✅ Target info loaded: ${targetType} ${targetId}`);
    
  } catch (error) {
    console.error('Error loading target info:', error);
    window.showNotification('Kon bedrijfsinformatie niet laden.', 'error');
  }
}

// 2) Tijdslots ophalen voor gegeven datum
async function loadTimeSlots(date) {
  try {
    console.log(`[RESERVATIE] Loading time slots for ${targetType} ${targetId} on ${date}`);
    
    // Show loading message
    const loadingEl = document.getElementById('loadingMessage');
    if (loadingEl) {
      loadingEl.style.display = 'block';
    }
    
    // Hide error message
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
    
    let endpoint;
    if (targetType === 'bedrijf') {
      endpoint = `/api/bedrijven/${targetId}/slots`;
    } else {
      endpoint = `/api/studenten/${targetId}/slots`;
    }
    
    const response = await window.fetchWithAuth(endpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Hide loading message
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    
    if (data.success === false) {
      throw new Error(data.message || 'Failed to load time slots');
    }
    
    // Extract time slots from response
    availableSlots = data.data || data || [];
    
    console.log(`[RESERVATIE] Loaded ${availableSlots.length} time slots:`, availableSlots);
    
    // Update time range display
    const timeRangeEl = document.getElementById('timeRange');
    if (timeRangeEl && availableSlots.length > 0) {
      const first = availableSlots[0].start;
      const last = availableSlots[availableSlots.length - 1].end;
      timeRangeEl.textContent = `Beschikbare tijden: ${first} - ${last}`;
    }
    
    // Display the time slots
    displayTimeSlots();
    
  } catch (error) {
    console.error('[RESERVATIE] Error loading time slots:', error);
    
    // Hide loading message
    const loadingEl = document.getElementById('loadingMessage');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    
    // Show error message
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
      errorEl.textContent = `Fout bij laden tijdslots: ${error.message}`;
      errorEl.style.display = 'block';
    }
    
    // Fallback to mock slots for testing
    console.log('[RESERVATIE] Using fallback mock slots');
    generateMockSlots();
    displayTimeSlots();
  }
}

function generateMockSlots() {
  availableSlots = [
    {id:1, start:'13:00', end:'13:30', available:true},
    {id:2, start:'13:30', end:'14:00', available:true},
    {id:3, start:'14:00', end:'14:30', available:false},
    {id:4, start:'14:30', end:'15:00', available:true},
    {id:5, start:'15:00', end:'15:30', available:false},
    {id:6, start:'15:30', end:'16:00', available:true},
    {id:7, start:'16:00', end:'16:30', available:true},
    {id:8, start:'16:30', end:'17:00', available:false},
    {id:9, start:'17:00', end:'17:30', available:true},
    {id:10,start:'17:30', end:'18:00', available:false},
    {id:11,start:'18:00', end:'18:30', available:true},
    {id:12,start:'18:30', end:'19:00', available:false}
  ];
  const first = availableSlots[0].start;
  const last  = availableSlots[availableSlots.length-1].end;
  document.getElementById('timeRange').textContent = `${first} – ${last}`;
  displayTimeSlots();
}

function displayTimeSlots() {
  const container = document.getElementById('timeSlots');
  if (!container) return;
  container.innerHTML = '';

  if (!availableSlots || availableSlots.length === 0) {
    container.innerHTML = `<div class="no-data">Geen tijdslots beschikbaar</div>`;
    return;
  }

  availableSlots.forEach(slot => {
    const el = document.createElement('div');
    el.className = `time-slot ${slot.available ? 'available' : 'occupied'}`;
    el.innerHTML = `<div class="time-label">${slot.start} – ${slot.end}</div>`;
    // Gebruik een betrouwbare identifier, zoals de combinatie van start- en eindtijd.
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
  if (!slot.available) {
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
    let payload = {};
    if (userInfo.userType === 'student') {
      payload = {
        bedrijfsnummer: parseInt(targetId, 10),
        tijdslot: `${selectedSlot.start}-${selectedSlot.end}`
      };
    } else if (userInfo.userType === 'bedrijf') {
      payload = {
        studentnummer: parseInt(targetId, 10),
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
      
      // Reset form
      selectedSlot = null;
      const selectedTimeEl = document.getElementById('selectedTime');
      if (selectedTimeEl) {
        selectedTimeEl.textContent = '';
      }
      
      // Disable button
      btn.disabled = true;
      
      // Reload time slots to show updated availability
      await loadTimeSlots(new Date().toISOString().split('T')[0]);
      
    } else {
      throw new Error(result.message || 'Reservering mislukt');
    }

  } catch (error) {
    console.error('[RESERVATIE] Error making reservation:', error);
    window.showNotification(`Fout bij reserveren: ${error.message}`, 'error');
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

function goBack() {
  window.history.back();
}

// UNIVERSELE INIT

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const userRes = await window.fetchWithAuth('/api/user-info');
    if (!userRes.ok) throw new Error('Kon gebruikersinformatie niet ophalen.');
    userInfo = await userRes.json();

    const params = new URLSearchParams(window.location.search);
    let idParamKey;

    if (userInfo.userType === 'student') {
        targetType = 'bedrijf';
        idParamKey = 'bedrijf';
    } else {
        targetType = 'student';
        idParamKey = 'student';
    }

    targetId = params.get(idParamKey) || getCompanyIdFromUrl();

    if (!targetId) {
      throw new Error(`Geen ${targetType} ID gevonden in de URL.`);
    }
    
    console.log(`[RESERVATIE] userType: ${userInfo.userType} | targetType: ${targetType} | targetId: ${targetId}`);

    await loadTargetInfo();
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