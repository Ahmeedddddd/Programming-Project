/**
 * 👨‍💼 gegevens-organisator.js - Organisator gegevens beheer
 * 
 * Dit bestand beheert de organisator profiel pagina:
 * - Ophalen van organisator gegevens uit de database
 * - Dynamische weergave van organisator informatie
 * - Bewerkingsmodus voor organisator gegevens
 * - Real-time updates en validatie
 * 
 * Features:
 * - Automatische data loading
 * - Inline editing van organisator gegevens
 * - Form validatie
 * - Error handling
 * - Success notifications
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 */

/**
 * 🎯 OrganisatorGegevensManager - Hoofdklasse voor organisator gegevens beheer
 * Beheert alle interacties met organisator data en UI updates
 */
class OrganisatorGegevensManager {
    constructor() {
        this.organisatorData = null;
        this.isEditMode = false;
        this.originalValues = {};
        this.changedFields = new Set();
        
        console.log('👨‍💼 OrganisatorGegevensManager initialiseren...');
        this.init();
    }

    /**
     * 🚀 Initialiseert de manager
     * Zet event listeners op en laadt organisator data
     */
    async init() {
        try {
            await this.loadOrganisatorData();
            this.setupEventListeners();
            this.setupAutoSave();
            this.setupFormValidation();
            console.log('✅ OrganisatorGegevensManager geïnitialiseerd');
        } catch (error) {
            console.error('❌ Fout bij initialiseren:', error);
            this.showError('Fout bij het laden van organisator gegevens');
        }
    }

    /**
     * 📡 Laadt organisator gegevens van de server
     * Haalt alle relevante organisator informatie op
     */
    async loadOrganisatorData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Geen authenticatietoken gevonden');
            }

            const response = await fetch('/api/organisator/gegevens', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.organisatorData = await response.json();
            console.log('📊 Organisator data geladen:', this.organisatorData);
            
            this.updateUI();
            this.showSuccess('Organisator gegevens succesvol geladen');
            
        } catch (error) {
            console.error('❌ Fout bij laden organisator data:', error);
            throw error;
        }
    }

    /**
     * 🎨 Werkt de UI bij met organisator gegevens
     * Vult alle velden in met de opgehaalde data
     */
    updateUI() {
        if (!this.organisatorData) {
            console.warn('⚠️ Geen organisator data beschikbaar voor UI update');
            return;
        }

        // Reload the data to get updated information
        this.loadOrganisatorData();

        // Update basis persoonlijke gegevens
        this.updateField('naam', this.organisatorData.naam || 'Niet ingevuld');
        this.updateField('email', this.organisatorData.email || 'Niet ingevuld');
        this.updateField('telefoon', '+32 2 290 10 91'); // Vast kantoortelefoon
        
        // Set default/hardcoded organizational values if not in database
        this.updateField('functie', 'Event Organisator');
        this.updateField('afdeling', 'Student Services');
        this.updateField('locatie', 'Campus Kaai');
        
        // Update last login
        this.updateField('last-login', 'Vandaag');
        
        // Set account status
        this.updateField('account-status', 'Actief');
        
        // Set responsibilities
        this.updateField('verantwoordelijkheden', 'Event Planning, Student Support, Bedrijfscoördinatie');

        // Update pagina titel
        const pageTitle = document.querySelector('title');
        if (pageTitle && this.organisatorData.naam) {
            pageTitle.textContent = `Organisator Profiel - ${this.organisatorData.naam}`;
        }

        console.log('🎨 UI bijgewerkt met organisator gegevens');
    }

    /**
     * 📝 Werkt een specifiek veld bij in de UI
     * @param {string} fieldName - Naam van het veld
     * @param {string} value - Nieuwe waarde
     */
    updateField(fieldName, value) {
        const displaySpan = document.querySelector(`[data-field="${fieldName}"] .display-value`);
        const editInput = document.querySelector(`[data-field="${fieldName}"] .edit-input`);
        
        if (displaySpan) {
            // Handle different field types
            if (fieldName === 'verantwoordelijkheden') {
                // For responsibilities, update the entire content after the <strong> tag
                const strongTag = displaySpan.querySelector('strong');
                if (strongTag) {
                    strongTag.nextSibling.textContent = `: ${value}`;
                } else {
                    displaySpan.textContent = value;
                }
            } else {
                // For direct text updates
                displaySpan.textContent = value;
            }
        }
        
        if (editInput) {
            if (editInput.tagName === 'TEXTAREA') {
                editInput.value = value;
            } else {
                editInput.value = value;
            }
        }
    }

    /**
     * 🎧 Zet event listeners op voor interactieve elementen
     */
    setupEventListeners() {
        // Edit knoppen
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', () => this.enableEditMode());
        });

        // Cancel knoppen
        const cancelButtons = document.querySelectorAll('.cancel-btn');
        cancelButtons.forEach(button => {
            button.addEventListener('click', () => this.disableEditMode());
        });

        // Save knoppen
        const saveButtons = document.querySelectorAll('.save-btn');
        saveButtons.forEach(button => {
            button.addEventListener('click', () => this.saveChanges());
        });

        // Input change tracking
        const editableInputs = document.querySelectorAll('.editable-field .edit-input');
        editableInputs.forEach(input => {
            input.addEventListener('input', () => this.trackChanges(input));
        });

        console.log('🎧 Event listeners ingesteld');
    }

    /**
     * ✏️ Schakelt bewerkingsmodus in
     * Maakt alle bewerkbare velden editbaar
     */
    enableEditMode() {
        console.log('✏️ Bewerkingsmodus inschakelen...');
        
        this.isEditMode = true;
        this.originalValues = {};
        
        // Definieer bewerkbare velden voor organisatoren
        const editableFields = ['naam', 'email', 'telefoon', 'functie', 'afdeling', 'locatie'];
        
        editableFields.forEach(fieldName => {
            const fieldContainer = document.querySelector(`[data-field="${fieldName}"]`);
            if (!fieldContainer) return;
            
            const displaySpan = fieldContainer.querySelector('.display-value');
            const editInput = fieldContainer.querySelector('.edit-input');
            
            if (displaySpan && editInput) {
                // Sla originele waarde op
                this.originalValues[fieldName] = displaySpan.textContent;
                
                // Toon de input, verberg de span
                displaySpan.style.display = 'none';
                editInput.style.display = 'inline-block';
                editInput.focus();
                
                // Zet huidige waarde in input
                editInput.value = displaySpan.textContent;
            }
        });
        
        // Toon save/cancel knoppen
        this.showEditButtons();
        
        console.log('✅ Bewerkingsmodus ingeschakeld');
    }

    /**
     * ❌ Schakelt bewerkingsmodus uit
     * Herstelt alle velden naar originele waarden
     */
    disableEditMode() {
        console.log('❌ Bewerkingsmodus uitschakelen...');
        
        this.isEditMode = false;
        
        // Herstel alle velden naar originele waarden
        Object.keys(this.originalValues).forEach(fieldName => {
            const fieldContainer = document.querySelector(`[data-field="${fieldName}"]`);
            if (!fieldContainer) return;
            
            const displaySpan = fieldContainer.querySelector('.display-value');
            const editInput = fieldContainer.querySelector('.edit-input');
            
            if (displaySpan && editInput) {
                // Herstel originele waarde
                displaySpan.textContent = this.originalValues[fieldName];
                
                // Verberg input, toon span
                displaySpan.style.display = 'inline-block';
                editInput.style.display = 'none';
            }
        });
        
        // Verberg save/cancel knoppen
        this.hideEditButtons();
        
        // Reset change tracking
        this.changedFields.clear();
        
        console.log('✅ Bewerkingsmodus uitgeschakeld');
    }

    /**
     * 💾 Slaat wijzigingen op
     * Stuurt bijgewerkte gegevens naar de server
     */
    async saveChanges() {
        console.log('💾 Wijzigingen opslaan...');
        
        try {
            const updatedData = this.collectFormData();
            
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/organisator/update', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Update lokale data
            this.organisatorData = { ...this.organisatorData, ...updatedData };
            
            // Schakel bewerkingsmodus uit
            this.disableEditMode();
            
            // Toon succesmelding
            this.showSuccess('Organisator gegevens succesvol bijgewerkt');
            
            console.log('✅ Wijzigingen opgeslagen');
            
        } catch (error) {
            console.error('❌ Fout bij opslaan:', error);
            this.showError('Fout bij het opslaan van wijzigingen');
        }
    }

    /**
     * 📋 Verzamelt formulierdata voor opslaan
     * @returns {Object} Object met bijgewerkte gegevens
     */
    collectFormData() {
        const formData = {};
        
        // Verzamel alleen gewijzigde velden
        this.changedFields.forEach(fieldName => {
            const editInput = document.querySelector(`[data-field="${fieldName}"] .edit-input`);
            if (editInput) {
                // For virtual fields, get the current displayed value
                if (fieldName === 'verantwoordelijkheden') {
                    const displaySpan = document.querySelector(`[data-field="${fieldName}"] .display-value`);
                    if (displaySpan) {
                        formData[fieldName] = displaySpan.textContent;
                    }
                } else {
                    formData[fieldName] = editInput.value.trim();
                }
            }
        });
        
        console.log('📋 Verzamelde formulierdata:', formData);
        return formData;
    }

    /**
     * 📝 Volgt wijzigingen in input velden
     * @param {HTMLElement} input - Het input element dat gewijzigd is
     */
    trackChanges(input) {
        const fieldContainer = input.closest('[data-field]');
        if (!fieldContainer) return;
        
        const fieldName = fieldContainer.getAttribute('data-field');
        const originalValue = this.originalValues[fieldName];
        const currentValue = input.value.trim();
        
        if (currentValue !== originalValue) {
            this.changedFields.add(fieldName);
        } else {
            this.changedFields.delete(fieldName);
        }
        
        console.log('📝 Gewijzigde velden:', Array.from(this.changedFields));
    }

    /**
     * 🎛️ Toont edit knoppen (save/cancel)
     */
    showEditButtons() {
        const editButtons = document.querySelectorAll('.edit-btn');
        const saveButtons = document.querySelectorAll('.save-btn');
        const cancelButtons = document.querySelectorAll('.cancel-btn');
        
        editButtons.forEach(btn => btn.style.display = 'none');
        saveButtons.forEach(btn => btn.style.display = 'inline-block');
        cancelButtons.forEach(btn => btn.style.display = 'inline-block');
    }

    /**
     * 🎛️ Verbergt edit knoppen
     */
    hideEditButtons() {
        const editButtons = document.querySelectorAll('.edit-btn');
        const saveButtons = document.querySelectorAll('.save-btn');
        const cancelButtons = document.querySelectorAll('.cancel-btn');
        
        editButtons.forEach(btn => btn.style.display = 'inline-block');
        saveButtons.forEach(btn => btn.style.display = 'none');
        cancelButtons.forEach(btn => btn.style.display = 'none');
    }

    /**
     * 💾 Zet auto-save functionaliteit op
     * Slaat wijzigingen automatisch op bij verlaten van velden
     */
    setupAutoSave() {
        const editableInputs = document.querySelectorAll('.editable-field .edit-input');
        
        editableInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (this.isEditMode && this.changedFields.size > 0) {
                    // Auto-save na 2 seconden inactiviteit
                    setTimeout(() => {
                        if (this.changedFields.size > 0) {
                            this.saveChanges();
                        }
                    }, 2000);
                }
            });
        });
        
        console.log('💾 Auto-save functionaliteit ingesteld');
    }

    /**
     * ✅ Zet formulier validatie op
     * Valideert input velden in real-time
     */
    setupFormValidation() {
        const emailInput = document.querySelector('[data-field="email"] .edit-input');
        const telefoonInput = document.querySelector('[data-field="telefoon"] .edit-input');
        
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                this.validateEmail(emailInput);
            });
        }
        
        if (telefoonInput) {
            telefoonInput.addEventListener('input', () => {
                this.validateTelefoon(telefoonInput);
            });
        }
        
        console.log('✅ Formulier validatie ingesteld');
    }

    /**
     * 📧 Valideert e-mail formaat
     * @param {HTMLElement} input - E-mail input element
     */
    validateEmail(input) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            input.classList.add('invalid');
            this.showFieldError(input, 'Voer een geldig e-mailadres in');
        } else {
            input.classList.remove('invalid');
            this.clearFieldError(input);
        }
    }

    /**
     * 📞 Valideert telefoonnummer
     * @param {HTMLElement} input - Telefoon input element
     */
    validateTelefoon(input) {
        const telefoon = input.value.trim();
        const telefoonRegex = /^(\+32|0)[0-9]{8,9}$/;
        
        if (telefoon && !telefoonRegex.test(telefoon)) {
            input.classList.add('invalid');
            this.showFieldError(input, 'Voer een geldig Belgisch telefoonnummer in');
        } else {
            input.classList.remove('invalid');
            this.clearFieldError(input);
        }
    }

    /**
     * ❌ Toont veldspecifieke foutmelding
     * @param {HTMLElement} input - Input element
     * @param {string} message - Foutmelding
     */
    showFieldError(input, message) {
        let errorElement = input.parentNode.querySelector('.field-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            input.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * ✅ Wist veldspecifieke foutmelding
     * @param {HTMLElement} input - Input element
     */
    clearFieldError(input) {
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * ✅ Toont succesmelding
     * @param {string} message - Succesmelding
     */
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <span>✅ ${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animatie
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto verwijder
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * ❌ Toont foutmelding
     * @param {string} message - Foutmelding
     */
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <span>❌ ${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animatie
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto verwijder
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// 🚀 Initialiseer de manager wanneer de DOM geladen is
document.addEventListener('DOMContentLoaded', function() {
    console.log('👨‍💼 Organisator gegevens pagina laden...');
    
    // Check if init method exists
    if (typeof OrganisatorGegevensManager !== 'undefined') {
        window.organisatorManager = new OrganisatorGegevensManager();
    } else {
        console.error('❌ OrganisatorGegevensManager klasse niet gevonden');
    }
});

// Global functions voor HTML onclick events
window.enableEditMode = function() {
    if (window.organisatorManager) {
        window.organisatorManager.enableEditMode();
    }
};

window.disableEditMode = function() {
    if (window.organisatorManager) {
        window.organisatorManager.disableEditMode();
    }
};

window.saveChanges = function() {
    if (window.organisatorManager) {
        window.organisatorManager.saveChanges();
    }
};