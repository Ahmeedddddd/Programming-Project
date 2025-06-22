// admin-panel.js - Fixed version met correcte database mapping


// ===== MENU TOGGLE FUNCTIONS (defined early) =====
function toggleMenu() {
    console.log('🎛️ toggleMenu called!');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.querySelector('.menu-overlay');
    const body = document.body;
    
    console.log('📱 SideMenu found:', !!sideMenu);
    console.log('🔄 Overlay found:', !!overlay);
    
    if (sideMenu) {
        // Check the actual computed style position, not just the class
        const computedStyle = window.getComputedStyle(sideMenu);
        const rightPos = computedStyle.right;
        const isVisuallyOpen = rightPos === '0px';
        const hasOpenClass = sideMenu.classList.contains('open');
        
        console.log('📊 Menu has open class:', hasOpenClass);
        console.log('📊 Menu right position:', rightPos);
        console.log('📊 Menu visually open:', isVisuallyOpen);
        
        // Use visual state as the source of truth, but force with inline styles
        if (isVisuallyOpen) {
            // Close menu - force with inline style
            console.log('❌ Closing menu with inline styles...');
            sideMenu.style.right = '-400px';
            sideMenu.classList.remove('open');
            body.classList.remove('menu-open');
            if (overlay) {
                overlay.classList.remove('show');
            }
        } else {
            // Open menu - force with inline style
            console.log('✅ Opening menu with inline styles...');
            sideMenu.style.right = '0px';
            sideMenu.classList.add('open');
            body.classList.add('menu-open');
            if (overlay) {
                overlay.classList.add('show');
            }
        }
        
        // Debug: Check final state
        const finalRight = window.getComputedStyle(sideMenu).right;
        console.log('🔍 Menu final right position:', finalRight);
        console.log('🔍 Menu final has open class:', sideMenu.classList.contains('open'));
    } else {
        console.error('❌ SideMenu element not found!');
    }
}

class AdminPanel {constructor() {
        this.API_BASE_URL = 'http://localhost:8383/api';
        this.students = [];
        this.companies = [];
        this.projects = [];
        this.appointments = [];
        this.currentEditId = null;
        this.currentEditType = null;
        this.authToken = this.getValidAuthToken();
        
        console.log('🚀 AdminPanel initializing...');
        console.log('Auth token available:', !!this.authToken);
        
        this.init();
    }    // ===== UTILITY METHODS =====
    getValidAuthToken() {
        const token = localStorage.getItem('authToken');
        return token;
    }
      setAuthToken(token) {
        this.authToken = token;
        localStorage.setItem('authToken', token);
        localStorage.setItem('authTokenTimestamp', Date.now().toString());
        
        console.log('✅ Auth token set successfully');
        this.loadAllData();
    }    clearAuthToken() {
        this.authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('authTokenTimestamp');
        console.log('🔑 Auth token cleared');
    }

    requiresAuth(action = 'deze actie') {
        if (!this.authToken) {
            this.showTemporaryMessage(`🔒 Login als organisator vereist voor ${action}`, 'info');
            return false;
        }
        return true;
    }
    
    async init() {
        console.log('🔧 Setting up event listeners...');
        this.setupEventListeners();
        this.initModal();
        
        // Force menu to be closed initially
        const sideMenu = document.getElementById('sideMenu');
        if (sideMenu) {
            sideMenu.classList.remove('open');
            document.body.classList.remove('menu-open');
            const overlay = document.querySelector('.menu-overlay');
            if (overlay) {
                overlay.classList.remove('show');
            }
            console.log('🔧 Forced menu to closed state on init');
        }
          console.log('📊 Loading data...');
        await this.loadAllData();
        console.log('✅ AdminPanel initialization complete!');
        
        // Force menu closed again after everything loads (to counter navigation manager)
        setTimeout(() => {
            const sideMenu = document.getElementById('sideMenu');
            if (sideMenu) {
                sideMenu.classList.remove('open');
                document.body.classList.remove('menu-open');
                const overlay = document.querySelector('.menu-overlay');
                if (overlay) {
                    overlay.classList.remove('show');
                }
                console.log('🔧 Re-forced menu to closed state after navigation load');
            }
        }, 100);
    }

    initModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }    }

    setupEventListeners() {
        // Search event listeners
        document.getElementById('student-search')?.addEventListener('input', (e) => {
            this.renderStudents(e.target.value);
        });

        document.getElementById('company-search')?.addEventListener('input', (e) => {
            this.renderCompanies(e.target.value);
        });

        document.getElementById('project-search')?.addEventListener('input', (e) => {
            this.renderProjects(e.target.value);
        });

        document.getElementById('appointment-search')?.addEventListener('input', (e) => {
            this.renderAppointments(e.target.value);
        });

        // Modal event listeners
        document.getElementById('modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });

        // Keyboard event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Section toggle listeners
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const sectionId = header.parentElement.id;
                this.toggleSection(sectionId);
            });
        });        // Burger menu toggle - with retry mechanism
        const setupBurgerToggle = () => {            const burgerToggle = document.getElementById('burgerToggle');
            console.log('🍔 BurgerToggle element found:', !!burgerToggle);
            
            // Debug: Check initial menu state
            const sideMenu = document.getElementById('sideMenu');
            if (sideMenu) {
                console.log('🔍 Initial menu state - has open class:', sideMenu.classList.contains('open'));
                console.log('🔍 Initial menu classList:', Array.from(sideMenu.classList));
                
                // Force menu to be closed initially
                sideMenu.classList.remove('open');
                document.body.classList.remove('menu-open');
                const overlay = document.querySelector('.menu-overlay');
                if (overlay) {
                    overlay.classList.remove('show');
                }
                console.log('🔧 Forced menu to closed state');
            }if (burgerToggle) {
                burgerToggle.addEventListener('click', (e) => {
                    console.log('🍔 Burger clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🔍 About to call toggleMenu...');
                    console.log('🔍 toggleMenu type:', typeof toggleMenu);
                    console.log('🔍 toggleMenu function:', toggleMenu);
                    
                    try {
                        toggleMenu();
                        console.log('✅ toggleMenu called successfully');
                    } catch (error) {
                        console.error('❌ Error calling toggleMenu:', error);
                    }
                });
                return true;
            } else {
                console.warn('⚠️ BurgerToggle element not found, retrying...');
                return false;
            }
        };

        // Try immediately
        if (!setupBurgerToggle()) {
            // If not found, retry after navigation loads
            setTimeout(() => {
                if (!setupBurgerToggle()) {
                    console.error('❌ BurgerToggle element not found after retry!');
                }
            }, 1000);
        }
    }

    // ===== API HELPER METHODS =====
    async apiRequest(endpoint, method = 'GET', data = null, requireAuth = false) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add auth token if available and required
        if (requireAuth && this.authToken) {
            config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (data) {
            config.body = JSON.stringify(data);
        }        try {
            console.log(`🌐 API Request: ${method} ${endpoint}`);
            
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, config);
            
            if (!response.ok) {
                let errorMessage;
                try {
                    const error = await response.json();
                    errorMessage = error.message || error.error || `HTTP ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ API Error:', error);
            
            if (error.message?.includes('Access token required') && !this.authToken) {
                if (method !== 'GET') {
                    this.showTemporaryMessage('🔒 Login als organisator vereist voor deze actie', 'info');
                }
            } else {
                this.showTemporaryMessage(`❌ ${error.message}`, 'error');
            }
            throw error;
        }
    }    // ===== DATA LOADING METHODS =====
    async loadAllData() {
        try {
            await Promise.all([
                this.loadStatistics(),
                this.loadStudents(),
                this.loadCompanies(),
                this.loadProjects(),
                this.loadAppointments()
            ]);
            
            // Add scroll indicators after data is loaded
            setTimeout(() => this.addScrollIndicators(), 100);
        } catch (error) {
            this.showTemporaryMessage('❌ Fout bij laden van gegevens', 'error');
        }
    }

    async loadStatistics() {
        try {
            // FIXED: gebruik correcte endpoints voor stats
            const [studentStats, companyStats, projectStats] = await Promise.all([
                this.apiRequest('/studenten').catch(() => ({ data: [] })),
                this.apiRequest('/bedrijven').catch(() => ({ data: [] })),
                this.apiRequest('/projecten/with-ids').catch(() => ({ data: [] }))
            ]);

            // Update statistiek counters
            const studentCount = studentStats.count || studentStats.data?.length || 0;
            const companyCount = companyStats.count || companyStats.data?.length || 0;
            const projectCount = projectStats.count || projectStats.data?.length || 0;
            
            document.getElementById('student-count').textContent = studentCount;
            document.getElementById('company-count').textContent = companyCount;
            document.getElementById('project-count').textContent = projectCount;
            
            // Voor appointments - probeer met auth token
            try {
                const appointmentStats = await this.apiRequest('/reservaties', 'GET', null, true);
                document.getElementById('appointment-count').textContent = appointmentStats.count || appointmentStats.data?.length || 0;
            } catch (error) {
                document.getElementById('appointment-count').textContent = '0';
                console.log('ℹ️ Appointments require authentication');
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
            // Set default values
            document.getElementById('student-count').textContent = '0';
            document.getElementById('company-count').textContent = '0';
            document.getElementById('project-count').textContent = '0';
            document.getElementById('appointment-count').textContent = '0';
        }
    }

    async loadStudents() {
        try {
            const response = await this.apiRequest('/studenten');
            this.students = response.data || response;
            this.renderStudents();
        } catch (error) {
            document.getElementById('students-list').innerHTML = 
                '<div class="error-message">Fout bij laden van studenten</div>';
        }
    }

    async loadCompanies() {
        try {
            const response = await this.apiRequest('/bedrijven');
            this.companies = response.data || response;
            this.renderCompanies();        } catch (error) {
            document.getElementById('companies-list').innerHTML = 
                '<div class="error-message">Fout bij laden van bedrijven</div>';
        }
    }

    async loadProjects() {
        try {
            // Use the same endpoint as alle-projecten for consistent data structure
            const response = await this.apiRequest('/projecten/with-ids');
            let projects = response.data || response;
            
            this.projects = projects;
            this.renderProjects();
        } catch (error) {
            console.error('❌ Error loading projects:', error);
            document.getElementById('projects-list').innerHTML = 
                '<div class="error-message">Fout bij laden van projecten</div>';
        }
    }

    async loadAppointments() {
        try {            const response = await this.apiRequest('/reservaties', 'GET', null, true);
            this.appointments = response.data || response;
            this.renderAppointments();
        } catch (error) {
            console.log('ℹ️ Could not load appointments:', error.message);
            this.appointments = [];
            document.getElementById('appointments-list').innerHTML = 
                '<div class="no-items">🔒 Login vereist om afspraken te bekijken</div>';
        }
    }

    // ===== UI HELPER METHODS =====
    toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        section?.classList.toggle('expanded');
    }

    expandSection(sectionId) {
        const section = document.getElementById(sectionId);
        section?.classList.add('expanded');
    }

    showModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'flex';
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                const firstInput = modal.querySelector('input, textarea, button');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        this.currentEditId = null;
        this.currentEditType = null;
    }

    showTemporaryMessage(message, type = 'success') {
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
            ${type === 'success' ? 
                'background: linear-gradient(135deg, #27ae60, #2ecc71);' : 
                type === 'error' ?
                'background: linear-gradient(135deg, #e74c3c, #c0392b);' :
                'background: linear-gradient(135deg, #3498db, #2980b9);'
            }
        `;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 4000); // FIXED: Longer display time for better UX
    }    getFieldLabel(field) {
        const labels = {
            voornaam: 'Voornaam',
            achternaam: 'Achternaam',
            naam: 'Bedrijfsnaam',
            email: 'Email',
            gsm_nummer: 'GSM Nummer',
            opleiding: 'Opleiding',
            opleidingsrichting: 'Opleidingsrichting',
            projectTitel: 'Project Titel',
            titel: 'Project Titel',
            projectBeschrijving: 'Project Beschrijving',
            beschrijving: 'Project Beschrijving',
            technologieen: 'Technologieën',
            studenten: 'Studenten',
            overMezelf: 'Over mezelf',
            sector: 'Sector',
            TVA_nummer: 'TVA Nummer',
            straatnaam: 'Straat',
            huisnummer: 'Huisnummer',
            gemeente: 'Gemeente',
            postcode: 'Postcode',
            bus: 'Bus',
            land: 'Land',
            studentNaam: 'Student',
            bedrijfNaam: 'Bedrijf',
            startTijd: 'Start Tijd',
            eindTijd: 'Eind Tijd',
            status: 'Status'
        };
        return labels[field] || field;
    }

    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'Onbekend';
        const date = new Date(dateTimeString);
        return date.toLocaleString('nl-BE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(timeString) {
        if (!timeString) return 'Onbekend';
        // FIXED: Handle time strings properly
        if (timeString.includes('T')) {
            const date = new Date(timeString);
            return date.toLocaleTimeString('nl-BE', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            // Handle time-only strings like "13:30:00"
            const timeParts = timeString.split(':');
            return `${timeParts[0]}:${timeParts[1]}`;
        }
    }

    // FIXED: Status mappings die overeenkomen met database
    getStatusText(status) {
        const statusMap = {
            'gepland': 'Gepland',
            'bevestigd': 'Bevestigd',
            'geannuleerd': 'Geannuleerd',
            'afgewerkt': 'Afgewerkt',
            'no-show': 'No-show',
            // Extra statuses from backend
            'aangevraagd': 'Aangevraagd',
            'geweigerd': 'Geweigerd',
            'voltooid': 'Voltooid'
        };
        return statusMap[status] || status;
    }

    // FIXED: Status color classes
    getStatusClass(status) {
        const statusClasses = {
            'gepland': 'status-gepland',
            'bevestigd': 'status-bevestigd',
            'geannuleerd': 'status-geannuleerd',
            'afgewerkt': 'status-afgewerkt',
            'no-show': 'status-no-show',
            'aangevraagd': 'status-aangevraagd',
            'geweigerd': 'status-geweigerd',
            'voltooid': 'status-voltooid'
        };
        return statusClasses[status] || 'status-onbekend';
    }

    // ===== RENDERING METHODS =====
    renderStudents(searchTerm = '') {
        const container = document.getElementById('students-list');
        if (!container) return;

        const filtered = this.students.filter(student => 
            student.voornaam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.achternaam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentnummer?.toString().includes(searchTerm.toLowerCase()) ||
            (student.opleidingsrichting && student.opleidingsrichting.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-items">Geen studenten gevonden</div>';
            return;
        }

        container.innerHTML = filtered.map(student => `
            <div class="item-card student" onclick="adminPanel.showDetails('student', '${student.studentnummer}')">
                <div class="quick-actions">
                    <button class="quick-action-btn quick-edit" onclick="event.stopPropagation(); adminPanel.showEditModal('student', '${student.studentnummer}')" title="Bewerken">
                        ✏️
                    </button>
                    <button class="quick-action-btn quick-delete" onclick="event.stopPropagation(); adminPanel.deleteItem('student', '${student.studentnummer}')" title="Verwijderen">
                        🗑️
                    </button>
                </div>
                <div class="item-name">${student.voornaam} ${student.achternaam}</div>
                <div class="item-info">${student.studentnummer} • ${student.opleidingsrichting || 'Geen richting'} • ${student.email}</div>
            </div>
        `).join('');
    }

    renderCompanies(searchTerm = '') {
        const container = document.getElementById('companies-list');
        if (!container) return;

        const filtered = this.companies.filter(company => 
            company.naam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.sector?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-items">Geen bedrijven gevonden</div>';
            return;
        }

        container.innerHTML = filtered.map(company => `
            <div class="item-card company" onclick="adminPanel.showDetails('company', '${company.bedrijfsnummer}')">
                <div class="quick-actions">
                    <button class="quick-action-btn quick-edit" onclick="event.stopPropagation(); adminPanel.showEditModal('company', '${company.bedrijfsnummer}')" title="Bewerken">
                        ✏️
                    </button>
                    <button class="quick-action-btn quick-delete" onclick="event.stopPropagation(); adminPanel.deleteItem('company', '${company.bedrijfsnummer}')" title="Verwijderen">
                        🗑️
                    </button>
                </div>
                <div class="item-name">${company.naam}</div>
                <div class="item-info">${company.sector} • ${company.email}</div>
            </div>
        `).join('');
    }    renderProjects(searchTerm = '') {
        const container = document.getElementById('projects-list');
        if (!container) return;        const filtered = this.projects.filter(project => {
            const title = project.titel || project.projectTitel || '';
            const desc = project.beschrijving || project.projectBeschrijving || '';
            
            // Search in title and description
            if (title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                desc.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }
            
            // Search in student names (array of objects)
            if (project.studenten && Array.isArray(project.studenten)) {
                return project.studenten.some(student => {
                    const naam = student.naam || `${student.voornaam || ''} ${student.achternaam || ''}`.trim();
                    return naam.toLowerCase().includes(searchTerm.toLowerCase());
                });
            }
            
            return false;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-items">Geen projecten gevonden</div>';
            return;
        }        container.innerHTML = filtered.map(project => {
            // Handle array of student objects (from /api/projecten/with-ids)
            const students = project.studenten || [];
            const studentCount = students.length;
            const studentNames = students.map(s => s.naam || `${s.voornaam || ''} ${s.achternaam || ''}`.trim()).filter(name => name);
            const studentNamesString = studentNames.join(', ');

            const projectTitle = project.titel || project.projectTitel || 'Geen titel';
            const projectId = project.id || projectTitle;

            return `                <div class="item-card project" onclick="adminPanel.showDetails('project', '${projectTitle}')">
                    <div class="quick-actions">
                        <button class="quick-action-btn quick-edit" onclick="event.stopPropagation(); adminPanel.showEditModal('project', '${projectId}')" title="Project Bewerken">
                            ✏️
                        </button>
                        <button class="quick-action-btn quick-delete" onclick="event.stopPropagation(); adminPanel.deleteProject('${projectTitle}')" title="Project Verwijderen">
                            🗑️
                        </button>
                    </div>
                    <div class="item-name">${projectTitle}</div>
                    <div class="item-info">                        <div class="project-students">
                            <strong>👥 ${studentCount} student${studentCount === 1 ? '' : 'en'}:</strong>                            <div class="student-names">
                ${studentNamesString || 'Geen studenten gevonden'}
                            </div>
                        </div>
                        ${project.technologieen ? `<div class="project-tech">🔧 ${project.technologieen}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // FIXED: Appointments rendering met correcte status mapping
    renderAppointments(searchTerm = '') {
        const container = document.getElementById('appointments-list');
        if (!container) return;

        const filtered = this.appointments.filter(appointment => 
            appointment.studentNaam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.bedrijfNaam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.status?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-items">Geen afspraken gevonden</div>';
            return;
        }        container.innerHTML = filtered.map(appointment => `
            <div class="item-card appointment" onclick="adminPanel.showDetails('appointment', '${appointment.id}')">
                <div class="quick-actions">
                    <button class="quick-action-btn quick-edit" onclick="event.stopPropagation(); adminPanel.showEditModal('appointment', '${appointment.id}')" title="Status Bewerken">
                        ✏️
                    </button>
                    <button class="quick-action-btn quick-cancel" onclick="event.stopPropagation(); adminPanel.cancelAppointment('${appointment.id}')" title="Afspraak Annuleren">
                        ❌
                    </button>
                </div>
                <div class="item-name">${appointment.studentNaam} ↔ ${appointment.bedrijfNaam}</div>
                <div class="item-info">
                    ${this.formatDateTime(appointment.startTijd)} - ${this.formatTime(appointment.eindTijd)} • 
                    <span class="status-badge ${this.getStatusClass(appointment.status)}">${this.getStatusText(appointment.status)}</span>
                </div>
            </div>
        `).join('');
    }

    // ===== MODAL METHODS =====
    showAddModal(type) {
        if (!this.requiresAuth('nieuwe items toevoegen')) {
            return;
        }

        this.currentEditId = null;
        this.currentEditType = type;
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        let formHtml = '';
        
        switch(type) {
            case 'student':
                title.textContent = 'Student Toevoegen';
                formHtml = this.getStudentFormHtml();
                break;
                
            case 'company':
                title.textContent = 'Bedrijf Toevoegen';
                formHtml = this.getCompanyFormHtml();
                break;
                
            case 'project':
                this.showTemporaryMessage('ℹ️ Projecten worden beheerd via studentgegevens', 'info');
                return;
        }

        body.innerHTML = formHtml;
        
        const form = document.getElementById('data-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        this.showModal();
    }

    showEditModal(type, id) {
        if (!this.requiresAuth('items bewerken')) {
            return;
        }

        this.currentEditType = type;
        this.currentEditId = id;
        
        let item;
        let title;

        switch(type) {
            case 'student':
                item = this.students.find(s => s.studentnummer == id);
                title = 'Student Bewerken';
                break;            case 'company':
                item = this.companies.find(c => c.bedrijfsnummer == id);
                title = 'Bedrijf Bewerken';
                break;
            case 'project':
                item = this.projects.find(p => (p.titel || p.projectTitel) == id);
                title = 'Project Bewerken';
                break;
            case 'appointment':
                item = this.appointments.find(a => a.id == id);
                title = 'Afspraak Status Wijzigen';
                break;
        }

        if (!item) {
            this.showTemporaryMessage('❌ Item niet gevonden', 'error');
            return;
        }
        
        document.getElementById('modal-title').textContent = title;
        
        let formHtml = '';
        
        switch(type) {
            case 'student':
                formHtml = this.getStudentFormHtml(item);
                break;
                  case 'company':
                formHtml = this.getCompanyFormHtml(item);
                break;
            
            case 'project':
                formHtml = this.getProjectFormHtml(item);
                break;

            case 'appointment':
                formHtml = this.getAppointmentFormHtml(item);
                break;
        }

        document.getElementById('modal-body').innerHTML = formHtml;
        
        const form = document.getElementById('data-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        this.showModal();
    }

    showDetails(type, id) {
        let item;
        let title;

        switch(type) {
            case 'student':
                item = this.students.find(s => s.studentnummer == id);
                title = 'Student Details';
                break;
            case 'company':
                item = this.companies.find(c => c.bedrijfsnummer == id);
                title = 'Bedrijf Details';
                break;            case 'project':
                item = this.projects.find(p => (p.titel || p.projectTitel) == id);
                title = 'Project Details';
                break;
            case 'appointment':
                item = this.appointments.find(a => a.id == id);
                title = 'Afspraak Details';
                break;
        }

        if (!item) {
            this.showTemporaryMessage('❌ Item niet gevonden', 'error');
            return;
        }

        document.getElementById('modal-title').textContent = title;
          let detailsHtml = '';
        for (const [key, value] of Object.entries(item)) {
            if (key !== 'studentnummer' && key !== 'bedrijfsnummer' && key !== 'id' && value) {
                const label = this.getFieldLabel(key);
                let displayValue = value;
                
                if (key === 'email') {
                    displayValue = `<a href="mailto:${value}" style="color: #881538;">${value}</a>`;
                } else if (key === 'gsm_nummer') {
                    displayValue = `<a href="tel:${value}" style="color: #881538;">${value}</a>`;
                } else if (key === 'startTijd') {
                    displayValue = this.formatDateTime(value);
                } else if (key === 'eindTijd') {
                    displayValue = this.formatTime(value);
                } else if (key === 'status') {
                    displayValue = `<span class="status-badge ${this.getStatusClass(value)}">${this.getStatusText(value)}</span>`;
                } else if (key === 'studenten' && Array.isArray(value)) {
                    // Speciale behandeling voor studenten array
                    const studentNames = value.map(student => {
                        if (typeof student === 'object') {
                            return student.naam || `${student.voornaam || ''} ${student.achternaam || ''}`.trim() || 'Onbekende student';
                        }
                        return student;
                    }).filter(name => name);
                    displayValue = studentNames.length > 0 ? studentNames.join(', ') : 'Geen studenten';
                } else if (Array.isArray(value)) {
                    // Algemene behandeling voor andere arrays
                    displayValue = value.join(', ');
                }
                
                detailsHtml += `
                    <div class="detail-item">
                        <span class="detail-label">${label}:</span>
                        <span class="detail-value">${displayValue}</span>
                    </div>
                `;
            }
        }        // Add action buttons
        let editButtonText = '✏️ Bewerken';
        let editAction = `adminPanel.showEditModal('${type}', '${id}')`;
        let deleteButtonText = '🗑️ Verwijderen';
        let deleteAction = `adminPanel.deleteItem('${type}', '${id}')`;
        
        if (type === 'appointment') {
            editButtonText = '📝 Status Wijzigen';
            deleteButtonText = '❌ Annuleren';
            deleteAction = `adminPanel.cancelAppointment('${id}')`;
        }

        detailsHtml += `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #f8f9fa; display: flex; gap: 1rem;">
                <button onclick="${editAction}" class="submit-btn" style="background: linear-gradient(135deg, #f39c12, #e67e22); flex: 1;">
                    ${editButtonText}
                </button>
                <button onclick="${deleteAction}" class="submit-btn" style="background: linear-gradient(135deg, #e74c3c, #c0392b); flex: 1;">
                    ${deleteButtonText}
                </button>
            </div>
        `;

        document.getElementById('modal-body').innerHTML = detailsHtml;
        this.showModal();
    }

    showProjectDetails(projectTitel) {
        const project = this.projects.find(p => p.projectTitel === projectTitel);
        
        if (!project) {
            this.showTemporaryMessage('❌ Project niet gevonden', 'error');
            return;
        }

        document.getElementById('modal-title').textContent = 'Project Details';
        
        // Parse student names
        const studentNames = project.studenten ? project.studenten.split(', ') : [];
        const studentCount = studentNames.length;
        
        const detailsHtml = `
            <div class="project-details">
                <div class="detail-item">
                    <span class="detail-label">Project Titel:</span>
                    <span class="detail-value"><strong>${project.projectTitel}</strong></span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Beschrijving:</span>
                    <span class="detail-value">${project.projectBeschrijving || 'Geen beschrijving beschikbaar'}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Teamleden (${studentCount}):</span>
                    <span class="detail-value">
                        <div class="student-list">
                            ${studentNames.map(name => `<span class="student-tag">👤 ${name.trim()}</span>`).join('')}
                        </div>
                    </span>
                </div>
                
                ${project.technologieen ? `
                    <div class="detail-item">
                        <span class="detail-label">Technologieën:</span>
                        <span class="detail-value">
                            <div class="tech-list">
                                ${project.technologieen.split(', ').map(tech => `<span class="tech-tag">🔧 ${tech.trim()}</span>`).join('')}
                            </div>
                        </span>
                    </div>
                ` : ''}
            </div>
            
            <style>
                .student-list, .tech-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                .student-tag, .tech-tag {
                    background: #f0f0f0;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    border-left: 3px solid #881538;
                }
                .tech-tag {
                    border-left-color: #007acc;
                }
            </style>
        `;

        document.getElementById('modal-body').innerHTML = detailsHtml;
        this.showModal();
    }

    // ===== FORM HTML GENERATORS =====
    getStudentFormHtml(item = null) {
        const isEdit = !!item;
        return `
            <form id="data-form">
                <div class="form-group">
                    <label class="form-label">Studentnummer *</label>
                    <input type="text" class="form-input" name="studentnummer" value="${item?.studentnummer || ''}" required ${isEdit ? 'readonly' : ''} placeholder="S20240001">
                </div>
                <div class="form-group">
                    <label class="form-label">Voornaam *</label>
                    <input type="text" class="form-input" name="voornaam" value="${item?.voornaam || ''}" required placeholder="Jan">
                </div>
                <div class="form-group">
                    <label class="form-label">Achternaam *</label>
                    <input type="text" class="form-input" name="achternaam" value="${item?.achternaam || ''}" required placeholder="Janssen">
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-input" name="email" value="${item?.email || ''}" required placeholder="jan.janssen@student.ehb.be">
                </div>
                <div class="form-group">
                    <label class="form-label">GSM Nummer</label>
                    <input type="tel" class="form-input" name="gsm_nummer" value="${item?.gsm_nummer || ''}" placeholder="04XX XX XX XX">
                </div>
                <div class="form-group">
                    <label class="form-label">Opleiding</label>
                    <input type="text" class="form-input" name="opleiding" value="${item?.opleiding || ''}" placeholder="Bachelor">
                </div>
                <div class="form-group">
                    <label class="form-label">Opleidingsrichting</label>
                    <input type="text" class="form-input" name="opleidingsrichting" value="${item?.opleidingsrichting || ''}" placeholder="Toegepaste Informatica">
                </div>
                <div class="form-group">
                    <label class="form-label">Project Titel</label>
                    <input type="text" class="form-input" name="projectTitel" value="${item?.projectTitel || ''}" placeholder="Mijn Project">
                </div>
                <div class="form-group">
                    <label class="form-label">Project Beschrijving</label>
                    <textarea class="form-input form-textarea" name="projectBeschrijving" placeholder="Beschrijving van het project...">${item?.projectBeschrijving || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Over mezelf</label>
                    <textarea class="form-input form-textarea" name="overMezelf" placeholder="Korte beschrijving over mezelf...">${item?.overMezelf || ''}</textarea>
                </div>
                <button type="submit" class="submit-btn">${isEdit ? 'Student Bijwerken' : 'Student Toevoegen'}</button>
            </form>
        `;
    }

    getCompanyFormHtml(item = null) {
        const isEdit = !!item;
        return `
            <form id="data-form">
                <div class="form-group">
                    <label class="form-label">Bedrijfsnaam *</label>
                    <input type="text" class="form-input" name="naam" value="${item?.naam || ''}" required placeholder="Bedrijfsnaam BV">
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-input" name="email" value="${item?.email || ''}" required placeholder="info@bedrijf.be">
                </div>
                <div class="form-group">
                    <label class="form-label">Sector *</label>
                    <input type="text" class="form-input" name="sector" value="${item?.sector || ''}" required placeholder="IT Services">
                </div>
                <div class="form-group">
                    <label class="form-label">TVA Nummer</label>
                    <input type="text" class="form-input" name="TVA_nummer" value="${item?.TVA_nummer || ''}" placeholder="BE123456789">
                </div>
                <div class="form-group">
                    <label class="form-label">GSM Nummer</label>
                    <input type="tel" class="form-input" name="gsm_nummer" value="${item?.gsm_nummer || ''}" placeholder="02 XXX XX XX">
                </div>
                <div class="form-group">
                    <label class="form-label">Straatnaam</label>
                    <input type="text" class="form-input" name="straatnaam" value="${item?.straatnaam || ''}" placeholder="Straatnaam">
                </div>
                <div class="form-group">
                    <label class="form-label">Huisnummer</label>
                    <input type="text" class="form-input" name="huisnummer" value="${item?.huisnummer || ''}" placeholder="123">
                </div>
                <div class="form-group">
                    <label class="form-label">Gemeente</label>
                    <input type="text" class="form-input" name="gemeente" value="${item?.gemeente || ''}" placeholder="Brussel">
                </div>
                <div class="form-group">
                    <label class="form-label">Postcode</label>
                    <input type="text" class="form-input" name="postcode" value="${item?.postcode || ''}" placeholder="1000">
                </div>
                <div class="form-group">
                    <label class="form-label">Land</label>
                    <input type="text" class="form-input" name="land" value="${item?.land || ''}" placeholder="België">
                </div>
                <button type="submit" class="submit-btn">${isEdit ? 'Bedrijf Bijwerken' : 'Bedrijf Toevoegen'}</button>
            </form>
        `;
    }

    // FIXED: Appointment form met correcte database statuses
    getAppointmentFormHtml(item = null) {
        return `
            <form id="data-form">
                <div class="form-group">
                    <label class="form-label">Student</label>
                    <input type="text" class="form-input" value="${item?.studentNaam || ''}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">Bedrijf</label>
                    <input type="text" class="form-input" value="${item?.bedrijfNaam || ''}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">Start Tijd</label>
                    <input type="text" class="form-input" value="${this.formatDateTime(item?.startTijd)}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">Eind Tijd</label>
                    <input type="text" class="form-input" value="${this.formatTime(item?.eindTijd)}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">Status *</label>
                    <select class="form-input" name="status" required>
                        <option value="gepland" ${item?.status === 'gepland' ? 'selected' : ''}>Gepland</option>
                        <option value="bevestigd" ${item?.status === 'bevestigd' ? 'selected' : ''}>Bevestigd</option>
                        <option value="geannuleerd" ${item?.status === 'geannuleerd' ? 'selected' : ''}>Geannuleerd</option>
                        <option value="afgewerkt" ${item?.status === 'afgewerkt' ? 'selected' : ''}>Afgewerkt</option>
                        <option value="no-show" ${item?.status === 'no-show' ? 'selected' : ''}>No-show</option>
                    </select>
                </div>
                <button type="submit" class="submit-btn">Status Bijwerken</button>
            </form>
        `;
    }

    getProjectFormHtml(item = null) {
        const isEdit = !!item;
        
        // Voor projecten tonen we alle relevante velden
        const studentNames = item?.studenten ? 
            item.studenten.map(s => s.naam || `${s.voornaam || ''} ${s.achternaam || ''}`.trim()).join(', ') 
            : '';

        return `
            <form id="data-form">
                <div class="form-group">
                    <label class="form-label">Project Titel *</label>
                    <input type="text" class="form-input" name="titel" value="${item?.titel || item?.projectTitel || ''}" required placeholder="Mijn geweldige project">
                </div>
                <div class="form-group">
                    <label class="form-label">Project Beschrijving *</label>
                    <textarea class="form-input" name="beschrijving" rows="4" required placeholder="Beschrijf je project...">${item?.beschrijving || item?.projectBeschrijving || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Technologieën</label>
                    <input type="text" class="form-input" name="technologieen" value="${item?.technologieen || ''}" placeholder="JavaScript, React, Node.js, ...">
                </div>
                <div class="form-group">
                    <label class="form-label">Gekoppelde Studenten</label>
                    <input type="text" class="form-input" value="${studentNames}" disabled readonly 
                           placeholder="Geen studenten gekoppeld" 
                           title="Studenten kunnen alleen via de student bewerking aangepast worden">
                    <small style="color: #666; font-size: 0.8rem;">
                        💡 Tip: Om studenten toe te voegen/verwijderen, bewerk de individuele studenten
                    </small>
                </div>
                <button type="submit" class="submit-btn">${isEdit ? 'Project Bijwerken' : 'Project Toevoegen'}</button>
            </form>
        `;
    }

    // ===== CRUD OPERATIONS =====
    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (!this.requiresAuth('studenten/bedrijven/afspraken beheren')) {
            return;
        }

        const formData = new FormData(event.target);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value || null;
        });

        try {
            if (this.currentEditId) {
                // Update existing item
                switch(this.currentEditType) {
                    case 'student':
                        await this.apiRequest(`/studenten/${this.currentEditId}`, 'PUT', data, true);
                        await this.loadStudents();
                        break;
                    case 'company':
                        await this.apiRequest(`/bedrijven/${this.currentEditId}`, 'PUT', data, true);
                        await this.loadCompanies();
                        break;
                    case 'project':
                        await this.apiRequest(`/projecten/${this.currentEditId}`, 'PUT', data, true);
                        await this.loadProjects();
                        break;                    case 'appointment':
                        // Probeer eerst admin status endpoint, val terug naar algemene updates
                        try {
                            await this.apiRequest(`/reservaties/${this.currentEditId}/admin-status`, 'PUT', data, true);                        } catch (adminError) {
                            try {
                                await this.apiRequest(`/reservaties/${this.currentEditId}/status`, 'PUT', data, true);
                            } catch (statusError) {
                                const appointment = this.appointments.find(a => a.id == this.currentEditId);
                                if (appointment) {
                                    const updateData = { ...appointment, ...data };
                                    delete updateData.id;
                                    await this.apiRequest(`/reservaties/${this.currentEditId}`, 'PUT', updateData, true);
                                } else {
                                    throw new Error('Afspraak niet gevonden voor update');
                                }
                            }
                        }
                        await this.loadAppointments();
                        break;
                }
                this.showTemporaryMessage('✅ Item succesvol bijgewerkt!', 'success');
            } else {
                // Create new item
                switch(this.currentEditType) {
                    case 'student':
                        await this.apiRequest('/studenten', 'POST', data, true);
                        await this.loadStudents();
                        break;
                    case 'company':
                        await this.apiRequest('/bedrijven', 'POST', data, true);
                        await this.loadCompanies();
                        break;
                    case 'project':
                        await this.apiRequest('/projecten', 'POST', data, true);
                        await this.loadProjects();
                        break;
                }
                this.showTemporaryMessage('✅ Item succesvol toegevoegd!', 'success');
            }
            
            await this.loadStatistics();
            await this.loadProjects(); // Refresh projects as they might have changed
            this.closeModal();
        } catch (error) {
            // Error message is already shown by apiRequest
            console.error('Form submit error:', error);
        }
    }

    async deleteItem(type, id) {
        if (!this.requiresAuth('items verwijderen')) {
            return;
        }

        let itemName = '';
        let confirmMessage = '';
        
        switch(type) {
            case 'student':
                const student = this.students.find(s => s.studentnummer == id);
                itemName = student ? `${student.voornaam} ${student.achternaam}` : 'Deze student';
                confirmMessage = `Weet je zeker dat je de student "${itemName}" wilt verwijderen?`;
                break;
            case 'company':
                const company = this.companies.find(c => c.bedrijfsnummer == id);
                itemName = company ? company.naam : 'Dit bedrijf';
                confirmMessage = `Weet je zeker dat je het bedrijf "${itemName}" wilt verwijderen?`;
                break;
            case 'project':
                const project = this.projects.find(p => (p.id || p.titel || p.projectTitel) == id);
                itemName = project ? (project.titel || project.projectTitel || 'Dit project') : 'Dit project';
                confirmMessage = `Weet je zeker dat je het project "${itemName}" wilt verwijderen?`;
                break;
            case 'appointment':
                const appointment = this.appointments.find(a => a.id == id);
                itemName = appointment ? `${appointment.studentNaam} ↔ ${appointment.bedrijfNaam}` : 'Deze afspraak';
                confirmMessage = `Weet je zeker dat je de afspraak "${itemName}" wilt verwijderen?`;
                break;
        }
        
        if (confirm(confirmMessage + '\n\nDeze actie kan niet ongedaan worden gemaakt.')) {
            try {
                switch(type) {
                    case 'student':
                        await this.apiRequest(`/studenten/${id}`, 'DELETE', null, true);
                        await this.loadStudents();
                        await this.loadProjects(); // Projects kunnen veranderen
                        break;
                    case 'company':
                        await this.apiRequest(`/bedrijven/${id}`, 'DELETE', null, true);
                        await this.loadCompanies();
                        break;
                    case 'project':
                        await this.apiRequest(`/projecten/${id}`, 'DELETE', null, true);
                        await this.loadProjects();
                        await this.loadStudents(); // Studenten kunnen veranderen
                        break;
                    case 'appointment':
                        // FIXED: Use correct endpoint
                        await this.apiRequest(`/reservaties/${id}`, 'DELETE', null, true);
                        await this.loadAppointments();
                        break;
                }
                
                await this.loadStatistics();
                this.showTemporaryMessage('🗑️ Item succesvol verwijderd!', 'success');
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
    }
    
    async cancelAppointment(appointmentId) {
        if (!this.requiresAuth('afspraken annuleren')) {
            return;
        }

        const appointment = this.appointments.find(a => a.id == appointmentId);
        if (!appointment) {
            this.showTemporaryMessage('❌ Afspraak niet gevonden', 'error');
            return;
        }

        if (appointment.status === 'geannuleerd') {
            this.showTemporaryMessage('ℹ️ Deze afspraak is al geannuleerd', 'info');
            return;
        }

        if (!confirm(`Weet je zeker dat je de afspraak tussen ${appointment.studentNaam} en ${appointment.bedrijfNaam} wilt annuleren?`)) {
            return;
        }

        try {
            let success = false;
            let successMethod = '';            // Probeer verschillende endpoints in volgorde van voorkeur
            const attempts = [
                // 1. Admin-specifieke endpoints (nieuw toegevoegd)
                { 
                    endpoint: `/reservaties/${appointmentId}/admin-cancel`, 
                    method: 'PUT', 
                    data: {},
                    description: 'admin cancel endpoint'
                },
                { 
                    endpoint: `/reservaties/${appointmentId}/admin-status`, 
                    method: 'PUT', 
                    data: { status: 'geannuleerd' },
                    description: 'admin status endpoint'
                },
                // 2. Specifieke cancel endpoints (voor studenten)
                { 
                    endpoint: `/reservaties/${appointmentId}/cancel`, 
                    method: 'PUT', 
                    data: {},
                    description: 'student cancel endpoint'
                },
                // 3. Algemene status endpoints
                { 
                    endpoint: `/reservaties/${appointmentId}/status`, 
                    method: 'PUT', 
                    data: { status: 'geannuleerd' },
                    description: 'status PUT endpoint'
                },
                { 
                    endpoint: `/reservaties/${appointmentId}/status`, 
                    method: 'PATCH', 
                    data: { status: 'geannuleerd' },
                    description: 'status PATCH endpoint'
                },
                // 4. Directe update endpoints
                { 
                    endpoint: `/reservaties/${appointmentId}`, 
                    method: 'PATCH', 
                    data: { status: 'geannuleerd' },
                    description: 'PATCH endpoint'
                },
                // 5. Volledige PUT update (fallback)
                { 
                    endpoint: `/reservaties/${appointmentId}`, 
                    method: 'PUT', 
                    data: { ...appointment, status: 'geannuleerd', id: undefined },
                    description: 'volledige PUT endpoint'
                }
            ];            for (const attempt of attempts) {
                try {
                    await this.apiRequest(attempt.endpoint, attempt.method, attempt.data, true);
                    success = true;
                    successMethod = attempt.description;
                    break;
                } catch (error) {
                    // Stop bij bepaalde kritieke fouten
                    if (error.message.includes('403') || error.message.includes('Unauthorized')) {
                        throw new Error('Geen rechten om afspraken te annuleren');
                    }
                    
                    // Ga door naar volgende poging voor andere fouten (404, 500, etc.)
                }
            }

            if (!success) {
                throw new Error('Geen van de API endpoints ondersteunt het annuleren van afspraken. Neem contact op met de systeembeheerder.');
            }
              await this.loadAppointments();
            await this.loadStatistics();
            this.showTemporaryMessage(`✅ Afspraak succesvol geannuleerd via ${successMethod}!`, 'success');
        } catch (error) {
            console.error('Cancel appointment error:', error);
            this.showTemporaryMessage('❌ Fout bij annuleren afspraak: ' + (error.message || error), 'error');
        }
    }

    showEditProjectModal(projectTitle) {
        const project = this.projects.find(p => (p.titel || p.projectTitel) === projectTitle);
        
        if (!project) {
            this.showTemporaryMessage('❌ Project niet gevonden', 'error');
            return;
        }

        // For projects, we'll show a modal to edit project details
        // Since projects are linked to students, we could allow editing the first student's project info
        const firstStudent = project.studenten && project.studenten.length > 0 ? project.studenten[0] : null;
        
        if (firstStudent) {
            // Edit the first student's project information
            this.showEditModal('student', firstStudent.id || firstStudent.studentnummer);
        } else {
            this.showTemporaryMessage('ℹ️ Geen studenten gekoppeld aan dit project', 'info');
        }
    }    async deleteProject(projectTitle) {
        if (!this.requiresAuth('projecten verwijderen')) {
            return;
        }

        if (!confirm(`Weet je zeker dat je het project "${projectTitle}" wilt verwijderen? Dit zal het project verwijderen van alle gekoppelde studenten.`)) {
            return;
        }

        const project = this.projects.find(p => (p.titel || p.projectTitel) === projectTitle);
        
        if (!project) {
            this.showTemporaryMessage('❌ Project niet gevonden', 'error');
            return;
        }        try {
            // Probeer eerst via project API
            const projectId = project.id || projectTitle;
            if (project.id) {
                await this.apiRequest(`/projecten/${project.id}`, 'DELETE', null, true);
            } else {
                // Anders, probeer via student update (zet projectTitel op lege string voor alle gekoppelde studenten)
                if (project.studenten && project.studenten.length > 0) {
                    for (const student of project.studenten) {
                        const studentId = student.id || student.studentnummer;
                        if (studentId) {
                            await this.apiRequest(`/studenten/${studentId}`, 'PUT', {
                                projectTitel: '',
                                projectBeschrijving: '',
                                technologieen: ''
                            }, true);
                        }
                    }
                } else {
                    throw new Error('Geen studenten gekoppeld aan dit project om te updaten');
                }
            }
            
            await this.loadProjects();
            await this.loadStudents();
            await this.loadStatistics();
            this.showTemporaryMessage('🗑️ Project succesvol verwijderd!', 'success');
            
        } catch (error) {
            console.error('Delete project error:', error);
            this.showTemporaryMessage('❌ Fout bij verwijderen project: ' + (error.message || error), 'error');
        }    }

    // Add scroll indicators for items lists
    addScrollIndicators() {
        const itemsLists = document.querySelectorAll('.items-list');
        itemsLists.forEach(list => {
            const checkScrollable = () => {
                if (list.scrollHeight > list.clientHeight) {
                    list.classList.add('scrollable');
                } else {
                    list.classList.remove('scrollable');
                }
            };
            
            // Check on load and when content changes
            checkScrollable();
            
            // Check when scrolling
            list.addEventListener('scroll', checkScrollable);
            
            // Observer for content changes
            const observer = new MutationObserver(checkScrollable);
            observer.observe(list, { childList: true, subtree: true });
        });
    }

}
// ===== MENU TOGGLE FUNCTIONS =====
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu) {
        sideMenu.classList.toggle('active');
    }
}

// ===== MENU TOGGLE FUNCTIONS =====
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu) {
        sideMenu.classList.toggle('active');
    }
}

// Global functions voor onclick handlers
window.showAddModal = (type) => window.adminPanel?.showAddModal(type);
window.toggleSection = (sectionId) => window.adminPanel?.toggleSection(sectionId);
window.closeModal = () => window.adminPanel?.closeModal();
window.toggleMenu = toggleMenu;
console.log('🔧 admin-panel.js: Set window.toggleMenu');
console.log('🔧 admin-panel.js: toggleMenu function preview:', toggleMenu.toString().substring(0, 100)+'...');

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('sessionStartTime')) {
        sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }
    
    window.adminPanel = new AdminPanel();
      // Debug helpers voor de console
    window.setAuthToken = (token) => window.adminPanel?.setAuthToken(token);
    window.clearAuthToken = () => window.adminPanel?.clearAuthToken();
    
    console.log('🔧 Debug helpers available:');
    console.log('- setAuthToken(token) - Zet auth token voor admin functies');
    console.log('- clearAuthToken() - Wis auth token');
    console.log('- adminPanel - Direct toegang tot AdminPanel instance');
});

// FIXED: Add missing CSS for new status types
function addAppointmentStyling() {
    const style = document.createElement('style');
    style.textContent = `
        /* Appointments sectie styling */
        .section-header.appointments { 
            border-left-color: #881538; 
            background: linear-gradient(135deg, rgba(136, 21, 56, 0.1), rgba(136, 21, 56, 0.05)); 
        }
        
        .item-card.appointment { 
            border-left-color: #881538; 
        }
        
        .stat-card.appointments { 
            --color: #881538; 
            --color-light: #A91B47;
            border-left-color: #881538; 
        }
        
        .stat-card.appointments .stat-number { 
            color: #881538; 
        }
        
        /* FIXED: Uitgebreide status badges voor alle statuses */
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
        }

        .status-gepland { 
            background: linear-gradient(135deg, #3498db, #2980b9); 
            color: white; 
        }
        
        .status-bevestigd { 
            background: linear-gradient(135deg, #27ae60, #2ecc71); 
            color: white; 
        }
        
        .status-geannuleerd { 
            background: linear-gradient(135deg, #f39c12, #d68910); 
            color: white; 
        }
        
        .status-afgewerkt { 
            background: linear-gradient(135deg, #881538, #A91B47); 
            color: white; 
        }
        
        .status-no-show { 
            background: linear-gradient(135deg, #636e72, #2d3436); 
            color: white; 
        }

        /* Extra statuses from backend */
        .status-aangevraagd { 
            background: linear-gradient(135deg, #f39c12, #e67e22); 
            color: white; 
        }
        
        .status-geweigerd { 
            background: linear-gradient(135deg, #e74c3c, #c0392b); 
            color: white; 
        }
        
        .status-voltooid { 
            background: linear-gradient(135deg, #16a085, #1abc9c); 
            color: white; 
        }

        .status-onbekend { 
            background: linear-gradient(135deg, #95a5a6, #7f8c8d); 
            color: white; 
        }
          /* Afspraak item specifieke styling */
        .item-card.appointment:hover {
            border-color: #881538;
            box-shadow: 0 8px 25px rgba(136, 21, 56, 0.2);
        }
        
        .item-card.appointment .item-name {
            color: #881538;
        }
    `;
    document.head.appendChild(style);
}

// Initialize styling when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    addAppointmentStyling();
});