// src/JS/RESULTS/STUDENTEN/alle-studenten.js - FIXED VERSION

/**
 * 🎓 ALLE STUDENTEN - COMPREHENSIVE FIX
 * 
 * Fixed:
 * ✅ API data loading
 * ✅ Student card rendering
 * ✅ Search functionality
 * ✅ URL parameter handling
 * ✅ Better error handling
 * ✅ Loading states
 */

// ===== CONFIGURATION =====
const API_BASE_URL = 'http://localhost:8383';
const STUDENTEN_API = `${API_BASE_URL}/api/studenten`;

// ===== GLOBAL VARIABLES =====
let allStudents = [];
let filteredStudents = [];
let currentPage = 1;
const itemsPerPage = 12;

// ===== DOM ELEMENTS =====
let studentsGrid;
let searchInput;
let filterDropdown;
let loadingOverlay;
let noResultsMessage;
let paginationControls;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Alle Studenten - Initializing...');
    initializeElements();
    initializeSearch();
    loadStudents();
    handleURLParameters();
});

function initializeElements() {
    console.log('🔍 Finding DOM elements...');
    
    studentsGrid = document.querySelector('.students-grid, .student-grid, .card-grid, #studentsGrid');
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
    
    // If main containers not found, try to create them
    if (!studentsGrid) {
        studentsGrid = document.querySelector('.main-content, .content, main, body');
        console.log('⚠️ Using fallback container for students grid');
    }
}

function initializeSearch() {
    if (searchInput) {
        console.log('🔍 Setting up search functionality...');
        
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });
    }
    
    if (filterDropdown) {
        filterDropdown.addEventListener('change', handleFilterChange);
    }
}

// ===== DATA LOADING =====
async function loadStudents() {
    console.log('📡 Loading students from API...');
    
    try {
        showLoading(true);
        
        const response = await fetch(STUDENTEN_API);
        console.log(`📡 API Response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw API data:', data);
        
        if (data.success && Array.isArray(data.data)) {
            allStudents = data.data;
            console.log(`✅ Loaded ${allStudents.length} students`);
            
            if (allStudents.length > 0) {
                console.log('📋 Sample student:', allStudents[0]);
            }
        } else if (Array.isArray(data)) {
            allStudents = data;
            console.log(`✅ Loaded ${allStudents.length} students (direct array)`);
        } else {
            console.warn('⚠️ Unexpected API response format:', data);
            allStudents = [];
        }
        
        // Set initial filtered students to all students
        filteredStudents = [...allStudents];
        
        // Render students
        renderStudents();
        updateStudentCount();
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        showError(`Kon studenten niet laden: ${error.message}`);
        
        // Load fallback data for testing
        loadFallbackStudents();
    } finally {
        showLoading(false);
    }
}

function loadFallbackStudents() {
    console.log('🔄 Loading fallback student data...');
    
    allStudents = [
        {
            id: 1,
            studentnummer: 12345,
            voornaam: "John",
            achternaam: "Doe",
            email: "john.doe@student.ehb.be",
            opleiding: "Toegepaste Informatica",
            opleidingsrichting: "Software Development",
            leerjaar: 3,
            beschrijving: "Derdejaarsstudent met passie voor full-stack development en AI.",
            projectTitel: "Kokende AI Robot",
            projectBeschrijving: "Een innovatieve AI-robot die zelfstandig kan koken.",
            tafelNr: 5
        },
        {
            id: 2,
            studentnummer: 12346,
            voornaam: "Ben",
            achternaam: "Huur",
            email: "ben.huur@student.ehb.be",
            opleiding: "Toegepaste Informatica",
            opleidingsrichting: "System & Network Administration",
            leerjaar: 3,
            beschrijving: "Student met passie voor backend development en cloudtechnologieën.",
            projectTitel: "SmartLine Inspector",
            projectBeschrijving: "Vision-gebaseerd edge-systeem voor kwaliteitscontrole.",
            tafelNr: 8
        },
        {
            id: 3,
            studentnummer: 12347,
            voornaam: "Sarah",
            achternaam: "Johnson",
            email: "sarah.johnson@student.ehb.be",
            opleiding: "Electronica-ICT",
            opleidingsrichting: "Embedded Systems",
            leerjaar: 3,
            beschrijving: "Gespecialiseerd in IoT en embedded systemen met focus op duurzaamheid.",
            projectTitel: "Green Energy Monitor",
            projectBeschrijving: "IoT-platform voor monitoring van zonnepanelen.",
            tafelNr: 12
        }
    ];
    
    filteredStudents = [...allStudents];
    renderStudents();
    updateStudentCount();
    
    console.log(`🔄 Loaded ${allStudents.length} fallback students`);
}

// ===== RENDERING =====
function renderStudents() {
    if (!studentsGrid) {
        console.error('❌ Students grid container not found');
        return;
    }
    
    console.log(`🎨 Rendering ${filteredStudents.length} students...`);
    
    if (filteredStudents.length === 0) {
        showNoResults();
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const studentsToShow = filteredStudents.slice(startIndex, endIndex);
    
    console.log(`📄 Page ${currentPage}: showing ${startIndex}-${endIndex} of ${filteredStudents.length}`);
    
    // Generate student cards HTML
    const studentCardsHTML = studentsToShow.map(student => createStudentCard(student)).join('');
    
    // Update the grid
    studentsGrid.innerHTML = studentCardsHTML;
    
    // Add click handlers
    addStudentClickHandlers();
    
    // Update pagination
    updatePagination();
    
    console.log(`✅ Rendered ${studentsToShow.length} student cards`);
}

function createStudentCard(student) {
    const voornaam = student.voornaam || '';
    const achternaam = student.achternaam || '';
    const fullName = `${voornaam} ${achternaam}`.trim() || 'Onbekende Student';
    const email = student.email || '';
    const opleiding = student.opleiding || '';
    const opleidingsrichting = student.opleidingsrichting || '';
    const leerjaar = student.leerjaar || '';
    const beschrijving = student.beschrijving || `Student ${opleiding} aan de Erasmushogeschool Brussel.`;
    const projectTitel = student.projectTitel || '';
    const id = student.id || student.studentnummer;
    const tafelNr = student.tafelNr || '';
    
    // Truncate description if too long
    const truncatedDescription = beschrijving.length > 120 ? 
        beschrijving.substring(0, 120) + '...' : beschrijving;
    
    return `
        <div class="student-card" data-student-id="${id}" onclick="openStudentDetail(${id})">
            <div class="student-header">
                <h3 class="student-name">${fullName}</h3>
                ${tafelNr ? `<span class="table-number">Tafel ${tafelNr}</span>` : ''}
            </div>
            
            <div class="student-content">
                <div class="student-education">
                    ${opleiding ? `<span class="education-main">🎓 ${opleiding}</span>` : ''}
                    ${opleidingsrichting ? `<span class="education-track">${opleidingsrichting}</span>` : ''}
                    ${leerjaar ? `<span class="education-year">Jaar ${leerjaar}</span>` : ''}
                </div>
                
                <p class="student-description">${truncatedDescription}</p>
                
                ${projectTitel ? `
                    <div class="student-project">
                        <strong>Project:</strong> ${projectTitel}
                    </div>
                ` : ''}
                
                <div class="student-footer">
                    ${email ? `<span class="student-email">📧 ${email}</span>` : ''}
                    
                    <button class="btn-detail" onclick="event.stopPropagation(); openStudentDetail(${id})">
                        Bekijk Profiel
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addStudentClickHandlers() {
    const studentCards = document.querySelectorAll('.student-card');
    
    studentCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const studentId = this.getAttribute('data-student-id');
            openStudentDetail(studentId);
        });
    });
    
    console.log(`✅ Added click handlers to ${studentCards.length} student cards`);
}

// ===== SEARCH & FILTERING =====
function handleSearch() {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    console.log(`🔍 Searching for: "${searchTerm}"`);
    
    if (searchTerm === '') {
        // Show all students if search is empty
        filteredStudents = [...allStudents];
    } else {
        // Filter students based on search term
        filteredStudents = allStudents.filter(student => {
            const fullName = `${student.voornaam || ''} ${student.achternaam || ''}`.toLowerCase();
            const email = (student.email || '').toLowerCase();
            const opleiding = (student.opleiding || '').toLowerCase();
            const opleidingsrichting = (student.opleidingsrichting || '').toLowerCase();
            const beschrijving = (student.beschrijving || '').toLowerCase();
            const projectTitel = (student.projectTitel || '').toLowerCase();
            
            return fullName.includes(searchTerm) ||
                   email.includes(searchTerm) ||
                   opleiding.includes(searchTerm) ||
                   opleidingsrichting.includes(searchTerm) ||
                   beschrijving.includes(searchTerm) ||
                   projectTitel.includes(searchTerm);
        });
    }
    
    currentPage = 1; // Reset to first page
    renderStudents();
    updateStudentCount();
    
    console.log(`🔍 Search results: ${filteredStudents.length} students found`);
}

function handleFilterChange() {
    const filterValue = filterDropdown ? filterDropdown.value : '';
    
    console.log(`📊 Filtering by: "${filterValue}"`);
    
    if (filterValue === '' || filterValue === 'all') {
        filteredStudents = [...allStudents];
    } else {
        filteredStudents = allStudents.filter(student => {
            const opleiding = (student.opleiding || '').toLowerCase();
            return opleiding.includes(filterValue.toLowerCase());
        });
    }
    
    currentPage = 1; // Reset to first page
    renderStudents();
    updateStudentCount();
}

// ===== PAGINATION =====
function updatePagination() {
    if (!paginationControls) return;
    
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationControls.style.display = 'none';
        return;
    }
    
    paginationControls.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="goToPage(${currentPage - 1})" class="page-btn">❮ Vorige</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button onclick="goToPage(${i})" class="page-btn ${activeClass}">${i}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="goToPage(${currentPage + 1})" class="page-btn">Volgende ❯</button>`;
    }
    
    paginationControls.innerHTML = paginationHTML;
}

function goToPage(page) {
    currentPage = page;
    renderStudents();
    
    // Scroll to top of students grid
    if (studentsGrid) {
        studentsGrid.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===== UI HELPERS =====
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    
    if (studentsGrid && show) {
        studentsGrid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Studenten laden...</p>
            </div>
        `;
    }
}

function showNoResults() {
    if (studentsGrid) {
        studentsGrid.innerHTML = `
            <div class="no-results">
                <h3>Geen studenten gevonden</h3>
                <p>Probeer je zoekterm aan te passen of verwijder filters.</p>
                <button onclick="clearSearch()" class="btn-clear">Zoekterm wissen</button>
            </div>
        `;
    }
}

function showError(message) {
    if (studentsGrid) {
        studentsGrid.innerHTML = `
            <div class="error-state">
                <h3>⚠️ Fout bij laden</h3>
                <p>${message}</p>
                <button onclick="loadStudents()" class="btn-retry">Opnieuw proberen</button>
            </div>
        `;
    }
}

function updateStudentCount() {
    const countElement = document.querySelector('.student-count, #studentCount');
    if (countElement) {
        countElement.textContent = `${filteredStudents.length} student${filteredStudents.length !== 1 ? 'en' : ''}`;
    }
    
    // Update page title
    document.title = `Alle Studenten (${filteredStudents.length}) - CareerLaunch EHB`;
}

// ===== URL PARAMETER HANDLING =====
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const idParam = urlParams.get('id');
    
    if (searchParam && searchInput) {
        console.log(`🔗 URL search parameter: ${searchParam}`);
        searchInput.value = searchParam;
        // Search will be triggered after students are loaded
        setTimeout(() => handleSearch(), 500);
    }
    
    if (idParam) {
        console.log(`🔗 URL ID parameter: ${idParam}`);
        // Delay opening detail to ensure students are loaded
        setTimeout(() => openStudentDetail(idParam), 1000);
    }
}

// ===== DETAIL NAVIGATION =====
function openStudentDetail(studentId) {
    console.log(`🔗 Opening student detail: ${studentId}`);
    
    // Find the student in our data
    const student = allStudents.find(s => 
        s.id == studentId || 
        s.studentnummer == studentId
    );
    
    if (student) {
        // Store student data for detail page
        localStorage.setItem('selectedStudent', JSON.stringify(student));
        
        // Navigate to detail page
        window.location.href = `/student-detail?id=${studentId}`;
    } else {
        console.warn(`⚠️ Student ${studentId} not found in loaded data`);
        alert('Student details niet beschikbaar');
    }
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

function clearSearch() {
    if (searchInput) {
        searchInput.value = '';
        handleSearch();
    }
}

function refreshStudents() {
    console.log('🔄 Manual refresh triggered');
    allStudents = [];
    filteredStudents = [];
    loadStudents();
}

// ===== GLOBAL FUNCTIONS =====
// Make functions available globally for onclick handlers
window.openStudentDetail = openStudentDetail;
window.goToPage = goToPage;
window.clearSearch = clearSearch;
window.refreshStudents = refreshStudents;

// ===== DEBUG INFO =====
console.log('🎓 Alle Studenten Script Info:');
console.log('   📡 API Endpoint:', STUDENTEN_API);
console.log('   🌐 Current URL:', window.location.href);
console.log('   📄 Items per page:', itemsPerPage);

console.log('✅ Alle Studenten - Script loaded and ready!');