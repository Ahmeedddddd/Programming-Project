// src/JS/api.js
// Utility for authenticated fetch requests

console.log("✅ api.js geladen");

/**
 * Wrapper for the fetch API that automatically includes the JWT token.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>} - The fetch response.
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
            // Unauthorized or token expired, redirect to login
            console.warn('Authentication error (401): Token might be expired or invalid. Redirecting to login.');
            // Clear potentially bad credentials
            localStorage.removeItem('authToken');
            localStorage.removeItem('userType');
            localStorage.removeItem('user');
            // Redirect
            window.location.href = '/login?session_expired=true';
            // Return a promise that never resolves to stop further execution
            return new Promise(() => {});
        }
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Make it available globally
window.fetchWithAuth = fetchWithAuth;