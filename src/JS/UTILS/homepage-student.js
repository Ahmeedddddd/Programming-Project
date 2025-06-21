document.addEventListener('DOMContentLoaded', () => {
    initializeStudentHomepage();
});

function initializeStudentHomepage() {
    loadUserInfo();
    loadUpcomingMeetings();
    // De rest van de kaarten (bedrijven, projecten) wordt door index.js afgehandeld.
}

async function loadUserInfo() {
    try {
        const response = await fetchWithAuth('/api/user-info');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success && result.data) {
            const welcomeTitle = document.getElementById('studentWelcomeTitle');
            if (welcomeTitle && result.data.voornaam) {
                welcomeTitle.textContent = `Welkom terug, ${result.data.voornaam}! 🎓`;
            }
        } else {
            console.warn('User info not found in response:', result.message);
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

async function loadUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings-grid');
    const countBadge = document.getElementById('upcoming-appointments-count');
    const sectionCount = document.getElementById('upcoming-meetings-count');

    if (!container || !countBadge || !sectionCount) {
        console.warn('One or more elements for upcoming meetings not found.');
        return;
    }

    try {
        const meetings = await window.ReservatieService.getMyReservations();
        const upcomingMeetings = meetings.filter(m => ['bevestigd', 'aangevraagd'].includes(m.status));

        const count = upcomingMeetings.length;
        countBadge.textContent = count;
        sectionCount.textContent = count;
        sectionCount.dataset.count = count;

        if (count === 0) {
            container.innerHTML = `<div class="no-data">Geen aankomende gesprekken gevonden.</div>`;
            return;
        }
        
        container.innerHTML = upcomingMeetings.slice(0, 4).map(meeting => {
             const startTime = new Date(meeting.startTijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(meeting.eindTijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="preview-card">
                    <h3 class="card-title">${meeting.bedrijfNaam}</h3>
                    <div class="card-description">
                        <p><strong>Tijd:</strong> ${startTime} - ${endTime}</p>
                        <p><strong>Status:</strong> <span class="status-${meeting.status.toLowerCase()}">${meeting.status}</span></p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load upcoming meetings:', error);
        container.innerHTML = `<div class="no-data" style="color: #dc3545;">Kon gesprekken niet laden.</div>`;
    }
} 