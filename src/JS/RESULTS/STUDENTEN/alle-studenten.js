// src/JS/RESULTS/STUDENTEN/alle-studenten.js
// JavaScript voor alle studenten pagina - toont alle studenten en navigeert naar detail

// Wacht tot DOM geladen is
document.addEventListener('DOMContentLoaded', async () => {
    showLoadingState();
    await loadAllStudents();
    setupFilters();
    setupSpecializationPills();
    setupSearch();
    renderStudents(filteredStudents);
    updateStats();
    hideLoadingState();
    console.log('✅ Student pagina geïnitialiseerd met', allStudents.length, 'studenten');
});

// Globale variabelen
let allStudents = [];
let filteredStudents = [];
let currentFilters = {
    search: '',
    jaar: '',
    specialization: 'Alle'
};

// ===== MAIN INITIALIZATION =====
async function initializeStudentPage() {
    try {
        showLoadingState();
        
        // Laad alle studenten
        await loadAllStudents();
        
        // Setup filter functionaliteit
        setupFilters();
        
        // Setup search functionaliteit
        setupSearch();
        
        // Setup specialization pills
        setupSpecializationPills();
        
        // Render studenten
        renderStudents(allStudents);
        
        // Update stats
        updateStats();
        
        hideLoadingState();
        
        console.log('✅ Student pagina geïnitialiseerd met', allStudents.length, 'studenten');
        
    } catch (error) {
        console.error('❌ Fout bij laden van studenten pagina:', error);
        showErrorState();
    }
}

// ===== API CALLS =====
async function loadAllStudents() {
    const container = document.querySelector('.studentTegels');
    if (!container) {
        console.error('❌ [DEBUG] .studentTegels container niet gevonden');
        return;
    }
    container.innerHTML = `<div class="no-data" id="studentenLoading"><i class="fas fa-spinner fa-spin"></i> Studenten laden...</div>`;
    try {
        const response = await fetch('/api/studenten');
        const data = await response.json();
        console.log('📦 [DEBUG] Studenten API data:', data);
        if (data.success && data.data && data.data.length > 0) {
            allStudents = data.data;
            filteredStudents = [...allStudents];
            renderStudents(filteredStudents);
            updateStats();
        } else {
            container.innerHTML = `<div class="no-data">Geen studenten gevonden.</div>`;
            updateStats(0);
        }
    } catch (error) {
        container.innerHTML = `<div class="no-data" style="color: #dc3545;">Fout bij laden van studenten.</div>`;
        console.error('❌ [DEBUG] Fout bij laden van studenten:', error);
        updateStats(0);
    }
}

// ===== RENDERING =====
function renderStudents(students) {
    const container = document.querySelector('.studentTegels');
    if (!container) {
        console.error('❌ [DEBUG] .studentTegels container niet gevonden');
        return;
    }
    console.log('🎨 [DEBUG] renderStudents met', students ? students.length : 0, 'studenten');
    if (!students || students.length === 0) {
        container.innerHTML = `<div class="no-results"><h3>Geen studenten gevonden</h3><p>Probeer je zoekopdracht aan te passen of de filters te wijzigen.</p></div>`;
        updateStats(0);
        return;
    }
    container.innerHTML = '';
    students.forEach((student, index) => {
        const studentElement = createStudentCard(student, index);
        container.appendChild(studentElement);
    });
    updateStats(students.length);
    animateCards();
}

function createStudentCard(student, index) {
    const card = document.createElement('a');
    card.className = 'studentTegel';
    card.href = `/resultaat-student?id=${student.studentnummer}`;
    card.style.animationDelay = `${index * 0.1}s`;
    card.addEventListener("click", () => {
        navigateToStudent(student.studentnummer);
    });
    // Extra info
    const email = student.email ? `<span class='student-email'><i class='fas fa-envelope'></i> ${student.email}</span>` : '';
    const telefoon = student.gsm_nummer ? `<span class='student-telefoon'><i class='fas fa-phone'></i> ${student.gsm_nummer}</span>` : '';
    const opleiding = student.opleiding ? `<span class='student-opleiding'><i class='fas fa-graduation-cap'></i> ${student.opleiding}</span>` : '';
    const specialisatie = student.specialisatie ? `<span class='student-specialisatie'><i class='fas fa-flask'></i> ${student.specialisatie}</span>` : '';
    card.innerHTML = `
        <h2 class="studentNaam">${student.voornaam} ${student.achternaam}</h2>
        <p class="studentBeschrijving" style="text-align:left;">${student.overMezelf || student.projectBeschrijving || "Meer informatie beschikbaar op de detailpagina."}</p>
        <div class="student-info">
            ${opleiding}
            ${specialisatie}
        </div>
        <div class="student-contact" style="margin-top:0.5rem; font-size:0.9em; color:#881538; display:flex; gap:1.5rem; flex-wrap:wrap;">
            ${email}
            ${telefoon}
        </div>
    `;
    return card;
}

// ===== NAVIGATION =====
function navigateToStudent(studentnummer) {
    console.log('🔗 Navigeren naar student:', studentnummer);
    
    // Navigeer naar detail pagina met student ID als parameter
    window.location.href = `/zoekbalkStudenten?id=${studentnummer}`;
}

// ===== FILTER FUNCTIONALITY =====
function setupFilters() {
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');
    const filterBtn = document.querySelector('.filter-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300));
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilters.jaar = e.target.value;
            applyFilters();
        });
    }
    
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            applyFilters();
            showNotification('🔍 Filters toegepast', 'info');
        });
    }
}

function setupSpecializationPills() {
    const pills = document.querySelectorAll('.specialization-pill');
    
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Remove active from all
            pills.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked
            pill.classList.add('active');
            
            // Update filter
            currentFilters.specialization = pill.textContent.trim();
            applyFilters();
        });
    });
}

function applyFilters() {
    filteredStudents = allStudents.filter(student => {
        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search;
            const searchableText = `${student.voornaam} ${student.achternaam} ${student.projectTitel || ''} ${student.opleiding || ''} ${student.opleidingsrichting || ''}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        // Year filter
        if (currentFilters.jaar && currentFilters.jaar !== 'Alle jaren') {
            const studentYear = getStudentYear(student.studentnummer);
            const filterYear = parseInt(currentFilters.jaar.replace('e jaar', ''));
            if (studentYear !== filterYear) {
                return false;
            }
        }
        
        // Specialization filter
        if (currentFilters.specialization !== 'Alle') {
            const studentSpec = student.opleidingsrichting || student.opleiding || '';
            if (currentFilters.specialization !== 'Toegepaste Informatica' && 
                !studentSpec.toLowerCase().includes(currentFilters.specialization.toLowerCase())) {
                return false;
            }
        }
        
        return true;
    });
    
    renderStudents(filteredStudents);
    updateStats(filteredStudents.length);
}

// ===== UTILITY FUNCTIONS =====
function getStudentYear(studentnummer) {
    // Simpele logica: laatste digit van studentnummer
    const lastDigit = parseInt(studentnummer.toString().slice(-1));
    if (lastDigit >= 0 && lastDigit <= 3) return 1;
    if (lastDigit >= 4 && lastDigit <= 6) return 2;
    return 3;
}

function updateStats(count) {
    // Update .data-count utility
    if (window.updateDataCounts) {
        window.updateDataCounts({ 
            studenten: typeof count === 'number' ? count : filteredStudents.length 
        });
    }
}

function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.placeholder = "Zoek studenten op naam, project of vaardigheden...";
    }
}

// ===== LOADING STATES =====
function showLoadingState() {
    const container = document.querySelector('.studentTegels');
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loader"></div>
                <p>Studenten laden...</p>
            </div>
        `;
    }
}

function hideLoadingState() {
    // Loading wordt vervangen door renderStudents()
}

function showErrorState() {
    const container = document.querySelector('.studentTegels');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <h3>⚠️ Fout bij laden</h3>
                <p>Er ging iets mis bij het ophalen van de studenten.</p>
                <button onclick="location.reload()" class="retry-btn">🔄 Probeer opnieuw</button>
            </div>
        `;
    }
}

// ===== ANIMATIONS =====
function animateCards() {
    const cards = document.querySelectorAll('.studentTegel');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// ===== MOCK DATA (fallback) =====
function getMockStudents() {
    return [
        {
            studentnummer: 232,
            voornaam: 'John',
            achternaam: 'Doe',
            email: 'john.doe@student.ehb.be',
            opleiding: 'Toegepaste informatica',
            opleidingsrichting: 'Intelligent Robotics',
            projectTitel: 'Kokende AI Robot',
            gemeente: 'Gent',
            overMezelf: 'Ik ben John Doe, derdejaarsstudent Toegepaste Informatica aan de Erasmushogeschool Brussel, altijd op zoek naar de volgende technische uitdaging.'
        },
        {
            studentnummer: 233,
            voornaam: 'Jeretom',
            achternaam: 'Carnomina',
            email: 'jeretom@student.ehb.be',
            opleiding: 'Toegepaste informatica',
            opleidingsrichting: 'Software Engineering',
            projectTitel: 'NeuroTrack',
            gemeente: 'Antwerpen',
            overMezelf: 'Derdejaarsstudent met voorliefde voor multidisciplinaire hardware-software integratie.'
        }
    ];
}

// ===== UTILITIES =====
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

function showNotification(message, type = 'info') {
    // Gebruik het bestaande notification system
    if (window.showNotification) {
        window.showNotification(message, type);
    } else if (window.toast) {
        window.toast[type] && window.toast[type](message);
    } else {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
}

// ===== GLOBAL FUNCTION (voor HTML onclick) =====
window.navigateToStudent = navigateToStudent;

function initializeElements() {
    console.log('🔍 Finding DOM elements...');
    // Gebruik altijd .studentTegels als hoofdcontainer
    studentsGrid = document.querySelector('.studentTegels');
    searchInput = document.querySelector('.search-input, #searchInput, input[type="text"]');
    filterDropdown = document.querySelector('.filter-dropdown, #filterDropdown');
    loadingOverlay = document.querySelector('.loading-overlay, #loadingOverlay');
    noResultsMessage = document.querySelector('.no-results, #noResults');
    paginationControls = document.querySelector('.pagination, #pagination');
    console.log('📋 Elements found:', {
        studentsGrid: !!studentsGrid,
        searchInput: !!searchInput,
        filterDropdown: !!filterDropdown,
        loadingOverlay: !!loadingOverlay
    });
    // Fallback: als main container niet gevonden, gebruik body
    if (!studentsGrid) {
        studentsGrid = document.body;
        console.log('⚠️ Using fallback container for students grid');
    }
}

function updateStudentCount() {
    // Update .stats-text altijd
    const statsText = document.querySelector('.stats-text');
    if (statsText) {
        statsText.textContent = `🎓 ${filteredStudents.length} studenten beschikbaar voor netwerkgesprekken`;
    }
    // Update page title
    document.title = `Alle Studenten (${filteredStudents.length}) - CareerLaunch EHB`;
}// DEBUG: Force reload for cache issues
