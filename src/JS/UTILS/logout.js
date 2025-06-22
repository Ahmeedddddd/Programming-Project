//src/JS/UTILS/logout.js - Universele uitlog functie

/**
 * Universele logout functie voor alle gebruikerstypes
 * Werkt voor student, bedrijf en organisator accounts
 */

const API_BASE_URL = 'http://localhost:8383';

class LogoutSystem {
  
  /**
   * Hoofdfunctie voor uitloggen
   * @param {boolean} showConfirmation - Toon bevestiging dialog
   * @param {string} redirectUrl - URL om naar te redirecten (default: homepage)
   */
  static async logout(showConfirmation = true, redirectUrl = '/') {
    try {
      // Optionele bevestiging
      if (showConfirmation) {
        const confirmed = await this.showLogoutConfirmation();
        if (!confirmed) {
          return false; // Gebruiker heeft geannuleerd
        }
      }

      console.log('🚪 Starting logout process...');

      // Toon loading state
      this.showLoadingState(true);

      // 1. Probeer server-side logout (als token geldig is)
      await this.serverLogout();

      // 2. Clear alle client-side data
      this.clearClientData();

      // 3. Clear rate limiting data
      this.clearRateLimitData();

      // 4. Toon success message
      this.showLogoutSuccess();

      // 5. Redirect na korte delay
      setTimeout(() => {
        this.redirectToPage(redirectUrl);
      }, 1500);

      return true;

    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Zelfs bij server errors, clear lokale data
      this.clearClientData();
      
      // Toon error maar log wel uit
      this.showLogoutError();
      
      setTimeout(() => {
        this.redirectToPage(redirectUrl);
      }, 2000);

      return true; // Altijd succesvol omdat lokale data is gewist
    } finally {
      this.showLoadingState(false);
    }
  }

  /**
   * Server-side logout (invalideer token op server)
   */
  static async serverLogout() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.log('No token found, skipping server logout');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Server logout successful');
      } else {
        console.warn('⚠️ Server logout failed, but continuing with client logout');
      }
    } catch (error) {
      console.warn('⚠️ Server logout request failed:', error.message);
      // Continue met client logout zelfs als server fails
    }
  }

  /**
   * Clear alle client-side authentication data
   */
  static clearClientData() {
    console.log('🧹 Clearing client-side data...');
    
    // Clear authentication data
    const authKeys = [
      'authToken',
      'userType', 
      'userId',
      'userEmail',
      'refreshToken', // Als je refresh tokens gebruikt
      'sessionData'   // Eventuele andere session data
    ];

    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key); // Ook sessionStorage clearen
    });

    // Clear cookies indien gebruikt
    this.clearAuthCookies();

    console.log('✅ Client data cleared');
  }

  /**
   * Clear authentication cookies
   */
  static clearAuthCookies() {
    const cookiesToClear = ['authToken', 'userSession', 'loginData'];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
  }

  /**
   * Clear rate limiting data voor fresh start bij volgende login
   */
  static clearRateLimitData() {
    const rateLimitKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('rateLimit_')
    );
    
    rateLimitKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`🕐 Cleared ${rateLimitKeys.length} rate limit entries`);
  }

  /**
   * Toon bevestiging dialog
   */
  static async showLogoutConfirmation() {
    return new Promise((resolve) => {
      // Gebruik moderne dialog als beschikbaar, anders fallback naar confirm
      if (typeof window.showCustomDialog === 'function') {
        window.showCustomDialog({
          title: 'Uitloggen',
          message: 'Weet je zeker dat je wilt uitloggen?',
          confirmText: 'Uitloggen',
          cancelText: 'Annuleren',
          type: 'warning'
        }).then(resolve);
      } else {
        // Fallback naar browser confirm
        resolve(confirm('Weet je zeker dat je wilt uitloggen?'));
      }
    });
  }

  /**
   * Toon loading state tijdens logout
   */
  static showLoadingState(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // Disable logout buttons om dubbele clicks te voorkomen
    const logoutButtons = document.querySelectorAll('.uitloggenBtn, [onclick*="logout"], [onclick*="logOut"]');
    logoutButtons.forEach(btn => {
      btn.style.pointerEvents = show ? 'none' : 'auto';
      btn.style.opacity = show ? '0.6' : '1';
    });
  }

  /**
   * Toon success message
   */
  static showLogoutSuccess() {
    this.showMessage('Je bent succesvol uitgelogd. Tot ziens!', 'success');
  }

  /**
   * Toon error message
   */
  static showLogoutError() {
    this.showMessage('Er ging iets mis bij het uitloggen, maar je bent wel lokaal uitgelogd.', 'warning');
  }

  /**
   * Universele message functie
   */
  static showMessage(message, type = 'info') {
    // Probeer bestaande message systeem te gebruiken
    if (typeof window.showMessage === 'function') {
      window.showMessage(message, type);
      return;
    }

    // Fallback: create simple message
    const messageDiv = document.createElement('div');
    messageDiv.className = `logout-message ${type}`;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#d4edda' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
      color: ${type === 'success' ? '#155724' : type === 'warning' ? '#856404' : '#0c5460'};
      border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
      border-radius: 4px;
      padding: 12px 16px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    messageDiv.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        float: right;
        cursor: pointer;
        margin-left: 10px;
        font-weight: bold;
      ">&times;</button>
    `;

    document.body.appendChild(messageDiv);

    // Auto remove
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 4000);
  }

  /**
   * Redirect naar opgegeven pagina
   */
  static redirectToPage(url) {
    console.log(`🚀 Redirecting to: ${url}`);
    window.location.href = url;
  }

  /**
   * Check of gebruiker is ingelogd
   */
  static isLoggedIn() {
    return !!(localStorage.getItem('authToken') && localStorage.getItem('userType'));
  }

  /**
   * Get huidige gebruiker type
   */
  static getCurrentUserType() {
    return localStorage.getItem('userType');
  }

  /**
   * Quick logout zonder bevestiging (voor automatische logouts)
   */
  static async quickLogout(reason = 'Session expired') {
    console.log(`⚡ Quick logout: ${reason}`);
    return await this.logout(false, '/login');
  }
}

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Globale logout functie voor gebruik in HTML onclick
 */
window.logOut = function() {
  LogoutSystem.logout();
};

/**
 * Alternative spelling
 */
window.logout = function() {
  LogoutSystem.logout();
};

/**
 * Quick logout zonder bevestiging
 */
window.quickLogout = function(reason) {
  LogoutSystem.quickLogout(reason);
};

// ===== AUTO-LOGOUT BIJ PAGE LOAD CHECKS =====

document.addEventListener('DOMContentLoaded', function() {
  // Check of token expired is
  checkTokenExpiry();
  
  // Setup event listeners voor logout buttons
  setupLogoutListeners();
  
  console.log('🔐 Logout system initialized');
});

/**
 * Check token expiry en auto-logout als nodig
 */
function checkTokenExpiry() {
  const token = localStorage.getItem('authToken');
  
  if (!token) return;

  try {
    // Decode JWT token om expiry te checken (zonder externe library)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      console.log('🕐 Token expired, auto-logging out...');
      LogoutSystem.quickLogout('Token expired');
    }
  } catch (error) {
    console.warn('Could not parse token for expiry check:', error);
  }
}

/**
 * Setup event listeners voor alle logout elements
 */
function setupLogoutListeners() {
  // Find alle logout buttons/links
  const logoutElements = document.querySelectorAll(`
    .uitloggenBtn,
    [href*="uitloggen"],
    [onclick*="logout"],
    [onclick*="logOut"],
    [data-action="logout"]
  `);

  logoutElements.forEach(element => {
    // Remove bestaande onclick handlers
    element.removeAttribute('onclick');
    
    // Add nieuwe event listener
    element.addEventListener('click', function(e) {
      e.preventDefault();
      LogoutSystem.logout();
    });
    
    console.log('🔗 Logout listener added to element:', element);
  });
}

// ===== EXPORT VOOR MODULE GEBRUIK =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogoutSystem;
}

// ===== SECURITY: CLEAR DATA ON WINDOW UNLOAD =====
window.addEventListener('beforeunload', function() {
  // Clear sensitive data als je wilt (optioneel)
  // LogoutSystem.clearClientData();
});

// Add CSS voor animaties
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.logout-message {
  animation: slideIn 0.3s ease-out;
}

.uitloggenBtn:hover {
  background-color: #ff6b6b;
  color: white;
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

.uitloggenBtn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
`;
document.head.appendChild(style);

console.log('🔐 Logout system loaded successfully');