// src/JS/PROGRAMMA/plattegrond-voormiddag.js
// Interactieve functionaliteit voor voormiddag plattegrond (studenten/projecten aan tafels)

console.log('Plattegrond Voormiddag script loading...');

class PlattegrondVoormiddagManager {
    constructor() {
        this.tafelData = {};
        this.currentUser = null;
        this.isOrganisator = false;
        this.selectedTafel = null;
        this.availableStudents = [];
        this.tafelConfig = { voormiddag_aantal_tafels: 15 }; // Default fallback
        this.init();
    }

    async init() {
        try {
            console.log('Initializing PlattegrondVoormiddagManager...');
            
            // Laad tafel configuratie uit database
            await this.loadTafelConfig();
            
            // Laad user info
            await this.loadUserInfo();
            
            // Laad tafel data
            await this.loadTafelData();
            
            // Pre-load studenten data voor organisatoren
            if (this.isOrganisator) {
                this.loadAvailableStudents(); // Async load in background
            }
            
            // Setup UI
            this.setupUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ PlattegrondVoormiddagManager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing PlattegrondVoormiddagManager:', error);
            this.showError('Er ging iets mis bij het laden van de plattegrond');
        }
    }

    async loadTafelConfig() {
        try {
            console.log('📡 Loading tafel configuration from database...');
            
            const response = await fetch('http://localhost:8383/api/config/tafels');
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.tafelConfig = result.data;
                    console.log('✅ Tafel config loaded from database:', this.tafelConfig);
                    
                    // Sync met localStorage voor offline fallback
                    if (this.tafelConfig.voormiddag_aantal_tafels) {
                        localStorage.setItem('voormiddag_aantal_tafels', this.tafelConfig.voormiddag_aantal_tafels);
                    }
                } else {
                    throw new Error(result.message || 'Failed to load config');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load config from database, using localStorage fallback:', error.message);
            // Fallback naar localStorage
            const localConfig = localStorage.getItem('voormiddag_aantal_tafels');
            if (localConfig) {
                this.tafelConfig.voormiddag_aantal_tafels = parseInt(localConfig);
            }
        }
    }

    async loadUserInfo() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('👤 No user logged in');
                this.isOrganisator = false;
                return;
            }

            const response = await fetch('/api/user-info', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.currentUser = await response.json();
                this.isOrganisator = this.currentUser?.userType === 'organisator';
                console.log('👤 User loaded:', this.currentUser?.userType);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load user info:', error);
            this.isOrganisator = false;
        }
        
        // TEMPORARY: Force organisator role for jan.devos@ehb.be
        if (this.currentUser?.email === 'jan.devos@ehb.be') {
            console.log('🔧 TEMP: Forcing organisator role for jan.devos@ehb.be');
            this.isOrganisator = true;
        }
    }

    async loadTafelData() {
        try {
            console.log('📡 Loading voormiddag tafel data...');
            
            const response = await fetch('http://localhost:8383/api/tafels/voormiddag');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Converteer array naar object voor makkelijke lookup
                this.tafelData = {};
                result.data.forEach(tafel => {
                    this.tafelData[tafel.tafelNr] = tafel;
                });
                
                console.log('✅ Tafel data loaded:', this.tafelData);
                this.updateSidebar();
            } else {
                throw new Error(result.message || 'Failed to load tafel data');
            }
        } catch (error) {
            console.error('❌ Error loading tafel data:', error);
            this.showError('Kan tafel gegevens niet laden: ' + error.message);
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        console.log('📦 Loading fallback data...');
        
        // Mock data voor als API niet beschikbaar is
        this.tafelData = {
            1: {
                tafelNr: 1,
                type: 'project',
                items: [{
                    id: 'Project AI',
                    naam: 'Project AI',
                    titel: 'Project AI',
                    beschrijving: 'AI-oplossingen voor onderwijs',
                    studenten: [
                        { studentnummer: 123, naam: 'Jan Jansen', email: 'jan@test.com', opleiding: 'Toegepaste Informatica' }
                    ],
                    aantalStudenten: 1,
                    type: 'project'
                }]
            },
            2: {
                tafelNr: 2,
                type: 'project',
                items: [{
                    id: 'Project Web',
                    naam: 'Project Web',
                    titel: 'Project Web',
                    beschrijving: 'Web applicatie ontwikkeling',
                    studenten: [
                        { studentnummer: 124, naam: 'Piet Pietersen', email: 'piet@test.com', opleiding: 'Toegepaste Informatica' }
                    ],
                    aantalStudenten: 1,
                    type: 'project'
                }]
            }
        };
        
        this.updateSidebar();
    }

    setupUI() {
        console.log('🎨 Setting up UI for role:', this.isOrganisator ? 'organisator' : 'visitor');
        
        // Update UI gebaseerd op user role
        if (this.isOrganisator) {
            console.log('👔 Setting up organisator UI...');
            this.setupOrganisatorUI();
        } else {
            console.log('👤 Setting up visitor UI...');
            this.setupVisitorUI();
        }
    }

    setupOrganisatorUI() {
        console.log('🔧 Setting up organisator UI components...');
        
        // Refresh knop is al in HTML aanwezig, alleen zichtbaar maken voor organisatoren
        const refreshBtn = document.getElementById('refreshTafels');
        if (refreshBtn) {
            console.log('✅ Found refresh button, making it visible');
            refreshBtn.style.display = 'inline-flex';
        } else {
            console.error('❌ Refresh button not found in DOM');
        }

        // Config knop zichtbaar maken voor organisatoren
        const configBtn = document.getElementById('configTafelsBtn');
        if (configBtn) {
            console.log('✅ Found config button, making it visible');
            configBtn.style.display = 'flex';
        } else {
            console.error('❌ Config button not found in DOM');
        }

        // Update tafel count display
        this.updateTafelCountDisplay();
    }

    setupVisitorUI() {
        console.log('👤 Setting up visitor UI components...');
        
        // Verberg organisator-specifieke elementen
        const refreshBtn = document.getElementById('refreshTafels');
        if (refreshBtn) {
            refreshBtn.style.display = 'none';
        }

        const configBtn = document.getElementById('configTafelsBtn');
        if (configBtn) {
            configBtn.style.display = 'none';
        }

        // Update tafel count display (alleen lezen)
        this.updateTafelCountDisplay();
    }

    // ===== NAVIGATION METHODS =====
    
    handleTafelClick(tafelNr, project) {
        console.log(`🖱️ Tafel ${tafelNr} clicked with project:`, project);
        
        if (!this.isOrganisator) {
            // Voor niet-organisatoren: navigeer naar zoekbalk-project.html
            if (project) {
                this.navigateToProject(project);
            }
        } else {
            // Voor organisatoren: toon assignment modal
            const tafel = this.tafelData[tafelNr] || { tafelNr: tafelNr, items: [] };
            this.showAssignmentModal(tafel);
        }
    }

    navigateToProject(project) {
        console.log(`🧭 Navigating to project details for: ${project.titel}`);
        
        // Store project info in sessionStorage voor overdracht naar volgende pagina
        sessionStorage.setItem('selectedProject', JSON.stringify({
            titel: project.titel,
            beschrijving: project.beschrijving,
            studenten: project.studenten,
            tafelNr: project.tafelNr
        }));
        
        // Navigeer naar zoekbalk-project.html
        window.location.href = '/src/HTML/RESULTS/zoekbalk-project.html';
    }

    updateSidebar() {
        const sidebar = document.getElementById('tafelSidebar');
        if (!sidebar) return;

        if (Object.keys(this.tafelData).length === 0) {
            sidebar.innerHTML = '<div class="no-data">Geen tafels toegewezen</div>';
            return;
        }

        let html = '<div class="tafel-lijst">';
          Object.values(this.tafelData).forEach(tafel => {
            const project = tafel.items && tafel.items[0];
            
            // Voor organisatoren: altijd showAssignmentModal
            // Voor gewone gebruikers: alleen navigateToProject als er een project is
            let clickHandler = '';
            if (this.isOrganisator) {
                clickHandler = `window.plattegrondVoormiddagManager.showAssignmentModal(${JSON.stringify(tafel).replace(/"/g, '&quot;')})`;
            } else if (project) {
                clickHandler = `window.plattegrondVoormiddagManager.navigateToProject(${JSON.stringify(project).replace(/"/g, '&quot;')})`;
            }
            
            html += `
                <div class="tafel-item" ${clickHandler ? `onclick="${clickHandler}"` : ''} style="${clickHandler ? 'cursor: pointer;' : ''}">
                    <div class="tafel-header">
                        <h4>🪑 Tafel ${tafel.tafelNr}</h4>
                        ${this.isOrganisator ? '<span class="edit-indicator">✏️</span>' : ''}
                    </div>
                    <div class="tafel-content">
            `;

            if (project) {
                html += `
                    <div class="project-info">
                        <strong>📋 ${project.titel}</strong>
                        <div class="student-count">👥 ${project.aantalStudenten || 0} student${(project.aantalStudenten || 0) !== 1 ? 'en' : ''}</div>
                        ${project.studenten ? `
                            <div class="student-list">
                                ${project.studenten.slice(0, 3).map(s => `<span class="student-tag">${s.naam}</span>`).join('')}
                                ${project.studenten.length > 3 ? `<span class="more-students">+${project.studenten.length - 3} meer</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                html += '<div class="empty-tafel">📋 Geen project toegewezen</div>';
            }

            if (this.isOrganisator && project) {
                html += `
                    <div class="organisator-actions">
                        <button class="remove-btn" onclick="event.stopPropagation(); window.plattegrondVoormiddagManager.removeProjectFromTafel('${project.titel}')">
                            🗑️ Verwijder
                        </button>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        });        // Voeg lege tafels toe voor organisatoren
        if (this.isOrganisator) {
            html = this.addEmptyTafelsToHTML(html);
        }
        
        html += '</div>';
        sidebar.innerHTML = html;
        
        console.log('✅ Sidebar updated with navigation handlers');
    }

    // Voeg lege tafels toe in sidebar HTML
    addEmptyTafelsToHTML(html) {
        const maxTafels = this.tafelConfig.voormiddag_aantal_tafels || 15;
        console.log(`📊 Adding empty tables up to ${maxTafels}`);
        
        const bezetteTafels = Object.keys(this.tafelData).map(Number);

        for (let i = 1; i <= maxTafels; i++) {
            if (!bezetteTafels.includes(i)) {
                const clickHandler = this.isOrganisator ? 
                    `window.plattegrondVoormiddagManager.showAssignmentModal({tafelNr: ${i}, items: []})` : '';
                
                html += `
                    <div class="tafel-item empty-tafel-item" ${clickHandler ? `onclick="${clickHandler}"` : ''} style="${clickHandler ? 'cursor: pointer;' : ''}">
                        <div class="tafel-header">
                            <h4>🪑 Tafel ${i}</h4>
                            ${this.isOrganisator ? '<span class="edit-indicator">✏️</span>' : ''}
                        </div>
                        <div class="tafel-content">
                            <div class="empty-tafel">📭 Beschikbaar</div>
                        </div>
                    </div>
                `;
            }
        }
        
        return html;
    }

    updateSidebar() {
        const sidebarList = document.querySelector('.sidebarTafels');
        if (!sidebarList) {
            console.warn('⚠️ Sidebar list not found');
            return;
        }

        sidebarList.innerHTML = '';

        // Haal het geconfigureerde aantal tafels op uit database config
        const maxTafels = this.tafelConfig.voormiddag_aantal_tafels || 15;
        console.log(`📊 Showing max ${maxTafels} tafels in sidebar`);

        // Sorteer tafels op nummer en limiteer tot maxTafels
        const sortedTafels = Object.values(this.tafelData)
            .sort((a, b) => a.tafelNr - b.tafelNr)
            .filter(tafel => tafel.tafelNr <= maxTafels);

        console.log(`📋 Displaying ${sortedTafels.length} tafels (max: ${maxTafels})`);

        sortedTafels.forEach(tafel => {
            const listItem = document.createElement('li');
            listItem.className = 'tafel-item';
            listItem.setAttribute('data-tafel', tafel.tafelNr);

            if (tafel.items && tafel.items.length > 0) {
                const project = tafel.items[0]; // Voor voormiddag is het meestal 1 project per tafel
                const naam = project.naam || 'Onbekend project';
                const beschrijving = project.beschrijving || 'Geen beschrijving';
                const aantalStudenten = project.aantalStudenten || 0;
                
                listItem.innerHTML = `
                    <div class="tafel-content">
                        <strong>Tafel ${tafel.tafelNr}: ${naam}</strong>
                        <small class="project-info">${aantalStudenten} student(en)</small>
                    </div>
                `;

                // Add click handler gebaseerd op user type
                if (this.isOrganisator) {
                    listItem.addEventListener('click', () => this.handleOrganisatorTafelClick(tafel));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om tafel toe te wijzen';
                } else {
                    listItem.addEventListener('click', () => this.handleVisitorTafelClick(project));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik voor project details';
                }
            } else {
                listItem.innerHTML = `
                    <div class="tafel-content">
                        <strong>Tafel ${tafel.tafelNr}</strong>
                        <small class="empty-tafel">📭 Beschikbaar</small>
                    </div>
                `;

                if (this.isOrganisator) {
                    listItem.addEventListener('click', () => this.handleOrganisatorTafelClick(tafel));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om project toe te wijzen';
                }
            }

            sidebarList.appendChild(listItem);
        });

        // Voeg lege tafels toe voor organisatoren
        if (this.isOrganisator) {
            this.addEmptyTafels();
        }
    }

    addEmptyTafels() {
        const sidebarList = document.querySelector('.sidebarTafels');
          // Haal het geconfigureerde aantal tafels op uit database config
        const maxTafels = this.tafelConfig.voormiddag_aantal_tafels || 15;
        console.log(`📊 Adding empty tables up to ${maxTafels}`);
        
        const bezetteTafels = Object.keys(this.tafelData).map(Number);

        for (let i = 1; i <= maxTafels; i++) {
            if (!bezetteTafels.includes(i)) {
                const listItem = document.createElement('li');
                listItem.className = 'tafel-item empty-tafel-item';
                listItem.setAttribute('data-tafel', i);
                listItem.innerHTML = `
                    <div class="tafel-content">
                        <strong>Tafel ${i}</strong>
                        <small class="empty-tafel">📭 Beschikbaar</small>
                    </div>
                `;

                if (this.isOrganisator) {
                    listItem.addEventListener('click', () => this.handleOrganisatorTafelClick({ tafelNr: i, items: [] }));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om project toe te wijzen';
                }

                sidebarList.appendChild(listItem);
            }
        }
        
        console.log(`✅ Empty tables added up to tafel ${maxTafels}`);
    }    handleOrganisatorTafelClick(tafel) {
        console.log('👔 Organisator clicked tafel:', tafel);
        this.showAssignmentModal(tafel);
    }

    handleVisitorTafelClick(project) {
        console.log('👤 Visitor clicked project:', project);
        this.navigateToProject(project);
    }

    // Alias function for backwards compatibility
    showAssignmentModal(tafel) {
        console.log('🔄 showAssignmentModal called, forwarding to showTafelAssignmentModal');
        return this.showTafelAssignmentModal(tafel);
    }

    async showTafelAssignmentModal(tafel) {
        // Toon modal direct voor snellere UX
        const modal = this.createAssignmentModal(tafel);
        document.body.appendChild(modal);

        // Add click outside to close functionality
        const overlay = modal.querySelector('.modal-overlay');
        const modalContent = modal.querySelector('.modal-content');
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                // Only close if clicked on overlay background, not on modal content
                if (e.target === overlay) {
                    this.closeModal(modal);
                }
            });
        }

        // Focus op modal
        setTimeout(() => {
            const firstButton = modal.querySelector('button, select');
            if (firstButton) firstButton.focus();
        }, 100);
        
        // Laad studenten in achtergrond als nog niet geladen
        if (!this.availableStudents || this.availableStudents.length === 0) {
            await this.loadAvailableStudents();
            // Update modal met studenten data
            this.updateModalWithStudents(modal, tafel);
        }
    }

    async loadAvailableStudents() {
        try {
            console.log('📡 Loading available students...');
            
            const response = await fetch('http://localhost:8383/api/studenten');
            
            if (response.ok) {
                const result = await response.json();                if (result.success) {
                    this.availableStudents = result.data;
                    console.log('✅ Students loaded:', this.availableStudents.length);
                    
                    // Debug: zoek naar kokende ai robot studenten
                    const kokedeStudents = this.availableStudents.filter(s => 
                        s.projectTitel && s.projectTitel.toLowerCase().includes('kokende ai robot')
                    );
                    console.log(`🤖 Found ${kokedeStudents.length} students for "kokende ai robot":`, 
                        kokedeStudents.map(s => ({naam: s.naam, projectTitel: s.projectTitel}))
                    );
                } else {
                    throw new Error(result.message || 'Failed to load students');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error loading students:', error);
            this.availableStudents = [];
        }
    }

    createAssignmentModal(tafel) {
        const modal = document.createElement('div');
        modal.className = 'tafel-assignment-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>⚙️ Tafel ${tafel.tafelNr} Beheren</h3>
                    
                    ${tafel.items && tafel.items.length > 0 ? `
                        <div class="current-assignment">
                            <div class="current-project">
                                <strong>${tafel.items[0].naam}</strong><br>
                                <small>${tafel.items[0].aantalStudenten || 0} student(en)</small>
                            </div>
                            <button class="remove-btn" onclick="window.plattegrondVoormiddagManager.removeProjectFromTafel('${tafel.items[0].id}')">
                                Verwijderen
                            </button>
                        </div>
                    ` : `
                        <p>Deze tafel heeft geen toewijzing</p>
                    `}
                    
                    <div class="assign-new">
                        <h4>Project toewijzen:</h4>
                        <select id="projectSelect" class="project-select">
                            ${this.availableStudents && this.availableStudents.length > 0 ? `
                                <option value="">Selecteer een project...</option>
                                ${this.buildProjectOptgroups()}
                            ` : `
                                <option value="">Projecten laden...</option>
                            `}
                        </select>
                        <button class="assign-btn" onclick="window.plattegrondVoormiddagManager.assignProjectToTafel(${tafel.tafelNr})">
                            Toewijzen
                        </button>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="cancel-btn" onclick="window.plattegrondVoormiddagManager.closeModal()">
                            Annuleren
                        </button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }    updateModalWithStudents(modal, tafel) {
        const projectSelect = modal.querySelector('#projectSelect');
        if (projectSelect && this.availableStudents) {
            // Clear loading state
            projectSelect.innerHTML = '<option value="">Selecteer project...</option>';
            
            // Eerst: bepaal welke projecten al aan tafels zijn toegewezen
            const toegewezenProjecten = new Set();
            Object.values(this.tafelData).forEach(tafelInfo => {
                if (tafelInfo.items && tafelInfo.items.length > 0) {
                    tafelInfo.items.forEach(project => {
                        if (project.naam) {
                            toegewezenProjecten.add(project.naam);
                        }
                    });
                }
            });
              // Groepeer studenten per project
            const projectGroups = {};
            this.availableStudents.forEach(student => {
                if (student.projectTitel && student.projectTitel.trim() !== '') {
                    if (!projectGroups[student.projectTitel]) {
                        projectGroups[student.projectTitel] = {
                            titel: student.projectTitel,
                            beschrijving: student.projectBeschrijving || '',
                            studenten: [],
                            isToeggewezen: toegewezenProjecten.has(student.projectTitel),
                            tafelNr: null
                        };
                    }
                    projectGroups[student.projectTitel].studenten.push(student);
                    
                    // Debug logging voor specifiek project
                    if (student.projectTitel.toLowerCase().includes('kokende ai robot')) {
                        console.log(`🤖 Found student for "kokende ai robot":`, {
                            naam: student.naam,
                            studentnummer: student.studentnummer,
                            projectTitel: student.projectTitel,
                            totalCount: projectGroups[student.projectTitel].studenten.length
                        });
                    }
                    
                    // Vind tafel nummer als project is toegewezen
                    if (toegewezenProjecten.has(student.projectTitel)) {
                        Object.values(this.tafelData).forEach(tafelInfo => {
                            if (tafelInfo.items && tafelInfo.items.length > 0) {
                                tafelInfo.items.forEach(project => {
                                    if (project.naam === student.projectTitel) {
                                        projectGroups[student.projectTitel].tafelNr = tafelInfo.tafelNr;
                                    }
                                });
                            }
                        });
                    }
                }
            });

            // Extra debug voor kokende ai robot project
            const kokedeProject = Object.values(projectGroups).find(p => 
                p.titel.toLowerCase().includes('kokende ai robot')
            );
            if (kokedeProject) {
                console.log(`🤖 Final "kokende ai robot" project data:`, {
                    titel: kokedeProject.titel,
                    aantalStudenten: kokedeProject.studenten.length,
                    studenten: kokedeProject.studenten.map(s => s.naam),
                    isToeggewezen: kokedeProject.isToeggewezen,
                    tafelNr: kokedeProject.tafelNr
                });
            }

            // Sorteer projecten: beschikbare eerst, dan toegewezen
            const beschikbareProjecten = Object.values(projectGroups).filter(p => !p.isToeggewezen)
                .sort((a, b) => a.titel.localeCompare(b.titel));
            const alleToegwezenProjecten = Object.values(projectGroups).filter(p => p.isToeggewezen)
                .sort((a, b) => a.titel.localeCompare(b.titel));
            
            // Add beschikbare projecten met header
            if (beschikbareProjecten.length > 0) {
                const optgroupBeschikbaar = document.createElement('optgroup');
                optgroupBeschikbaar.label = '📋 Nog aan te duiden projecten';
                beschikbareProjecten.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.titel;
                    option.textContent = `${project.titel} (${project.studenten.length} studenten)`;
                    optgroupBeschikbaar.appendChild(option);
                });
                projectSelect.appendChild(optgroupBeschikbaar);
            }
            
            // Add toegewezen projecten met header
            if (alleToegwezenProjecten.length > 0) {
                const optgroupAssigned = document.createElement('optgroup');
                optgroupAssigned.label = '✅ Al aangeduide projecten';
                alleToegwezenProjecten.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.titel;
                    option.textContent = `${project.titel} (${project.studenten.length} studenten) - Tafel ${project.tafelNr || 'onbekend'}`;
                    option.disabled = true;
                    optgroupAssigned.appendChild(option);
                });
                projectSelect.appendChild(optgroupAssigned);
            }
            
            console.log(`🔄 Modal updated with students data: ${beschikbareProjecten.length} beschikbaar, ${alleToegwezenProjecten.length} toegewezen`);
        }
    }

    buildProjectOptgroups() {
        // Groepeer studenten per project
        const projectGroups = {};
        this.availableStudents.forEach(student => {
            if (student.projectTitel && student.projectTitel.trim() !== '') {
                if (!projectGroups[student.projectTitel]) {
                    projectGroups[student.projectTitel] = {
                        titel: student.projectTitel,
                        beschrijving: student.projectBeschrijving || '',
                        studenten: [],
                        tafelNr: student.tafelNr
                    };
                }
                projectGroups[student.projectTitel].studenten.push(student);
            }
        });

        const beschikbareProjecten = Object.values(projectGroups).filter(p => !p.tafelNr)
            .sort((a, b) => a.titel.localeCompare(b.titel));
        const toegewezenProjecten = Object.values(projectGroups).filter(p => p.tafelNr)
            .sort((a, b) => a.titel.localeCompare(b.titel));
        
        let html = '';
        
        // Beschikbare projecten
        if (beschikbareProjecten.length > 0) {
            html += '<optgroup label="📋 Nog aan te duiden projecten">';
            beschikbareProjecten.forEach(project => {
                html += `<option value="${project.titel}">
                    ${project.titel} (${project.studenten.length} studenten)
                </option>`;
            });
            html += '</optgroup>';
        }
        
        // Toegewezen projecten
        if (toegewezenProjecten.length > 0) {
            html += '<optgroup label="✅ Al aangeduide projecten">';
            toegewezenProjecten.forEach(project => {
                html += `<option value="${project.titel}" disabled>
                    ${project.titel} (${project.studenten.length} studenten) - Tafel ${project.tafelNr}
                </option>`;
            });
            html += '</optgroup>';
        }
          return html;
    }

    async assignProjectToTafel(tafelNr) {
        try {
            const projectSelect = document.querySelector('#projectSelect');
            const projectTitel = projectSelect.value;
            
            if (!projectTitel) {
                this.showError('Selecteer eerst een project');
                return;
            }

            console.log(`📝 Bulk assigning project "${projectTitel}" to tafel ${tafelNr}`);

            // Gebruik de nieuwe bulk endpoint
            const response = await fetch(`http://localhost:8383/api/tafels/project/bulk-assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    projectTitel: projectTitel,
                    tafelNr: tafelNr
                })
            });

            console.log(`📊 API Response Status: ${response.status}`);

            // Check HTTP status first
            if (!response.ok) {
                console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Server error: ${response.status}`);
                } catch (jsonError) {
                    // Als JSON parsing faalt, gooi HTTP status error
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
            }

            const result = await response.json();
            console.log('📊 API Response Data:', result);            // Check result success
            if (result.success) {
                this.showSuccess(`Project "${projectTitel}" toegewezen aan tafel ${tafelNr} (${result.studentsUpdated} studenten bijgewerkt)`);
                
                // Refresh data en update dropdown, maar laat modal open
                await this.refresh();
                
                // Reset de dropdown selectie
                projectSelect.value = '';
            } else {
                throw new Error(result.message || 'Toewijzing mislukt - onbekende fout');
            }

        } catch (error) {
            console.error('❌ Error assigning project:', error);
            this.showError('Toewijzing mislukt: ' + error.message);
        }
    }

    async removeProjectFromTafel(projectTitel) {
        try {
            console.log(`🗑️ Bulk removing project "${projectTitel}" from tafel`);

            // Gebruik de nieuwe bulk endpoint
            const response = await fetch(`http://localhost:8383/api/tafels/project/bulk-remove`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    projectTitel: projectTitel
                })
            });

            console.log(`📊 API Response Status: ${response.status}`);

            // Check HTTP status first
            if (!response.ok) {
                console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Server error: ${response.status}`);
                } catch (jsonError) {
                    // Als JSON parsing faalt, gooi HTTP status error
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
            }

            const result = await response.json();
            console.log('📊 API Response Data:', result);            if (result.success) {
                this.showSuccess(`Project "${projectTitel}" verwijderd van tafel ${result.previousTafelNr || 'onbekend'} (${result.studentsUpdated} studenten bijgewerkt)`);
                
                // Refresh data en update dropdown, maar laat modal open
                await this.refresh();
            } else {
                throw new Error(result.message || 'Verwijdering mislukt');
            }

        } catch (error) {
            console.error('❌ Error removing project:', error);
            this.showError('Verwijdering mislukt: ' + error.message);
        }
    }

    closeModal(modalElement = null) {
        const modal = modalElement || document.querySelector('.tafel-assignment-modal');
        if (modal) {
            modal.remove();
        }
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');

        // Refresh button
        const refreshBtn = document.getElementById('refreshTafels');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        // Config button (alleen voor organisatoren)
        const configBtn = document.getElementById('configTafelsBtn');
        if (configBtn && this.isOrganisator) {
            configBtn.addEventListener('click', () => this.showTafelConfigModal());
        }

        // Search functionality
        const searchInput = document.getElementById('tafelSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTafels(e.target.value);
            });
        }
    }

    filterTafels(searchTerm) {
        const tafelItems = document.querySelectorAll('.tafel-item');
        const term = searchTerm.toLowerCase();

        tafelItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }    async refresh() {
        console.log('🔄 Refreshing plattegrond data...');
        this.showLoading(true);
        
        try {
            await this.loadTafelConfig();
            await this.loadTafelData();
            
            // Als organisator, herlaad ook de beschikbare studenten voor dropdown updates
            if (this.isOrganisator) {
                await this.loadAvailableStudents();
                
                // Update de dropdown als een modal open is
                const openModal = document.querySelector('.tafel-assignment-modal');
                if (openModal) {
                    this.updateModalWithStudents(openModal, this.selectedTafel);
                    console.log('🔄 Updated dropdown in open modal');
                }
            }
            
            this.showSuccess('Plattegrond bijgewerkt');
        } catch (error) {
            console.error('❌ Error refreshing:', error);
            this.showError('Kon plattegrond niet bijwerken');
        } finally {
            this.showLoading(false);
        }
    }

    showTafelConfigModal() {
        // Huidige waarde ophalen uit database config
        const currentAantal = this.tafelConfig.voormiddag_aantal_tafels || 15;
        
        const modal = document.createElement('div');
        modal.className = 'config-modal';
        modal.innerHTML = `
            <div class="config-modal-content">
                <h3>⚙️ Tafel Configuratie - Voormiddag</h3>
                <div class="config-info">
                    <p><strong>Huidige instelling:</strong> ${currentAantal} tafels</p>
                    <p><small>Dit bepaalt hoeveel tafels zichtbaar zijn in het overzicht en beschikbaar zijn voor project toewijzing. De instelling wordt opgeslagen in de database.</small></p>
                </div>
                <div class="config-form">
                    <div class="config-input-group">
                        <label for="aantalTafels">Nieuw aantal tafels:</label>
                        <input type="number" id="aantalTafels" class="config-input" 
                               value="${currentAantal}" min="1" max="500" placeholder="Bijv. 15">
                        <small>Tussen 1 en 500 tafels</small>
                    </div>
                    <div class="config-buttons">
                        <button class="config-btn-cancel">Annuleren</button>
                        <button class="config-btn-save">💾 Opslaan in Database</button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        const cancelBtn = modal.querySelector('.config-btn-cancel');
        const saveBtn = modal.querySelector('.config-btn-save');
        const input = modal.querySelector('#aantalTafels');

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        saveBtn.addEventListener('click', () => {
            const aantalTafels = parseInt(input.value);
            if (aantalTafels >= 1 && aantalTafels <= 500) {
                this.updateAantalTafels(aantalTafels);
                document.body.removeChild(modal);
            } else {
                this.showError('Aantal tafels moet tussen 1 en 500 zijn');
                input.focus();
                input.select();
            }
        });

        // Enter key to save
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        document.body.appendChild(modal);
        input.focus();
        input.select(); // Select the current value for easy editing
    }

    async updateAantalTafels(aantalTafels) {
        try {
            console.log(`📊 Updating voormiddag tafels to ${aantalTafels}`);
            
            const response = await fetch('http://localhost:8383/api/tafels/voormiddag/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ aantalTafels })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.tafelConfig.voormiddag_aantal_tafels = aantalTafels;
                    localStorage.setItem('voormiddag_aantal_tafels', aantalTafels);
                    this.updateTafelCountDisplay();
                    this.updateSidebar();
                    
                    this.showSuccess(`Aantal tafels succesvol ingesteld op ${aantalTafels}`);
                    
                    if (result.warning) {
                        this.showInfo(result.warning);
                    }
                } else {
                    throw new Error(result.message || 'Failed to update config');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error updating aantal tafels:', error);
            this.showError('Kon aantal tafels niet bijwerken: ' + error.message);
        }
    }

    updateTafelCountDisplay() {
        const countDisplay = document.getElementById('tafelCountText');
        if (countDisplay) {
            const currentAantal = this.tafelConfig.voormiddag_aantal_tafels || 15;
            countDisplay.textContent = `Aantal tafels: ${currentAantal}`;
            console.log(`📊 Updated display: Aantal tafels: ${currentAantal}`);
        }
    }

    showProjectDetails(project) {
        const modal = document.createElement('div');
        modal.className = 'project-details-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>📋 ${project.naam}</h3>
                    <div class="project-details">
                        <p><strong>Beschrijving:</strong></p>
                        <p>${project.beschrijving || 'Geen beschrijving beschikbaar'}</p>
                        <p><strong>Studenten (${project.aantalStudenten}):</strong></p>
                        <ul>
                            ${project.studenten ? project.studenten.map(student => 
                                `<li>${student.naam} - ${student.opleiding}</li>`
                            ).join('') : '<li>Geen studenten informatie beschikbaar</li>'}
                        </ul>
                    </div>
                    <div class="modal-actions">
                        <button class="cancel-btn" onclick="this.closest('.project-details-modal').remove()">
                            Sluiten
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // ===== UTILITY METHODS =====
    showError(message) {
        console.error('❌ Error:', message);
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        console.log('✅ Success:', message);
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Verwijder bestaande notificaties
        const existing = document.querySelectorAll('.notification');
        existing.forEach(el => el.remove());

        // Maak nieuwe notificatie
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Voeg toe aan body
        document.body.appendChild(notification);

        // Auto-remove na 5 seconden
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Globale functies voor modal interactie
window.plattegrondVoormiddagManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing PlattegrondVoormiddagManager...');
    window.plattegrondVoormiddagManager = new PlattegrondVoormiddagManager();
});

// CSS voor modal en extra styling
const additionalCSS = `
.tafel-assignment-modal, .project-details-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
    color: #881538;
    margin-bottom: 1.5rem;
    text-align: center;
}

.current-assignment {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
}

.current-project {
    margin-bottom: 1rem;
}

.project-select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.assign-btn, .remove-btn, .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    margin: 0.25rem;
    transition: all 0.3s ease;
}

.assign-btn {
    background: #28a745;
    color: white;
}

.remove-btn {
    background: #dc3545;
    color: white;
}

.cancel-btn {
    background: #6c757d;
    color: white;
}

.assign-btn:hover, .remove-btn:hover, .cancel-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.edit-mode-indicator {
    background: linear-gradient(135deg, #881538, #A91B47);
    color: white;
    padding: 1rem 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    text-align: center;
    box-shadow: 0 4px 15px rgba(136, 21, 56, 0.3);
}

.organisator-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.edit-badge {
    font-weight: 600;
    font-size: 1.1rem;
}

.refresh-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.refresh-btn:hover {
    background: white;
    color: #881538;
}

.empty-tafel-item {
    opacity: 0.7;
    border-style: dashed !important;
}

.empty-tafel {
    color: #666;
    font-style: italic;
}

.project-info {
    display: block;
    color: #666;
    margin-top: 0.25rem;
}

.search-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #881538;
    border-radius: 8px;
    font-size: 0.9rem;
}

.modal-actions {
    text-align: center;
    margin-top: 1.5rem;
}

.config-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
}

.config-modal-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.config-input-group {
    margin-bottom: 1.5rem;
}

.config-input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.config-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    font-size: 0.9rem;
}

.config-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.config-btn-cancel, .config-btn-save {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.config-btn-cancel {
    background: #6c757d;
    color: white;
}

.config-btn-save {
    background: #28a745;
    color: white;
}

.config-btn-cancel:hover {
    background: #5a6268;
}

.config-btn-save:hover {
    background: #218838;
}

.project-details {
    margin-bottom: 1.5rem;
}

.project-details ul {
    list-style: none;
    padding: 0;
}

.project-details li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
}

.project-details li:last-child {
    border-bottom: none;
}

.notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 10001;
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: opacity 0.3s ease;
}

.notification-error {
    border-left: 4px solid #dc3545;
}

.notification-success {
    border-left: 4px solid #28a745;
}

.notification-info {
    border-left: 4px solid #007bff;
}

.notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.notification-message {
    flex: 1;
    margin-right: 1rem;
}

.notification-close {
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.2rem;
    cursor: pointer;
}

.notification-close:hover {
    color: #333;
}

@media (max-width: 768px) {
    .modal-content {
        padding: 1.5rem;
        margin: 1rem;
    }
    
    .organisator-controls {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .edit-mode-indicator {
        padding: 1rem;
    }
}

/* Notification styles */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    z-index: 10000;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
}

.notification-content {
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
    font-weight: 500;
}

.notification-error {
    background: #dc3545;
    border-left: 4px solid #bd2130;
}

.notification-success {
    background: #28a745;
    border-left: 4px solid #1e7e34;
}

.notification-info {
    background: #17a2b8;
    border-left: 4px solid #138496;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    margin-left: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.notification-close:hover {
    opacity: 1;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Voeg CSS toe aan document
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

console.log('✅ Plattegrond Voormiddag script loaded successfully');

