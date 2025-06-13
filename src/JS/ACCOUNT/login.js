// src/JS/ACCOUNT/login.js - Complete login system

// Configuration
const API_BASE_URL = 'http://localhost:3301';
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login`;

// DOM Elements
let loginForm;
let emailInput;
let passwordInput;
let loadingOverlay;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginSystem();
});

function initializeLoginSystem() {
    // Get DOM elements
    loginForm = document.getElementById('loginForm');
    emailInput = document.getElementById('loginEmail');
    passwordInput = document.getElementById('loginPassword');
    loadingOverlay = document.getElementById('loadingOverlay');
    
    // Check if user is already logged in
    checkExistingLogin();
    
    // Add form submit handler
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Add input event listeners for better UX
    if (emailInput) {
        emailInput.addEventListener('input', clearErrorMessages);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', clearErrorMessages);
    }
    
    console.log('🔐 Login system initialized');
}

// Main login handler
async function handleLogin(event) {
    event.preventDefault();
    
    try {
        // Show loading state
        showLoading(true);
        clearErrorMessages();
        
        // Get form data
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Client-side validation
        if (!validateInput(email, password)) {
            showLoading(false);
            return;
        }
        
        console.log('🔄 Attempting login for:', email);
        
        // Send login request
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Success! Handle login response
        await handleLoginSuccess(data);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        handleLoginError(error);
    } finally {
        showLoading(false);
    }
}

// Handle successful login
async function handleLoginSuccess(data) {
    console.log('✅ Login successful:', data);
    
    // Store authentication data
    if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userType', data.user.userType);
        localStorage.setItem('userId', data.user.userId);
        localStorage.setItem('userEmail', data.user.email);
        
        console.log('🔑 Auth data stored');
    }
    
    // Show success message
    showSuccessMessage('Login succesvol! Je wordt doorgestuurd...');
    
    // Redirect based on user type
    setTimeout(() => {
        redirectTodashboard(data.user.userType);
    }, 1500);
}

// Handle login errors
function handleLoginError(error) {
    let errorMessage = 'Er ging iets mis bij het inloggen. Probeer het opnieuw.';
    
    if (error.message.includes('credentials') || error.message.includes('wachtwoord')) {
        errorMessage = 'Onjuist email adres of wachtwoord.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Verbindingsprobleem. Controleer je internetverbinding.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    showErrorMessage(errorMessage);
}

// Input validation
function validateInput(email, password) {
    let isValid = true;
    
    // Email validation
    if (!email) {
        showFieldError('loginEmail', 'Email adres is verplicht');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('loginEmail', 'Voer een geldig email adres in');
        isValid = false;
    }
    
    // Password validation
    if (!password) {
        showFieldError('loginPassword', 'Wachtwoord is verplicht');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('loginPassword', 'Wachtwoord is te kort');
        isValid = false;
    }
    
    return isValid;
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if user is already logged in
function checkExistingLogin() {
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (token && userType) {
        console.log('🔍 Existing login found, verifying...');
        verifyTokenAndRedirect(token, userType);
    }
}

// Verify existing token
async function verifyTokenAndRedirect(token, userType) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Valid token found, redirecting...');
            showInfoMessage('Je bent al ingelogd. Je wordt doorgestuurd...');
            setTimeout(() => {
                redirectTodashboard(userType);
            }, 1000);
        } else {
            // Token is invalid, clear it
            clearAuthData();
        }
    } catch (error) {
        console.log('Token verification failed, continuing with login');
        clearAuthData();
    }
}

// Redirect to appropriate dashboard
function redirectTodashboard(userType) {
    const redirectUrls = {
        'student': '/accountStudent',
        'bedrijf': '/accountBedrijf', 
        'organisator': '/accountOrganisator'
    };
    
    const url = redirectUrls[userType] || '/';
    console.log(`🚀 Redirecting to ${userType} dashboard: ${url}`);
    window.location.href = url;
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
}

// UI Helper Functions
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    
    // Disable form during loading
    if (loginForm) {
        const inputs = loginForm.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = show;
        });
    }
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showInfoMessage(message) {
    showMessage(message, 'info');
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.login-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `login-message ${type}`;
    messageDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-btn">&times;</button>
    `;
    
    // Insert before form
    if (loginForm) {
        loginForm.parentNode.insertBefore(messageDiv, loginForm);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
    
    // Add error styling to field
    field.classList.add('error');
}

function clearErrorMessages() {
    // Clear all error messages
    const errorMessages = document.querySelectorAll('.field-error');
    errorMessages.forEach(error => error.remove());
    
    // Clear message notifications
    const messages = document.querySelectorAll('.login-message');
    messages.forEach(msg => msg.remove());
    
    // Remove error styling from fields
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

// Test function for development
window.testLogin = function() {
    console.log('🧪 Testing login system...');
    
    // Test with demo credentials
    emailInput.value = 'test.console@ehb.be';
    passwordInput.value = 'test123456';
    
    console.log('Demo credentials filled. Click login button to test.');
};

// Export functions for external use
window.loginSystem = {
    clearAuthData,
    checkExistingLogin,
    redirectToDashboard: redirectTodashboard,
    isLoggedIn: () => !!localStorage.getItem('authToken'),
    getUserType: () => localStorage.getItem('userType'),
    getAuthToken: () => localStorage.getItem('authToken')
};