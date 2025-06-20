// src/JS/PROGRAMMA/plattegrond-namiddag.js
// Interactieve functionaliteit voor namiddag plattegrond (bedrijven aan tafels)

console.log('Plattegrond Namiddag script loading...');

class PlattegrondNamiddagManager {
    constructor() {
        this.tafelData = {};
        this.currentUser = null;
        this.isOrganisator = false;
        this.selectedTafel = null;
        this.availableBedrijven = [];
        this.init();
    }    async init() {
        try {
            console.log('Initializing PlattegrondNamiddagManager...');
            
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
            }        } catch (error) {
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
    }    setupUI() {
        console.log('🎨 Setting up UI for role:', this.isOrganisator ? 'organisator' : 'visitor');
        
        // Update UI gebaseerd op user role
        if (this.isOrganisator) {
            console.log('👔 Setting up organisator UI...');
            this.setupOrganisatorUI();
        } else {
            console.log('👤 Setting up visitor UI...');
            this.setupVisitorUI();
        }
    }    setupOrganisatorUI() {
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

        // Update sidebar titel
        const sidebarTitle = document.querySelector('.sidebarTitle');
        if (sidebarTitle) {
            sidebarTitle.innerHTML = '⚙️ Tafel Beheer <br> <small>(Klik om te bewerken)</small>';
        }
    }setupVisitorUI() {
        // Verberg refresh knop voor bezoekers
        const refreshBtn = document.getElementById('refreshTafels');
        if (refreshBtn) {
            refreshBtn.style.display = 'none';
        }
        
        // Update sidebar titel voor bezoekers
        const sidebarTitle = document.querySelector('.sidebarTitle');
        if (sidebarTitle) {
            sidebarTitle.innerHTML = 'Bedrijven Overzicht <small>(Klik voor details)</small>';
        }
    }    updateSidebar() {
        const sidebarList = document.querySelector('.sidebarTafels');
        if (!sidebarList) {
            console.warn('⚠️ Sidebar list not found');
            return;
        }

        sidebarList.innerHTML = '';

        // Haal het geconfigureerde aantal tafels op
        const maxTafels = parseInt(localStorage.getItem('namiddag_aantal_tafels')) || 15;
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
                const bedrijf = tafel.items[0]; // Voor namiddag is het meestal 1 bedrijf per tafel
                const naam = bedrijf.naam || 'Onbekend bedrijf';
                const sector = bedrijf.sector || 'Algemeen';
                  listItem.innerHTML = `
                    <div class="tafel-content">
                        <strong>Tafel ${tafel.tafelNr}: ${naam}</strong>
                        <small class="bedrijf-sector">${sector}</small>
                    </div>
                `;

                // Add click handler gebaseerd op user type
                if (this.isOrganisator) {
                    listItem.addEventListener('click', () => this.handleOrganisatorTafelClick(tafel));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om tafel toe te wijzen';
                } else {
                    listItem.addEventListener('click', () => this.handleVisitorTafelClick(bedrijf));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik voor bedrijf details';
                }            } else {
                // Lege tafel
                listItem.className = 'tafel-item beschikbaar'; // Voeg beschikbaar class toe
                listItem.innerHTML = `
                    <div class="tafel-content">
                        <strong>Tafel ${tafel.tafelNr}</strong>
                        <small class="empty-tafel">📭 Geen toewijzing</small>
                    </div>
                `;

                if (this.isOrganisator) {
                    listItem.addEventListener('click', () => this.handleOrganisatorTafelClick(tafel));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om bedrijf toe te wijzen';
                }
            }

            sidebarList.appendChild(listItem);
        });

        // Voeg lege tafels toe als organisator
        if (this.isOrganisator) {
            this.addEmptyTafels();
        }
    }    addEmptyTafels() {
        const sidebarList = document.querySelector('.sidebarTafels');
        
        // Haal het geconfigureerde aantal tafels op
        const maxTafels = parseInt(localStorage.getItem('namiddag_aantal_tafels')) || 15;
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
                    listItem.title = 'Klik om bedrijf toe te wijzen';
                }

                sidebarList.appendChild(listItem);
            }
        }
        
        console.log(`✅ Empty tables added up to tafel ${maxTafels}`);
    }

    handleOrganisatorTafelClick(tafel) {
        console.log('👔 Organisator clicked tafel:', tafel.tafelNr);
        this.selectedTafel = tafel;
        this.showTafelAssignmentModal(tafel);
    }

    handleVisitorTafelClick(bedrijf) {
        console.log('👤 Visitor clicked bedrijf:', bedrijf);
        
        if (bedrijf && bedrijf.id) {
            // Navigeer naar bedrijf detail pagina
            window.location.href = `/resultaatBedrijf?id=${bedrijf.id}`;
        } else {
            this.showInfo('Geen bedrijf gegevens beschikbaar');
        }
    }    async showTafelAssignmentModal(tafel) {
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
        if (!this.availableBedrijven || this.availableBedrijven.length === 0) {
            await this.loadAvailableBedrijven();
            // Update modal met bedrijven data
            this.updateModalWithBedrijven(modal, tafel);
        }
    }async loadAvailableBedrijven() {
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
                    <h3>⚙️ Tafel ${tafel.tafelNr} Beheren</h3>
                    
                    ${tafel.items && tafel.items.length > 0 ? `
                        <div class="current-assignment">
                            <h4>Huidige toewijzing:</h4>
                            <div class="current-bedrijf">                                <strong>${tafel.items[0].naam}</strong><br>
                                <small>${tafel.items[0].sector || 'Geen sector'}</small>
                            </div>                            <button class="remove-btn" onclick="window.plattegrondNamiddagManager.removeBedrijfFromTafel('${tafel.items[0].id}')">
                                Verwijderen
                            </button>
                        </div>
                        <hr>
                    ` : `
                        <p>Deze tafel heeft geen toewijzing</p>
                    `}                      <div class="assign-new">
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
    }    updateModalWithBedrijven(modal, tafel) {
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
                optgroupBeschikbaar.label = '📋 Nog aan te duiden bedrijven';
                beschikbareBedrijven.forEach(bedrijf => {
                    const option = document.createElement('option');
                    option.value = bedrijf.bedrijfsnummer;
                    option.textContent = `${bedrijf.naam} - ${bedrijf.sector || 'Geen sector'}`;
                    optgroupBeschikbaar.appendChild(option);
                });
                bedrijfSelect.appendChild(optgroupBeschikbaar);
            }            // Add toegewezen bedrijven met header
            if (toegewezenBedrijven.length > 0) {
                const optgroupAssigned = document.createElement('optgroup');
                optgroupAssigned.label = '✅ Al aangeduide bedrijven';
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
    }

    buildBedrijvenOptgroups() {
        const beschikbareBedrijven = this.availableBedrijven.filter(b => !b.tafelNr)
            .sort((a, b) => a.naam.localeCompare(b.naam));
        const toegewezenBedrijven = this.availableBedrijven.filter(b => b.tafelNr)
            .sort((a, b) => a.naam.localeCompare(b.naam));
        
        let html = '';
        
        // Beschikbare bedrijven
        if (beschikbareBedrijven.length > 0) {
            html += '<optgroup label="📋 Nog aan te duiden bedrijven">';
            beschikbareBedrijven.forEach(bedrijf => {
                html += `<option value="${bedrijf.bedrijfsnummer}">
                    ${bedrijf.naam} - ${bedrijf.sector || 'Algemeen'}
                </option>`;
            });
            html += '</optgroup>';
        }
        
        // Toegewezen bedrijven
        if (toegewezenBedrijven.length > 0) {
            html += '<optgroup label="✅ Al aangeduide bedrijven">';
            toegewezenBedrijven.forEach(bedrijf => {
                html += `<option value="${bedrijf.bedrijfsnummer}" disabled>
                    ${bedrijf.naam} - ${bedrijf.sector || 'Algemeen'} (Tafel ${bedrijf.tafelNr})
                </option>`;
            });
            html += '</optgroup>';
        }
        
        return html;
    }

    async assignBedrijfToTafel(tafelNr) {
        const bedrijfSelect = document.getElementById('bedrijfSelect');
        const bedrijfId = bedrijfSelect.value;

        if (!bedrijfId) {
            this.showError('Selecteer eerst een bedrijf');
            return;
        }        try {
            const token = localStorage.getItem('authToken');            const response = await fetch(`http://localhost:8383/api/tafels/bedrijf/${bedrijfId}/tafel/${tafelNr}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();            if (result.success) {
                this.showSuccess(`Bedrijf toegewezen aan tafel ${tafelNr}!`);
                this.closeModal();
                await this.loadTafelData(); // Herlaad data
                // Cache invalideren zodat bedrijven lijst wordt ververst
                this.availableBedrijven = [];
            } else {
                throw new Error(result.message || 'Toewijzing mislukt');
            }
        } catch (error) {
            console.error('❌ Error assigning bedrijf:', error);
            this.showError('Toewijzing mislukt: ' + error.message);
        }
    }    async removeBedrijfFromTafel(bedrijfId) {
        try {
            console.log('🗑️ Removing bedrijf with ID:', bedrijfId);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:8383/api/tafels/bedrijf/${bedrijfId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();            if (result.success) {
                this.showSuccess('Bedrijf verwijderd van tafel!');
                // NIET de modal sluiten, maar verversen voor directe nieuwe toewijzing
                await this.loadTafelData(); // Herlaad data
                
                // Cache invalideren zodat bedrijven lijst wordt ververst
                this.availableBedrijven = [];
                await this.loadAvailableBedrijven(); // Herlaad beschikbare bedrijven
                
                // Update de modal met nieuwe gegevens (tafel is nu leeg)
                const currentModal = document.querySelector('.tafel-assignment-modal');
                if (currentModal) {
                    const tafelNr = this.selectedTafel.tafelNr;
                    const updatedTafel = { tafelNr: tafelNr, items: [] }; // Tafel is nu leeg
                    this.selectedTafel = updatedTafel;
                    
                    // Vervang modal content
                    const newModal = this.createAssignmentModal(updatedTafel);
                    currentModal.innerHTML = newModal.innerHTML;
                    
                    // Update dropdown met nieuwe bedrijven
                    this.updateModalWithBedrijven(currentModal, updatedTafel);
                }
            } else {
                throw new Error(result.message || 'Verwijdering mislukt');
            }
        } catch (error) {
            console.error('❌ Error removing bedrijf:', error);
            this.showError('Verwijdering mislukt: ' + error.message);
        }
    }    closeModal(modalElement = null) {
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
        });

        // Config button
        const configBtn = document.getElementById('configTafelsBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                if (this.isOrganisator) {
                    this.showTafelConfigModal();
                }
            });
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
        }    }    filterTafels(searchTerm) {
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
        console.log('🔄 Refreshing tafel data...');
        this.showLoading(true);
        
        try {
            await this.loadTafelData();
            this.showSuccess('Tafel gegevens vernieuwd!');
        } catch (error) {
            this.showError('Kon gegevens niet vernieuwen');
        } finally {
            this.showLoading(false);
        }
    }    showTafelConfigModal() {
        // Huidige waarde ophalen uit localStorage of default 15
        const currentAantal = localStorage.getItem('namiddag_aantal_tafels') || '15';
        
        const modal = document.createElement('div');
        modal.className = 'config-modal';
        modal.innerHTML = `
            <div class="config-modal-content">
                <h3>Tafel Configuratie</h3>
                <div class="config-form">
                    <div class="config-input-group">
                        <label for="aantalTafels">Aantal tafels:</label>
                        <input type="number" id="aantalTafels" class="config-input" 
                               value="${currentAantal}" min="1" max="500" placeholder="Bijv. 15">
                    </div>
                    <div class="config-buttons">
                        <button class="config-btn-cancel">Annuleren</button>
                        <button class="config-btn-save">Opslaan</button>
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
                this.showNotification('✅ Aantal tafels aangepast naar ' + aantalTafels);
            } else {
                this.showNotification('❌ Aantal tafels moet tussen 1 en 500 zijn', 'error');
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
    }    async updateAantalTafels(aantalTafels) {
        try {
            console.log(`🔧 Attempting to update aantal tafels to: ${aantalTafels}`);
            // Probeer de API endpoint
            let apiSuccess = false;
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:8383/api/tafels/namiddag/config`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ aantalTafels })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ API success:`, result);
                    apiSuccess = true;
                } else {
                    console.log(`⚠️ API not available yet (${response.status}), using localStorage fallback`);
                }
            } catch (apiError) {
                console.log(`⚠️ API endpoint not ready, using localStorage fallback:`, apiError.message);
            }

            // Als API faalt, gebruik localStorage fallback
            if (!apiSuccess) {
                localStorage.setItem('namiddag_aantal_tafels', aantalTafels);
                console.log(`✅ Aantal tafels opgeslagen in localStorage: ${aantalTafels}`);
            }

            // Herlaad de tafel data
            await this.loadTafelData();
            
            // Update de display tekst
            this.updateTafelCountDisplay();
            
        } catch (error) {
            console.error('❌ Error updating aantal tafels:', error);
            this.showNotification('❌ Fout bij het aanpassen van aantal tafels', 'error');
        }
    }

    updateTafelCountDisplay() {
        const countDisplay = document.getElementById('tafelCountText');
        if (countDisplay) {
            const currentAantal = localStorage.getItem('namiddag_aantal_tafels') || '15';
            countDisplay.textContent = `Aantal tafels: ${currentAantal}`;
            console.log(`📊 Updated display: Aantal tafels: ${currentAantal}`);
        }
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
    }

    showInfo(message) {
        console.log('ℹ️ Info:', message);
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Globale functies voor modal interactie
window.plattegrondNamiddagManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing PlattegrondNamiddagManager...');
    window.plattegrondNamiddagManager = new PlattegrondNamiddagManager();
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
`;

// Voeg CSS toe aan document
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

console.log('✅ Plattegrond Namiddag script loaded successfully');