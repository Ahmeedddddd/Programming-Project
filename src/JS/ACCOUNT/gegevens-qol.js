/**
 * 🎯 gegevens-qol.js - Quality of Life functies voor account- en gegevensbeheer
 * 
 * Dit bestand bevat een verzameling "Quality of Life" (QoL) functies die
 * de gebruikerservaring op account- en gegevensbeheerpagina's verbeteren.
 * Deze functies worden centraal geïnitialiseerd en bieden:
 * 
 * Belangrijke functionaliteiten:
 * - Wachtwoordsterkte-indicator met real-time feedback
 * - Waarschuwing voor onopgeslagen wijzigingen
 * - Real-time veldvalidatie voor e-mail, telefoon en BTW-nummer
 * - Voorbeeldweergave van profielfoto's
 * - Slimme auto-aanvulling voor veelgebruikte velden
 * - Kopieerknop voor accountinformatie
 * - Visuele feedback voor alle gebruikersacties
 * 
 * @version 1.0.0
 * @author CareerLaunch EHB Team
 * @since 2024
 */

/**
 * 🚀 Initialiseert alle QoL-functies voor accountpagina's
 * 
 * Deze hoofdfunctie zet alle quality-of-life features op:
 * - Wachtwoordsterkte monitoring
 * - Onopgeslagen wijzigingen tracking
 * - Real-time formulier validatie
 * - Profielfoto preview functionaliteit
 * - Auto-aanvulling voor veelgebruikte velden
 * - Account informatie kopieer functionaliteit
 * 
 * Wordt aangeroepen wanneer de DOM geladen is.
 * 
 * @returns {void}
 */
function initializeAccountQoL() {
  // 1. 🔒 Wachtwoordsterkte-indicator
  initializePasswordStrength();
  
  // 2. ⚠️ Waarschuwing voor onopgeslagen wijzigingen
  initializeUnsavedChangesWarning();
  
  // 3. ✅ Real-time veldvalidatie
  initializeFieldValidation();
  
  // 4. 📸 Voorbeeldweergave van profielfoto
  initializeProfilePicturePreview();
  
  // 5. 🔄 Slimme auto-aanvulling voor veelgebruikte velden
  initializeSmartAutoComplete();
  
  // 6. 📋 Kopieerknop voor accountinformatie
  initializeCopyAccountInfo();
}

/**
 * 🔒 Voegt een visuele indicator voor wachtwoordsterkte toe
 * 
 * Deze functie voegt real-time wachtwoordsterkte monitoring toe aan alle
 * wachtwoordvelden. De sterkte wordt berekend en visueel weergegeven
 * met een kleurgecodeerde balk en beschrijvende tekst.
 * 
 * Features:
 * - Real-time sterkte berekening
 * - Visuele kleurgecodeerde balk
 * - Beschrijvende tekst (Zwak, Gemiddeld, Sterk, Zeer sterk)
 * - Automatische styling en animaties
 * 
 * @returns {void}
 */
function initializePasswordStrength() {
  const passwordFields = document.querySelectorAll('input[type="password"]');
  
  passwordFields.forEach(field => {
    if (field.name === 'password' || field.id === 'password') {
      // Maak sterkte indicator element
      const indicator = document.createElement('div');
      indicator.className = 'password-strength';
      indicator.style.cssText = `
        margin-top: 0.5rem;
        height: 4px;
        background: #e5e5e5;
        border-radius: 2px;
        overflow: hidden;
        transition: all 0.3s ease;
      `;
      
      // Maak voortgangsbalk
      const bar = document.createElement('div');
      bar.style.cssText = `
        height: 100%;
        width: 0%;
        transition: all 0.3s ease;
        border-radius: 2px;
      `;
      
      indicator.appendChild(bar);
      field.parentNode.insertBefore(indicator, field.nextSibling);
      
      // Voeg beschrijvende tekst toe
      const strengthText = document.createElement('small');
      strengthText.style.cssText = `
        display: block;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        color: #666;
      `;
      indicator.appendChild(strengthText);
      
      // Event listener voor real-time updates
      field.addEventListener('input', () => {
        const password = field.value;
        const strength = calculatePasswordStrength(password);
        
        bar.style.width = `${strength.percentage}%`;
        bar.style.background = strength.color;
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
      });
    }
  });
}

/**
 * 📊 Berekent de sterkte van een wachtwoord op basis van een puntensysteem
 * 
 * Deze functie analyseert een wachtwoord op verschillende criteria:
 * - Lengte (minimum 8 karakters)
 * - Kleine letters (a-z)
 * - Hoofdletters (A-Z)
 * - Cijfers (0-9)
 * - Speciale karakters
 * 
 * Elke criteria levert punten op die samen de totale sterkte bepalen.
 * 
 * @param {string} password - Het te controleren wachtwoord
 * @returns {Object} Object met percentage, kleur en beschrijvende tekst
 * @returns {number} returns.percentage - Percentage sterkte (0-100)
 * @returns {string} returns.color - Hex kleurcode voor de indicator
 * @returns {string} returns.text - Beschrijvende tekst (Zwak, Gemiddeld, etc.)
 */
function calculatePasswordStrength(password) {
  let score = 0;
  
  // Lengte check (25 punten voor 8+ karakters)
  if (password.length >= 8) score += 25;
  
  // Karakter type checks
  if (password.match(/[a-z]/)) score += 25;  // Kleine letters
  if (password.match(/[A-Z]/)) score += 25;  // Hoofdletters
  if (password.match(/[0-9]/)) score += 15;  // Cijfers
  if (password.match(/[^a-zA-Z0-9]/)) score += 10;  // Speciale karakters
  
  // Bepaal sterkte niveau op basis van score
  if (score < 30) return { percentage: 25, color: '#dc2626', text: 'Zwak' };
  if (score < 60) return { percentage: 50, color: '#f59e0b', text: 'Gemiddeld' };
  if (score < 90) return { percentage: 75, color: '#10b981', text: 'Sterk' };
  return { percentage: 100, color: '#059669', text: 'Zeer sterk' };
}

/**
 * ⚠️ Implementeert een waarschuwingssysteem voor onopgeslagen wijzigingen
 * 
 * Deze functie monitort alle formuliervelden en waarschuwt de gebruiker
 * wanneer deze de pagina probeert te verlaten met onopgeslagen wijzigingen.
 * 
 * Features:
 * - Real-time tracking van veldwijzigingen
 * - Visuele indicator voor onopgeslagen wijzigingen
 * - Browser waarschuwing bij pagina verlaten
 * - Automatische reset bij formulier submit
 * 
 * @returns {void}
 */
function initializeUnsavedChangesWarning() {
  let hasUnsavedChanges = false;
  const originalValues = new Map();
  
  // Sla originele waarden op voor vergelijking
  document.querySelectorAll('input, textarea, select').forEach(field => {
    if (field.type !== 'submit' && field.type !== 'button') {
      originalValues.set(field, field.value);
    }
  });
  
  // Monitor wijzigingen in alle velden
  document.querySelectorAll('input, textarea, select').forEach(field => {
    if (field.type !== 'submit' && field.type !== 'button') {
      field.addEventListener('input', () => {
        hasUnsavedChanges = originalValues.get(field) !== field.value;
        updateUnsavedIndicator();
      });
    }
  });
  
  // Waarschuw bij pagina verlaten
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'Je hebt onopgeslagen wijzigingen. Weet je zeker dat je wilt vertrekken?';
      return e.returnValue;
    }
  });
  
  // Reset bij formulier submit
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      hasUnsavedChanges = false;
    });
  });
  
  /**
   * Toont of verbergt de indicator voor onopgeslagen wijzigingen
   * 
   * Deze private functie beheert de visuele indicator die
   * waarschuwt voor onopgeslagen wijzigingen
   * 
   * @private
   * @returns {void}
   */
  function updateUnsavedIndicator() {
    let indicator = document.getElementById('unsaved-indicator');
    
    if (hasUnsavedChanges && !indicator) {
      // Maak nieuwe indicator
      indicator = document.createElement('div');
      indicator.id = 'unsaved-indicator';
      indicator.innerHTML = '⚠️ Onopgeslagen wijzigingen';
      indicator.style.cssText = `
        position: fixed;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        background: #f59e0b;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        z-index: 9999;
        animation: slideDown 0.3s ease;
      `;
      document.body.appendChild(indicator);
    } else if (!hasUnsavedChanges && indicator) {
      // Verwijder indicator
      indicator.remove();
    }
  }
}

/**
 * ✅ Voegt real-time validatie toe aan inputvelden
 * 
 * Deze functie implementeert real-time validatie voor:
 * - E-mail adressen (standaard e-mail formaat)
 * - Telefoonnummers (Belgisch formaat)
 * - BTW-nummers (Belgisch BTW formaat)
 * 
 * Validatie wordt uitgevoerd wanneer het veld de focus verliest (on-blur)
 * en toont visuele feedback aan de gebruiker.
 * 
 * @returns {void}
 */
function initializeFieldValidation() {
  const validationRules = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[0-9\s\-\(\)]{10,}$/,
    tva: /^BE\s?[0-9]{4}\.?[0-9]{3}\.?[0-9]{3}$/
  };
  
  document.querySelectorAll('input').forEach(field => {
    const fieldType = field.type.toLowerCase();
    const fieldName = field.name.toLowerCase();
    
    let validator = null;
    
    // Bepaal juiste validator op basis van veldtype/naam
    if (fieldType === 'email' || fieldName.includes('email')) {
      validator = validationRules.email;
    } else if (fieldName.includes('phone') || fieldName.includes('telefoon')) {
      validator = validationRules.phone;
    } else if (fieldName.includes('tva') || fieldName.includes('btw')) {
      validator = validationRules.tva;
    }
    
    // Voeg validatie toe indien validator gevonden
    if (validator) {
      field.addEventListener('blur', () => {
        const isValid = validator.test(field.value) || field.value === '';
        showFieldValidation(field, isValid);
      });
    }
  });
}

/**
 * 🎨 Toont visuele feedback voor veldvalidatie
 * 
 * Deze functie toont real-time visuele feedback voor de validatie
 * van inputvelden. Het toont een groene vinkje voor geldige waarden
 * en een rode X voor ongeldige waarden.
 * 
 * @param {HTMLElement} field - Het inputveld dat gevalideerd is
 * @param {boolean} isValid - True als de waarde geldig is, anders false
 * @returns {void}
 */
function showFieldValidation(field, isValid) {
  // Verwijder bestaande validatie feedback
  const existingFeedback = field.parentNode.querySelector('.validation-feedback');
  if (existingFeedback) existingFeedback.remove();
  
  if (field.value !== '') {
    const feedback = document.createElement('div');
    feedback.className = 'validation-feedback';
    feedback.style.cssText = `
      margin-top: 0.25rem;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    `;
    
    if (isValid) {
      feedback.innerHTML = '✅ Geldig';
      feedback.style.color = '#10b981';
      field.style.borderColor = '#10b981';
    } else {
      feedback.innerHTML = '❌ Controleer het formaat';
      feedback.style.color = '#dc2626';
      field.style.borderColor = '#dc2626';
    }
    
    field.parentNode.insertBefore(feedback, field.nextSibling);
    
    // Auto-verberg na 3 seconden
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
        field.style.borderColor = '';
      }
    }, 3000);
  }
}

/**
 * 📸 Maakt het mogelijk om een voorvertoning van een geselecteerde afbeelding te tonen
 * 
 * Deze functie voegt preview functionaliteit toe aan alle file inputs
 * die afbeeldingen accepteren. Gebruikers kunnen direct zien welke
 * afbeelding ze hebben geselecteerd voordat ze het formulier indienen.
 * 
 * Features:
 * - Real-time preview van geselecteerde afbeeldingen
 * - Bestandsinformatie weergave (naam, grootte)
 * - Verwijderknop voor geselecteerde afbeelding
 * - Responsive preview met maximale afmetingen
 * 
 * @returns {void}
 */
function initializeProfilePicturePreview() {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  
  fileInputs.forEach(input => {
    if (input.accept && input.accept.includes('image')) {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            showImagePreview(input, e.target.result, file);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  });
}

/**
 * 🖼️ Creëert en toont de voorvertoning van een afbeelding
 * 
 * Deze functie genereert een visuele preview van een geselecteerde
 * afbeelding met bestandsinformatie en een verwijderknop.
 * 
 * @param {HTMLElement} input - De file input die de afbeelding heeft ontvangen
 * @param {string} src - De data-URL van de afbeelding (gegenereerd door FileReader)
 * @param {File} file - Het geselecteerde bestandsobject, voor extra informatie
 * @returns {void}
 */
function showImagePreview(input, src, file) {
  let preview = input.parentNode.querySelector('.image-preview');
  
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.style.cssText = `
      margin-top: 1rem;
      padding: 1rem;
      border: 2px dashed #881538;
      border-radius: 8px;
      text-align: center;
      background: rgba(136, 21, 56, 0.05);
    `;
    input.parentNode.appendChild(preview);
  }
  
  preview.innerHTML = `
    <img src="${src}" alt="Preview" style="
      max-width: 150px;
      max-height: 150px;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    ">
    <div style="font-size: 0.9rem; color: #666;">
      📁 ${file.name}<br>
      📊 ${(file.size / 1024).toFixed(1)} KB
    </div>
    <button type="button" onclick="this.parentNode.remove()" style="
      margin-top: 0.5rem;
      background: #dc2626;
      color: white;
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      cursor: pointer;
    ">❌ Verwijderen</button>
  `;
}

/**
 * 🔄 Voegt een auto-aanvul (autocomplete) functionaliteit toe aan tekstvelden
 * 
 * Deze functie implementeert slimme auto-aanvulling voor veelgebruikte velden
 * zoals voornamen, achternamen, steden en bedrijfsnamen. Het gebruikt
 * vooraf gedefinieerde lijsten van veelvoorkomende waarden.
 * 
 * Features:
 * - Automatische detectie van veldtype op basis van naam/ID
 * - Real-time filtering van suggesties
 * - Dropdown interface voor suggesties
 * - Keyboard navigatie ondersteuning
 * 
 * @returns {void}
 */
function initializeSmartAutoComplete() {
  const commonValues = {
    'firstname': ['Jan', 'Pieter', 'Marie', 'Anna', 'Tom', 'Lisa'],
    'lastname': ['Janssen', 'Peeters', 'Dubois', 'Mertens', 'Willems'],
    'city': ['Brussel', 'Antwerpen', 'Gent', 'Leuven', 'Mechelen', 'Hasselt'],
    'company': ['TechCorp', 'InnovateNV', 'StartupBe', 'ConsultingGroup']
  };
  
  document.querySelectorAll('input[type="text"]').forEach(input => {
    const fieldName = input.name.toLowerCase() || input.id.toLowerCase();
    
    Object.keys(commonValues).forEach(key => {
      if (fieldName.includes(key)) {
        addAutoComplete(input, commonValues[key]);
      }
    });
  });
}

/**
 * 🔽 Bouwt de dropdown voor de auto-aanvul functionaliteit en koppelt de events
 * 
 * Deze functie creëert een volledig functionele autocomplete dropdown
 * met keyboard navigatie en click events voor het selecteren van suggesties.
 * 
 * @param {HTMLElement} input - Het inputveld waaraan de functionaliteit wordt gekoppeld
 * @param {string[]} suggestions - Een array met suggesties voor dit veld
 * @returns {void}
 */
function addAutoComplete(input, suggestions) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    display: none;
  `;
  wrapper.appendChild(dropdown);
  
  input.addEventListener('input', () => {
    const value = input.value.toLowerCase();
    
    if (value.length > 0) {
      const matches = suggestions.filter(s => 
        s.toLowerCase().startsWith(value)
      );
      
      if (matches.length > 0) {
        dropdown.innerHTML = matches.map(match => `
          <div class="autocomplete-item" style="
            padding: 0.5rem;
            cursor: pointer;
            border-bottom: 1px solid #eee;
          " data-value="${match}">
            ${match}
          </div>
        `).join('');
        
        dropdown.style.display = 'block';
        
        // Voeg click events toe aan suggesties
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            input.value = item.dataset.value;
            dropdown.style.display = 'none';
          });
        });
      } else {
        dropdown.style.display = 'none';
      }
    } else {
      dropdown.style.display = 'none';
    }
  });
  
  // Verberg dropdown bij focus verlies
  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 200);
  });
}

/**
 * 📋 Kopieerknop voor accountinformatie
 * 
 * Deze functie voegt een kopieerknop toe waarmee gebruikers
 * hun accountinformatie kunnen kopiëren naar het klembord.
 * Handig voor het delen van contactgegevens of het invullen
 * van andere formulieren.
 * 
 * Features:
 * - Kopieert alle relevante accountgegevens
 * - Toont bevestiging van succesvolle kopieeractie
 * - Formateert gegevens in leesbaar formaat
 * - Fallback voor browsers zonder clipboard API
 * 
 * @returns {void}
 */
function initializeCopyAccountInfo() {
  const copyButton = document.createElement('button');
  copyButton.innerHTML = '📋 Kopieer Account Info';
  copyButton.style.cssText = `
    background: #881538;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin: 1rem 0;
    font-size: 0.9rem;
  `;
  
  copyButton.addEventListener('click', async () => {
    const accountData = gatherAccountData();
    const formattedData = Object.entries(accountData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(formattedData);
      copyButton.innerHTML = '✅ Gekopieerd!';
      copyButton.style.background = '#10b981';
      
      setTimeout(() => {
        copyButton.innerHTML = '📋 Kopieer Account Info';
        copyButton.style.background = '#881538';
      }, 2000);
    } catch (error) {
      // Fallback voor oudere browsers
      const textArea = document.createElement('textarea');
      textArea.value = formattedData;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      copyButton.innerHTML = '✅ Gekopieerd!';
      copyButton.style.background = '#10b981';
      
      setTimeout(() => {
        copyButton.innerHTML = '📋 Kopieer Account Info';
        copyButton.style.background = '#881538';
      }, 2000);
    }
  });
  
  // Voeg knop toe aan de pagina
  const container = document.querySelector('.contentKaart') || document.body;
  container.appendChild(copyButton);
}

/**
 * 📊 Verzamelt alle relevante accountgegevens
 * 
 * Deze functie verzamelt alle beschikbare accountgegevens
 * uit het formulier en localStorage voor het kopiëren
 * naar het klembord.
 * 
 * @returns {Object} Object met alle accountgegevens
 */
function gatherAccountData() {
  const data = {};
  
  // Verzamel formuliergegevens
  document.querySelectorAll('input, textarea, select').forEach(field => {
    if (field.value && field.name) {
      const fieldName = field.name.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      data[fieldName] = field.value;
    }
  });
  
  // Voeg localStorage gegevens toe
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');
  
  if (userName) data['Gebruikersnaam'] = userName;
  if (userEmail) data['E-mail'] = userEmail;
  
  return data;
}

// Initialiseer alles wanneer de pagina geladen is.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAccountQoL);
} else {
  initializeAccountQoL();
}