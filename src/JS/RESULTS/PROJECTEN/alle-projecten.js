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
    const container = document.querySelector('.projectTegels');
    if (!container) {
        console.error('❌ [alle-projecten.js] .projectTegels container not found');
        return;
    }
    
    container.innerHTML = `<div class="no-data" id="projectenLoading"><i class="fas fa-spinner fa-spin"></i> Projecten laden...</div>`;
    
    try {
        console.log('📡 [alle-projecten.js] Fetching projects...');
        const response = await fetch('/api/projecten');
        const data = await response.json();
        
        let projects = [];
        if (data.success && Array.isArray(data.data)) {
            projects = data.data;
        } else if (Array.isArray(data)) {
            projects = data;
        }
        
        console.log(`📦 [alle-projecten.js] Found ${projects.length} project entries`);
        
        if (projects.length > 0) {
            renderProjects(projects);
        } else {
            // Fallback: probeer studenten API
            await loadProjectsFromStudents();
        }
    } catch (error) {
        console.error('❌ [alle-projecten.js] Error:', error);
        container.innerHTML = `<div class="no-data" style="color: #dc3545;">Fout bij laden van projecten: ${error.message}</div>`;
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
    console.log('🚀 [alle-projecten.js] Rendering', projects.length, 'raw entries');
    
    const grouped = {};
    projects.forEach(project => {
        const title = (project.titel || project.projectTitel || '').trim();
        if (!title) {
            console.warn('⚠️ Skipping project entry without title:', project);
            return;
        }

        const key = title.toLowerCase();
        
        if (!grouped[key]) {
            grouped[key] = {
                titel: title,
                beschrijving: project.beschrijving || project.projectBeschrijving || 'Geen beschrijving beschikbaar',
                technologieen: project.technologieen,
                studenten: []
            };
        }
        
        if (project.voornaam && project.achternaam) {
            const studentName = `${project.voornaam} ${project.achternaam}`;
            if (!grouped[key].studenten.find(s => s.naam === studentName)) {
                grouped[key].studenten.push({
                    id: project.id || project.studentnummer,
                    naam: studentName,
                    opleiding: project.opleiding,
                    tafelNr: project.tafelNr
                });
            }
        }
    });
    
    const uniqueProjects = Object.values(grouped);
    console.log(`✅ [alle-projecten.js] Grouped into ${uniqueProjects.length} unique projects`);
    
    const container = document.querySelector('.projectTegels');
    container.innerHTML = '';
    
    if (uniqueProjects.length === 0) {
        container.innerHTML = `<div class="no-data">Geen projecten gevonden. Probeer de filters aan te passen.</div>`;
        updateProjectCount(0);
        return;
    }
    
    uniqueProjects.forEach((project, index) => {
        container.appendChild(createProjectCard(project, index));
    });
    
    updateProjectCount(uniqueProjects.length);
}

function createProjectCard(project, index) {
    const card = document.createElement('a');
    card.className = 'projectTegel';
    
    const navigationId = project.studenten && project.studenten.length > 0 ? project.studenten[0].id : null;
    
    if (navigationId) {
        card.href = `/zoekbalk-projecten?id=${navigationId}`;
    } else {
        card.href = '#';
        card.style.cursor = 'not-allowed';
        card.onclick = (e) => {
            e.preventDefault();
            console.warn('Navigation prevented for project with no student ID:', project);
        };
    }
    
    card.style.animationDelay = `${index * 0.1}s`;
    
    const titel = project.titel || 'Onbekend Project';
    const beschrijving = project.beschrijving || 'Geen beschrijving beschikbaar';
    
    let studentInfo = '';
    if (project.studenten && project.studenten.length > 0) {
        if (project.studenten.length === 1) {
            const student = project.studenten[0];
            const tafelInfo = student.tafelNr ? ` - Tafel ${student.tafelNr}` : '';
            studentInfo = `
                <div class="project-student-single">
                    <strong>👨‍🎓 ${student.naam}</strong>
                    ${student.opleiding ? `<br><small>${student.opleiding}${tafelInfo}</small>` : ''}
                </div>
            `;
        } else {
            const studentList = project.studenten.map(s => {
                const tafelInfo = s.tafelNr ? ` (T${s.tafelNr})` : '';
                return s.naam + tafelInfo;
            }).join(', ');
            
            studentInfo = `
                <div class="project-students-multiple">
                    <strong>👥 Team (${project.studenten.length} studenten):</strong><br>
                    <small>${studentList}</small>
                </div>
            `;
        }
    } else {
        studentInfo = `<div class="project-student-single"><small>Geen studenten toegewezen</small></div>`;
    }
    
    card.innerHTML = `
        <div class="projectTegel-content">
            <h3 class="project-titel">${titel}</h3>
            <p class="project-beschrijving">${beschrijving.length > 200 ? beschrijving.substring(0, 200) + '...' : beschrijving}</p>
            ${studentInfo}
        </div>
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

console.log('✅ [alle-projecten.js] Minimal version loaded!');