// src/JS/UTILS/homepage-bedrijf.js

document.addEventListener('DOMContentLoaded', () => {
    // Wacht een kort moment tot de universele initializer (index.js) de basisdata heeft geladen.
    // Dit zorgt ervoor dat services zoals ReservatieService beschikbaar zijn.
    setTimeout(initializeBedrijfHomepage, 200);
});

/**
 * Initialiseert de bedrijf-specifieke functionaliteiten op de homepage.
 */
async function initializeBedrijfHomepage() {
    console.log(" Initializing bedrijf-specific homepage functions...");
    await waitForIndexJSData();
    await loadBedrijfInfo();
    await loadPendingAppointmentsCount();
    await loadUpcomingMeetings();
    // De algemene kaarten (studenten, projecten) worden al door index.js geladen.
}

/**
 * Wacht tot index.js de basisdata heeft geladen en toont deze dan.
 */
async function waitForIndexJSData() {
    // Wacht tot de globale variabelen beschikbaar zijn
    let attempts = 0;
    const maxAttempts = 50; // 5 seconden (50 * 100ms)
    
    while (attempts < maxAttempts) {
        if (window.allStudents && window.allCompanies && window.allProjects) {
            console.log('✅ Index.js data gevonden, rendering interessante studenten...');
            await renderInteressanteStudenten(window.allStudents);
            await displayIndexJSData();
            await updateDataCounts();
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    console.warn('⚠️ Index.js data niet gevonden na 5 seconden, doorgaan zonder...');
}

/**
 * Toont interessante studenten op de bedrijfshomepage.
 */
async function renderInteressanteStudenten(students) {
    const container = document.getElementById('interessanteStudentenContainer');
    if (!container) {
        console.warn('Interessante studenten container niet gevonden');
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
 * Toont de data van index.js op de bedrijfshomepage.
 */
async function displayIndexJSData() {
    const data = {
        studenten: window.allStudents || [],
        bedrijven: window.allCompanies || [],
        projecten: window.allProjects || []
    };

    console.log('📊 Displaying index.js data:', {
        studenten: data.studenten.length,
        bedrijven: data.bedrijven.length,
        projecten: data.projecten.length
    });

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
 * Update data counts using the global updateDataCounts function if available.
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
 * Haalt bedrijfsinformatie op en toont deze.
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
        console.error('Error loading bedrijf info:', error);
    }
}

/**
 * Haalt het aantal wachtende afspraken op en toont deze.
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
        console.error('Error loading pending appointments count:', error);
    }
}

/**
 * Haalt de aankomende gesprekken voor het bedrijf op en toont ze.
 */
async function loadUpcomingMeetings() {
    const container = document.getElementById('upcoming-meetings-grid');
    const countElement = document.querySelector('[data-count="upcoming-meetings"]');

    if (!container) {
        console.error('Meeting container (#upcoming-meetings-grid) not found!');
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

            console.log('Valid meetings:', validMeetings);

            if (countElement) {
                countElement.textContent = validMeetings.length;
            }

            if (validMeetings.length === 0) {
                container.innerHTML = `<div class="no-data"><p>Je hebt nog geen aankomende gesprekken.</p></div>`;
                return;
            }

            container.innerHTML = validMeetings.slice(0, 4).map(renderMeetingCard).join('');

            const dashboardBadge = document.getElementById('pending-requests-count');
            if (dashboardBadge) {
                dashboardBadge.textContent = requestedMeetings.length;
            }

        } else {
            throw new Error(result.message || 'Kon gesprekken niet ophalen.');
        }
    } catch (error) {
        console.error('Failed to load upcoming meetings for bedrijf:', error);
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
    const { studentNaam, startTijd, eindTijd, status, studentTafelNr } = meeting;
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
                <h3 class="card-title">${studentNaam || 'Onbekende Student'}</h3>
                ${studentTafelNr ? `<span class="table-number">Tafel ${studentTafelNr}</span>` : ''}
            </div>
            <div class="card-details">
                <p><i class="fas fa-calendar-alt"></i> <strong>Datum:</strong> ${eventDate}</p>
                <p><i class="fas fa-clock"></i> <strong>Tijd:</strong> ${formattedStart} - ${formattedEnd}</p>
                <p><i class="fas fa-info-circle"></i> <strong>Status:</strong> ${statusBadge}</p>
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

console.log('✅ Bedrijf homepage script loaded!'); 