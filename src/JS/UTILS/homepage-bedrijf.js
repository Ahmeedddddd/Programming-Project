// src/JS/UTILS/homepage-bedrijf.js

import { fetchWithAuth } from '../api.js';
import { ReservatieService } from '../reservatieService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Wacht een kort moment tot de universele initializer (index.js) de basisdata heeft geladen.
    setTimeout(initializeBedrijfHomepage, 200);
});

/**
 * Initialiseert de bedrijf-specifieke functionaliteiten op de homepage.
 */
async function initializeBedrijfHomepage() {
    console.log(" Initializing bedrijf-specific homepage functions...");
    await loadBedrijfInfo();
    await loadUpcomingMeetings();
    await loadPendingAppointmentsCount();
    // De algemene kaarten (studenten, projecten) worden al door index.js geladen.
}

/**
 * Haalt de bedrijfsinformatie op en toont een welkomstbericht.
 */
async function loadBedrijfInfo() {
    try {
        const response = await fetchWithAuth('/api/user-info');
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const welcomeTitle = document.getElementById('bedrijfWelcomeTitle');
                if (welcomeTitle && result.data.naam) {
                    welcomeTitle.textContent = `Welkom terug, ${result.data.naam}! `;
                }
            }
        }
    } catch (error) {
        console.error('Error loading bedrijf info:', error);
    }
}

/**
 * Haalt het aantal wachtende afspraakverzoeken op.
 */
async function loadPendingAppointmentsCount() {
    try {
        const countElement = document.getElementById('pending-appointments-count');
        if (!countElement) return;

        const meetings = await ReservatieService.getCompanyReservations();
        const pendingCount = meetings.filter(m => m.status === 'aangevraagd').length;
        countElement.textContent = pendingCount;
    } catch (error) {
        console.error('Error loading pending appointments count:', error);
        const countElement = document.getElementById('pending-appointments-count');
        if(countElement) countElement.textContent = 'Error';
    }
}

/**
 * Haalt de aankomende gesprekken voor het bedrijf op.
 */
async function loadUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings-grid');
    const countElement = document.getElementById('upcoming-meetings-count');
    if (!container || !countElement) return;

    try {
        const meetings = await ReservatieService.getCompanyReservations();
        const upcoming = meetings.filter(m => ['bevestigd', 'aangevraagd'].includes(m.status))
                                 .sort((a, b) => new Date(a.startTijd) - new Date(b.startTijd));
        
        countElement.textContent = upcoming.length;

        if (upcoming.length > 0) {
            container.innerHTML = upcoming.slice(0, 4).map(meeting => {
                const startTime = new Date(meeting.startTijd).toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                const endTime = new Date(meeting.eindTijd).toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                const date = new Date(meeting.startTijd).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' });
                
                return `
                    <div class="preview-card">
                        <div class="card-header">
                            <h3 class="card-title">${meeting.studentNaam || 'Onbekende student'}</h3>
                             <span class="status-badge status-${meeting.status.toLowerCase()}">${meeting.status}</span>
                        </div>
                        <div class="card-description">
                            <p><strong>Datum:</strong> ${date}</p>
                            <p><strong>Tijd:</strong> ${startTime} - ${endTime}</p>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `<div class="no-data"><p>Er zijn momenteel geen aankomende gesprekken.</p></div>`;
        }
    } catch (error) {
        console.error('Error loading upcoming meetings for bedrijf:', error);
        container.innerHTML = `<div class="no-data error"><p>Kan gesprekken niet laden.</p></div>`;
    }
} 
