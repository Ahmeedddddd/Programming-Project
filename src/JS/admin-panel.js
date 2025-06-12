// admin-panel.js - Frontend JavaScript voor CareerLaunch Admin Panel

class AdminPanel {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3301/api';
        this.students = [];
        this.companies = [];
        this.projects = [];
        this.appointments = [];
        this.currentEditId = null;
        this.currentEditType = null;
        this.authToken = this.getValidAuthToken(); // Verbeterde token validatie
        
        console.log('🚀 AdminPanel initializing...');
        console.log('Auth token available:', !!this.authToken);
        
        this.init();
    }

    // ===== UTILITY METHODS =====
    getValidAuthToken() {
        const token = localStorage.getItem('authToken');
        const tokenTimestamp = localStorage.getItem('authTokenTimestamp');
        const isTestToken = localStorage.getItem('isTestToken') === 'true';
        
        // Als het een test token is, check of de pagina is gerefresht
        if (isTestToken && tokenTimestamp) {
            const sessionStartTime = sessionStorage.getItem('sessionStartTime');
            if (!sessionStartTime) {
                // Pagina is gerefresht, test token expiren
                console.log('🔄 Pagina refresh gedetecteerd - test token expired');
                this.clearAuthToken();
                return null;
            }
        }
        
        return token;
    }
    
    setAuthToken(token, isTestToken = false) {
        this.authToken = token;
        localStorage.setItem('authToken', token);
        localStorage.setItem('authTokenTimestamp', Date.now().toString());
        localStorage.setItem('isTestToken', isTestToken.toString());
        
        if (isTestToken) {
            // Stel session marker in voor test tokens
            sessionStorage.setItem('sessionStartTime', Date.now().toString());
            console.log('🧪 Test token ingesteld - vervalt bij pagina refresh');
        }
        
        console.log('✅ Auth token set successfully');
        
        // Reload data with authentication
        this.loadAllData();
    }

    clearAuthToken() {
        this.authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('authTokenTimestamp');
        localStorage.removeItem('isTestToken');
        sessionStorage.removeItem('sessionStartTime');
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
        // Event listeners instellen
        this.setupEventListeners();
        
        // Zorg ervoor dat modal standaard verborgen is
        this.initModal();
        
        console.log('📊 Loading data...');
        // Data laden
        await this.loadAllData();
        
        // VERWIJDERD: Secties standaard gesloten laten
        // this.expandSection('students-section');
        
        // Voeg tijdelijke test knop toe
        this.addTestAuthButton();
        
        console.log('✅ AdminPanel initialization complete!');
    }

    // ===== MODAL INITIALIZATION =====
    initModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // ===== TIJDELIJKE TEST FUNCTIE =====
    addTestAuthButton() {
        // Voeg test knop toe aan header
        const header = document.querySelector('.header');
        if (header && !document.getElementById('test-auth-btn')) {
            const testButton = document.createElement('button');
            testButton.id = 'test-auth-btn';
            testButton.innerHTML = '🔑 Test Auth Token (Tijdelijk)';
            testButton.title = 'Klik om admin functies te testen zonder echte login';
            testButton.style.cssText = `
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: linear-gradient(135deg, #27ae60, #2ecc71);
                color: white;
                border: none;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
                z-index: 10;
                box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            `;
            
            // Voeg CSS animatie toe voor attention
            const pulseStyle = document.createElement('style');
            pulseStyle.textContent = `
                @keyframes pulse {
                    0% { box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3); }
                    50% { box-shadow: 0 4px 15px rgba(39, 174, 96, 0.6); }
                    100% { box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3); }
                }
            `;
            document.head.appendChild(pulseStyle);
            
            testButton.addEventListener('click', () => {
                // Waarschuwing voor test gebruik
                if (confirm('⚠️ WAARSCHUWING: Dit is een test functie!\n\nDeze knop geeft je tijdelijk admin rechten voor testing.\nAlleen gebruiken in development omgeving.\n\nTest token vervalt automatisch bij pagina refresh.\n\nDoorgaan?')) {
                    // Stel een dummy auth token in voor testing (met test flag)
                    this.setAuthToken('test-admin-token-12345', true);
                    this.showTemporaryMessage('🔑 Test auth token ingesteld! Vervalt bij refresh.', 'success');
                    
                    // Toon extra info
                    console.log('🧪 TEST MODE ACTIVATED');
                    console.log('📝 Nu kan je testen:');
                    console.log('   - Studenten toevoegen/bewerken/verwijderen');
                    console.log('   - Bedrijven toevoegen/bewerken/verwijderen');
                    console.log('   - Afspraken bekijken/status wijzigen/verwijderen');
                    console.log('🔄 Token vervalt automatisch bij pagina refresh');
                    console.log('🧹 Gebruik removeTestButton() om deze knop te verwijderen');
                    
                    // Verberg de knop na gebruik
                    testButton.style.display = 'none';
                }
            });
            
            testButton.addEventListener('mouseover', () => {
                testButton.style.transform = 'translateY(-2px)';
                testButton.style.boxShadow = '0 8px 25px rgba(39, 174, 96, 0.4)';
            });
            
            testButton.addEventListener('mouseout', () => {
                testButton.style.transform = 'translateY(0)';
                testButton.style.boxShadow = '0 4px 15px rgba(39, 174, 96, 0.3)';
            });
            
            header.appendChild(testButton);
        }
    }

    // ===== TEST AUTH TOKEN HELPER =====
    enableTestMode() {
        this.setAuthToken('test-admin-token-12345', true);
        this.showTemporaryMessage('🧪 Test modus geactiveerd! Vervalt bij refresh.', 'info');
    }

    removeTestButton() {
        const testButton = document.getElementById('test-auth-btn');
        if (testButton) {
            testButton.remove();
            console.log('🧹 Test knop verwijderd');
        }
    }

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

        // Section toggle listeners (nu we onclick attributes hebben weggehaald)
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const sectionId = header.parentElement.id;
                this.toggleSection(sectionId);
            });
        });

        // Burger menu toggle
        document.getElementById('burgerToggle')?.addEventListener('click', () => {
            toggleMenu();
        });
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
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            
            // Show different messages based on the error type
            if (error.message?.includes('Access token required') && !this.authToken) {
                if (method !== 'GET') {
                    this.showTemporaryMessage('🔒 Login als organisator vereist voor deze actie', 'info');
                }
            } else {
                this.showTemporaryMessage(`❌ ${error.message}`, 'error');
            }
            throw error;
        }
    }

    // ===== DATA LOADING METHODS =====
    async loadAllData() {
        try {
            await Promise.all([
                this.loadStatistics(),
                this.loadStudents(),
                this.loadCompanies(),
                this.loadProjects(),
                this.loadAppointments()
            ]);
        } catch (error) {
            this.showTemporaryMessage('❌ Fout bij laden van gegevens', 'error');
        }
    }

    async loadStatistics() {
        try {
            // Gebruik alleen public endpoints voor statistieken
            const [studentStats, companyStats, projectStats] = await Promise.all([
                this.apiRequest('/studenten').catch(() => ({ data: [] })),
                this.apiRequest('/bedrijven').catch(() => ({ data: [] })),
                this.apiRequest('/studenten/projecten').catch(() => ({ data: [] }))
            ]);

            // Update statistiek counters
            const studentCount = studentStats.count || studentStats.data?.length || 0;
            const companyCount = companyStats.count || companyStats.data?.length || 0;
            const projectCount = projectStats.count || projectStats.data?.length || 0;
            
            document.getElementById('student-count').textContent = studentCount;
            document.getElementById('company-count').textContent = companyCount;
            document.getElementById('project-count').textContent = projectCount;
            
            // Voor appointments, probeer eerst zonder auth, anders zet op 0
            try {
                const appointmentStats = await this.apiRequest('/reservaties', 'GET', null, true);
                document.getElementById('appointment-count').textContent = appointmentStats.count || appointmentStats.data?.length || 0;
            } catch (error) {
                // Silent fail - appointments require auth
                document.getElementById('appointment-count').textContent = '0';
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
            this.renderCompanies();
        } catch (error) {
            document.getElementById('companies-list').innerHTML = 
                '<div class="error-message">Fout bij laden van bedrijven</div>';
        }
    }

    async loadProjects() {
        try {
            const response = await this.apiRequest('/studenten/projecten');
            this.projects = response.data || response;
            this.renderProjects();
        } catch (error) {
            document.getElementById('projects-list').innerHTML = 
                '<div class="error-message">Fout bij laden van projecten</div>';
        }
    }

    async loadAppointments() {
        try {
            const response = await this.apiRequest('/reservaties', 'GET', null, true);
            this.appointments = response.data || response;
            this.renderAppointments();
        } catch (error) {
            // Silent fail for appointments - they require auth
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
            // FLEXBOX MODAL - Simpel en clean!
            modal.style.display = 'flex';
            // CSS zorgt automatisch voor align-items: center en justify-content: center
            
            // Scroll naar top van pagina voor betere UX
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Blokkeer body scroll tijdens modal
            document.body.style.overflow = 'hidden';
            
            // Focus management voor accessibility
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
            
            // Herstel body scroll
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
        }, 3000);
    }

    getFieldLabel(field) {
        const labels = {
            voornaam: 'Voornaam',
            achternaam: 'Achternaam',
            naam: 'Bedrijfsnaam',
            email: 'Email',
            gsm_nummer: 'GSM Nummer',
            opleiding: 'Opleiding',
            opleidingsrichting: 'Opleidingsrichting',
            projectTitel: 'Project Titel',
            projectBeschrijving: 'Project Beschrijving',
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
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('nl-BE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusText(status) {
        const statusMap = {
            'gepland': 'Gepland',
            'bevestigd': 'Bevestigd',
            'geannuleerd': 'Geannuleerd',
            'afgewerkt': 'Afgewerkt',
            'no-show': 'No-show',
            'aangevraagd': 'Aangevraagd',
            'geweigerd': 'Geweigerd'
        };
        return statusMap[status] || status;
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
    }

    renderProjects(searchTerm = '') {
        const container = document.getElementById('projects-list');
        if (!container) return;

        const filtered = this.projects.filter(project => 
            (project.projectTitel && project.projectTitel.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (project.projectBeschrijving && project.projectBeschrijving.toLowerCase().includes(searchTerm.toLowerCase())) ||
            project.studentNaam?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-items">Geen projecten gevonden</div>';
            return;
        }

        container.innerHTML = filtered.map(project => `
            <div class="item-card project" onclick="adminPanel.showDetails('project', '${project.studentnummer}')">
                <div class="quick-actions">
                    <button class="quick-action-btn quick-edit" onclick="event.stopPropagation(); adminPanel.showEditModal('student', '${project.studentnummer}')" title="Student Bewerken">
                        ✏️
                    </button>
                </div>
                <div class="item-name">${project.projectTitel || 'Geen titel'}</div>
                <div class="item-info">
                    Door: ${project.studentNaam} • ${project.opleidingsrichting || 'Geen richting'}
                </div>
            </div>
        `).join('');
    }

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
        }

        container.innerHTML = filtered.map(appointment => `
            <div class="item-card appointment" onclick="adminPanel.showDetails('appointment', '${appointment.id}')">
                <div class="quick-actions">
                    <button class="quick-action-btn quick-edit" onclick="event.stopPropagation(); adminPanel.showEditModal('appointment', '${appointment.id}')" title="Status Bewerken">
                        ✏️
                    </button>
                    <button class="quick-action-btn quick-delete" onclick="event.stopPropagation(); adminPanel.deleteItem('appointment', '${appointment.id}')" title="Verwijderen">
                        🗑️
                    </button>
                </div>
                <div class="item-name">${appointment.studentNaam} ↔ ${appointment.bedrijfNaam}</div>
                <div class="item-info">
                    ${this.formatDateTime(appointment.startTijd)} - ${this.formatTime(appointment.eindTijd)} • 
                    <span class="status-badge status-${appointment.status}">${this.getStatusText(appointment.status)}</span>
                </div>
            </div>
        `).join('');
    }

    // ===== MODAL METHODS =====
    showAddModal(type) {
        // Check auth voor add operaties
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
        // Check auth voor edit operaties
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
                break;
            case 'company':
                item = this.companies.find(c => c.bedrijfsnummer == id);
                title = 'Bedrijf Bewerken';
                break;
            case 'project':
                item = this.projects.find(p => p.studentnummer == id);
                title = 'Project Bewerken';
                break;
            case 'appointment':
                item = this.appointments.find(a => a.id == id);
                title = 'Afspraak Status Wijzigen';
                break;
        }

        if (!item) return;
        
        document.getElementById('modal-title').textContent = title;
        
        let formHtml = '';
        
        switch(type) {
            case 'student':
                formHtml = this.getStudentFormHtml(item);
                break;
                
            case 'company':
                formHtml = this.getCompanyFormHtml(item);
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
                break;
            case 'project':
                item = this.projects.find(p => p.studentnummer == id);
                title = 'Project Details';
                break;
            case 'appointment':
                item = this.appointments.find(a => a.id == id);
                title = 'Afspraak Details';
                break;
        }

        if (!item) return;

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
                    displayValue = `<span class="status-badge status-${value}">${this.getStatusText(value)}</span>`;
                }
                
                detailsHtml += `
                    <div class="detail-item">
                        <span class="detail-label">${label}:</span>
                        <span class="detail-value">${displayValue}</span>
                    </div>
                `;
            }
        }

        // Add action buttons
        let editButtonText = '✏️ Bewerken';
        let editAction = `adminPanel.showEditModal('${type}', '${id}')`;
        
        if (type === 'appointment') {
            editButtonText = '📝 Status Wijzigen';
        }

        detailsHtml += `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #f8f9fa; display: flex; gap: 1rem;">
                <button onclick="${editAction}" class="submit-btn" style="background: linear-gradient(135deg, #f39c12, #e67e22); flex: 1;">
                    ${editButtonText}
                </button>
                <button onclick="adminPanel.deleteItem('${type}', '${id}')" class="submit-btn" style="background: linear-gradient(135deg, #e74c3c, #c0392b); flex: 1;">
                    🗑️ Verwijderen
                </button>
            </div>
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
                        <option value="aangevraagd" ${item?.status === 'aangevraagd' ? 'selected' : ''}>Aangevraagd</option>
                        <option value="bevestigd" ${item?.status === 'bevestigd' ? 'selected' : ''}>Bevestigd</option>
                        <option value="geweigerd" ${item?.status === 'geweigerd' ? 'selected' : ''}>Geweigerd</option>
                        <option value="geannuleerd" ${item?.status === 'geannuleerd' ? 'selected' : ''}>Geannuleerd</option>
                        <option value="afgewerkt" ${item?.status === 'afgewerkt' ? 'selected' : ''}>Afgewerkt</option>
                        <option value="no-show" ${item?.status === 'no-show' ? 'selected' : ''}>No-show</option>
                    </select>
                </div>
                <button type="submit" class="submit-btn">Status Bijwerken</button>
            </form>
        `;
    }

    // ===== CRUD OPERATIONS =====
    async handleFormSubmit(event) {
        event.preventDefault();
        
        // Check auth voor alle form submissions (CREATE/UPDATE vereisen auth)
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
                    case 'appointment':
                        await this.apiRequest(`/reservaties/${this.currentEditId}/status`, 'PUT', data, true);
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
                    // Note: Appointments worden meestal aangemaakt door studenten/bedrijven, niet via admin panel
                }
                this.showTemporaryMessage('✅ Item succesvol toegevoegd!', 'success');
            }
            
            await this.loadStatistics();
            await this.loadProjects(); // Refresh projects as they might have changed
            this.closeModal();
        } catch (error) {
            // Error message is already shown by apiRequest
        }
    }

    async deleteItem(type, id) {
        // Check auth voor delete operaties
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
                    case 'appointment':
                        await this.apiRequest(`/reservaties/${id}`, 'DELETE', null, true);
                        await this.loadAppointments();
                        break;
                }
                
                await this.loadStatistics();
                this.showTemporaryMessage('🗑️ Item succesvol verwijderd!', 'success');
            } catch (error) {
                // Error message is already shown by apiRequest
            }
        }
    }
}

// ===== MENU TOGGLE FUNCTIONS =====
// Functies voor de navigatie menu (uit de originele HTML)
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

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Zet session marker om refresh detection mogelijk te maken
    if (!sessionStorage.getItem('sessionStartTime')) {
        sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }
    
    window.adminPanel = new AdminPanel();
    
    // Debug helpers voor de console
    window.setAuthToken = (token) => window.adminPanel?.setAuthToken(token);
    window.clearAuthToken = () => window.adminPanel?.clearAuthToken();
    window.enableTestMode = () => window.adminPanel?.enableTestMode();
    window.removeTestButton = () => window.adminPanel?.removeTestButton();
    
    console.log('🔧 Debug helpers available:');
    console.log('- setAuthToken(token) - Zet auth token voor admin functies');
    console.log('- clearAuthToken() - Wis auth token');
    console.log('- enableTestMode() - Activeer test modus voor debugging');
    console.log('- removeTestButton() - Verwijder test knop');
    console.log('- adminPanel - Direct toegang tot AdminPanel instance');
});

// Voeg CSS styling toe voor appointments sectie
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
        
        /* Status badges verbeterd */
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
        }

        .status-aangevraagd { 
            background: linear-gradient(135deg, #f39c12, #e67e22); 
            color: white; 
        }
        
        .status-bevestigd { 
            background: linear-gradient(135deg, #27ae60, #2ecc71); 
            color: white; 
        }
        
        .status-geweigerd { 
            background: linear-gradient(135deg, #e74c3c, #c0392b); 
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
        
        /* Test knop hover effect verbetering */
        #test-auth-btn:hover {
            background: linear-gradient(135deg, #2ecc71, #27ae60) !important;
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