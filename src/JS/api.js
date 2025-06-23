// src/JS/api.js
// Utility for authenticated fetch requests

/**
 * 🌐 api.js - Authenticatie wrapper voor fetch requests
 * 
 * Dit bestand biedt een veilige wrapper rond de fetch API die:
 * - Automatisch JWT tokens toevoegt aan requests
 * - Handelt authenticatie fouten af
 * - Biedt consistente error handling
 * - Maakt automatische redirects bij verlopen sessies
 * 
 * Belangrijke functionaliteiten:
 * - Automatische token injectie in headers
 * - 401 error handling met sessie cleanup
 * - Globale beschikbaarheid via window object
 * - Consistent error handling voor alle API calls
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

/**
 * 🔐 Wrapper voor de fetch API met automatische JWT token authenticatie
 * 
 * Deze functie voegt automatisch de JWT token toe aan alle API requests
 * en handelt authenticatie fouten af door gebruikers naar de login
 * pagina te redirecten bij verlopen sessies.
 * 
 * Features:
 * - Automatische token extractie uit localStorage
 * - Flexibele header configuratie
 * - 401 error handling met sessie cleanup
 * - Automatische redirect bij authenticatie problemen
 * 
 * @param {string} url - De URL om naar te fetchen
 * @param {object} options - Fetch opties (method, headers, body, etc.)
 * @param {string} options.method - HTTP methode (GET, POST, PUT, DELETE)
 * @param {object} options.headers - Extra headers om toe te voegen
 * @param {any} options.body - Request body data
 * @returns {Promise<Response>} - De fetch response
 * @throws {Error} - Bij netwerk of andere fouten
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            // Ongeautoriseerd of token verlopen, redirect naar login
            // Verwijder mogelijk slechte credentials
            localStorage.removeItem('authToken');
            localStorage.removeItem('userType');
            localStorage.removeItem('user');
            
            // Redirect naar login met sessie verlopen parameter
            window.location.href = '/login?session_expired=true';
            
            // Return een promise die nooit resolve om verdere uitvoering te stoppen
            return new Promise(() => {});
        }
        
        return response;
    } catch (error) {
        // Herwerp de error voor consistente error handling
        throw error;
    }
}

// Maak functie globaal beschikbaar voor gebruik in andere bestanden
window.fetchWithAuth = fetchWithAuth;