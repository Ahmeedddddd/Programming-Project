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
      const roleTargetName = document.getElementById('roleTargetName');
      if (roleTargetName) roleTargetName.textContent = company.naam;
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
      const roleTargetName = document.getElementById('roleTargetName');
      if (roleTargetName) roleTargetName.textContent = student.naam || (student.voornaam + ' ' + student.achternaam);
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
      // Student reserveert bij bedrijf: haal slots van bedrijf op
      resp = await fetch(`/api/bedrijven/${targetId}/slots`);
      if (!resp.ok) throw new Error();
      result = await resp.json();
      availableSlots = (result.data || []).map(slot => ({
        start_time: slot.start,
        end_time: slot.end,
        is_available: slot.available,
        id: slot.id || `${slot.start}-${slot.end}`
      }));
    } else if (targetType === 'student') {
      // Bedrijf reserveert bij student: haal slots op basis van eigen (bedrijf) bezetting
      // Haal ALLE slots op (dummy of via endpoint), en blokkeer bezette via /api/reservaties/company
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
      resp = await fetchWithAuth(`/api/reservaties/company`);
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          errorEl.style.display = 'block';
          errorEl.textContent = 'Je bent niet gemachtigd om deze reserveringen te zien.';
          return;
        }
        throw new Error();
      }
      result = await resp.json();
      const bezet = (result.data || []).filter(r => r.status === 'bevestigd' || r.status === 'aangevraagd')
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
  } catch (e) {
    console.error('[RESERVATIE] Fout bij laden van tijdslots:', e);
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
    console.log(`[SLOT] ${slot.start_time} – ${slot.end_time} | is_available:`, slot.is_available);
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
        bedrijfsnummer: parseInt(targetId, 10),
        tijdslot: `${selectedSlot.start_time}-${selectedSlot.end_time}`
      };
    } else if (userInfo.userType === 'bedrijf') {
      payload = {
        studentnummer: parseInt(targetId, 10),
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
    const userRes = await fetchWithAuth('/api/user-info');
    userInfo = await userRes.json();
    const params = new URLSearchParams(window.location.search);
    let bedrijfParam = params.get('bedrijf') || params.get('bedrijfId');
    let studentParam = params.get('student') || params.get('studentId');

    // Nieuw: haal id uit RESTful path als query ontbreekt
    const path = window.location.pathname;
    if (!bedrijfParam && /\/reserveren\/bedrijf\/(\d+)/.test(path)) {
      bedrijfParam = path.match(/\/reserveren\/bedrijf\/(\d+)/)[1];
      console.log('[RESERVATIE] BedrijfId uit path:', bedrijfParam);
    }
    if (!studentParam && /\/reserveren\/student\/(\d+)/.test(path)) {
      studentParam = path.match(/\/reserveren\/student\/(\d+)/)[1];
      console.log('[RESERVATIE] StudentId uit path:', studentParam);
    }
    console.log('[RESERVATIE] userType:', userInfo.userType, '| bedrijfParam:', bedrijfParam, '| studentParam:', studentParam);
    if (userInfo.userType === 'student') {
      targetId = bedrijfParam;
      targetType = 'bedrijf';
      console.log('[RESERVATIE] Student reserveert bij bedrijf:', targetId);
      if (!targetId) {
        window.showNotification('Geen bedrijf geselecteerd. Je wordt teruggestuurd naar het bedrijvenoverzicht.', 'error');
        setTimeout(() => window.location.href = '/alle-bedrijven.html', 2000);
        return;
      }
    } else if (userInfo.userType === 'bedrijf') {
      targetId = studentParam;
      targetType = 'student';
      console.log('[RESERVATIE] Bedrijf reserveert bij student:', targetId);
      if (!targetId) {
        window.showNotification('Geen student geselecteerd. Je wordt teruggestuurd naar het studentenoverzicht.', 'error');
        setTimeout(() => window.location.href = '/alle-studenten.html', 2000);
        return;
      }
    } else {
      window.showNotification('Onbekende gebruikersrol.', 'error');
      return;
    }
    document.getElementById('currentDate').textContent = formatDate(currentDate);
    await loadTargetInfo();
    await loadTimeSlots(currentDate);

    // === Vul role-distinction sectie ===
    const roleDiv = document.getElementById('roleDistinction');
    if (roleDiv) {
      let aanvragerHtml = '', ontvangerHtml = '';
      if (userInfo.userType === 'student') {
        aanvragerHtml = `
          <div class="role-block aanvrager">
            <span class="role-label">Aanvrager</span>
            <span class="role-icon"><i class="fas fa-user"></i></span>
            <span class="role-name">Jij</span>
            <span class="role-type"><i class="fas fa-user-graduate"></i> Student</span>
          </div>
        `;
        ontvangerHtml = `
          <div class="role-block ontvanger">
            <span class="role-label">Ontvanger</span>
            <span class="role-icon"><i class="fas fa-user-tie"></i></span>
            <span class="role-name" id="roleTargetName">Bedrijf</span>
            <span class="role-type"><i class="fas fa-building"></i> Bedrijf</span>
          </div>
        `;
      } else if (userInfo.userType === 'bedrijf') {
        aanvragerHtml = `
          <div class="role-block aanvrager">
            <span class="role-label">Aanvrager</span>
            <span class="role-icon"><i class="fas fa-user"></i></span>
            <span class="role-name">Jij</span>
            <span class="role-type"><i class="fas fa-building"></i> Bedrijf</span>
          </div>
        `;
        ontvangerHtml = `
          <div class="role-block ontvanger">
            <span class="role-label">Ontvanger</span>
            <span class="role-icon"><i class="fas fa-user-graduate"></i></span>
            <span class="role-name" id="roleTargetName">Student</span>
            <span class="role-type"><i class="fas fa-user-graduate"></i> Student</span>
          </div>
        `;
      }
      roleDiv.innerHTML = aanvragerHtml + ontvangerHtml;
    }
  } catch (e) {
    console.error('[RESERVATIE] Fout bij ophalen gebruikersinfo:', e);
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