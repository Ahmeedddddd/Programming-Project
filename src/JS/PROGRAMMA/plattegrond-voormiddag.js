// Plattegrond Voormiddag Manager
console.log('Plattegrond Voormiddag script loading...');

class PlattegrondVoormiddagManager {
    constructor() {
        this.tafelData = {};
        this.currentUser = null;
        this.isOrganisator = false;
        this.selectedTafel = null;
        this.availableProjects = [];
        this.init();
    }

    async init() {
        try {
            console.log('Initializing PlattegrondVoormiddagManager...');
            
            // Laad user info
            await this.loadUserInfo();
            
            // Laad tafel data
            await this.loadTafelData();
            
            // Pre-load projecten data voor organisatoren
            if (this.isOrganisator) {
                this.loadAvailableProjects(); // Async load in background
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
    }    async loadUserInfo() {
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
                console.log('👤 User loaded:', this.currentUser?.email, '-', this.currentUser?.userType || 'unknown');
                console.log('🔑 Is organisator:', this.isOrganisator);
            } else {
                console.warn('⚠️ Failed to load user info, assuming visitor role');
                this.isOrganisator = false;
            }
        } catch (error) {
            console.error('❌ Error loading user info:', error);
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
            const result = await response.json();

            if (result.success) {
                // Convert array to object with tafelNr as key
                this.tafelData = {};
                result.data.forEach(tafel => {
                    this.tafelData[tafel.tafelNr] = tafel;
                });

                console.log('✅ Tafel data loaded:', this.tafelData);
                this.renderTafelLijst();
            } else {
                throw new Error(result.message || 'Failed to load tafel data');
            }
        } catch (error) {
            console.error('❌ Error loading tafel data:', error);
            this.showError('Er ging iets mis bij het laden van de tafel gegevens');
        }
    }    setupUI() {
        console.log('🎨 Setting up UI for role:', this.isOrganisator ? 'organisator' : 'visitor');
        
        if (this.isOrganisator) {
            console.log('👔 Setting up organisator UI...');
            this.setupOrganisatorUI();
        } else {
            console.log('👤 Setting up visitor UI...');
            this.setupVisitorUI();
        }
        
        // Render tafel lijst
        this.renderTafelLijst();
    }setupOrganisatorUI() {
        // Add any organisator-specific UI elements here
        const sidebar = document.querySelector('.sideBar');
        if (sidebar) {
            // Add refresh button if not exists
            let refreshBtn = document.getElementById('refreshTafels');
            if (!refreshBtn) {
                refreshBtn = document.createElement('button');
                refreshBtn.id = 'refreshTafels';
                refreshBtn.textContent = '🔄 Ververs';
                refreshBtn.className = 'refresh-btn';
                sidebar.insertBefore(refreshBtn, sidebar.firstChild);
            }
        }
    }

    setupVisitorUI() {
        // Visitor-specific UI setup
        console.log('Setting up read-only view for visitors');
    }    renderTafelLijst() {
        const sidebarList = document.querySelector('.sidebarTafels');
        if (!sidebarList) {
            console.error('❌ Sidebar list not found');
            return;
        }

        // Clear existing content
        sidebarList.innerHTML = '';

        // Sorteer tafels op nummer
        const sortedTafels = Object.values(this.tafelData).sort((a, b) => a.tafelNr - b.tafelNr);

        sortedTafels.forEach(tafel => {
            const listItem = document.createElement('li');
            listItem.className = 'tafel-item';
            listItem.setAttribute('data-tafel', tafel.tafelNr);

            if (tafel.items && tafel.items.length > 0) {
                // Get the project title from the first item (all items should have same title)
                const firstProject = tafel.items[0];
                const titel = firstProject.titel || 'Geen project titel';
                
                // Get all student names from the project
                const studenten = firstProject.studenten || [];
                const studentNames = studenten.map(s => s.naam).join(', ');
                const studentCount = studenten.length;
                
                listItem.innerHTML = `
                    <div class="tafel-content">
                        <strong>Tafel ${tafel.tafelNr}: ${titel}</strong>
                        <small class="student-name">Studenten (${studentCount}): ${studentNames}</small>
                    </div>
                `;

                // Add click handler gebaseerd op user type
                if (this.isOrganisator) {
                    listItem.addEventListener('click', () => this.handleOrganisatorTafelClick(tafel));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om tafel toe te wijzen';
                } else {
                    listItem.addEventListener('click', () => this.handleVisitorTafelClick(firstProject));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik voor project details';
                }
            } else {
                // Lege tafel
                listItem.innerHTML = `
                    <div class="tafel-content">
                        <strong>Tafel ${tafel.tafelNr}</strong>
                        <small class="empty-tafel">📭 Geen toewijzing</small>
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

        // Add empty tafels voor organisatoren
        if (this.isOrganisator) {
            this.addEmptyTafels(sidebarList);
        }
    }

    addEmptyTafels(sidebarList) {
        const maxTafels = 20; // Adjust as needed
        const bezetteTafels = Object.keys(this.tafelData).map(nr => parseInt(nr));

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

                listItem.addEventListener('click', () => this.handleOrganisatorTafelClick({ tafelNr: i, items: [] }));
                listItem.style.cursor = 'pointer';
                listItem.title = 'Klik om project toe te wijzen';

                sidebarList.appendChild(listItem);
            }
        }
    }

    handleOrganisatorTafelClick(tafel) {
        console.log('👔 Organisator clicked tafel:', tafel.tafelNr);
        this.selectedTafel = tafel;
        this.showTafelAssignmentModal(tafel);
    }

    handleVisitorTafelClick(project) {
        console.log('👤 Visitor clicked project:', project);
        
        if (project && project.id) {
            // Navigeer naar project detail pagina met project ID
            window.location.href = `/zoekbalk-projecten?project=${encodeURIComponent(project.id)}`;
        } else {
            this.showInfo('Geen project gegevens beschikbaar');
        }
    }

    async showTafelAssignmentModal(tafel) {
        // Laad beschikbare projecten
        if (!this.availableProjects || this.availableProjects.length === 0) {
            await this.loadAvailableProjects();
        }

        const modal = this.createAssignmentModal(tafel);
        document.body.appendChild(modal);

        // Update modal met projecten data als deze nog niet geladen zijn
        if (this.availableProjects && this.availableProjects.length > 0) {
            this.updateModalWithProjects(modal, tafel);
        }

        // Focus op modal
        setTimeout(() => {
            const firstButton = modal.querySelector('button, select');
            if (firstButton) firstButton.focus();
        }, 100);
    }

    async loadAvailableProjects() {
        if (this.availableProjects && this.availableProjects.length > 0) {
            console.log('📦 Using cached projects data');
            return;
        }

        try {
            const response = await fetch('http://localhost:8383/api/studenten?hasProject=true');
            const result = await response.json();

            if (result.success) {
                // Groepeer studenten per project
                const projectGroups = {};
                result.data.forEach(student => {
                    if (student.projectTitel && student.projectTitel.trim() !== '') {
                        if (!projectGroups[student.projectTitel]) {
                            projectGroups[student.projectTitel] = {
                                projectTitel: student.projectTitel,
                                projectBeschrijving: student.projectBeschrijving || '',
                                studenten: [],
                                tafelNr: student.tafelNr // Als één student een tafel heeft, heeft het hele project die tafel
                            };
                        }
                        projectGroups[student.projectTitel].studenten.push({
                            studentnummer: student.studentnummer,
                            naam: `${student.voornaam} ${student.achternaam}`,
                            voornaam: student.voornaam,
                            achternaam: student.achternaam,
                            email: student.email,
                            opleiding: student.opleiding
                        });
                        
                        // Update tafelNr als deze student een tafel heeft
                        if (student.tafelNr) {
                            projectGroups[student.projectTitel].tafelNr = student.tafelNr;
                        }
                    }
                });

                this.availableProjects = Object.values(projectGroups);
                console.log('📋 Available projects loaded:', this.availableProjects.length);
            }
        } catch (error) {
            console.error('❌ Error loading available projects:', error);
            this.availableProjects = [];
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
                            <h4>Huidige toewijzing:</h4>
                            <div class="current-project">
                                <strong>${tafel.items[0].titel}</strong><br>
                                <small>� ${(() => {
                                    const studenten = tafel.items[0].studenten || [];
                                    if (studenten.length > 0) {
                                        return studenten.map(s => s.naam).join(', ');
                                    } else {
                                        return `${tafel.items[0].aantalStudenten || tafel.items.length} student(en)`;
                                    }
                                })()}</small>
                            </div>
                            <button class="remove-btn" onclick="window.plattegrondManager.removeProjectFromTafel('${tafel.items[0].id}')">
                                🗑️ Project verwijderen
                            </button>
                        </div>
                        <hr>
                    ` : `
                        <p>📭 Deze tafel heeft geen toewijzing</p>
                    `}

                    <div class="assign-new">
                        <h4>Project toewijzen:</h4>
                        <select id="projectSelect" class="project-select">
                            <option value="">Selecteer een project...</option>
                            ${this.buildProjectenOptgroups()}
                        </select>
                        <button class="assign-btn" onclick="window.plattegrondManager.assignProjectToTafel(${tafel.tafelNr})">
                            ✅ Toewijzen
                        </button>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="cancel-btn" onclick="window.plattegrondManager.closeModal()">
                            ❌ Annuleren
                        </button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    async assignProjectToTafel(tafelNr) {
        const projectSelect = document.getElementById('projectSelect');
        const projectTitel = projectSelect.value;

        if (!projectTitel) {
            this.showError('Selecteer eerst een project');
            return;
        }

        try {
            // Vind het project object
            const project = this.availableProjects.find(p => p.projectTitel === projectTitel);
            if (!project) {
                this.showError('Project niet gevonden');
                return;
            }

            const token = localStorage.getItem('authToken');
            
            // Wijs alle studenten van dit project toe aan de tafel
            for (const student of project.studenten) {
                const response = await fetch(`http://localhost:8383/api/tafels/student/${student.studentnummer}/tafel/${tafelNr}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();
                if (!result.success) {
                    throw new Error(`Fout bij toewijzen van ${student.naam}: ${result.message}`);
                }
            }            this.showSuccess(`Project "${projectTitel}" met ${project.studenten.length} student(en) toegewezen aan tafel ${tafelNr}!`);
            this.closeModal();
            await this.loadTafelData(); // Herlaad data
            
            // Cache invalideren zodat projecten lijst wordt ververst
            this.availableProjects = [];
        } catch (error) {
            console.error('❌ Error assigning project:', error);
            this.showError('Toewijzing mislukt: ' + error.message);
        }
    }

    async removeProjectFromTafel(projectTitel) {
        try {
            console.log('🗑️ Removing project:', projectTitel);
            
            // Vind alle studenten van dit project in de huidige tafel
            const currentTafel = this.selectedTafel;
            if (!currentTafel || !currentTafel.items || currentTafel.items.length === 0) {
                this.showError('Geen project gevonden om te verwijderen');
                return;
            }

            // Zoek het project in beschikbare projecten voor student info
            let projectStudenten = [];
            const project = this.availableProjects.find(p => p.projectTitel === projectTitel);
            if (project) {
                projectStudenten = project.studenten;
            } else {
                // Als project niet in cache, haal student nummers uit huidige tafel data
                if (currentTafel.items[0] && currentTafel.items[0].studenten) {
                    projectStudenten = currentTafel.items[0].studenten;
                }
            }

            if (projectStudenten.length === 0) {
                this.showError('Geen studenten gevonden voor dit project');
                return;
            }

            const token = localStorage.getItem('authToken');
            
            // Verwijder alle studenten van dit project van de tafel
            for (const student of projectStudenten) {
                const response = await fetch(`http://localhost:8383/api/tafels/student/${student.studentnummer}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();
                if (!result.success) {
                    console.warn(`Waarschuwing bij verwijderen van ${student.naam}: ${result.message}`);
                }
            }            this.showSuccess(`Project "${projectTitel}" met ${projectStudenten.length} student(en) verwijderd van tafel!`);
            // NIET de modal sluiten bij verwijdering, maar verversen voor directe nieuwe toewijzing
            await this.loadTafelData(); // Herlaad data
            
            // Cache invalideren zodat projecten lijst wordt ververst
            this.availableProjects = [];
            await this.loadAvailableProjects(); // Herlaad beschikbare projecten
            
            // Update de modal met nieuwe gegevens (tafel is nu leeg)
            const currentModal = document.querySelector('.tafel-assignment-modal');
            if (currentModal) {
                const tafelNr = this.selectedTafel.tafelNr;
                const updatedTafel = { tafelNr: tafelNr, items: [] }; // Tafel is nu leeg
                this.selectedTafel = updatedTafel;
                
                // Vervang modal content
                const newModal = this.createAssignmentModal(updatedTafel);
                currentModal.innerHTML = newModal.innerHTML;
                
                // Update dropdown met nieuwe projecten
                this.updateModalWithProjects(currentModal, updatedTafel);
            }
        } catch (error) {
            console.error('❌ Error removing project:', error);
            this.showError('Verwijdering mislukt: ' + error.message);
        }
    }

    closeModal() {
        const modal = document.querySelector('.tafel-assignment-modal');
        if (modal) {
            modal.remove();
        }
    }

    setupEventListeners() {
        // Refresh button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refreshTafels') {
                this.refresh();
            }
        });

        // Search functionality
        const searchInput = document.querySelector('.sidebarZoekbalk');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTafels(e.target.value);
            });
            
            // Clear search when escape is pressed
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.target.value = '';
                    this.filterTafels('');
                }
            });
        }
    }

    filterTafels(searchTerm) {
        const tafelItems = document.querySelectorAll('.tafel-item');
        const term = searchTerm.toLowerCase();

        tafelItems.forEach(item => {
            // Get project title and student names for searching, exclude student count
            const projectTitle = item.querySelector('strong')?.textContent.toLowerCase() || '';
            const studentInfo = item.querySelector('.student-name')?.textContent.toLowerCase() || '';
            
            // Remove the student count part (like "Studenten (3):") from search
            const studentNamesOnly = studentInfo.replace(/studenten\s*\(\d+\):\s*/i, '');
            
            const searchableContent = projectTitle + ' ' + studentNamesOnly;
            
            if (searchableContent.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async refresh() {
        console.log('🔄 Refreshing tafel data...');
        this.showLoading(true);
        
        try {
            await this.loadTafelData();
            // Clear cached projects to force reload
            this.availableProjects = [];
            
            this.showSuccess('Gegevens ververst!');
        } catch (error) {
            this.showError('Fout bij verversen: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        // Implementation for loading indicator
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }    showNotification(message, type = 'info') {
        // Controleer of er een globale showNotification functie bestaat
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback: Maak onze eigen notification
        this.createCustomNotification(message, type);
    }

    createCustomNotification(message, type) {
        // Zoek of maak notification container
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        
        // Maak notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.5rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#881538'};
            transform: translateX(100%);
            transition: transform 0.3s ease;
            color: #333;
            font-weight: 500;
        `;
        notification.textContent = message;
        
        // Voeg toe en animeer
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remove na 4 seconden
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }    updateModalWithProjects(modal, tafel) {
        const projectSelect = modal.querySelector('#projectSelect');
        if (projectSelect && this.availableProjects) {
            // Clear loading state
            projectSelect.innerHTML = '<option value="">Selecteer project...</option>';
            
            // Bepaal welke projecten al toegewezen zijn aan tafels
            const toegewezenProjectTitels = new Set();
            Object.values(this.tafelData).forEach(t => {
                if (t.items && t.items.length > 0) {
                    t.items.forEach(item => {
                        if (item.titel) {
                            toegewezenProjectTitels.add(item.titel);
                        }
                    });
                }
            });
            
            console.log('🔍 Toegewezen project titels:', Array.from(toegewezenProjectTitels));
            
            // Filter projecten gebaseerd op huidige tafel assignments
            const beschikbareProjecten = this.availableProjects.filter(p => 
                !toegewezenProjectTitels.has(p.projectTitel)
            ).sort((a, b) => a.projectTitel.localeCompare(b.projectTitel));
            
            const toegewezenProjecten = this.availableProjects.filter(p => 
                toegewezenProjectTitels.has(p.projectTitel)
            ).sort((a, b) => a.projectTitel.localeCompare(b.projectTitel));
            
            console.log('📋 Beschikbare projecten:', beschikbareProjecten.length);
            console.log('✅ Toegewezen projecten:', toegewezenProjecten.length);
              // Add beschikbare projecten met header
            if (beschikbareProjecten.length > 0) {
                const optgroupBeschikbaar = document.createElement('optgroup');
                optgroupBeschikbaar.label = '📋 Nog aan te duiden projecten';
                beschikbareProjecten.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.projectTitel;
                    const studentText = project.studenten.length === 1 ? 'student' : 'studenten';
                    option.textContent = `🎓 ${project.projectTitel} (${project.studenten.length} ${studentText})`;
                    optgroupBeschikbaar.appendChild(option);
                });
                projectSelect.appendChild(optgroupBeschikbaar);
            }
            
            // Add toegewezen projecten met header
            if (toegewezenProjecten.length > 0) {
                const optgroupAssigned = document.createElement('optgroup');
                optgroupAssigned.label = '✅ Al aangeduide projecten';
                toegewezenProjecten.forEach(project => {
                    // Zoek de tafel waar dit project aan is toegewezen
                    let tafelNr = 'onbekend';
                    for (const [tnr, tdata] of Object.entries(this.tafelData)) {
                        if (tdata.items && tdata.items.some(item => item.titel === project.projectTitel)) {
                            tafelNr = tnr;
                            break;
                        }
                    }
                    
                    const option = document.createElement('option');
                    option.value = project.projectTitel;
                    const studentText = project.studenten.length === 1 ? 'student' : 'studenten';
                    option.textContent = `🔒 ${project.projectTitel} (${project.studenten.length} ${studentText}) → Tafel ${tafelNr}`;
                    option.disabled = true;
                    optgroupAssigned.appendChild(option);
                });
                projectSelect.appendChild(optgroupAssigned);
            }
            
            console.log('🔄 Modal updated with projects data');
        }
    }    buildProjectenOptgroups() {
        if (!this.availableProjects || this.availableProjects.length === 0) {
            return '<option value="">Projecten laden...</option>';
        }

        // Bepaal welke projecten al toegewezen zijn aan tafels
        const toegewezenProjectTitels = new Set();
        Object.values(this.tafelData).forEach(t => {
            if (t.items && t.items.length > 0) {
                t.items.forEach(item => {
                    if (item.titel) {
                        toegewezenProjectTitels.add(item.titel);
                    }
                });
            }
        });

        const beschikbareProjecten = this.availableProjects.filter(p => 
            !toegewezenProjectTitels.has(p.projectTitel)
        ).sort((a, b) => a.projectTitel.localeCompare(b.projectTitel));
        
        const toegewezenProjecten = this.availableProjects.filter(p => 
            toegewezenProjectTitels.has(p.projectTitel)
        ).sort((a, b) => a.projectTitel.localeCompare(b.projectTitel));
        
        let html = '';
          // Beschikbare projecten
        if (beschikbareProjecten.length > 0) {
            html += '<optgroup label="📋 Nog aan te duiden projecten">';
            beschikbareProjecten.forEach(project => {
                const studentText = project.studenten.length === 1 ? 'student' : 'studenten';
                html += `<option value="${project.projectTitel}">
                    🎓 ${project.projectTitel} (${project.studenten.length} ${studentText})
                </option>`;
            });
            html += '</optgroup>';
        }
        
        // Toegewezen projecten
        if (toegewezenProjecten.length > 0) {
            html += '<optgroup label="✅ Al aangeduide projecten">';
            toegewezenProjecten.forEach(project => {
                // Zoek de tafel waar dit project aan is toegewezen
                let tafelNr = 'onbekend';
                for (const [tnr, tdata] of Object.entries(this.tafelData)) {
                    if (tdata.items && tdata.items.some(item => item.titel === project.projectTitel)) {
                        tafelNr = tnr;
                        break;
                    }
                }
                
                const studentText = project.studenten.length === 1 ? 'student' : 'studenten';
                html += `<option value="${project.projectTitel}" disabled>
                    🔒 ${project.projectTitel} (${project.studenten.length} ${studentText}) → Tafel ${tafelNr}
                </option>`;
            });
            html += '</optgroup>';
        }
        
        return html;
    }
}

// Maak instance beschikbaar op window voor onclick handlers
window.plattegrondManager = null;

// DOM ready handler
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing PlattegrondVoormiddagManager...');
    window.plattegrondManager = new PlattegrondVoormiddagManager();
});

console.log('✅ Plattegrond Voormiddag script loaded successfully');
