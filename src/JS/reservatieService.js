/**
 * 📅 reservatieService.js - Service voor het beheren van reservatie operaties
 * 
 * Dit bestand biedt een complete service voor het beheren van reservaties:
 * - Aanvragen van nieuwe reservaties door studenten
 * - Ophalen van bestaande reservaties
 * - Accepteren/weigeren van reservaties door bedrijven
 * - Annuleren en herstellen van reservaties
 * - Error handling en notificaties
 * 
 * Belangrijke functionaliteiten:
 * - Authenticated API calls met JWT tokens
 * - Uitgebreide error handling
 * - Gebruiksvriendelijke notificaties
 * - Fallback mechanismen voor ontbrekende functies
 * - Consistent response handling
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

// Fallback voor showNotification als deze niet bestaat
if (typeof window.showNotification !== 'function') {
    window.showNotification = function(msg, type) { 
        alert(msg); 
    };
}

/**
 * 📅 ReservatieService - Hoofdklasse voor reservatie beheer
 * 
 * Deze klasse biedt alle methoden voor het beheren van reservaties
 * tussen studenten en bedrijven in het CareerLaunch systeem
 */
class ReservatieService {
    /**
     * Verzendt een reservatie aanvraag naar de backend
     * 
     * Deze functie stelt studenten in staat om een reservatie aan te vragen
     * bij een bedrijf voor een specifiek tijdslot
     * 
     * @param {string} bedrijfsnummer - Het ID van het bedrijf
     * @param {string} tijdslot - Het geselecteerde tijdslot (bijv. "14:00-14:30")
     * @returns {Promise<Object>} - Server response met succes/error informatie
     * @throws {Error} - Bij netwerk of server fouten
     */
    static async requestReservation(bedrijfsnummer, tijdslot) {
        try {
            const response = await window.fetchWithAuth('/api/reservaties/request', {
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
            throw error;
        }
    }

    /**
     * Haalt alle reservaties op voor de huidige student
     * 
     * Deze functie toont alle actieve en historische reservaties
     * van de ingelogde student
     * 
     * @returns {Promise<Array>} - Array van reservatie objecten
     */
    static async getMyReservations() {
        try {
            const response = await window.fetchWithAuth('/api/reservaties/my');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Annuleert een reservatie van een student
     * 
     * Deze functie stelt studenten in staat om hun eigen reservaties
     * te annuleren voordat deze geaccepteerd zijn
     * 
     * @param {string} reservatieId - Het ID van de te annuleren reservatie
     * @returns {Promise<Object>} - Server response met succes/error informatie
     * @throws {Error} - Bij netwerk of server fouten
     */
    static async cancelReservation(reservatieId) {
        try {
            const response = await window.fetchWithAuth(`/api/reservaties/${reservatieId}/cancel`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Haalt reservatie aanvragen op voor het huidige bedrijf
     * 
     * Deze functie toont alle inkomende reservatie aanvragen
     * die wachten op acceptatie/weigering door het bedrijf
     * 
     * @returns {Promise<Array>} - Array van reservatie aanvraag objecten
     */
    static async getCompanyReservations() {
        try {
            const response = await window.fetchWithAuth('/api/reservaties/company');
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            // Toon gebruiksvriendelijke notificatie bij fout
            if (window.showNotification) {
                window.showNotification('Kon bedrijfsgesprekken niet laden. Probeer het later opnieuw.', 'error');
            }
            return [];
        }
    }

    /**
     * Accepteert een reservatie aanvraag van een bedrijf
     * 
     * Deze functie stelt bedrijven in staat om reservatie aanvragen
     * van studenten te accepteren
     * 
     * @param {string} reservatieId - Het ID van de te accepteren reservatie
     * @returns {Promise<Object>} - Server response met succes/error informatie
     * @throws {Error} - Bij netwerk of server fouten
     */
    static async acceptReservation(reservatieId) {
        try {
            const response = await window.fetchWithAuth(`/api/reservaties/${reservatieId}/accept`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Weigert een reservatie aanvraag van een bedrijf
     * 
     * Deze functie stelt bedrijven in staat om reservatie aanvragen
     * van studenten te weigeren met een optionele reden
     * 
     * @param {string} reservatieId - Het ID van de te weigeren reservatie
     * @param {string} [reden] - Optionele reden voor weigering
     * @returns {Promise<Object>} - Server response met succes/error informatie
     * @throws {Error} - Bij netwerk of server fouten
     */
    static async rejectReservation(reservatieId, reden = '') {
        try {
            const response = await window.fetchWithAuth(`/api/reservaties/${reservatieId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ reden: reden })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verwijdert een reservatie definitief
     * 
     * Deze functie verwijdert een reservatie permanent uit het systeem.
     * Alleen toegestaan voor geweigerde of geannuleerde afspraken.
     * 
     * @param {string} reservatieId - Het ID van de te verwijderen reservatie
     * @returns {Promise<Object>} - Server response met succes/error informatie
     * @throws {Error} - Bij netwerk of server fouten
     */
    static async deleteReservation(reservatieId) {
        try {
            const response = await window.fetchWithAuth(`/api/reservaties/${reservatieId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Herstelt een geannuleerde of geweigerde reservatie
     * 
     * Deze functie stelt gebruikers in staat om geannuleerde of
     * geweigerde reservaties te herstellen naar hun originele status
     * 
     * @param {string} reservatieId - Het ID van de te herstellen reservatie
     * @returns {Promise<Object>} - Server response met succes/error informatie
     * @throws {Error} - Bij netwerk of server fouten
     */
    static async restoreReservation(reservatieId) {
        try {
            const response = await window.fetchWithAuth(`/api/reservaties/${reservatieId}/restore`, {
                method: 'PUT'
            });
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}

// Maak de klasse globaal beschikbaar
window.ReservatieService = ReservatieService;

// Export de klasse voor ES6 module import
export { ReservatieService };