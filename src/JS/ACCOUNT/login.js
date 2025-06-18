// src/JS/ACCOUNT/login.js - FIXED VERSION WITH CORRECT PORT

// ===== FIXED CONFIGURATION - CORRECT PORT =====
const API_BASE_URL = 'http://localhost:8383';  // FIXED: Changed from 3301 to 8383
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
    console.log('🔐 Initializing fixed login system...');
    console.log('📡 API Base URL:', API_BASE_URL);
    console.log('🔗 Login Endpoint:', LOGIN_ENDPOINT);
    
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
    
    console.log('✅ Fixed login system initialized with correct port');
}

// Check if user is already logged in
function checkExistingLogin() {
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (authToken && userType) {
        console.log('🔄 User already logged in, redirecting...');
        redirectToHomepage(userType);
    }
}

// 🎯 MAIN LOGIN HANDLER - Fixed with correct endpoint
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
        console.log('📡 Using endpoint:', LOGIN_ENDPOINT);
        
        // 📨 LOGIN REQUEST - FIXED ENDPOINT
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
        
        console.log('📡 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || `Login failed: ${response.status}`);
        }
        
        // ✅ SUCCESS
        await handleLoginSuccess(data);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        
        // Show user-friendly error messages
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
            showErrorMessage('Verbindingsfout. Controleer of de server draait.');
        } else if (error.message.includes('401') || error.message.includes('credentials')) {
            showErrorMessage('Onjuiste email of wachtwoord');
        } else if (error.message.includes('429')) {
            showErrorMessage('Te veel loginpogingen. Probeer later opnieuw.');
        } else {
            showErrorMessage(error.message || 'Er is iets misgegaan bij het inloggen');
        }
    } finally {
        showLoading(false);
    }
}

// Handle successful login
async function handleLoginSuccess(data) {
    console.log('✅ Login successful:', data);
    
    try {
        // Store authentication data
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }
        
        if (data.userType) {
            localStorage.setItem('userType', data.userType);
        }
        
        if (data.user && data.user.email) {
            localStorage.setItem('userEmail', data.user.email);
        }
        
        // Store additional user data
        if (data.user) {
            localStorage.setItem('userData', JSON.stringify(data.user));
        }
        
        showSuccessMessage('Succesvol ingelogd! U wordt doorgestuurd...');
        
        // Wait a moment for the user to see the success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Redirect to appropriate homepage
        redirectToHomepage(data.userType);
        
    } catch (error) {
        console.error('❌ Error handling login success:', error);
        showErrorMessage('Login succesvol, maar er is een fout opgetreden bij het doorsturen');
        
        // Fallback redirect after error
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
}

// Redirect to appropriate homepage based on user type
function redirectToHomepage(userType) {
    let targetUrl;
    
    switch(userType) {
        case 'student':
            targetUrl = '/student-homepage';
            break;
        case 'bedrijf':
            targetUrl = '/bedrijf-homepage';
            break;
        case 'organisator':
            targetUrl = '/organisator-homepage';
            break;
        default:
            console.warn('❓ Unknown user type:', userType);
            targetUrl = '/';
    }
    
    console.log(`🚀 Redirecting to: ${targetUrl}`);
    window.location.href = targetUrl;
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
    
    // Disable form during loading
    if (loginForm) {
        const inputs = loginForm.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = show;
        });
    }
}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message, .success-message');
    errorElements.forEach(el => el.remove());
}

function showErrorMessage(message) {
    clearErrorMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        border: 1px solid #f87171;
        color: #dc2626;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    // Insert before the form
    if (loginForm && loginForm.parentNode) {
        loginForm.parentNode.insertBefore(errorDiv, loginForm);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccessMessage(message) {
    clearErrorMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        border: 1px solid #34d399;
        color: #065f46;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Insert before the form
    if (loginForm && loginForm.parentNode) {
        loginForm.parentNode.insertBefore(successDiv, loginForm);
    }
}

// ===== DEBUGGING INFO =====
console.log('🔧 Login System Debug Info:');
console.log('   📡 API Base URL:', API_BASE_URL);
console.log('   🔗 Login Endpoint:', LOGIN_ENDPOINT);
console.log('   🌐 Current URL:', window.location.href);
console.log('   📍 Current Port:', window.location.port);
console.log('✅ Fixed login script loaded with correct configuration');