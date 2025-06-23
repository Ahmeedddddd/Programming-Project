/**
 * 📝 register.js - Registratie systeem voor CareerLaunch EHB
 * 
 * Dit bestand beheert het registratieproces voor nieuwe gebruikers:
 * - Studenten registratie met persoonlijke gegevens en projectinformatie
 * - Bedrijven registratie met bedrijfsprofiel en contactgegevens
 * - Dynamische formulier validatie en real-time feedback
 * - Bestandsupload voor bedrijfslogo's
 * - Gebruikerstype switching tussen student en bedrijf
 * 
 * Belangrijke functionaliteiten:
 * - Real-time formulier validatie met visuele feedback
 * - Dynamische velden die verschijnen/verdwijnen op basis van gebruikerstype
 * - File upload handling met type- en groottevalidatie
 * - Uitgebreide error handling met gebruiksvriendelijke meldingen
 * - Automatische redirects na succesvolle registratie
 * - Wachtwoordsterkte validatie
 * - Responsive design ondersteuning
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

// 🎯 Globale variabelen voor registratie management
let currentUserType = 'bedrijf'; // Standaard gebruikerstype bij het laden van de pagina

/**
 * 🔄 Schakelt tussen verschillende gebruikerstypes
 * Past het formulier dynamisch aan op basis van het geselecteerde type
 * 
 * Deze functie:
 * - Update de globale currentUserType variabele
 * - Past de UI aan door actieve states te wijzigen
 * - Roept setRequiredFields() aan voor veldvalidatie
 * - Roept updateFormContent() aan voor tekst updates
 * 
 * @param {string} type - Het gewenste gebruikerstype ('student' of 'bedrijf')
 * @returns {void}
 */
function switchUserType(type) {
  // Update globale variabele
  currentUserType = type;
  
  // Update UI elementen voor gebruikerstype selectie
  const studentOption = document.querySelector('.toggle-option[data-type="student"]');
  const bedrijfOption = document.querySelector('.toggle-option[data-type="bedrijf"]');
  
  if (studentOption && bedrijfOption) {
    // Verwijder actieve klasse van alle opties
    studentOption.classList.remove('active');
    bedrijfOption.classList.remove('active');
    
    // Voeg actieve klasse toe aan geselecteerde optie
    if (type === 'student') {
      studentOption.classList.add('active');
    } else {
      bedrijfOption.classList.add('active');
    }
  }
  
  // Pas formulier velden aan op basis van type
  setRequiredFields(type);
  
  // Update formulier titel en beschrijving
  updateFormContent(type);
}

/**
 * 📋 Stelt vereiste velden in op basis van gebruikerstype
 * 
 * Deze functie zorgt ervoor dat alleen relevante velden verplicht zijn:
 * - Studenten: voornaam, achternaam, email, wachtwoord, opleiding, jaar
 * - Bedrijven: naam, email, wachtwoord, sector, gemeente, telefoon
 * 
 * Voorkomt dat gebruikers formulieren kunnen indienen met onvolledige gegevens
 * 
 * @param {string} type - Het gebruikerstype waarvoor velden ingesteld moeten worden
 * @returns {void}
 */
function setRequiredFields(type) {
  // Verwijder eerst alle 'required' attributen om conflicten te voorkomen
  const allInputs = document.querySelectorAll('#registerForm input, #registerForm select, #registerForm textarea');
  allInputs.forEach(input => {
    input.removeAttribute('required');
    const label = input.closest('.form-group')?.querySelector('label');
    if (label) {
      label.classList.remove('required');
    }
  });
  
  // Definieer vereiste velden per gebruikerstype
  const requiredFields = {
    student: ['voornaam', 'achternaam', 'email', 'wachtwoord', 'wachtwoordBevestiging', 'opleiding', 'jaar'],
    bedrijf: ['naam', 'email', 'wachtwoord', 'wachtwoordBevestiging', 'sector', 'gemeente', 'telefoon']
  };
  
  // Voeg 'required' toe aan relevante velden
  const fieldsToRequire = requiredFields[type] || [];
  fieldsToRequire.forEach(fieldName => {
    const field = document.getElementById(fieldName);
    const label = field?.closest('.form-group')?.querySelector('label');
    
    if (field) {
      field.setAttribute('required', 'required');
      if (label) {
        label.classList.add('required');
      }
    }
  });
}

/**
 * 🎨 Werkt formulier content bij op basis van gebruikerstype
 * 
 * Past de titel en beschrijving van het registratieformulier aan
 * om duidelijk te maken welk type account wordt aangemaakt
 * 
 * @param {string} type - Het gebruikerstype ('student' of 'bedrijf')
 * @returns {void}
 */
function updateFormContent(type) {
  const formTitle = document.querySelector('#registerForm h2');
  const formDescription = document.querySelector('#registerForm p');
  
  if (type === 'student') {
    if (formTitle) formTitle.textContent = 'Registreer als Student';
    if (formDescription) formDescription.textContent = 'Maak je account aan om deel te nemen aan Career Launch';
  } else {
    if (formTitle) formTitle.textContent = 'Registreer als Bedrijf';
    if (formDescription) formDescription.textContent = 'Registreer je bedrijf om talent te ontdekken';
  }
}

/**
 * 🎯 Verwerkt het registratie formulier
 * 
 * Deze functie handelt de volledige registratie af:
 * - Valideert formuliergegevens
 * - Controleert wachtwoordsterkte en overeenkomst
 * - Stuurt data naar de backend API
 * - Handelt success/error responses af
 * - Redirect naar juiste homepage bij succes
 * 
 * @param {Event} event - Form submit event object
 * @returns {Promise<void>}
 */
async function handleRegistration(event) {
  event.preventDefault();
  
  // Toon loading state voor betere UX
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Registreren...';
  
  try {
    // Validatie wachtwoorden
    const password = document.getElementById('wachtwoord').value;
    const passwordConfirm = document.getElementById('wachtwoordBevestiging').value;
    
    if (password !== passwordConfirm) {
      throw new Error('Wachtwoorden komen niet overeen');
    }
    
    if (password.length < 8) {
      throw new Error('Wachtwoord moet minimaal 8 karakters bevatten');
    }
    
    // Verzamel form data
    const formData = new FormData(event.target);
    const registrationData = {
      userType: currentUserType,
      wachtwoord: password
    };
    
    // Voeg alle form velden toe (exclusief wachtwoordbevestiging)
    for (let [key, value] of formData.entries()) {
      if (value && key !== 'wachtwoordBevestiging') {
        registrationData[key] = value;
      }
    }
    
    // Stuur registratie request naar backend
    const response = await fetch('/api/registratie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Toon backend validatiefouten indien aanwezig
      if (result.errors) {
        const errorMessages = Object.values(result.errors).flat();
        throw new Error(errorMessages.join(', '));
      }
      
      // Zet token in localStorage en als cookie (voor backend authenticatie)
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userType', currentUserType);
        document.cookie = `authToken=${result.token}; path=/; max-age=86400; SameSite=Strict`;
      }
      
      // Toon succesmelding
      showSuccessMessage('Registratie succesvol! Je wordt doorgestuurd...');
      
      // Redirect naar juiste homepage na 2 seconden
      setTimeout(() => {
        if (currentUserType === 'student') {
          window.location.href = '/student-homepage';
        } else {
          window.location.href = '/bedrijf-homepage';
        }
      }, 2000);
      
    } else {
      throw new Error(result.message || 'Registratie mislukt');
    }
    
  } catch (error) {
    showErrorMessage(error.message || 'Er is een fout opgetreden bij het registreren');
  } finally {
    // Herstel button state
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

/**
 * 🔄 Toont het login formulier
 * 
 * Wordt aangeroepen wanneer gebruiker al een account heeft
 * en naar de login pagina wil navigeren
 * 
 * @returns {void}
 */
function showLoginForm() {
  window.location.href = '/login';
}

/**
 * 🚀 Initialiseer de pagina-functionaliteit wanneer de DOM geladen is
 * 
 * Deze functie zet alle event listeners en initialiseert:
 * - Bestandsupload handling voor bedrijfslogo's
 * - Formulier validatie
 * - Gebruikerstype switching
 * - Error handling
 */
document.addEventListener('DOMContentLoaded', function() {
  // Handler voor de bestands-upload (logo)
  const fileInput = document.getElementById('logo');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Valideer bestandstype (alleen afbeeldingen)
        if (!file.type.startsWith('image/')) {
          showErrorMessage('Selecteer een geldig afbeeldingsbestand');
          this.value = '';
          return;
        }
        
        // Valideer bestandsgrootte (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showErrorMessage('Bestand is te groot. Maximum 5MB toegestaan.');
          this.value = '';
          return;
        }
        
        // Toon bestandsnaam in UI
        const fileNameDisplay = document.querySelector('.file-name');
        if (fileNameDisplay) {
          fileNameDisplay.textContent = file.name;
        }
      }
    });
  }
  
  // Initialiseer het formulier standaard als 'bedrijf'
  switchUserType('bedrijf');
  
  // Voeg form submit handler toe
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
  }
});

/**
 * ❌ Toont foutmelding aan gebruiker
 * 
 * Deze functie creëert een visuele foutmelding die:
 * - Automatisch wordt toegevoegd aan de pagina
 * - Na 5 seconden automatisch verdwijnt
 * - Een duidelijke rode styling heeft
 * - Een waarschuwingsicoon bevat
 * 
 * @param {string} message - Foutmelding om te tonen
 * @returns {void}
 */
function showErrorMessage(message) {
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
  
  // Voeg toe voor het formulier
  const form = document.getElementById('registerForm');
  if (form && form.parentNode) {
    form.parentNode.insertBefore(errorDiv, form);
  }
  
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
 * - Na 5 seconden automatisch verdwijnt
 * - Een duidelijke groene styling heeft
 * - Een vinkje-icoon bevat
 * 
 * @param {string} message - Succesmelding om te tonen
 * @returns {void}
 */
function showSuccessMessage(message) {
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
  
  // Voeg toe voor het formulier
  const form = document.getElementById('registerForm');
  if (form && form.parentNode) {
    form.parentNode.insertBefore(successDiv, form);
  }
  
  // Auto-verwijder na 5 seconden
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.remove();
    }
  }, 5000);
}