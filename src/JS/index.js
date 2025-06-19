// src/JS/index.js - COMPLETE WORKING VERSION - DUPLICATIE VERWIJDERD

/**
 * 🌍 UNIVERSAL HOMEPAGE INITIALIZER - COMPLETE WORKING VERSION
 * 
 * Fixed:
 * ✅ Data count showing total numbers (not carousel items)
 * ✅ Project grouping using backend grouped projects
 * ✅ TafelNr information display
 * ✅ Proper debugging and error handling
 * ✅ Uses backend grouped projects properly
 * ✅ REMOVED DUPLICATE LOGIC BLOCK
 */

// ===== GLOBAL VARIABLES =====
let universalInitializer;
let carouselManager;
let allCompanies = [];
let allStudents = [];
let allProjects = [];

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
        if (path === '/student-homepage') return 'student';
        if (path === '/bedrijf-homepage') return 'bedrijf';
        if (path === '/organisator-homepage') return 'organisator';
        
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
            stats: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.stats}`
        };
    }
    
    static getUISelectors(type) {
        switch(type) {
            case 'guest':
                return {
                    bedrijvenGrid: '#companyCardsContainer',
                    studentenGrid: '#studentCardsContainer',
                    projectsGrid: '#projectCardsContainer',
                    searchInput: '.search-input'
                };
            case 'organisator':
                return {
                    bedrijvenGrid: '#bedrijvenGrid',
                    studentenGrid: '#studentenGrid', 
                    projectsGrid: '#projectsGrid',
                    searchInput: '#hoofdZoekbalk'
                };
            case 'bedrijf':
                return {
                    bedrijvenGrid: '#students-grid',
                    studentenGrid: '#students-grid',
                    projectsGrid: '#projects-grid',
                    searchInput: '.search-input'
                };
            case 'student':
                return {
                    bedrijvenGrid: '.companies-grid',
                    studentenGrid: '.students-grid',
                    projectsGrid: '.projects-grid',
                    searchInput: '.search-input'
                };
            default:
                return {
                    bedrijvenGrid: '#companyCardsContainer',
                    studentenGrid: '#studentCardsContainer',
                    projectsGrid: '#projectCardsContainer',
                    searchInput: '.search-input'
                };
        }
    }
}

// ===== AUTH CHECKER =====
class AuthChecker {
    static checkAuthAndRedirect() {
        console.log('🔍 Checking authentication for redirect...');
        
        const authToken = localStorage.getItem('authToken');
        const userType = localStorage.getItem('userType');
        const currentPath = window.location.pathname;
        
        console.log('📊 Auth Status:', {
            hasToken: !!authToken,
            userType: userType,
            currentPath: currentPath
        });
        
        if (authToken && userType && (currentPath === '/' || currentPath === '/index.html')) {
            console.log(`🔄 Authenticated user (${userType}) on guest page, redirecting...`);
            
            let targetPath;
            switch(userType) {
                case 'student':
                    targetPath = '/student-homepage';
                    break;
                case 'bedrijf':
                    targetPath = '/bedrijf-homepage';
                    break;
                case 'organisator':
                    targetPath = '/organisator-homepage';
                    break;
                default:
                    console.warn('❓ Unknown user type:', userType);
                    return false;
            }
            
            console.log(`🚀 Redirecting to: ${targetPath}`);
            window.location.replace(targetPath);
            return true;
        }
        
        console.log('✅ No redirect needed, continuing with page load');
        return false;
    }
}

// ===== DATA FETCHER =====
class UniversalDataFetcher {
    constructor(homepageType) {
        this.homepageType = homepageType;
        this.endpoints = HomepageTypeDetector.getDataEndpoints();
        
        console.log(`🚀 DataFetcher initialized for ${homepageType} homepage`);
        console.log('📡 Endpoints:', this.endpoints);
    }

    getFetchUrl(endpointKey) {
        const base = this.endpoints[endpointKey];
        console.log(`🔍 [DEBUG] Getting fetch URL for ${endpointKey}, homepage: ${this.homepageType}`);
        console.log(`📡 [DEBUG] Full URL: ${base}`);
        return base; // Return full endpoint without limits
    }

    async fetchAPI(endpoint, retries = 2) {
        console.log(`📡 [DEBUG] Fetching: ${endpoint} (${retries} retries left)`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
            
            const response = await fetch(endpoint, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📦 [DEBUG] Raw response from ${endpoint}:`, data);
            console.log(`📊 [DEBUG] Response structure:`, {
                hasSuccess: 'success' in data,
                hasData: 'data' in data,
                dataIsArray: Array.isArray(data.data),
                directArray: Array.isArray(data),
                dataLength: data.data ? data.data.length : (Array.isArray(data) ? data.length : 'N/A')
            });
            
            // Handle different response formats
            if (data.success && Array.isArray(data.data)) {
                console.log(`✅ [DEBUG] Found ${data.data.length} items in data.data`);
                return data.data;
            } else if (Array.isArray(data)) {
                console.log(`✅ [DEBUG] Found ${data.length} items in direct array`);
                return data;
            } else if (data.data && Array.isArray(data.data)) {
                console.log(`✅ [DEBUG] Found ${data.data.length} items in nested data`);
                return data.data;
            } else {
                console.warn(`⚠️ [DEBUG] Unexpected data format from ${endpoint}:`, data);
                return [];
            }
            
        } catch (error) {
            console.error(`❌ [DEBUG] Error fetching ${endpoint}:`, error);
            
            if (retries > 0) {
                console.log(`🔄 [DEBUG] Retrying ${endpoint} (${retries} retries left)...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.fetchAPI(endpoint, retries - 1);
            }
            
            return [];
        }
    }

    async fetchAllData() {
        console.log('🎯 [DEBUG] Loading homepage data...');

        try {
            // Fetch data in parallel
            const [bedrijven, studenten, projecten] = await Promise.allSettled([
                this.fetchAPI(this.getFetchUrl('bedrijven')),
                this.fetchAPI(this.getFetchUrl('studenten')),
                this.fetchAPI(this.getFetchUrl('projecten'))
            ]);

            allCompanies = bedrijven.status === 'fulfilled' ? bedrijven.value : [];
            allStudents = studenten.status === 'fulfilled' ? studenten.value : [];
            allProjects = projecten.status === 'fulfilled' ? projecten.value : [];

            // === EXTRA DEBUGGING ===
            console.log('🔍 [DEBUG] Volledige backend projectdata (voor bundeling):', JSON.parse(JSON.stringify(allProjects)));
            if (allProjects.length > 0) {
                allProjects.slice(0, 3).forEach((p, i) => {
                    console.log(`[DEBUG] Project[${i}]:`, p, 'Keys:', Object.keys(p));
                });
                const titels = allProjects.map(p => p.titel || p.projectTitel || p.naam || '').map(t => t.toLowerCase().trim());
                const ids = allProjects.map(p => p.id || p.projectId || '');
                const dubbeleTitels = titels.filter((t, i, arr) => arr.indexOf(t) !== i);
                const dubbeleIds = ids.filter((id, i, arr) => id && arr.indexOf(id) !== i);
                console.log('[DEBUG] Project titels:', titels);
                console.log('[DEBUG] Project ids:', ids);
                console.log('[DEBUG] Dubbele titels:', dubbeleTitels);
                console.log('[DEBUG] Dubbele ids:', dubbeleIds);
            }
            // === EINDE EXTRA DEBUGGING ===

            // === PROJECT BUNDELING ===
            if (allProjects.length > 0) {
                // Gebruik backenddata direct, geen extra bundeling!
                window.allProjects = allProjects;
            } else if (allStudents.length > 0) {
                // Alleen als er GEEN projecten zijn, fallback naar extractie uit studenten
                console.log('🔄 [DEBUG] Backend returned no projects, extracting from students...');
                this.extractProjectsFromStudents();
            }
            // === EINDE PROJECT BUNDELING ===

            // Store globally
            window.allCompanies = allCompanies;
            window.allStudents = allStudents;
            // window.allProjects = allProjects; // al gedaan

            // Use fallback if no data at all
            if (allCompanies.length === 0 && allStudents.length === 0 && allProjects.length === 0) {
                console.log('⚠️ [DEBUG] No data loaded from API, using fallback');
                this.loadFallbackData();
            }

            // 🔧 FINAL DEBUG LOG
            console.log('✅ [DEBUG] FINAL DATA SUMMARY:');
            console.log(`  🏢 Companies: ${allCompanies.length}`);
            console.log(`  👨‍🎓 Students: ${allStudents.length}`);  
            console.log(`  🚀 Projects: ${allProjects.length}`);
            console.log(`  📊 Data quality:`, {
                studentsWithProjects: allStudents.filter(s => s.projectTitel).length,
                studentsWithTafel: allStudents.filter(s => s.tafelNr).length,
                projectsWithTafel: allProjects.filter(p => p.tafelNr).length,
                projectsWithMultipleStudents: allProjects.filter(p => p.studenten && p.studenten.length > 1).length
            });

            return { bedrijven: allCompanies, studenten: allStudents, projecten: allProjects };

        } catch (error) {
            console.error('❌ [DEBUG] Failed to load data:', error);
            this.loadFallbackData();
            return { bedrijven: allCompanies, studenten: allStudents, projecten: allProjects };
        }
    }

    // Fallback method for project extraction (only used when backend returns no projects)
    extractProjectsFromStudents() {
        console.log('🔄 [DEBUG] Extracting and grouping projects from student data...');
        const projectMap = new Map();
        allStudents
            .filter(student => {
                const hasProject = student.projectTitel && student.projectTitel.trim() !== '';
                if (!hasProject) {
                    console.log(`⚠️ [DEBUG] Student ${student.voornaam} ${student.achternaam} has no project`);
                }
                return hasProject;
            })
            .forEach(student => {
                // Gebruik een genormaliseerde key (case-insensitive, spaties getrimd)
                const key = student.projectTitel.trim().replace(/\s+/g, ' ').toLowerCase();
                if (!projectMap.has(key)) {
                    projectMap.set(key, {
                        titel: student.projectTitel.trim(),
                        beschrijving: student.projectBeschrijving,
                        studenten: [],
                        tafels: new Set()
                    });
                }
                // Voeg student toe
                const tafel = (student.tafelNr !== null && student.tafelNr !== undefined && student.tafelNr !== '' && student.tafelNr !== 'TBD') ? student.tafelNr : null;
                projectMap.get(key).studenten.push({
                    naam: `${student.voornaam || ''} ${student.achternaam || ''}`.trim() || student.studentNaam || `Student ${student.studentnummer}`,
                    tafelNr: tafel,
                    studentnummer: student.studentnummer,
                    opleiding: student.opleiding,
                    opleidingsrichting: student.opleidingsrichting
                });
                if (tafel) {
                    projectMap.get(key).tafels.add(tafel);
                }
            });
        // Zet om naar array en voeg extra velden toe
        allProjects = Array.from(projectMap.values()).map(project => {
            const geldigeTafels = Array.from(project.tafels).filter(t => t !== null && t !== undefined && t !== '' && t !== 'TBD');
            return {
                ...project,
                studentnaam: project.studenten.map(s => s.naam).join(', '),
                aantalStudenten: project.studenten.length,
                tafelNr: geldigeTafels.length === 1
                    ? geldigeTafels[0]
                    : (geldigeTafels.length > 1 ? geldigeTafels.join(', ') : 'TBD'),
                studenten: project.studenten
            };
        });
        window.allProjects = allProjects;
        console.log(`✅ [DEBUG] Created ${allProjects.length} unique projects from students`);
    }

    loadFallbackData() {
        console.log('🔄 [DEBUG] Loading fallback data...');
        
        allCompanies = this.getFallbackCompanies();
        allStudents = this.getFallbackStudents();
        allProjects = this.getFallbackProjects();
        
        window.allCompanies = allCompanies;
        window.allStudents = allStudents;
        window.allProjects = allProjects;
        
        console.log('✅ [DEBUG] Fallback data loaded');
    }

    getFallbackCompanies() {
        return [
            {
                id: 1,
                bedrijfsnummer: 1,
                naam: "BilalAICorp",
                beschrijving: "BilalAICorp bouwt slimme AI-oplossingen die zich aanpassen aan de gebruiker – ideaal voor zorg, onderwijs en industrie.",
                sector: "AI & Technology",
                tafelNr: 1
            },
            {
                id: 2,
                bedrijfsnummer: 2,
                naam: "Vital'O Network", 
                beschrijving: "Vital'O Network verbindt medische systemen met elkaar voor vlotte en veilige datastromen.",
                sector: "Healthcare IT",
                tafelNr: 3
            }
        ];
    }

    getFallbackStudents() {
        return [
            {
                id: 1,
                studentnummer: 12345,
                voornaam: "John",
                achternaam: "Doe",
                opleiding: "Toegepaste Informatica",
                beschrijving: "Ik ben John Doe, derdejaarsstudent Toegepaste Informatica.",
                projectTitel: "Kokende AI Robot",
                projectBeschrijving: "Een slimme, zelfdenkende keukenrobot.",
                tafelNr: 5
            }
        ];
    }

    getFallbackProjects() {
        return [
            {
                id: 1,
                projectId: 1,
                titel: "Kokende AI Robot",
                beschrijving: "Een slimme, zelfdenkende keukenrobot die volledig autonoom heerlijke maaltijden bereidt.",
                studentnaam: "John Doe",
                studentnummer: 12345,
                tafelNr: 5,
                aantalStudenten: 1
            }
        ];
    }
}

// ===== CAROUSEL MANAGER =====
class CarouselManager {
    constructor(homepageType) {
        this.homepageType = homepageType;
        this.currentCompanyIndex = 0;
        this.currentStudentIndex = 0;
        this.currentProjectIndex = 0;
        this.itemsPerPage = 4;
        this.autoRotateInterval = null;
        this.isAutoRotating = true;
        
        console.log(`🎠 [DEBUG] CarouselManager created for ${homepageType}`);
    }

    startAutoRotation() {
        if (this.homepageType !== 'guest') {
            console.log(`🎠 [DEBUG] No auto-rotation for ${this.homepageType} homepage`);
            return;
        }
        
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
        }

        this.autoRotateInterval = setInterval(() => {
            if (this.isAutoRotating && 
                (allCompanies.length > 4 || allStudents.length > 4 || allProjects.length > 4)) {
                this.rotateNext();
            }
        }, 8000);
        
        console.log('🎠 [DEBUG] Auto-rotation started (8s intervals)');
    }

    stopAutoRotation() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
        this.isAutoRotating = false;
        console.log('🎠 [DEBUG] Auto-rotation stopped');
    }

    rotateNext() {
        console.log('🎠 [DEBUG] Rotating to next items...');
        
        if (allCompanies.length > this.itemsPerPage) {
            this.currentCompanyIndex = (this.currentCompanyIndex + this.itemsPerPage) % allCompanies.length;
        }
        if (allStudents.length > this.itemsPerPage) {
            this.currentStudentIndex = (this.currentStudentIndex + this.itemsPerPage) % allStudents.length;
        }
        if (allProjects.length > this.itemsPerPage) {
            this.currentProjectIndex = (this.currentProjectIndex + this.itemsPerPage) % allProjects.length;
        }
        
        // Re-render with smooth transition
        if (window.universalHomepage && window.universalHomepage.cardRenderer) {
            window.universalHomepage.cardRenderer.renderAllCardsWithTransition();
        }
    }

    getDisplayItems(items, startIndex) {
        if (!items || items.length === 0) return [];

        // For guest homepage - limit to carousel size, for others show all
        if (this.homepageType === 'guest') {
            const result = [];
            for (let i = 0; i < Math.min(this.itemsPerPage, items.length); i++) {
                const index = (startIndex + i) % items.length;
                result.push(items[index]);
            }
            console.log(`🎠 [DEBUG] Carousel showing ${result.length} of ${items.length} items`);
            return result;
        } else {
            // For other homepages - show all items
            console.log(`📊 [DEBUG] Non-guest homepage showing all ${items.length} items`);
            return items;
        }
    }
}

// ===== CARD RENDERER =====
class CardRenderer {
    constructor(homepageType) {
        this.homepageType = homepageType;
        this.selectors = HomepageTypeDetector.getUISelectors(homepageType);
        this.carousel = new CarouselManager(homepageType);
        
        console.log(`🎨 [DEBUG] CardRenderer created for ${homepageType}`, this.selectors);
    }

    findContainer(selector) {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`✅ [DEBUG] Found container: ${selector}`);
            return element;
        }
        console.warn(`❌ [DEBUG] Container not found: ${selector}`);
        return null;
    }

    renderAllCards() {
        console.log(`🎨 [DEBUG] Rendering cards for ${this.homepageType} homepage`);
        console.log(`📊 [DEBUG] Available data: Companies=${allCompanies.length}, Students=${allStudents.length}, Projects=${allProjects.length}`);
        
        this.renderCompanyCards();
        this.renderStudentCards();
        this.renderProjectCards();
        this.updateDataCounts();
        
        // Start carousel for guest homepage
        if (this.homepageType === 'guest') {
            this.carousel.startAutoRotation();
        }
    }

    renderAllCardsWithTransition() {
        console.log('🔄 [DEBUG] Re-rendering cards with transition...');
        
        // Add fade out effect
        [this.selectors.bedrijvenGrid, this.selectors.studentenGrid, this.selectors.projectsGrid].forEach(selector => {
            const container = this.findContainer(selector);
            if (container) {
                container.style.opacity = '0.5';
                container.style.transition = 'opacity 0.3s ease';
            }
        });
        
        // Re-render after short delay
        setTimeout(() => {
            this.renderCompanyCards();
            this.renderStudentCards();
            this.renderProjectCards();
            
            // Restore opacity
            [this.selectors.bedrijvenGrid, this.selectors.studentenGrid, this.selectors.projectsGrid].forEach(selector => {
                const container = this.findContainer(selector);
                if (container) {
                    container.style.opacity = '1';
                }
            });
        }, 300);
    }

    renderCompanyCards() {
        const container = this.findContainer(this.selectors.bedrijvenGrid);
        if (!container) {
            console.warn('❌ [DEBUG] Company container not found');
            return;
        }

        console.log('🏢 [DEBUG] Rendering company cards...');

        if (!allCompanies || allCompanies.length === 0) {
            container.innerHTML = '<div class="no-data"><p>Geen bedrijven beschikbaar</p></div>';
            return;
        }

        const companiesToShow = this.carousel.getDisplayItems(allCompanies, this.carousel.currentCompanyIndex);
        console.log(`🏢 [DEBUG] Showing ${companiesToShow.length} companies out of ${allCompanies.length} total`);
        
        const cardsHTML = companiesToShow.map(company => {
            const name = company.naam || company.bedrijfsnaam || 'Onbekend Bedrijf';
            const description = company.beschrijving || company.bechrijving || 'Geen beschrijving beschikbaar';
            const id = company.id || company.bedrijfsnummer;
            const sector = company.sector || '';
            const tafelNr = company.tafelNr || '';
            
            return `
                <a href="/resultaat-bedrijf?id=${id}" class="preview-card company-card" data-company-id="${id}">
                    <div class="card-header">
                        <h3 class="card-title">${name}</h3>
                        ${tafelNr ? `<span class="table-number">Tafel ${tafelNr}</span>` : ''}
                    </div>
                    <p class="card-description">${description.length > 120 ? description.substring(0, 120) + '...' : description}</p>
                    ${sector ? `<div class="bedrijf-sector" style="margin-top: 8px; font-size: 0.8rem; color: #881538; font-weight: 600;">📊 ${sector}</div>` : ''}
                </a>
            `;
        }).join('');

        container.innerHTML = cardsHTML;
        this.addCardClickHandlers(container, 'company');

        console.log(`✅ [DEBUG] Rendered ${companiesToShow.length} company cards`);
    }

    renderStudentCards() {
        const container = this.findContainer(this.selectors.studentenGrid);
        if (!container) {
            console.warn('❌ [DEBUG] Student container not found');
            return;
        }

        console.log('👨‍🎓 [DEBUG] Rendering student cards...');

        if (!allStudents || allStudents.length === 0) {
            container.innerHTML = '<div class="no-data"><p>Geen studenten beschikbaar</p></div>';
            return;
        }

        const studentsToShow = this.carousel.getDisplayItems(allStudents, this.carousel.currentStudentIndex);
        console.log(`👨‍🎓 [DEBUG] Showing ${studentsToShow.length} students out of ${allStudents.length} total`);
        
        const cardsHTML = studentsToShow.map(student => {
            const name = `${student.voornaam || ''} ${student.achternaam || ''}`.trim() || 'Onbekende Student';
            const description = student.beschrijving || student.overMezelf || `Student ${student.opleiding || 'Toegepaste Informatica'} aan de Erasmushogeschool Brussel.`;
            const id = student.id || student.studentnummer;
            const opleiding = student.opleiding || student.opleidingsrichting || '';
            const tafelNr = student.tafelNr || '';
            
            console.log(`👨‍🎓 [DEBUG] Rendering student: ${name}, tafel: ${tafelNr || 'N/A'}, opleiding: ${opleiding}`);
            
            return `
                <a href="/resultaat-student?id=${id}" class="preview-card student-card" data-student-id="${id}">
                    <div class="card-header">
                        <h3 class="card-title">${name}</h3>
                        ${tafelNr ? `<span class="table-number">Tafel ${tafelNr}</span>` : ''}
                    </div>
                    <p class="card-description">${description.length > 120 ? description.substring(0, 120) + '...' : description}</p>
                    ${opleiding ? `<div class="student-opleiding" style="margin-top: 8px; font-size: 0.8rem; color: #881538; font-weight: 600;">🎓 ${opleiding}</div>` : ''}
                </a>
            `;
        }).join('');

        container.innerHTML = cardsHTML;
        this.addCardClickHandlers(container, 'student');

        console.log(`✅ [DEBUG] Rendered ${studentsToShow.length} student cards`);
    }

    renderProjectCards() {
        const container = this.findContainer(this.selectors.projectsGrid);
        if (!container) {
            console.warn('❌ [DEBUG] Project container not found');
            return;
        }

        console.log('🚀 [DEBUG] Rendering project cards...');
        console.log('🟢 [DEBUG] Ruwe backenddata projecten:', allProjects);
        if (allProjects.length > 0) {
            allProjects.forEach((p, i) => {
                console.log(`[RENDER] Project[${i}]:`, {
                    id: p.id || p.projectId,
                    titel: p.titel || p.projectTitel || p.naam,
                    studenten: p.studenten,
                    studentNaam: p.studentNaam,
                    tafelNr: p.tafelNr
                });
            });
        }

        if (!allProjects || allProjects.length === 0) {
            container.innerHTML = '<div class="no-data"><p>Geen projecten beschikbaar</p></div>';
            return;
        }

        const projectsToShow = this.carousel.getDisplayItems(allProjects, this.carousel.currentProjectIndex);
        console.log(`🚀 [DEBUG] Showing ${projectsToShow.length} projects out of ${allProjects.length} total`);

        const cardsHTML = projectsToShow.map((project, idx) => {
            const title = project.titel || project.naam || project.projectTitel || 'Onbekend Project';
            const description = project.beschrijving || project.projectBeschrijving || 'Geen beschrijving beschikbaar';
            const id = project.id || project.projectId || '';
            const technologieen = project.technologieën || project.technologien || project.opleidingsrichting || '';
            // 1. Als project.studenten een array is: toon per student
            if (Array.isArray(project.studenten) && project.studenten.length > 0) {
                const studenten = project.studenten;
                // Verzamel alle unieke, niet-lege tafelNrs van studenten
                const uniekeTafels = [...new Set(studenten.map(s => s.tafelNr).filter(t => t != null && t !== '' && t !== 'TBD'))];
                // Toon tafelNr bovenaan alleen als ALLE studenten hetzelfde tafelNr hebben (en niet leeg)
                let tafelDisplay = '';
                if (uniekeTafels.length === 1 && studenten.every(s => s.tafelNr === uniekeTafels[0])) {
                    tafelDisplay = `<span class="table-number">Tafel ${uniekeTafels[0]}</span>`;
                }
                const studentListHTML = studenten.map(s => {
                    const naam = (s.voornaam || s.achternaam) ? `${s.voornaam || ''} ${s.achternaam || ''}`.trim() : (s.naam || 'Onbekende student');
                    // Toon ALLEEN de eigen tafelNr van de student, of leeg als die ontbreekt
                    const tafel = (s.tafelNr && s.tafelNr !== 'TBD') ? `<span style='color:#666;font-weight:400'>(Tafel ${s.tafelNr})</span>` : '';
                    return `<div class="project-student" style="font-size: 0.85rem; color: #881538; font-weight: 600; margin-top: 6px;">👨‍🎓 ${naam} ${tafel}</div>`;
                }).join('');
                return `
                    <a href="/zoekbalk-projecten?id=${id}" class="project-card" data-project-id="${id}">
                        <div class="card-header">
                            <h3 class="project-title">${title}</h3>
                            ${tafelDisplay}
                        </div>
                        <p class="project-description">${description.length > 150 ? description.substring(0, 150) + '...' : description}</p>
                        ${technologieen ? `<div class="project-tech" style="margin: 10px 0; font-size: 0.8rem; color: #666;"><strong>Tech:</strong> ${technologieen}</div>` : ''}
                        <div class="project-students-multiple" style="margin-top: 10px;">
                            ${studentListHTML}
                        </div>
                        ${studenten.length > 1 ? `<div class="project-team-size" style="font-size: 0.75rem; color: #666; margin-top: 5px;">👥 ${studenten.length} studenten werken aan dit project</div>` : ''}
                    </a>
                `;
            }
            // 2. Als alleen project.studentNaam (string) en project.tafelNr (projectniveau): toon die direct
            if (project.studentNaam && project.tafelNr) {
                return `
                    <a href="/zoekbalk-projecten?id=${id}" class="project-card" data-project-id="${id}">
                        <div class="card-header">
                            <h3 class="project-title">${title}</h3>
                            <span class="table-number">Tafel ${project.tafelNr}</span>
                        </div>
                        <p class="project-description">${description.length > 150 ? description.substring(0, 150) + '...' : description}</p>
                        ${technologieen ? `<div class="project-tech" style="margin: 10px 0; font-size: 0.8rem; color: #666;"><strong>Tech:</strong> ${technologieen}</div>` : ''}
                        <div class="project-student" style="font-size: 0.85rem; color: #881538; font-weight: 600; margin-top: 6px;">👨‍🎓 ${project.studentNaam}</div>
                        ${project.aantalStudenten > 1 ? `<div class="project-team-size" style="font-size: 0.75rem; color: #666; margin-top: 5px;">👥 ${project.aantalStudenten} studenten werken aan dit project</div>` : ''}
                    </a>
                `;
            }
            // 3. Fallback: geen studenteninfo, alleen titel/omschrijving tonen
            return `
                <a href="/zoekbalk-projecten?id=${id}" class="project-card" data-project-id="${id}">
                    <div class="card-header">
                        <h3 class="project-title">${title}</h3>
                    </div>
                    <p class="project-description">${description.length > 150 ? description.substring(0, 150) + '...' : description}</p>
                    ${technologieen ? `<div class="project-tech" style="margin: 10px 0; font-size: 0.8rem; color: #666;"><strong>Tech:</strong> ${technologieen}</div>` : ''}
                    <div class="project-student" style="color:#881538;">Geen studenten gevonden</div>
                </a>
            `;
        }).join('');

        container.innerHTML = cardsHTML;
        this.addCardClickHandlers(container, 'project');

        console.log(`✅ [DEBUG] Rendered ${projectsToShow.length} project cards`);
    }

    addCardClickHandlers(container, cardType) {
        const cards = container.querySelectorAll('a[href]');
        
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const targetUrl = card.getAttribute('href');
                console.log(`🔗 [DEBUG] ${cardType} card clicked: ${targetUrl}`);
                
                window.location.href = targetUrl;
            });
        });
        
        console.log(`✅ [DEBUG] Added click handlers to ${cards.length} ${cardType} cards`);
    }

    updateDataCounts() {
        console.log('📊 [DEBUG] === UPDATING DATA COUNTS ===');
        
        // 🔧 CRITICAL FIX: ALWAYS show total counts, NOT displayed counts
        const totalCompanies = allCompanies.length;
        const totalStudents = allStudents.length;
        const totalProjects = allProjects.length;
        
        console.log('📊 [DEBUG] Total data available:', {
            companies: totalCompanies,
            students: totalStudents, 
            projects: totalProjects,
            homepageType: this.homepageType
        });
        
        // ALWAYS use total counts for data display
        const stats = {
            bedrijven: totalCompanies,
            studenten: totalStudents,
            projecten: totalProjects
        };
        
        console.log('📊 [DEBUG] Stats being sent to stat-utils:', stats);
        
        // Use the globally available updateDataCounts function
        if (window.updateDataCounts) {
            window.updateDataCounts(stats);
            console.log('✅ [DEBUG] Data counts updated using stat-utils with TOTAL counts');
        } else {
            console.warn('⚠️ [DEBUG] updateDataCounts not available, using fallback');
            // Fallback manual update
            Object.entries(stats).forEach(([type, count]) => {
                const elements = document.querySelectorAll(`[data-type="${type}"]`);
                console.log(`📊 [DEBUG] Updating ${type}: ${count} (found ${elements.length} elements)`);
                elements.forEach(el => {
                    el.textContent = count;
                });
            });
        }
        
        console.log('📊 [DEBUG] === DATA COUNTS UPDATE COMPLETE ===');
        console.log(`📊 [DEBUG] Users will see: ${totalCompanies} companies, ${totalStudents} students, ${totalProjects} projects`);
    }
}

// ===== MAIN UNIVERSAL INITIALIZER =====
class UniversalHomepageInitializer {
    constructor() {
        this.homepageType = HomepageTypeDetector.getCurrentType();
        this.dataFetcher = new UniversalDataFetcher(this.homepageType);
        this.cardRenderer = new CardRenderer(this.homepageType);
        
        console.log(`🌍 [DEBUG] UniversalHomepageInitializer created for: ${this.homepageType}`);
    }

    async init() {
        console.log(`🚀 [DEBUG] === INITIALIZING ${this.homepageType.toUpperCase()} HOMEPAGE ===`);

        try {
            // Auth check only for guest homepage
            if (HomepageTypeDetector.shouldCheckAuth()) {
                const shouldRedirect = AuthChecker.checkAuthAndRedirect();
                if (shouldRedirect) {
                    console.log('🔄 [DEBUG] User redirected, stopping homepage initialization');
                    return;
                }
            }

            // Show loading state
            this.showLoading(true);

            // Load data
            console.log('📡 [DEBUG] Starting data fetch...');
            const data = await this.dataFetcher.fetchAllData();
            console.log('📊 [DEBUG] Data fetch completed:', data);
            
            // Wait for DOM to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Render cards
            console.log('🎨 [DEBUG] Starting card rendering...');
            this.cardRenderer.renderAllCards();
            console.log('✅ [DEBUG] Card rendering completed');

            // Hide loading
            this.showLoading(false);

            console.log(`✅ [DEBUG] === ${this.homepageType.toUpperCase()} HOMEPAGE INITIALIZATION COMPLETED ===`);

        } catch (error) {
            console.error(`❌ [DEBUG] Failed to initialize ${this.homepageType} homepage:`, error);
            this.showLoading(false);
        }
    }

    showLoading(show) {
        if (show) {
            console.log('🔄 [DEBUG] Showing loading state...');
        } else {
            console.log('✅ [DEBUG] Hiding loading state...');
            
            // Remove any remaining loading elements
            const loadingElements = document.querySelectorAll('.loading-cards, .no-data');
            loadingElements.forEach(el => {
                if (el.textContent && el.textContent.includes('laden')) {
                    el.remove();
                }
            });
        }
    }

    refresh() {
        console.log('🔄 [DEBUG] Manual refresh triggered');
        
        // Stop carousel before refresh
        if (this.cardRenderer.carousel) {
            this.cardRenderer.carousel.stopAutoRotation();
        }
        
        return this.init();
    }

    getStats() {
        return {
            companies: allCompanies.length,
            students: allStudents.length,
            projects: allProjects.length,
            homepageType: this.homepageType,
            apiEndpoints: this.dataFetcher.endpoints,
            dataQuality: {
                studentsWithProjects: allStudents.filter(s => s.projectTitel).length,
                studentsWithTafel: allStudents.filter(s => s.tafelNr).length,
                projectsWithTafel: allProjects.filter(p => p.tafelNr).length,
                projectsWithMultipleStudents: allProjects.filter(p => p.aantalStudenten > 1).length
            }
        };
    }
}

// ===== AUTO-INITIALIZATION =====
function initUniversalHomepage() {
    const homepageType = HomepageTypeDetector.getCurrentType();
    
    if (homepageType === 'unknown') {
        console.log('🤷‍♂️ [DEBUG] Unknown homepage type, skipping initialization');
        return;
    }

    console.log(`🌍 [DEBUG] === STARTING UNIVERSAL HOMEPAGE INITIALIZATION ===`);
    console.log(`🏠 [DEBUG] Homepage type: ${homepageType}`);
    console.log(`🌐 [DEBUG] Current URL: ${window.location.href}`);

    universalInitializer = new UniversalHomepageInitializer();
    universalInitializer.init();

    // Make globally available
    window.universalHomepage = universalInitializer;
    window.refreshHomepageData = () => universalInitializer.refresh();
    window.getHomepageStats = () => universalInitializer.getStats();
    
    // Make carousel manager available
    carouselManager = universalInitializer.cardRenderer.carousel;
    window.carouselManager = carouselManager;
    
    console.log('🌍 [DEBUG] Global functions available: refreshHomepageData(), getHomepageStats()');
}

// ===== STARTUP =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUniversalHomepage);
} else {
    initUniversalHomepage();
}

// Global access
window.allCompanies = allCompanies;
window.allStudents = allStudents;
window.allProjects = allProjects;

console.log('✅ [DEBUG] FIXED VERSION: Universal Homepage Initializer loaded - DUPLICATE LOGIC REMOVED!');