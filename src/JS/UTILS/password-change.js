// src/JS/UTILS/password-change.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Password change page loaded');
    
    const form = document.getElementById('change-password-form');
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!form) {
        console.log('Password change form not found on this page');
        return;
    }
    
    console.log('✅ Password change form initialized');
    
    // Get form elements
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const strengthIndicator = document.getElementById('password-strength');
    
    // Real-time password strength indicator
    if (newPasswordInput && strengthIndicator) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            updateStrengthIndicator(strength);
        });
    }
    
    // Real-time confirm password validation
    if (confirmPasswordInput && newPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const newPassword = newPasswordInput.value;
            const confirmPassword = this.value;
            
            if (confirmPassword && newPassword !== confirmPassword) {
                this.setCustomValidity('Wachtwoorden komen niet overeen');
                this.classList.add('invalid');
            } else {
                this.setCustomValidity('');
                this.classList.remove('invalid');
            }
        });
    }
    
    // Form submission - Calls your working API!
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('🚀 Password change form submitted');
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Client-side validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage('Alle velden zijn verplicht', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('Nieuwe wachtwoorden komen niet overeen', 'error');
            confirmPasswordInput.classList.add('invalid');
            return;
        }
        
        if (newPassword === currentPassword) {
            showMessage('Nieuw wachtwoord moet verschillen van het huidige wachtwoord', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            showMessage('Nieuw wachtwoord moet minimaal 8 karakters zijn', 'error');
            newPasswordInput.classList.add('invalid');
            return;
        }
        
        // Check password strength
        const strength = checkPasswordStrength(newPassword);
        if (strength.score < 3) {
            showMessage(`Wachtwoord is te zwak: ${strength.feedback}`, 'error');
            newPasswordInput.classList.add('invalid');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            console.log('📡 Sending password change request to /api/auth/change-password');
            
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Password changed successfully via stored procedure');
                console.log('Method used:', result.method);
                
                showMessage(`Wachtwoord succesvol gewijzigd! 🎉`, 'success');
                form.reset();
                
                // Clear strength indicator
                if (strengthIndicator) {
                    strengthIndicator.innerHTML = '';
                }
                
                // Optional: redirect after success
                setTimeout(() => {
                    if (confirm('Wachtwoord gewijzigd! Wil je terug naar je account?')) {
                        window.location.href = '../ACCOUNT/'; // Pas aan naar jouw account pagina
                    }
                }, 3000);
            } else {
                console.log('❌ Password change failed:', result.message);
                showMessage(result.message || 'Er ging iets mis', 'error');
                
                // Highlight relevant field based on error
                if (result.message && result.message.includes('huidige wachtwoord')) {
                    currentPasswordInput.classList.add('invalid');
                } else if (result.message && result.message.includes('recent gebruikt')) {
                    newPasswordInput.classList.add('invalid');
                }
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            showMessage('Netwerkfout. Controleer je internetverbinding en probeer opnieuw.', 'error');
        } finally {
            setLoadingState(false);
        }
    });
    
    // Remove invalid class on input
    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                this.classList.remove('invalid');
            });
        }
    });
    
    function showMessage(message, type) {
        // Use the global notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback to local message div if notification system not available
            if (!messageDiv) return;
            
            messageDiv.textContent = message;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 8000);
            }
            
            // Scroll to message
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    function setLoadingState(loading) {
        if (submitBtn) {
            submitBtn.disabled = loading;
            if (loading) {
                submitBtn.textContent = '';
            } else {
                submitBtn.textContent = 'Wachtwoord Wijzigen';
            }
        }
        
        // Disable form inputs
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = loading;
        });
    }
    
    function checkPasswordStrength(password) {
        let score = 0;
        let feedback = [];
        
        if (password.length >= 8) score++;
        else feedback.push('minimaal 8 karakters');
        
        if (/[a-z]/.test(password)) score++;
        else feedback.push('kleine letters');
        
        if (/[A-Z]/.test(password)) score++;
        else feedback.push('hoofdletters');
        
        if (/[0-9]/.test(password)) score++;
        else feedback.push('cijfers');
        
        if (/[^A-Za-z0-9]/.test(password)) score++;
        else feedback.push('speciale tekens');
        
        const levels = ['Zeer zwak', 'Zwak', 'Redelijk', 'Sterk', 'Zeer sterk'];
        
        return {
            score,
            level: levels[score] || 'Zeer zwak',
            feedback: feedback.join(', ')
        };
    }
    
    function updateStrengthIndicator(strength) {
        if (!strengthIndicator) return;
        
        // Bordeaux color scheme
        const colors = ['#dc3545', '#fd7e14', '#ffc107', '#881538', '#28a745'];
        const color = colors[strength.score] || colors[0];
        
        strengthIndicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${(strength.score / 5) * 100}%; background-color: ${color};"></div>
            </div>
            <span class="strength-text" style="color: ${color};">${strength.level}</span>
        `;
    }
    
    function getAuthToken() {
        // Get token from various storage methods
        return localStorage.getItem('authToken') || 
               localStorage.getItem('token') ||
               localStorage.getItem('jwt') ||
               sessionStorage.getItem('authToken') || 
               sessionStorage.getItem('token') ||
               sessionStorage.getItem('jwt') ||
               getCookie('authToken') || 
               getCookie('token') || 
               getCookie('jwt') || '';
    }
    
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }
});