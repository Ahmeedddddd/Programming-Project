// src/JS/UTILS/security.js - Frontend security validation

class SecurityValidator {
  
  // Password strength validation
  static validatePasswordStrength(password) {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommonPatterns: !/(123|abc|password|qwerty|admin)/i.test(password),
      noRepeatingChars: !/(.)\1{2,}/.test(password) // No 3+ repeating chars
    };
    
    const score = Object.values(requirements).filter(Boolean).length;
    const isStrong = score >= 5 && requirements.minLength;
    
    return {
      isValid: isStrong,
      score: score,
      maxScore: Object.keys(requirements).length,
      requirements: requirements,
      message: this.getPasswordMessage(requirements, score)
    };
  }
  
  static getPasswordMessage(requirements, score) {
    if (score >= 6) return 'Zeer sterk wachtwoord';
    if (score >= 5) return 'Sterk wachtwoord';
    if (score >= 4) return 'Matig wachtwoord - overweeg verbetering';
    if (score >= 3) return 'Zwak wachtwoord - niet aanbevolen';
    return 'Zeer zwak wachtwoord - niet acceptabel';
  }
  
  // Email validation
  static validateEmail(email) {
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Ongeldig email formaat' };
    }
    
    // Length check
    if (email.length > 254) {
      return { isValid: false, message: 'Email adres te lang' };
    }
    
    if (email.length < 5) {
      return { isValid: false, message: 'Email adres te kort' };
    }
    
    // Suspicious patterns
    const suspiciousPatterns = [
      { pattern: /^\d+@/, message: 'Verdacht email formaat' },
      { pattern: /@\d+\./, message: 'Verdacht domein' },
      { pattern: /\+.*\+/, message: 'Te veel + tekens' },
      { pattern: /\.{2,}/, message: 'Ongeldige punten' },
      { pattern: /[<>()[\]\\,;:\s@"]/, message: 'Ongeldige karakters' }
    ];
    
    for (const { pattern, message } of suspiciousPatterns) {
      if (pattern.test(email)) {
        return { isValid: false, message: message };
      }
    }
    
    return { isValid: true, message: 'Geldig email adres' };
  }
  
  // Phone number validation (Belgian)
  static validatePhoneNumber(phone) {
    // Remove spaces and formatting
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    
    // Belgian patterns
    const patterns = [
      /^\+32[0-9]{9}$/, // +32 format
      /^0[0-9]{9}$/, // Local format starting with 0
      /^32[0-9]{9}$/ // Without + but with country code
    ];
    
    const isValid = patterns.some(pattern => pattern.test(cleanPhone));
    
    if (!isValid) {
      return { 
        isValid: false, 
        message: 'Geldig Belgisch telefoonnummer vereist (bijv. +32 4 123 45 67 of 0412 34 56 78)' 
      };
    }
    
    return { 
      isValid: true, 
      message: 'Geldig telefoonnummer',
      formatted: this.formatBelgianPhone(cleanPhone)
    };
  }
  
  // Format Belgian phone number
  static formatBelgianPhone(phone) {
    const clean = phone.replace(/^\+?32/, '').replace(/^0/, '');
    return `+32 ${clean.substr(0, 1)} ${clean.substr(1, 3)} ${clean.substr(4, 2)} ${clean.substr(6, 2)}`;
  }
  
  // TVA number validation (Belgian)
  static validateTVANumber(tva) {
    const cleanTVA = tva.replace(/[\s\-\.]/g, '').toUpperCase();
    
    // Must start with BE and have 10 digits
    const tvaPattern = /^BE[0-9]{10}$/;
    
    if (!tvaPattern.test(cleanTVA)) {
      return { 
        isValid: false, 
        message: 'Geldig Belgisch TVA nummer vereist (BE + 10 cijfers, bijv. BE0123456789)' 
      };
    }
    
    // Optional: Add checksum validation for Belgian TVA
    const digits = cleanTVA.substr(2);
    const baseNumber = parseInt(digits.substr(0, 8));
    const checkDigits = parseInt(digits.substr(8, 2));
    const calculatedCheck = 97 - (baseNumber % 97);
    
    if (calculatedCheck !== checkDigits) {
      return { 
        isValid: false, 
        message: 'TVA nummer checksum is ongeldig' 
      };
    }
    
    return { 
      isValid: true, 
      message: 'Geldig TVA nummer',
      formatted: `${cleanTVA.substr(0, 2)} ${cleanTVA.substr(2, 4)} ${cleanTVA.substr(6, 3)} ${cleanTVA.substr(9, 3)}`
    };
  }
  
  // Student number validation
  static validateStudentNumber(studentNumber) {
    const num = parseInt(studentNumber);
    
    if (isNaN(num) || num <= 0) {
      return { isValid: false, message: 'Studentnummer moet een positief getal zijn' };
    }
    
    if (studentNumber.toString().length < 3) {
      return { isValid: false, message: 'Studentnummer moet minimaal 3 cijfers hebben' };
    }
    
    if (studentNumber.toString().length > 6) {
      return { isValid: false, message: 'Studentnummer mag maximaal 6 cijfers hebben' };
    }
    
    return { isValid: true, message: 'Geldig studentnummer' };
  }
  
  // Name validation
  static validateName(name, fieldName = 'Naam') {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: `${fieldName} is verplicht` };
    }
    
    if (name.length < 2) {
      return { isValid: false, message: `${fieldName} moet minimaal 2 karakters hebben` };
    }
    
    if (name.length > 50) {
      return { isValid: false, message: `${fieldName} mag maximaal 50 karakters hebben` };
    }
    
    // Only letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(name)) {
      return { isValid: false, message: `${fieldName} mag alleen letters, spaties, koppeltekens en apostrofes bevatten` };
    }
    
    return { isValid: true, message: `Geldige ${fieldName.toLowerCase()}` };
  }
  
  // Address validation
  static validateAddress(street, number, postcode, city) {
    const errors = [];
    
    if (!street || street.trim().length < 2) {
      errors.push('Straatnaam is verplicht (minimaal 2 karakters)');
    }
    
    if (!number || number.trim().length === 0) {
      errors.push('Huisnummer is verplicht');
    }
    
    if (!/^[0-9]{4}$/.test(postcode)) {
      errors.push('Postcode moet 4 cijfers zijn');
    }
    
    if (!city || city.trim().length < 2) {
      errors.push('Gemeente is verplicht (minimaal 2 karakters)');
    }
    
    return {
      isValid: errors.length === 0,
      message: errors.length === 0 ? 'Geldig adres' : errors.join(', ')
    };
  }
  
  // Input sanitization
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }
  
  // Rate limiting helper (client-side)
  static checkRateLimit(action, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const key = `rateLimit_${action}`;
    const now = Date.now();
    
    let attempts = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Remove old attempts outside window
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (attempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...attempts);
      const timeLeft = Math.ceil((oldestAttempt + windowMs - now) / 1000 / 60);
      
      return {
        allowed: false,
        timeLeft: timeLeft,
        message: `Te veel pogingen. Probeer het over ${timeLeft} minuten opnieuw.`
      };
    }
    
    // Add current attempt
    attempts.push(now);
    localStorage.setItem(key, JSON.stringify(attempts));
    
    return { allowed: true, remaining: maxAttempts - attempts.length };
  }
  
  // Clear rate limit data
  static clearRateLimit(action) {
    localStorage.removeItem(`rateLimit_${action}`);
  }
  
  // Password visibility toggle (secure)
  static togglePasswordVisibility(passwordFieldId, toggleButtonId) {
    const passwordField = document.getElementById(passwordFieldId);
    const toggleButton = document.getElementById(toggleButtonId);
    
    if (!passwordField || !toggleButton) return;
    
    const isPassword = passwordField.type === 'password';
    passwordField.type = isPassword ? 'text' : 'password';
    toggleButton.textContent = isPassword ? '👁️' : '🙈';
    
    // Auto-hide after 3 seconds for security
    if (isPassword) {
      setTimeout(() => {
        if (passwordField.type === 'text') {
          passwordField.type = 'password';
          toggleButton.textContent = '👁️';
        }
      }, 3000);
    }
  }
  
  // Check if running over HTTPS (production requirement)
  static checkSecureConnection() {
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    
    if (!isSecure) {
      console.warn('⚠️ Unsecure connection detected. HTTPS recommended for production.');
      return false;
    }
    
    return true;
  }
  
  // Clear sensitive data from memory
  static clearSensitiveData(...elements) {
    elements.forEach(element => {
      if (typeof element === 'string') {
        const field = document.getElementById(element);
        if (field) field.value = '';
      } else if (element && element.value !== undefined) {
        element.value = '';
      }
    });
  }
}

// Real-time validation UI helpers
class ValidationUI {
  
  static showFieldValidation(fieldId, validation) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing validation
    this.clearFieldValidation(fieldId);
    
    // Add validation styling
    field.classList.remove('valid', 'invalid');
    field.classList.add(validation.isValid ? 'valid' : 'invalid');
    
    // Add validation message
    if (!validation.isValid) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'validation-error';
      errorDiv.textContent = validation.message;
      field.parentNode.appendChild(errorDiv);
    }
  }
  
  static clearFieldValidation(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('valid', 'invalid');
    
    const errorElements = field.parentNode.querySelectorAll('.validation-error');
    errorElements.forEach(el => el.remove());
  }
  
  static showPasswordStrength(fieldId, password) {
    const validation = SecurityValidator.validatePasswordStrength(password);
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing strength indicator
    const existing = field.parentNode.querySelector('.password-strength');
    if (existing) existing.remove();
    
    // Create strength indicator
    const strengthDiv = document.createElement('div');
    strengthDiv.className = 'password-strength';
    
    const strengthBar = document.createElement('div');
    strengthBar.className = 'strength-bar';
    strengthBar.style.width = `${(validation.score / validation.maxScore) * 100}%`;
    
    if (validation.score >= 6) strengthBar.className += ' very-strong';
    else if (validation.score >= 5) strengthBar.className += ' strong';
    else if (validation.score >= 4) strengthBar.className += ' medium';
    else if (validation.score >= 3) strengthBar.className += ' weak';
    else strengthBar.className += ' very-weak';
    
    const strengthText = document.createElement('div');
    strengthText.className = 'strength-text';
    strengthText.textContent = validation.message;
    
    strengthDiv.appendChild(strengthBar);
    strengthDiv.appendChild(strengthText);
    field.parentNode.appendChild(strengthDiv);
  }
}

// Export for use in other files
window.SecurityValidator = SecurityValidator;
window.ValidationUI = ValidationUI;

// Initialize security check
document.addEventListener('DOMContentLoaded', function() {
  SecurityValidator.checkSecureConnection();
  
  // Add CSS for validation UI if not already present
  if (!document.querySelector('#validation-styles')) {
    const styles = document.createElement('style');
    styles.id = 'validation-styles';
    styles.textContent = `
      .validation-error {
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
      }
      
      input.valid {
        border-color: #28a745;
        box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
      }
      
      input.invalid {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
      }
      
      .password-strength {
        margin-top: 5px;
      }
      
      .strength-bar {
        height: 4px;
        border-radius: 2px;
        transition: all 0.3s ease;
      }
      
      .strength-bar.very-weak { background-color: #dc3545; }
      .strength-bar.weak { background-color: #fd7e14; }
      .strength-bar.medium { background-color: #ffc107; }
      .strength-bar.strong { background-color: #20c997; }
      .strength-bar.very-strong { background-color: #28a745; }
      
      .strength-text {
        font-size: 11px;
        margin-top: 2px;
        color: #666;
      }
    `;
    document.head.appendChild(styles);
  }
});