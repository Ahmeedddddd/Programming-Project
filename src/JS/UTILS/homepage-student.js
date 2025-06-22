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
            const namePlaceholder = document.getElementById('student-name-placeholder');
            if (namePlaceholder && result.data.voornaam) {
                namePlaceholder.textContent = result.data.voornaam;
            }
        } else {
            console.warn('User info not found in response:', result.message);
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

/**
 * Haalt de aankomende gesprekken voor de student op en toont ze.
 */
async function loadUpcomingMeetings() {
    const container = document.getElementById('meetingsCardsContainer');
    const countElement = document.querySelector('[data-count="gesprekken"]');

    if (!container) {
        console.error('Meeting container (#meetingsCardsContainer) not found!');
        return;
    }

    container.innerHTML = `<div class="loading-cards"><p>🔄 Gesprekken laden...</p></div>`;

    try {
        const response = await fetchWithAuth('/api/reservaties/my');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success && result.data) {
            const allMeetings = result.data;
            const validMeetings = allMeetings.filter(
                (m) => m.status === 'aangevraagd' || m.status === 'bevestigd'
            );

            const requestedMeetings = allMeetings.filter(
                (m) => m.status === 'aangevraagd'
            );

            console.log('Valid meetings:', validMeetings);

            if (countElement) {
                countElement.textContent = validMeetings.length;
            }

            if (validMeetings.length === 0) {
                container.innerHTML = `<div class="no-data"><p>Je hebt nog geen aankomende gesprekken.</p></div>`;
                return;
            }

            container.innerHTML = validMeetings.slice(0, 4).map(renderMeetingCard).join('');

            const dashboardBadge = document.getElementById('upcoming-appointments-count');
            if (dashboardBadge) {
                dashboardBadge.textContent = requestedMeetings.length;
            }

        } else {
            throw new Error(result.message || 'Kon gesprekken niet ophalen.');
        }
    } catch (error) {
        console.error('Failed to load upcoming meetings for student:', error);
        container.innerHTML = `<div class="no-data" style="color: #dc3545;">Kon je gesprekken niet laden. Probeer het later opnieuw.</div>`;
        if (countElement) {
            countElement.textContent = '0';
        }
    }
}

/**
 * Renders a single, well-formatted meeting card.
 * @param {object} meeting - The meeting data object.
 * @returns {string} HTML string for the meeting card.
 */
function renderMeetingCard(meeting) {
    const { bedrijfNaam, startTijd, eindTijd, status, bedrijfTafelNr } = meeting;
    const eventDate = '13/03/2025'; // This seems to be a fixed date for the event

    // Correctly formats an ISO date-time string (e.g., "2025-06-25T16:30:00.000Z")
    // into a user-friendly time format (e.g., "16:30").
    const formatTime = (timeString) => {
        if (!timeString || typeof timeString !== 'string') {
            return 'N/A';
        }
        try {
            const date = new Date(timeString);
            // Use toLocaleTimeString for robust time formatting, respecting locale (24h format for nl-BE)
            return date.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error(`Failed to format time: ${timeString}`, error);
            return 'Error'; // Return an error indicator if parsing fails
        }
    };

    const formattedStart = formatTime(startTijd);
    const formattedEnd = formatTime(eindTijd);

    // Generate a status badge with appropriate class
    const statusBadge = `<span class="status-badge status-${status.toLowerCase()}">${status}</span>`;

    return `
        <div class="preview-card">
            <div class="card-header">
                <h3 class="card-title">${bedrijfNaam || 'Onbekend Bedrijf'}</h3>
                ${bedrijfTafelNr ? `<span class="table-number">Tafel ${bedrijfTafelNr}</span>` : ''}
            </div>
            <div class="card-details">
                <p><i class="fas fa-calendar-alt"></i> <strong>Datum:</strong> ${eventDate}</p>
                <p><i class="fas fa-clock"></i> <strong>Tijd:</strong> ${formattedStart} - ${formattedEnd}</p>
                <p><i class="fas fa-info-circle"></i> <strong>Status:</strong> ${statusBadge}</p>
            </div>
        </div>
    `;
}
