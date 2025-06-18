// src/JS/RESULTS/STUDENTEN/alle-studenten.js
// ==========================================   

// ===== GLOBAL VARIABLES =====
let allStudents = [];
let filteredStudents = [];
let currentFilters = {
    search: '',
    jaar: 'alle',
    opleiding: 'alle'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎓 Initializing alle-studenten page...');
    
    try {
        await loadStudents();
        setupEventListeners();
        restoreScrollPosition();
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showError('Er ging iets mis bij het laden van de studenten');
    }
});

// ===== DATA LOADING =====
async function loadStudents() {
    console.log('📊 Loading students...');
    showLoading(true);
    
    try {
        const response = await fetch('http://localhost:8383/api/studenten', {
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
            allStudents = data.data;
            filteredStudents = [...allStudents];
            console.log(`✅ Loaded ${allStudents.length} students`);
            
            renderStudents();
        } else {
            throw new Error('Invalid data format received');
        }
        
    } catch (error) {
        console.error('❌ Failed to load students:', error);
        showError('Kon studenten niet laden. Probeer later opnieuw.');
    } finally {
        showLoading(false);
    }
}

// ===== RENDERING =====
function renderStudents() {
    const container = document.querySelector('.students-grid, #studentsGrid');
    if (!container) {
        console.error('❌ Students container not found');
        return;
    }
    
    if (filteredStudents.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Geen studenten gevonden</p>
            </div>
        `;
        return;
    }
    
    const studentsHTML = filteredStudents.map((student, index) => 
        createStudentCard(student, index)
    ).join('');
    
    container.innerHTML = studentsHTML;
    
    // Add click handlers after rendering
    addStudentClickHandlers();
}

function createStudentCard(student, index) {
    const year = getStudentYear(student.studentnummer);
    const yearText = `${year}e jaar`;
    const projectInfo = student.projectTitel ? 
        `<div class="project-preview">
            <strong>📚 Project:</strong> ${student.projectTitel}
        </div>` : '';
    
    return `
        <article class="studentTegel student-card" 
                 data-student-id="${student.studentnummer}"
                 data-studentnummer="${student.studentnummer}"
                 style="animation-delay: ${index * 0.05}s">
            <div class="student-header">
                <h3 class="student-name">${student.voornaam} ${student.achternaam}</h3>
                <span class="student-number">#${student.studentnummer}</span>
            </div>
            
            <div class="student-meta">
                <span class="specialization-tag">${student.opleiding || 'Toegepaste Informatica'}</span>
                <span class="year-tag">${yearText}</span>
            </div>
            
            ${projectInfo}
            
            <div class="student-tags">
                ${student.gemeente ? `<span class="location-tag">📍 ${student.gemeente}</span>` : ''}
                ${student.email ? `<span class="email-tag">📧 Contact mogelijk</span>` : ''}
            </div>
            
            <div class="student-actions">
                <button class="view-profile-btn" data-student-id="${student.studentnummer}">
                    Bekijk Profiel
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </article>
    `;
}

// ===== NAVIGATION FIX =====
function addStudentClickHandlers() {
    // FIX: Add click handlers to navigate to zoekbalk-studenten
    document.querySelectorAll('.student-card').forEach(card => {
        card.style.cursor = 'pointer';
        
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on a button
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            const studentId = card.dataset.studentId || card.dataset.studentnummer;
            if (studentId) {
                navigateToStudent(studentId);
            }
        });
    });
    
    // Also handle button clicks
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const studentId = btn.dataset.studentId;
            if (studentId) {
                navigateToStudent(studentId);
            }
        });
    });
}

// FIX: Navigate to correct student detail page
function navigateToStudent(studentnummer) {
    console.log('🔗 Navigeren naar student:', studentnummer);
    
    // Save scroll position
    sessionStorage.setItem('alleStudentenScrollPosition', window.pageYOffset.toString());
    
    // FIX: Navigate to zoekbalk-studenten instead of alle-studenten
    window.location.href = `/zoekbalk-studenten?id=${studentnummer}`;
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
    
    // Year filter
    const yearFilter = document.querySelector('#yearFilter');
    if (yearFilter) {
        yearFilter.addEventListener('change', (e) => {
            currentFilters.jaar = e.target.value;
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
    
    // Filter button
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            toggleFilterPanel();
        });
    }
}

function applyFilters() {
    filteredStudents = allStudents.filter(student => {
        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const fullName = `${student.voornaam} ${student.achternaam}`.toLowerCase();
            const matchesSearch = 
                fullName.includes(searchTerm) ||
                student.studentnummer.toString().includes(searchTerm) ||
                (student.opleiding && student.opleiding.toLowerCase().includes(searchTerm)) ||
                (student.projectTitel && student.projectTitel.toLowerCase().includes(searchTerm));
            
            if (!matchesSearch) return false;
        }
        
        // Year filter
        if (currentFilters.jaar !== 'alle') {
            const studentYear = getStudentYear(student.studentnummer);
            if (studentYear.toString() !== currentFilters.jaar) return false;
        }
        
        // Opleiding filter
        if (currentFilters.opleiding !== 'alle') {
            if (!student.opleiding || student.opleiding !== currentFilters.opleiding) return false;
        }
        
        return true;
    });
    
    renderStudents();
    updateResultsCount();
}

// ===== UTILITY FUNCTIONS =====
function getStudentYear(studentnummer) {
    const lastDigit = parseInt(studentnummer.toString().slice(-1));
    if (lastDigit >= 0 && lastDigit <= 3) return 1;
    if (lastDigit >= 4 && lastDigit <= 6) return 2;
    return 3;
}

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
    const container = document.querySelector('.students-grid, #studentsGrid');
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
    const countElement = document.querySelector('.results-count, [data-count="students"]');
    if (countElement) {
        countElement.textContent = `${filteredStudents.length} student${filteredStudents.length !== 1 ? 'en' : ''}`;
    }
}

function restoreScrollPosition() {
    const scrollPos = sessionStorage.getItem('alleStudentenScrollPosition');
    if (scrollPos) {
        window.scrollTo(0, parseInt(scrollPos));
        sessionStorage.removeItem('alleStudentenScrollPosition');
    }
}

function toggleFilterPanel() {
    const filterPanel = document.querySelector('.filter-panel');
    if (filterPanel) {
        filterPanel.classList.toggle('active');
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    const container = document.querySelector('#notification-container') || document.body;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadStudents,
        renderStudents,
        navigateToStudent,
        getStudentYear
    };
}