/**
 * 🔒 security.js - Frontend Security Validatie voor CareerLaunch EHB
 * 
 * Dit bestand beheert alle frontend security validatie en beveiligingsmaatregelen:
 * - Wachtwoord sterkte validatie
 * - Email en telefoonnummer validatie
 * - TVA nummer validatie (Belgisch)
 * - Input sanitization en XSS preventie
 * - Rate limiting en beveiligingscontroles
 * 
 * Belangrijke functionaliteiten:
 * - Uitgebreide wachtwoord sterkte controle
 * - Belgische telefoonnummer en TVA validatie
 * - Input sanitization voor XSS preventie
 * - Rate limiting voor API calls
 * - Visuele feedback voor validatie
 * - Secure connection verificatie
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

/**
 * 🔒 SecurityValidator - Hoofdklasse voor security validatie
 * 
 * Deze klasse bevat alle validatie methoden voor beveiliging
 * en data integriteit in de frontend applicatie
 * 
 * @class SecurityValidator
 */
class SecurityValidator {
  
  /**
   * 🔐 Valideert wachtwoord sterkte
   * 
   * Controleert wachtwoord op verschillende criteria:
   * - Minimale lengte van 8 karakters
   * - Hoofdletters en kleine letters
   * - Cijfers en speciale karakters
   * - Geen veelvoorkomende patronen
   * - Geen herhalende karakters
   * 
   * @param {string} password - Het wachtwoord om te valideren
   * @returns {Object} Validatie resultaat met score en bericht
   */
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
  
  /**
   * 📝 Genereert wachtwoord sterkte bericht
   * 
   * @param {Object} requirements - De validatie vereisten
   * @param {number} score - De behaalde score
   * @returns {string} Het bericht over de wachtwoord sterkte
   */
  static getPasswordMessage(requirements, score) {
    if (score >= 6) return 'Zeer sterk wachtwoord';
    if (score >= 5) return 'Sterk wachtwoord';
    if (score >= 4) return 'Matig wachtwoord - overweeg verbetering';
    if (score >= 3) return 'Zwak wachtwoord - niet aanbevolen';
    return 'Zeer zwak wachtwoord - niet acceptabel';
  }
  
  /**
   * 📧 Valideert email adres
   * 
   * Controleert email op formaat, lengte en verdachte patronen
   * 
   * @param {string} email - Het email adres om te valideren
   * @returns {Object} Validatie resultaat met bericht
   */
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
  
  /**
   * 📞 Valideert Belgisch telefoonnummer
   * 
   * Controleert telefoonnummer op Belgische formaten
   * 
   * @param {string} phone - Het telefoonnummer om te valideren
   * @returns {Object} Validatie resultaat met geformatteerd nummer
   */
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
  
  /**
   * 📞 Formatteert Belgisch telefoonnummer
   * 
   * @param {string} phone - Het telefoonnummer om te formatteren
   * @returns {string} Geformatteerd telefoonnummer
   */
  static formatBelgianPhone(phone) {
    const clean = phone.replace(/^\+?32/, '').replace(/^0/, '');
    return `+32 ${clean.substr(0, 1)} ${clean.substr(1, 3)} ${clean.substr(4, 2)} ${clean.substr(6, 2)}`;
  }
  
  /**
   * 🏢 Valideert Belgisch TVA nummer
   * 
   * Controleert TVA nummer op formaat en checksum
   * 
   * @param {string} tva - Het TVA nummer om te valideren
   * @returns {Object} Validatie resultaat met geformatteerd nummer
   */
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
  
  /**
   * 🎓 Valideert studentnummer
   * 
   * Controleert studentnummer op formaat en lengte
   * 
   * @param {string} studentNumber - Het studentnummer om te valideren
   * @returns {Object} Validatie resultaat
   */
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
  
  /**
   * 👤 Valideert naam
   * 
   * Controleert naam op lengte en toegestane karakters
   * 
   * @param {string} name - De naam om te valideren
   * @param {string} fieldName - De veldnaam voor het bericht
   * @returns {Object} Validatie resultaat
   */
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
  
  /**
   * 🏠 Valideert adres gegevens
   * 
   * Controleert alle adres velden op geldigheid
   * 
   * @param {string} street - Straatnaam
   * @param {string} number - Huisnummer
   * @param {string} postcode - Postcode
   * @param {string} city - Gemeente
   * @returns {Object} Validatie resultaat met eventuele fouten
   */
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
      errors: errors,
      message: errors.length === 0 ? 'Geldig adres' : errors.join(', ')
    };
  }
  
  /**
   * 🧹 Sanitizeert input voor XSS preventie
   * 
   * Verwijdert gevaarlijke HTML en script tags
   * 
   * @param {string} input - De input om te sanitizeren
   * @returns {string} Gezuiverde input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  /**
   * ⏱️ Controleert rate limiting
   * 
   * Voorkomt te veel pogingen voor een bepaalde actie
   * 
   * @param {string} action - De actie om te limiteren
   * @param {number} maxAttempts - Maximum aantal pogingen
   * @param {number} windowMs - Tijdsvenster in milliseconden
   * @returns {boolean} Of de actie toegestaan is
   */
  static checkRateLimit(action, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const key = `rateLimit_${action}`;
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(validAttempts));
    
    return true;
  }
  
  /**
   * 🗑️ Wist rate limiting voor een actie
   * 
   * @param {string} action - De actie om rate limiting voor te wissen
   * @returns {void}
   */
  static clearRateLimit(action) {
    const key = `rateLimit_${action}`;
    localStorage.removeItem(key);
  }
  
  /**
   * 👁️ Wisselt wachtwoord zichtbaarheid
   * 
   * @param {string} passwordFieldId - ID van het wachtwoord veld
   * @param {string} toggleButtonId - ID van de toggle knop
   * @returns {void}
   */
  static togglePasswordVisibility(passwordFieldId, toggleButtonId) {
    const passwordField = document.getElementById(passwordFieldId);
    const toggleButton = document.getElementById(toggleButtonId);
    
    if (!passwordField || !toggleButton) return;
    
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
      toggleButton.title = 'Wachtwoord verbergen';
    } else {
      passwordField.type = 'password';
      toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
      toggleButton.title = 'Wachtwoord tonen';
    }
  }
  
  /**
   * 🔒 Controleert beveiligde verbinding
   * 
   * @returns {boolean} Of de verbinding beveiligd is
   */
  static checkSecureConnection() {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  }
  
  /**
   * 🗑️ Wist gevoelige data uit velden
   * 
   * @param {...string} elements - IDs van elementen om te wissen
   * @returns {void}
   */
  static clearSensitiveData(...elements) {
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.value = '';
        element.type = 'password'; // Reset to password type
      }
    });
  }
}

/**
 * 🎨 ValidationUI - UI helper klasse voor validatie feedback
 * 
 * Deze klasse beheert de visuele feedback voor validatie
 * 
 * @class ValidationUI
 */
class ValidationUI {
  
  /**
   * ✅ Toont veld validatie feedback
   * 
   * @param {string} fieldId - ID van het veld
   * @param {Object} validation - Validatie resultaat
   * @returns {void}
   */
  static showFieldValidation(fieldId, validation) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing validation classes
    field.classList.remove('valid', 'invalid');
    
    // Add appropriate class
    if (validation.isValid) {
      field.classList.add('valid');
    } else {
      field.classList.add('invalid');
    }
    
    // Show/hide error message
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      field.parentNode.appendChild(errorElement);
    }
    
    if (!validation.isValid) {
      errorElement.textContent = validation.message;
      errorElement.style.display = 'block';
    } else {
      errorElement.style.display = 'none';
    }
  }
  
  /**
   * 🗑️ Wist veld validatie feedback
   * 
   * @param {string} fieldId - ID van het veld
   * @returns {void}
   */
  static clearFieldValidation(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('valid', 'invalid');
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
  
  /**
   * 💪 Toont wachtwoord sterkte indicator
   * 
   * @param {string} fieldId - ID van het wachtwoord veld
   * @param {string} password - Het wachtwoord
   * @returns {void}
   */
  static showPasswordStrength(fieldId, password) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const validation = SecurityValidator.validatePasswordStrength(password);
    
    // Remove existing strength indicator
    let strengthIndicator = field.parentNode.querySelector('.password-strength');
    if (!strengthIndicator) {
      strengthIndicator = document.createElement('div');
      strengthIndicator.className = 'password-strength';
      field.parentNode.appendChild(strengthIndicator);
    }
    
    // Update strength indicator
    const strengthClass = validation.score >= 5 ? 'strong' : validation.score >= 3 ? 'medium' : 'weak';
    strengthIndicator.className = `password-strength ${strengthClass}`;
    strengthIndicator.textContent = validation.message;
    strengthIndicator.style.display = 'block';
  }
}

// Make classes globally available
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