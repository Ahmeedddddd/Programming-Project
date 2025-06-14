// src/JS/password-change.js

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('change-password-form');
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!form) {
        console.log('Password change form not found on this page');
        return;
    }
    
    console.log('🔐 Password change form initialized');
    
    // Real-time password strength indicator
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const strengthIndicator = document.getElementById('password-strength');
    
    if (newPasswordInput && strengthIndicator) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            updateStrengthIndicator(strength);
        });
    }
    
    // Real-time confirm password validation
    if (confirmPasswordInput) {
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
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Client-side validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage('Alle velden zijn verplicht', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('Nieuwe wachtwoorden komen niet overeen', 'error');
            return;
        }
        
        if (newPassword === currentPassword) {
            showMessage('Nieuw wachtwoord moet verschillen van het huidige wachtwoord', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            showMessage('Nieuw wachtwoord moet minimaal 8 karakters zijn', 'error');
            return;
        }
        
        // Check password strength
        const strength = checkPasswordStrength(newPassword);
        if (strength.score < 3) {
            showMessage(`Wachtwoord is te zwak: ${strength.feedback}`, 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            console.log('🚀 Submitting password change request');
            
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include authorization header if you store tokens
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Password changed successfully');
                showMessage('Wachtwoord succesvol gewijzigd!', 'success');
                form.reset();
                
                // Optional: redirect after success
                setTimeout(() => {
                    window.location.href = '/dashboard'; // Of waar je naartoe wilt
                }, 2000);
            } else {
                console.log('❌ Password change failed:', result.message);
                showMessage(result.message || 'Er ging iets mis', 'error');
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            showMessage('Netwerkfout. Controleer je internetverbinding.', 'error');
        } finally {
            setLoadingState(false);
        }
    });
    
    function showMessage(message, type) {
        if (!messageDiv) return;
        
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function setLoadingState(loading) {
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? 'Wijzigen...' : 'Wachtwoord Wijzigen';
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
        
        const colors = ['#ff4444', '#ff8800', '#ffbb00', '#88cc00', '#00cc44'];
        const color = colors[strength.score] || colors[0];
        
        strengthIndicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${(strength.score / 5) * 100}%; background-color: ${color};"></div>
            </div>
            <span class="strength-text" style="color: ${color};">${strength.level}</span>
        `;
    }
    
    function getAuthToken() {
        // Get token from localStorage, sessionStorage, or cookies
        return localStorage.getItem('authToken') || 
               sessionStorage.getItem('authToken') || 
               getCookie('authToken') || '';
    }
    
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }
});