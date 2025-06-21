// Bedrijf Homepage JavaScript - Dynamische data loading

import { fetchWithAuth } from "../api.js";
import { showNotification } from "./notification-system.js";
import { updateDataCounts } from "./stat-utils.js";

document.addEventListener('DOMContentLoaded', async () => {
    // Laad alle bedrijf-specifieke data bij het laden van de pagina
    await loadUserInfo();
    await loadUpcomingMeetings();
    await loadPendingAppointmentsCount();
});

async function loadUserInfo() {
    try {
        const user = await fetchWithAuth('/api/auth/me');
        if (user && user.naam) {
            const welcomeTitle = document.getElementById('bedrijfWelcomeTitle');
            if (welcomeTitle) {
                welcomeTitle.textContent = `Welkom, ${user.naam}! 🏢`;
            }
        }
        updateDataCounts();
    } catch (error) {
        console.error('Fout bij het laden van gebruikersinfo:', error);
        showNotification('Kon gebruikersinformatie niet laden.', 'error');
    }
}

async function loadPendingAppointmentsCount() {
    try {
        const appointments = await fetchWithAuth('/api/reservaties');
        const pendingCount = appointments.filter(a => a.status === 'aangevraagd').length;
        
        updateDataCounts({ '#pending-appointments-count': pendingCount });

    } catch (error) {
        console.error('Fout bij het laden van aantal afspraken:', error);
    }
}

async function loadUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings-grid');
    const countElement = document.getElementById('upcoming-meetings-count');
    if (!container || !countElement) return;

    try {
        const meetings = await ReservatieService.getCompanyReservations();
        const upcoming = meetings.filter(m => m.status === 'aangevraagd' || m.status === 'bevestigd');
        
        countElement.textContent = upcoming.length;

        if (upcoming.length > 0) {
            upcoming.sort((a, b) => new Date(a.startTijd) - new Date(b.startTijd));
            const displayMeetings = upcoming.slice(0, 4);
            
            container.innerHTML = displayMeetings.map(meeting => {
                const startDate = new Date(meeting.startTijd);
                const endDate = new Date(meeting.eindTijd);
                const formattedDate = startDate.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit' });
                const formattedStartTime = startDate.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                const formattedEndTime = endDate.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                
                return `
                    <div class="preview-card">
                        <h3 class="card-title">${meeting.studentNaam || 'Onbekende student'}</h3>
                        <p class="card-description">
                            <strong>📅 ${formattedDate}</strong>, <strong>🕐 ${formattedStartTime} - ${formattedEndTime}</strong><br>
                            Status: <span class="status-${meeting.status}">${meeting.status}</span>
                        </p>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `<div class="preview-card" style="text-align: center; color: #666;"><h3 class="card-title">Geen gesprekken gepland</h3><p class="card-description">Er zijn momenteel geen aankomende gesprekken gepland.</p></div>`;
        }
    } catch (error) {
        console.error('Error loading upcoming meetings:', error);
        container.innerHTML = `<div class="preview-card" style="text-align: center; color: #dc3545;"><h3 class="card-title">Fout bij laden</h3><p class="card-description">Kan gesprekken niet laden.</p></div>`;
    }
} 