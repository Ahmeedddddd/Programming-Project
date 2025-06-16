// src/JS/index.js - Production version met carousel en database projecten

// ===== GLOBAL VARIABLES =====
let dataFetcher;
let carouselManager;
let allCompanies = [];
let allStudents = [];
let allProjects = [];

// ===== DATA FETCHING CLASS =====
class HomepageDataFetcher {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3301/api';
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log('🚀 HomepageDataFetcher initialized');
    }

    // Show loading state
    showLoading() {
        this.isLoading = true;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // API fetch with retry logic
    async fetchAPI(endpoint, options = {}) {
        const url = `${this.API_BASE_URL}${endpoint}`;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000,
                    ...options
                });

                if (!response.ok) {
                    let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.message) {
                            errorDetails += ` - ${errorData.message}`;
                        }
                    } catch (e) {
                        // Response is not JSON
                    }
                    throw new Error(errorDetails);
                }

                const data = await response.json();
                return data;
                
            } catch (error) {
                if (attempt === this.maxRetries) {
                    throw error;
                }
                
                // Wait before retry
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Test backend connectivity
    async testBackend() {
        try {
            const response = await this.fetchAPI('/health');
            return true;
        } catch (error) {
            console.error('❌ Backend connectivity test failed:', error);
            this.showError('connectivity', `Backend server is niet bereikbaar: ${error.message}`);
            return false;
        }
    }

    // Fetch statistics
    async fetchStats() {
        try {
            const stats = await this.fetchAPI('/stats');
            
            if (stats.warnings && stats.warnings.length > 0) {
                console.warn('⚠️ Stats warnings:', stats.warnings);
            }
            
            this.updateCounts(stats);
            return stats;
        } catch (error) {
            console.error('❌ Failed to fetch stats:', error);
            const fallbackStats = {
                studenten: 0,
                bedrijven: 0,
                afspraken: 0,
                projecten: 0
            };
            this.updateCounts(fallbackStats);
            return fallbackStats;
        }
    }

    // Fetch companies
    async fetchCompanies() {
        try {
            const response = await this.fetchAPI('/bedrijven');
            
            let companies = [];
            if (response.success && Array.isArray(response.data)) {
                companies = response.data;
            } else if (Array.isArray(response)) {
                companies = response;
            }
            
            allCompanies = companies;
            return companies;
        } catch (error) {
            console.error('❌ Failed to fetch companies:', error);
            this.showError('bedrijven', `Kon bedrijven niet laden: ${error.message}`);
            return [];
        }
    }

    // Fetch students
    async fetchStudents() {
        try {
            const response = await this.fetchAPI('/studenten');
            
            let students = [];
            if (response.success && Array.isArray(response.data)) {
                students = response.data;
            } else if (Array.isArray(response)) {
                students = response;
            }
            
            allStudents = students;
            return students;
        } catch (error) {
            console.error('❌ Failed to fetch students:', error);
            this.showError('studenten', `Kon studenten niet laden: ${error.message}`);
            return [];
        }
    }

    // Fetch projects from database
    async fetchProjects() {
        try {
            const response = await this.fetchAPI('/projecten');
            
            let projects = [];
            if (response.success && Array.isArray(response.data)) {
                projects = response.data;
            } else if (Array.isArray(response)) {
                projects = response;
            }
            
            allProjects = projects;
            return projects;
        } catch (error) {
            console.error('❌ Failed to fetch projects from database:', error);
            
            // Fallback to static projects
            allProjects = this.getStaticProjects();
            return allProjects;
        }
    }

    // Fallback static projects
    getStaticProjects() {
        return [
            {
                id: 'static-1',
                naam: "Kokende AI Robot",
                beschrijving: "De Kokende AI Robot is een slimme, zelfdenkende keukenrobot die volledig autonoom heerlijke maaltijden bereidt op maat van jouw voorkeuren en allergieën."
            },
            {
                id: 'static-2',
                naam: "SmartLine Inspector", 
                beschrijving: "SmartLine Inspector is een vision-gebaseerd edge-systeem voor kwaliteitscontrole in productielijnen. Door gebruik te maken van edge computing en AI worden defecte producten automatisch herkend."
            },
            {
                id: 'static-3',
                naam: "NeuroTrack",
                beschrijving: "NeuroTrack is een draagbare EEG-headset die hersenactiviteit in realtime meet tijdens sportprestaties of meditatie. Het toestel analyseert focus, stressniveau en cognitieve belasting."
            },
            {
                id: 'static-4',
                naam: "ARchitect Viewer",
                beschrijving: "ARchitect Viewer is een augmented reality-oplossing waarmee architecten hun 3D-modellen direct op een bouwlocatie kunnen projecteren via een tablet of AR-bril."
            }
        ];
    }

    // Update counters with animation
    updateCounts(stats) {
        document.querySelectorAll('[data-count]').forEach(element => {
            const parentTitle = element.closest('.section-title');
            if (!parentTitle) return;
            
            const titleText = parentTitle.textContent.toLowerCase();
            let targetValue = 0;
            
            if (titleText.includes('bedrijf')) {
                targetValue = stats.bedrijven || allCompanies.length || 0;
            } else if (titleText.includes('student')) {
                targetValue = stats.studenten || allStudents.length || 0;
            } else if (titleText.includes('project')) {
                targetValue = stats.projecten || allProjects.length || 0;
            }
            
            this.animateCounter(element, targetValue);
        });
    }

    // Animate counter
    animateCounter(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue === targetValue) return;
        
        const duration = 2000;
        const frameRate = 60;
        const totalFrames = (duration / 1000) * frameRate;
        const increment = (targetValue - currentValue) / totalFrames;
        
        let frame = 0;
        const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentDisplayValue = Math.round(currentValue + (increment * frame * easeOutProgress));
            
            element.textContent = Math.min(currentDisplayValue, targetValue);
            
            if (frame >= totalFrames) {
                clearInterval(timer);
                element.textContent = targetValue;
            }
        }, 1000 / frameRate);
    }

    // Show error notification
    showError(section, message) {
        console.error(`❌ Error in ${section}:`, message);
        
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-content">
                <strong>Fout bij laden van ${section}</strong>
                <p>${message}</p>
                <div class="error-actions">
                    <button onclick="window.refreshHomepageData()" class="error-retry">Opnieuw proberen</button>
                </div>
            </div>
            <button class="error-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 15 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 15000);
    }

    // Main data loading function
    async loadHomepageData() {
        console.log('🎯 Loading homepage data...');
        this.showLoading();

        try {
            // Test backend connectivity first
            const backendOnline = await this.testBackend();
            if (!backendOnline) {
                throw new Error('Backend server niet bereikbaar');
            }

            // Fetch all data including projects from database
            const [stats, companies, students, projects] = await Promise.allSettled([
                this.fetchStats(),
                this.fetchCompanies(),
                this.fetchStudents(),
                this.fetchProjects()
            ]);

            // Process results
            const results = {
                stats: stats.status === 'fulfilled' ? stats.value : null,
                companies: companies.status === 'fulfilled' ? companies.value : [],
                students: students.status === 'fulfilled' ? students.value : [],
                projects: projects.status === 'fulfilled' ? projects.value : []
            };
            
            console.log('✅ Homepage data loading completed');
            console.log('📊 Results summary:', {
                stats: results.stats ? 'success' : 'failed',
                companies: `${results.companies.length} companies`,
                students: `${results.students.length} students`,
                projects: `${results.projects.length} projects`
            });

            // Initialize carousel with all fetched data
            if (carouselManager) {
                carouselManager.updateData(results.companies, results.students, results.projects);
            }

        } catch (error) {
            console.error('❌ Failed to load homepage data:', error);
            this.showError('general', `Er is een fout opgetreden: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }
}

// ===== CAROUSEL MANAGER =====
class CarouselManager {
    constructor() {
        this.currentCompanyIndex = 0;
        this.currentStudentIndex = 0;
        this.currentProjectIndex = 0;
        this.itemsPerPage = 4;
        this.autoRotateInterval = null;
        this.isAutoRotating = true;
        
        console.log('🎠 CarouselManager initialized');
    }

    // Update data
    updateData(companies, students, projects) {
        allCompanies = companies || [];
        allStudents = students || [];
        allProjects = projects || [];
        
        this.renderAllCarousels();
        this.startAutoRotation();
    }

    // Render all carousels
    renderAllCarousels() {
        this.renderCompanyCarousel();
        this.renderStudentCarousel();
        this.renderProjectCarousel();
    }

    // Render company carousel
    renderCompanyCarousel() {
        const companiesGrid = document.querySelector('.main-grid .section-container:first-child .card-grid');
        if (!companiesGrid) return;

        const displayCompanies = this.getDisplayItems(allCompanies, this.currentCompanyIndex);
        
        companiesGrid.style.opacity = '0';
        setTimeout(() => {
            companiesGrid.innerHTML = '';
            
            if (displayCompanies.length === 0) {
                companiesGrid.innerHTML = '<p class="no-data">Geen bedrijven beschikbaar</p>';
            } else {
                displayCompanies.forEach((company, index) => {
                    const card = this.createCompanyCard(company);
                    card.style.animationDelay = `${index * 0.1}s`;
                    companiesGrid.appendChild(card);
                });
            }
            
            companiesGrid.style.opacity = '1';
        }, 300);
    }

    // Render student carousel
    renderStudentCarousel() {
        const studentsGrid = document.querySelector('.main-grid .section-container:last-child .card-grid');
        if (!studentsGrid) return;

        const displayStudents = this.getDisplayItems(allStudents, this.currentStudentIndex);
        
        studentsGrid.style.opacity = '0';
        setTimeout(() => {
            studentsGrid.innerHTML = '';
            
            if (displayStudents.length === 0) {
                studentsGrid.innerHTML = '<p class="no-data">Geen studenten beschikbaar</p>';
            } else {
                displayStudents.forEach((student, index) => {
                    const card = this.createStudentCard(student);
                    card.style.animationDelay = `${index * 0.1}s`;
                    studentsGrid.appendChild(card);
                });
            }
            
            studentsGrid.style.opacity = '1';
        }, 300);
    }

    // Render project carousel
    renderProjectCarousel() {
        const projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid) return;

        const displayProjects = this.getDisplayItems(allProjects, this.currentProjectIndex);
        
        projectsGrid.style.opacity = '0';
        setTimeout(() => {
            projectsGrid.innerHTML = '';
            
            if (displayProjects.length === 0) {
                projectsGrid.innerHTML = '<p class="no-data">Geen projecten beschikbaar</p>';
            } else {
                displayProjects.forEach((project, index) => {
                    const card = this.createProjectCard(project);
                    card.style.animationDelay = `${index * 0.1}s`;
                    projectsGrid.appendChild(card);
                });
            }
            
            projectsGrid.style.opacity = '1';
        }, 300);
    }

    // Get items to display
    getDisplayItems(items, startIndex) {
        if (!items || items.length === 0) return [];
        
        const result = [];
        for (let i = 0; i < this.itemsPerPage; i++) {
            const index = (startIndex + i) % items.length;
            result.push(items[index]);
        }
        return result;
    }

    // Create company card
    createCompanyCard(company) {
        const card = document.createElement('a');
        card.href = `/resultaatBedrijf?id=${company.id || company.bedrijfsnummer}`;
        card.className = 'preview-card carousel-card';
        
        const name = company.naam || company.bedrijfsnaam || 'Onbekend bedrijf';
        const description = company.beschrijving || company.bechrijving || company.omschrijving || 'Geen beschrijving beschikbaar';
        const truncatedDesc = description.length > 150 ? 
            description.substring(0, 150) + '...' : description;
        
        card.innerHTML = `
            <h3 class="card-title">${name}</h3>
            <p class="card-description">${truncatedDesc}</p>
        `;
        
        return card;
    }

    // Create student card
    createStudentCard(student) {
        const card = document.createElement('a');
        card.href = `/zoekbalkStudenten?id=${student.id || student.studentnummer}`;
        card.className = 'preview-card carousel-card';
        
        const name = student.naam || 
                    `${student.voornaam || ''} ${student.achternaam || ''}`.trim() ||
                    'Onbekende student';
        
        const description = student.beschrijving || 
                          student.overMezelf ||
                          student.bio || 
                          student.omschrijving ||
                          'Nog geen beschrijving toegevoegd';
        
        const truncatedDesc = description.length > 150 ? 
            description.substring(0, 150) + '...' : description;
        
        card.innerHTML = `
            <h3 class="card-title">${name}</h3>
            <p class="card-description">${truncatedDesc}</p>
        `;
        
        return card;
    }

    // Create project card
    createProjectCard(project) {
        const card = document.createElement('a');
        card.href = `/zoekbalkProjecten?id=${project.id}`;
        card.className = 'project-card carousel-card';
        
        const name = project.naam || project.projectTitel || 'Onbekend project';
        const description = project.beschrijving || project.projectBeschrijving || 'Geen beschrijving beschikbaar';
        const truncatedDesc = description.length > 200 ? 
            description.substring(0, 200) + '...' : description;
        
        // Add student info if available (for database projects)
        let studentInfo = '';
        if (project.studentNaam) {
            studentInfo = `<div class="project-student">Door: ${project.studentNaam}</div>`;
        }
        
        card.innerHTML = `
            <h3 class="project-title">${name}</h3>
            <p class="project-description">${truncatedDesc}</p>
            ${studentInfo}
        `;
        
        return card;
    }

    // Start auto rotation
    startAutoRotation() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
        }
        
        this.autoRotateInterval = setInterval(() => {
            if (this.isAutoRotating) {
                this.rotateNext();
            }
        }, 5000); // Rotate every 5 seconds
    }

    // Rotate to next items
    rotateNext() {
        this.currentCompanyIndex = (this.currentCompanyIndex + this.itemsPerPage) % Math.max(allCompanies.length, 1);
        this.currentStudentIndex = (this.currentStudentIndex + this.itemsPerPage) % Math.max(allStudents.length, 1);
        this.currentProjectIndex = (this.currentProjectIndex + this.itemsPerPage) % Math.max(allProjects.length, 1);
        
        this.renderAllCarousels();
    }
}

// ===== SCROLL TO TOP BUTTON =====
function createScrollToTopButton() {
    const existingButton = document.getElementById('scrollToTopBtn');
    if (existingButton) {
        existingButton.remove();
    }

    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↑';
    scrollButton.id = 'scrollToTopBtn';
    scrollButton.title = 'Terug naar boven';
    
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 25px;
        right: 25px;
        background: #881538;
        color: white;
        border: none;
        border-radius: 8px;
        width: 50px;
        height: 50px;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(136, 21, 56, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    scrollButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    scrollButton.addEventListener('mouseenter', () => {
        scrollButton.style.background = '#A91B47';
        scrollButton.style.transform = 'scale(1.1)';
    });

    scrollButton.addEventListener('mouseleave', () => {
        scrollButton.style.background = '#881538';
        scrollButton.style.transform = 'scale(1)';
    });

    document.body.appendChild(scrollButton);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollButton.style.opacity = '1';
            scrollButton.style.visibility = 'visible';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.visibility = 'hidden';
        }
    });
}

// ===== ANIMATIONS & HOVER EFFECTS =====
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    const animatableElements = [
        ...document.querySelectorAll('.aboutSection'),
        ...document.querySelectorAll('.searchSection'),
        ...document.querySelectorAll('.content-sections'),
        ...document.querySelectorAll('.section-card'),
        ...document.querySelectorAll('.section-container'),
        ...document.querySelectorAll('.projects-section'),
        ...document.querySelectorAll('.main-grid')
    ];

    animatableElements.forEach((element, index) => {
        if (!element.classList.contains('no-animate')) {
            element.style.opacity = "0";
            element.style.transform = "translateY(30px)";
            element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(element);
        }
    });
}

function initializeHoverEffects() {
    document.addEventListener('mouseenter', (e) => {
        if (e.target.matches('.preview-card, .project-card')) {
            e.target.style.transform = 'translateY(-8px) scale(1.02)';
            e.target.style.boxShadow = '0 15px 35px rgba(136, 21, 56, 0.2)';
        }
    }, true);

    document.addEventListener('mouseleave', (e) => {
        if (e.target.matches('.preview-card, .project-card')) {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '';
        }
    }, true);
}

// ===== MAIN INITIALIZATION =====
async function initIndexAnimations() {
    console.log('🎯 Initializing homepage...');
    
    try {
        dataFetcher = new HomepageDataFetcher();
        carouselManager = new CarouselManager();
        
        createScrollToTopButton();
        initializeAnimations();
        initializeHoverEffects();
        
        await dataFetcher.loadHomepageData();
        
        console.log('✅ Homepage initialization completed');
        
    } catch (error) {
        console.error('❌ Failed to initialize homepage:', error);
    }
}

// ===== STARTUP =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndexAnimations);
} else {
    initIndexAnimations();
}

// ===== GLOBAL FUNCTIONS =====
window.refreshHomepageData = () => {
    console.log('🔄 Manual refresh triggered');
    if (dataFetcher) {
        dataFetcher.loadHomepageData();
    }
};

window.debugCarousel = () => {
    console.log('🎠 Carousel Info:', {
        companies: allCompanies.length,
        students: allStudents.length,
        projects: allProjects.length,
        currentIndices: {
            company: carouselManager?.currentCompanyIndex,
            student: carouselManager?.currentStudentIndex,
            project: carouselManager?.currentProjectIndex
        }
    });
};

console.log('✅ Homepage script loaded with database projects and carousel');