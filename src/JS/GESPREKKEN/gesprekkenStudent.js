/**
 * @fileoverview Dit script beheert de "Mijn Gesprekken" pagina voor een ingelogde student.
 * Het is functioneel vergelijkbaar met `gesprekkenBedrijf.js`, maar is toegespitst op de studentrol.
 * Het haalt reserveringen op, toont ze gesplitst als 'aangevraagd' en 'ontvangen',
 * en handelt alle gebruikersinteracties af.
 *
 * @version 1.0
 * @author [Jouw Naam/Team]
 */

const { ReservatieService } = window;

// --- GLOBAAL & CONFIGURATIE ---
const currentUser = { id: null, type: 'student' }; // Statisch voor dit script
let lastCancelledMeeting = null; // Voor de 'undo' functionaliteit

// --- DOM ELEMENTEN ---
/**
 * @namespace DOMElements
 * @description Bevat verwijzingen naar de belangrijkste DOM-elementen die door het script worden gebruikt.
 */
const DOMElements = {
    aangevraagdTable: null,
    ontvangenTable: null,
    loadingIndicator: null,
    init: function() {
        this.aangevraagdTable = document.getElementById('studentGesprekkenAangevraagd');
        this.ontvangenTable = document.getElementById('studentGesprekkenOntvangen');
        this.loadingIndicator = document.getElementById('loadingStudentGesprekken');
    }
};

// --- DIALOOG & NOTIFICATIE HELPERS ---
/**
 * @namespace UI
 * @description Een verzameling van UI-hulpfuncties voor het tonen van laadindicatoren,
 * notificaties en het afhandelen van bevestigingsdialogen.
 */
const UI = {
    /** Toont of verbergt de laadindicator. */
    showLoading: (show) => {
        if (DOMElements.loadingIndicator) DOMElements.loadingIndicator.style.display = show ? 'block' : 'none';
    },
    showNotification: (message, type = 'info') => {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] Notification: ${message}`);
        }
    },
    confirm: async (title, message) => {
        return new Promise((resolve) => {
            ModalOverlay.showConfirmModal(
                title,
                message,
                () => resolve(true),
                () => resolve(false)
            );
        });
    },
    showUndo: (message, onUndo) => {
        // Gebruik de bestaande `showUndoNotification` logica of een fallback
        if (window.showUndoNotification) {
             window.showUndoNotification({ message, onUndo });
        } else {
            UI.showNotification(`${message} (Undo niet beschikbaar)`, 'info');
        }
    }
};

/**
 * @class ModalOverlay
 * @classdesc Een herbruikbare klasse voor het creëren en beheren van modale vensters (dialogen).
 * Biedt methoden voor het tonen van bevestigings-, input-, succes- en foutdialogen.
 */
class ModalOverlay {
    /**
     * Creëert de basis HTML-structuur voor een modal.
     * @param {string} title - De titel van de modal.
     * @param {string} content - De HTML-inhoud voor de body van de modal.
     * @param {Array<object>} actions - Een array van actie-objecten voor de knoppen.
     * @returns {HTMLElement} Het gecreëerde modal-element.
     */
    static createModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-actions">
                    ${actions.map((action, index) => `
                        <button class="modal-btn ${action.class || ''}" data-action-index="${index}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners after creating the modal
        this.addModalEventListeners(modal, actions);
        
        return modal;
    }

    /**
     * Voegt event listeners toe aan de knoppen van een modal.
     * @param {HTMLElement} modal - Het modal-element.
     * @param {Array<object>} actions - De array met actie-objecten.
     * @private
     */
    static addModalEventListeners(modal, actions) {
        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }

        // Action buttons
        actions.forEach((action, index) => {
            const btn = modal.querySelector(`[data-action-index="${index}"]`);
            if (btn && action.handler) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    action.handler(modal);
                });
            }
        });
    }

    /**
     * Toont een bevestigingsdialoog met "Bevestigen" en "Annuleren" knoppen.
     * @param {string} title - De titel van de modal.
     * @param {string} message - De boodschap om weer te geven.
     * @param {function} onConfirm - Callback-functie die wordt uitgevoerd bij bevestiging.
     * @param {?function} onCancel - Optionele callback-functie bij annulering.
     */
    static showConfirmModal(title, message, onConfirm, onCancel = null) {
        const modal = this.createModal(title, `
            <p>${message}</p>
        `, [
            {
                text: 'Annuleren',
                class: 'modal-btn-secondary',
                handler: (modal) => {
                    modal.remove();
                    if (onCancel) onCancel();
                }
            },
            {
                text: 'Bevestigen',
                class: 'modal-btn-primary',
                handler: (modal) => {
                    modal.remove();
                    onConfirm();
                }
            }
        ]);
        document.body.appendChild(modal);
    }

    /**
     * Toont een dialoog met een inputveld (textarea).
     * @param {string} title - De titel van de modal.
     * @param {string} message - De boodschap om weer te geven.
     * @param {string} placeholder - De placeholder-tekst voor het inputveld.
     * @param {function(string)} onConfirm - Callback die de ingevoerde waarde ontvangt.
     * @param {?function} onCancel - Optionele callback-functie bij annulering.
     * @returns {string} Het ID van het gecreëerde inputveld.
     */
    static showInputModal(title, message, placeholder, onConfirm, onCancel = null) {
        const inputId = 'modal-input-' + Date.now();
        const modal = this.createModal(title, `
            <p>${message}</p>
            <textarea id="${inputId}" placeholder="${placeholder}" rows="4"></textarea>
        `, [
            {
                text: 'Annuleren',
                class: 'modal-btn-secondary',
                handler: (modal) => {
                    modal.remove();
                    if (onCancel) onCancel();
                }
            },
            {
                text: 'Bevestigen',
                class: 'modal-btn-primary',
                handler: (modal) => {
                    const input = document.getElementById(inputId);
                    const value = input ? input.value : '';
                    modal.remove();
                    onConfirm(value);
                }
            }
        ]);
        document.body.appendChild(modal);
        
        // Focus op het input veld
        setTimeout(() => {
            const input = document.getElementById(inputId);
            if (input) input.focus();
        }, 100);
        
        return inputId;
    }

    /**
     * Toont een succesdialoog.
     * @param {string} message - De succesboodschap.
     */
    static showSuccessModal(message) {
        const modal = this.createModal('Succes!', `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
                <p>${message}</p>
            </div>
        `, [
            {
                text: 'OK',
                class: 'modal-btn-primary',
                handler: (modal) => {
                    modal.remove();
                }
            }
        ]);
        document.body.appendChild(modal);
    }

    /**
     * Toont een foutdialoog.
     * @param {string} message - De foutboodschap.
     */
    static showErrorModal(message) {
        const modal = this.createModal('Fout!', `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <p>${message}</p>
            </div>
        `, [
            {
                text: 'OK',
                class: 'modal-btn-primary',
                handler: (modal) => {
                    modal.remove();
                }
            }
        ]);
        document.body.appendChild(modal);
    }
}

/**
 * @class NotificationSystem
 * @classdesc Een eenvoudige klasse voor het tonen van niet-blokkerende notificaties.
 */
class NotificationSystem {
    /**
     * Toont een notificatie.
     * @param {string} message - De boodschap om te tonen.
     * @param {string} [type='info'] - Het type notificatie ('info', 'success', 'error').
     */
    static show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add event listener to close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        // Add to page
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

/**
 * @class StudentConversationManager
 * @classdesc Hoofdklasse voor het beheer van de gesprekkenpagina voor studenten.
 */
class StudentConversationManager {
    constructor() {
        this.reservations = [];
        this.init();
    }

    /**
     * Initialiseert de manager: laadt data en stelt event listeners in.
     * @async
     */
    async init() {
        try {
            // Initialize DOM elements first
            DOMElements.init();
            
            await this.loadReservations();
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ [DEBUG] Error initializing student conversation manager:', error);
        }
    }

    /**
     * Laadt de reserveringen via de ReservatieService en rendert deze.
     * @async
     */
    async loadReservations() {
        try {
            this.reservations = await ReservatieService.getMyReservations();
            this.renderReservations();
        } catch (error) {
            console.error('❌ [DEBUG] Error loading reservations:', error);
            NotificationSystem.show('Kon gesprekken niet laden. Probeer het later opnieuw.', 'error');
        }
    }

    /**
     * Rendert de geladen reserveringen in de juiste tabellen ('aangevraagd' en 'ontvangen').
     */
    renderReservations() {
        // Containers
        const aangevraagdContainer = DOMElements.aangevraagdTable;
        const ontvangenContainer = DOMElements.ontvangenTable;
        const loadingIndicator = DOMElements.loadingIndicator;

        // Reset loading
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (aangevraagdContainer) {
            // Verwijder oude rijen behalve de header
            const oldRows = aangevraagdContainer.querySelectorAll('.gesprekkenTableRow, .lege-rij');
            oldRows.forEach(el => el.remove());
        }
        if (ontvangenContainer) {
            const oldRows = ontvangenContainer.querySelectorAll('.gesprekkenTableRow, .lege-rij');
            oldRows.forEach(el => el.remove());
        }

        if (!this.reservations || this.reservations.length === 0) {
            // Geen gesprekken
            if (aangevraagdContainer) {
                const leeg = document.createElement('div');
                leeg.className = 'lege-rij';
                leeg.innerHTML = `<i class="fas fa-inbox" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i><h3>Geen gesprekken gevonden</h3><p>Je hebt nog geen gesprekken aangevraagd.</p>`;
                aangevraagdContainer.appendChild(leeg);
            }
            if (ontvangenContainer) {
                const leeg = document.createElement('div');
                leeg.className = 'lege-rij';
                leeg.innerHTML = `<i class="fas fa-inbox" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i><h3>Geen gesprekken gevonden</h3><p>Je hebt nog geen gesprekken ontvangen.</p>`;
                ontvangenContainer.appendChild(leeg);
            }
            return;
        }

        // Split reservations by type
        const requestedByMe = this.reservations.filter(r => r.aangevraagdDoor === 'student');
        const receivedByMe = this.reservations.filter(r => r.aangevraagdDoor === 'bedrijf');

        // Aangevraagd door jou
        if (aangevraagdContainer) {
            if (requestedByMe.length === 0) {
                const leeg = document.createElement('div');
                leeg.className = 'lege-rij';
                leeg.innerHTML = `<i class="fas fa-inbox" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i><h3>Geen gesprekken gevonden</h3><p>Je hebt nog geen gesprekken aangevraagd.</p>`;
                aangevraagdContainer.appendChild(leeg);
            } else {
                requestedByMe.forEach((reservation, index) => {
                    const rowHtml = this.renderReservationRow(reservation);
                    aangevraagdContainer.insertAdjacentHTML('beforeend', rowHtml);
                });
            }
        }

        // Ontvangen
        if (ontvangenContainer) {
            if (receivedByMe.length === 0) {
                const leeg = document.createElement('div');
                leeg.className = 'lege-rij';
                leeg.innerHTML = `<i class="fas fa-inbox" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i><h3>Geen gesprekken gevonden</h3><p>Je hebt nog geen gesprekken ontvangen.</p>`;
                ontvangenContainer.appendChild(leeg);
            } else {
                receivedByMe.forEach((reservation, index) => {
                    const rowHtml = this.renderReservationRow(reservation);
                    ontvangenContainer.insertAdjacentHTML('beforeend', rowHtml);
                });
            }
        }
    }

    /**
     * Genereert de HTML voor een enkele reserveringsrij.
     * @param {object} reservation - Het reserveringsobject.
     * @returns {string} De HTML-string voor de tabelrij.
     */
    renderReservationRow(reservation) {
        const startTime = new Date(reservation.startTijd).toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const endTime = new Date(reservation.eindTijd).toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const statusClass = `status-${reservation.status}`;
        const statusText = this.getStatusText(reservation.status);

        const actions = this.getActionsForReservation(reservation);

        // Gebruik bedrijfTafelNr als tafelNr niet bestaat
        const tafelNr = reservation.tafelNr || reservation.bedrijfTafelNr || 'N/A';

        const rowHtml = `
            <div class="gesprekkenTableRow" data-id="${reservation.afspraakId || reservation.id}">
                <div class="naamCel">${reservation.bedrijfNaam || 'Onbekend bedrijf'}</div>
                <div class="locatieCel">Tafel ${tafelNr}</div>
                <div class="tijdslotCel">${startTime} - ${endTime}</div>
                <div class="statusCel ${statusClass}">${statusText}</div>
                <div class="gesprekkenActions">
                    ${actions}
                </div>
            </div>
        `;
        
        return rowHtml;
    }

    /**
     * Vertaalt een status-string naar een leesbare tekst.
     * @param {string} status - De status van de reservering.
     * @returns {string} De leesbare status.
     */
    getStatusText(status) {
        const statusMap = {
            'aangevraagd': 'Aangevraagd',
            'bevestigd': 'Bevestigd',
            'geweigerd': 'Geweigerd',
            'geannuleerd': 'Geannuleerd'
        };
        return statusMap[status] || status;
    }

    /**
     * Genereert de juiste actieknoppen op basis van de status en aanvrager van de reservering.
     * @param {object} reservation - Het reserveringsobject.
     * @returns {string} Een HTML-string met de actieknoppen.
     */
    getActionsForReservation(reservation) {
        const actions = [];
        const reservationId = reservation.afspraakId || reservation.id;

        switch (reservation.status) {
            case 'aangevraagd':
                if (reservation.aangevraagdDoor === 'student') {
                    actions.push(`
                        <button class="actieBtn annuleerBtn" data-action="cancel" data-reservation-id="${reservationId}">
                            <i class="fas fa-times"></i> Annuleren
                        </button>
                    `);
                } else {
                    actions.push(`
                        <button class="actieBtn accepteerBtn" data-action="accept" data-reservation-id="${reservationId}">
                            <i class="fas fa-check"></i> Accepteren
                        </button>
                        <button class="actieBtn weigerBtn" data-action="reject" data-reservation-id="${reservationId}">
                            <i class="fas fa-times"></i> Weigeren
                        </button>
                    `);
                }
                break;

            case 'bevestigd':
                actions.push(`
                    <button class="actieBtn annuleerBtn" data-action="cancel" data-reservation-id="${reservationId}">
                        <i class="fas fa-times"></i> Annuleren
                    </button>
                `);
                break;

            case 'geweigerd':
            case 'geannuleerd':
                actions.push(`
                    <button class="actieBtn herstelBtn" data-action="restore" data-reservation-id="${reservationId}">
                        <i class="fas fa-undo"></i> Herstellen
                    </button>
                    <button class="actieBtn verwijderBtn" data-action="delete" data-reservation-id="${reservationId}">
                        <i class="fas fa-trash"></i> Verwijderen
                    </button>
                `);
                break;
        }

        return actions.join('');
    }

    /**
     * Stelt een overkoepelende event listener in (event delegation) voor alle actieknoppen.
     */
    setupEventListeners() {
        // Event delegation for action buttons
        document.addEventListener('click', (event) => {
            const button = event.target.closest('.actieBtn');
            if (!button) {
                return;
            }

            const action = button.getAttribute('data-action');
            const reservationId = button.getAttribute('data-reservation-id');
            
            if (!action || !reservationId) {
                return;
            }

            // Prevent multiple clicks
            if (button.disabled) {
                return;
            }
            button.disabled = true;

            try {
                switch (action) {
                    case 'accept':
                        this.acceptReservation(reservationId);
                        break;
                    case 'reject':
                        this.rejectReservation(reservationId);
                        break;
                    case 'cancel':
                        this.cancelReservation(reservationId);
                        break;
                    case 'delete':
                        this.deleteReservation(reservationId);
                        break;
                    case 'restore':
                        this.restoreReservation(reservationId);
                        break;
                    default:
                }
            } catch (error) {
                ModalOverlay.showErrorModal('Er is een fout opgetreden.');
            } finally {
                // Re-enable button after a short delay
                setTimeout(() => {
                    button.disabled = false;
                }, 1000);
            }
        });
    }

    // --- ACTIE METHODES ---

    /**
     * Start het proces voor het accepteren van een reservering.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     */
    async acceptReservation(reservationId) {
        try {
            ModalOverlay.showConfirmModal(
                'Gesprek accepteren',
                'Weet je zeker dat je dit gesprek wilt accepteren?',
                () => this.performAcceptReservation(reservationId)
            );
        } catch (error) {
            console.error('Error showing accept modal:', error);
        }
    }

    /**
     * Voert de API-call uit om een reservering te accepteren.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     * @private
     */
    async performAcceptReservation(reservationId) {
        try {
            const result = await ReservatieService.acceptReservation(reservationId);
            if (result.success) {
                ModalOverlay.showSuccessModal('Gesprek succesvol geaccepteerd!');
                await this.loadReservations(); // Reload data
            } else {
                ModalOverlay.showErrorModal(result.message || 'Er is een fout opgetreden.');
            }
        } catch (error) {
            console.error('Error accepting reservation:', error);
            ModalOverlay.showErrorModal('Er is een fout opgetreden bij het accepteren van het gesprek.');
        }
    }

    /**
     * Start het proces voor het weigeren van een reservering.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     */
    async rejectReservation(reservationId) {
        try {
            ModalOverlay.showInputModal(
                'Gesprek weigeren',
                'Geef een reden op voor het weigeren van dit gesprek (optioneel):',
                'Reden voor weigering...',
                (reason) => this.performRejectReservation(reservationId, reason)
            );
        } catch (error) {
            console.error('Error showing reject modal:', error);
        }
    }

    /**
     * Voert de API-call uit om een reservering te weigeren.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @param {string} reason - De reden voor de weigering.
     * @async
     * @private
     */
    async performRejectReservation(reservationId, reason) {
        try {
            const result = await ReservatieService.rejectReservation(reservationId, reason);
            if (result.success) {
                ModalOverlay.showSuccessModal('Gesprek succesvol geweigerd.');
                await this.loadReservations(); // Reload data
            } else {
                ModalOverlay.showErrorModal(result.message || 'Er is een fout opgetreden.');
            }
        } catch (error) {
            console.error('Error rejecting reservation:', error);
            ModalOverlay.showErrorModal('Er is een fout opgetreden bij het weigeren van het gesprek.');
        }
    }

    /**
     * Start het proces voor het annuleren van een reservering.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     */
    async cancelReservation(reservationId) {
        try {
            ModalOverlay.showConfirmModal(
                'Gesprek annuleren',
                'Weet je zeker dat je dit gesprek wilt annuleren?',
                () => this.performCancelReservation(reservationId)
            );
        } catch (error) {
            console.error('Error showing cancel modal:', error);
        }
    }

    /**
     * Voert de API-call uit om een reservering te annuleren.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     * @private
     */
    async performCancelReservation(reservationId) {
        try {
            const result = await ReservatieService.cancelReservation(reservationId);
            if (result.success) {
                ModalOverlay.showSuccessModal('Gesprek succesvol geannuleerd.');
                await this.loadReservations(); // Reload data
            } else {
                ModalOverlay.showErrorModal(result.message || 'Er is een fout opgetreden.');
            }
        } catch (error) {
            console.error('Error canceling reservation:', error);
            ModalOverlay.showErrorModal('Er is een fout opgetreden bij het annuleren van het gesprek.');
        }
    }

    /**
     * Start het proces voor het definitief verwijderen van een reservering.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     */
    async deleteReservation(reservationId) {
        try {
            ModalOverlay.showConfirmModal(
                'Gesprek verwijderen',
                'Weet je zeker dat je dit gesprek definitief wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
                () => this.performDeleteReservation(reservationId)
            );
        } catch (error) {
            console.error('Error showing delete modal:', error);
        }
    }

    /**
     * Voert de API-call uit om een reservering te verwijderen.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     * @private
     */
    async performDeleteReservation(reservationId) {
        try {
            const result = await ReservatieService.deleteReservation(reservationId);
            if (result.success) {
                ModalOverlay.showSuccessModal('Gesprek succesvol verwijderd.');
                await this.loadReservations(); // Reload data
            } else {
                ModalOverlay.showErrorModal(result.message || 'Er is een fout opgetreden.');
            }
        } catch (error) {
            console.error('Error deleting reservation:', error);
            ModalOverlay.showErrorModal('Er is een fout opgetreden bij het verwijderen van het gesprek.');
        }
    }

    /**
     * Herstelt een recent geannuleerde of geweigerde reservering.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     */
    async restoreReservation(reservationId) {
        try {
            ModalOverlay.showConfirmModal(
                'Gesprek herstellen',
                'Weet je zeker dat je dit gesprek wilt herstellen? Het wordt opnieuw aangevraagd.',
                () => this.performRestoreReservation(reservationId)
            );
        } catch (error) {
            console.error('Error showing restore modal:', error);
        }
    }

    /**
     * Voert de API-call uit om een reservering te herstellen.
     * @param {string|number} reservationId - Het ID van de reservering.
     * @async
     * @private
     */
    async performRestoreReservation(reservationId) {
        try {
            const result = await ReservatieService.restoreReservation(reservationId);
            if (result.success) {
                ModalOverlay.showSuccessModal('Gesprek succesvol hersteld.');
                await this.loadReservations(); // Reload data
            } else {
                ModalOverlay.showErrorModal(result.message || 'Er is een fout opgetreden.');
            }
        } catch (error) {
            console.error('Error restoring reservation:', error);
            ModalOverlay.showErrorModal('Er is een fout opgetreden bij het herstellen van het gesprek.');
        }
    }
}

// Initialiseer de manager wanneer de DOM geladen is.
let studentConversationManager;

document.addEventListener("DOMContentLoaded", () => {
    DOMElements.init();
    studentConversationManager = new StudentConversationManager();
    // Probeer de huidige gebruiker op te halen
    const userInfo = JSON.parse(localStorage.getItem('user'));
    if (userInfo && userInfo.studentnummer) {
        currentUser.id = userInfo.studentnummer;
    }

    studentConversationManager.loadReservations();
    
    // Fallback voor undo-notificatie
    if (!window.showUndoNotification) {
        window.showUndoNotification = ({ message, onUndo }) => {
            const container = document.getElementById('notification-container') || (() => {
                const c = document.createElement('div');
                c.id = 'notification-container';
                document.body.appendChild(c);
                return c;
            })();
            const notif = document.createElement('div');
            notif.className = 'notification info show';
            const undoButton = document.createElement('button');
            undoButton.textContent = 'Herstel';
            undoButton.onclick = () => { onUndo(); notif.remove(); };
            notif.textContent = message;
            notif.appendChild(undoButton);
            container.appendChild(notif);
            setTimeout(() => notif.remove(), 5000);
        };
    }
}); 