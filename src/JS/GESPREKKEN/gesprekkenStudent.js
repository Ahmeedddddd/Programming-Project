// src/JS/GESPREKKEN/gesprekkenStudent.js
// Requires api.js, reservatieService.js, and notification-system.js

const EVENT_DATE_STRING_GESPREKKEN = '2025-06-25'; // De vaste datum van het evenement

document.addEventListener('DOMContentLoaded', async () => {
    const gesprekkenTable = document.getElementById('studentGesprekkenTable');
    const loadingMessage = document.getElementById('loadingStudentGesprekken');
    const noGesprekkenMessage = document.getElementById('noStudentGesprekken');
    const errorMessage = document.getElementById('errorStudentGesprekken');

    const loadStudentGesprekken = async () => {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (noGesprekkenMessage) noGesprekkenMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';

        // Clear existing rows except header and messages
        Array.from(gesprekkenTable.children).forEach(child => {
            if (!child.classList.contains('gesprekkenTableHeader') && 
                !child.id.startsWith('loading') && 
                !child.id.startsWith('no') && 
                !child.id.startsWith('error')) {
                child.remove();
            }
        });

        try {
            // Gebruik de ReservatieService om de student's reserveringen op te halen
            const meetings = await ReservatieService.getMyReservations();

            if (meetings && meetings.length > 0) {
                // Sorteer meetings op startTijd
                meetings.sort((a, b) => new Date(a.startTijd) - new Date(b.startTijd));

                meetings.forEach(meeting => {
                    const row = document.createElement('div');
                    row.className = 'gesprekkenTableRow';
                    row.dataset.reservatieId = meeting.id;

                    // Backend stuurt nu ISO strings, dus direct parsen.
                    const startDate = new Date(meeting.startTijd);
                    const endDate = new Date(meeting.eindTijd);
                        
                        // Formatteer de tijden
                    const formattedStartTime = startDate.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                    const formattedEndTime = endDate.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'});
                    const timeSlotDisplay = `${formattedStartTime}-${formattedEndTime}`;
                        
                    const displayStatus = meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1);

                    row.innerHTML = `
                        <div>${meeting.bedrijfNaam}</div>
                        <div>${timeSlotDisplay} op ${startDate.toLocaleDateString('nl-BE')}</div>
                        <div class="status-${meeting.status}">${displayStatus}</div>
                        <div class="gesprekkenActions">
                            ${meeting.status === 'aangevraagd' || meeting.status === 'bevestigd' ?
                                `<button class="actieBtn verwijderBtn cancel-reservation" data-id="${meeting.id}">
                                    <span class="actieIcon">&#128465;</span> Annuleer
                                </button>` :
                                `<button class="actieBtn disabled" disabled>Geen actie</button>`
                            }
                        </div>
                    `;
                    gesprekkenTable.appendChild(row);
                });

                // Add event listeners for cancel buttons
                gesprekkenTable.querySelectorAll('.cancel-reservation').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        // Zorg ervoor dat we de data-id van de knop krijgen, of van de dichtstbijzijnde ouder met die data-id
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        if (confirm('Weet je zeker dat je deze afspraak wilt annuleren?')) {
                            showLoading(true); // Toon laadoverlay
                            const success = await ReservatieService.cancelReservation(reservatieId);
                            if (success) {
                                await loadStudentGesprekken(); // Herlaad data na succesvolle annulering
                            }
                            showLoading(false); // Verberg laadoverlay
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

    // Initial load
    loadStudentGesprekken();
    
    // Ensure showLoading and showNotification are available (assuming they are in notification-system.js)
    // Deze worden geacht globaal beschikbaar te zijn
    window.showNotification = window.showNotification || function(message, type = 'success') { console.log(message); };
    window.showLoading = window.showLoading || function(show) { 
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = show ? 'flex' : 'none'; 
    };
});