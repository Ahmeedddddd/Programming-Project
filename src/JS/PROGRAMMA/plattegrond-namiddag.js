// plattegrond-namiddag.js - Plattegrond management voor namiddag sessie (bedrijven)

class PlattegrondNamiddagManager {
    constructor() {
        this.currentUser = null;
        this.tafelData = [];
        this.alleBedrijven = [];
        this.isLoggedIn = false;
        this.userType = null;
        this.draggedElement = null;
        this.isInitialized = false;
        
        // Tafel configuratie met database sync
        this.tafelConfig = {
            maxTafels: 15,
            maxLimit: 50,
            loaded: false
        };

        console.log('🏢 PlattegrondNamiddagManager initialized');
    }

    async init() {
        try {
            console.log('🚀 Initializing PlattegrondNamiddagManager...');
            
            // Laad configuratie van database in plaats van localStorage
            await this.loadTafelConfig();
            
            // Laad user info
            await this.loadUserInfo();
            
            // Laad alle data
            await Promise.all([
                this.loadTafelData(),
                this.loadAlleBedrijven()
            ]);
            
            // Setup UI
            this.setupEventListeners();
            this.updateSidebar();
            this.updatePlattegrond();
            this.updateTafelCountDisplay();
            
            this.isInitialized = true;
            console.log('✅ PlattegrondNamiddagManager initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing PlattegrondNamiddagManager:', error);
            this.showError('Er ging iets mis bij het laden van de plattegrond');
        }
    }

    async loadTafelConfig() {
        try {
            console.log('📊 Loading tafel configuration from database...');
            
            const response = await fetch('/api/config/tafels');
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.tafelConfig = {
                        maxTafels: result.data.namiddag_aantal_tafels || 15,
                        maxLimit: result.data.max_tafels_limit || 50,
                        loaded: true
                    };
                    console.log('✅ Tafel config loaded from database:', this.tafelConfig);
                } else {
                    throw new Error(result.message || 'Failed to load config');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load config from database, using fallback:', error.message);
            
            // Fallback naar localStorage als database niet beschikbaar is
            this.tafelConfig = {
                maxTafels: parseInt(localStorage.getItem('namiddag_aantal_tafels')) || 15,
                maxLimit: 50,
                loaded: false
            };
        }
    }

    async loadUserInfo() {
        try {
            const response = await fetch('/api/user-info');
            if (response.ok) {
                const result = await response.json();
                if (result.authenticated) {
                    this.currentUser = result.user;
                    this.isLoggedIn = true;
                    this.userType = result.user.userType;
                    console.log('👤 User info loaded:', this.userType);
                } else {
                    this.isLoggedIn = false;
                    console.log('👤 No authenticated user');
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load user info:', error);
            this.isLoggedIn = false;
        }
    }

    async loadTafelData() {
        try {
            console.log('📊 Loading namiddag tafel assignments...');
            
            const response = await fetch('/api/tafels/namiddag');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.tafelData = result.data.assignments || [];
                    console.log(`✅ Loaded ${this.tafelData.length} tafel assignments`);
                } else {
                    throw new Error(result.message || 'Failed to load tafel data');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error loading tafel data:', error);
            this.tafelData = [];
            this.showNotification('⚠️ Kon tafel gegevens niet laden', 'warning');
        }
    }

    async loadAlleBedrijven() {
        try {
            console.log('🏢 Loading all companies...');
            
            const response = await fetch('/api/bedrijven');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.alleBedrijven = result.data || [];
                    console.log(`✅ Loaded ${this.alleBedrijven.length} companies`);
                } else {
                    throw new Error(result.message || 'Failed to load companies');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error loading companies:', error);
            this.alleBedrijven = [];
            this.showNotification('⚠️ Kon bedrijven niet laden', 'warning');
        }
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');

        // Config button
        const configBtn = document.getElementById('configTafelsBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => this.showTafelConfigModal());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Search functionality
        const searchInput = document.getElementById('bedrijfSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterBedrijven(e.target.value));
        }

        // Auto-assign button
        const autoAssignBtn = document.getElementById('autoAssignBtn');
        if (autoAssignBtn && this.userType === 'organisator') {
            autoAssignBtn.addEventListener('click', () => this.autoAssignBedrijven());
        }

        // Clear all button
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn && this.userType === 'organisator') {
            clearAllBtn.addEventListener('click', () => this.clearAllAssignments());
        }

        console.log('✅ Event listeners set up');
    }

    updateSidebar() {
        const sidebarList = document.querySelector('.sidebarTafels');
        if (!sidebarList) {
            console.warn('⚠️ Sidebar list not found');
            return;
        }

        sidebarList.innerHTML = '';

        // Gebruik de geladen configuratie in plaats van localStorage
        const maxTafels = this.tafelConfig.maxTafels;
        console.log(`📊 Showing max ${maxTafels} tafels in sidebar`);

        // Toon toegewezen bedrijven
        const toegewezenBedrijven = this.tafelData.filter(item => item.tafelNr && item.tafelNr > 0);
        
        toegewezenBedrijven.forEach(bedrijf => {
            const li = document.createElement('li');
            li.className = 'tafel-item assigned';
            li.innerHTML = `
                <div class="tafel-header">
                    <span class="tafel-nummer">Tafel ${bedrijf.tafelNr}</span>
                    ${this.userType === 'organisator' ? '<button class="remove-btn" onclick="plattegrondManager.removeBedrijfFromTafel(\'' + bedrijf.bedrijfsnummer + '\')">✕</button>' : ''}
                </div>
                <div class="bedrijf-info">
                    <strong>${bedrijf.naam}</strong>
                    <div class="bedrijf-details">
                        <span class="sector">${bedrijf.sector || 'Geen sector'}</span>
                        <span class="gemeente">${bedrijf.gemeente || 'Geen locatie'}</span>
                    </div>
                </div>
            `;
            
            if (this.userType === 'organisator') {
                li.draggable = true;
                li.dataset.bedrijfsnummer = bedrijf.bedrijfsnummer;
                li.dataset.tafelNr = bedrijf.tafelNr;
                
                li.addEventListener('dragstart', (e) => this.handleDragStart(e));
                li.addEventListener('dragend', (e) => this.handleDragEnd(e));
            }
            
            sidebarList.appendChild(li);
        });

        // Voeg lege tafels toe
        this.addEmptyTafels();

        console.log(`✅ Sidebar updated with ${toegewezenBedrijven.length} assigned companies`);
    }

    addEmptyTafels() {
        const sidebarList = document.querySelector('.sidebarTafels');
        if (!sidebarList) return;
        
        // Gebruik de geladen configuratie
        const maxTafels = this.tafelConfig.maxTafels;
        console.log(`📊 Adding empty tables up to ${maxTafels}`);
        
        const bezetteTafels = this.tafelData
            .filter(item => item.tafelNr && item.tafelNr > 0)
            .map(item => parseInt(item.tafelNr));

        for (let i = 1; i <= maxTafels; i++) {
            if (!bezetteTafels.includes(i)) {
                const li = document.createElement('li');
                li.className = 'tafel-item empty';
                li.innerHTML = `
                    <div class="tafel-header">
                        <span class="tafel-nummer">Tafel ${i}</span>
                    </div>
                    <div class="empty-indicator">Beschikbaar</div>
                `;
                
                if (this.userType === 'organisator') {
                    li.addEventListener('dragover', (e) => this.handleDragOver(e));
                    li.addEventListener('drop', (e) => this.handleDrop(e, i));
                }
                
                sidebarList.appendChild(li);
            }
        }
    }

    updatePlattegrond() {
        const plattegrondContainer = document.querySelector('.plattegrond-container');
        if (!plattegrondContainer) {
            console.warn('⚠️ Plattegrond container not found');
            return;
        }

        // Toon niet-toegewezen bedrijven
        const nietToegew = this.alleBedrijven.filter(bedrijf => 
            !this.tafelData.some(assigned => assigned.bedrijfsnummer === bedrijf.bedrijfsnummer)
        );

        const beschikbareBedrijvenContainer = document.getElementById('beschikbareBedrijven');
        if (beschikbareBedrijvenContainer) {
            beschikbareBedrijvenContainer.innerHTML = '';
            
            nietToegew.forEach(bedrijf => {
                const bedrijfElement = document.createElement('div');
                bedrijfElement.className = 'bedrijf-item';
                bedrijfElement.innerHTML = `
                    <div class="bedrijf-header">
                        <strong>${bedrijf.naam}</strong>
                        <span class="bedrijf-nummer">#${bedrijf.bedrijfsnummer}</span>
                    </div>
                    <div class="bedrijf-details">
                        <span class="sector">${bedrijf.sector || 'Geen sector'}</span>
                        <span class="gemeente">${bedrijf.gemeente || 'Geen locatie'}</span>
                    </div>
                    <div class="bedrijf-contact">
                        ${bedrijf.email ? `<span class="email">${bedrijf.email}</span>` : ''}
                        ${bedrijf.telefoon ? `<span class="telefoon">${bedrijf.telefoon}</span>` : ''}
                    </div>
                `;
                
                if (this.userType === 'organisator') {
                    bedrijfElement.draggable = true;
                    bedrijfElement.dataset.bedrijfsnummer = bedrijf.bedrijfsnummer;
                    
                    bedrijfElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
                    bedrijfElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
                }
                
                beschikbareBedrijvenContainer.appendChild(bedrijfElement);
            });
        }

        console.log(`✅ Plattegrond updated with ${nietToegew.length} unassigned companies`);
    }

    // Drag and Drop handlers
    handleDragStart(e) {
        if (this.userType !== 'organisator') return;
        
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        
        const bedrijfsnummer = e.target.dataset.bedrijfsnummer;
        e.dataTransfer.setData('text/plain', bedrijfsnummer);
        
        console.log('🎯 Drag started for company:', bedrijfsnummer);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
    }

    handleDragOver(e) {
        if (this.userType !== 'organisator') return;
        e.preventDefault();
        e.target.closest('.tafel-item')?.classList.add('drag-over');
    }

    async handleDrop(e, tafelNr) {
        if (this.userType !== 'organisator') return;
        
        e.preventDefault();
        e.target.closest('.tafel-item')?.classList.remove('drag-over');
        
        const bedrijfsnummer = e.dataTransfer.getData('text/plain');
        if (!bedrijfsnummer) return;
        
        console.log(`🎯 Dropping company ${bedrijfsnummer} on table ${tafelNr}`);
        
        try {
            await this.assignBedrijfToTafel(bedrijfsnummer, tafelNr);
        } catch (error) {
            console.error('❌ Error in drop handler:', error);
            this.showNotification('❌ Fout bij toewijzen van bedrijf aan tafel', 'error');
        }
    }

    async assignBedrijfToTafel(bedrijfsnummer, tafelNr) {
        if (this.userType !== 'organisator') {
            this.showNotification('❌ Alleen organisatoren kunnen bedrijven toewijzen', 'error');
            return;
        }

        try {
            console.log(`📝 Assigning company ${bedrijfsnummer} to table ${tafelNr}`);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/tafels/bedrijf/${bedrijfsnummer}/tafel/${tafelNr}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('✅ Company assigned successfully:', result);
                this.showNotification(`✅ ${result.message}`, 'success');
                
                // Refresh data
                await this.loadTafelData();
                this.updateSidebar();
                this.updatePlattegrond();
            } else {
                throw new Error(result.message || 'Assignment failed');
            }
        } catch (error) {
            console.error('❌ Error assigning company to table:', error);
            this.showNotification(`❌ Fout bij toewijzen: ${error.message}`, 'error');
        }
    }

    async removeBedrijfFromTafel(bedrijfsnummer) {
        if (this.userType !== 'organisator') {
            this.showNotification('❌ Alleen organisatoren kunnen bedrijven verwijderen', 'error');
            return;
        }

        try {
            console.log(`🗑️ Removing company ${bedrijfsnummer} from table`);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/tafels/bedrijf/${bedrijfsnummer}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('✅ Company removed successfully:', result);
                this.showNotification(`✅ ${result.message}`, 'success');
                
                // Refresh data
                await this.loadTafelData();
                this.updateSidebar();
                this.updatePlattegrond();
            } else {
                throw new Error(result.message || 'Removal failed');
            }
        } catch (error) {
            console.error('❌ Error removing company from table:', error);
            this.showNotification(`❌ Fout bij verwijderen: ${error.message}`, 'error');
        }
    }

    showTafelConfigModal() {
        if (this.userType !== 'organisator') {
            this.showNotification('❌ Alleen organisatoren kunnen tafel configuratie wijzigen', 'error');
            return;
        }

        // Gebruik de geladen configuratie
        const currentAantal = this.tafelConfig.maxTafels.toString();
        const maxLimit = this.tafelConfig.maxLimit;
        
        const modal = document.createElement('div');
        modal.className = 'config-modal';
        modal.innerHTML = `
            <div class="config-modal-content">
                <h3>Tafel Configuratie - Namiddag</h3>
                <div class="config-form">
                    <div class="config-input-group">
                        <label for="aantalTafels">Aantal tafels:</label>
                        <input type="number" id="aantalTafels" class="config-input" 
                               value="${currentAantal}" min="1" max="${maxLimit}" 
                               placeholder="Bijv. 15">
                        <small>Maximum: ${maxLimit} tafels</small>
                        <small class="status-indicator ${this.tafelConfig.loaded ? 'db-connected' : 'local-storage'}">
                            ${this.tafelConfig.loaded ? '💾 Database verbonden' : '💻 Lokaal opgeslagen'}
                        </small>
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

        saveBtn.addEventListener('click', async () => {
            const aantalTafels = parseInt(input.value);
            if (aantalTafels >= 1 && aantalTafels <= maxLimit) {
                await this.updateAantalTafels(aantalTafels);
                document.body.removeChild(modal);
            } else {
                this.showNotification(`❌ Aantal tafels moet tussen 1 en ${maxLimit} zijn`, 'error');
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
    }

    async updateAantalTafels(aantalTafels) {
        try {
            console.log(`🔧 Updating aantal tafels to: ${aantalTafels}`);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/config/tafels', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ namiddag_aantal_tafels: aantalTafels })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log(`✅ Database update successful:`, result);
                
                // Update lokale configuratie
                this.tafelConfig.maxTafels = aantalTafels;
                this.tafelConfig.loaded = true;
                
                // Update ook localStorage als fallback
                localStorage.setItem('namiddag_aantal_tafels', aantalTafels);
                
                // Herlaad de tafel data
                await this.loadTafelData();
                
                // Update de display
                this.updateSidebar();
                this.updateTafelCountDisplay();
                
                this.showNotification('✅ Aantal tafels succesvol aangepast naar ' + aantalTafels);
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (error) {
            console.error('❌ Error updating aantal tafels:', error);
            
            // Fallback naar localStorage als database update faalt
            console.log('⚠️ Falling back to localStorage');
            localStorage.setItem('namiddag_aantal_tafels', aantalTafels);
            this.tafelConfig.maxTafels = aantalTafels;
            this.tafelConfig.loaded = false;
            
            this.updateSidebar();
            this.updateTafelCountDisplay();
            
            this.showNotification('⚠️ Aantal tafels lokaal opgeslagen (database niet beschikbaar)', 'warning');
        }
    }

    updateTafelCountDisplay() {
        const countDisplay = document.getElementById('tafelCountText');
        if (countDisplay) {
            const statusIcon = this.tafelConfig.loaded ? '💾' : '💻';
            countDisplay.textContent = `${statusIcon} Aantal tafels: ${this.tafelConfig.maxTafels}`;
            countDisplay.title = this.tafelConfig.loaded ? 
                'Opgeslagen in database' : 
                'Lokaal opgeslagen (database niet beschikbaar)';
        }
    }

    filterBedrijven(searchTerm) {
        const bedrijfElements = document.querySelectorAll('.bedrijf-item');
        const term = searchTerm.toLowerCase();
        
        bedrijfElements.forEach(element => {
            const naam = element.querySelector('strong')?.textContent?.toLowerCase() || '';
            const sector = element.querySelector('.sector')?.textContent?.toLowerCase() || '';
            const gemeente = element.querySelector('.gemeente')?.textContent?.toLowerCase() || '';
            
            const matches = naam.includes(term) || sector.includes(term) || gemeente.includes(term);
            element.style.display = matches ? 'block' : 'none';
        });
    }

    async autoAssignBedrijven() {
        if (this.userType !== 'organisator') {
            this.showNotification('❌ Alleen organisatoren kunnen auto-assign gebruiken', 'error');
            return;
        }

        try {
            console.log('🤖 Starting auto-assignment of companies...');
            
            const nietToegew = this.alleBedrijven.filter(bedrijf => 
                !this.tafelData.some(assigned => assigned.bedrijfsnummer === bedrijf.bedrijfsnummer)
            );

            if (nietToegew.length === 0) {
                this.showNotification('ℹ️ Alle bedrijven zijn al toegewezen', 'info');
                return;
            }

            const bezetteTafels = this.tafelData
                .filter(item => item.tafelNr && item.tafelNr > 0)
                .map(item => parseInt(item.tafelNr));

            const beschikbareTafels = [];
            for (let i = 1; i <= this.tafelConfig.maxTafels; i++) {
                if (!bezetteTafels.includes(i)) {
                    beschikbareTafels.push(i);
                }
            }

            if (beschikbareTafels.length === 0) {
                this.showNotification('⚠️ Geen beschikbare tafels voor auto-assignment', 'warning');
                return;
            }

            // Assign companies to available tables
            const assignments = [];
            const maxAssignments = Math.min(nietToegew.length, beschikbareTafels.length);
            
            for (let i = 0; i < maxAssignments; i++) {
                assignments.push({
                    type: 'bedrijf',
                    id: nietToegew[i].bedrijfsnummer,
                    tafelNr: beschikbareTafels[i]
                });
            }

            // Execute bulk assignment
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/tafels/bulk-assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ assignments })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('✅ Auto-assignment completed:', result);
                this.showNotification(`✅ ${result.data.successful.length} bedrijven automatisch toegewezen`, 'success');
                
                // Refresh data
                await this.loadTafelData();
                this.updateSidebar();
                this.updatePlattegrond();
            } else {
                throw new Error(result.message || 'Auto-assignment failed');
            }
        } catch (error) {
            console.error('❌ Error in auto-assignment:', error);
            this.showNotification(`❌ Fout bij automatisch toewijzen: ${error.message}`, 'error');
        }
    }

    async clearAllAssignments() {
        if (this.userType !== 'organisator') {
            this.showNotification('❌ Alleen organisatoren kunnen alle toewijzingen wissen', 'error');
            return;
        }

        if (!confirm('⚠️ Weet je zeker dat je alle tafel toewijzingen wilt wissen? Dit kan niet ongedaan gemaakt worden.')) {
            return;
        }

        try {
            console.log('🗑️ Clearing all table assignments...');
            
            const toegewezenBedrijven = this.tafelData.filter(item => item.tafelNr && item.tafelNr > 0);
            
            if (toegewezenBedrijven.length === 0) {
                this.showNotification('ℹ️ Geen toewijzingen om te wissen', 'info');
                return;
            }

            // Remove all assignments
            const token = localStorage.getItem('authToken');
            const promises = toegewezenBedrijven.map(bedrijf => 
                fetch(`/api/tafels/bedrijf/${bedrijf.bedrijfsnummer}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            );

            const responses = await Promise.allSettled(promises);
            const successful = responses.filter(r => r.status === 'fulfilled' && r.value.ok).length;
            
            console.log(`✅ Cleared ${successful}/${toegewezenBedrijven.length} assignments`);
            this.showNotification(`✅ ${successful} toewijzingen gewist`, 'success');
            
            // Refresh data
            await this.loadTafelData();
            this.updateSidebar();
            this.updatePlattegrond();
            
        } catch (error) {
            console.error('❌ Error clearing assignments:', error);
            this.showNotification(`❌ Fout bij wissen van toewijzingen: ${error.message}`, 'error');
        }
    }

    async refreshData() {
        try {
            console.log('🔄 Refreshing all data...');
            this.showNotification('🔄 Gegevens verversen...', 'info');
            
            await Promise.all([
                this.loadTafelConfig(),
                this.loadTafelData(),
                this.loadAlleBedrijven()
            ]);
            
            this.updateSidebar();
            this.updatePlattegrond();
            this.updateTafelCountDisplay();
            
            this.showNotification('✅ Gegevens ververst', 'success');
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            this.showNotification('❌ Fout bij verversen van gegevens', 'error');
        }
    }

    showNotification(message, type = 'info') {
        console.log(`🔔 Notification (${type}):`, message);
        
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Global initialization
let plattegrondManager;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, initializing PlattegrondNamiddagManager...');
    
    plattegrondManager = new PlattegrondNamiddagManager();
    await plattegrondManager.init();
    
    // Make globally available
    window.plattegrondManager = plattegrondManager;
});

// Global functions for HTML onclick handlers
window.removeBedrijfFromTafel = (bedrijfsnummer) => {
    if (window.plattegrondManager) {
        window.plattegrondManager.removeBedrijfFromTafel(bedrijfsnummer);
    }
};

console.log('🏢 PlattegrondNamiddag module loaded');