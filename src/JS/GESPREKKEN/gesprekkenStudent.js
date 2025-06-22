// src/JS/GESPREKKEN/gesprekkenStudent.js
import { ReservatieService } from '../reservatieService.js';

// --- GLOBAAL & CONFIGURATIE ---
const currentUser = { id: null, type: 'student' }; // Statisch voor dit script
let lastCancelledMeeting = null; // Voor de 'undo' functionaliteit

// --- DOM ELEMENTEN ---
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
const UI = {
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
        // Gebruik een custom dialog als die bestaat, anders een simpele `confirm`
        if (window.showCustomDialog) {
            return await window.showCustomDialog({ title, message, confirmText: 'Ja', cancelText: 'Nee', type: 'warning' });
        }
        return confirm(`${title}\n\n${message}`);
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

// --- GESPREKKEN MANAGER ---
class GesprekkenManager {
    constructor() {
        this.meetings = [];
        this.initEventListeners();
    }

    async loadGesprekken() {
        UI.showLoading(true);
        try {
            this.meetings = await ReservatieService.getMyReservations();
            this.render();
        } catch (error) {
            console.error("Fout bij laden gesprekken:", error);
            UI.showNotification("Kon je gesprekken niet laden.", "error");
        } finally {
            UI.showLoading(false);
        }
    }

    render() {
        const clearTable = (table) => {
            Array.from(table.children).forEach(child => {
                if (!child.classList.contains('gesprekkenTableHeader')) child.remove();
            });
        };
        
        clearTable(DOMElements.aangevraagdTable);
        clearTable(DOMElements.ontvangenTable);

        const aangevraagd = this.meetings.filter(m => m.aangevraagdDoor === currentUser.type);
        const ontvangen = this.meetings.filter(m => m.aangevraagdDoor !== currentUser.type);

        aangevraagd.forEach(m => DOMElements.aangevraagdTable.appendChild(this.createRow(m)));
        ontvangen.forEach(m => DOMElements.ontvangenTable.appendChild(this.createRow(m)));
        
        if (aangevraagd.length === 0) this.showEmptyMessage(DOMElements.aangevraagdTable, 'Je hebt nog geen gesprekken aangevraagd.');
        if (ontvangen.length === 0) this.showEmptyMessage(DOMElements.ontvangenTable, 'Je hebt nog geen gesprekken ontvangen.');
    }

    createRow(meeting) {
        const row = document.createElement('div');
        row.className = `gesprekkenTableRow status-${meeting.status.toLowerCase()}`;
        row.dataset.id = meeting.id;
        
        // Veilige datumconversie
        const startTime = meeting.startTijd ? new Date(`1970-01-01T${meeting.startTijd}Z`).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : 'N/A';
        const endTime = meeting.eindTijd ? new Date(`1970-01-01T${meeting.eindTijd}Z`).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : 'N/A';
        const time = `${startTime} - ${endTime}`;
        
        row.innerHTML = `
            <div class="naamCel">${meeting.bedrijfNaam || 'Onbekend Bedrijf'}</div>
            <div class="locatieCel">${meeting.bedrijfTafelNr ? `Tafel ${meeting.bedrijfTafelNr}` : '-'}</div>
            <div class="tijdslotCel">${time}</div>
            <div class="statusCel status-${meeting.status.toLowerCase()}">${meeting.status}</div>
            <div class="gesprekkenActions">${this.getActionsHtml(meeting)}</div>
        `;
        return row;
    }

    getActionsHtml(meeting) {
        const { status, aangevraagdDoor, id } = meeting;
        const isRequester = aangevraagdDoor === currentUser.type;

        switch (status) {
            case 'aangevraagd':
                if (isRequester) {
                    return `<button class="actieBtn intrekkenBtn" data-action="withdraw" data-id="${id}">Intrekken</button>`;
                } else {
                    return `
                        <button class="actieBtn bevestigBtn" data-action="accept" data-id="${id}">Accepteren</button>
                        <button class="actieBtn weigerBtn" data-action="reject" data-id="${id}">Weigeren</button>
                    `;
                }
            case 'bevestigd':
                return `<button class="actieBtn annuleerBtn" data-action="cancel" data-id="${id}">Annuleren</button>`;
            case 'geannuleerd':
                return `
                    <button class="actieBtn herstelBtn" data-action="restore" data-id="${id}">Herstellen</button>
                    <button class="actieBtn verwijderBtn" data-action="delete" data-id="${id}">Verwijder</button>
                `;
            case 'geweigerd':
                return `<button class="actieBtn verwijderBtn" data-action="delete" data-id="${id}">Verwijder</button>`;
            default:
                return '<span>-</span>';
        }
    }
    
    showEmptyMessage(table, message) {
        const row = document.createElement('div');
        row.className = 'gesprekkenTableRow lege-rij';
        row.innerHTML = `<div class="geen-gesprekken">${message}</div>`;
        table.appendChild(row);
    }

    initEventListeners() {
        const tableContainer = document.querySelector('.gesprekkenKaart');
        tableContainer.addEventListener('click', this.handleActionClick.bind(this));
    }

    async handleActionClick(e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const { action, id } = button.dataset;
        button.disabled = true;

        const actions = {
            'withdraw': () => this.handleCancel(id, 'Intrekking succesvol', true),
            'cancel': () => this.handleCancel(id, 'Afspraak geannuleerd', true),
            'accept': () => this.handleAccept(id),
            'reject': () => this.handleReject(id),
            'delete': () => this.handleDelete(id),
            'restore': () => this.handleRestore(id)
        };
        
        if (actions[action]) {
            await actions[action]();
        }

        button.disabled = false;
    }
    
    async handleAccept(id) {
        const result = await ReservatieService.acceptReservation(id);
        if(result.success) {
            UI.showNotification('Afspraak bevestigd!', 'success');
            await this.loadGesprekken();
        } else {
            UI.showNotification(result.message || 'Kon afspraak niet bevestigen.', 'error');
        }
    }

    async handleReject(id) {
        if (!await UI.confirm('Afspraak weigeren', 'Weet je zeker dat je dit verzoek wilt weigeren?')) return;
        const result = await ReservatieService.rejectReservation(id);
         if(result.success) {
            UI.showNotification('Afspraak geweigerd.', 'info');
            lastCancelledMeeting = this.meetings.find(m => m.id == id);
            UI.showUndo('Afspraak geweigerd.', () => this.handleRestore(id));
            await this.loadGesprekken();
        } else {
            UI.showNotification(result.message || 'Kon afspraak niet weigeren.', 'error');
        }
    }
    
    async handleCancel(id, message, withUndo = false) {
        if (!await UI.confirm('Actie bevestigen', 'Weet je zeker dat je deze actie wilt uitvoeren?')) return;
        const result = await ReservatieService.cancelReservation(id);
        if (result.success) {
            lastCancelledMeeting = this.meetings.find(m => m.id == id);
            if (withUndo) {
                 UI.showUndo(message, () => this.handleRestore(id));
            } else {
                UI.showNotification(message, 'success');
            }
            await this.loadGesprekken();
        } else {
            UI.showNotification(result.message || 'Actie mislukt.', 'error');
        }
    }

    async handleDelete(id) {
        if (!await UI.confirm('Permanent verwijderen', 'Deze actie kan niet ongedaan gemaakt worden. Weet je het zeker?')) return;
        const result = await ReservatieService.deleteReservation(id);
        if (result.success) {
            UI.showNotification('Afspraak permanent verwijderd.', 'success');
            const row = document.querySelector(`.gesprekkenTableRow[data-id='${id}']`);
            if (row) row.remove();
        } else {
            UI.showNotification(result.message || 'Kon afspraak niet verwijderen.', 'error');
        }
    }

    async handleRestore(id) {
        const result = await ReservatieService.restoreReservation(id);
        if (result.success) {
            UI.showNotification('Actie ongedaan gemaakt.', 'success');
            await this.loadGesprekken();
        } else {
            UI.showNotification(result.message || 'Kon actie niet herstellen.', 'error');
        }
    }
}

// --- INITIALISATIE ---
document.addEventListener('DOMContentLoaded', () => {
    DOMElements.init();
    const manager = new GesprekkenManager();
    // Probeer de huidige gebruiker op te halen
    const userInfo = JSON.parse(localStorage.getItem('user'));
    if (userInfo && userInfo.studentnummer) {
        currentUser.id = userInfo.studentnummer;
    }

    manager.loadGesprekken();
    
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