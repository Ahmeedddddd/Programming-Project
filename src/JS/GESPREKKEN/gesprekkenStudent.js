// src/JS/GESPREKKEN/gesprekkenStudent.js
// Requires api.js, reservatieService.js, and notification-system.js

const EVENT_DATE_STRING_GESPREKKEN = '2025-06-25'; // De vaste datum van het evenement

// Fallback voor showLoading als deze niet bestaat
window.showLoading = window.showLoading || function(show) {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(136,21,56,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;color:white;font-size:2rem;';
    overlay.innerHTML = '<div>Even geduld...</div>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = show ? 'flex' : 'none';
};

document.addEventListener('DOMContentLoaded', async () => {
    const gesprekkenTable = document.getElementById('studentGesprekkenTable');
    const loadingMessage = document.getElementById('loadingStudentGesprekken');
    const noGesprekkenMessage = document.getElementById('noStudentGesprekken');
    const errorMessage = document.getElementById('errorStudentGesprekken');

    const gesprekkenAangevraagd = document.getElementById('studentGesprekkenAangevraagd');
    const gesprekkenOntvangen = document.getElementById('studentGesprekkenOntvangen');

    // Helper om een meeting te vinden uit de laatst geladen meetings
    let lastLoadedMeetings = [];

    const loadStudentGesprekken = async () => {
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
            const meetings = await ReservatieService.getMyReservations();
            lastLoadedMeetings = meetings; // <-- Bewaar voor undo
            if (meetings && meetings.length > 0) {
                meetings.sort((a, b) => new Date(a.startTijd) - new Date(b.startTijd));
                let countAangevraagd = 0, countOntvangen = 0;
                meetings.forEach(meeting => {
                    const isAangevraagdDoorJou = meeting.aangevraagdDoor === 'student';
                    const row = document.createElement('div');
                    row.className = 'gesprekkenTableRow ' + (isAangevraagdDoorJou ? 'gesprek-aangevraagd' : 'gesprek-ontvangen');
                    row.dataset.reservatieId = meeting.id;
                    const startDate = new Date(meeting.startTijd);
                    const endDate = new Date(meeting.eindTijd);
                    const formattedStartTime = startDate.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                    const formattedEndTime = endDate.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                    const timeSlotDisplay = `${formattedStartTime}-${formattedEndTime}`;
                    const displayStatus = meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1);
                    let statusHtml = `<div class=\"statusCel status-${meeting.status}\">${displayStatus}</div>`;
                    if (meeting.status === 'geweigerd') {
                        statusHtml = `<div class=\"statusCel status-geweigerd\" style=\"color: #dc3545; font-weight: bold;\">Geweigerd${meeting.redenWeigering ? ': ' + meeting.redenWeigering : ''}</div>`;
                    }
                    // Gebruik het juiste veld voor tafelnummer (bedrijfTafelNr)
                    const tafelNr = meeting.bedrijfTafelNr ? `Tafel ${meeting.bedrijfTafelNr}` : '-';
                    // Actieknoppen
                    let actionsHtml = '';
                    if (isAangevraagdDoorJou && meeting.status === 'aangevraagd') {
                        actionsHtml = `<button class="actieBtn verwijderBtn cancel-reservation" data-id="${meeting.id}"><span class="actieIcon">&#128465;</span> Annuleer</button>`;
                    } else if (!isAangevraagdDoorJou && meeting.status === 'aangevraagd') {
                        actionsHtml = `<button class="actieBtn verwijderBtn cancel-reservation" data-id="${meeting.id}"><span class="actieIcon">&#128465;</span> Annuleer</button>`;
                    } else if (meeting.status === 'geweigerd') {
                        actionsHtml = `<button class="actieBtn verwijderBtn delete-rejected" data-id="${meeting.id}"><span class="actieIcon">&#128465;</span> Verwijder</button>`;
                    } else {
                        actionsHtml = `<button class="actieBtn disabled" disabled>Geen actie</button>`;
                    }
                    // Opbouw: Naam bedrijf | Tafel | Tijdslot | Status | Actie
                    row.innerHTML = `
                        <div class=\"naamCel\">${meeting.bedrijfNaam}</div>
                        <div class=\"locatieCel\">${tafelNr}</div>
                        <div class=\"tijdslotCel\">${timeSlotDisplay}</div>
                        ${statusHtml}
                        <div class=\"gesprekkenActions\">${actionsHtml}</div>
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
                // Event listeners voor annuleren (nu voor zowel aangevraagd door jou als ontvangen)
                [...gesprekkenAangevraagd.querySelectorAll('.cancel-reservation'), ...gesprekkenOntvangen.querySelectorAll('.cancel-reservation')].forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        if (button.disabled) return;
                        button.disabled = true;
                        if (window.showCustomDialog) {
                            window.showCustomDialog({
                                title: 'Afspraak annuleren',
                                message: 'Weet je zeker dat je deze afspraak wilt annuleren?',
                                confirmText: 'Annuleer',
                                cancelText: 'Annuleren',
                                type: 'warning'
                            }).then(async (confirmed) => {
                                if (confirmed) {
                                    showLoading(true);
                                    const success = await ReservatieService.cancelReservation(reservatieId);
                                    if (success) {
                                        await loadStudentGesprekken();
                                        showNotification('Afspraak geannuleerd.', 'success');
                                    }
                                    showLoading(false);
                                }
                                button.disabled = false;
                            });
                        } else {
                            // Fallback: warning toast + direct actie
                            showNotification('Afspraak wordt geannuleerd...', 'warning');
                            showLoading(true);
                            const success = await ReservatieService.cancelReservation(reservatieId);
                            if (success) {
                                await loadStudentGesprekken();
                                showNotification('Afspraak geannuleerd.', 'success');
                            }
                            showLoading(false);
                            button.disabled = false;
                        }
                    });
                });
                // Voeg event listener toe voor verwijderknop geweigerde afspraken
                gesprekkenOntvangen.querySelectorAll('.delete-rejected').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        let deletedMeeting = null;
                        if (window.showCustomDialog) {
                            window.showCustomDialog({
                                title: 'Geweigerde afspraak verwijderen',
                                message: 'Weet je zeker dat je deze geweigerde afspraak wilt verwijderen?',
                                confirmText: 'Verwijder',
                                cancelText: 'Annuleren',
                                type: 'warning'
                            }).then(async (confirmed) => {
                                if (confirmed) {
                                    showLoading(true);
                                    // Zoek meeting info uit cache
                                    deletedMeeting = lastLoadedMeetings.find(m => m.id == reservatieId) || null;
                                    const success = await ReservatieService.deleteReservation(reservatieId);
                                    if (success) {
                                        await loadStudentGesprekken();
                                        showUndoNotification(deletedMeeting);
                                    }
                                    showLoading(false);
                                }
                            });
                        } else {
                            showNotification('Geweigerde afspraak wordt verwijderd...', 'warning');
                            showLoading(true);
                            deletedMeeting = lastLoadedMeetings.find(m => m.id == reservatieId) || null;
                            const success = await ReservatieService.deleteReservation(reservatieId);
                            if (success) {
                                await loadStudentGesprekken();
                                showUndoNotification(deletedMeeting);
                            }
                            showLoading(false);
                        }
                    });
                });
                // Ook voor aangevraagde gesprekken
                gesprekkenAangevraagd.querySelectorAll('.delete-rejected').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        let deletedMeeting = null;
                        if (window.showCustomDialog) {
                            window.showCustomDialog({
                                title: 'Geweigerde afspraak verwijderen',
                                message: 'Weet je zeker dat je deze geweigerde afspraak wilt verwijderen?',
                                confirmText: 'Verwijder',
                                cancelText: 'Annuleren',
                                type: 'warning'
                            }).then(async (confirmed) => {
                                if (confirmed) {
                                    showLoading(true);
                                    deletedMeeting = lastLoadedMeetings.find(m => m.id == reservatieId) || null;
                                    const success = await ReservatieService.deleteReservation(reservatieId);
                                    if (success) {
                                        await loadStudentGesprekken();
                                        showUndoNotification(deletedMeeting);
                                    }
                                    showLoading(false);
                                }
                            });
                        } else {
                            showNotification('Geweigerde afspraak wordt verwijderd...', 'warning');
                            showLoading(true);
                            deletedMeeting = lastLoadedMeetings.find(m => m.id == reservatieId) || null;
                            const success = await ReservatieService.deleteReservation(reservatieId);
                            if (success) {
                                await loadStudentGesprekken();
                                showUndoNotification(deletedMeeting);
                            }
                            showLoading(false);
                        }
                    });
                });
            } else {
                if (noGesprekkenMessage) noGesprekkenMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading student conversations:', error);
            if (errorMessage) {
                errorMessage.textContent = `Fout bij het laden van je gesprekken: ${error.message}`;
                errorMessage.style.display = 'block';
            }
            if (window.showNotification) window.showNotification(`Fout bij het laden van gesprekken: ${error.message}`, 'error');
        } finally {
            if (loadingMessage) loadingMessage.style.display = 'none';
        }
    };

    await loadStudentGesprekken();
});

// Undo notification helper
function showUndoNotification(meeting) {
    if (!meeting) {
        showNotification('Geweigerde afspraak verwijderd.', 'success');
        return;
    }
    // Maak een custom notification/toast met Undo knop
    const container = document.getElementById('notification-container') || (() => {
        const c = document.createElement('div');
        c.id = 'notification-container';
        document.body.appendChild(c);
        return c;
    })();
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.style.cssText = `
        background: #f0fdf4;
        border-left: 4px solid #16a34a;
        padding: 1rem 1.5rem;
        margin-bottom: 0.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 1rem;
    `;
    notification.innerHTML = `Geweigerde afspraak verwijderd. <button class="undoBtn" style="background:#fff;border:1px solid #16a34a;color:#16a34a;padding:0.3em 1em;border-radius:6px;cursor:pointer;font-weight:600;">Ongedaan maken</button>`;
    container.appendChild(notification);
    let undone = false;
    const undoBtn = notification.querySelector('.undoBtn');
    const timeout = setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 6000);
    undoBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (undone) return;
        undone = true;
        clearTimeout(timeout);
        notification.textContent = 'Herstellen...';
        // Probeer te herstellen via backend (herstel-API of heraanmaken)
        try {
            showLoading(true);
            // Hier moet je een echte herstel-API aanroepen als die bestaat:
            // await ReservatieService.restoreReservation(meeting.id);
            // Fallback: heraanmaken
            const restored = await ReservatieService.createReservationFromBackup(meeting);
            if (restored) {
                showNotification('Afspraak hersteld!', 'success');
                await loadStudentGesprekken();
            } else {
                showNotification('Kon afspraak niet herstellen.', 'error');
            }
        } catch (err) {
            showNotification('Fout bij herstellen: ' + err.message, 'error');
        } finally {
            if (notification.parentNode) notification.remove();
            showLoading(false);
        }
    });
}

// Voeg createReservationFromBackup toe aan ReservatieService
if (typeof ReservatieService.createReservationFromBackup !== 'function') {
  ReservatieService.createReservationFromBackup = async function(meeting) {
    if (!meeting) return false;
    try {
      // Bepaal wie de reserverende partij is
      const userType = (window.getUserType && window.getUserType()) || (window.currentUser && window.currentUser.userType) || 'student';
      let payload = {};
      if (userType === 'student') {
        payload = {
          bedrijfsnummer: meeting.bedrijfNummer || meeting.bedrijfsnummer || meeting.bedrijfnummer,
          tijdslot: `${meeting.startTijd ? new Date(meeting.startTijd).toLocaleTimeString('nl-BE', {hour:'2-digit',minute:'2-digit'}) : ''}-${meeting.eindTijd ? new Date(meeting.eindTijd).toLocaleTimeString('nl-BE', {hour:'2-digit',minute:'2-digit'}) : ''}`
        };
      } else if (userType === 'bedrijf') {
        payload = {
          studentnummer: meeting.studentNummer || meeting.studentnummer,
          tijdslot: `${meeting.startTijd ? new Date(meeting.startTijd).toLocaleTimeString('nl-BE', {hour:'2-digit',minute:'2-digit'}) : ''}-${meeting.eindTijd ? new Date(meeting.eindTijd).toLocaleTimeString('nl-BE', {hour:'2-digit',minute:'2-digit'}) : ''}`
        };
      } else {
        return false;
      }
      const response = await fetchWithAuth('/api/reservaties/request', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        return true;
      } else {
        showNotification(result.message || 'Kon afspraak niet herstellen.', 'error');
        return false;
      }
    } catch (err) {
      showNotification('Fout bij herstellen: ' + err.message, 'error');
      return false;
    }
  }
}