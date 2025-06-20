// src/JS/GESPREKKEN/gesprekkenBedrijf.js
// Requires api.js, reservatieService.js, and notification-system.js

console.log("✅ gesprekkenBedrijf.js geladen (studentenstructuur)");

const EVENT_DATE_STRING_GESPREKKEN = '2025-06-25'; // De vaste datum van het evenement

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

document.addEventListener('DOMContentLoaded', async () => {
    const gesprekkenAangevraagd = document.getElementById('bedrijfGesprekkenAangevraagd');
    const gesprekkenOntvangen = document.getElementById('bedrijfGesprekkenOntvangen');
    const loadingMessage = document.getElementById('loadingBedrijfGesprekken');
    const noGesprekkenMessage = document.getElementById('noBedrijfGesprekken');
    const errorMessage = document.getElementById('errorBedrijfGesprekken');

    const loadCompanyGesprekken = async () => {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (noGesprekkenMessage) noGesprekkenMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';

        // Clear bestaande rijen behalve header
        [gesprekkenAangevraagd, gesprekkenOntvangen].forEach(table => {
          Array.from(table.children).forEach(child => {
            if (!child.classList.contains('gesprekkenTableHeader')) child.remove();
          });
        });

        try {
            const meetings = await ReservatieService.getCompanyReservations();
            if (meetings && meetings.length > 0) {
                // Sorteer meetings op startTijd
                meetings.sort((a, b) => new Date(a.startTijd) - new Date(b.startTijd));
                let countAangevraagd = 0, countOntvangen = 0;
                meetings.forEach(meeting => {
                    const isAangevraagdDoorJou = meeting.aangevraagdDoor === 'bedrijf';
                    const row = document.createElement('div');
                    row.className = 'gesprekkenTableRow ' + (isAangevraagdDoorJou ? 'gesprek-aangevraagd' : 'gesprek-ontvangen');
                    row.dataset.reservatieId = meeting.id;
                    const startDate = new Date(meeting.startTijd);
                    const endDate = new Date(meeting.eindTijd);
                    const formattedStartTime = startDate.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                    const formattedEndTime = endDate.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                    const timeSlotDisplay = `${formattedStartTime}-${formattedEndTime}`;
                    const displayStatus = meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1);
                    let statusHtml = `<div class="status-${meeting.status}">${displayStatus}</div>`;
                    if (meeting.status === 'geweigerd') {
                        statusHtml = `<div class="status-geweigerd" style="color: #dc3545; font-weight: bold;">Geweigerd${meeting.redenWeigering ? ': ' + meeting.redenWeigering : ''}</div>`;
                    }
                    const badge = isAangevraagdDoorJou
                        ? '<span class="badge badge-aangevraagd">Aangevraagd door jou</span>'
                        : '<span class="badge badge-ontvangen">Ontvangen</span>';
                    row.innerHTML = `
                        <div>${meeting.studentNaam || 'Onbekende Student'}</div>
                        <div>${timeSlotDisplay} op ${startDate.toLocaleDateString('nl-BE')}</div>
                        <div class="locatieCel">${meeting.studentTafelNr ? 'Tafel ' + meeting.studentTafelNr : '-'}</div>
                        <div class="statusCel status-${meeting.status}">${displayStatus}</div>
                        <div class="gesprekkenActions">
                            ${!isAangevraagdDoorJou && meeting.status === 'aangevraagd' ?
                                `<button class="actieBtn bevestigBtn accept-reservation" data-id="${meeting.id}">
                                    <span class="actieIcon">&#9745;</span> Accepteer
                                </button>
                                <button class="actieBtn verwijderBtn reject-reservation" data-id="${meeting.id}">
                                    <span class="actieIcon">&#128465;</span> Weiger
                                </button>` :
                                `<button class="actieBtn disabled" disabled>Status: ${displayStatus}</button>`
                            }
                        </div>
                    `;
                    if (isAangevraagdDoorJou) {
                      gesprekkenAangevraagd.appendChild(row);
                      countAangevraagd++;
                    } else {
                      gesprekkenOntvangen.appendChild(row);
                      countOntvangen++;
                    }
                });
                if (countAangevraagd === 0) {
                  const leeg = document.createElement('div');
                  leeg.className = 'leegMelding';
                  leeg.textContent = 'Geen aangevraagde gesprekken.';
                  gesprekkenAangevraagd.appendChild(leeg);
                }
                if (countOntvangen === 0) {
                  const leeg = document.createElement('div');
                  leeg.className = 'leegMelding';
                  leeg.textContent = 'Geen ontvangen gesprekken.';
                  gesprekkenOntvangen.appendChild(leeg);
                }
                // Event listeners voor actieknoppen alleen op ontvangen
                gesprekkenOntvangen.querySelectorAll('.accept-reservation').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        if (confirm('Weet je zeker dat je deze afspraak wilt accepteren?')) {
                            showLoading(true);
                            const success = await ReservatieService.acceptReservation(reservatieId);
                            if (success) {
                                await loadCompanyGesprekken();
                            }
                            showLoading(false);
                        }
                    });
                });
                gesprekkenOntvangen.querySelectorAll('.reject-reservation').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        openRejectModal(reservatieId);
                    });
                });
            } else {
                if (noGesprekkenMessage) noGesprekkenMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading company conversations:', error);
            if (errorMessage) {
                errorMessage.textContent = `Fout bij het laden van je gesprekken: ${error.message}`;
                errorMessage.style.display = 'block';
            }
            if (window.showNotification) window.showNotification(`Fout bij het laden van gesprekken: ${error.message}`, 'error');
        } finally {
            if (loadingMessage) loadingMessage.style.display = 'none';
        }
    };

    // Initial load
    loadCompanyGesprekken();
    
    // Ensure showLoading and showNotification are available (assuming they are in notification-system.js)
    window.showNotification = window.showNotification || function(message, type = 'success') { console.log(message); };
    window.showLoading = window.showLoading || function(show) { 
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = show ? 'flex' : 'none'; 
    };

    // Modal-elementen ophalen
    rejectModal = document.getElementById('rejectModal');
    redenWeigeringInput = document.getElementById('redenWeigering');
    confirmRejectBtn = document.getElementById('confirmRejectBtn');
    cancelRejectBtn = document.getElementById('cancelRejectBtn');

    if (cancelRejectBtn) {
        cancelRejectBtn.addEventListener('click', closeRejectModal);
    }
    if (confirmRejectBtn) {
        confirmRejectBtn.addEventListener('click', async () => {
            if (!pendingRejectReservationId) return closeRejectModal();
            showLoading(true);
            const reden = redenWeigeringInput ? redenWeigeringInput.value : '';
            const success = await ReservatieService.rejectReservation(pendingRejectReservationId, reden);
            if (success) {
                await loadCompanyGesprekken();
                showNotification('Reservatie geweigerd.', 'success');
            }
            showLoading(false);
            closeRejectModal();
        });
    }
});