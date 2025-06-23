/**
 * 🎓 homepage-student.js - Student Homepage Functionaliteit voor CareerLaunch EHB
 * 
 * Dit bestand beheert de student-specifieke functionaliteiten op de homepage:
 * - Laden en tonen van studentinformatie
 * - Weergave van aankomende gesprekken
 * - Statistieken en tellingen
 * - Integratie met universele homepage initializer
 * 
 * Belangrijke functionaliteiten:
 * - Student-specifieke dashboard elementen
 * - Gesprek management interface
 * - Real-time data updates
 * - Error handling en loading states
 * - Responsive design ondersteuning
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

document.addEventListener('DOMContentLoaded', () => {
    // Wacht een kort moment tot de universele initializer (index.js) de basisdata heeft geladen.
    // Dit zorgt ervoor dat services zoals ReservatieService beschikbaar zijn.
    // Een robuuster systeem zou via custom events werken, maar dit is een eenvoudige oplossing.
    setTimeout(initializeStudentHomepage, 200); 
});

/**
 * 🚀 Initialiseert de student-specifieke functionaliteiten op de homepage
 * 
 * Deze functie is het hoofdpunt voor het opzetten van student-specifieke features:
 * - Laadt studentinformatie
 * - Toont aankomende gesprekken
 * - Update statistieken
 * 
 * @returns {Promise<void>}
 */
async function initializeStudentHomepage() {
    await loadUserInfo();
    await loadUpcomingMeetings();
    // De algemene kaarten (bedrijven, projecten) worden al door index.js geladen.
}

/**
 * 👤 Haalt de gebruikersinformatie op en toont een welkomstbericht
 * 
 * Laadt de specifieke informatie van de ingelogde student
 * en toont deze in de UI
 * 
 * @returns {Promise<void>}
 */
async function loadUserInfo() {
    try {
        // Access fetchWithAuth from window when needed
        const { fetchWithAuth } = window;
        if (!fetchWithAuth) {
            throw new Error('fetchWithAuth is not available');
        }
        
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
        }
    } catch (error) {
        // Silent error handling - user info is niet kritiek
    }
}

/**
 * 📅 Haalt de aankomende gesprekken voor de student op en toont ze
 * 
 * Laadt alle reservaties van de student en toont de aankomende
 * gesprekken in een overzichtelijke grid
 * 
 * @returns {Promise<void>}
 */
async function loadUpcomingMeetings() {
    const container = document.getElementById('meetingsCardsContainer');
    const countElement = document.querySelector('[data-count="gesprekken"]');

    if (!container) {
        return;
    }

    container.innerHTML = `<div class="loading-cards"><p>🔄 Gesprekken laden...</p></div>`;

    try {
        // Access fetchWithAuth from window when needed
        const { fetchWithAuth } = window;
        if (!fetchWithAuth) {
            throw new Error('fetchWithAuth is not available');
        }
        
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

            if (countElement) {
                countElement.textContent = validMeetings.length;
            }

            if (validMeetings.length === 0) {
                container.innerHTML = `
                    <div class="no-meetings">
                        <p>Je hebt nog geen aankomende gesprekken</p>
                        <a href="/alle-bedrijven" class="btn-primary">Bedrijven bekijken</a>
                    </div>
                `;
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
        container.innerHTML = `
            <div class="error-state">
                <p>Kon je gesprekken niet laden. Probeer het later opnieuw.</p>
            </div>
        `;
        if (countElement) {
            countElement.textContent = '0';
        }
    }
}

/**
 * 🎴 Rendert een individuele meeting kaart
 * 
 * Genereert een kaart met informatie over een specifiek gesprek
 * 
 * @param {Object} meeting - Meeting object met gegevens
 * @returns {string} HTML string voor de meeting kaart
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
