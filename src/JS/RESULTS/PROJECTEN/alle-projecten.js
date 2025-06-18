// src/JS/RESULTS/PROJECTEN/alle-projecten.js
// ==========================================

// ===== GLOBAL VARIABLES =====
let allProjects = [];
let groupedProjects = [];
let filteredProjects = [];
let currentFilters = {
    search: '',
    opleiding: 'alle',
    type: 'alle' // 'alle', 'individueel', 'groep'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing alle-projecten page...');
    
    try {
        await loadProjects();
        setupEventListeners();
        restoreScrollPosition();
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showError('Er ging iets mis bij het laden van de projecten');
    }
});

// ===== DATA LOADING =====
async function loadProjects() {
    console.log('📊 Loading projects...');
    showLoading(true);
    
    try {
        const response = await fetch('http://localhost:8383/api/projecten', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            allProjects = data.data;
            console.log(`✅ Loaded ${allProjects.length} project entries`);
            
            // FIX: Group projects by projectId to handle multiple students
            groupedProjects = groupProjectsByProjectId(allProjects);
            filteredProjects = [...groupedProjects];
            
            console.log(`✅ Grouped into ${groupedProjects.length} unique projects`);
            
            renderProjects();
        } else {
            throw new Error('Invalid data format received');
        }
        
    } catch (error) {
        console.error('❌ Failed to load projects:', error);
        showError('Kon projecten niet laden. Probeer later opnieuw.');
    } finally {
        showLoading(false);
    }
}

// ===== PROJECT GROUPING FIX =====
function groupProjectsByProjectId(rawProjects) {
    console.log('📊 Grouping projects by ID...');
    
    const grouped = rawProjects.reduce((acc, project) => {
        const projectId = project.projectId || project.id;
        
        if (!acc[projectId]) {
            // First occurrence of this project
            acc[projectId] = {
                projectId: projectId,
                projectTitel: project.projectTitel || project.titel,
                projectBeschrijving: project.projectBeschrijving || project.beschrijving,
                tafelNr: project.tafelNr,
                students: []
            };
        }
        
        // Add student to project
        acc[projectId].students.push({
            studentnummer: project.studentnummer,
            voornaam: project.voornaam || project.studentVoornaam,
            achternaam: project.achternaam || project.studentAchternaam,
            naam: project.studentnaam || `${project.voornaam || ''} ${project.achternaam || ''}`.trim(),
            opleiding: project.opleiding || project.opleidingsrichting,
            email: project.email || project.studentEmail
        });
        
        return acc;
    }, {});
    
    // Convert to array and enhance with computed properties
    const projects = Object.values(grouped).map(project => ({
        ...project,
        studentCount: project.students.length,
        studentNames: project.students.map(s => s.naam).join(', '),
        studentNumbers: project.students.map(s => s.studentnummer).join(','),
        opleidingen: [...new Set(project.students.map(s => s.opleiding).filter(Boolean))].join(' & '),
        isGroupProject: project.students.length > 1
    }));
    
    console.log(`✅ Grouped ${rawProjects.length} entries into ${projects.length} unique projects`);
    return projects;
}

// ===== RENDERING =====
function renderProjects() {
    const container = document.querySelector('.projects-grid, #projectsGrid');
    if (!container) {
        console.error('❌ Projects container not found');
        return;
    }
    
    if (filteredProjects.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Geen projecten gevonden</p>
            </div>
        `;
        return;
    }
    
    const projectsHTML = filteredProjects.map((project, index) => 
        createProjectCard(project, index)
    ).join('');
    
    container.innerHTML = projectsHTML;
    
    // Add click handlers after rendering
    addProjectClickHandlers();
}

function createProjectCard(project, index) {
    const {
        projectId,
        projectTitel,
        projectBeschrijving,
        studentNames,
        studentCount,
        opleidingen,
        tafelNr,
        isGroupProject
    } = project;
    
    const truncatedDescription = projectBeschrijving && projectBeschrijving.length > 150 ? 
        projectBeschrijving.substring(0, 150) + '...' : 
        projectBeschrijving || 'Geen beschrijving beschikbaar.';
    
    return `
        <article class="project-card ${isGroupProject ? 'group-project' : 'individual-project'}" 
                 data-project-id="${projectId}"
                 style="animation-delay: ${index * 0.05}s">
            <div class="project-header">
                <h3 class="project-title">
                    ${isGroupProject ? '<i class="fas fa-users"></i>' : '<i class="fas fa-user"></i>'}
                    ${projectTitel}
                </h3>
                ${tafelNr ? `<span class="table-badge">Tafel ${tafelNr}</span>` : ''}
            </div>
            
            <div class="project-content">
                <p class="project-description">
                    ${truncatedDescription}
                </p>
                
                <div class="project-students">
                    <strong>${studentCount > 1 ? 'Studenten' : 'Student'}:</strong>
                    <span class="student-names">${studentNames}</span>
                </div>
                
                <div class="project-meta">
                    ${opleidingen ? `
                        <span class="opleiding-tag">
                            <i class="fas fa-graduation-cap"></i>
                            ${opleidingen}
                        </span>
                    ` : ''}
                    ${isGroupProject ? 
                      `<span class="group-tag">
                        <i class="fas fa-handshake"></i>
                        Groepsproject (${studentCount})
                      </span>` : 
                      '<span class="individual-tag">Individueel project</span>'}
                </div>
            </div>
            
            <div class="project-footer">
                <button class="view-project-btn" data-project-id="${projectId}">
                    Bekijk Project
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </article>
    `;
}

// ===== NAVIGATION FIX =====
function addProjectClickHandlers() {
    // Add click handlers to project cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.style.cursor = 'pointer';
        
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on a button
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            const projectId = card.dataset.projectId;
            if (projectId) {
                navigateToProject(projectId);
            }
        });
    });
    
    // Also handle button clicks
    document.querySelectorAll('.view-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = btn.dataset.projectId;
            if (projectId) {
                navigateToProject(projectId);
            }
        });
    });
}

// FIX: Navigate to correct project detail page
function navigateToProject(projectId) {
    console.log('🔗 Navigeren naar project:', projectId);
    
    // Save scroll position
    sessionStorage.setItem('alleProjectenScrollPosition', window.pageYOffset.toString());
    
    // Navigate to project detail page
    window.location.href = `/zoekbalk-projecten?id=${projectId}`;
}

// ===== FILTER FUNCTIONALITY =====
function setupEventListeners() {
    // Search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300));
    }
    
    // Type filter (individual/group)
    const typeFilter = document.querySelector('#typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            currentFilters.type = e.target.value;
            applyFilters();
        });
    }
    
    // Opleiding filter
    const opleidingFilter = document.querySelector('#opleidingFilter');
    if (opleidingFilter) {
        opleidingFilter.addEventListener('change', (e) => {
            currentFilters.opleiding = e.target.value;
            applyFilters();
        });
    }
    
    // Sort buttons
    const sortByStudents = document.querySelector('#sortByStudents');
    if (sortByStudents) {
        sortByStudents.addEventListener('click', () => {
            sortProjects('students');
        });
    }
    
    const sortByName = document.querySelector('#sortByName');
    if (sortByName) {
        sortByName.addEventListener('click', () => {
            sortProjects('name');
        });
    }
}

function applyFilters() {
    filteredProjects = groupedProjects.filter(project => {
        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const matchesSearch = 
                project.projectTitel.toLowerCase().includes(searchTerm) ||
                project.projectBeschrijving.toLowerCase().includes(searchTerm) ||
                project.studentNames.toLowerCase().includes(searchTerm) ||
                (project.opleidingen && project.opleidingen.toLowerCase().includes(searchTerm));
            
            if (!matchesSearch) return false;
        }
        
        // Type filter
        if (currentFilters.type !== 'alle') {
            if (currentFilters.type === 'groep' && !project.isGroupProject) return false;
            if (currentFilters.type === 'individueel' && project.isGroupProject) return false;
        }
        
        // Opleiding filter
        if (currentFilters.opleiding !== 'alle') {
            if (!project.opleidingen || !project.opleidingen.includes(currentFilters.opleiding)) {
                return false;
            }
        }
        
        return true;
    });
    
    renderProjects();
    updateResultsCount();
}

function sortProjects(sortBy) {
    switch(sortBy) {
        case 'students':
            filteredProjects.sort((a, b) => b.studentCount - a.studentCount);
            break;
        case 'name':
            filteredProjects.sort((a, b) => a.projectTitel.localeCompare(b.projectTitel));
            break;
    }
    
    renderProjects();
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading(show) {
    const loader = document.querySelector('#loadingOverlay, .loading');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    const container = document.querySelector('.projects-grid, #projectsGrid');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="location.reload()">Probeer opnieuw</button>
            </div>
        `;
    }
}

function updateResultsCount() {
    const countElement = document.querySelector('.results-count, [data-count="projects"]');
    if (countElement) {
        countElement.textContent = `${filteredProjects.length} project${filteredProjects.length !== 1 ? 'en' : ''}`;
    }
}

function restoreScrollPosition() {
    const scrollPos = sessionStorage.getItem('alleProjectenScrollPosition');
    if (scrollPos) {
        window.scrollTo(0, parseInt(scrollPos));
        sessionStorage.removeItem('alleProjectenScrollPosition');
    }
}

// ===== ADD GROUP PROJECT STYLES =====
const groupProjectStyles = `
<style>
.group-project {
    border: 2px solid #881538;
    position: relative;
}

.group-project::before {
    content: 'Groepsproject';
    position: absolute;
    top: -10px;
    right: 20px;
    background: #881538;
    color: white;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
}

.project-students {
    margin: 10px 0;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 5px;
}

.student-names {
    color: #333;
    font-weight: normal;
}

.group-tag {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.individual-tag {
    background: #e3f2fd;
    color: #1565c0;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}
</style>
`;

// Add styles on load
document.head.insertAdjacentHTML('beforeend', groupProjectStyles);

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProjects,
        groupProjectsByProjectId,
        renderProjects,
        navigateToProject
    };
}