import { fetchWithAuth } from "../api.js";
import { showNotification } from "./notification-system.js";
import { updateDataCounts } from "./stat-utils.js";

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
        const user = await fetchWithAuth("/api/auth/me");
        if (user && user.naam) {
            const welcomeTitle = document.getElementById("studentWelcomeTitle");
            if (welcomeTitle) {
                welcomeTitle.textContent = `Welkom terug, ${user.voornaam}! 🎓`;
            }
        }
        updateDataCounts();
    } catch (error) {
        console.error("Fout bij het laden van gebruikersinfo:", error);
        showNotification("Kon gebruikersinformatie niet laden.", "error");
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
        const reservations = await fetchWithAuth("/api/reservaties/my");
        
        const upcomingReservations = reservations.filter(res => 
            new Date(res.datum) >= new Date() && 
            (res.status === 'bevestigd' || res.status === 'aangevraagd')
        );

        const count = reservations.length;
        countBadge.textContent = count;
        sectionCount.textContent = count;
        sectionCount.dataset.count = count;

        if (count === 0) {
            container.innerHTML = `<div class="no-data">Geen aankomende gesprekken gevonden.</div>`;
            return;
        }
        
        container.innerHTML = upcomingReservations.slice(0, 4).map(reservation => {
            const startTime = new Date(reservation.startTijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(reservation.eindTijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="preview-card">
                    <h3 class="card-title">${reservation.bedrijfNaam}</h3>
                    <div class="card-description">
                        <p><strong>Tijd:</strong> ${startTime} - ${endTime}</p>
                        <p><strong>Status:</strong> <span class="status-${reservation.status.toLowerCase()}">${reservation.status}</span></p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Fout bij het laden van aankomende gesprekken:", error);
        container.innerHTML = `<div class="no-data" style="color: #dc3545;">Kon gesprekken niet laden.</div>`;
    }
} 