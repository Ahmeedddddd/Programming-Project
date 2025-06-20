// src/JS/GESPREKKEN/gesprekkenStudent.js
// Requires api.js, reservatieService.js, and notification-system.js

const EVENT_DATE_STRING_GESPREKKEN = '2025-06-25'; // De vaste datum van het evenement

document.addEventListener('DOMContentLoaded', async () => {
    const gesprekkenTable = document.getElementById('studentGesprekkenTable');
    const loadingMessage = document.getElementById('loadingStudentGesprekken');
    const noGesprekkenMessage = document.getElementById('noStudentGesprekken');
    const errorMessage = document.getElementById('errorStudentGesprekken');

    const gesprekkenAangevraagd = document.getElementById('studentGesprekkenAangevraagd');
    const gesprekkenOntvangen = document.getElementById('studentGesprekkenOntvangen');

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
                    let statusHtml = `<div class=\"status-${meeting.status}\">${displayStatus}</div>`;
                    if (meeting.status === 'geweigerd') {
                        statusHtml = `<div class=\"status-geweigerd\" style=\"color: #dc3545; font-weight: bold;\">Geweigerd${meeting.redenWeigering ? ': ' + meeting.redenWeigering : ''}</div>`;
                    }
                    row.innerHTML = `
                        <div>${meeting.bedrijfNaam}</div>
                        <div>${timeSlotDisplay} op ${startDate.toLocaleDateString('nl-BE')}</div>
                        ${statusHtml}
                        <div class=\"gesprekkenActions\">
                            ${!isAangevraagdDoorJou && meeting.status === 'aangevraagd' ?
                                `<button class=\"actieBtn verwijderBtn cancel-reservation\" data-id=\"${meeting.id}\">\n<span class=\"actieIcon\">&#128465;</span> Annuleer\n</button>` :
                                `<button class=\"actieBtn disabled\" disabled>Geen actie</button>`
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
                // Event listeners voor annuleren alleen op ontvangen
                gesprekkenOntvangen.querySelectorAll('.cancel-reservation').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        if (confirm('Weet je zeker dat je deze afspraak wilt annuleren?')) {
                            showLoading(true);
                            const success = await ReservatieService.cancelReservation(reservatieId);
                            if (success) {
                                await loadStudentGesprekken();
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
});