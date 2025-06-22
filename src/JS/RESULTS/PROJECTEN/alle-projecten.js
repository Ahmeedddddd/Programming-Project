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
                    titel: student.projectTitel,
                    beschrijving: student.projectBeschrijving || student.beschrijving || 'Geen beschrijving beschikbaar',
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
    
    // Groepeer projecten per titel
    const grouped = {};
    projects.forEach(project => {
        const key = (project.titel || '').trim().toLowerCase();
        if (!key) return;
        
        if (!grouped[key]) {
            grouped[key] = {
                ...project,
                studenten: []
            };
        }
        
        // Voeg student toe
        if (project.voornaam && project.achternaam) {
            const studentName = `${project.voornaam} ${project.achternaam}`;
            if (!grouped[key].studenten.find(s => s.naam === studentName)) {
                grouped[key].studenten.push({
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
    
    uniqueProjects.forEach((project, index) => {
        container.appendChild(createProjectCard(project, index));
    });
    
    // Update counts
    updateProjectCount(uniqueProjects.length);
}

function createProjectCard(project, index) {
    const card = document.createElement('a');
    card.className = 'projectTegel';
    card.href = `/zoekbalk-projecten?id=${project.id}`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    const titel = project.titel || 'Onbekend Project';
    const beschrijving = project.beschrijving || 'Geen beschrijving beschikbaar';
    
    // Student info
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
    }
    
    card.innerHTML = `
        <div class="projectTegel-content">
            <h3 class="project-titel">${titel}</h3>
            <p class="project-beschrijving">${beschrijving.length > 200 ? beschrijving.substring(0, 200) + '...' : beschrijving}</p>
            
            ${studentInfo}
        </div>
    `;
    
    card.addEventListener("click", (e) => {
        e.preventDefault();
        openProjectDetail(project.id);
    });
    
    return card;
}

function updateProjectCount(count) {
    console.log(`📊 [alle-projecten.js] Updating count: ${count}`);
    
    // Update via stat-utils if available
    if (window.updateDataCounts) {
        window.updateDataCounts({ projecten: count });
        console.log('✅ [alle-projecten.js] Updated via stat-utils');
    }
}

function openProjectDetail(projectId) {
    console.log(`🔗 [alle-projecten.js] Opening project: ${projectId}`);
    window.location.href = `/zoekbalk-projecten?id=${projectId}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', loadAllProjects);
if (document.readyState !== 'loading') {
    loadAllProjects();
}

console.log('✅ [alle-projecten.js] Minimal version loaded!');