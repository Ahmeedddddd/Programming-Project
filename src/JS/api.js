// src/JS/api.js
// Utility for authenticated fetch requests

/**
 * Performs a fetch request with an authentication token.
 * Automatically retrieves the token from localStorage.
 *
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>} - The fetch Response object.
 * @throws {Error} If no authentication token is found or fetch fails.
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn('No authentication token found. Redirecting to login.');
        window.location.href = '/login'; // Redirect to login if no token
        throw new Error('Authentication token missing.');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers, // Allow overriding or adding more headers
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        console.warn('Unauthorized or Forbidden. Token might be expired or invalid. Redirecting to login.');
        localStorage.removeItem('authToken'); // Clear invalid token
        window.location.href = '/login'; // Redirect to login
        throw new Error('Unauthorized access or token expired.');
    }

    return response;
}

// Make it available globally if other scripts need it
window.fetchWithAuth = fetchWithAuth;