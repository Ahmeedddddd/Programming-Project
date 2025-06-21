// src/JS/UTILS/homepage-student.js

import { fetchWithAuth } from '../api.js';
import { ReservatieService } from '../reservatieService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Wacht een kort moment tot de universele initializer (index.js) de basisdata heeft geladen.
    // Dit zorgt ervoor dat services zoals ReservatieService beschikbaar zijn.
    // Een robuuster systeem zou via custom events werken, maar dit is een eenvoudige oplossing.
    setTimeout(initializeStudentHomepage, 200); 
});

/**
 * Initialiseert de student-specifieke functionaliteiten op de homepage.
 */
async function initializeStudentHomepage() {
    console.log(" Initializing student-specific homepage functions...");
    await loadUserInfo();
    await loadUpcomingMeetings();
    // De algemene kaarten (bedrijven, projecten) worden al door index.js geladen.
}

/**
 * Haalt de gebruikersinformatie op en toont een welkomstbericht.
 */
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
                welcomeTitle.textContent = `Welkom terug, ${result.data.voornaam}! `;
            }
        } else {
            console.warn('User info not found in response:', result.message);
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

/**
 * Haalt de aankomende gesprekken voor de student op en toont ze in de daarvoor bestemde grid.
 */
async function loadUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings-grid');
    const countBadge = document.getElementById('upcoming-appointments-count');
    const sectionCount = document.getElementById('upcoming-meetings-count');

    if (!container) {
        console.warn('Container for upcoming meetings (#upcoming-meetings-grid) not found. Skipping meetings load.');
        return;
    }

    try {
        const meetings = await ReservatieService.getMyReservations();
        const upcomingMeetings = meetings.filter(m => ['bevestigd', 'aangevraagd'].includes(m.status))
                                         .sort((a, b) => new Date(a.startTijd) - new Date(b.startTijd));

        const count = upcomingMeetings.length;
        if (countBadge) countBadge.textContent = count;
        if (sectionCount) sectionCount.textContent = count;
        
        if (count === 0) {
            container.innerHTML = `<div class="no-data"><p>Geen aankomende gesprekken gevonden. Ga op zoek naar een interessant bedrijf!</p></div>`;
            return;
        }
        
        container.innerHTML = upcomingMeetings.slice(0, 4).map(meeting => {
             const startTime = new Date(meeting.startTijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(meeting.eindTijd).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
            const date = new Date(meeting.startTijd).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' });

            return `
                <div class="preview-card">
                    <div class="card-header">
                        <h3 class="card-title">${meeting.bedrijfNaam}</h3>
                        <span class="status-badge status-${meeting.status.toLowerCase()}">${meeting.status}</span>
                    </div>
                    <div class="card-description">
                        <p><strong>Datum:</strong> ${date}</p>
                        <p><strong>Tijd:</strong> ${startTime} - ${endTime}</p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load upcoming meetings for student:', error);
        container.innerHTML = `<div class="no-data error"><p>Kon gesprekken niet laden. Probeer het later opnieuw.</p></div>`;
    }
}
