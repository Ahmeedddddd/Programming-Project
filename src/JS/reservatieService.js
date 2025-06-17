class ReservatieService {
    /**
     * Sends a reservation request to the backend.
     * @param {string} bedrijfsnummer - The ID of the company.
     * @param {string} tijdslot - The selected time slot (e.g., "14:00-14:30").
     * @returns {Promise<boolean>} - True if the request was successful, false otherwise.
     */
    static async requestReservation(bedrijfsnummer, tijdslot) {
        try {
            const response = await fetchWithAuth('/api/reservaties/request', {
                method: 'POST',
                body: JSON.stringify({ bedrijfsnummer, tijdslot }) // 'datum' niet meesturen, want hardcoded in backend
            });

            const result = await response.json();

            if (!response.ok) {
                showNotification(result.message || 'Fout bij het aanvragen van de reservatie.', 'error');
                return false;
            }

            showNotification(result.message || 'Reservatie aangevraagd!', 'success');
            return true;

        } catch (error) {
            console.error('Error in ReservatieService.requestReservation:', error);
            showNotification(`Netwerkfout: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Fetches reservations for the current student.
     * @returns {Promise<Array>} - An array of reservation objects.
     */
    static async getMyReservations() {
        try {
            const response = await fetchWithAuth('/api/reservaties/my');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Fout bij het ophalen van mijn gesprekken.');
            }
            return result.data || [];
        } catch (error) {
            console.error('Error in ReservatieService.getMyReservations:', error);
            showNotification(`Kan je gesprekken niet laden: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Cancels a student's reservation.
     * @param {string} reservatieId - The ID of the reservation to cancel.
     * @returns {Promise<boolean>} - True if cancellation was successful, false otherwise.
     */
    static async cancelReservation(reservatieId) {
        try {
            const response = await fetchWithAuth(`/api/reservaties/${reservatieId}/cancel`, {
                method: 'PUT'
            });

            const result = await response.json();

            if (!response.ok) {
                showNotification(result.message || 'Fout bij het annuleren van de reservatie.', 'error');
                return false;
            }

            showNotification(result.message || 'Reservatie succesvol geannuleerd.', 'success');
            return true;
        } catch (error) {
            console.error('Error in ReservatieService.cancelReservation:', error);
            showNotification(`Netwerkfout bij annuleren: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Fetches reservation requests for the current company.
     * @returns {Promise<Array>} - An array of reservation request objects.
     */
    static async getCompanyReservations() {
        try {
            const response = await fetchWithAuth('/api/reservaties/company');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Fout bij het ophalen van bedrijfsgesprekken.');
            }
            return result.data || [];
        } catch (error) {
            console.error('Error in ReservatieService.getCompanyReservations:', error);
            showNotification(`Kan bedrijfsgesprekken niet laden: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Accepts a company's reservation request.
     * @param {string} reservatieId - The ID of the reservation to accept.
     * @returns {Promise<boolean>} - True if accepted successfully, false otherwise.
     */
    static async acceptReservation(reservatieId) {
        try {
            const response = await fetchWithAuth(`/api/reservaties/${reservatieId}/accept`, {
                method: 'PUT'
            });

            const result = await response.json();

            if (!response.ok) {
                showNotification(result.message || 'Fout bij het accepteren van de reservatie.', 'error');
                return false;
            }

            showNotification(result.message || 'Reservatie succesvol geaccepteerd.', 'success');
            return true;
        } catch (error) {
            console.error('Error in ReservatieService.acceptReservation:', error);
            showNotification(`Netwerkfout bij accepteren: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Rejects a company's reservation request.
     * @param {string} reservatieId - The ID of the reservation to reject.
     * @param {string} [reden] - Optional reason for rejection.
     * @returns {Promise<boolean>} - True if rejected successfully, false otherwise.
     */
    static async rejectReservation(reservatieId, reden = '') {
        try {
            const response = await fetchWithAuth(`/api/reservaties/${reservatieId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ reden })
            });

            const result = await response.json();

            if (!response.ok) {
                showNotification(result.message || 'Fout bij het weigeren van de reservatie.', 'error');
                return false;
            }

            showNotification(result.message || 'Reservatie succesvol geweigerd.', 'success');
            return true;
        } catch (error) {
            console.error('Error in ReservatieService.rejectReservation:', error);
            showNotification(`Netwerkfout bij weigeren: ${error.message}`, 'error');
            return false;
        }
    }
}

window.ReservatieService = ReservatieService;