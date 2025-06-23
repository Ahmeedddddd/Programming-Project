/**
 * 🚀 alle-projecten.js - Projecten Overzicht Pagina voor CareerLaunch EHB
 * 
 * Dit bestand beheert de overzichtspagina voor alle studentenprojecten:
 * - Dynamisch laden van projectgegevens uit de API
 * - Rendering van projectkaarten met studentinformatie
 * - Groepering van projecten per titel
 * - Navigatie naar project detailpagina's
 * - Zoek- en filterfunctionaliteit
 * 
 * Belangrijke functionaliteiten:
 * - API integratie voor projectgegevens
 * - Project groepering en duplicaat detectie
 * - Student-project koppeling
 * - Statistieken en tellingen
 * - Error handling met fallback data
 * - Responsive design ondersteuning
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

/**
 * 🚀 ALLE PROJECTEN - MINIMAL FIX
 * 
 * Focus:
 * ✅ Project loading van API
 * ✅ Groeperen projecten per titel
 * ✅ Tonen meerdere studenten per project
 * ✅ Data-count update via stat-utils
 * ✅ Simpel en effectief
 */

/**
 * 📡 Laadt alle projecten via API
 * 
 * Haalt projectgegevens op van de backend met fallback naar student-gebaseerde extractie
 * 
 * @returns {Promise<void>}
 */
async function loadAllProjects() {
    try {
        // Use the new endpoint that returns projects with student IDs
        const response = await fetch('/api/projecten/with-ids');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            renderProjects(result.data);
            updateProjectCount(result.data.length);
        } else {
            // Fallback to old method if new endpoint fails
            await loadProjectsFromStudents();
        }
        
    } catch (error) {
        // Fallback to old method
        await loadProjectsFromStudents();
    }
}

/**
 * 🔄 Laadt projecten uit studentgegevens
 * 
 * Fallback methode die projecten extraheert uit studentgegevens
 * wanneer de projecten API niet beschikbaar is
 * 
 * @returns {Promise<void>}
 */
async function loadProjectsFromStudents() {
    try {
        const response = await fetch('/api/studenten');
        const data = await response.json();
        
        let students = [];
        if (data.success && Array.isArray(data.data)) {
            students = data.data;
        } else if (Array.isArray(data)) {
            students = data;
        }
        
        if (students.length > 0) {
            // Extract projects from students
            const projectsFromStudents = students
                .filter(student => student.projectTitel && student.projectTitel.trim() !== '')
                .map(student => ({
                    id: student.studentnummer || student.id,
                    projectTitel: student.projectTitel,
                    projectBeschrijving: student.projectBeschrijving || student.beschrijving || 'Geen beschrijving beschikbaar',
                    voornaam: student.voornaam,
                    achternaam: student.achternaam,
                    opleiding: student.opleiding,
                    tafelNr: student.tafelNr
                }));
            
            if (projectsFromStudents.length > 0) {
                renderProjects(projectsFromStudents);
            } else {
                document.querySelector('.projectTegels').innerHTML = `<div class="no-data">Geen projecten gevonden.</div>`;
            }
        }
    } catch (error) {
        document.querySelector('.projectTegels').innerHTML = `<div class="no-data" style="color: #dc3545;">Fout bij laden van gegevens.</div>`;
    }
}

/**
 * 🎨 Rendert projecten in de UI
 * 
 * Toont alle projecten als klikbare kaarten met projectinformatie
 * 
 * @param {Array} projects - Array van project objecten om te renderen
 * @returns {void}
 */
function renderProjects(projects) {
    const container = document.querySelector('.projectTegels');
    if (!container) {
        return;
    }
    
    if (projects.length === 0) {
        container.innerHTML = '<div class="no-data">Geen projecten gevonden</div>';
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Render each project
    projects.forEach((project, index) => {
        const card = createProjectCard(project, index);
        container.appendChild(card);
    });
}

/**
 * 🎴 Creëert een individuele projectkaart
 * 
 * Genereert een klikbare kaart met projectinformatie
 * die navigeert naar de detailpagina
 * 
 * @param {Object} project - Project object met gegevens
 * @param {number} index - Index voor animatie delay
 * @returns {HTMLElement} Project kaart element
 */
function createProjectCard(project, index) {
    const card = document.createElement('a');
    card.className = 'projectTegel';
    
    // Get the first student's ID for navigation
    const firstStudent = project.studenten && project.studenten.length > 0 ? project.studenten[0] : null;
    const navigationId = firstStudent ? firstStudent.id : null;
    const projectTitle = project.titel || 'Onbekend Project';
    
    if (navigationId) {
        // If we have a valid student ID, navigate to the project detail page
        card.href = `/zoekbalk-projecten?id=${navigationId}`;
    } else {
        // If no student ID available, navigate to search page with project title
        const searchQuery = encodeURIComponent(projectTitle);
        card.href = `/alle-projecten?search=${searchQuery}`;
    }
    
    // Create student display
    let studentDisplay = '';
    if (project.studenten && project.studenten.length > 0) {
        if (project.studenten.length === 1) {
            studentDisplay = `<div class="project-student-single">
                <span>👤 ${project.studenten[0].naam}</span>
            </div>`;
        } else {
            const studentNames = project.studenten.map(s => s.naam).join(', ');
            studentDisplay = `<div class="project-students-multiple">
                <strong>👥 Studenten:</strong>
                <div class="student-names">${studentNames}</div>
            </div>`;
        }
    }
    
    // Create technology display
    let techDisplay = '';
    if (project.technologieen) {
        techDisplay = `<div class="project-tech">
            <strong>🛠️ Technologieën:</strong> ${project.technologieen}
        </div>`;
    }
    
    card.innerHTML = `
        <div class="projectTitel">${projectTitle}</div>
        <div class="projectBeschrijving">${project.beschrijving || 'Geen beschrijving beschikbaar'}</div>
        ${studentDisplay}
        ${techDisplay}
    `;
    
    return card;
}

/**
 * 📊 Werkt project telling bij
 * 
 * Update de statistieken met het aantal projecten
 * 
 * @param {number} count - Het aantal projecten
 * @returns {void}
 */
function updateProjectCount(count) {
    if (window.updateDataCounts) {
        window.updateDataCounts({ projecten: count });
    }
}

/**
 * 🔗 Opent project detailpagina
 * 
 * Navigeert naar de detailpagina van een specifiek project
 * 
 * @param {string} projectId - Het project ID om te openen
 * @returns {void}
 */
function openProjectDetail(projectId) {
    if (!projectId) {
        return;
    }
    window.location.href = `/zoekbalk-projecten?id=${projectId}`;
}

/**
 * 🚀 Initialiseert de projecten pagina
 * 
 * Deze functie is het hoofdpunt voor het opzetten van de projecten functionaliteit:
 * - Laadt alle projecten
 * - Handelt zoekparameters af
 * - Zet event listeners op
 * 
 * @returns {Promise<void>}
 */
async function initializeProjectsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    
    await loadAllProjects();
    
    if (searchTerm) {
        filterProjectsBySearch(searchTerm);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProjectsPage);

/**
 * 🔍 Filtert projecten op zoekterm
 * 
 * Filtert de weergegeven projecten op basis van een zoekterm
 * 
 * @param {string} searchTerm - De zoekterm om op te filteren
 * @returns {void}
 */
function filterProjectsBySearch(searchTerm) {
    const projectCards = document.querySelectorAll('.projectTegel');
    const searchLower = searchTerm.toLowerCase();
    
    projectCards.forEach(card => {
        const title = card.querySelector('.projectTitel')?.textContent || '';
        const description = card.querySelector('.projectBeschrijving')?.textContent || '';
        const studentInfo = card.querySelector('.project-student-single, .project-students-multiple')?.textContent || '';
        
        const searchableText = `${title} ${description} ${studentInfo}`.toLowerCase();
        
        if (searchableText.includes(searchLower)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update count for visible projects
    const visibleProjects = document.querySelectorAll('.projectTegel[style*="display: block"], .projectTegel:not([style*="display: none"])');
    updateProjectCount(visibleProjects.length);
}

/**
 * 📋 Projecten Management Systeem
 * 
 * Dit bestand bevat alle functionaliteit voor het beheren en weergeven van projecten:
 * - Laden van projecten via API met fallback naar student-gebaseerde extractie
 * - Renderen van projecten als klikbare kaarten
 * - Zoeken en filteren van projecten
 * - Navigatie naar project detailpagina's
 * - Statistieken bijwerken
 * 
 * Het systeem is robuust met uitgebreide error handling en fallback mechanismen
 * voor wanneer de API niet beschikbaar is.
 */