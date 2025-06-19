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
  if (targetType === 'bedrijf') {
    try {
      const resp = await fetch(`/api/bedrijven/${targetId}`);
      if (!resp.ok) throw new Error();
      const result = await resp.json();
      const company = result.data;
      document.getElementById('companyName').textContent = company.naam;
      document.getElementById('companyLogo').alt         = `Logo van ${company.naam}`;
      if (company.logo_url) {
        document.getElementById('companyLogo').src = company.logo_url;
      }
    } catch {
      console.warn('Kon bedrijfsgegevens niet laden');
    }
  } else if (targetType === 'student') {
    try {
      const resp = await fetchWithAuth(`/api/studenten/${targetId}`);
      if (!resp.ok) throw new Error();
      const result = await resp.json();
      const student = result.data;
      document.getElementById('companyName').textContent = student.naam || (student.voornaam + ' ' + student.achternaam);
      document.getElementById('companyLogo').alt         = `Profiel van ${student.voornaam}`;
      // Optioneel: avatar
      if (student.avatar_url) {
        document.getElementById('companyLogo').src = student.avatar_url;
      }
    } catch {
      console.warn('Kon studentgegevens niet laden');
    }
  }
}

// 2) Tijdslots ophalen voor gegeven datum
async function loadTimeSlots(date) {
  const loadingEl = document.getElementById('loadingMessage');
  const slotsEl   = document.getElementById('timeSlots');
  const errorEl   = document.getElementById('errorMessage');

  loadingEl.style.display = 'block';
  slotsEl.innerHTML       = '';
  errorEl.style.display   = 'none';

  try {
    let resp, result;
    if (targetType === 'bedrijf') {
      resp = await fetch(`/api/bedrijven/${targetId}/slots`);
      if (!resp.ok) throw new Error();
      result = await resp.json();
      availableSlots = (result.data || []).map(slot => ({
        start_time: slot.start,
        end_time: slot.end,
        is_available: slot.available !== false,
        id: slot.id || `${slot.start}-${slot.end}`
      }));
    } else if (targetType === 'student') {
      // Voor student: haal alle reservaties van deze student op en blokkeer bezette slots
      resp = await fetchWithAuth(`/api/reservaties/my?studentnummer=${targetId}`);
      result = await resp.json();
      // Stel: je hebt een vaste lijst van tijdslots (of haal ze op via een endpoint)
      // Hier: dummy tijdslots + blokkeren van bezette
      let allSlots = [
        {id:1, start_time:'13:00', end_time:'13:30'},
        {id:2, start_time:'13:30', end_time:'14:00'},
        {id:3, start_time:'14:00', end_time:'14:30'},
        {id:4, start_time:'14:30', end_time:'15:00'},
        {id:5, start_time:'15:00', end_time:'15:30'},
        {id:6, start_time:'15:30', end_time:'16:00'},
        {id:7, start_time:'16:00', end_time:'16:30'},
        {id:8, start_time:'16:30', end_time:'17:00'},
        {id:9, start_time:'17:00', end_time:'17:30'},
        {id:10,start_time:'17:30', end_time:'18:00'},
        {id:11,start_time:'18:00', end_time:'18:30'},
        {id:12,start_time:'18:30', end_time:'19:00'}
      ];
      const bezet = (result.data || []).filter(r => r.status === 'bevestigd')
        .map(r => `${r.startTijd.split('T')[1].slice(0,5)}-${r.eindTijd.split('T')[1].slice(0,5)}`);
      availableSlots = allSlots.map(slot => ({
        ...slot,
        is_available: !bezet.includes(`${slot.start_time}-${slot.end_time}`)
      }));
    }
    if (availableSlots.length) {
      const first = availableSlots[0].start_time;
      const last  = availableSlots[availableSlots.length-1].end_time;
      document.getElementById('timeRange').textContent = `${first} – ${last}`;
    }
    displayTimeSlots();
  } catch {
    generateMockSlots();
  } finally {
    loadingEl.style.display = 'none';
  }
}

function generateMockSlots() {
  availableSlots = [
    {id:1, start_time:'13:00', end_time:'13:30', is_available:true},
    {id:2, start_time:'13:30', end_time:'14:00', is_available:true},
    {id:3, start_time:'14:00', end_time:'14:30', is_available:false},
    {id:4, start_time:'14:30', end_time:'15:00', is_available:true},
    {id:5, start_time:'15:00', end_time:'15:30', is_available:false},
    {id:6, start_time:'15:30', end_time:'16:00', is_available:true},
    {id:7, start_time:'16:00', end_time:'16:30', is_available:true},
    {id:8, start_time:'16:30', end_time:'17:00', is_available:false},
    {id:9, start_time:'17:00', end_time:'17:30', is_available:true},
    {id:10,start_time:'17:30', end_time:'18:00', is_available:false},
    {id:11,start_time:'18:00', end_time:'18:30', is_available:true},
    {id:12,start_time:'18:30', end_time:'19:00', is_available:false}
  ];
  const first = availableSlots[0].start_time;
  const last  = availableSlots[availableSlots.length-1].end_time;
  document.getElementById('timeRange').textContent = `${first} – ${last}`;
  displayTimeSlots();
}

function displayTimeSlots() {
  const container = document.getElementById('timeSlots');
  container.innerHTML = '';

  if (!availableSlots.length) {
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:#666">
      Geen tijdslots beschikbaar
    </div>`;
    return;
  }

  availableSlots.forEach(slot => {
    const el = document.createElement('div');
    el.className      = `time-slot ${slot.is_available?'available':'occupied'}`;
    el.innerHTML      = `<div class="time-label">${slot.start_time} – ${slot.end_time}</div>`;
    el.dataset.slotId = slot.id;
    container.appendChild(el);
  });

  if (!container.dataset.listenerAdded) {
    container.addEventListener('click', function(e) {
      let slotDiv = e.target;
      while (slotDiv && !slotDiv.classList.contains('time-slot')) {
        slotDiv = slotDiv.parentElement;
      }
      if (!slotDiv || !slotDiv.classList.contains('available')) return;
      const slotId = slotDiv.dataset.slotId;
      const slotObj = availableSlots.find(s => String(s.id) === String(slotId));
      if (!slotObj) return;
      document.querySelectorAll('.time-slot.selected')
              .forEach(x => x.classList.remove('selected'));
      slotDiv.classList.add('selected');
      selectedSlot = slotObj;
      document.getElementById('selectedTime').textContent = `${slotObj.start_time} – ${slotObj.end_time}`;
      document.getElementById('selectedInfo').classList.add('show');
      document.getElementById('reserveBtn').disabled = false;
    });
    container.dataset.listenerAdded = 'true';
  }
}

// 6) Reservering versturen
async function makeReservation() {
  if (!selectedSlot) {
    window.showNotification('Selecteer eerst een tijdslot.', 'warning');
    return;
  }
  const btn      = document.getElementById('reserveBtn');
  const original = btn.textContent;
  btn.disabled   = true;
  btn.textContent= 'Reserveren…';

  try {
    let payload = {};
    if (userInfo.userType === 'student') {
      payload = {
        bedrijfsnummer: targetId,
        tijdslot: `${selectedSlot.start_time}-${selectedSlot.end_time}`
      };
    } else if (userInfo.userType === 'bedrijf') {
      payload = {
        studentnummer: targetId,
        tijdslot: `${selectedSlot.start_time}-${selectedSlot.end_time}`
      };
    }
    const response = await fetchWithAuth('/api/reservaties/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      window.showNotification(result.message || 'Fout bij het aanvragen van de reservatie.', 'error');
      return;
    }
    window.showNotification(result.message || 'Reservatie aangevraagd!', 'success');
    selectedSlot.is_available = false;
    displayTimeSlots();
    selectedSlot = null;
    document.getElementById('selectedInfo').classList.remove('show');
    document.getElementById('reserveBtn').disabled = true;
  } catch (err) {
    window.showNotification('Fout bij reserveren: ' + (err && err.message ? err.message : 'Onbekende fout'), 'error');
  } finally {
    btn.textContent = original;
    btn.disabled    = true;
  }
}

function goBack() {
  window.history.back();
}

// UNIVERSELE INIT

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const userRes = await fetchWithAuth('/user-info');
    userInfo = await userRes.json();
    const params = new URLSearchParams(window.location.search);
    if (userInfo.userType === 'student') {
      targetId = params.get('bedrijf');
      targetType = 'bedrijf';
      if (!targetId) {
        window.showNotification('Geen bedrijf geselecteerd. Je wordt teruggestuurd naar het bedrijvenoverzicht.', 'error');
        setTimeout(() => window.location.href = '/alle-bedrijven.html', 2000);
        return;
      }
    } else if (userInfo.userType === 'bedrijf') {
      targetId = params.get('student');
      targetType = 'student';
      if (!targetId) {
        window.showNotification('Geen student geselecteerd. Je wordt teruggestuurd naar het studentenoverzicht.', 'error');
        setTimeout(() => window.location.href = '/alle-studenten.html', 2000);
        return;
      }
    } else {
      window.showNotification('Onbekende gebruikersrol.', 'error');
      window.location.href = '/';
      return;
    }
    document.getElementById('currentDate').textContent = formatDate(currentDate);
    await loadTargetInfo();
    await loadTimeSlots(currentDate);
  } catch (e) {
    window.showNotification('Kon gebruikersinfo niet ophalen. Probeer opnieuw.', 'error');
    return;
  }

  // Reserveer-knop eventlistener
  const reserveBtn = document.getElementById('reserveBtn');
  if (reserveBtn) {
    reserveBtn.replaceWith(reserveBtn.cloneNode(true));
    const newReserveBtn = document.getElementById('reserveBtn');
    newReserveBtn.addEventListener('click', (e) => {
      if (!selectedSlot) {
        window.showNotification('Selecteer eerst een tijdslot voordat je reserveert.', 'warning');
        e.preventDefault();
        return false;
      }
      newReserveBtn.disabled = true;
      makeReservation().finally(() => {
        newReserveBtn.disabled = false;
      });
    });
  }
});