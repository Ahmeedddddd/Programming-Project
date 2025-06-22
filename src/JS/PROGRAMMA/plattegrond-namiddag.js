// src/JS/PROGRAMMA/plattegrond-namiddag.js
// Interactieve functionaliteit voor namiddag plattegrond (bedrijven aan tafels)

console.log('🔄 [DEBUG] Plattegrond Namiddag script loading...');
console.log('🌐 [DEBUG] Current page URL:', window.location.href);
console.log('📅 [DEBUG] Script loaded at:', new Date().toLocaleTimeString());

class PlattegrondNamiddagManager {
    constructor() {
        this.tafelData = {};
        this.currentUser = null;
        this.isOrganisator = false;
        this.selectedTafel = null;
        this.availableBedrijven = [];
        this.tafelConfig = { namiddag_aantal_tafels: 25 }; // Default fallback voor namiddag
        this.init();
    }    async init() {
        try {
            console.log('🚀 [DEBUG] Initializing PlattegrondNamiddagManager...');
            console.log('🕐 [DEBUG] Init started at:', new Date().toLocaleTimeString());
            
            // Laad tafel configuratie uit database
            await this.loadTafelConfig();
            
            // Laad user info
            await this.loadUserInfo();
            
            // Laad tafel data
            await this.loadTafelData();
            
            // Pre-load bedrijven data voor organisatoren
            if (this.isOrganisator) {
                this.loadAvailableBedrijven(); // Async load in background
            }
            
            // Setup UI
            this.setupUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ PlattegrondNamiddagManager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing PlattegrondNamiddagManager:', error);
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
                    if (this.tafelConfig.namiddag_aantal_tafels) {
                        localStorage.setItem('namiddag_aantal_tafels', this.tafelConfig.namiddag_aantal_tafels);
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
            const localConfig = localStorage.getItem('namiddag_aantal_tafels');
            if (localConfig) {
                this.tafelConfig.namiddag_aantal_tafels = parseInt(localConfig);
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
            console.log('📡 Loading namiddag tafel data...');
            
            const response = await fetch('http://localhost:8383/api/tafels/namiddag');
            
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
                
                console.log(`✅ Tafel data loaded: ${result.data.length} tafels from API`);
                console.log('📊 Loaded tafelData:', this.tafelData);
                console.log(`📊 Expected max tafels for namiddag: ${this.tafelConfig.namiddag_aantal_tafels || 25}`);
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
                type: 'bedrijf',
                items: [{
                    id: 84,
                    naam: 'BilalAICorp',
                    titel: 'BilalAICorp',
                    beschrijving: 'AI-oplossingen en robotica',
                    sector: 'AI',
                    type: 'bedrijf'
                }]
            },
            2: {
                tafelNr: 2,
                type: 'bedrijf',
                items: [{
                    id: 85,
                    naam: "Vital'O Network",
                    titel: "Vital'O Network",
                    beschrijving: 'Gezondheids-IT oplossingen',
                    sector: 'Health informatics',
                    type: 'bedrijf'
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
        if (configBtn) {            console.log('✅ Found config button, making it visible');
            configBtn.style.display = 'flex';
        } else {
            console.error('❌ Config button not found in DOM');
        }

        // Update tafel count display
        this.updateTafelCountDisplay();

        // Update sidebar titel
        const sidebarTitle = document.querySelector('.sidebarTitle');
        if (sidebarTitle) {
            sidebarTitle.innerHTML = '⚙️ Tafel Beheer <br> <small>(Klik om te bewerken)</small>';
        }

        // Toon edit mode indicator
        this.showEditModeIndicator();
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
        }        // Update sidebar titel voor bezoekers
        const sidebarTitle = document.querySelector('.sidebarTitle');
        if (sidebarTitle) {
            sidebarTitle.innerHTML = 'Overzicht Tafels';
        }

        // Verberg edit indicators
        this.hideEditIndicators();
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
        
        // Laad bedrijven in achtergrond als nog niet geladen
        if (!this.availableBedrijven || this.availableBedrijven.length === 0) {            await this.loadAvailableBedrijven();
            // Update modal met bedrijven data
            this.updateModalWithBedrijven(modal, tafel);
        }
    }

    // Alias voor backward compatibility met onclick handlers
    showAssignmentModal(tafel) {
        return this.showTafelAssignmentModal(tafel);
    }

    async loadAvailableBedrijven() {
        // Cache check - laad alleen als nog niet geladen
        if (this.availableBedrijven && this.availableBedrijven.length > 0) {
            console.log('📦 Using cached bedrijven data');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:8383/api/bedrijven');
            const result = await response.json();

            if (result.success) {
                this.availableBedrijven = result.data;
                console.log('✅ Available bedrijven loaded:', this.availableBedrijven.length);
            }
        } catch (error) {
            console.error('❌ Error loading available bedrijven:', error);
            this.availableBedrijven = [];
        }
    }

    createAssignmentModal(tafel) {
        const modal = document.createElement('div');
        modal.className = 'tafel-assignment-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>Tafel ${tafel.tafelNr} Beheren</h3>
                    
                    ${tafel.items && tafel.items.length > 0 ? `
                        <div class="current-assignment">
                            <div class="current-bedrijf">                                <strong>${tafel.items[0].naam}</strong><br>
                                <small>${tafel.items[0].sector || 'Geen sector'}</small>
                            </div>                            <button class="remove-btn" onclick="window.plattegrondNamiddagManager.removeBedrijfFromTafel('${tafel.items[0].id}')">
                                Verwijderen
                            </button>
                        </div>
                    ` : `
                        <p>Deze tafel heeft geen toewijzing</p>
                    `}

                      <div class="assign-new">
                        <h4>Bedrijf toewijzen:</h4>                        <select id="bedrijfSelect" class="bedrijf-select">
                            ${this.availableBedrijven && this.availableBedrijven.length > 0 ? `
                                <option value="">Selecteer een bedrijf...</option>
                                ${this.buildBedrijvenOptgroups()}
                            ` : `
                                <option value="">Bedrijven laden...</option>
                            `}
                        </select>
                        <button class="assign-btn" onclick="window.plattegrondNamiddagManager.assignBedrijfToTafel(${tafel.tafelNr})">
                            Toewijzen
                        </button>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="cancel-btn" onclick="window.plattegrondNamiddagManager.closeModal()">
                            Annuleren
                        </button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    updateModalWithBedrijven(modal, tafel) {
        const bedrijfSelect = modal.querySelector('#bedrijfSelect');
        if (bedrijfSelect && this.availableBedrijven) {
            // Clear loading state
            bedrijfSelect.innerHTML = '<option value="">Selecteer bedrijf...</option>';
            
            // Sorteer bedrijven: beschikbare eerst, dan toegewezen
            const beschikbareBedrijven = this.availableBedrijven.filter(b => !b.tafelNr)
                .sort((a, b) => a.naam.localeCompare(b.naam));
            const toegewezenBedrijven = this.availableBedrijven.filter(b => b.tafelNr)
                .sort((a, b) => a.naam.localeCompare(b.naam));
            
            // Add beschikbare bedrijven met header
            if (beschikbareBedrijven.length > 0) {
                const optgroupBeschikbaar = document.createElement('optgroup');
                optgroupBeschikbaar.label = 'Nog aan te duiden bedrijven';
                beschikbareBedrijven.forEach(bedrijf => {
                    const option = document.createElement('option');
                    option.value = bedrijf.bedrijfsnummer;
                    option.textContent = `${bedrijf.naam} - ${bedrijf.sector || 'Geen sector'}`;
                    optgroupBeschikbaar.appendChild(option);
                });
                bedrijfSelect.appendChild(optgroupBeschikbaar);
            }

            // Add toegewezen bedrijven met header
            if (toegewezenBedrijven.length > 0) {
                const optgroupAssigned = document.createElement('optgroup');
                optgroupAssigned.label = 'Al aangeduide bedrijven';
                toegewezenBedrijven.forEach(bedrijf => {
                    const option = document.createElement('option');
                    option.value = bedrijf.bedrijfsnummer;
                    option.textContent = `${bedrijf.naam} - ${bedrijf.sector || 'Geen sector'} (Tafel ${bedrijf.tafelNr})`;
                    option.disabled = true;
                    optgroupAssigned.appendChild(option);
                });
                bedrijfSelect.appendChild(optgroupAssigned);
            }
            
            console.log('🔄 Modal updated with bedrijven data');
        }
    }    // Snelle dropdown update zonder volledige modal rebuild
    updateModalDropdownOnly(bedrijfSelect) {
        // Rebuild alleen de dropdown opties
        bedrijfSelect.innerHTML = '<option value="">Selecteer bedrijf...</option>';
        
        // Check welke bedrijven toegewezen zijn (quick check)
        const toegewezenBedrijven = new Map(); // Use Map to track both assignment and table info
        Object.entries(this.tafelData).forEach(([tafelNr, tafelInfo]) => {
            if (tafelInfo.items && tafelInfo.items.length > 0) {
                tafelInfo.items.forEach(bedrijf => {
                    if (bedrijf.id) {
                        toegewezenBedrijven.set(bedrijf.id, {
                            tafelNr: tafelNr,
                            naam: bedrijf.naam || bedrijf.title,
                            sector: bedrijf.sector || 'Onbekend'
                        });
                    }
                });
            }
        });

        const beschikbareBedrijven = this.availableBedrijven
            .filter(b => !toegewezenBedrijven.has(b.id))
            .sort((a, b) => a.naam.localeCompare(b.naam));
        
        const alleToegwezenBedrijven = this.availableBedrijven
            .filter(b => toegewezenBedrijven.has(b.id))
            .sort((a, b) => a.naam.localeCompare(b.naam));

        // Add beschikbare bedrijven - groene groep
        if (beschikbareBedrijven.length > 0) {
            const optgroupBeschikbaar = document.createElement('optgroup');
            optgroupBeschikbaar.label = '� Beschikbare Bedrijven (nog aan te duiden)';
            beschikbareBedrijven.forEach(bedrijf => {
                const option = document.createElement('option');
                option.value = bedrijf.id;
                // More detailed option text with icon and sector info
                option.textContent = `${bedrijf.naam} - ${bedrijf.sector || 'Geen sector'}`;
                optgroupBeschikbaar.appendChild(option);
            });
            bedrijfSelect.appendChild(optgroupBeschikbaar);
        }
        
        // Add toegewezen bedrijven - rode groep (disabled)
        if (alleToegwezenBedrijven.length > 0) {
            const optgroupAssigned = document.createElement('optgroup');
            optgroupAssigned.label = 'Reeds Toegewezen Bedrijven (niet beschikbaar)';
            alleToegwezenBedrijven.forEach(bedrijf => {
                const assignmentInfo = toegewezenBedrijven.get(bedrijf.id);
                const option = document.createElement('option');
                option.value = bedrijf.id;
                // More detailed option text showing current assignment
                option.textContent = `${bedrijf.naam} - ${bedrijf.sector || 'Geen sector'} (Tafel ${assignmentInfo.tafelNr})`;
                option.disabled = true;
                option.style.color = '#999';
                optgroupAssigned.appendChild(option);
            });
            bedrijfSelect.appendChild(optgroupAssigned);
        }
    }    buildBedrijvenOptgroups() {
        const beschikbareBedrijven = this.availableBedrijven.filter(b => !b.tafelNr)
            .sort((a, b) => a.naam.localeCompare(b.naam));
        const toegewezenBedrijven = this.availableBedrijven.filter(b => b.tafelNr)
            .sort((a, b) => a.naam.localeCompare(b.naam));
        
        let html = '';
        
        // Beschikbare bedrijven - groene groep
        if (beschikbareBedrijven.length > 0) {
            html += '<optgroup label="� Beschikbare Bedrijven (nog aan te duiden)">';
            beschikbareBedrijven.forEach(bedrijf => {
                html += `<option value="${bedrijf.bedrijfsnummer}">
                    ${bedrijf.naam} - ${bedrijf.sector || 'Geen sector'}
                </option>`;
            });
            html += '</optgroup>';
        }
        
        // Toegewezen bedrijven - rode groep (disabled)
        if (toegewezenBedrijven.length > 0) {
            html += '<optgroup label="Reeds Toegewezen Bedrijven (niet beschikbaar)">';
            toegewezenBedrijven.forEach(bedrijf => {
                html += `<option value="${bedrijf.bedrijfsnummer}" disabled style="color: #999;">
                    ${bedrijf.naam} - ${bedrijf.sector || 'Geen sector'} (Tafel ${bedrijf.tafelNr})
                </option>`;
            });
            html += '</optgroup>';
        }
        
        return html;
    }    async assignBedrijfToTafel(tafelNr) {
        const bedrijfSelect = document.getElementById('bedrijfSelect');
        const bedrijfsnummer = bedrijfSelect.value;

        if (!bedrijfsnummer) {
            this.showError('Selecteer eerst een bedrijf');
            return;
        }

        console.log(`📝 Assigning bedrijf ${bedrijfsnummer} to tafel ${tafelNr}`);

        try {            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:8383/api/tafels/bedrijf/${bedrijfsnummer}/tafel/${tafelNr}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📊 API Response Status: ${response.status}`);

            // Check HTTP status first
            if (!response.ok) {
                console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                
                try {
                    const errorData = await response.json();
                    console.error('❌ Server error details:', errorData);
                    throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
                } catch (jsonError) {
                    // Als JSON parsing faalt, gooi HTTP status error
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
            }            const result = await response.json();
            console.log('📊 API Response Data:', result);            if (result.success) {
                this.showSuccess(`Bedrijf toegewezen aan tafel ${tafelNr}!`);
                
                // Reset dropdown direct
                bedrijfSelect.value = '';
                
                // Update tafelData lokaal voor snelle UI update
                const bedrijf = this.availableBedrijven.find(b => b.id == bedrijfsnummer);
                if (bedrijf && this.tafelData[tafelNr]) {
                    this.tafelData[tafelNr].items = [{
                        id: bedrijf.id,
                        naam: bedrijf.naam,
                        sector: bedrijf.sector
                    }];
                }
                
                // Update dropdown direct zonder API call
                this.updateModalDropdownOnly(bedrijfSelect);
                
                // Update sidebar direct
                this.updateSidebar();
                
                // Herlaad data in background voor consistentie (zonder UI blocking)
                setTimeout(() => {
                    this.loadTafelData();
                    this.loadAvailableBedrijven();
                }, 100);
                
                // Sluit modal
                this.closeModal();
            } else {
                throw new Error(result.message || 'Toewijzing mislukt');
            }
        } catch (error) {
            console.error('❌ Error assigning bedrijf:', error);
            this.showError('Toewijzing mislukt: ' + error.message);
        }
    }

    async removeBedrijfFromTafel(bedrijfId) {
        try {            console.log('🗑️ Removing bedrijf with ID:', bedrijfId);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:8383/api/tafels/bedrijf/${bedrijfId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
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
                this.showSuccess('Bedrijf verwijderd van tafel!');
                
                // Update tafelData lokaal voor snelle UI update
                Object.keys(this.tafelData).forEach(tafelNr => {
                    if (this.tafelData[tafelNr].items) {
                        this.tafelData[tafelNr].items = this.tafelData[tafelNr].items.filter(
                            item => item.id != bedrijfId
                        );
                    }
                });
                
                // Update sidebar direct
                this.updateSidebar();
                
                // Kleine delay voor de UI update en dan dropdown updaten
                setTimeout(() => {
                    const bedrijfSelect = document.querySelector('#bedrijfSelect');
                    if (bedrijfSelect) {
                        this.updateModalDropdownOnly(bedrijfSelect);
                    }
                }, 50);
                
                // Herlaad data in background voor consistentie (zonder UI blocking)
                setTimeout(() => {
                    this.loadTafelData();
                    this.loadAvailableBedrijven();
                }, 100);
                
                // Update selected tafel to empty
                this.selectedTafel = { tafelNr: this.selectedTafel.tafelNr, items: [] };
            } else {
                throw new Error(result.message || 'Verwijdering mislukt');
            }
        } catch (error) {
            console.error('❌ Error removing bedrijf:', error);
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
        // Refresh button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refreshTafels') {
                this.refresh();
            }
        });        // Config button
        const configBtn = document.getElementById('configTafelsBtn');
        if (configBtn) {
            // Prevent duplicate event listeners
            if (!configBtn.hasAttribute('data-listener-added')) {
                configBtn.addEventListener('click', () => {
                    console.log('🔧 Config button clicked!');
                    console.log('👤 Current user:', this.currentUser);
                    console.log('🛂 Is organisator:', this.isOrganisator);
                    
                    if (this.isOrganisator) {
                        console.log('✅ Opening tafel config modal...');
                        this.showTafelConfigModal();
                    } else {
                        console.log('❌ Access denied - not an organisator');
                        this.showError('Alleen organisatoren kunnen het aantal tafels aanpassen');
                    }
                });
                configBtn.setAttribute('data-listener-added', 'true');
                console.log('✅ Config button event listener added');
            } else {
                console.log('ℹ️ Config button event listener already exists, skipping');
            }
        } else {
            console.warn('⚠️ Config button not found!');
        }

        // ESC key om modal te sluiten
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });        //    functionality
        const searchInput = document.querySelector('.sidebarZoekbalk');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTafels(e.target.value);
            });
            
            // Clear search when escape is pressed
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.filterTafels('');
                    searchInput.blur();
                }
            });
        }

    }

    filterTafels(searchTerm) {
        const tafelItems = document.querySelectorAll('.tafel-item');
        const term = searchTerm.toLowerCase();

        tafelItems.forEach(item => {
            // Get bedrijf name and sector for searching, exclude irrelevant info
            const bedrijfInfo = item.querySelector('strong')?.textContent.toLowerCase() || '';
            const sectorInfo = item.querySelector('.bedrijf-sector')?.textContent.toLowerCase() || '';
            
            const searchableContent = bedrijfInfo + ' ' + sectorInfo;
            
            if (searchableContent.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async refresh() {
        console.log('🔄 Refreshing plattegrond data...');
        try {
            await this.loadTafelConfig();
            await this.loadTafelData();
            this.showSuccess('Plattegrond bijgewerkt');
        } catch (error) {
            console.error('❌ Error refreshing:', error);
            this.showError('Kon plattegrond niet bijwerken');
        }    }    
    
    showTafelConfigModal() {
        console.log('🔧 showTafelConfigModal() called');
        console.log('📊 Current tafel config:', this.tafelConfig);
        
        // Huidige waarde ophalen uit database config
        const currentAantal = this.tafelConfig.namiddag_aantal_tafels || 25;
        console.log('🔢 Current aantal tafels:', currentAantal);
        
        const modal = document.createElement('div');
        modal.className = 'config-modal';
        modal.innerHTML = `
            <div class="config-modal-content">
                <h3>Tafel Configuratie - Namiddag</h3>
                <div class="config-info">
                    <p><strong>Huidige instelling:</strong> ${currentAantal} tafels</p>
                    <p><small>Dit bepaalt hoeveel tafels zichtbaar zijn in het overzicht en beschikbaar zijn voor bedrijven toewijzing. De instelling wordt opgeslagen in de database.</small></p>
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
        });        document.body.appendChild(modal);
        input.focus();
        input.select(); // Select the current value for easy editing
    }    async updateAantalTafels(aantalTafels) {
        try {
            console.log(`🔧 Updating aantal tafels to: ${aantalTafels}`);
              // Update via API (opslaan in database)
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:8383/api/config/tafels`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    namiddag_aantal_tafels: aantalTafels 
                })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log(`✅ API success:`, result);
                
                // Update lokale config
                this.tafelConfig.namiddag_aantal_tafels = aantalTafels;
                
                // Sync met localStorage voor offline fallback
                localStorage.setItem('namiddag_aantal_tafels', aantalTafels);
                
                let message = `Aantal tafels succesvol aangepast naar ${aantalTafels} en opgeslagen in database`;
                if (result.warning) {
                    message += `

⚠️ ${result.warning}`;
                    this.showNotification(message, 'warning');
                } else {
                    this.showSuccess(message);
                }
            } else {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            // Herlaad de tafel data en config
            await this.loadTafelConfig();
            await this.loadTafelData();
            
            // Update de display tekst
            this.updateTafelCountDisplay();
            
        } catch (error) {
            console.error('❌ Error updating aantal tafels:', error);
            this.showError('Fout bij het aanpassen van aantal tafels: ' + error.message);
            
            // Bij fout: probeer lokaal te bewaren als fallback
            try {
                localStorage.setItem('namiddag_aantal_tafels', aantalTafels);
                this.tafelConfig.namiddag_aantal_tafels = aantalTafels;
                this.updateTafelCountDisplay();
                this.showNotification('⚠️ Opgeslagen lokaal (database niet beschikbaar)', 'warning');
            } catch (localError) {
                console.error('❌ Local fallback also failed:', localError);
            }
        }
    }

    updateTafelCountDisplay() {
        const countDisplay = document.getElementById('tafelCountText');        if (countDisplay) {
            const currentAantal = this.tafelConfig.namiddag_aantal_tafels || 25;
            countDisplay.textContent = `Aantal tafels: ${currentAantal}`;
            console.log(`📊 Updated display: Aantal tafels: ${currentAantal}`);
        }
    }

    // ===== NAVIGATION METHODS =====
    
    handleTafelClick(tafelNr, bedrijf) {
        console.log(`🖱️ Tafel ${tafelNr} clicked with bedrijf:`, bedrijf);
        
        if (!this.isOrganisator) {
            // Voor niet-organisatoren: navigeer naar resultaat-bedrijf.html
            if (bedrijf) {
                this.navigateToBedrijf(bedrijf);
            }
        } else {
            // Voor organisatoren: toon assignment modal
            const tafel = this.tafelData[tafelNr] || { tafelNr: tafelNr, items: [] };
            this.showAssignmentModal(tafel);
        }
    }    navigateToBedrijf(bedrijfData) {
        console.log('🔍 [DEBUG] navigateToBedrijf called with data:', bedrijfData);
        
        if (!bedrijfData) {
            console.error('❌ [ERROR] No bedrijf data provided');
            return;
        }
        
        // Check if bedrijf has an ID
        if (!bedrijfData.id && !bedrijfData.bedrijfId) {
            console.error('❌ [ERROR] No bedrijf ID found in data:', bedrijfData);
            return;
        }
        
        const bedrijfId = bedrijfData.id || bedrijfData.bedrijfId;
        console.log('🔢 [DEBUG] Using bedrijf ID:', bedrijfId);
          const targetUrl = `/resultaat-bedrijf?id=${bedrijfId}`;
        console.log('🎯 [DEBUG] Target URL:', targetUrl);
        console.log('🌐 [DEBUG] Current location:', window.location.href);
        
        // Extra debugging - check if target file exists
        console.log('📁 [DEBUG] Checking if target path is correct...');
        console.log('📍 [DEBUG] Full target URL would be:', window.location.origin + targetUrl);
          try {
            console.log('🚀 [DEBUG] About to set window.location.href to:', targetUrl);
            console.log('⏰ [DEBUG] Navigation attempt at:', new Date().toLocaleTimeString());
            
            window.location.href = targetUrl;
            
            console.log('✅ [DEBUG] Navigation initiated - if you see this, navigation was successful');
        } catch (error) {
            console.error('❌ [ERROR] Navigation failed with exception:', error);
        }
        
        // This should not execute if navigation is successful
        setTimeout(() => {
            console.warn('⚠️ [WARNING] Still on same page after 1 second - navigation may have failed');
            console.log('🌐 [WARNING] Current URL is still:', window.location.href);
        }, 1000);
    }updateSidebar() {
        console.log('🔄 [DEBUG] updateSidebar called');
        const sidebar = document.getElementById('tafelSidebar');
        if (!sidebar) {
            console.error('❌ tafelSidebar element not found in DOM!');
            return;
        }

        console.log(`🔄 Updating sidebar with ${Object.keys(this.tafelData).length} occupied tables`);
        console.log(`📊 Target max tables: ${this.tafelConfig.namiddag_aantal_tafels || 25}`);
        console.log(`👔 User is organisator: ${this.isOrganisator}`);
        console.log('📋 [DEBUG] Tafel data:', this.tafelData);

        // Clear sidebar first
        sidebar.innerHTML = '';
        
        // Render alle tafels (bezette en lege) in volgorde van tafel nummer
        const maxTafels = this.tafelConfig.namiddag_aantal_tafels || 25;
        
        for (let i = 1; i <= maxTafels; i++) {
            const tafel = this.tafelData[i];
            const listItem = document.createElement('li');
            listItem.className = 'tafel-item';
            listItem.setAttribute('data-tafel', i);
            
            if (tafel && tafel.items && tafel.items.length > 0) {
                // Bezette tafel - gebruik voormiddag stijl
                const bedrijf = tafel.items[0];
                const bedrijfNaam = bedrijf.naam || 'Onbekend bedrijf';
                const sector = bedrijf.sector || 'Onbekende sector';
                  listItem.innerHTML = `
                    <div class="tafel-content" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="tafel-info">
                            <strong>Tafel ${i}: ${bedrijfNaam}</strong><br>
                            <small class="bedrijf-info">${sector}</small>
                        </div>
                        ${this.isOrganisator ? `<button class="remove-btn" onclick="event.stopPropagation(); window.plattegrondNamiddagManager.removeBedrijfFromTafel('${bedrijf.id}')" style="margin-left: 10px; flex-shrink: 0;">Verwijder</button>` : ''}
                    </div>
                `;                // Add click handler gebaseerd op user type
                if (this.isOrganisator) {
                    listItem.addEventListener('click', () => this.showAssignmentModal(tafel));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om bedrijf toe te wijzen';
                } else {
                    console.log('🖱️ [DEBUG] Adding click handler for non-organisator to tafel', i, 'with bedrijf:', bedrijf);
                    listItem.addEventListener('click', () => {
                        console.log('🖱️ [DEBUG] Tafel item clicked! Tafel:', i, 'Bedrijf:', bedrijf);
                        this.navigateToBedrijf(bedrijf);
                    });
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik voor bedrijf details';                }
                
                // Voeg bezette tafel toe aan sidebar
                sidebar.appendChild(listItem);
                
            } else {
                // Lege tafel - alleen tonen aan organisatoren
                if (this.isOrganisator) {
                    console.log(`📋 [DEBUG] Adding empty table ${i} for organisator`);
                    listItem.classList.add('empty-tafel-item'); // Voeg CSS class toe
                    listItem.innerHTML = `
                        <div class="tafel-content">
                            <strong>Tafel ${i}</strong>
                            <small class="empty-tafel">📭 Beschikbaar</small>
                        </div>
                    `;

                    listItem.addEventListener('click', () => this.showAssignmentModal({tafelNr: i, items: []}));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om bedrijf toe te wijzen';
                    
                    // Voeg lege tafel toe aan sidebar
                    sidebar.appendChild(listItem);
                } else {
                    // Voor niet-organisatoren: skip lege tafels volledig
                    console.log(`🚫 [DEBUG] Skipping empty table ${i} for non-organisator`);
                    // Continue met de loop, voeg deze lege tafel niet toe
                }
            }
        }

        console.log(`✅ Sidebar updated with ${maxTafels} tables`);
    }

    // Utility methods
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        console.error('❌ Error:', message);
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        console.log('✅ Success:', message);
        this.showNotification(message, 'success');
    }    showNotification(message, type = 'info') {
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

        // Trigger animatie na een kleine delay
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-remove na 5 seconden
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                // Verwijder element na animatie
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }showEditModeIndicator() {
        // Organisator modus indicator uitgeschakeld
        console.log('� Edit mode indicator disabled by user request');
    }hideEditIndicators() {
        console.log('🫥 Hiding edit indicators...');
        
        const editModeTag = document.getElementById('editModeTag');
        if (editModeTag) {
            // Als het een fallback element is, verwijder het volledig
            if (editModeTag.style.position === 'fixed') {
                editModeTag.remove();
            } else {
                editModeTag.style.display = 'none';
            }
        }        
        // Also hide old fallback if it exists
        const fallbackIndicator = document.getElementById('editModeIndicatorFallback');
        if (fallbackIndicator) {
            fallbackIndicator.remove();
        }
   }    // Debug function om organisator status te simuleren
    debugSetOrganisator() {
        console.log('🔧 DEBUG: Setting organisator status');
        this.isOrganisator = true;
        this.currentUser = {
            email: 'debug@organisator.be',
            userType: 'organisator',
            naam: 'Debug Organisator'
        };
        
        // UI opnieuw instellen als organisator
        this.setupOrganisatorUI();
        console.log('✅ Debug organisator status set and UI updated');
    }
}

// Globale functies voor modal interactie
window.plattegrondNamiddagManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 [DEBUG] DOM loaded, initializing PlattegrondNamiddagManager...');
    console.log('🕐 [DEBUG] DOMContentLoaded fired at:', new Date().toLocaleTimeString());
    console.log('🌐 [DEBUG] Current URL:', window.location.href);
    try {
        window.plattegrondNamiddagManager = new PlattegrondNamiddagManager();
        console.log('✅ [DEBUG] PlattegrondNamiddagManager instance created and assigned to window');
    } catch (error) {
        console.error('❌ [DEBUG] Error creating PlattegrondNamiddagManager:', error);
    }
});

// CSS voor modal en extra styling (hergebruikt van voormiddag met kleine aanpassingen)
const additionalCSS = `
.tafel-assignment-modal {
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

.current-bedrijf {
    margin-bottom: 1rem;
}

.bedrijf-select {
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
    background: linear-gradient(135deg, #1f4e79, #2a5a8a);
    color: white;
    padding: 1rem 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    text-align: center;
    box-shadow: 0 4px 15px rgba(31, 78, 121, 0.3);
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
    color: #1f4e79;
}

.empty-tafel-item {
    opacity: 0.7;
    border-style: dashed !important;
}

.empty-tafel {
    color: #666;
    font-style: italic;
}

.bedrijf-sector {
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

.notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 10000;
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.notification-error {
    border-left: 4px solid #dc3545;
}

.notification-success {
    border-left: 4px solid #28a745;
}

.notification-warning {
    border-left: 4px solid #ffc107;
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
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
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

console.log('✅ Plattegrond Namiddag script loaded successfully');

// Debug functions for testing (will use the DOMContentLoaded instance)
window.debugSetOrganisator = () => {
    if (window.plattegrondNamiddagManager) {
        window.plattegrondNamiddagManager.debugSetOrganisator();
    } else {
        console.warn('⚠️ PlattegrondNamiddagManager not yet initialized');
    }
};

window.debugTestConfigModal = () => {
    if (window.plattegrondNamiddagManager?.isOrganisator) {        window.plattegrondNamiddagManager.showTafelConfigModal();
    } else {
        console.log('❌ Not an organisator or manager not initialized');
    }
};

window.debugShowStatus = () => {
    if (!window.plattegrondNamiddagManager) {
        console.warn('⚠️ PlattegrondNamiddagManager not yet initialized');
        return;
    }
    
    console.log('👤 Current User:', window.plattegrondNamiddagManager.currentUser);
    console.log('🛂 Is Organisator:', window.plattegrondNamiddagManager.isOrganisator);
    
    const configBtn = document.getElementById('configTafelsBtn');
    console.log('🔘 Config button found:', !!configBtn);
    if (configBtn) {
        console.log('🔘 Config button display style:', configBtn.style.display);
        console.log('🔘 Config button visible:', configBtn.style.display !== 'none');
    }
    
    const token = localStorage.getItem('authToken');
    console.log('🔑 Auth token exists:', !!token);
    if (token) {
        console.log('🔑 Auth token preview:', token.substring(0, 20) + '...');
    }
};

window.debugTestUpdateTafels = (aantal = 25) => {
    if (!window.plattegrondNamiddagManager) {
        console.warn('⚠️ PlattegrondNamiddagManager not yet initialized');
        return;
    }
    console.log(`🧪 Testing updateAantalTafels with ${aantal} tafels`);
    window.plattegrondNamiddagManager.updateAantalTafels(aantal);
};

console.log('🌐 Global plattegrondNamiddagManager instantie beschikbaar voor onclick handlers');
console.log('🔧 Debug functions available: debugSetOrganisator(), debugTestConfigModal(), debugShowStatus(), debugTestUpdateTafels()');
