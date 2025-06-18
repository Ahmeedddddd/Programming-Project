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
    
}

// Check if user is already logged in
function checkExistingLogin() {
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (authToken && userType) {
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
    try {
        console.log('✅ Login successful:', data);
        
        // Store auth data in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userType', data.userType);
        localStorage.setItem('userEmail', data.email || data.user?.email);
        localStorage.setItem('userId', data.userId || data.user?.id);
        localStorage.setItem('userName', data.name || data.user?.name || '');
        
        // Store full user data if available
        if (data.user) {
            localStorage.setItem('userData', JSON.stringify(data.user));
        }
        
        showSuccessMessage(`Welkom terug! U wordt doorgestuurd...`);
        
        // Wait for user to see success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // FIX: Correct redirect based on user type
        let targetUrl;
        switch(data.userType) {
            case 'student':
                targetUrl = '/student-homepage';
                console.log('🎓 Redirecting student to:', targetUrl);
                break;
                
            case 'bedrijf':
                targetUrl = '/bedrijf-homepage';
                console.log('🏢 Redirecting bedrijf to:', targetUrl);
                break;
                
            case 'organisator':
                targetUrl = '/organisator-homepage';
                console.log('👔 Redirecting organisator to:', targetUrl);
                break;
                
            default:
                console.warn('❓ Unknown user type:', data.userType);
                targetUrl = '/';
        }
        
        // FIX: Use replace to prevent back button issues
        console.log(`🚀 Final redirect to: ${targetUrl}`);
        window.location.replace(targetUrl);
        
    } catch (error) {
        console.error('❌ Error handling login success:', error);
        showErrorMessage('Login succesvol, maar er is een fout opgetreden bij het doorsturen');
        
        // Fallback redirect after error
        setTimeout(() => {
            window.location.replace('/');
        }, 2000);
    }
}

// FIX: Update the form submit handler as well
async function handleLogin(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validation
    if (!email || !password) {
        showErrorMessage('Vul alle velden in');
        return;
    }
    
    if (!isValidEmail(email)) {
        showErrorMessage('Ongeldig e-mailadres');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('http://localhost:8383/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login mislukt');
        }
        
        if (data.success) {
            // FIX: Pass the full data object to handleLoginSuccess
            await handleLoginSuccess(data);
        } else {
            throw new Error(data.message || 'Login mislukt');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showErrorMessage(error.message || 'Er is een fout opgetreden. Probeer het later opnieuw.');
    } finally {
        showLoading(false);
    }
}

// FIX: Add a check on page load to redirect if already logged in
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (authToken && userType) {
        console.log('🔍 User already logged in, redirecting...');
        
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
                targetUrl = '/';
        }
        
        window.location.replace(targetUrl);
    }
});

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