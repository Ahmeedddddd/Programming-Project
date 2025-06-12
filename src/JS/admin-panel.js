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
        this.authToken = localStorage.getItem('authToken'); // Voor later gebruik
        
        console.log('🚀 AdminPanel initializing...');
        console.log('Auth token available:', !!this.authToken);
        
        this.init();
    }

    // ===== UTILITY METHODS =====
    setAuthToken(token) {
        this.authToken = token;
        localStorage.setItem('authToken', token);
        console.log('✅ Auth token set successfully');
        
        // Reload data with authentication
        this.loadAllData();
    }

    clearAuthToken() {
        this.authToken = null;
        localStorage.removeItem('authToken');
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
        
        console.log('📊 Loading data...');
        // Data laden
        await this.loadAllData();
        
        console.log('📂 Expanding students section...');
        // Secties standaard uitklappen
        this.expandSection('students-section');
        
        console.log('✅ AdminPanel initialization complete!');
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
        } catch (error) {
            // Silent fail for appointments - they require auth
            this.appointments = [];
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
            // Scroll naar top van pagina voor betere UX
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Blokkeer body scroll tijdens modal
            document.body.style.overflow = 'hidden';
            
            // Toon modal
            modal.style.display = 'block';
            
            // Focus management voor accessibility
            setTimeout(() => {
                const firstInput = modal.querySelector('input, textarea, button');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300); // Wacht tot smooth scroll klaar is
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
            studentNaam: 'Student'
        };
        return labels[field] || field;
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
        }

        if (!item) return;

        document.getElementById('modal-title').textContent = title;
        
        let detailsHtml = '';
        for (const [key, value] of Object.entries(item)) {
            if (key !== 'studentnummer' && key !== 'bedrijfsnummer' && value) {
                const label = this.getFieldLabel(key);
                let displayValue = value;
                
                if (key === 'email') {
                    displayValue = `<a href="mailto:${value}" style="color: #881538;">${value}</a>`;
                } else if (key === 'gsm_nummer') {
                    displayValue = `<a href="tel:${value}" style="color: #881538;">${value}</a>`;
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
        detailsHtml += `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #f8f9fa; display: flex; gap: 1rem;">
                <button onclick="adminPanel.showEditModal('${type}', '${id}')" class="submit-btn" style="background: linear-gradient(135deg, #f39c12, #e67e22); flex: 1;">
                    ✏️ Bewerken
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

    // ===== CRUD OPERATIONS =====
    async handleFormSubmit(event) {
        event.preventDefault();
        
        // Check auth voor alle form submissions (CREATE/UPDATE vereisen auth)
        if (!this.requiresAuth('studenten/bedrijven beheren')) {
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
    window.adminPanel = new AdminPanel();
    
    // Debug helpers voor de console
    window.setAuthToken = (token) => window.adminPanel?.setAuthToken(token);
    window.clearAuthToken = () => window.adminPanel?.clearAuthToken();
    
    console.log('🔧 Debug helpers available:');
    console.log('- setAuthToken(token) - Zet auth token voor admin functies');
    console.log('- clearAuthToken() - Wis auth token');
    console.log('- adminPanel - Direct toegang tot AdminPanel instance');
});