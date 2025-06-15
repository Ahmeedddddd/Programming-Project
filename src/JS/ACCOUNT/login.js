<<<<<<< Updated upstream
<<<<<<< Updated upstream
// src/JS/ACCOUNT/login.js
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
// src/JS/ACCOUNT/login.js - Complete login system
=======
// src/JS/ACCOUNT/login.js - SIMPLIFIED FINAL VERSION (SYNTAX FIXED)
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

// Configuration
const API_BASE_URL = 'http://localhost:3301';
const LOGIN_ENDPOINT = API_BASE_URL + '/api/auth/login';

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
    
    console.log('🔐 Simplified login system initialized');
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// Main login handler - FIXED VERSION
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
// Main login handler
=======
// 🎯 MAIN LOGIN HANDLER - Simplified for email-first auth
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
async function handleLogin(event) {
    event.preventDefault();
    
    try {
        showLoading(true);
        clearErrorMessages();
        
        // Get form data
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Basic validation
        if (!email || !password) {
            showErrorMessage('Email en wachtwoord zijn verplicht');
            return;
        }
        
        if (!isValidEmail(email)) {
            showErrorMessage('Voer een geldig email adres in');
            return;
        }
        
        console.log('🔄 Attempting login for:', email);
        
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
        
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
        // Send login request
=======
        // 📨 SIMPLE LOGIN REQUEST - just email and password
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            body: JSON.stringify(loginData)
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
            body: JSON.stringify({
                email: email,
                password: password
            })
>>>>>>> Stashed changes
        });
        
        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log('📨 Response data:', data);
        
        if (!response.ok) {
<<<<<<< Updated upstream
            throw new Error(data.message || `HTTP ${response.status}: Login failed`);
=======
            throw new Error(data.message || 'Login failed');
=======
            body: JSON.stringify({ email: email, password: password })
        });
        
        console.log('📡 Response status: ' + response.status);
        
        const data = await response.json();
        
        if (!response.ok) {
<<<<<<< Updated upstream
            throw new Error(data.message || 'Login failed: ' + response.status);
>>>>>>> Stashed changes
>>>>>>> Stashed changes
=======
            throw new Error(data.message || 'Login failed');
=======
            body: JSON.stringify({ email: email, password: password })
        });
        
        console.log('📡 Response status: ' + response.status);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed: ' + response.status);
>>>>>>> Stashed changes
>>>>>>> Stashed changes
        }
        
        // ✅ SUCCESS
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
    
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Store authentication data - FIXED structure
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
    // Store authentication data
>>>>>>> Stashed changes
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
    
<<<<<<< Updated upstream
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
=======
    // Show success message
    showSuccessMessage('Login succesvol! Je wordt doorgestuurd...');
    
    // Redirect based on user type
    setTimeout(() => {
        redirectTodashboard(data.user.userType);
    }, 1500);
=======
    // 💾 Store authentication data
    if (data.token && data.user) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userType', data.user.userType);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.naam || '');
        localStorage.setItem('userId', data.user.userId || '');
        
        console.log('🔑 Auth data stored:', {
            userType: data.user.userType,
            email: data.user.email,
            naam: data.user.naam
        });
    }
    
    // Show success message
    showSuccessMessage('Login succesvol! Je wordt doorgestuurd naar je homepage...');
    
    // 🚀 REDIRECT to homepage (which will automatically serve the correct role-based page)
    setTimeout(function() {
        window.location.href = '/';
    }, 1000);
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
}

// Handle login errors - ENHANCED
function handleLoginError(error) {
    let errorMessage = 'Er ging iets mis bij het inloggen. Probeer het opnieuw.';
    
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
    if (error.message.includes('credentials') || error.message.includes('wachtwoord')) {
        errorMessage = 'Onjuist email adres of wachtwoord.';
=======
    if (error.message.includes('401') || error.message.includes('credentials') || error.message.includes('wachtwoord')) {
        errorMessage = 'Onjuist email adres of wachtwoord.';
    } else if (error.message.includes('404') || error.message.includes('niet gevonden')) {
        errorMessage = 'Geen account gevonden met dit email adres.';
    } else if (error.message.includes('500')) {
        errorMessage = 'Server probleem. Contacteer de administrator.';
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Verbindingsprobleem. Controleer je internetverbinding.';
    } else if (error.message.includes('Unknown column')) {
        errorMessage = 'Er is een database probleem. Contacteer de administrator.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    showErrorMessage(errorMessage);
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// Input validation - ENHANCED
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
// Input validation
>>>>>>> Stashed changes
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

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        const response = await fetch(`${API_BASE_URL}/api/user-info`, {
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
=======
        const response = await fetch(API_BASE_URL + '/api/auth/me', {
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            const userData = await response.json();
            if (userData.isLoggedIn) {
                console.log('✅ Valid token found, redirecting...');
                showInfoMessage('Je bent al ingelogd. Je wordt doorgestuurd...');
                setTimeout(() => {
                    redirectToDashboard(userType);
                }, 1000);
                return;
            }
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
            console.log('✅ Valid token found, redirecting...');
            showInfoMessage('Je bent al ingelogd. Je wordt doorgestuurd...');
            setTimeout(() => {
                redirectTodashboard(userType);
            }, 1000);
        } else {
            // Token is invalid, clear it
            clearAuthData();
=======
            const userData = await response.json();
            if (userData.success) {
                console.log('✅ Valid token found, redirecting to homepage...');
                showInfoMessage('Je bent al ingelogd. Je wordt doorgestuurd naar je homepage...');
                setTimeout(function() {
                    window.location.href = '/';
                }, 1000);
                return;
            }
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        }
        
        // Token is invalid, clear it
        console.log('⚠️ Token invalid, clearing...');
        clearAuthData();
        
    } catch (error) {
        console.log('⚠️ Token verification failed, continuing with login');
        clearAuthData();
    }
}

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    console.log('🧹 Auth data cleared');
}

// UI Helper Functions (unchanged)
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
}

// UI Helper Functions
=======
    localStorage.removeItem('userName');
    console.log('🧹 Auth data cleared');
}

// ===== UTILITY FUNCTIONS =====

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    
    if (loginForm) {
        const inputs = loginForm.querySelectorAll('input, button');
        inputs.forEach(function(input) {
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

function showMessage(message, type) {
    if (!type) type = 'info';
    
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.login-message');
    existingMessages.forEach(function(msg) {
        msg.remove();
    });
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'login-message ' + type;
    messageDiv.innerHTML = '<span>' + message + '</span><button onclick="this.parentElement.remove()" class="close-btn">&times;</button>';
<<<<<<< Updated upstream
    
<<<<<<< Updated upstream
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
    
=======
=======
    
>>>>>>> Stashed changes
<<<<<<< Updated upstream
=======
    // Add styling
    let backgroundColor, textColor, borderColor;
    if (type === 'success') {
        backgroundColor = '#d4edda';
        textColor = '#155724';
        borderColor = '#c3e6cb';
    } else if (type === 'error') {
        backgroundColor = '#f8d7da';
        textColor = '#721c24';
        borderColor = '#f1aeb5';
    } else {
        backgroundColor = '#cce7ff';
        textColor = '#004085';
        borderColor = '#99d1ff';
    }
    
    messageDiv.style.cssText = 'padding: 12px 16px; margin: 10px 0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: ' + backgroundColor + '; color: ' + textColor + '; border: 1px solid ' + borderColor + ';';
    
    messageDiv.querySelector('.close-btn').style.cssText = 'background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; margin-left: 10px; color: inherit;';
    
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    // Insert before form
    if (loginForm) {
        loginForm.parentNode.insertBefore(messageDiv, loginForm);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(function() {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
function clearErrorMessages() {
    const messages = document.querySelectorAll('.login-message');
<<<<<<< Updated upstream
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
=======
    messages.forEach(function(msg) {
        msg.remove();
    });
}

// Global logout function for consistency
window.logout = async function() {
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            await fetch(API_BASE_URL + '/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('❌ Logout error:', error);
    } finally {
        // Clear all stored data
        clearAuthData();
        sessionStorage.clear();
        
        console.log('🚪 User logged out successfully');
        window.location.href = '/login';
    }
};

console.log('✅ Simplified login system loaded - Ready for email-first authentication');
>>>>>>> Stashed changes
