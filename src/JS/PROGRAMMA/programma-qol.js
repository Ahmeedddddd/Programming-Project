// programma-qol.js - Quality of Life features voor programma pagina's

function initializeProgrammaQoL() {
  
  // 1. ⏰ Event Countdown Timers
  initializeCountdownTimers();
  
  // 2. 📅 Add to Calendar functionality
  initializeAddToCalendar();
  
  // 3. 🔔 Event Reminders
  initializeEventReminders();
  
  // 4. 🗓️ Current Day Highlight
  highlightCurrentDay();
  
}

// ⏰ Event Countdown Timers
function initializeCountdownTimers() {
  // Zoek naar alle event tijden in de pagina
  const timeElements = document.querySelectorAll('[data-event-time], .event-time, .tijd');
  
  timeElements.forEach(element => {
    const timeText = element.textContent;
    const eventDate = parseEventTime(timeText);
    
    if (eventDate && eventDate > new Date()) {
      addCountdownTimer(element, eventDate);
    }
  });
}

function parseEventTime(timeText) {
  // Probeer verschillende tijd formaten te parsen
  const timePatterns = [
    /(\d{1,2}):(\d{2})/,  // 14:30
    /(\d{1,2})u(\d{2})/,  // 14u30
    /(\d{1,2})\.(\d{2})/  // 14.30
  ];
  
  for (let pattern of timePatterns) {
    const match = timeText.match(pattern);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      
      const today = new Date();
      const eventDate = new Date(today);
      eventDate.setHours(hours, minutes, 0, 0);
      
      // Als het tijd al voorbij is vandaag, maak het morgen
      if (eventDate <= today) {
        eventDate.setDate(eventDate.getDate() + 1);
      }
      
      return eventDate;
    }
  }
  
  return null;
}

function addCountdownTimer(element, eventDate) {
  const timer = document.createElement('small');
  timer.style.cssText = `
    display: block;
    color: #881538;
    font-weight: 600;
    margin-top: 0.25rem;
    font-size: 0.8rem;
  `;
  
  const updateTimer = () => {
    const now = new Date();
    const diff = eventDate - now;
    
    if (diff <= 0) {
      timer.innerHTML = '🔴 Event gestart!';
      timer.style.color = '#dc2626';
      clearInterval(timerInterval);
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      timer.innerHTML = `⏰ Start over ${hours}u ${minutes}m`;
    } else {
      timer.innerHTML = `⏰ Start over ${minutes} minuten`;
    }
    
    // Kleur verandering bij urgentie
    if (diff < 30 * 60 * 1000) { // 30 minuten
      timer.style.color = '#dc2626';
      timer.innerHTML = '🔥 ' + timer.innerHTML;
    } else if (diff < 60 * 60 * 1000) { // 1 uur
      timer.style.color = '#f59e0b';
    }
  };
  
  updateTimer();
  const timerInterval = setInterval(updateTimer, 60000); // Update elke minuut
  
  element.appendChild(timer);
}

// 📅 Add to Calendar
function initializeAddToCalendar() {
  document.querySelectorAll('.event, .programma-item, .sessie').forEach(eventElement => {
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.innerHTML = '📅 Agenda';
    addButton.className = 'ehbBtn secundair';
    addButton.style.cssText = `
      font-size: 0.8rem;
      padding: 0.4rem 0.8rem;
      margin-top: 0.5rem;
    `;
    
    addButton.addEventListener('click', () => {
      const eventData = extractEventData(eventElement);
      generateCalendarLink(eventData);
    });
    
    eventElement.appendChild(addButton);
  });
}

function extractEventData(element) {
  const title = element.querySelector('h3, h4, .title, .naam')?.textContent || 'EHB Event';
  const description = element.querySelector('p, .description, .omschrijving')?.textContent || '';
  const location = 'Erasmushogeschool Brussel';
  
  return { title, description, location };
}

function generateCalendarLink(eventData) {
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&details=${encodeURIComponent(eventData.description)}&location=${encodeURIComponent(eventData.location)}`;
  
  window.open(googleCalUrl, '_blank');
  
  if (window.showNotification) {
    window.showNotification('📅 Agenda link geopend!', 'success');
  }
}

// 🔔 Event Reminders
function initializeEventReminders() {
  // Check of browser notificaties ondersteund worden
  if ('Notification' in window) {
    const reminderButton = document.createElement('button');
    reminderButton.type = 'button';
    reminderButton.innerHTML = '🔔 Herinneringen Aan';
    reminderButton.className = 'ehbBtn';
    reminderButton.style.cssText = `
      position: fixed;
      bottom: 8rem;
      right: 2rem;
      z-index: 998;
      font-size: 0.9rem;
    `;
    
    reminderButton.addEventListener('click', () => {
      requestNotificationPermission();
    });
    
    document.body.appendChild(reminderButton);
  }
}

function requestNotificationPermission() {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        if (window.showNotification) {
          window.showNotification('✅ Herinneringen ingeschakeld!', 'success');
        }
        scheduleEventReminders();
      }
    });
  } else if (Notification.permission === 'granted') {
    scheduleEventReminders();
  } else {
    if (window.showNotification) {
      window.showNotification('❌ Herinneringen geblokkeerd in browser', 'error');
    }
  }
}

function scheduleEventReminders() {
  const events = document.querySelectorAll('[data-event-time], .event-time');
  
  events.forEach(event => {
    const eventDate = parseEventTime(event.textContent);
    if (eventDate && eventDate > new Date()) {
      const reminderTime = new Date(eventDate.getTime() - 15 * 60 * 1000); // 15 min voor event
      
      const now = new Date();
      if (reminderTime > now) {
        setTimeout(() => {
          new Notification('🎓 EHB Event Herinnering', {
            body: `Je event begint over 15 minuten`,
            icon: '/images/image.png'
          });
        }, reminderTime - now);
      }
    }
  });
  
  if (window.showNotification) {
    window.showNotification('⏰ Event herinneringen ingesteld!', 'success');
  }
}

// 🗓️ Current Day Highlight
function highlightCurrentDay() {
  const today = new Date().toLocaleDateString('nl-BE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  // Zoek naar elementen die vandaag bevatten
  document.querySelectorAll('*').forEach(element => {
    const text = element.textContent;
    if (text && text.includes(today.split(' ')[0])) { // Weekdag check
      element.style.background = 'linear-gradient(135deg, rgba(136, 21, 56, 0.1), rgba(169, 27, 71, 0.1))';
      element.style.border = '2px solid rgba(136, 21, 56, 0.3)';
      element.style.borderRadius = '8px';
      element.style.padding = '0.5rem';
      
      // Voeg "VANDAAG" badge toe
      const badge = document.createElement('span');
      badge.innerHTML = '🔥 VANDAAG';
      badge.style.cssText = `
        background: #881538;
        color: white;
        padding: 0.2rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: bold;
        margin-left: 0.5rem;
        vertical-align: top;
      `;
      
      element.appendChild(badge);
    }
  });
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProgrammaQoL);
} else {
  initializeProgrammaQoL();
}