// alle-projecten.js - MINIMAL VERSION: Focus alleen op project groepering

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

console.log('🚀 [alle-projecten.js] Minimal version loading...');

async function loadAllProjects() {
    try {
        console.log('🚀 [alle-projecten.js] Loading all projects...');
        
        // Use the new endpoint that returns projects with student IDs
        const response = await fetch('/api/projecten/with-ids');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ [alle-projecten.js] Loaded ${result.data.length} projects with student IDs`);
            renderProjects(result.data);
            updateProjectCount(result.data.length);
        } else {
            console.error('❌ [alle-projecten.js] Failed to load projects:', result.message);
            // Fallback to old method if new endpoint fails
            await loadProjectsFromStudents();
        }
        
    } catch (error) {
        console.error('❌ [alle-projecten.js] Error loading projects:', error);
        // Fallback to old method
        await loadProjectsFromStudents();
    }
}

async function loadProjectsFromStudents() {
    console.log('🔄 [alle-projecten.js] Loading from students API...');
    
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
                console.log(`✅ [alle-projecten.js] Extracted ${projectsFromStudents.length} projects from students`);
                renderProjects(projectsFromStudents);
            } else {
                document.querySelector('.projectTegels').innerHTML = `<div class="no-data">Geen projecten gevonden.</div>`;
            }
        }
    } catch (error) {
        console.error('❌ [alle-projecten.js] Error loading students:', error);
        document.querySelector('.projectTegels').innerHTML = `<div class="no-data" style="color: #dc3545;">Fout bij laden van gegevens.</div>`;
    }
}

function renderProjects(projects) {
    console.log('🚀 [alle-projecten.js] Rendering', projects.length, 'projects');
    
    const container = document.querySelector('.projectTegels');
    if (!container) {
        console.error('❌ [alle-projecten.js] .projectTegels container not found');
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
    
    console.log(`✅ [alle-projecten.js] Rendered ${projects.length} project cards`);
}

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
        console.log(`🔗 [alle-projecten.js] Project "${projectTitle}" -> Student ID: ${navigationId}`);
    } else {
        // If no student ID available, navigate to search page with project title
        const searchQuery = encodeURIComponent(projectTitle);
        card.href = `/alle-projecten?search=${searchQuery}`;
        console.log(`🔍 [alle-projecten.js] Project "${projectTitle}" -> Search fallback`);
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

function updateProjectCount(count) {
    console.log(`📊 [alle-projecten.js] Updating count: ${count}`);
    
    if (window.updateDataCounts) {
        window.updateDataCounts({ projecten: count });
        console.log('✅ [alle-projecten.js] Updated via stat-utils');
    }
}

function openProjectDetail(projectId) {
    if (!projectId) {
        console.warn('⚠️ [alle-projecten.js] Kan niet navigeren: geen projectId');
        return;
    }
    console.log(`🔗 [alle-projecten.js] Opening project with student ID: ${projectId}`);
    window.location.href = `/zoekbalk-projecten?id=${projectId}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    
    loadAllProjects().then(() => {
        if (searchTerm) {
            console.log(`🔍 [alle-projecten.js] Search parameter found: ${searchTerm}`);
            filterProjectsBySearch(searchTerm);
        }
    });
});

// Search functionality
function filterProjectsBySearch(searchTerm) {
    console.log(`🔍 [alle-projecten.js] Filtering projects by: ${searchTerm}`);
    
    const cards = document.querySelectorAll('.projectTegel');
    let foundCount = 0;
    
    cards.forEach(card => {
        const title = card.querySelector('.project-titel')?.textContent || '';
        const description = card.querySelector('.project-beschrijving')?.textContent || '';
        const studentInfo = card.querySelector('.project-student-single, .project-students-multiple')?.textContent || '';
        
        const searchText = `${title} ${description} ${studentInfo}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase().trim();
        
        if (searchText.includes(searchLower)) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.6s ease forwards';
            foundCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    console.log(`✅ [alle-projecten.js] Found ${foundCount} matching projects`);
    
    const container = document.querySelector('.projectTegels');
    
    // Verwijder eventuele vorige zoekresultaat-headers/berichten
    const existingHeader = container.querySelector('.search-results-header');
    if (existingHeader) {
        existingHeader.remove();
    }
    const existingNoResults = container.querySelector('.no-data');
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    if (foundCount === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-data';
        noResults.innerHTML = `
            <h3>🔍 Geen projecten gevonden</h3>
            <p>Geen projecten gevonden voor "${searchTerm}"</p>
            <button onclick="window.location.href='/alle-projecten'" class="btn">
                <i class="fas fa-arrow-left"></i> Terug naar alle projecten
            </button>
        `;
        // Toon alle kaarten weer als er geen resultaten zijn na het filteren
        cards.forEach(card => card.style.display = 'none');
        container.appendChild(noResults);
    } else {
        const searchHeader = document.createElement('div');
        searchHeader.className = 'search-results-header';
        searchHeader.innerHTML = `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">
                    <i class="fas fa-search"></i> Zoekresultaten
                </h3>
                <p style="margin: 0; color: #424242;">
                    ${foundCount} project${foundCount === 1 ? '' : 'en'} gevonden voor "${searchTerm}"
                </p>
                <button onclick="window.location.href='/alle-projecten'" style="margin-top: 10px; background: #2196f3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-times"></i> Zoekopdracht wissen
                </button>
            </div>
        `;
        container.insertBefore(searchHeader, container.firstChild);
    }
}

console.log('✅ [alle-projecten.js] Fixed version loaded!');