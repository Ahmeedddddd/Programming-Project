/**
 * 🏢 gesprekkenBedrijf.js - Gesprekken beheer voor bedrijven
 * 
 * Dit bestand beheert alle gesprekken en afspraken voor bedrijven:
 * - Overzicht van alle gesprekken (aangevraagd en ontvangen)
 * - Bevestigen/afwijzen van gespreksverzoeken
 * - Annuleren van bestaande afspraken
 * - Real-time updates en notificaties
 * 
 * Features:
 * - Dynamische gesprekkenlijst
 * - Status management (pending, confirmed, cancelled)
 * - Modal dialogen voor acties
 * - Undo functionaliteit
 * - Error handling en success feedback
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 */

import { ReservatieService } from '../reservatieService.js';

console.log("✅ gesprekkenBedrijf.js geladen");

// 🎯 Globale configuratie
const API_BASE_URL = 'http://localhost:3301';
const EVENT_DATE_STRING_GESPREKKEN = '2025-06-25'; // De vaste datum van het evenement

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
        this.aangevraagdTable = document.getElementById('bedrijfGesprekkenAangevraagd');
        this.ontvangenTable = document.getElementById('bedrijfGesprekkenOntvangen');
        this.loadingIndicator = document.getElementById('loadingBedrijfGesprekken');
    }
};

let rejectModal, redenWeigeringInput, confirmRejectBtn, cancelRejectBtn;
let pendingRejectReservationId = null;

/**
 * Opent de modal om een gesprek te weigeren.
 * @param {number|string} reservatieId - Het ID van de te weigeren reservering.
 */
function openRejectModal(reservatieId) {
  pendingRejectReservationId = reservatieId;
  if (!rejectModal) rejectModal = document.getElementById('rejectModal');
  if (!redenWeigeringInput) redenWeigeringInput = document.getElementById('redenWeigering');
  if (!confirmRejectBtn) confirmRejectBtn = document.getElementById('confirmRejectBtn');
  if (!cancelRejectBtn) cancelRejectBtn = document.getElementById('cancelRejectBtn');
  if (redenWeigeringInput) redenWeigeringInput.value = '';
  if (rejectModal) rejectModal.style.display = 'flex';
}

/**
 * Sluit de modal voor het weigeren van een gesprek.
 */
function closeRejectModal() {
  if (rejectModal) rejectModal.style.display = 'none';
  pendingRejectReservationId = null;
  if (redenWeigeringInput) redenWeigeringInput.value = '';
}

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
     * Toont een succesdialoog die na bevestiging de pagina herlaadt.
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
                    location.reload();
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
 * 🎯 GesprekkenManager - Hoofdklasse voor gesprekken beheer
 * Beheert alle gesprekken-gerelateerde functionaliteit voor bedrijven
 */
class GesprekkenManager {
    constructor() {
        this.reservations = [];
        this.currentUser = null;
        this.lastCancelledMeeting = null; // Voor de 'undo' functionaliteit
        
        console.log('🏢 GesprekkenManager initialiseren...');
        this.init();
    }

    /**
     * 🚀 Initialiseert de manager
     * Zet event listeners op en laadt initiële data
     */
    async init() {
        try {
            await this.loadCurrentUser();
            await this.loadReservations();
            this.setupEventListeners();
            this.setupUndoNotification();
            console.log('✅ GesprekkenManager geïnitialiseerd');
        } catch (error) {
            console.error('❌ Fout bij initialiseren:', error);
            this.showError('Fout bij het laden van gesprekken');
        }
    }

    /**
     * 👤 Laadt huidige gebruiker informatie
     * Haalt bedrijfsgegevens op voor authenticatie
     */
    async loadCurrentUser() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Geen authenticatietoken gevonden');
            }

            const response = await fetch(`${API_BASE_URL}/api/bedrijf/gegevens`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.currentUser = await response.json();
            console.log('👤 Huidige gebruiker geladen:', this.currentUser);
            
        } catch (error) {
            console.error('❌ Fout bij laden gebruiker:', error);
            throw error;
        }
    }

    /**
     * 🔄 Zet undo notificatie systeem op
     * Toont mogelijkheid om laatste geannuleerde gesprek te herstellen
     */
    setupUndoNotification() {
        // Gebruik de bestaande `showUndoNotification` logica of een fallback
        if (typeof window.showUndoNotification === 'function') {
            console.log('🔄 Undo notificatie systeem gevonden');
        } else {
            console.log('🔄 Fallback undo notificatie systeem ingesteld');
            window.showUndoNotification = (message, action) => {
                this.showUndoMessage(message, action);
            };
        }
    }

    /**
     * 🔄 Toont undo notificatie
     * @param {string} message - Notificatie bericht
     * @param {Function} action - Actie om uit te voeren bij undo
     */
    showUndoMessage(message, action) {
        const notification = document.createElement('div');
        notification.className = 'undo-notification';
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove(); ${action}()">Ongedaan maken</button>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto verwijder na 10 seconden
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * 🎧 Zet event listeners op voor interactieve elementen
     */
    setupEventListeners() {
        // Refresh knoppen
        const refreshButtons = document.querySelectorAll('.refresh-btn');
        refreshButtons.forEach(button => {
            button.addEventListener('click', () => this.loadReservations());
        });

        // Filter knoppen
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterReservations(filter);
            });
        });

        console.log('🎧 Event listeners ingesteld');
    }

    /**
     * 📡 Laadt alle gesprekken van de server
     * Haalt zowel aangevraagde als ontvangen gesprekken op
     */
    async loadReservations() {
        try {
            this.showLoading(true);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/reservaties/bedrijf`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.reservations = await response.json();
            console.log('📊 Gesprekken geladen:', this.reservations);
            
            this.renderReservations();
            this.showSuccess('Gesprekken succesvol geladen');
            
        } catch (error) {
            console.error('❌ Fout bij laden gesprekken:', error);
            this.showError('Fout bij het laden van gesprekken');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 🎨 Rendert alle gesprekken in de UI
     * Toont gesprekken in overzichtelijke tabellen
     */
    renderReservations() {
        const container = document.getElementById('reservations-container');
        if (!container) {
            console.error('❌ Reservations container niet gevonden');
            return;
        }

        // Containers
        const requestedContainer = document.getElementById('requested-reservations');
        const receivedContainer = document.getElementById('received-reservations');
        
        if (!requestedContainer || !receivedContainer) {
            console.error('❌ Reservation containers niet gevonden');
            return;
        }

        // Reset loading
        this.clearContainers();
        
        // Verwijder oude rijen behalve de header
        this.clearTableRows(requestedContainer);
        this.clearTableRows(receivedContainer);

        if (this.reservations.length === 0) {
            // Geen gesprekken
            this.showEmptyState();
            return;
        }

        // Split reservations by type
        const requested = this.reservations.filter(r => r.aangevraagdDoor === 'bedrijf');
        const received = this.reservations.filter(r => r.aangevraagdDoor === 'student');
        
        // Aangevraagd door jou
        if (requested.length > 0) {
            requested.forEach(reservation => {
                this.addReservationRow(requestedContainer, reservation, 'requested');
            });
        } else {
            this.addEmptyRow(requestedContainer, 'Geen aangevraagde gesprekken');
        }

        // Ontvangen
        if (received.length > 0) {
            received.forEach(reservation => {
                this.addReservationRow(receivedContainer, reservation, 'received');
            });
        } else {
            this.addEmptyRow(receivedContainer, 'Geen ontvangen gesprekken');
        }

        console.log('🎨 Gesprekken gerenderd');
    }

    /**
     * 🧹 Maakt containers leeg
     */
    clearContainers() {
        const containers = ['requested-reservations', 'received-reservations'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
            }
        });
    }

    /**
     * 🧹 Maakt tabel rijen leeg
     * @param {HTMLElement} container - Container om leeg te maken
     */
    clearTableRows(container) {
        const rows = container.querySelectorAll('tr:not(.header-row)');
        rows.forEach(row => row.remove());
    }

    /**
     * 📝 Voegt een gesprek rij toe aan de tabel
     * @param {HTMLElement} container - Container om rij aan toe te voegen
     * @param {Object} reservation - Gesprek data
     * @param {string} type - Type gesprek (requested/received)
     */
    addReservationRow(container, reservation, type) {
        const row = document.createElement('tr');
        row.className = 'reservation-row';
        row.dataset.id = reservation.id;
        
        // Debug logging voor tafelnr
        console.log('🏢 Tafelnr voor gesprek:', reservation.tafelNr, reservation.bedrijfTafelNr);
        
        // Gebruik bedrijfTafelNr als tafelNr niet bestaat
        const tafelNr = reservation.tafelNr || reservation.bedrijfTafelNr || 'Onbekend';
        
        row.innerHTML = `
            <td>${reservation.studentNaam || 'Onbekend'}</td>
            <td>${reservation.projectTitel || 'Geen project'}</td>
            <td>${this.formatTime(reservation.tijdstip)}</td>
            <td>Tafel ${tafelNr}</td>
            <td>${this.getStatusBadge(reservation.status)}</td>
            <td>
                ${this.getActionButtons(reservation, type)}
            </td>
        `;
        
        container.appendChild(row);
    }

    /**
     * 📝 Voegt een lege rij toe
     * @param {HTMLElement} container - Container om rij aan toe te voegen
     * @param {string} message - Bericht om te tonen
     */
    addEmptyRow(container, message) {
        const row = document.createElement('tr');
        row.className = 'empty-row';
        row.innerHTML = `<td colspan="6" class="empty-message">${message}</td>`;
        container.appendChild(row);
    }

    /**
     * 📝 Toont lege staat wanneer geen gesprekken zijn
     */
    showEmptyState() {
        const container = document.getElementById('reservations-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Geen gesprekken gevonden</h3>
                    <p>Er zijn momenteel geen gesprekken gepland.</p>
                    <button onclick="window.location.reload()">Vernieuwen</button>
                </div>
            `;
        }
    }

    /**
     * 🕐 Formatteert tijd naar leesbaar formaat
     * @param {string} timeString - Tijd string om te formatteren
     * @returns {string} Geformatteerde tijd
     */
    formatTime(timeString) {
        if (!timeString) return 'Onbekend';
        
        try {
            const time = new Date(`2000-01-01T${timeString}`);
            return time.toLocaleTimeString('nl-BE', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.warn('⚠️ Fout bij formatteren tijd:', timeString);
            return timeString;
        }
    }

    /**
     * 🏷️ Genereert status badge
     * @param {string} status - Status van het gesprek
     * @returns {string} HTML voor status badge
     */
    getStatusBadge(status) {
        const statusConfig = {
            'pending': { text: 'Wachtend', class: 'status-pending' },
            'confirmed': { text: 'Bevestigd', class: 'status-confirmed' },
            'cancelled': { text: 'Geannuleerd', class: 'status-cancelled' },
            'completed': { text: 'Voltooid', class: 'status-completed' }
        };
        
        const config = statusConfig[status] || { text: status, class: 'status-unknown' };
        return `<span class="status-badge ${config.class}">${config.text}</span>`;
    }

    /**
     * 🎛️ Genereert actie knoppen voor een gesprek
     * @param {Object} reservation - Gesprek data
     * @param {string} type - Type gesprek (requested/received)
     * @returns {string} HTML voor actie knoppen
     */
    getActionButtons(reservation, type) {
        // Debug logging voor actions
        console.log('🎛️ Genereer actie knoppen voor:', reservation.status, type);
        
        const buttons = [];
        
        if (reservation.status === 'pending') {
            if (type === 'received') {
                buttons.push(`
                    <button class="btn-confirm" onclick="gesprekkenManager.confirmReservation(${reservation.id})">
                        ✅ Bevestigen
                    </button>
                    <button class="btn-decline" onclick="gesprekkenManager.declineReservation(${reservation.id})">
                        ❌ Afwijzen
                    </button>
                `);
            } else {
                buttons.push(`
                    <button class="btn-cancel" onclick="gesprekkenManager.cancelReservation(${reservation.id})">
                        🚫 Annuleren
                    </button>
                `);
            }
        } else if (reservation.status === 'confirmed') {
            buttons.push(`
                <button class="btn-cancel" onclick="gesprekkenManager.cancelReservation(${reservation.id})">
                    🚫 Annuleren
                </button>
            `);
        }
        
        return buttons.join('');
    }

    /**
     * ✅ Bevestigt een gespreksverzoek
     * @param {number} reservationId - ID van het gesprek
     */
    async confirmReservation(reservationId) {
        try {
            this.showLoading(true);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/reservaties/${reservationId}/confirm`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await this.loadReservations(); // Herlaad data
            this.showSuccess('Gesprek succesvol bevestigd');
            
        } catch (error) {
            console.error('❌ Fout bij bevestigen:', error);
            this.showError('Fout bij het bevestigen van het gesprek');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * ❌ Wijst een gespreksverzoek af
     * @param {number} reservationId - ID van het gesprek
     */
    async declineReservation(reservationId) {
        try {
            this.showLoading(true);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/reservaties/${reservationId}/decline`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await this.loadReservations(); // Herlaad data
            this.showSuccess('Gesprek succesvol afgewezen');
            
        } catch (error) {
            console.error('❌ Fout bij afwijzen:', error);
            this.showError('Fout bij het afwijzen van het gesprek');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 🚫 Annuleert een gesprek
     * @param {number} reservationId - ID van het gesprek
     */
    async cancelReservation(reservationId) {
        try {
            // Event delegation voor actie knoppen
            const button = event.target;
            if (button.disabled) return; // Prevent multiple clicks
            
            button.disabled = true;
            button.textContent = 'Annuleren...';
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/reservaties/${reservationId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await this.loadReservations(); // Herlaad data
            this.showSuccess('Gesprek succesvol geannuleerd');
            
        } catch (error) {
            console.error('❌ Fout bij annuleren:', error);
            this.showError('Fout bij het annuleren van het gesprek');
        } finally {
            // Re-enable button after a short delay
            setTimeout(() => {
                if (button) {
                    button.disabled = false;
                    button.textContent = '🚫 Annuleren';
                }
            }, 1000);
        }
    }

    /**
     * 🔍 Filtert gesprekken op status
     * @param {string} filter - Filter type (all, pending, confirmed, cancelled)
     */
    filterReservations(filter) {
        const rows = document.querySelectorAll('.reservation-row');
        
        rows.forEach(row => {
            const status = row.querySelector('.status-badge').textContent.toLowerCase();
            
            if (filter === 'all' || status.includes(filter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        console.log('🔍 Gesprekken gefilterd op:', filter);
    }

    /**
     * ⏳ Toont of verbergt loading state
     * @param {boolean} show - Of loading getoond moet worden
     */
    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
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
        
        // Auto verwijder na 5 seconden
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
        
        // Auto verwijder na 5 seconden
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// 🚀 Initialiseer de manager wanneer de DOM geladen is
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏢 Gesprekken bedrijf pagina laden...');
    
    // Initialiseer de manager wanneer de DOM geladen is
    window.gesprekkenManager = new GesprekkenManager();
    
    // Maak de manager globaal beschikbaar (voor debuggen of externe aanroepen)
    console.log('✅ GesprekkenManager globaal beschikbaar als window.gesprekkenManager');
}); 