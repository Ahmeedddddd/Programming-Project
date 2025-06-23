// src/JS/UTILS/password-modal-fixed.js
// 🔐 GEFIXTE PASSWORD MODAL VOOR EHB SYSTEEM

/**
 * 🔐 Wachtwoord Modal Management Systeem
 * 
 * Dit bestand bevat alle functionaliteit voor het beheren van wachtwoord wijzigingen:
 * - Openen en sluiten van de wachtwoord modal
 * - Wachtwoord sterkte validatie met real-time feedback
 * - Wachtwoord zichtbaarheid toggle
 * - Form validatie en error handling
 * - Event listeners en UI updates
 * - Integratie met de backend API
 * 
 * Het systeem biedt uitgebreide beveiliging met:
 * - Minimale lengte vereisten
 * - Complexiteit vereisten (hoofdletters, kleine letters, cijfers, speciale karakters)
 * - Patroon detectie voor veelvoorkomende wachtwoorden
 * - Real-time feedback over wachtwoord sterkte
 * 
 * @author CareerLaunch Development Team
 * @version 2.0
 */

// === GLOBAL VARIABLES ===
window.currentPasswordUser = null;
window.passwordRequirements = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumbers: false,
    hasSpecialChars: false,
    noCommonPatterns: false
};

// === MODAL FUNCTIONS (GLOBAL SCOPE) ===
/**
 * 🔓 Opent de wachtwoord wijziging modal
 * 
 * Toont de modal voor wachtwoord wijziging en initialiseert
 * alle benodigde UI elementen en event listeners
 * 
 * @returns {void}
 */
window.openPasswordModal = function() {
    const modal = document.getElementById('passwordModal');
    if (!modal) {
        console.error('❌ Password modal not found! Make sure the HTML is added.');
        return;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Get current user info
    getCurrentPasswordUser();
    
    // Focus on first input
    setTimeout(() => {
        const firstInput = document.getElementById('currentPassword');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
};

/**
 * 🔒 Sluit de wachtwoord wijziging modal
 * 
 * Verbergt de modal en reset alle form velden en UI elementen
 * naar hun initiële staat
 * 
 * @returns {void}
 */
window.closePasswordModal = function() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    
    // Reset form
    const form = document.getElementById('passwordChangeForm');
    if (form) {
        form.reset();
    }
    
    const messageContainer = document.getElementById('modalMessage');
    if (messageContainer) {
        messageContainer.innerHTML = '';
    }
    
    const strengthMeter = document.getElementById('passwordStrengthMeter');
    if (strengthMeter) {
        strengthMeter.style.display = 'none';
    }
    
    const saveBtn = document.getElementById('savePasswordBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
    }
    
    // Reset requirements
    resetPasswordRequirements();
};

// === PASSWORD VISIBILITY TOGGLE ===
window.togglePasswordVisibility = function(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.nextElementSibling;
    if (!button) return;
    
    const icon = button.querySelector('i');
    if (!icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
};

// === PASSWORD STRENGTH VALIDATION ===
function validatePasswordStrength(password) {
    const requirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        noCommonPatterns: !/^(password|123456|qwerty|admin|welcome|login|changeme)$/i.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const isValid = score >= 6 && requirements.minLength;

    return {
        requirements,
        score,
        maxScore: 6,
        isValid,
        level: getSecurityLevel(score),
        message: getSecurityMessage(score)
    };
}

function getSecurityLevel(score) {
    if (score >= 6) return 'maximum';
    if (score >= 5) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
}

function getSecurityMessage(score) {
    if (score >= 6) return 'Uitstekend - Maximale beveiliging';
    if (score >= 5) return 'Sterk - Goede beveiliging';
    if (score >= 3) return 'Gemiddeld - Kan beter';
    return 'Zwak - Niet veilig genoeg';
}

function updatePasswordStrength(password) {
    const meter = document.getElementById('passwordStrengthMeter');
    
    if (!password) {
        if (meter) meter.style.display = 'none';
        return false;
    }

    if (meter) meter.style.display = 'block';
    
    const validation = validatePasswordStrength(password);
    const { requirements, score, level, message } = validation;

    // Update progress bar
    const progressBar = document.getElementById('strengthBar');
    const progressText = document.getElementById('strengthText');
    
    if (progressBar && progressText) {
        const percentage = (score / 6) * 100;
        progressBar.style.width = percentage + '%';
        progressBar.className = `strength-fill strength-${level}`;
        progressText.textContent = `Wachtwoord sterkte: ${message}`;
    }

    // Update requirements list
    updateRequirement('req-length', requirements.minLength);
    updateRequirement('req-uppercase', requirements.hasUppercase);
    updateRequirement('req-lowercase', requirements.hasLowercase);
    updateRequirement('req-number', requirements.hasNumbers);
    updateRequirement('req-special', requirements.hasSpecialChars);
    updateRequirement('req-patterns', requirements.noCommonPatterns);

    // Store global requirements
    window.passwordRequirements = requirements;
    
    return validation.isValid;
}

function updateRequirement(elementId, isValid) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const icon = element.querySelector('.requirement-icon');
    if (!icon) return;
    
    if (isValid) {
        element.className = 'valid';
        icon.className = 'requirement-icon valid';
        icon.textContent = '✓';
    } else {
        element.className = 'invalid';
        icon.className = 'requirement-icon invalid';
        icon.textContent = '✗';
    }
}

function resetPasswordRequirements() {
    const requirements = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special', 'req-patterns'];
    requirements.forEach(req => updateRequirement(req, false));
}

// === FORM VALIDATION ===
function validatePasswordForm() {
    const currentPassword = document.getElementById('currentPassword')?.value || '';
    const newPassword = document.getElementById('newPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    
    const hasCurrentPassword = currentPassword.length > 0;
    const hasValidNewPassword = updatePasswordStrength(newPassword);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
    
    const isValid = hasCurrentPassword && hasValidNewPassword && passwordsMatch;
    
    const saveBtn = document.getElementById('savePasswordBtn');
    if (saveBtn) {
        saveBtn.disabled = !isValid;
    }
    
    return isValid;
}

// === USER MANAGEMENT ===
/**
 * 👤 Haalt huidige gebruiker informatie op
 * 
 * Probeert gebruiker informatie op te halen uit verschillende bronnen:
 * sessionStorage, localStorage, window object, of fallback naar demo data
 * 
 * @returns {void}
 */
function getCurrentPasswordUser() {
    try {
        // Try multiple sources for user data
        window.currentPasswordUser = {
            gebruikersId: sessionStorage.getItem('gebruikersId') || 
                         localStorage.getItem('gebruikersId') || 
                         window.gebruikersId ||
                         'demo-user',
            userType: sessionStorage.getItem('userType') || 
                     localStorage.getItem('userType') || 
                     window.userType ||
                     'student',
            email: sessionStorage.getItem('email') || 
                  localStorage.getItem('email') || 
                  window.email ||
                  'demo@ehb.be'
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        window.currentPasswordUser = {
            gebruikersId: 'demo-user',
            userType: 'student',
            email: 'demo@ehb.be'
        };
    }
}

// === PASSWORD CHANGE API ===
/**
 * 🔄 Wijzigt het wachtwoord van de gebruiker
 * 
 * Stuurt een verzoek naar de backend om het wachtwoord te wijzigen.
 * Valideert eerst de input en toont feedback aan de gebruiker.
 * 
 * @returns {Promise<void>}
 */
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showPasswordMessage('Wachtwoorden komen niet overeen', 'error');
        return;
    }

    // Validate strength
    if (!updatePasswordStrength(newPassword)) {
        showPasswordMessage('Nieuw wachtwoord voldoet niet aan alle beveiligingseisen', 'error');
        return;
    }

    // Show loading state
    const saveBtn = document.getElementById('savePasswordBtn');
    if (!saveBtn) return;
    
    const originalContent = saveBtn.innerHTML;
    saveBtn.innerHTML = '<div class="loading-spinner"></div> Bezig met opslaan...';
    saveBtn.disabled = true;

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                gebruikersId: window.currentPasswordUser?.gebruikersId,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            showPasswordMessage('Wachtwoord succesvol gewijzigd! 🎉', 'success');
            
            // Show notification if available
            if (typeof showNotification === 'function') {
                showNotification('Wachtwoord succesvol gewijzigd', 'success');
            }
            
            // Close modal after 2 seconds
            setTimeout(() => {
                window.closePasswordModal();
            }, 2000);
        } else {
            showPasswordMessage(result.message || 'Er ging iets mis bij het wijzigen van het wachtwoord', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showPasswordMessage('Netwerkfout: Kan geen verbinding maken met de server', 'error');
    } finally {
        // Restore button
        if (saveBtn) {
            saveBtn.innerHTML = originalContent;
            saveBtn.disabled = false;
            validatePasswordForm();
        }
    }
}

// === MESSAGE DISPLAY ===
function showPasswordMessage(message, type = 'info') {
    const messageContainer = document.getElementById('modalMessage');
    if (!messageContainer) return;
    
    const className = type === 'error' ? 'error-message' : 'success-message';
    const icon = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    
    messageContainer.innerHTML = `
        <div class="${className}">
            <i class="${icon}"></i>
            ${message}
        </div>
    `;

    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}

/**
 * 🔧 Zet event listeners op voor de wachtwoord modal
 * 
 * Initialiseert alle benodigde event listeners voor:
 * - Wachtwoord input validatie
 * - Form submit handling
 * - Modal sluiten via klik buiten modal of escape toets
 * 
 * @returns {void}
 */
function setupPasswordModalEventListeners() {
    // Password input event listeners
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const currentPasswordInput = document.getElementById('currentPassword');

    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            validatePasswordForm();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordForm);
    }

    if (currentPasswordInput) {
        currentPasswordInput.addEventListener('input', validatePasswordForm);
    }

    // Save button click
    const saveBtn = document.getElementById('savePasswordBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', changePassword);
    }

    // Form submit prevention
    const form = document.getElementById('passwordChangeForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validatePasswordForm()) {
                changePassword();
            }
        });
    }

    // Close modal on outside click
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                window.closePasswordModal();
            }
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('passwordModal');
            if (modal && modal.style.display === 'block') {
                window.closePasswordModal();
            }
        }
    });
}

/**
 * 🔗 Verbindt bestaande wachtwoord knoppen met de modal
 * 
 * Zoekt naar bestaande knoppen in de DOM die wachtwoord wijziging
 * functionaliteit zouden kunnen hebben en verbindt deze met de modal.
 * Ondersteunt ook dynamisch toegevoegde knoppen.
 * 
 * @returns {void}
 */
function connectExistingPasswordButtons() {
    // Find all buttons that might be password change buttons
    const buttons = document.querySelectorAll('button, .ehbBtn');
    let connectedCount = 0;
    
    buttons.forEach((button, index) => {
        const buttonText = button.textContent || button.innerText || '';
        const buttonHTML = button.innerHTML || '';
        
        // Check if this is a password change button
        if ((buttonText.includes('Wachtwoord') && buttonText.includes('Wijzigen')) || 
            buttonHTML.includes('fa-key') ||
            buttonText.includes('Password') ||
            button.classList.contains('password-btn')) {
            
            // Remove any existing onclick handlers that might cause conflicts
            button.removeAttribute('onclick');
            
            // Add new event listener
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.openPasswordModal();
            });
            
            // Also set onclick as backup
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.openPasswordModal();
            };
            
            connectedCount++;
        }
    });
    
    // Also listen for dynamically added buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('button') || e.target.matches('.ehbBtn')) {
            const buttonText = e.target.textContent || e.target.innerText || '';
            const buttonHTML = e.target.innerHTML || '';
            
            if ((buttonText.includes('Wachtwoord') && buttonText.includes('Wijzigen')) || 
                buttonHTML.includes('fa-key')) {
                e.preventDefault();
                e.stopPropagation();
                window.openPasswordModal();
            }
        }
    });
}

/**
 * 🚀 Initialiseert het wachtwoord modal systeem
 * 
 * Start het volledige wachtwoord modal systeem door:
 * - Event listeners op te zetten
 * - Bestaande knoppen te verbinden
 * - Dynamische content te ondersteunen
 * 
 * @returns {void}
 */
function initializePasswordModal() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupPasswordModalEventListeners();
            connectExistingPasswordButtons();
        });
    } else {
        setupPasswordModalEventListeners();
        connectExistingPasswordButtons();
    }
    
    // Also run after a short delay to catch any dynamically loaded content
    setTimeout(() => {
        connectExistingPasswordButtons();
    }, 1000);
}

// === EXPORT FOR TESTING ===
window.passwordModalSystem = {
    openModal: window.openPasswordModal,
    closeModal: window.closePasswordModal,
    toggleVisibility: window.togglePasswordVisibility,
    validateForm: validatePasswordForm,
    changePassword: changePassword,
    connectButtons: connectExistingPasswordButtons
};

// Auto-initialize when script loads
initializePasswordModal();

/**
 * 🔐 Wachtwoord Modal Systeem - Succesvol Geladen
 * 
 * Het wachtwoord modal systeem is volledig geïnitialiseerd en klaar voor gebruik.
 * Alle functionaliteiten zijn beschikbaar:
 * - Modal openen/sluiten
 * - Wachtwoord validatie
 * - Event listeners
 * - API integratie
 * 
 * Het systeem is automatisch gestart en zal alle wachtwoord wijziging
 * knoppen in de applicatie detecteren en verbinden.
 */