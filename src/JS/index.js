// src/JS/index.js - COMPLETE WORKING VERSION - HERSTELD & OPGESCHOOND

/**
 *  UNIVERSAL HOMEPAGE INITIALIZER - COMPLETE WORKING VERSION
 * 
 * Herstelde versie gebaseerd op de feedback van de gebruiker.
 * Deze versie focust op de universele logica voor alle homepages.
 * Pagina-specifieke logica is verplaatst naar de respectievelijke bestanden.
 * 
 * Fixed:
 *  Data count showing total numbers (not carousel items)
 *  Project grouping using backend grouped projects
 *  TafelNr information display
 *  Proper debugging and error handling
 *  Uses backend grouped projects properly
 */

// ===== GLOBAL VARIABLES =====
let universalInitializer;

// ===== NOTIFICATIE POLLING =====
let notificationPollingInterval = null;

// ===== CONFIGURATION =====
const API_CONFIG = {
    baseURL: 'http://localhost:8383',
    endpoints: {
        studenten: '/api/studenten',
        bedrijven: '/api/bedrijven',
        projecten: '/api/projecten',
        stats: '/api/stats'
    },
    timeout: 10000
};

// ===== HOMEPAGE TYPE DETECTION =====
class HomepageTypeDetector {
    static getCurrentType() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'guest';
        if (path.includes('student-homepage')) return 'student';
        if (path.includes('bedrijf-homepage')) return 'bedrijf';
        if (path.includes('organisator-homepage')) return 'organisator';
        return 'unknown';
    }

    static shouldCheckAuth() {
        return this.getCurrentType() === 'guest';
    }

    static getDataEndpoints() {
        return {
            studenten: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.studenten}`,
            bedrijven: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.bedrijven}`,
            projecten: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.projecten}`,
        };
    }

    static getUISelectors() {
        return {
            bedrijven: { container: '#companyCardsContainer' },
            studenten: { container: '#studentCardsContainer' },
            projecten: { container: '#projectCardsContainer' }
        };
    }
}

// ===== AUTH CHECKER =====
class AuthChecker {
    static checkAuthAndRedirect() {
        const authToken = localStorage.getItem('authToken');
        const userType = localStorage.getItem('userType');
        const currentPath = window.location.pathname;
        if (authToken && userType && (currentPath === '/' || currentPath === '/index.html')) {
            const targetPath = {
                student: '/student-homepage',
                bedrijf: '/bedrijf-homepage',
                organisator: '/organisator-homepage'
            }[userType];

            if (targetPath) {
                window.location.replace(targetPath);
                return true;
            }
        }
        return false;
    }
}

// ===== DATA FETCHER =====
class UniversalDataFetcher {
    constructor() {
        this.endpoints = HomepageTypeDetector.getDataEndpoints();
        this.data = { bedrijven: [], studenten: [], projecten: [] };
    }

    async fetchAPI(endpoint) {
        try {
            const response = await fetch(endpoint, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) return { success: false, data: [] };
            const result = await response.json();
            return Array.isArray(result) ? { success: true, data: result } : result;
        } catch (error) {
            return { success: false, data: [] };
        }
    }

    async fetchAllData() {
        const [bedrijvenRes, studentenRes, projectenRes] = await Promise.all([
            this.fetchAPI(this.endpoints.bedrijven),
            this.fetchAPI(this.endpoints.studenten),
            this.fetchAPI(this.endpoints.projecten)
        ]);
        this.data.bedrijven = bedrijvenRes.success ? bedrijvenRes.data : [];
        this.data.studenten = studentenRes.success ? studentenRes.data : [];
        this.data.projecten = projectenRes.success ? projectenRes.data : [];
    }

    getData(type) {
        return type ? this.data[type] : this.data;
    }
}

// ===== CAROUSEL MANAGER =====
class CarouselManager {
    constructor(type, allItems, cardRenderer) {
        this.type = type;
        this.allItems = allItems;
        this.cardRenderer = cardRenderer;
        this.startIndex = 0;
        this.itemsPerView = 4;
        this.interval = null;
    }

    startAutoRotation() {
        if (this.allItems.length <= this.itemsPerView) return;
        this.interval = setInterval(() => this.rotateNext(), 5000);
    }

    stopAutoRotation() {
        clearInterval(this.interval);
    }

    rotateNext() {
        const nextIndex = this.startIndex + this.itemsPerView;
        this.startIndex = nextIndex >= this.allItems.length ? 0 : nextIndex;
        const itemsToShow = this.allItems.slice(this.startIndex, this.startIndex + this.itemsPerView);
        this.cardRenderer.renderWithTransition(this.type, itemsToShow);
    }
}

// ===== CARD RENDERER =====
class CardRenderer {
    constructor() {
        this.uiSelectors = HomepageTypeDetector.getUISelectors();
    }

    render(type, items) {
        const config = {
            bedrijven: { selector: this.uiSelectors.bedrijven.container, renderFunc: this.renderCompanyCard },
            studenten: { selector: this.uiSelectors.studenten.container, renderFunc: this.renderStudentCard },
            projecten: { selector: this.uiSelectors.projecten.container, renderFunc: this.renderProjectCard }
        };
        const { selector, renderFunc } = config[type] || {};
        const container = selector ? document.querySelector(selector) : null;
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="no-data">Geen gegevens beschikbaar.</p>';
            return;
        }
        container.innerHTML = items.map(renderFunc.bind(this)).join('');
    }

    renderWithTransition(type, items) {
        const container = document.querySelector(this.uiSelectors[type].container);
        if (!container) return;
        container.style.transition = 'opacity 0.4s ease-out';
        container.style.opacity = '0';
        setTimeout(() => {
            this.render(type, items);
            container.style.opacity = '1';
        }, 400);
    }

    renderCompanyCard(bedrijf) {
        return `
            <div class="preview-card">
                <div class="card-header">
                    <h3 class="card-title">${bedrijf.naam}</h3>
                    ${bedrijf.tafelNr ? `<div class="table-number">Tafel ${bedrijf.tafelNr}</div>` : ''}
                </div>
                <p class="card-description">${bedrijf.bechrijving || 'Geen beschrijving.'}</p>
                <div class="company-details">
                    <div class="company-location"><span><i class="fas fa-map-marker-alt"></i> ${bedrijf.gemeente || 'Onbekend'}</span></div>
                    <div class="company-contact"><span><i class="fas fa-envelope"></i> ${bedrijf.email}</span></div>
                </div>
                <div class="bedrijf-sector"><span><i class="fas fa-briefcase"></i> ${bedrijf.sector || 'N/A'}</span></div>
            </div>`;
    }

    renderStudentCard(student) {
        return `
            <div class="preview-card">
                <div class="card-header">
                    <h3 class="card-title">${student.voornaam} ${student.achternaam}</h3>
                </div>
                <p class="card-description">${student.overMezelf || 'Geen beschrijving.'}</p>
                 <div class="student-details">
                    <div class="student-specialization"><span><i class="fas fa-graduation-cap"></i> ${student.opleiding || ''} ${student.opleidingsrichting || ''}</span></div>
                    <div class="student-year"><span><i class="fas fa-calendar-alt"></i> Jaar ${student.leerjaar || 'N/A'}</span></div>
                    <div class="student-location"><span><i class="fas fa-map-marker-alt"></i> ${student.gemeente || 'Onbekend'}</span></div>
                </div>
                <div class="student-project"><span><i class="fas fa-lightbulb"></i> ${student.projectTitel || 'Geen project'}</span></div>
            </div>`;
    }

    renderProjectCard(project) {
        // Handle different student data formats
        let studentenList = [];
        
        if (Array.isArray(project.studenten)) {
            // If it's already an array of objects
            studentenList = project.studenten.map(student => ({
                naam: `${student.voornaam} ${student.achternaam}`,
                ...student
            }));
        } else if (typeof project.studenten === 'string' && project.studenten) {
            // If it's a comma-separated string, split it
            studentenList = project.studenten.split(', ').map(name => ({ naam: name.trim() }));
        }
        
        const studentenHTML = studentenList.length > 1
            ? `<div class="project-students-multiple">
                 <strong>Teamleden (${studentenList.length}):</strong>
                 <div class="student-names">${studentenList.map(s => `<span><i class="fas fa-user"></i> ${s.naam}</span>`).join('')}</div>
               </div>`
            : studentenList.length === 1
            ? `<div class="project-student-single">
                 <span><i class="fas fa-user"></i> ${studentenList[0]?.naam || 'N/A'}</span>
               </div>`
            : `<div class="project-student-single">
                 <span><i class="fas fa-user"></i> Geen studenten toegewezen</span>
               </div>`;

        return `
            <div class="project-card">
                <div class="card-header">
                    <h3 class="project-title">${project.titel || project.projectTitel}</h3>
                    ${project.tafelNr ? `<div class="table-number">Tafel ${project.tafelNr}</div>` : ''}
                </div>
                <p class="project-description">${project.beschrijving || project.projectBeschrijving || 'Geen beschrijving.'}</p>
                ${studentenHTML}
                ${project.technologieen ? `<div class="project-tech"><strong>Technologieën:</strong> ${project.technologieen}</div>` : ''}
            </div>`;
    }

    updateDataCounts(data) {
        const bedrijvenCount = document.querySelector('[data-count="bedrijven"]');
        if (bedrijvenCount) {
            bedrijvenCount.textContent = data.bedrijven?.length ?? 0;
        }

        const studentenCount = document.querySelector('[data-count="studenten"]');
        if (studentenCount) {
            studentenCount.textContent = data.studenten?.length ?? 0;
        }

        const projectenCount = document.querySelector('[data-count="projecten"]');
        if (projectenCount) {
            projectenCount.textContent = data.projecten?.length ?? 0;
        }
    }
}

// ===== HOMEPAGE INITIALIZER =====
class UniversalHomepageInitializer {
    constructor() {
        this.dataFetcher = new UniversalDataFetcher();
        this.cardRenderer = new CardRenderer();
        this.carouselManagers = {};
    }

    async init() {
        try {
            console.log('🚀 Initializing universal homepage...');
            
            // Check auth and redirect if needed
            if (AuthChecker.checkAuthAndRedirect()) {
                return;
            }

            // Fetch all data
            await this.dataFetcher.fetchAllData();
            
            // Initialize carousels for each section
            this.initializeCarousels();
            
            // Render initial cards
            this.renderAllCards();
            
            // Update data counts
            this.updateDataCounts();
            
            // Start notification polling
            startNotificationPolling();
            
            console.log('✅ Universal homepage initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing universal homepage:', error);
        }
    }

    initializeCarousels() {
        const dataTypes = ['bedrijven', 'studenten', 'projecten'];
        
        dataTypes.forEach(type => {
            const items = this.dataFetcher.getData(type);
            
            // Only create carousel if there are more than 4 items
            if (items && items.length > 4) {
                this.carouselManagers[type] = new CarouselManager(type, items, this.cardRenderer);
                this.carouselManagers[type].startAutoRotation();
                console.log(`🎠 Carousel initialized for ${type} with ${items.length} items`);
            } else {
                console.log(`📊 No carousel needed for ${type} (${items?.length || 0} items)`);
            }
        });
    }

    renderAllCards() {
        // Render first 4 items for each section initially
        const dataTypes = ['bedrijven', 'studenten', 'projecten'];
        
        dataTypes.forEach(type => {
            const items = this.dataFetcher.getData(type);
            if (items && items.length > 0) {
                // Show first 4 items initially
                const itemsToShow = items.slice(0, 4);
                this.cardRenderer.render(type, itemsToShow);
                console.log(`🎨 Rendered ${itemsToShow.length} ${type} cards`);
            } else {
                this.cardRenderer.render(type, []);
            }
        });
    }

    updateDataCounts() {
        const data = this.dataFetcher.getData();
        this.cardRenderer.updateDataCounts(data);
    }
}

function initUniversalHomepage() {
    universalInitializer = new UniversalHomepageInitializer();
    universalInitializer.init();
}

document.addEventListener('DOMContentLoaded', initUniversalHomepage);

// ===== NOTIFICATION POLLING (Simplified) =====
async function fetchAndShowNotifications() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
        const res = await fetch('/api/notificaties/unread', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            for (const notif of data.data) {
                if (window.showNotification) {
                    window.showNotification(notif.boodschap, 'info');
                }
                await fetch(`/api/notificaties/${notif.notificatieId}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
            }
        }
    } catch (e) { /* Silent fail */ }
}

function startNotificationPolling() {
    if (notificationPollingInterval) clearInterval(notificationPollingInterval);
    notificationPollingInterval = setInterval(fetchAndShowNotifications, 30000);
    fetchAndShowNotifications();
}

function stopNotificationPolling() {
    clearInterval(notificationPollingInterval);
}
