/**
 * FilterService.js - Advanced Filtering System
 * Handles all filtering logic for students, companies, and projects
 * Supports multiple filter types with dedicated search results area
 */

// ===== FILTER SERVICE =====
class FilterService {
    constructor() {
        this.students = [];
        this.companies = [];
        this.projects = [];
        
        this.currentFilters = {
            search: '',
            jaar: 'Alle jaren',
            specialization: 'Alle',
            taal: 'Alle talen',
            sector: 'Alle sectoren',
            technologie: []
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createSearchResultsContainer();
    }
    
    setData(students, companies, projects) {
        this.students = students || [];
        this.companies = companies || [];
        this.projects = projects || [];
        this.setupSearchSuggestions();
        this.populateTechnologyPills();
        console.log('📊 FilterService: Data set', {
            students: this.students.length,
            companies: this.companies.length,
            projects: this.projects.length
        });
    }
    
    createSearchResultsContainer() {
        // Create search results container if it doesn't exist
        let searchResultsContainer = document.getElementById('searchResults');
        if (!searchResultsContainer) {
            searchResultsContainer = document.createElement('div');
            searchResultsContainer.id = 'searchResults';
            searchResultsContainer.className = 'search-results';
            searchResultsContainer.style.display = 'none';
            
            // Insert after the filter section
            const filterSection = document.querySelector('.student-filter-section');
            if (filterSection) {
                filterSection.parentNode.insertBefore(searchResultsContainer, filterSection.nextSibling);
            } else {
                // Fallback: insert at the beginning of the main content
                const mainContent = document.querySelector('main') || document.body;
                mainContent.insertBefore(searchResultsContainer, mainContent.firstChild);
            }
        }
    }
    
    populateTechnologyPills() {
        const techPillsContainer = document.querySelector('.technology-pills');
        if (!techPillsContainer) return;
        
        // Verzamel alle unieke technologieën uit studenten en projecten
        const allTechs = new Set();
        
        // Van studenten
        this.students.forEach(student => {
            if (student.technologieen) {
                student.technologieen.split(/,|;/).forEach(tech => {
                    const trimmed = tech.trim();
                    if (trimmed) allTechs.add(trimmed);
                });
            }
        });
        
        // Van projecten
        this.projects.forEach(project => {
            if (project.technologieen) {
                project.technologieen.split(/,|;/).forEach(tech => {
                    const trimmed = tech.trim();
                    if (trimmed) allTechs.add(trimmed);
                });
            }
        });
        
        // Maak pillen
        const sortedTechs = Array.from(allTechs).sort();
        techPillsContainer.innerHTML = sortedTechs.map(tech => 
            `<span class="technology-pill">${tech}</span>`
        ).join('');
        
        console.log('🔧 Technology pills populated:', sortedTechs);
    }
    
    setupEventListeners() {
        const filterSection = document.querySelector('.student-filter-section');
        if (!filterSection) return;

        // Reset button
        const resetBtn = filterSection.querySelector('.reset-filter-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('🔄 Reset button clicked');
                this.clearFilters();
            });
        }

        // Specialization pills - apply immediately
        const pills = filterSection.querySelectorAll('.specialization-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Remove active class from all pills
                pills.forEach(p => p.classList.remove('active'));
                // Add active class to clicked pill
                pill.classList.add('active');
                
                // Update current filters and apply immediately
                this.currentFilters.specialization = pill.textContent;
                console.log('📌 Specialization filter changed to:', pill.textContent);
                this.applyFilters();
            });
        });

        // Search input - apply immediately
        const searchInput = filterSection.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Year select - apply immediately
        const yearSelect = filterSection.querySelectorAll('.filter-select')[0];
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.currentFilters.jaar = e.target.value;
                console.log('📅 Year filter changed to:', e.target.value);
                this.applyFilters();
            });
        }

        // Taal select - apply immediately
        const taalSelect = filterSection.querySelectorAll('.filter-select')[1];
        if (taalSelect) {
            taalSelect.addEventListener('change', (e) => {
                this.currentFilters.taal = e.target.value;
                console.log('🗣️ Taal filter changed to:', e.target.value);
                this.applyFilters();
            });
        }

        // Sector select - apply immediately
        const sectorSelect = filterSection.querySelectorAll('.filter-select')[2];
        if (sectorSelect) {
            sectorSelect.addEventListener('change', (e) => {
                this.currentFilters.sector = e.target.value;
                this.applyFilters();
            });
        }

        // Technologie-pillen event listeners
        const techPillsContainer = filterSection.querySelector('.technology-pills');
        if (techPillsContainer) {
            techPillsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('technology-pill')) {
                    e.target.classList.toggle('active');
                    // Verzamel alle actieve pillen
                    const activeTechs = Array.from(techPillsContainer.querySelectorAll('.technology-pill.active')).map(p => p.textContent);
                    this.currentFilters.technologie = activeTechs;
                    console.log('🔧 Technology filter changed to:', activeTechs);
                    this.applyFilters();
                }
            });
        }
    }
    
    applyFilters() {
        console.log('🔍 Applying filters:', this.currentFilters);
        
        if (!this.students || !this.companies || !this.projects) {
            console.warn('⚠️ No data available for filtering');
            return;
        }

        const filteredStudents = this.filterStudents();
        const filteredCompanies = this.filterCompanies();
        const filteredProjects = this.filterProjects();

        this.displayFilteredResults(filteredStudents, filteredCompanies, filteredProjects);
    }
    
    filterStudents() {
        return this.students.filter(student => {
            // Search filter
            if (this.currentFilters.search && this.currentFilters.search !== '') {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const searchableText = [
                    student.voornaam,
                    student.achternaam,
                    student.opleiding,
                    student.opleidingsrichting,
                    student.projectTitel,
                    student.gemeente,
                    (student.technologieen || ''),
                    (student.talen ? student.talen.join(' ') : '')
                ].join(' ').toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Specialization filter (from pills)
            if (this.currentFilters.specialization && this.currentFilters.specialization !== 'Alle') {
                if (student.opleiding !== this.currentFilters.specialization) {
                    return false;
                }
            }
            
            // Year filter - FIXED: vergelijk leerjaar getal met jaar string
            if (this.currentFilters.jaar && this.currentFilters.jaar !== 'Alle jaren') {
                const yearMap = {
                    '1e jaar': 1,
                    '2e jaar': 2,
                    '3e jaar': 3,
                    'Master': 4
                };
                const expectedYear = yearMap[this.currentFilters.jaar];
                if (student.leerjaar !== expectedYear) {
                    return false;
                }
            }
            
            // Taal filter - FIXED: gebruik student.talen array
            if (this.currentFilters.taal && this.currentFilters.taal !== 'Alle talen') {
                if (!student.talen || !student.talen.includes(this.currentFilters.taal)) {
                    return false;
                }
            }
            
            // Technologie filter (multi-match)
            if (this.currentFilters.technologie && this.currentFilters.technologie.length > 0) {
                const studentTechs = (student.technologieen || '').split(/,|;/).map(t => t.trim().toLowerCase());
                const match = this.currentFilters.technologie.some(tech => 
                    studentTechs.includes(tech.toLowerCase())
                );
                if (!match) return false;
            }
            
            return true;
        });
    }
    
    filterCompanies() {
        return this.companies.filter(company => {
            // Search filter
            if (this.currentFilters.search && this.currentFilters.search !== '') {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const searchableText = [
                    company.naam,
                    company.sector,
                    company.bechrijving
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Sector filter
            if (this.currentFilters.sector && this.currentFilters.sector !== 'Alle sectoren') {
                if (company.sector !== this.currentFilters.sector) {
                    return false;
                }
            }

            return true;
        });
    }
    
    filterProjects() {
        return this.projects.filter(project => {
            // Search filter
            if (this.currentFilters.search && this.currentFilters.search !== '') {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const searchableText = [
                    project.titel,
                    project.beschrijving,
                    project.technologieen
                ].join(' ').toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Technologie filter (multi-match)
            if (this.currentFilters.technologie && this.currentFilters.technologie.length > 0) {
                const projectTechs = (project.technologieen || '').split(/,|;/).map(t => t.trim().toLowerCase());
                const match = this.currentFilters.technologie.some(tech => 
                    projectTechs.includes(tech.toLowerCase())
                );
                if (!match) return false;
            }
            
            return true;
        });
    }
    
    displayFilteredResults(students, companies, projects) {
        const searchResultsContainer = document.getElementById('searchResults');
        if (!searchResultsContainer) return;
        
        const totalResults = students.length + companies.length + projects.length;
        
        if (totalResults === 0) {
            searchResultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>Geen resultaten gevonden</h3>
                    <p>Probeer andere zoektermen of filters.</p>
                </div>
            `;
            searchResultsContainer.style.display = 'block';
            return;
        }
        
        // Build results HTML
        let resultsHTML = `
            <div class="search-results-header">
                <h3>Zoekresultaten (${totalResults})</h3>
            </div>
        `;
        
        // Add students section
        if (students.length > 0) {
            resultsHTML += `
                <div class="results-section">
                    <h4>Studenten (${students.length})</h4>
                    <div class="results-grid">
                        ${students.map(student => this.renderStudentCard(student)).join('')}
                    </div>
                </div>
            `;
        }
        
        // Add companies section
        if (companies.length > 0) {
            resultsHTML += `
                <div class="results-section">
                    <h4>Bedrijven (${companies.length})</h4>
                    <div class="results-grid">
                        ${companies.map(company => this.renderCompanyCard(company)).join('')}
                    </div>
                </div>
            `;
        }
        
        // Add projects section
        if (projects.length > 0) {
            resultsHTML += `
                <div class="results-section">
                    <h4>Projecten (${projects.length})</h4>
                    <div class="results-grid">
                        ${projects.map(project => this.renderProjectCard(project)).join('')}
                    </div>
                </div>
            `;
        }
        
        searchResultsContainer.innerHTML = resultsHTML;
        searchResultsContainer.style.display = 'block';
        
        // Hide original sections when showing search results
        this.hideOriginalSections();
    }
    
    renderStudentCard(student) {
        return `
            <div class="result-card student-card">
                <div class="card-header">
                    <h5>${student.voornaam} ${student.achternaam}</h5>
                    <span class="student-number">${student.studentnummer}</span>
                </div>
                <div class="card-content">
                    <p><strong>Opleiding:</strong> ${student.opleiding || 'Niet opgegeven'}</p>
                    <p><strong>Richting:</strong> ${student.opleidingsrichting || 'Niet opgegeven'}</p>
                    <p><strong>Gemeente:</strong> ${student.gemeente || 'Niet opgegeven'}</p>
                    ${student.projectTitel ? `<p><strong>Project:</strong> ${student.projectTitel}</p>` : ''}
                    ${student.talen ? `<p><strong>Talen:</strong> ${student.talen.join(', ')}</p>` : ''}
                    ${student.technologieen ? `<p><strong>Technologieën:</strong> ${student.technologieen}</p>` : ''}
                </div>
                <div class="card-actions">
                    <a href="/zoekbalk-studenten?id=${student.studentnummer}" target="_blank" class="btn btn-primary">Bekijk Profiel</a>
                </div>
            </div>
        `;
    }
    
    renderCompanyCard(company) {
        return `
            <div class="result-card company-card">
                <div class="card-header">
                    <h5>${company.naam}</h5>
                    <span class="company-number">${company.bedrijfsnummer}</span>
                </div>
                <div class="card-content">
                    <p><strong>Sector:</strong> ${company.sector || 'Niet opgegeven'}</p>
                    <p><strong>Gemeente:</strong> ${company.gemeente || 'Niet opgegeven'}</p>
                    <p><strong>Contactpersoon:</strong> ${company.contactpersoon || 'Niet opgegeven'}</p>
                    ${company.beschrijving ? `<p><strong>Beschrijving:</strong> ${company.beschrijving}</p>` : ''}
                </div>
                <div class="card-actions">
                    <a href="/resultaat-bedrijf?id=${company.bedrijfsnummer}" target="_blank" class="btn btn-primary">Bekijk Bedrijf</a>
                </div>
            </div>
        `;
    }
    
    renderProjectCard(project) {
        // Gebruik de eerste student-ID als die bestaat, anders projecttitel als fallback
        let firstStudentId = null;
        if (project.studenten && Array.isArray(project.studenten) && project.studenten.length > 0) {
            firstStudentId = project.studenten[0].id || project.studenten[0].studentnummer;
        }
        let linkHref = '#';
        if (firstStudentId) {
            linkHref = `/zoekbalk-projecten?id=${firstStudentId}`;
        } else if (project.titel) {
            linkHref = `/alle-projecten?search=${encodeURIComponent(project.titel)}`;
        }
        return `
            <div class="result-card project-card">
                <div class="card-header">
                    <h5>${project.titel}</h5>
                    <span class="project-type">Project</span>
                </div>
                <div class="card-content">
                    <p><strong>Beschrijving:</strong> ${project.beschrijving || 'Geen beschrijving beschikbaar'}</p>
                    ${project.technologieen ? `<p><strong>Technologieën:</strong> ${project.technologieen}</p>` : ''}
                    ${project.studenten && project.studenten.length > 0 ? 
                        `<p><strong>Studenten:</strong> ${project.studenten.map(s => s.naam).join(', ')}</p>` : ''}
                </div>
                <div class="card-actions">
                    <a href="${linkHref}" target="_blank" class="btn btn-primary">Bekijk Project</a>
                </div>
            </div>
        `;
    }
    
    hideOriginalSections() {
        // Hide the original card sections when showing search results
        const sectionsToHide = [
            '.bedrijven .cardList',
            '.studenten .cardList',
            '.projecten .cardList'
        ];
        
        sectionsToHide.forEach(selector => {
            const section = document.querySelector(selector);
            if (section) {
                section.style.display = 'none';
            }
        });
    }
    
    showOriginalSections() {
        // Show the original card sections when clearing search results
        const sectionsToShow = [
            '.bedrijven .cardList',
            '.studenten .cardList',
            '.projecten .cardList'
        ];
        
        sectionsToShow.forEach(selector => {
            const section = document.querySelector(selector);
            if (section) {
                section.style.display = 'grid';
            }
        });
    }
    
    clearFilters() {
        console.log('🧹 Clearing all filters');
        
        // Reset all filters
        this.currentFilters = {
            search: '',
            jaar: 'Alle jaren',
            specialization: 'Alle',
            taal: 'Alle talen',
            sector: 'Alle sectoren',
            technologie: []
        };
        
        // Reset UI elements
        const filterSection = document.querySelector('.student-filter-section');
        if (filterSection) {
            // Reset search input
            const searchInput = filterSection.querySelector('.search-input');
            if (searchInput) searchInput.value = '';
            
            // Reset year select (first filter-select)
            const yearSelect = filterSection.querySelectorAll('.filter-select')[0];
            if (yearSelect) yearSelect.value = 'Alle jaren';
            
            // Reset taal select (second filter-select)
            const taalSelect = filterSection.querySelectorAll('.filter-select')[1];
            if (taalSelect) taalSelect.value = 'Alle talen';
            
            // Reset sector select (third filter-select)
            const sectorSelect = filterSection.querySelectorAll('.filter-select')[2];
            if (sectorSelect) sectorSelect.value = 'Alle sectoren';
            
            // Reset specialization pills
            const pills = filterSection.querySelectorAll('.specialization-pill');
            pills.forEach(pill => pill.classList.remove('active'));
            const firstPill = pills[0];
            if (firstPill) firstPill.classList.add('active');
            
            // Reset technology pills
            const techPills = filterSection.querySelectorAll('.technology-pill');
            techPills.forEach(pill => pill.classList.remove('active'));
        }
        
        // Hide search results
        const searchResultsContainer = document.getElementById('searchResults');
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.style.display = 'none';
        }
        
        // Show original sections
        this.showOriginalSections();
        
        console.log('✅ All filters cleared and original sections restored');
    }

    setupSearchSuggestions() {
        const searchInput = document.querySelector('.search-input');
        let datalist = document.getElementById('search-suggestions');
        if (!searchInput) return;
        
        // Voeg datalist toe als die nog niet bestaat
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'search-suggestions';
            document.body.appendChild(datalist);
        }
        
        // Verzamel suggesties uit alles
        const names = [
            ...this.students.map(s => s.voornaam + ' ' + s.achternaam),
            ...this.companies.map(c => c.naam),
            ...this.projects.map(p => p.titel)
        ];
        
        const techs = [
            ...this.students.flatMap(s => (s.technologieen || '').split(/,|;/).map(t => t.trim())),
            ...this.projects.flatMap(p => (p.technologieen || '').split(/,|;/).map(t => t.trim()))
        ];
        
        const opleidingen = [
            ...this.students.map(s => s.opleiding),
            ...this.students.map(s => s.opleidingsrichting)
        ];
        
        const sectoren = [
            ...this.companies.map(c => c.sector)
        ];
        
        const talen = [
            ...this.students.flatMap(s => s.talen || [])
        ];
        
        // Voeg alles samen en filter op unieke, niet-lege waarden
        const allSuggestions = Array.from(new Set([
            ...names,
            ...techs,
            ...opleidingen,
            ...sectoren,
            ...talen
        ].map(s => (s || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'nl'));
        
        datalist.innerHTML = allSuggestions.map(s => `<option value="${s}">`).join('');
        searchInput.setAttribute('list', 'search-suggestions');
        
        // Direct filteren bij selectie of enter
        searchInput.addEventListener('change', (e) => {
            this.currentFilters.search = e.target.value;
            this.applyFilters();
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            }
        });
    }
}

// Make FilterService available globally
window.FilterService = FilterService;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterService;
} 