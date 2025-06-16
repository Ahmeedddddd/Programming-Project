// src/JS/RESULTS/STUDENTEN/alle-studenten.js
// JavaScript voor alle studenten pagina - toont alle studenten en navigeert naar detail

// Wacht tot DOM geladen is
document.addEventListener('DOMContentLoaded', async () => {
    await initializeStudentPage();
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
    try {
        const API_BASE = 'http://localhost:3301';
        const response = await fetch(`${API_BASE}/api/studenten`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            allStudents = data.data;
            filteredStudents = [...allStudents];
            console.log('📊 Studenten geladen:', allStudents.length);
        } else {
            throw new Error('Invalid response format');
        }
        
    } catch (error) {
        console.error('❌ Fout bij laden studenten:', error);
        
        // Fallback: gebruik mock data als API niet beschikbaar is
        allStudents = getMockStudents();
        filteredStudents = [...allStudents];
        
        showNotification('⚠️ Offline modus: test data wordt gebruikt', 'warning');
    }
}

// ===== RENDERING =====
function renderStudents(students) {
    const container = document.querySelector('.studentTegels');
    
    if (!container) {
        console.error('❌ .studentTegels container niet gevonden');
        return;
    }
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>Geen studenten gevonden</h3>
                <p>Probeer je zoekopdracht aan te passen of de filters te wijzigen.</p>
            </div>
        `;
        return;
    }
    
    // Clear bestaande content
    container.innerHTML = '';
    
    // Render elke student
    students.forEach((student, index) => {
        const studentElement = createStudentCard(student, index);
        container.appendChild(studentElement);
    });
    
    // Add animations
    animateCards();
}

function createStudentCard(student, index) {
    const article = document.createElement('article');
    article.className = 'studentTegel';
    article.style.animationDelay = `${index * 0.1}s`;
    
    // Bepaal beschrijving (gebruik overMezelf of projectBeschrijving)
    let beschrijving = student.overMezelf || student.projectBeschrijving || 'Geen beschrijving beschikbaar.';
    
    // Limiteer beschrijving lengte
    if (beschrijving.length > 300) {
        beschrijving = beschrijving.substring(0, 300) + '...';
    }
    
    // Bepaal specialization/opleiding
    const specialization = student.opleidingsrichting || student.opleiding || 'Onbekend';
    
    // Bepaal jaar op basis van studentnummer (simpele logica)
    const jaar = getStudentYear(student.studentnummer);
    
    article.innerHTML = `
        <button class="connect-btn" onclick="navigateToStudent(${student.studentnummer})">💬 Connect</button>
        <h2 class="studentNaam">${student.voornaam} ${student.achternaam}</h2>
        <div class="student-meta">
            <span class="specialization-tag">${specialization}</span>
            <span class="year-tag">${jaar}e jaar</span>
        </div>
        <p class="studentBeschrijving">${beschrijving}</p>
        ${student.projectTitel ? `
            <div class="project-preview">
                <strong>📚 Project:</strong> ${student.projectTitel}
            </div>
        ` : ''}
        <div class="student-tags">
            ${student.gemeente ? `<span class="location-tag">📍 ${student.gemeente}</span>` : ''}
            ${student.email ? `<span class="email-tag">📧 Contact mogelijk</span>` : ''}
        </div>
    `;
    
    // Add click handler voor hele card
    article.addEventListener('click', (e) => {
        // Alleen navigeren als niet op de connect button geklikt
        if (!e.target.classList.contains('connect-btn')) {
            navigateToStudent(student.studentnummer);
        }
    });
    
    return article;
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
    updateStats();
}

// ===== UTILITY FUNCTIONS =====
function getStudentYear(studentnummer) {
    // Simpele logica: laatste digit van studentnummer
    const lastDigit = parseInt(studentnummer.toString().slice(-1));
    if (lastDigit >= 0 && lastDigit <= 3) return 1;
    if (lastDigit >= 4 && lastDigit <= 6) return 2;
    return 3;
}

function updateStats() {
    const statsText = document.querySelector('.stats-text');
    if (statsText) {
        const count = filteredStudents.length;
        statsText.textContent = `🎓 ${count} studenten beschikbaar voor netwerkgesprekken`;
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