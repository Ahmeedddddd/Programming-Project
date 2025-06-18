// src/JS/PROGRAMMA/plattegrond-voormiddag.js
// Interactieve functionaliteit voor voormiddag plattegrond (studenten aan tafels)

console.log('Plattegrond Voormiddag script loading...');

class PlattegrondVoormiddagManager {
    constructor() {
        this.tafelData = {};
        this.currentUser = null;
        this.isOrganisator = false;
        this.selectedTafel = null;
        this.availableStudents = [];
        this.init();
    }

    async init() {
        try {
            console.log('Initializing PlattegrondVoormiddagManager...');
            
            // Laad user info
            await this.loadUserInfo();
            
            // Laad tafel data
            await this.loadTafelData();
            
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
                type: 'student',
                items: [{
                    id: 232,
                    naam: 'John Doe',
                    titel: 'Kokende AI Robot',
                    beschrijving: 'Een geavanceerde huishoudrobot...',
                    type: 'student'
                }]
            },
            2: {
                tafelNr: 2,
                type: 'student',
                items: [{
                    id: 233,
                    naam: 'Jeretom Carnomina',
                    titel: 'NeuroTrack',
                    beschrijving: 'Een draagbare EEG-headset...',
                    type: 'student'
                }]
            }
        };
        
        this.updateSidebar();
    }

    setupUI() {
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
        // Voeg organisator specifieke elementen toe
        const container = document.querySelector('.overzichtContainer');
        if (container) {
            // Voeg edit mode indicator toe
            const editIndicator = document.createElement('div');
            editIndicator.className = 'edit-mode-indicator';
            editIndicator.innerHTML = `
                <div class="organisator-controls">
                    <span class="edit-badge">👔 Organisator Modus</span>
                    <button id="refreshTafels" class="refresh-btn">🔄 Vernieuwen</button>
                </div>
            `;
            container.insertBefore(editIndicator, container.firstChild);
        }

        // Update sidebar titel
        const sidebarTitle = document.querySelector('.sidebarTitle');
        if (sidebarTitle) {
            sidebarTitle.innerHTML = '⚙️ Tafel Beheer <small>(Klik om te bewerken)</small>';
        }
    }

    setupVisitorUI() {
        // Update sidebar titel voor bezoekers
        const sidebarTitle = document.querySelector('.sidebarTitle');
        if (sidebarTitle) {
            sidebarTitle.innerHTML = 'Studenten Projecten <small>(Klik voor details)</small>';
        }
    }

    updateSidebar() {
        const sidebarList = document.querySelector('.sidebarTafels');
        if (!sidebarList) {
            console.warn('⚠️ Sidebar list not found');
            return;
        }

        sidebarList.innerHTML = '';

        // Sorteer tafels op nummer
        const sortedTafels = Object.values(this.tafelData).sort((a, b) => a.tafelNr - b.tafelNr);

        sortedTafels.forEach(tafel => {
            const listItem = document.createElement('li');
            listItem.className = 'tafel-item';
            listItem.setAttribute('data-tafel', tafel.tafelNr);            if (tafel.items && tafel.items.length > 0) {
                // Get the project title from the first item (all items should have same title)
                const firstStudent = tafel.items[0];
                const titel = firstStudent.titel || 'Geen project titel';
                
                // Get all student names
                const studentNames = tafel.items.map(student => student.naam).join(', ');
                const studentCount = tafel.items.length;
                
                listItem.innerHTML = `
                    <div class="tafel-content">
                        <strong>Tafel ${tafel.tafelNr}: ${titel}</strong>
                        <small class="student-name">Studenten (${studentCount}): ${studentNames}</small>
                    </div>
                `;                // Add click handler gebaseerd op user type
                if (this.isOrganisator) {
                    listItem.addEventListener('click', () => this.handleOrganisatorTafelClick(tafel));
                    listItem.style.cursor = 'pointer';
                    listItem.title = 'Klik om tafel toe te wijzen';
                } else {
                    listItem.addEventListener('click', () => this.handleVisitorTafelClick(firstStudent));
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
                    listItem.title = 'Klik om student toe te wijzen';
                    listItem.classList.add('empty-tafel-item');
                }
            }

            sidebarList.appendChild(listItem);
        });

        // Voeg lege tafels toe als organisator
        if (this.isOrganisator) {
            this.addEmptyTafels();
        }
    }

    addEmptyTafels() {
        const sidebarList = document.querySelector('.sidebarTafels');
        const maxTafels = 15; // Maximaal aantal tafels
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

                listItem.addEventListener('click', () => this.handleOrganisatorTafelClick({ tafelNr: i, items: [] }));
                listItem.style.cursor = 'pointer';
                listItem.title = 'Klik om student toe te wijzen';

                sidebarList.appendChild(listItem);
            }
        }
    }

    handleOrganisatorTafelClick(tafel) {
        console.log('👔 Organisator clicked tafel:', tafel.tafelNr);
        this.selectedTafel = tafel;
        this.showTafelAssignmentModal(tafel);
    }    handleVisitorTafelClick(student) {
        console.log('👤 Visitor clicked student:', student);
        
        if (student && student.id) {
            // Navigeer naar project detail pagina met student ID
            window.location.href = `/zoekbalk-projecten?id=${student.id}`;
        } else {
            this.showInfo('Geen project gegevens beschikbaar');
        }
    }

    async showTafelAssignmentModal(tafel) {
        // Laad beschikbare studenten
        await this.loadAvailableStudents();

        const modal = this.createAssignmentModal(tafel);
        document.body.appendChild(modal);

        // Focus op modal
        setTimeout(() => {
            const firstButton = modal.querySelector('button, select');
            if (firstButton) firstButton.focus();
        }, 100);
    }

    async loadAvailableStudents() {
        try {
            const response = await fetch('http://localhost:3301/api/studenten?hasProject=true');
            const result = await response.json();

            if (result.success) {
                this.availableStudents = result.data.filter(student => 
                    student.projectTitel && student.projectTitel.trim() !== ''
                );
                console.log('👥 Available students loaded:', this.availableStudents.length);
            }
        } catch (error) {
            console.error('❌ Error loading available students:', error);
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
                            <h4>Huidige toewijzing:</h4>
                            <div class="current-student">
                                <strong>${tafel.items[0].titel}</strong><br>
                                <small>👤 ${tafel.items[0].naam}</small>
                            </div>
                            <button class="remove-btn" onclick="window.plattegrondManager.removeStudentFromTafel(${tafel.items[0].id})">
                                🗑️ Verwijderen
                            </button>
                        </div>
                        <hr>
                    ` : `
                        <p>📭 Deze tafel heeft geen toewijzing</p>
                    `}
                    
                    <div class="assign-new">
                        <h4>Student toewijzen:</h4>
                        <select id="studentSelect" class="student-select">
                            <option value="">Selecteer een student...</option>
                            ${this.availableStudents.map(student => `
                                <option value="${student.studentnummer}" ${student.tafelNr ? 'disabled' : ''}>
                                    ${student.voornaam} ${student.achternaam} - ${student.projectTitel}
                                    ${student.tafelNr ? ` (Tafel ${student.tafelNr})` : ''}
                                </option>
                            `).join('')}
                        </select>
                        <button class="assign-btn" onclick="window.plattegrondManager.assignStudentToTafel(${tafel.tafelNr})">
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

    async assignStudentToTafel(tafelNr) {
        const studentSelect = document.getElementById('studentSelect');
        const studentId = studentSelect.value;

        if (!studentId) {
            this.showError('Selecteer eerst een student');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3301/api/tafels/student/${studentId}/tafel/${tafelNr}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`Student toegewezen aan tafel ${tafelNr}!`);
                this.closeModal();
                await this.loadTafelData(); // Herlaad data
            } else {
                throw new Error(result.message || 'Toewijzing mislukt');
            }
        } catch (error) {
            console.error('❌ Error assigning student:', error);
            this.showError('Toewijzing mislukt: ' + error.message);
        }
    }

    async removeStudentFromTafel(studentId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3301/api/tafels/student/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Student verwijderd van tafel!');
                this.closeModal();
                await this.loadTafelData(); // Herlaad data
            } else {
                throw new Error(result.message || 'Verwijdering mislukt');
            }
        } catch (error) {
            console.error('❌ Error removing student:', error);
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

        // ESC key om modal te sluiten
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Search functionality
        const searchInput = document.querySelector('.sidebarZoekbalk');
        if (searchInput) {
            searchInput.addEventListener('click', () => {
                this.setupSearchFunctionality();
            });
        }
    }

    setupSearchFunctionality() {
        const searchContainer = document.querySelector('.sidebarZoekbalk');
        searchContainer.innerHTML = `
            <input type="text" id="tafelSearch" placeholder="Zoek tafel, project of student..." class="search-input">
        `;

        const searchInput = document.getElementById('tafelSearch');
        searchInput.addEventListener('input', (e) => {
            this.filterTafels(e.target.value);
        });

        searchInput.focus();
    }

    filterTafels(searchTerm) {
        const tafelItems = document.querySelectorAll('.tafel-item');
        const term = searchTerm.toLowerCase();

        tafelItems.forEach(item => {
            const content = item.textContent.toLowerCase();
            if (content.includes(term)) {
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
window.plattegrondManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing PlattegrondVoormiddagManager...');
    window.plattegrondManager = new PlattegrondVoormiddagManager();
});

// CSS voor modal en extra styling
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

.current-student {
    margin-bottom: 1rem;
}

.student-select {
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

.student-name {
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

console.log('✅ Plattegrond Voormiddag script loaded successfully');