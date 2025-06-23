/**
 * 📅 reservatie.js - Reservatie Systeem voor CareerLaunch EHB
 * 
 * Dit bestand beheert het reservatie systeem voor gesprekken:
 * - Reservaties tussen studenten en bedrijven
 * - Tijdslot selectie en beschikbaarheid
 * - API integratie voor reservatie verwerking
 * - Gebruiksvriendelijke interface voor booking
 * - Error handling en validatie
 * 
 * Belangrijke functionaliteiten:
 * - Dynamisch laden van beschikbare tijdslots
 * - Real-time tijdslot selectie
 * - Reservatie bevestiging en verwerking
 * - Fallback naar mock data bij API problemen
 * - Responsive design ondersteuning
 * - Gebruikerstype detectie (student/bedrijf)
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

// 🎯 Globale variabelen voor reservatie management
let selectedSlot = null;
let currentDate = new Date();
let availableSlots = [];
let loggedInUserInfo = null; // De ingelogde gebruiker
let targetInfo = null;     // Het profiel waarvoor gereserveerd wordt
let targetId = null;
let targetType = null;

/**
 * 🔗 Haalt bedrijf ID uit URL parameters
 * 
 * Controleert verschillende mogelijke parameter namen voor bedrijf ID
 * 
 * @returns {string|null} Het bedrijf ID uit de URL
 */
function getCompanyIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  // Check multiple possible parameter names for company ID
  return params.get('bedrijf') || params.get('bedrijfId') || params.get('id');
}

/**
 * 📅 Formatteert datum voor weergave
 * 
 * Converteert een datum object naar een leesbare Nederlandse string
 * 
 * @param {Date} date - De datum om te formatteren
 * @returns {string} Geformatteerde datum string
 */
function formatDate(date) {
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

/**
 * 📅 Formatteert datum voor API calls
 * 
 * Converteert een datum object naar ISO string format voor API requests
 * 
 * @param {Date} date - De datum om te formatteren
 * @returns {string} ISO datum string (YYYY-MM-DD)
 */
function formatDateForAPI(date) {
  return date.toISOString().split('T')[0];
}

/**
 * 📡 Laadt informatie van de tegenpartij
 * 
 * Haalt gegevens op van de student of bedrijf waarvoor gereserveerd wordt
 * en update de UI met de juiste informatie
 * 
 * @returns {Promise<void>}
 * @throws {Error} Bij fouten tijdens het laden
 */
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

  } catch (error) {
    window.showNotification('Kon de informatie van de tegenpartij niet laden.', 'error');
  }
}

/**
 * ⏰ Laadt beschikbare tijdslots voor een datum
 * 
 * Haalt beschikbare tijdslots op van de API voor de geselecteerde datum
 * en handelt errors af met fallback data
 * 
 * @param {Date} date - De datum waarvoor tijdslots geladen moeten worden
 * @returns {Promise<void>}
 */
async function loadTimeSlots(date) {
  try {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('student') || params.get('studentId') || params.get('id');
    const bedrijfId = params.get('bedrijf') || params.get('bedrijfId');
    
    if (!studentId && !bedrijfId) {
      throw new Error('Geen ID gevonden in de URL');
    }

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
    // Fallback to mock slots for testing
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

/**
 * 🎨 Toont beschikbare tijdslots in de UI
 * 
 * Rendert alle beschikbare tijdslots als klikbare elementen
 * met visuele indicatie van beschikbaarheid
 * 
 * @returns {void}
 */
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

/**
 * ✅ Selecteert een tijdslot
 * 
 * Markeert een tijdslot als geselecteerd en update de UI
 * 
 * @param {Object} slot - Het tijdslot object om te selecteren
 * @returns {void}
 */
function selectTimeSlot(slot) {
  // Remove previous selection
  const previousSelected = document.querySelector('.time-slot.selected');
  if (previousSelected) {
    previousSelected.classList.remove('selected');
  }

  // Add selection to clicked slot
  const slotElement = document.querySelector(`[data-slot-identifier="${slot.start}-${slot.end}"]`);
  if (slotElement) {
    slotElement.classList.add('selected');
  }

  selectedSlot = slot;
  
  // Show selected info
  const selectedInfo = document.getElementById('selectedInfo');
  if (selectedInfo) {
    selectedInfo.innerHTML = `
      <div class="selected-slot">
        <strong>Geselecteerd:</strong> ${slot.start} - ${slot.end}
      </div>
    `;
    selectedInfo.classList.add('show');
  }

  // Enable reserve button
  const reserveBtn = document.getElementById('reserveButton');
  if (reserveBtn) {
    reserveBtn.disabled = false;
  }
}

/**
 * 📅 Maakt een reservatie aan
 * 
 * Verzendt de reservatie naar de backend API en handelt
 * success/error responses af
 * 
 * @returns {Promise<void>}
 */
async function makeReservation() {
  if (!selectedSlot) {
    window.showNotification('Selecteer eerst een tijdslot.', 'warning');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get('student') || params.get('studentId') || params.get('id');
  const bedrijfId = params.get('bedrijf') || params.get('bedrijfId');

  if (!studentId && !bedrijfId) {
    window.showNotification('Geen geldige ID gevonden in de URL.', 'error');
    return;
  }

  const reserveBtn = document.getElementById('reserveButton');
  if (reserveBtn) {
    reserveBtn.disabled = true;
    reserveBtn.textContent = 'Reservatie maken...';
  }

  try {
    const payload = {
      tijdslot: `${selectedSlot.start}-${selectedSlot.end}`,
      datum: formatDateForAPI(currentDate)
    };

    if (bedrijfId) {
      payload.bedrijfsnummer = bedrijfId;
    } else {
      payload.studentnummer = studentId;
    }

    const response = await window.fetchWithAuth('/api/reservaties/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Reservatie mislukt');
    }

    const result = await response.json();
    
    if (result.success) {
      window.showNotification('Reservatie succesvol aangemaakt!', 'success');
      
      // Redirect to overview page after a short delay
      setTimeout(() => {
        if (bedrijfId) {
          window.location.href = '/gesprekken-overzicht-bedrijven';
        } else {
          window.location.href = '/gesprekken-overzicht-studenten';
        }
      }, 2000);
    } else {
      throw new Error(result.message || 'Reservatie mislukt');
    }

  } catch (error) {
    window.showNotification(`Fout bij maken van reservatie: ${error.message}`, 'error');
  } finally {
    if (reserveBtn) {
      reserveBtn.disabled = false;
      reserveBtn.textContent = 'Reservatie maken';
    }
  }
}

/**
 * ⬅️ Navigeert terug naar vorige pagina
 * 
 * Handelt terug navigatie af op basis van gebruikerstype
 * 
 * @returns {void}
 */
function goBack() {
  const params = new URLSearchParams(window.location.search);
  const bedrijfId = params.get('bedrijf') || params.get('bedrijfId');
  
  if (bedrijfId) {
    window.location.href = '/alle-bedrijven';
  } else {
    window.location.href = '/alle-studenten';
  }
}

/**
 * 🚀 Initialiseert de reservatie pagina
 * 
 * Deze functie is het hoofdpunt voor het opzetten van de reservatie functionaliteit:
 * - Laadt informatie van de tegenpartij
 * - Laadt beschikbare tijdslots
 * - Zet event listeners op
 * - Handelt gebruikerstype detectie af
 * 
 * @returns {Promise<void>}
 */
async function initializeReservationPage() {
  try {
    // Load target info first
    await loadTargetInfo();
    
    // Load time slots for current date
    await loadTimeSlots(currentDate);
    
    // Setup event listeners
    setupEventListeners();
    
    // Get logged in user info for debugging
    const userType = localStorage.getItem('userType');
    const authToken = localStorage.getItem('authToken');
    
    if (userType && authToken) {
      loggedInUserInfo = { userType, hasToken: true };
    }
    
  } catch (error) {
    window.showNotification('Er ging iets mis bij het laden van de reservatie pagina.', 'error');
  }
}

/**
 * 🎯 Zet event listeners op
 * 
 * Initialiseert alle benodigde event listeners voor
 * de reservatie functionaliteit
 * 
 * @returns {void}
 */
function setupEventListeners() {
  // Reserve button
  const reserveBtn = document.getElementById('reserveButton');
  if (reserveBtn) {
    reserveBtn.addEventListener('click', makeReservation);
  }

  // Back button
  const backBtn = document.getElementById('backButton');
  if (backBtn) {
    backBtn.addEventListener('click', goBack);
  }

  // Date navigation
  const prevBtn = document.getElementById('prevDate');
  const nextBtn = document.getElementById('nextDate');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - 1);
      updateDateDisplay();
      loadTimeSlots(currentDate);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + 1);
      updateDateDisplay();
      loadTimeSlots(currentDate);
    });
  }
}

/**
 * 📅 Werkt datum weergave bij
 * 
 * Update de UI met de huidige geselecteerde datum
 * 
 * @returns {void}
 */
function updateDateDisplay() {
  const dateDisplay = document.getElementById('dateDisplay');
  if (dateDisplay) {
    dateDisplay.textContent = formatDate(currentDate);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeReservationPage);