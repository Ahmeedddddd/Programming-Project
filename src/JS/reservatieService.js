// src/JS/reservatieService.js
// Service for handling reservation operations

console.log("✅ reservatieService.js geladen");

import { fetchWithAuth } from "./api.js";

// Fallback voor showNotification als deze niet bestaat
if (typeof window.showNotification !== 'function') {
    window.showNotification = function(msg, type) { 
        console.log(`[${type.toUpperCase()}] ${msg}`);
        alert(msg); 
    };
}

export class ReservatieService {
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
                body: JSON.stringify({
                    bedrijfsnummer: bedrijfsnummer,
                    tijdslot: tijdslot
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error requesting reservation:', error);
            throw error;
        }
    }

    /**
     * Fetches reservations for the current student.
     * @returns {Promise<Array>} - An array of reservation objects.
     */
    static async getMyReservations() {
        try {
            const response = await fetchWithAuth('/api/reservaties/my');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching my reservations:', error);
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error canceling reservation:', error);
            throw error;
        }
    }

    /**
     * Fetches reservation requests for the current company.
     * @returns {Promise<Array>} - An array of reservation request objects.
     */
    static async getCompanyReservations() {
        try {
            const response = await fetchWithAuth('/api/reservaties/company');
            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Error body from /api/reservaties/company:", errorBody);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching company reservations:', error);
            // In case of error, show a user-friendly notification.
            if (window.showNotification) {
                window.showNotification('Kon bedrijfsgesprekken niet laden. Probeer het later opnieuw.', 'error');
            }
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error accepting reservation:', error);
            throw error;
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
                body: JSON.stringify({ reden: reden })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error rejecting reservation:', error);
            throw error;
        }
    }

    /**
     * Verwijdert een reservatie definitief (alleen toegestaan voor geweigerde afspraken).
     * @param {string} reservatieId - Het ID van de reservatie om te verwijderen.
     * @returns {Promise<boolean>} - True als verwijderen gelukt is, anders false.
     */
    static async deleteReservation(reservatieId) {
        try {
            const response = await fetchWithAuth(`/api/reservaties/${reservatieId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting reservation:', error);
            throw error;
        }
    }

    /**
     * Herstelt een geannuleerde of geweigerde reservatie.
     * @param {string} reservatieId - Het ID van de reservatie om te herstellen.
     * @returns {Promise<object>} - Het resultaat van de server.
     */
    static async restoreReservation(reservatieId) {
        try {
            const response = await fetchWithAuth(`/api/reservaties/${reservatieId}/restore`, {
                method: 'PUT'
            });
            return await response.json();
        } catch (error) {
            console.error('Error restoring reservation:', error);
            throw error;
        }
    }
}

// Make it available globally
window.ReservatieService = ReservatieService;