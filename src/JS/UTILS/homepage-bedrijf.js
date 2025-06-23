/**
 * 🏢 homepage-bedrijf.js - Bedrijf Homepage Functionaliteit voor CareerLaunch EHB
 * 
 * Dit bestand beheert de bedrijf-specifieke functionaliteiten op de homepage:
 * - Laden en tonen van bedrijfsinformatie
 * - Weergave van interessante studenten
 * - Aankomende gesprekken en reservaties
 * - Statistieken en tellingen
 * - Integratie met universele homepage initializer
 * 
 * Belangrijke functionaliteiten:
 * - Bedrijf-specifieke dashboard elementen
 * - Student preview kaarten
 * - Reservatie management interface
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
    setTimeout(initializeBedrijfHomepage, 200);
});

/**
 * 🚀 Initialiseert de bedrijf-specifieke functionaliteiten op de homepage
 * 
 * Deze functie is het hoofdpunt voor het opzetten van bedrijf-specifieke features:
 * - Wacht op universele data van index.js
 * - Laadt bedrijfsinformatie
 * - Toont aankomende gesprekken
 * - Update statistieken
 * 
 * @returns {Promise<void>}
 */
async function initializeBedrijfHomepage() {
    await waitForIndexJSData();
    await loadBedrijfInfo();
    await loadPendingAppointmentsCount();
    await loadUpcomingMeetings();
    // De algemene kaarten (studenten, projecten) worden al door index.js geladen.
}

/**
 * ⏳ Wacht tot index.js de basisdata heeft geladen en toont deze dan
 * 
 * Deze functie wacht tot de universele homepage initializer klaar is
 * en toont dan de bedrijf-specifieke data
 * 
 * @returns {Promise<void>}
 */
async function waitForIndexJSData() {
    // Wacht tot de globale variabelen beschikbaar zijn
    let attempts = 0;
    const maxAttempts = 50; // 5 seconden (50 * 100ms)
    
    while (attempts < maxAttempts) {
        if (window.allStudents && window.allCompanies && window.allProjects) {
            await renderInteressanteStudenten(window.allStudents);
            await displayIndexJSData();
            await updateDataCounts();
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
}

/**
 * 🎨 Toont interessante studenten op de bedrijfshomepage
 * 
 * Rendert een preview van studenten die interessant kunnen zijn
 * voor het bedrijf om contact mee op te nemen
 * 
 * @param {Array} students - Array van student objecten om te tonen
 * @returns {Promise<void>}
 */
async function renderInteressanteStudenten(students) {
    const container = document.getElementById('interessanteStudentenContainer');
    if (!container) {
        return;
    }

    // Toon de eerste 4 studenten als voorbeeld
    const interestingStudents = students.slice(0, 4);
    container.innerHTML = interestingStudents.map(student => `
        <div class="preview-card">
            <div class="card-header">
                <h3 class="card-title">${student.voornaam} ${student.achternaam}</h3>
            </div>
            <p class="card-description">${student.overMezelf || 'Geen beschrijving.'}</p>
            <div class="student-details">
                <div class="student-specialization"><span><i class="fas fa-graduation-cap"></i> ${student.opleiding || ''} ${student.opleidingsrichting || ''}</span></div>
                <div class="student-year"><span><i class="fas fa-calendar-alt"></i> Jaar ${student.leerjaar || 'N/A'}</span></div>
                <div class="student-location"><span><i class="fas fa-map-marker-alt"></i> ${student.gemeente || 'Onbekend'}</span></div>
            </div>
        </div>
    `).join('');
}

/**
 * 📊 Toont de data van index.js op de bedrijfshomepage
 * 
 * Update alle data tellingen en statistieken met de universele data
 * 
 * @returns {Promise<void>}
 */
async function displayIndexJSData() {
    const data = {
        studenten: window.allStudents || [],
        bedrijven: window.allCompanies || [],
        projecten: window.allProjects || []
    };

    // Update data counts
    const dataCountElements = document.querySelectorAll('[data-count]');
    dataCountElements.forEach(el => {
        const type = el.getAttribute('data-count');
        if (data[type]) {
            el.textContent = data[type].length;
        }
    });
}

/**
 * 📊 Update data counts using the global updateDataCounts function if available
 * 
 * Gebruikt de universele updateDataCounts functie om statistieken bij te werken
 * 
 * @returns {Promise<void>}
 */
async function updateDataCounts() {
    if (window.updateDataCounts) {
        const data = {
            studenten: window.allStudents || [],
            bedrijven: window.allCompanies || [],
            projecten: window.allProjects || []
        };
        window.updateDataCounts(data);
    }
}

/**
 * 🏢 Haalt bedrijfsinformatie op en toont deze
 * 
 * Laadt de specifieke informatie van het ingelogde bedrijf
 * en toont deze in de UI
 * 
 * @returns {Promise<void>}
 */
async function loadBedrijfInfo() {
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
            const namePlaceholder = document.getElementById('bedrijf-name-placeholder');
            if (namePlaceholder && result.data.naam) {
                namePlaceholder.textContent = result.data.naam;
            }
        }
    } catch (error) {
        // Silent error handling - bedrijf info is niet kritiek
    }
}

/**
 * 📅 Haalt het aantal wachtende afspraken op en toont deze
 * 
 * Laadt het aantal reservaties met status 'aangevraagd' en
 * toont deze in een badge of counter
 * 
 * @returns {Promise<void>}
 */
async function loadPendingAppointmentsCount() {
    try {
        // Access fetchWithAuth from window when needed
        const { fetchWithAuth } = window;
        if (!fetchWithAuth) {
            throw new Error('fetchWithAuth is not available');
        }
        
        const response = await fetchWithAuth('/api/reservaties/company');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success && result.data) {
            const pendingCount = result.data.filter(r => r.status === 'aangevraagd').length;
            const badge = document.getElementById('pending-appointments-count');
            if (badge) {
                badge.textContent = pendingCount;
            }
        }
    } catch (error) {
        // Silent error handling - pending count is niet kritiek
    }
}

/**
 * 📅 Haalt de aankomende gesprekken voor het bedrijf op en toont ze
 * 
 * Laadt alle reservaties van het bedrijf en toont de aankomende
 * gesprekken in een overzichtelijke grid
 * 
 * @returns {Promise<void>}
 */
async function loadUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings-grid');
    const countElement = document.querySelector('[data-count="upcoming-meetings"]');

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
        
        const response = await fetchWithAuth('/api/reservaties/company');
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
            const confirmedMeetings = allMeetings.filter(
                (m) => m.status === 'bevestigd'
            );

            // Update count
            if (countElement) {
                countElement.textContent = validMeetings.length;
            }

            // Render meetings
            if (validMeetings.length === 0) {
                container.innerHTML = `
                    <div class="no-meetings">
                        <p>Geen aankomende gesprekken</p>
                        <a href="/alle-studenten" class="btn-primary">Studenten bekijken</a>
                    </div>
                `;
            } else {
                container.innerHTML = validMeetings
                    .slice(0, 6) // Toon maximaal 6 gesprekken
                    .map(meeting => renderMeetingCard(meeting))
                    .join('');
            }
        }
    } catch (error) {
        container.innerHTML = `
            <div class="error-state">
                <p>Kon gesprekken niet laden</p>
            </div>
        `;
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
    const formatTime = (timeString) => {
        if (!timeString) return 'TBD';
        return timeString.replace(':', 'h');
    };

    const statusClass = meeting.status === 'bevestigd' ? 'confirmed' : 'pending';
    const statusText = meeting.status === 'bevestigd' ? 'Bevestigd' : 'Aangevraagd';

    return `
        <div class="meeting-card ${statusClass}">
            <div class="meeting-header">
                <h4>${meeting.studentNaam || 'Onbekende student'}</h4>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="meeting-details">
                <p><i class="fas fa-calendar"></i> ${meeting.datum || 'TBD'}</p>
                <p><i class="fas fa-clock"></i> ${formatTime(meeting.tijdslot)}</p>
                <p><i class="fas fa-map-marker-alt"></i> Tafel ${meeting.tafelNr || 'TBD'}</p>
            </div>
            <div class="meeting-actions">
                <a href="/gesprekken-overzicht-bedrijven" class="btn-secondary">Details</a>
            </div>
        </div>
    `;
}

// ===== STARTUP =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBedrijfHomepage);
} else {
    initializeBedrijfHomepage();
}

/**
 * 🏢 Bedrijf Homepage Management Systeem
 * 
 * Dit bestand bevat alle functionaliteit voor de bedrijf homepage:
 * - Initialisatie van de homepage met data loading
 * - Weergave van interessante studenten
 * - Laden van bedrijfsinformatie
 * - Tonen van aankomende gesprekken en wachtende afspraken
 * - Update van statistieken
 * 
 * Het systeem wacht op data van index.js en toont een loading state
 * totdat alle benodigde informatie is geladen.
 */ 