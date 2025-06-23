/**
 * 🏢 gegevens-bedrijf.js - Bedrijf gegevens ophalen en weergeven
 * 
 * Dit bestand beheert de bedrijfsprofiel pagina:
 * - Ophalen van bedrijfsgegevens uit de database
 * - Dynamische weergave van bedrijfsinformatie
 * - Bewerkingsmodus voor bedrijfsgegevens
 * - Real-time updates en validatie
 * 
 * Features:
 * - Automatische data loading
 * - Inline editing van bedrijfsgegevens
 * - Form validatie
 * - Error handling
 * - Success notifications
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 */

/**
 * 🎯 BedrijfGegevensManager - Hoofdklasse voor bedrijfsgegevens beheer
 * Beheert alle interacties met bedrijfsdata en UI updates
 */
class BedrijfGegevensManager {
    constructor() {
        this.bedrijfData = null;
        this.isEditMode = false;
        this.originalValues = {};
        this.changedFields = new Set();
        
        console.log('🏢 BedrijfGegevensManager initialiseren...');
        this.init();
    }

    /**
     * 🚀 Initialiseert de manager
     * Zet event listeners op en laadt bedrijfsdata
     */
    async init() {
        try {
            await this.loadBedrijfData();
            this.setupEventListeners();
            this.setupAutoSave();
            this.setupFormValidation();
            console.log('✅ BedrijfGegevensManager geïnitialiseerd');
        } catch (error) {
            console.error('❌ Fout bij initialiseren:', error);
            this.showError('Fout bij het laden van bedrijfsgegevens');
        }
    }

    /**
     * 📡 Laadt bedrijfsgegevens van de server
     * Haalt alle relevante bedrijfsinformatie op
     */
    async loadBedrijfData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Geen authenticatietoken gevonden');
            }

            const response = await fetch('/api/bedrijf/gegevens', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.bedrijfData = await response.json();
            console.log('📊 Bedrijfsdata geladen:', this.bedrijfData);
            
            this.updateUI();
            this.showSuccess('Bedrijfsgegevens succesvol geladen');
            
        } catch (error) {
            console.error('❌ Fout bij laden bedrijfsdata:', error);
            throw error;
        }
    }

    /**
     * 🎨 Werkt de UI bij met bedrijfsgegevens
     * Vult alle velden in met de opgehaalde data
     */
    updateUI() {
        if (!this.bedrijfData) {
            console.warn('⚠️ Geen bedrijfsdata beschikbaar voor UI update');
            return;
        }

        // Update basis bedrijfsgegevens
        this.updateField('naam', this.bedrijfData.naam || 'Niet ingevuld');
        this.updateField('sector', this.bedrijfData.sector || 'Niet ingevuld');
        this.updateField('gemeente', this.bedrijfData.gemeente || 'Niet ingevuld');
        this.updateField('telefoon', this.bedrijfData.telefoon || 'Niet ingevuld');
        this.updateField('email', this.bedrijfData.email || 'Niet ingevuld');
        this.updateField('website', this.bedrijfData.website || 'Niet ingevuld');
        this.updateField('beschrijving', this.bedrijfData.beschrijving || 'Niet ingevuld');

        // Update account informatie (niet bewerkbaar)
        this.updateField('bedrijfsnummer', this.bedrijfData.id || 'N/A');
        this.updateField('account-status', 'Actief');
        this.updateField('last-login', 'Vandaag');
        this.updateField('registratie-datum', this.formatDate(this.bedrijfData.createdAt) || 'Onbekend');

        // Update verantwoordelijkheden
        this.updateField('verantwoordelijkheden', 'Bedrijfsbeheer, Projectbeheer, Communicatie');

        // Update pagina titel
        const pageTitle = document.querySelector('title');
        if (pageTitle && this.bedrijfData.naam) {
            pageTitle.textContent = `Bedrijfsprofiel - ${this.bedrijfData.naam}`;
        }

        console.log('🎨 UI bijgewerkt met bedrijfsgegevens');
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
            displaySpan.textContent = value;
        }
        
        if (editInput) {
            // Handle verschillende veldtypes
            if (editInput.tagName === 'TEXTAREA') {
                editInput.value = value;
            } else if (editInput.type === 'email') {
                editInput.value = value;
            } else {
                editInput.value = value;
            }
        }
    }

    /**
     * 📅 Formatteert een datum naar leesbaar formaat
     * @param {string} dateString - Datum string om te formatteren
     * @returns {string} Geformatteerde datum
     */
    formatDate(dateString) {
        if (!dateString) return 'Onbekend';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('nl-BE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.warn('⚠️ Fout bij formatteren datum:', dateString);
            return 'Onbekend';
        }
    }

    /**
     * 🔗 Valideert of een string een geldige URL is
     * @param {string} string - String om te valideren
     * @returns {boolean} Of de string een geldige URL is
     */
    isValidUrl(string) {
        // Deze functie behouden voor algemene URL validatie indien nodig in de toekomst
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
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
        
        // Definieer hier expliciet welke velden voor een bedrijf bewerkbaar zijn
        const editableFields = [
            'naam', 'sector', 'gemeente', 'telefoon', 'email', 'website', 'beschrijving'
        ];
        
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
                editInput.style.display = (editInput.tagName === 'TEXTAREA' ? 'block' : 'inline-block'); // Voor textarea, gebruik 'block'
                editInput.focus(); // Styling consistentie
                
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
            const response = await fetch('/api/bedrijf/update', {
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
            this.bedrijfData = { ...this.bedrijfData, ...updatedData };
            
            // Schakel bewerkingsmodus uit
            this.disableEditMode();
            
            // Toon succesmelding
            this.showSuccess('Bedrijfsgegevens succesvol bijgewerkt');
            
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
                formData[fieldName] = editInput.value.trim();
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
        const websiteInput = document.querySelector('[data-field="website"] .edit-input');
        
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                this.validateEmail(emailInput);
            });
        }
        
        if (websiteInput) {
            websiteInput.addEventListener('input', () => {
                this.validateWebsite(websiteInput);
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
     * 🌐 Valideert website URL
     * @param {HTMLElement} input - Website input element
     */
    validateWebsite(input) {
        const website = input.value.trim();
        
        if (website && !this.isValidUrl(website)) {
            input.classList.add('invalid');
            this.showFieldError(input, 'Voer een geldige URL in');
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
    console.log('🏢 Bedrijf gegevens pagina laden...');
    
    // Controleer of init methode bestaat
    if (typeof BedrijfGegevensManager !== 'undefined') {
        window.bedrijfManager = new BedrijfGegevensManager();
    } else {
        console.error('❌ BedrijfGegevensManager klasse niet gevonden');
    }
});

// Export voor module gebruik
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BedrijfGegevensManager;
}