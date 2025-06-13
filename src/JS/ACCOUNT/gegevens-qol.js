// account-qol.js - Quality of Life features voor account/gegevens pagina's

function initializeAccountQoL() {
  
  // 1. 🔒 Password Strength Indicator
  initializePasswordStrength();
  
  // 2. ⚠️ Unsaved Changes Warning
  initializeUnsavedChangesWarning();
  
  // 3. ✅ Real-time Field Validation
  initializeFieldValidation();
  
  // 4. 📸 Profile Picture Preview
  initializeProfilePicturePreview();
  
  // 5. 🔄 Auto-complete voor veelgebruikte velden
  initializeSmartAutoComplete();
  
  // 6. 📋 Copy Account Info
  initializeCopyAccountInfo();
  
}

// 🔒 Password Strength Indicator
function initializePasswordStrength() {
  const passwordFields = document.querySelectorAll('input[type="password"]');
  
  passwordFields.forEach(field => {
    if (field.name === 'password' || field.id === 'password') {
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
      
      const bar = document.createElement('div');
      bar.style.cssText = `
        height: 100%;
        width: 0%;
        transition: all 0.3s ease;
        border-radius: 2px;
      `;
      
      indicator.appendChild(bar);
      field.parentNode.insertBefore(indicator, field.nextSibling);
      
      const strengthText = document.createElement('small');
      strengthText.style.cssText = `
        display: block;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        color: #666;
      `;
      indicator.appendChild(strengthText);
      
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

function calculatePasswordStrength(password) {
  let score = 0;
  
  if (password.length >= 8) score += 25;
  if (password.match(/[a-z]/)) score += 25;
  if (password.match(/[A-Z]/)) score += 25;
  if (password.match(/[0-9]/)) score += 15;
  if (password.match(/[^a-zA-Z0-9]/)) score += 10;
  
  if (score < 30) return { percentage: 25, color: '#dc2626', text: 'Zwak' };
  if (score < 60) return { percentage: 50, color: '#f59e0b', text: 'Gemiddeld' };
  if (score < 90) return { percentage: 75, color: '#10b981', text: 'Sterk' };
  return { percentage: 100, color: '#059669', text: 'Zeer sterk' };
}

// ⚠️ Unsaved Changes Warning
function initializeUnsavedChangesWarning() {
  let hasUnsavedChanges = false;
  const originalValues = new Map();
  
  // Track original values
  document.querySelectorAll('input, textarea, select').forEach(field => {
    if (field.type !== 'submit' && field.type !== 'button') {
      originalValues.set(field, field.value);
    }
  });
  
  // Monitor changes
  document.querySelectorAll('input, textarea, select').forEach(field => {
    if (field.type !== 'submit' && field.type !== 'button') {
      field.addEventListener('input', () => {
        hasUnsavedChanges = originalValues.get(field) !== field.value;
        updateUnsavedIndicator();
      });
    }
  });
  
  // Warn before leaving
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'Je hebt onopgeslagen wijzigingen. Weet je zeker dat je wilt vertrekken?';
      return e.returnValue;
    }
  });
  
  // Clear on form submit
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      hasUnsavedChanges = false;
    });
  });
  
  function updateUnsavedIndicator() {
    let indicator = document.getElementById('unsaved-indicator');
    
    if (hasUnsavedChanges && !indicator) {
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
      indicator.remove();
    }
  }
}

// ✅ Real-time Field Validation
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
    
    if (fieldType === 'email' || fieldName.includes('email')) {
      validator = validationRules.email;
    } else if (fieldName.includes('phone') || fieldName.includes('telefoon')) {
      validator = validationRules.phone;
    } else if (fieldName.includes('tva') || fieldName.includes('btw')) {
      validator = validationRules.tva;
    }
    
    if (validator) {
      field.addEventListener('blur', () => {
        const isValid = validator.test(field.value) || field.value === '';
        showFieldValidation(field, isValid);
      });
    }
  });
}

function showFieldValidation(field, isValid) {
  // Remove existing validation
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
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
        field.style.borderColor = '';
      }
    }, 3000);
  }
}

// 📸 Profile Picture Preview
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

// 🔄 Smart Auto-complete
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
        
        // Add click handlers
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            input.value = item.getAttribute('data-value');
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
  
  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

// 📋 Copy Account Info
function initializeCopyAccountInfo() {
  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.innerHTML = '📋 Kopieer Gegevens';
  copyButton.className = 'ehbBtn secundair';
  copyButton.style.cssText = `
    position: fixed;
    bottom: 6rem;
    right: 2rem;
    z-index: 998;
    font-size: 0.9rem;
  `;
  
  copyButton.addEventListener('click', async () => {
    const accountData = gatherAccountData();
    
    try {
      await navigator.clipboard.writeText(accountData);
      if (window.showNotification) {
        window.showNotification('📋 Account gegevens gekopieerd!', 'success');
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  });
  
  document.body.appendChild(copyButton);
}

function gatherAccountData() {
  const data = [];
  
  document.querySelectorAll('.ehbVeld').forEach(field => {
    const label = field.querySelector('strong');
    const value = field.textContent.replace(/^[^:]+:\s*/, '').trim();
    
    if (label && value && !value.includes('••••')) {
      data.push(`${label.textContent.replace(':', '')}: ${value}`);
    }
  });
  
  return data.join('\n');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAccountQoL);
} else {
  initializeAccountQoL();
}