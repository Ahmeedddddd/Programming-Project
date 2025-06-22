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
            bedrijven: { container: '#bedrijvenGrid' },
            studenten: { container: '#studentenGrid' },
            projecten: { container: '#projectsGrid' }
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
            console.log(`📡 [UniversalDataFetcher] Fetching: ${endpoint}`);
            
            // Use the new endpoint for projects to get student IDs
            if (endpoint.includes('/api/projecten') && !endpoint.includes('/with-ids')) {
                endpoint = endpoint.replace('/api/projecten', '/api/projecten/with-ids');
                console.log(`🔄 [UniversalDataFetcher] Redirected to: ${endpoint}`);
            }
            
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success === false) {
                throw new Error(data.message || 'API request failed');
            }
            
            // Return the data array directly from the response
            return data.data || data;
        } catch (error) {
            console.error(`❌ [UniversalDataFetcher] Error fetching ${endpoint}:`, error);
            throw error;
        }
    }

    async fetchAllData() {
        try {
            console.log('🔄 [index.js] Fetching all data...');
            
            const [bedrijvenRes, studentenRes, projectenRes] = await Promise.all([
                this.fetchAPI(this.endpoints.bedrijven),
                this.fetchAPI(this.endpoints.studenten),
                this.fetchAPI(this.endpoints.projecten)
            ]);
            
            console.log('📊 [index.js] Raw API responses:', {
                bedrijven: bedrijvenRes,
                studenten: studentenRes,
                projecten: projectenRes
            });
            
            // Fix: Handle both response formats (direct data or nested under success)
            this.data.bedrijven = bedrijvenRes || [];
            this.data.studenten = studentenRes || [];
            this.data.projecten = projectenRes || [];
            
            console.log('�� [index.js] Processed data:', {
                bedrijven: this.data.bedrijven.length,
                studenten: this.data.studenten.length,
                projecten: this.data.projecten.length
            });
            
            // Project data loaded successfully
            
            // Enhanced debugging for projects
            // console.log(`📊 [index.js] Projects data analysis:`, {
            //     totalProjects: this.data.projecten?.length || 0,
            //     projectsWithTechnologies: this.data.projecten?.filter(p => p.technologieen && p.technologieen.trim() !== '').length || 0,
            //     projectsWithoutTechnologies: this.data.projecten?.filter(p => !p.technologieen || p.technologieen.trim() === '').length || 0,
            //     sampleProject: this.data.projecten?.[0] ? {
            //         titel: this.data.projecten[0].titel || this.data.projecten[0].projectTitel,
            //         technologieen: this.data.projecten[0].technologieen,
            //         hasTechnologies: !!this.data.projecten[0].technologieen
            //     } : null
            // });
            
            // Log each project's technology status
            // if (this.data.projecten) {
            //     this.data.projecten.forEach((project, index) => {
            //         const hasTech = project.technologieen && project.technologieen.trim() !== '';
            //         console.log(`📋 [index.js] Project ${index + 1}: "${project.titel || project.projectTitel}" - Technologies: ${hasTech ? '✅' : '❌'} (${project.technologieen || 'null'})`);
            //     });
            // }
            
        } catch (error) {
            console.error('❌ [index.js] Error fetching data:', error);
        }
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
    constructor(dataFetcher = null) {
        this.dataFetcher = dataFetcher;
        this.uiSelectors = HomepageTypeDetector.getUISelectors();
    }

    render(type, items) {
        const config = {
            bedrijven: { selector: this.uiSelectors.bedrijven.container, renderFunc: this.renderCompanyCard },
            studenten: { selector: this.uiSelectors.studenten.container, renderFunc: this.renderStudentCard },
            projecten: { selector: this.uiSelectors.projecten.container, renderFunc: this.renderProjectCard },
        };
        const { selector, renderFunc } = config[type] || {};
        const container = selector ? document.querySelector(selector) : null;
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="no-data">Geen gegevens beschikbaar.</p>';
            return;
        }
        
        // Remove loading states
        const loadingElements = container.querySelectorAll('.no-data[id$="Loading"]');
        loadingElements.forEach(el => el.remove());
        
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
            <a href="/resultaat-bedrijf?id=${bedrijf.bedrijfsnummer}" class="preview-card" style="text-decoration: none; color: inherit; display: block;">
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
            </a>`;
    }

    renderStudentCard(student) {
        // Bepaal genre/soort project op basis van projectTitel
        const genre = this.getProjectGenre(student.projectTitel);
        const hasProject = !!student.projectTitel;
        return `
            <a href="/zoekbalk-studenten?id=${student.studentnummer}" class="preview-card" style="text-decoration: none; color: inherit; display: block;">
                <div class="card-header">
                    <h3 class="card-title">${student.voornaam} ${student.achternaam}</h3>
                </div>
                <p class="card-description">${student.overMezelf || 'Geen beschrijving.'}</p>
                 <div class="student-details">
                    <div class="student-specialization"><span><i class="fas fa-graduation-cap"></i> ${student.opleiding || ''} ${student.opleidingsrichting || ''}</span></div>
                    <div class="student-year"><span><i class="fas fa-calendar-alt"></i> Jaar ${student.leerjaar || 'N/A'}</span></div>
                    <div class="student-location"><span><i class="fas fa-map-marker-alt"></i> ${student.gemeente || 'Onbekend'}</span></div>
                </div>
                <div class="student-project">
                  ${hasProject
                    ? `<span class="student-project-badge ${genre.className}"><i class="fas fa-lightbulb"></i> ${student.projectTitel}</span>`
                    : `<span class="student-project-badge no-project"><i class="fas fa-lightbulb"></i> Geen project</span>`}
                </div>
            </a>`;
    }

    // Bepaal genre badge en kleur op basis van projectTitel
    getProjectGenre(projectTitel) {
        if (!projectTitel) return { className: 'no-project', label: 'Geen project' };
        const lower = projectTitel.toLowerCase();
        if (lower.includes('ai') || lower.includes('artificial intelligence')) return { className: 'genre-ai', label: 'AI' };
        if (lower.includes('biotech') || lower.includes('biotechnologie')) return { className: 'genre-biotech', label: 'Biotech' };
        if (lower.includes('duurzaam') || lower.includes('sustainab')) return { className: 'genre-duurzaam', label: 'Duurzame energie' };
        if (lower.includes('multimedia')) return { className: 'genre-multimedia', label: 'Multimedia' };
        if (lower.includes('security') || lower.includes('beveilig')) return { className: 'genre-security', label: 'Security' };
        if (lower.includes('iot')) return { className: 'genre-iot', label: 'IoT' };
        if (lower.includes('data') || lower.includes('big data')) return { className: 'genre-data', label: 'Data' };
        if (lower.includes('cloud')) return { className: 'genre-cloud', label: 'Cloud' };
        if (lower.includes('robot')) return { className: 'genre-robot', label: 'Robotica' };
        // Voeg meer genres toe indien gewenst
        return { className: 'genre-default', label: 'Project' };
    }

    renderProjectCard(project) {
        // Debug logging to understand data structure
        console.log('🔍 [DEBUG] Rendering project card:', {
            titel: project.titel || project.projectTitel,
            studenten: project.studenten,
            studentenType: typeof project.studenten,
            isArray: Array.isArray(project.studenten)
        });

        // Handle different student data formats
        let studentenList = [];
        
        if (Array.isArray(project.studenten)) {
            // New format from /api/projecten/with-ids: array of objects with id and naam
            studentenList = project.studenten.map(student => ({
                naam: student.naam || `${student.voornaam || ''} ${student.achternaam || ''}`.trim(),
                studentnummer: student.id || student.studentnummer,
                ...student
            }));
        } else if (typeof project.studenten === 'string' && project.studenten) {
            // Legacy format: comma-separated string, we need to find the actual student IDs
            const studentNames = project.studenten.split(', ').map(name => name.trim());
            console.log('🔍 [DEBUG] Looking up student names:', studentNames);
            
            // Get all student data to look up IDs
            const allStudents = this.dataFetcher ? this.dataFetcher.getData('studenten') : [];
            console.log('📊 [DEBUG] Available students count:', allStudents.length);
            
            studentenList = studentNames.map(name => {
                // Find the student by name with more flexible matching
                const foundStudent = allStudents.find(student => {
                    const fullName = `${student.voornaam} ${student.achternaam}`;
                    return fullName.toLowerCase() === name.toLowerCase() ||
                           fullName.toLowerCase().includes(name.toLowerCase()) ||
                           name.toLowerCase().includes(fullName.toLowerCase());
                });
                
                if (foundStudent) {
                    console.log('✅ [DEBUG] Exact match found:', {
                        name: name,
                        fullName: `${foundStudent.voornaam} ${foundStudent.achternaam}`,
                        studentnummer: foundStudent.studentnummer
                    });
                    return {
                        naam: `${foundStudent.voornaam} ${foundStudent.achternaam}`,
                        studentnummer: foundStudent.studentnummer,
                        ...foundStudent
                    };
                } else {
                    console.warn('⚠️ [DEBUG] No student found for name:', name);
                    return {
                        naam: name,
                        studentnummer: null
                    };
                }
            });
        }

        // Use the first student's ID for navigation (backend expects student ID)
        // If no valid student ID found, try to use project ID directly
        let firstStudentId = null;
        let navigationSource = 'none';
        
        if (studentenList.length > 0 && studentenList[0].studentnummer) {
            firstStudentId = studentenList[0].studentnummer;
            navigationSource = 'student lookup';
        } else if (project.id) {
            firstStudentId = project.id;
            navigationSource = 'project id';
        } else if (project.projectId) {
            firstStudentId = project.projectId;
            navigationSource = 'project projectId';
        } else if (project.studentnummer) {
            firstStudentId = project.studentnummer;
            navigationSource = 'project studentnummer';
        }

        // Debug logging for projects without valid IDs
        if (!firstStudentId) {
            console.warn('⚠️ Project without valid student ID:', {
                titel: project.titel || project.projectTitel,
                studenten: project.studenten,
                studentenList: studentenList,
                projectId: project.id,
                projectProjectId: project.projectId
            });
        } else {
            console.log('✅ [DEBUG] Project has valid ID for navigation:', {
                titel: project.titel || project.projectTitel,
                firstStudentId: firstStudentId,
                source: navigationSource
            });
        }

        // Create navigation link - use project title as fallback for search
        let linkHref = '#';
        let linkMethod = 'none';
        
        if (firstStudentId) {
            // Use student ID for direct project detail page navigation
            linkHref = `/zoekbalk-projecten?id=${firstStudentId}`;
            linkMethod = 'student_id';
        } else if (project.titel || project.projectTitel) {
            // Use project title for search-based navigation
            const projectTitle = encodeURIComponent(project.titel || project.projectTitel);
            linkHref = `/alle-projecten?search=${projectTitle}`;
            linkMethod = 'project_search';
            console.log('🔍 [DEBUG] Using project search navigation:', {
                titel: project.titel || project.projectTitel,
                searchUrl: linkHref
            });
        }

        // Always create clickable cards - no more non-clickable cards!
        const cardClass = 'project-card';
        const cardStyle = 'text-decoration: none; color: inherit; display: block;';

        // Create the card HTML
        const cardHTML = `
            <a href="${linkHref}" class="${cardClass}" style="${cardStyle}">
                <div class="card-header">
                    <h3 class="project-title">${project.titel || project.projectTitel || 'Onbekend Project'}</h3>
                    ${project.tafelNr ? `<div class="table-number">Tafel ${project.tafelNr}</div>` : ''}
                </div>
                
                <p class="project-description">
                    ${project.beschrijving || project.projectBeschrijving || 'Geen beschrijving beschikbaar.'}
                </p>
                
                ${this.renderProjectStudents(studentenList)}
                
                ${project.technologieen ? `
                    <div class="project-tech">
                        <strong>Technologieën:</strong> ${project.technologieen}
                    </div>
                ` : ''}
                
                ${!firstStudentId ? `
                    <div class="project-warning" style="background: #fff3cd; color: #856404; padding: 8px; border-radius: 6px; margin-top: 10px; font-size: 0.8rem; border-left: 3px solid #ffc107;">
                        <i class="fas fa-info-circle"></i> Navigatie via project zoekopdracht
                    </div>
                ` : ''}
            </a>
        `;

        return cardHTML;
    }

    renderProjectStudents(studentenList) {
        if (studentenList.length > 1) {
            return `
                <div class="project-students-multiple">
                    <strong>Teamleden (${studentenList.length}):</strong>
                    <div class="student-names">${studentenList.map(s => `<span><i class="fas fa-user"></i> ${s.naam}</span>`).join('')}</div>
                </div>`;
        } else if (studentenList.length === 1) {
            return `
                <div class="project-student-single">
                    <span><i class="fas fa-user"></i> ${studentenList[0]?.naam || 'N/A'}</span>
                </div>`;
        } else {
            return `<div class="project-student-single">
                        <span><i class="fas fa-user"></i> Geen studenten toegewezen</span>
                    </div>`;
        }
    }

    updateDataCounts(data) {
        // Update using the data-count attribute for universal compatibility
        document.querySelectorAll('[data-count]').forEach(el => {
            const type = el.getAttribute('data-count');
            if (data && data[type]) {
                el.textContent = data[type].length ?? 0;
            }
        });
    }
}

// ===== HOMEPAGE INITIALIZER =====
class UniversalHomepageInitializer {
    constructor() {
        this.dataFetcher = new UniversalDataFetcher();
        this.cardRenderer = new CardRenderer(this.dataFetcher);
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
