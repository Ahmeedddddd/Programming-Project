// src/JS/GESPREKKEN/gesprekkenBedrijf.js
// Requires api.js, reservatieService.js, and notification-system.js

console.log("✅ gesprekkenBedrijf.js geladen (studentenstructuur)");

const EVENT_DATE_STRING_GESPREKKEN = '2025-06-25'; // De vaste datum van het evenement

document.addEventListener('DOMContentLoaded', async () => {
    const gesprekkenTable = document.getElementById('bedrijfGesprekkenTable');
    const loadingMessage = document.getElementById('loadingBedrijfGesprekken');
    const noGesprekkenMessage = document.getElementById('noBedrijfGesprekken');
    const errorMessage = document.getElementById('errorBedrijfGesprekken');

    const loadCompanyGesprekken = async () => {
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
            // Gebruik de ReservatieService om de bedrijfsgesprekken op te halen
            const meetings = await ReservatieService.getCompanyReservations();

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

                    let statusHtml = `<div class="status-${meeting.status}">${displayStatus}</div>`;
                    if (meeting.status === 'geweigerd') {
                        statusHtml = `<div class="status-geweigerd" style="color: #dc3545; font-weight: bold;">Geweigerd${meeting.redenWeigering ? ': ' + meeting.redenWeigering : ''}</div>`;
                    }

                    row.innerHTML = `
                        <div>${meeting.studentNaam || 'Onbekende Student'}</div>
                        <div>${timeSlotDisplay} op ${startDate.toLocaleDateString('nl-BE')}</div>
                        <div class="locatieCel">${meeting.locatie || '-'}</div>
                        ${statusHtml}
                        <div class="gesprekkenActions">
                            ${meeting.status === 'aangevraagd' ?
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
                    gesprekkenTable.appendChild(row);
                });

                // Add event listeners for action buttons
                gesprekkenTable.querySelectorAll('.accept-reservation').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        if (confirm('Weet je zeker dat je deze afspraak wilt accepteren?')) {
                            showLoading(true);
                            const success = await ReservatieService.acceptReservation(reservatieId);
                            if (success) {
                                await loadCompanyGesprekken(); // Herlaad data na succesvolle actie
                            }
                            showLoading(false);
                        }
                    });
                });

                gesprekkenTable.querySelectorAll('.reject-reservation').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reservatieId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                        const reden = prompt('Optioneel: Geef een reden op voor het weigeren van deze afspraak:');
                        if (confirm('Weet je zeker dat je deze afspraak wilt weigeren?')) {
                            showLoading(true);
                            const success = await ReservatieService.rejectReservation(reservatieId, reden);
                            if (success) {
                                await loadCompanyGesprekken(); // Herlaad data na succesvolle actie
                            }
                            showLoading(false);
                        }
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
});