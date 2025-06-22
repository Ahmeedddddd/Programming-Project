// src/JS/UTILS/homepage-bedrijf.js

import { fetchWithAuth } from '../api.js';
import { ReservatieService } from '../reservatieService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Wacht een kort moment tot de universele initializer (index.js) de basisdata heeft geladen.
    setTimeout(initializeBedrijfHomepage, 500);
});

/**
 * Initialiseert de bedrijf-specifieke functionaliteiten op de homepage.
 */
async function initializeBedrijfHomepage() {
    console.log("🏢 Initializing bedrijf-specific homepage functions...");
    await loadBedrijfInfo();
    await loadUpcomingMeetings();
    await loadPendingAppointmentsCount();
    
    // Wacht tot index.js de data heeft geladen en toon deze dan
    await waitForIndexJSData();
    await displayIndexJSData();
}

/**
 * Wacht tot index.js de data heeft geladen
 */
async function waitForIndexJSData() {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconden max
    
    while (attempts < maxAttempts) {
        const studentContainer = document.getElementById('studentCardsContainer');
        const projectContainer = document.getElementById('projectCardsContainer');
        
        if (studentContainer && projectContainer && 
            studentContainer.innerHTML !== '' && 
            !studentContainer.innerHTML.includes('🔄 Studenten laden') &&
            projectContainer.innerHTML !== '' && 
            !projectContainer.innerHTML.includes('🔄 Projecten laden')) {
            console.log("✅ Index.js data loaded successfully");
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }
    
    console.warn("⚠️ Index.js data loading timeout");
}

/**
 * Render de interessante studenten in de juiste grid met universele kaartstructuur
 */
async function renderInteressanteStudenten(students) {
    const studentenGrid = document.getElementById('studentenGrid');
    if (!studentenGrid) return;
    if (!students || students.length === 0) {
        studentenGrid.innerHTML = '<div class="no-data"><p>Geen interessante studenten gevonden.</p></div>';
        return;
    }
    // Gebruik de universele renderStudentCard uit index.js
    function getProjectGenre(projectTitel) {
        if (!projectTitel) return { className: 'no-project', label: 'Geen project' };
        const lower = projectTitel.toLowerCase();
        if (lower.includes('ai') || lower.includes('artificial intelligence')) return { className: 'genre-ai', label: 'AI' };
        if (lower.includes('biotech') || lower.includes('biotechnologie')) return { className: 'genre-biotech', label: 'Biotech' };
        if (lower.includes('duurzaam') || lower.includes('sustainab')) return { className: 'genre-duurzaam', label: 'Duurzame energie' };
        if (lower.includes('multimedia')) return { className: 'genre-multimedia', label: 'Multimedia' };
        if (lower.includes('security') || lower.includes('beveilig')) return { className: 'genre-security', label: 'Security' };
        if (lower.includes('iot')) return { className: 'genre-iot', label: 'IoT' };
        if (lower.includes('data') || lower.includes('big data')) return { className: 'genre-data', label: 'Data' };
        if (lower.includes('cloud')) return { className: 'genre-cloud', label: 'Cloud' };
        if (lower.includes('robot')) return { className: 'genre-robot', label: 'Robotica' };
        return { className: 'genre-default', label: 'Project' };
    }
    function renderStudentCard(student) {
        const genre = getProjectGenre(student.projectTitel);
        const hasProject = !!student.projectTitel;
        return `
            <a href="/zoekbalk-studenten?id=${student.studentnummer}" class="preview-card" style="text-decoration: none; color: inherit; display: block;">
                <div class="card-header">
                    <h3 class="card-title">${student.voornaam} ${student.achternaam}</h3>
                </div>
                <p class="card-description">${student.overMezelf || 'Geen beschrijving.'}</p>
                 <div class="student-details">
                    <div class="student-specialization"><span><i class="fas fa-graduation-cap"></i> ${student.opleiding || ''} ${student.opleidingsrichting || ''}</span></div>
                    <div class="student-year"><span><i class="fas fa-calendar-alt"></i> Jaar ${student.leerjaar || 'N/A'}</span></div>
                    <div class="student-location"><span><i class="fas fa-map-marker-alt"></i> ${student.gemeente || 'Onbekend'}</span></div>
                </div>
                <div class="student-project">
                  ${hasProject
                    ? `<span class="student-project-badge ${genre.className}"><i class="fas fa-lightbulb"></i> ${student.projectTitel}</span>`
                    : `<span class="student-project-badge no-project"><i class="fas fa-lightbulb"></i> Geen project</span>`}
                </div>
            </a>`;
    }
    // Render maximaal 4 studenten (zoals op de homepage)
    const toShow = students.slice(0, 4);
    studentenGrid.innerHTML = toShow.map(renderStudentCard).join('');
}

/**
 * Toont de data van index.js in de juiste containers
 */
async function displayIndexJSData() {
    // Toon studenten data
    const studentContainer = document.getElementById('studentCardsContainer');
    const studentenGrid = document.getElementById('studentenGrid');
    if (studentContainer && studentenGrid) {
        // Parseer studenten uit de container als JSON indien mogelijk, anders fallback op bestaande kaarten
        let students = [];
        try {
            // Probeer data uit een data-attribuut of window variabele te halen als beschikbaar
            if (window.universalInitializer && window.universalInitializer.dataFetcher) {
                students = window.universalInitializer.dataFetcher.getData('studenten') || [];
            }
        } catch (e) { /* fallback */ }
        if (!students || students.length === 0) {
            // Fallback: probeer uit bestaande kaarten te reconstrueren
            students = [];
        }
        await renderInteressanteStudenten(students);
        studentContainer.style.display = 'none';
    }
    
    // Toon projecten data
    const projectContainer = document.getElementById('projectCardsContainer');
    const projectsGrid = document.getElementById('projects-grid');
    if (projectContainer && projectsGrid) {
        projectsGrid.innerHTML = projectContainer.innerHTML;
        projectContainer.style.display = 'none';
    }
    
    // Update data counts
    await updateDataCounts();
}

/**
 * Update de data counts op de pagina
 */
async function updateDataCounts() {
    try {
        // Haal de data op van de containers
        const studentContainer = document.getElementById('studentCardsContainer');
        const projectContainer = document.getElementById('projectCardsContainer');
        
        // Tel studenten
        const studentCards = studentContainer ? studentContainer.querySelectorAll('.preview-card') : [];
        const studentCount = studentCards.length;
        
        // Tel projecten
        const projectCards = projectContainer ? projectContainer.querySelectorAll('.project-card') : [];
        const projectCount = projectCards.length;
        
        // Update de count elements
        const studentCountElement = document.getElementById('total-students-count');
        const projectCountElement = document.getElementById('total-projects-count');
        
        if (studentCountElement) studentCountElement.textContent = studentCount;
        if (projectCountElement) projectCountElement.textContent = projectCount;
        
        console.log(`📊 Updated counts - Students: ${studentCount}, Projects: ${projectCount}`);
    } catch (error) {
        console.error('Error updating data counts:', error);
    }
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
                    welcomeTitle.textContent = `Welkom terug, ${result.data.naam}! 🏢`;
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
        const countElement = document.getElementById('pending-requests-count');
        if (!countElement) return;

        const meetings = await ReservatieService.getCompanyReservations();
        const pendingCount = meetings.filter(m => m.status === 'aangevraagd').length;
        countElement.textContent = pendingCount;
    } catch (error) {
        console.error('Error loading pending appointments count:', error);
        const countElement = document.getElementById('pending-requests-count');
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

// ===== STARTUP =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBedrijfHomepage);
} else {
    initializeBedrijfHomepage();
}

console.log('✅ Bedrijf homepage script loaded!');

// ===== STARTUP =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBedrijfHomepage);
} else {
    initializeBedrijfHomepage();
}

console.log('✅ Bedrijf homepage script loaded!'); 