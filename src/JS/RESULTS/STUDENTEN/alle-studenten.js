/**
 * 🎓 alle-studenten.js - Studenten Overzicht Pagina voor CareerLaunch EHB
 * 
 * Dit bestand beheert de overzichtspagina voor alle studenten:
 * - Dynamisch laden van alle studentgegevens uit de API
 * - Rendering van studentkaarten met basisinformatie
 * - Zoek- en filterfunctionaliteit
 * - Navigatie naar individuele student detailpagina's
 * - Responsive design ondersteuning
 * 
 * Belangrijke functionaliteiten:
 * - API integratie voor studentgegevens
 * - Real-time zoeken en filteren
 * - Specialisatie pillen voor snelle filtering
 * - Statistieken en tellingen
 * - Animaties en loading states
 * - Error handling met fallback data
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

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
});

// 🎯 Globale variabelen voor student management
let allStudents = [];
let filteredStudents = [];
let currentFilters = {
    search: '',
    jaar: '',
    specialization: 'Alle'
};

/**
 * 🚀 Initialiseert de studenten pagina
 * 
 * Deze functie is het hoofdpunt voor het laden van alle studentgegevens:
 * - Laadt alle studenten via API
 * - Zet filter en zoekfunctionaliteit op
 * - Rendert studentkaarten
 * - Update statistieken
 * 
 * @returns {Promise<void>}
 * @throws {Error} Bij fouten tijdens initialisatie
 */
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
        
    } catch (error) {
        showErrorState();
    }
}

/**
 * 📡 Laadt alle studenten via API
 * 
 * Deze functie haalt alle studentgegevens op van de backend
 * en handelt errors af met fallback data
 * 
 * @returns {Promise<void>}
 */
async function loadAllStudents() {
    const container = document.querySelector('.studentTegels');
    if (!container) {
        return;
    }
    container.innerHTML = `<div class="no-data" id="studentenLoading"><i class="fas fa-spinner fa-spin"></i> Studenten laden...</div>`;
    try {
        const response = await fetch('/api/studenten');
        const data = await response.json();
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
        updateStats(0);
    }
}

/**
 * 🎨 Rendert studentkaarten in de UI
 * 
 * Deze functie toont alle studenten als klikbare kaarten
 * met basisinformatie en navigatie naar detailpagina's
 * 
 * @param {Array} students - Array van student objecten om te renderen
 * @returns {void}
 */
function renderStudents(students) {
    const container = document.querySelector('.studentTegels');
    if (!container) {
        return;
    }
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

/**
 * 🎴 Creëert een individuele studentkaart
 * 
 * Genereert een klikbare kaart met studentinformatie
 * die navigeert naar de detailpagina
 * 
 * @param {Object} student - Student object met gegevens
 * @param {number} index - Index voor animatie delay
 * @returns {HTMLElement} Student kaart element
 */
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

/**
 * 🔗 Navigeert naar student detailpagina
 * 
 * Opent de detailpagina voor een specifieke student
 * 
 * @param {string} studentnummer - Het studentnummer van de student
 * @returns {void}
 */
function navigateToStudent(studentnummer) {
    // Navigeer naar detail pagina met student ID als parameter
    window.location.href = `/zoekbalkStudenten?id=${studentnummer}`;
}

/**
 * 🔍 Zet filter functionaliteit op
 * 
 * Initialiseert event listeners voor zoeken en filteren
 * van studenten op basis van verschillende criteria
 * 
 * @returns {void}
 */
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

/**
 * 🏷️ Zet specialisatie pillen op
 * 
 * Initialiseert klikbare pillen voor snelle filtering
 * op basis van opleidingsrichting
 * 
 * @returns {void}
 */
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

/**
 * 🔍 Past filters toe op studentenlijst
 * 
 * Filtert studenten op basis van zoekterm, jaar en specialisatie
 * en update de weergegeven lijst
 * 
 * @returns {void}
 */
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
            const filterYear = parseInt(currentFilters.jaar);
            if (studentYear !== filterYear) {
                return false;
            }
        }
        
        // Specialization filter
        if (currentFilters.specialization && currentFilters.specialization !== 'Alle') {
            if (student.opleidingsrichting !== currentFilters.specialization) {
                return false;
            }
        }
        
        return true;
    });
    
    renderStudents(filteredStudents);
}

/**
 * 🔢 Bepaalt studiejaar uit studentnummer
 * 
 * @param {string} studentnummer - Het studentnummer
 * @returns {number} Het studiejaar (1-4)
 */
function getStudentYear(studentnummer) {
    if (!studentnummer) return 1;
    const year = parseInt(studentnummer.toString().substring(0, 1));
    return year >= 1 && year <= 4 ? year : 1;
}

/**
 * 📊 Werkt statistieken bij
 * 
 * Toont het aantal studenten en andere relevante statistieken
 * 
 * @param {number} count - Het aantal studenten om te tonen
 * @returns {void}
 */
function updateStats(count) {
    const statsText = document.querySelector('.stats-text');
    if (statsText) {
        const displayCount = count !== undefined ? count : filteredStudents.length;
        statsText.textContent = `${displayCount} studenten gevonden`;
    }
}

/**
 * 🔍 Zet zoekfunctionaliteit op
 * 
 * Initialiseert real-time zoeken in de studentenlijst
 * 
 * @returns {void}
 */
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300));
    }
}

/**
 * ⏳ Toont loading state
 * 
 * Verbergt content en toont loading indicator
 * 
 * @returns {void}
 */
function showLoadingState() {
    const container = document.querySelector('.studentTegels');
    if (container) {
        container.innerHTML = `<div class="no-data"><i class="fas fa-spinner fa-spin"></i> Studenten laden...</div>`;
    }
}

/**
 * ✅ Verbergt loading state
 * 
 * Toont content en verbergt loading indicator
 * 
 * @returns {void}
 */
function hideLoadingState() {
    // Loading state wordt automatisch verborgen wanneer content wordt geladen
}

/**
 * ❌ Toont error state
 * 
 * Toont een foutmelding aan de gebruiker
 * 
 * @returns {void}
 */
function showErrorState() {
    const container = document.querySelector('.studentTegels');
    if (container) {
        container.innerHTML = `<div class="no-data" style="color: #dc3545;">Er is een fout opgetreden bij het laden van de studenten.</div>`;
    }
}

/**
 * ✨ Animeert studentkaarten
 * 
 * Voegt fade-in animaties toe aan studentkaarten
 * 
 * @returns {void}
 */
function animateCards() {
    const cards = document.querySelectorAll('.studentTegel');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

/**
 * 🎭 Genereert mock student data voor ontwikkeling
 * 
 * Deze functie biedt test data voor wanneer de API niet beschikbaar is
 * 
 * @returns {Array} Array van mock student objecten
 */
function getMockStudents() {
    return [
        {
            studentnummer: '1',
            voornaam: 'Jan',
            achternaam: 'Janssens',
            email: 'jan.janssens@student.ehb.be',
            gsm_nummer: '+32 470 123 456',
            opleiding: 'Dagtraject Toegepaste informatica',
            opleidingsrichting: 'Dagtraject Toegepaste informatica',
            projectTitel: 'Smart City Dashboard',
            overMezelf: 'Passionele ontwikkelaar met interesse in smart city technologieën.'
        },
        {
            studentnummer: '2',
            voornaam: 'Marie',
            achternaam: 'Maertens',
            email: 'marie.maertens@student.ehb.be',
            gsm_nummer: '+32 470 234 567',
            opleiding: 'Graduaat Programmeren',
            opleidingsrichting: 'Graduaat Programmeren',
            projectTitel: 'E-commerce Platform',
            overMezelf: 'Software developer gespecialiseerd in web development en user experience.'
        }
    ];
}

/**
 * ⏱️ Debounce functie voor performance optimalisatie
 * 
 * Voorkomt te veel API calls bij snelle input
 * 
 * @param {Function} func - De functie om te debouncen
 * @param {number} wait - Wachtijd in milliseconden
 * @returns {Function} Gedebounced functie
 */
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

/**
 * 📢 Toont notificatie aan gebruiker
 * 
 * Deze functie toont een notificatie met verschillende types
 * 
 * @param {string} message - De melding om te tonen
 * @param {string} type - Het type notificatie ('info', 'success', 'warning', 'error')
 * @returns {void}
 */
function showNotification(message, type = 'info') {
    // Fallback naar alert als geen notificatie systeem beschikbaar is
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * 🔧 Initialiseert DOM elementen
 * 
 * Zoekt en valideert belangrijke DOM elementen
 * 
 * @returns {Object} Object met gevonden elementen
 */
function initializeElements() {
    const elements = {
        container: document.querySelector('.studentTegels'),
        searchInput: document.querySelector('.search-input'),
        filterSelect: document.querySelector('.filter-select'),
        filterBtn: document.querySelector('.filter-btn'),
        statsText: document.querySelector('.stats-text'),
        specializationPills: document.querySelectorAll('.specialization-pill')
    };
    
    return elements;
}

/**
 * 📊 Werkt student telling bij
 * 
 * Update de weergegeven telling van studenten
 * 
 * @returns {void}
 */
function updateStudentCount() {
    updateStats(filteredStudents.length);
}

// DEBUG: Force reload for cache issues
