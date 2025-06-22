import { ReservatieService } from '../reservatieService.js';

console.log("✅ gesprekkenBedrijf.js geladen");

const EVENT_DATE_STRING_GESPREKKEN = '2025-06-25'; // De vaste datum van het evenement

// --- DOM ELEMENTEN ---
const DOMElements = {
    aangevraagdTable: null,
    ontvangenTable: null,
    loadingIndicator: null,
    init: function() {
        this.aangevraagdTable = document.getElementById('bedrijfGesprekkenAangevraagd');
        this.ontvangenTable = document.getElementById('bedrijfGesprekkenOntvangen');
        this.loadingIndicator = document.getElementById('loadingBedrijfGesprekken');
    }
};

let rejectModal, redenWeigeringInput, confirmRejectBtn, cancelRejectBtn;
let pendingRejectReservationId = null;

function openRejectModal(reservatieId) {
  pendingRejectReservationId = reservatieId;
  if (!rejectModal) rejectModal = document.getElementById('rejectModal');
  if (!redenWeigeringInput) redenWeigeringInput = document.getElementById('redenWeigering');
  if (!confirmRejectBtn) confirmRejectBtn = document.getElementById('confirmRejectBtn');
  if (!cancelRejectBtn) cancelRejectBtn = document.getElementById('cancelRejectBtn');
  if (redenWeigeringInput) redenWeigeringInput.value = '';
  if (rejectModal) rejectModal.style.display = 'flex';
}

function closeRejectModal() {
  if (rejectModal) rejectModal.style.display = 'none';
  pendingRejectReservationId = null;
  if (redenWeigeringInput) redenWeigeringInput.value = '';
}

// Modal overlay system
class ModalOverlay {
    static createModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-actions">
                    ${actions.map(action => `
                        <button class="modal-btn ${action.class || ''}" onclick="${action.onclick}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        return modal;
    }

    static showConfirmModal(title, message, onConfirm, onCancel = null) {
        const modal = this.createModal(title, `
            <p>${message}</p>
        `, [
            {
                text: 'Annuleren',
                class: 'modal-btn-secondary',
                onclick: `this.closest('.modal-overlay').remove(); ${onCancel ? onCancel() : ''}`
            },
            {
                text: 'Bevestigen',
                class: 'modal-btn-primary',
                onclick: `this.closest('.modal-overlay').remove(); ${onConfirm}`
            }
        ]);
        document.body.appendChild(modal);
    }

    static showInputModal(title, message, placeholder, onConfirm, onCancel = null) {
        const inputId = 'modal-input-' + Date.now();
        const modal = this.createModal(title, `
            <p>${message}</p>
            <textarea id="${inputId}" placeholder="${placeholder}" rows="4"></textarea>
        `, [
            {
                text: 'Annuleren',
                class: 'modal-btn-secondary',
                onclick: `this.closest('.modal-overlay').remove(); ${onCancel ? onCancel() : ''}`
            },
            {
                text: 'Bevestigen',
                class: 'modal-btn-primary',
                onclick: `this.closest('.modal-overlay').remove(); ${onConfirm}`
            }
        ]);
        document.body.appendChild(modal);
        return inputId;
    }

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
                onclick: 'this.closest(".modal-overlay").remove(); location.reload();'
            }
        ]);
        document.body.appendChild(modal);
    }

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
                onclick: 'this.closest(".modal-overlay").remove();'
            }
        ]);
        document.body.appendChild(modal);
    }
}

// Notification system
class NotificationSystem {
    static show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
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

// Main conversation manager
class CompanyConversationManager {
    constructor() {
        this.reservations = [];
        this.init();
    }

    async init() {
        try {
            console.log('🚀 [DEBUG] Initializing company conversation manager...');
            
            // Initialize DOM elements first
            DOMElements.init();
            console.log('🎯 [DEBUG] Company DOM elements initialized:', {
                aangevraagdTable: !!DOMElements.aangevraagdTable,
                ontvangenTable: !!DOMElements.ontvangenTable,
                loadingIndicator: !!DOMElements.loadingIndicator
            });
            
            await this.loadReservations();
            this.setupEventListeners();
            
            console.log('✅ [DEBUG] Company conversation manager initialized successfully');
        } catch (error) {
            console.error('Error initializing company conversation manager:', error);
            NotificationSystem.show('Er is een fout opgetreden bij het laden van de gesprekken.', 'error');
        }
    }

    async loadReservations() {
        try {
            this.reservations = await ReservatieService.getCompanyReservations();
            this.renderReservations();
        } catch (error) {
            console.error('Error loading reservations:', error);
            NotificationSystem.show('Kon gesprekken niet laden. Probeer het later opnieuw.', 'error');
        }
    }

    renderReservations() {
        // Containers
        const aangevraagdContainer = DOMElements.aangevraagdTable;
        const ontvangenContainer = DOMElements.ontvangenTable;
        const loadingIndicator = DOMElements.loadingIndicator;

        // Reset loading
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (aangevraagdContainer) {
            // Verwijder oude rijen behalve de header
            aangevraagdContainer.querySelectorAll('.gesprekkenTableRow, .lege-rij').forEach(el => el.remove());
        }
        if (ontvangenContainer) {
            ontvangenContainer.querySelectorAll('.gesprekkenTableRow, .lege-rij').forEach(el => el.remove());
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
        const requestedByMe = this.reservations.filter(r => r.aangevraagdDoor === 'bedrijf');
        const receivedByMe = this.reservations.filter(r => r.aangevraagdDoor === 'student');

        // Aangevraagd door jou
        if (aangevraagdContainer) {
            if (requestedByMe.length === 0) {
                const leeg = document.createElement('div');
                leeg.className = 'lege-rij';
                leeg.innerHTML = `<i class="fas fa-inbox" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i><h3>Geen gesprekken gevonden</h3><p>Je hebt nog geen gesprekken aangevraagd.</p>`;
                aangevraagdContainer.appendChild(leeg);
            } else {
                requestedByMe.forEach(reservation => {
                    aangevraagdContainer.insertAdjacentHTML('beforeend', this.renderReservationRow(reservation));
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
                receivedByMe.forEach(reservation => {
                    ontvangenContainer.insertAdjacentHTML('beforeend', this.renderReservationRow(reservation));
                });
            }
        }
    }

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

        // Debug logging voor tafelnr
        console.log('🔍 [DEBUG] Company reservation data:', {
            afspraakId: reservation.afspraakId || reservation.id,
            studentNaam: reservation.studentNaam,
            tafelNr: reservation.tafelNr,
            studentTafelNr: reservation.studentTafelNr,
            status: reservation.status,
            aangevraagdDoor: reservation.aangevraagdDoor
        });

        // Gebruik studentTafelNr als tafelNr niet bestaat
        const tafelNr = reservation.tafelNr || reservation.studentTafelNr || 'N/A';

        return `
            <div class="gesprekkenTableRow" data-id="${reservation.afspraakId || reservation.id}">
                <div class="naamCel">${reservation.studentNaam || 'Onbekende student'}</div>
                <div class="locatieCel">Tafel ${tafelNr}</div>
                <div class="tijdslotCel">${startTime} - ${endTime}</div>
                <div class="statusCel ${statusClass}">${statusText}</div>
                <div class="gesprekkenActions">
                    ${actions}
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'aangevraagd': 'Aangevraagd',
            'bevestigd': 'Bevestigd',
            'geweigerd': 'Geweigerd',
            'geannuleerd': 'Geannuleerd'
        };
        return statusMap[status] || status;
    }

    getActionsForReservation(reservation) {
        const actions = [];
        const reservationId = reservation.afspraakId || reservation.id;

        // Debug logging voor actions
        console.log('🔧 [DEBUG] Generating company actions for reservation:', {
            id: reservationId,
            status: reservation.status,
            aangevraagdDoor: reservation.aangevraagdDoor
        });

        switch (reservation.status) {
            case 'aangevraagd':
                if (reservation.aangevraagdDoor === 'bedrijf') {
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

        console.log('🔧 [DEBUG] Generated company actions:', actions);
        return actions.join('');
    }

    setupEventListeners() {
        console.log('🎯 [DEBUG] Setting up company event listeners...');
        
        // Event delegation for action buttons
        document.addEventListener('click', (event) => {
            console.log('🎯 [DEBUG] Company click event detected:', {
                target: event.target,
                targetClass: event.target.className,
                closestButton: event.target.closest('.actieBtn')
            });
            
            const button = event.target.closest('.actieBtn');
            if (!button) {
                console.log('🎯 [DEBUG] No .actieBtn found in company click path');
                return;
            }

            const action = button.getAttribute('data-action');
            const reservationId = button.getAttribute('data-reservation-id');
            
            console.log('🎯 [DEBUG] Company button clicked:', {
                action: action,
                reservationId: reservationId,
                buttonClass: button.className
            });
            
            if (!action || !reservationId) {
                console.log('🎯 [DEBUG] Missing action or reservationId in company view');
                return;
            }

            // Prevent multiple clicks
            if (button.disabled) {
                console.log('🎯 [DEBUG] Company button is disabled, ignoring click');
                return;
            }
            button.disabled = true;

            try {
                console.log('🎯 [DEBUG] Executing company action:', action);
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
                        console.log('🎯 [DEBUG] Unknown company action:', action);
                }
            } catch (error) {
                console.error('Error handling company button action:', error);
                ModalOverlay.showErrorModal('Er is een fout opgetreden.');
            } finally {
                // Re-enable button after a short delay
                setTimeout(() => {
                    button.disabled = false;
                }, 1000);
            }
        });
        
        console.log('🎯 [DEBUG] Company event listeners setup complete');
    }

    // Action methods
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

// Initialize when DOM is loaded
let companyConversationManager;

document.addEventListener('DOMContentLoaded', () => {
    companyConversationManager = new CompanyConversationManager();
});

// Make it available globally
window.companyConversationManager = companyConversationManager; 