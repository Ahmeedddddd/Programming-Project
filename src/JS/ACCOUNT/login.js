// src/JS/ACCOUNT/login.js - SIMPLIFIED FINAL VERSION (SYNTAX FIXED)

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

// 🎯 MAIN LOGIN HANDLER - Simplified for email-first auth
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
        
        // 📨 SIMPLE LOGIN REQUEST - just email and password
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, password: password })
        });
        
        console.log('📡 Response status: ' + response.status);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed: ' + response.status);
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
}

// Handle login errors
function handleLoginError(error) {
    let errorMessage = 'Er ging iets mis bij het inloggen. Probeer het opnieuw.';
    
    if (error.message.includes('401') || error.message.includes('credentials') || error.message.includes('wachtwoord')) {
        errorMessage = 'Onjuist email adres of wachtwoord.';
    } else if (error.message.includes('404') || error.message.includes('niet gevonden')) {
        errorMessage = 'Geen account gevonden met dit email adres.';
    } else if (error.message.includes('500')) {
        errorMessage = 'Server probleem. Contacteer de administrator.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Verbindingsprobleem. Controleer je internetverbinding.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    showErrorMessage(errorMessage);
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
        const response = await fetch(API_BASE_URL + '/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            if (userData.success) {
                console.log('✅ Valid token found, redirecting to homepage...');
                showInfoMessage('Je bent al ingelogd. Je wordt doorgestuurd naar je homepage...');
                setTimeout(function() {
                    window.location.href = '/';
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

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    console.log('🧹 Auth data cleared');
}

// ===== UTILITY FUNCTIONS =====

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

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

function clearErrorMessages() {
    const messages = document.querySelectorAll('.login-message');
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