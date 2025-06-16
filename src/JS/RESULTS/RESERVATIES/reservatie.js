let selectedSlot   = null;
let currentDate    = new Date();
let availableSlots = [];

function formatDate(date) {
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}


function formatDateForAPI(date) {
  return date.toISOString().split('T')[0];
}

// 1) Bedrijfsnaam + logo ophalen
async function loadCompanyInfo() {
  try {
    const resp    = await fetch(`${API_BASE_URL}/companies/${COMPANY_ID}`);
    if (!resp.ok) throw new Error();
    const company = await resp.json();
    document.getElementById('companyName').textContent = company.name;
    document.getElementById('companyLogo').src         = company.logo_url;
    document.getElementById('companyLogo').alt         = `Logo van ${company.name}`;
  } catch {
    console.warn('Kon bedrijfsgegevens niet laden');
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
    const d    = formatDateForAPI(date);
    const resp = await fetch(
      `${API_BASE_URL}/companies/${COMPANY_ID}/slots?date=${d}`
    );
    if (!resp.ok) throw new Error();
    const data = await resp.json();
    availableSlots = data.slots || [];

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


// 4) Slots renderen
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
    if (slot.is_available) el.addEventListener('click', () => selectSlot(el, slot));
    container.appendChild(el);
  });
}


// 5) Slot selecteren
function selectSlot(el, slot) {
  document.querySelectorAll('.time-slot.selected')
          .forEach(x => x.classList.replace('selected','available'));
  el.classList.replace('available','selected');
  selectedSlot = slot;
  document.getElementById('selectedTime').textContent =
    `${slot.start_time} – ${slot.end_time}`;
  document.getElementById('selectedInfo').classList.add('show');
  document.getElementById('reserveBtn').disabled = false;
}


// 6) Reservering versturen
async function makeReservation() {
  if (!selectedSlot) return;
  const btn      = document.getElementById('reserveBtn');
  const original = btn.textContent;
  btn.disabled   = true;
  btn.textContent= 'Reserveren…';

  try {
    const resp = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        slot_id:    selectedSlot.id,
        student_id: STUDENT_ID,
        company_id: COMPANY_ID,
        date:       formatDateForAPI(currentDate)
      })
    });
    if (!resp.ok) throw new Error();
    alert(`✅ Reservering geplaatst voor ${formatDate(currentDate)} om ${selectedSlot.start_time}`);
    selectedSlot.is_available = false;
    displayTimeSlots();
    selectedSlot = null;
    document.getElementById('selectedInfo').classList.remove('show');
  } catch {
    alert('❌ Reservering mislukt.');
  } finally {
    btn.textContent = original;
    btn.disabled    = true;
  }
}

// 7) Terugknop
function goBack() {
  window.history.back();
}


// 8) Init: toon datum als tekst en laad alles
async function init() {
  // laat de datum zien als pure tekst
  document.getElementById('currentDate').textContent = formatDate(currentDate);
  await loadCompanyInfo();
  loadTimeSlots(currentDate);
}

document.addEventListener('DOMContentLoaded', init);