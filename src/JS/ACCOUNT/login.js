/**
 * 🔐 login.js - Authenticatie systeem voor CareerLaunch EHB
 * 
 * Dit bestand beheert het inlogproces voor alle gebruikerstypes:
 * - Studenten authenticatie met persoonlijke gegevens
 * - Bedrijven authenticatie met bedrijfsprofiel
 * - Organisatoren authenticatie met admin rechten
 * 
 * Belangrijke functionaliteiten:
 * - Real-time formulier validatie met visuele feedback
 * - Uitgebreide error handling met gebruiksvriendelijke meldingen
 * - Loading states voor betere gebruikerservaring
 * - Automatische redirects naar juiste homepage
 * - JWT token management voor sessiebeheer
 * - Bestaande sessie detectie en automatische redirect
 * - Responsive design ondersteuning
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

// 🌐 API configuratie voor backend communicatie
const API_BASE_URL = 'http://localhost:3301';  // Backend server URL

// 🎯 DOM elementen voor login functionaliteit
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitButton = document.querySelector('.btn');
const loadingOverlay = document.getElementById('loadingOverlay');

// 🚀 Initialiseer wanneer DOM geladen is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLoginSystem);
} else {
  initializeLoginSystem();
}

/**
 * 🎯 Hoofdfunctie voor het initialiseren van het login systeem
 * 
 * Deze functie zet alle benodigde event listeners en checks op:
 * - Controleert of vereiste DOM elementen aanwezig zijn
 * - Controleert op bestaande sessies
 * - Voegt form submit handler toe
 * - Voegt input event listeners toe voor real-time validatie
 * 
 * @returns {void}
 */
function initializeLoginSystem() {
  // Haal DOM elementen op en controleer beschikbaarheid
  if (!loginForm || !emailInput || !passwordInput) {
    return;
  }

  // Controleer of gebruiker al ingelogd is
  checkExistingLogin();
  
  // Voeg form submit handler toe
  loginForm.addEventListener('submit', handleLogin);
  
  // Voeg input event listeners toe voor betere UX
  emailInput.addEventListener('input', clearErrorMessages);
  passwordInput.addEventListener('input', clearErrorMessages);
}

/**
 * 🔍 Controleert of er al een actieve sessie is
 * 
 * Deze functie controleert localStorage op bestaande tokens
 * en redirect automatisch naar de juiste homepage indien
 * de gebruiker al ingelogd is
 * 
 * @returns {void}
 */
function checkExistingLogin() {
  const token = localStorage.getItem('authToken');
  const userType = localStorage.getItem('userType');
  
  if (token && userType) {
    redirectToHomepage(userType);
  }
}

/**
 * 🎯 Verwerkt het login formulier
 * 
 * Deze functie handelt de volledige login af:
 * - Valideert formuliergegevens
 * - Stuurt authenticatie request naar backend
 * - Handelt success/error responses af
 * - Toont loading states tijdens verwerking
 * - Slaat authenticatie data op bij succes
 * 
 * @param {Event} event - Form submit event object
 * @returns {Promise<void>}
 */
async function handleLogin(event) {
  event.preventDefault();
  
  // Verzamel form data
  const formData = new FormData(loginForm);
  const email = formData.get('email');
  const password = formData.get('password');
  
  // Basis validatie van invoervelden
  if (!email || !password) {
    showErrorMessage('Vul alle velden in');
    return;
  }
  
  if (!isValidEmail(email)) {
    showErrorMessage('Voer een geldig e-mailadres in');
    return;
  }
  
  // Toon loading state voor betere UX
  showLoading(true);
  
  try {
    // Stuur authenticatie request naar backend
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      await handleLoginSuccess(data);
    } else {
      // Toon gebruiksvriendelijke foutmeldingen
      let errorMessage = 'Inloggen mislukt';
      
      if (data.error) {
        if (data.error.includes('Invalid credentials')) {
          errorMessage = 'Ongeldige e-mail of wachtwoord';
        } else if (data.error.includes('User not found')) {
          errorMessage = 'Gebruiker niet gevonden';
        } else if (data.error.includes('Account disabled')) {
          errorMessage = 'Account is uitgeschakeld';
        } else {
          errorMessage = data.error;
        }
      }
      
      showErrorMessage(errorMessage);
    }
  } catch (error) {
    showErrorMessage('Netwerkfout. Controleer je verbinding.');
  } finally {
    showLoading(false);
  }
}

/**
 * ✅ Verwerkt succesvolle login
 * 
 * Deze functie handelt een succesvolle login af door:
 * - Authenticatie data op te slaan in localStorage
 * - JWT token als cookie te zetten voor backend
 * - Gebruikersgegevens op te slaan voor later gebruik
 * - Succesmelding te tonen
 * - Redirect naar juiste homepage
 * 
 * @param {Object} data - Login response data van backend
 * @returns {Promise<void>}
 */
async function handleLoginSuccess(data) {
  // Sla authenticatie data op in localStorage
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('userType', data.userType);
  localStorage.setItem('userId', data.userId);
  
  // Zet JWT ook als cookie voor backend authenticatie
  document.cookie = `authToken=${data.token}; path=/; max-age=86400; SameSite=Strict`;
  
  // Sla extra gebruikersdata op voor UI personalisatie
  if (data.user) {
    localStorage.setItem('userName', data.user.naam || data.user.voornaam + ' ' + data.user.achternaam);
    localStorage.setItem('userEmail', data.user.email);
  }
  
  // Toon succesmelding
  showSuccessMessage('Succesvol ingelogd!');
  
  // Redirect naar juiste homepage
  redirectToHomepage(data.userType);
}

/**
 * 🏠 Redirect naar juiste homepage op basis van gebruikerstype
 * 
 * Deze functie bepaalt de juiste homepage URL op basis van
 * het gebruikerstype en voert de redirect uit
 * 
 * @param {string} userType - Type gebruiker ('student', 'bedrijf', 'organisator')
 * @returns {void}
 */
function redirectToHomepage(userType) {
  let homepageUrl = '/';
  
  // Bepaal juiste homepage op basis van gebruikerstype
  switch (userType) {
    case 'student':
      homepageUrl = '/student-homepage';
      break;
    case 'bedrijf':
      homepageUrl = '/bedrijf-homepage';
      break;
    case 'organisator':
      homepageUrl = '/organisator-homepage';
      break;
    default:
      homepageUrl = '/';
      break;
  }
  
  // Voer redirect uit na korte delay
  setTimeout(() => {
    window.location.href = homepageUrl;
  }, 1000);
}

/**
 * 📧 Valideert e-mail formaat
 * 
 * Controleert of de ingevoerde e-mail een geldig formaat heeft
 * volgens standaard e-mail validatie regels
 * 
 * @param {string} email - E-mail om te valideren
 * @returns {boolean} - Of de e-mail geldig is
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * ⏳ Toont of verbergt loading state
 * 
 * Deze functie beheert de visuele loading state tijdens
 * authenticatie requests voor betere gebruikerservaring
 * 
 * @param {boolean} show - Of loading getoond moet worden
 * @returns {void}
 */
function showLoading(show) {
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }
  
  if (submitButton) {
    submitButton.disabled = show;
    submitButton.textContent = show ? 'Inloggen...' : 'Inloggen';
  }
}

/**
 * 🧹 Wist alle foutmeldingen
 * 
 * Deze functie verwijdert alle bestaande foutmeldingen
 * en error styling van input velden
 * 
 * @returns {void}
 */
function clearErrorMessages() {
  const errorMessages = document.querySelectorAll('.login-message.error');
  errorMessages.forEach(msg => msg.remove());
  
  // Verwijder error styling van inputs
  emailInput.classList.remove('error');
  passwordInput.classList.remove('error');
}

/**
 * ❌ Toont foutmelding aan gebruiker
 * 
 * Deze functie creëert een visuele foutmelding die:
 * - Automatisch wordt toegevoegd aan de pagina
 * - Een sluitknop bevat voor handmatige verwijdering
 * - Duidelijke rode styling heeft
 * - Eerdere foutmeldingen verwijdert
 * 
 * @param {string} message - Foutmelding om te tonen
 * @returns {void}
 */
function showErrorMessage(message) {
  clearErrorMessages();
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'login-message error';
  errorDiv.innerHTML = `
    <span>❌ ${message}</span>
    <button class="close-btn" onclick="this.parentElement.remove()">×</button>
  `;
  
  // Voeg toe voor het formulier
  loginForm.insertBefore(errorDiv, loginForm.firstChild);
  
  // Voeg error styling toe aan inputs
  emailInput.classList.add('error');
  passwordInput.classList.add('error');
  
  // Auto-verwijder na 5 seconden
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

/**
 * ✅ Toont succesmelding aan gebruiker
 * 
 * Deze functie creëert een visuele succesmelding die:
 * - Automatisch wordt toegevoegd aan de pagina
 * - Een sluitknop bevat voor handmatige verwijdering
 * - Duidelijke groene styling heeft
 * - Na 5 seconden automatisch verdwijnt
 * 
 * @param {string} message - Succesmelding om te tonen
 * @returns {void}
 */
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'login-message success';
  successDiv.innerHTML = `
    <span>✅ ${message}</span>
    <button class="close-btn" onclick="this.parentElement.remove()">×</button>
  `;
  
  // Voeg toe voor het formulier
  loginForm.insertBefore(successDiv, loginForm.firstChild);
  
  // Auto-verwijder na 5 seconden
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.remove();
    }
  }, 5000);
}