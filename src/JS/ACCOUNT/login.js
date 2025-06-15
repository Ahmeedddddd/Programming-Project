// src/JS/ACCOUNT/login.js

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

// Main login handler - FIXED VERSION
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
        
        // ✅ FIXED: Proper userType and identifier determination
        let userType, identifier;
        
        if (email.includes('@student.ehb.be')) {
            userType = 'student';
            // ✅ For students, we need studentnummer, not email
            // Since we only have email, we'll send email and let backend handle it
            identifier = email;
        } else if (email.includes('@ehb.be')) {
            userType = 'organisator';
            identifier = email;
        } else {
            userType = 'bedrijf';
            // ✅ For bedrijven, we need bedrijfsnummer, but since we only have email, send email
            identifier = email;
        }
        
        // ✅ FIXED: Send the format the backend expects
        const loginData = {
            email: email,           // Always send email
            password: password,
            userType: userType      // Add userType for backend processing
        };
        
        console.log('🔄 Login data being sent:', {
            email: email.substring(0, 10) + '...',
            userType: userType,
            hasPassword: !!password
        });
        
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log('📨 Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}: Login failed`);
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
    
    // Store authentication data - FIXED structure
    if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userType', data.userType || data.user?.userType);
        localStorage.setItem('userId', data.userId || data.user?.userId || data.user?.id);
        localStorage.setItem('userEmail', data.email || data.user?.email);
        
        console.log('🔑 Auth data stored:', {
            userType: data.userType,
            userId: data.userId,
            email: data.email
        });
    }
    
    // ✅ Test token before redirecting
    try {
        const testResponse = await fetch(`${API_BASE_URL}/api/user-info`, {
            headers: {
                'Authorization': `Bearer ${data.token}`
            }
        });
        
        if (testResponse.ok) {
            const userData = await testResponse.json();
            console.log('✅ Token verification successful:', userData);
            
            // Show success message
            showSuccessMessage('Login succesvol! Je wordt doorgestuurd...');
            
            // Redirect based on user type
            setTimeout(() => {
                redirectToDashboard(data.userType || data.user?.userType);
            }, 1500);
        } else {
            throw new Error('Token verification failed');
        }
        
    } catch (tokenError) {
        console.error('❌ Token verification failed:', tokenError);
        showErrorMessage('Login succesvol, maar er is een probleem met de verificatie. Probeer opnieuw in te loggen.');
        
        // Clear stored data
        clearAuthData();
    }
}

// Handle login errors - ENHANCED
function handleLoginError(error) {
    let errorMessage = 'Er ging iets mis bij het inloggen. Probeer het opnieuw.';
    
    // ✅ More specific error handling based on HTTP status and message
    if (error.message.includes('400')) {
        errorMessage = 'Ongeldige logingegevens. Controleer je email en wachtwoord.';
    } else if (error.message.includes('401') || error.message.includes('credentials') || error.message.includes('wachtwoord')) {
        errorMessage = 'Onjuist email adres of wachtwoord.';
    } else if (error.message.includes('403')) {
        errorMessage = 'Je account heeft geen toegang. Contacteer de administrator.';
    } else if (error.message.includes('404')) {
        errorMessage = 'De loginservice is niet beschikbaar. Probeer later opnieuw.';
    } else if (error.message.includes('500')) {
        errorMessage = 'Server probleem. Contacteer de administrator.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Verbindingsprobleem. Controleer je internetverbinding.';
    } else if (error.message.includes('Unknown column')) {
        errorMessage = 'Er is een database probleem. Contacteer de administrator.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    showErrorMessage(errorMessage);
}

// Input validation - ENHANCED
function validateInput(email, password) {
    let isValid = true;
    
    // Email validation
    if (!email) {
        showFieldError('loginEmail', 'Email adres is verplicht');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('loginEmail', 'Voer een geldig email adres in');
        isValid = false;
    } else if (!email.includes('@ehb.be') && !email.includes('@student.ehb.be')) {
        // ✅ Allow external emails for bedrijven, but warn about proper format
        console.log('ℹ️ External email detected - assuming bedrijf login');
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
        const response = await fetch(`${API_BASE_URL}/api/user-info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            if (userData.isLoggedIn) {
                console.log('✅ Valid token found, redirecting...');
                showInfoMessage('Je bent al ingelogd. Je wordt doorgestuurd...');
                setTimeout(() => {
                    redirectToDashboard(userType);
                }, 1000);
                return;
            }
        }
        
        // Token is invalid, clear it
        console.log('⚠️ Token invalid, clearing...');
        clearAuthData();
        
    } catch (error) {
        console.log('⚠️ Token verification failed, continuing with login');
        clearAuthData();
    }
}

// Redirect to appropriate dashboard
function redirectToDashboard(userType) {
    const redirectUrls = {
        'student': '/accountStudent',
        'bedrijf': '/accountBedrijf', 
        'organisator': '/accountOrganisator'
    };
    
    const url = redirectUrls[userType] || '/';
    console.log(`🚀 Redirecting to ${userType} dashboard: ${url}`);
    
    // Use window.location.replace to prevent back button issues
    window.location.replace(url);
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    console.log('🧹 Auth data cleared');
}

// UI Helper Functions (unchanged)
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
    
    // Add some basic styling
    messageDiv.style.cssText = `
        padding: 12px 16px;
        margin: 10px 0;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
        ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f1aeb5;' : ''}
        ${type === 'info' ? 'background: #cce7ff; color: #004085; border: 1px solid #99d1ff;' : ''}
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
    errorDiv.style.cssText = 'color: #dc3545; font-size: 14px; margin-top: 4px;';
    field.parentNode.appendChild(errorDiv);
    
    // Add error styling to field
    field.classList.add('error');
    field.style.borderColor = '#dc3545';
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
    errorFields.forEach(field => {
        field.classList.remove('error');
        field.style.borderColor = '';
    });
}

// ✅ Enhanced debug function
window.debugLogin = function() {
    console.log('🧪 Debug Login Info:');
    console.log('Auth Token:', localStorage.getItem('authToken'));
    console.log('User Type:', localStorage.getItem('userType'));
    console.log('User ID:', localStorage.getItem('userId'));
    console.log('Email:', localStorage.getItem('userEmail'));
    
    // Test current token
    if (localStorage.getItem('authToken')) {
        fetch(`${API_BASE_URL}/api/user-info`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
        })
        .then(r => r.json())
        .then(data => console.log('Token test:', data))
        .catch(e => console.error('Token test failed:', e));
    }
    
    // Test backend connectivity
    fetch(`${API_BASE_URL}/api/health`)
        .then(r => r.json())
        .then(data => console.log('Backend health:', data))
        .catch(e => console.error('Backend not reachable:', e));
};

// Export functions for external use
window.loginSystem = {
    clearAuthData,
    checkExistingLogin,
    redirectToDashboard: redirectToDashboard,
    isLoggedIn: () => !!localStorage.getItem('authToken'),
    getUserType: () => localStorage.getItem('userType'),
    getAuthToken: () => localStorage.getItem('authToken')
};