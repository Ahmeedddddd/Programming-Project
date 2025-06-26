// gegevens-organisator.js - Organisator gegevens ophalen en weergeven

console.log('🚀 Organisator gegevens script geladen');

// 🔔 Notification System
window.showNotification = function(message, type = 'success') {
  const container = document.getElementById('notification-container');
  if (!container) {
    console.warn('⚠️ Notification container not found');
    return;
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Auto remove
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 300);
  }, 4000);
};

class OrganisatorGegevens {
  constructor() {
    console.log('📝 OrganisatorGegevens constructor aangeroepen');
    this.token = localStorage.getItem('authToken');
    this.organisatorData = null;
    this.editMode = false;
    
    // Check if init method exists
    if (typeof this.init === 'function') {
      this.init();
    } else {
      console.error('❌ Init method not found');
      this.setupBasicFunctionality();
    }
  }
  
  setupBasicFunctionality() {
    console.log('🔧 Setting up basic functionality');
    if (!this.token) {
      console.warn('⚠️ No token found, redirecting to login');
      this.redirectToLogin();
      return;
    }
    
    this.loadOrganisatorGegevens();
    this.setupEventListeners();
  }
  
  async init() {
    console.log('🚀 Initializing OrganisatorGegevens');
    if (!this.token) {
      console.warn('⚠️ No token found');
      this.redirectToLogin();
      return;
    }
    
    try {
      await this.loadOrganisatorGegevens();
      this.setupEventListeners();
    } catch (error) {
      console.error('❌ Initialisatie mislukt:', error);
      this.showError('Er ging iets mis bij het laden van je gegevens');
    }
  }
  
  // 📡 API Calls
  async loadOrganisatorGegevens() {
    console.log('📡 Loading organisator gegevens...');
    try {
      this.showLoading(true);
      
      const response = await fetch('/api/organisator/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('🔒 Unauthorized, redirecting to login');
          this.redirectToLogin();
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 API Result:', result);
      
      if (result.success) {
        this.organisatorData = result.data;
        console.log('✅ Organisator data loaded:', this.organisatorData);
        this.displayOrganisatorGegevens();
      } else {
        throw new Error(result.message || 'Onbekende fout');
      }
      
    } catch (error) {
      console.error('❌ Error loading organisator gegevens:', error);
      this.showError('Kan gegevens niet laden: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  async updateOrganisatorGegevens(formData) {
    console.log('📝 Updating organisator gegevens:', formData);
    try {
      this.showLoading(true);
      
      const response = await fetch('/api/organisator/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      console.log('📝 Update result:', result);
      
      if (result.success) {
        // Reload the data to get updated information
        await this.loadOrganisatorGegevens();
        this.disableEditMode();
        this.showSuccess('Gegevens succesvol bijgewerkt!');
      } else {
        throw new Error(result.message || 'Update mislukt');
      }
      
    } catch (error) {
      console.error('❌ Error updating organisator:', error);
      this.showError('Update mislukt: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  // 🎨 UI Updates
  displayOrganisatorGegevens() {
    console.log('🎨 Displaying organisator gegevens');
    if (!this.organisatorData) {
      console.warn('⚠️ No organisator data to display');
      return;
    }
    
    const data = this.organisatorData;
    console.log('📊 Data to display:', data);
    
    // Update basis persoonlijke gegevens
    this.updateField('voornaam', data.voornaam);
    this.updateField('achternaam', data.achternaam);
    this.updateField('email', data.email);
    this.updateField('telefoon', '+32 2 290 10 91'); // Vast kantoortelefoon
    
    // Set default/hardcoded organizational values if not in database
    this.updateField('organisatie', 'Erasmushogeschool Brussel');
    this.updateField('functie', 'Carrière Coördinator');
    this.updateField('afdeling', 'Student Services');
    this.updateField('personeelsnummer', `EHB-${new Date().getFullYear()}-CS${data.organisatorId.toString().padStart(3, '0')}`);
    this.updateField('campus', 'Jette');
    this.updateField('kantoor', `Campus Jette - Lokaal J.2.${15 + data.organisatorId}`);
    
    // Update last login
    this.updateField('last-login', 'Vandaag om 08:45');
    
    // Set account status
    this.updateField('account-status', 'Actief en Geautoriseerd');
    
    // Set responsibilities
    this.updateField('verantwoordelijkheden', 
      'Coördinatie van carrière evenementen, begeleiding van studenten bij stage- en jobzoektocht, onderhouden contacten met bedrijven en organisaties, organiseren van netwerkevents en career fairs.'
    );
    
    this.updateField('specialisatie', 'IT & Technology Sector');
    this.updateField('ervaring', '5+ jaar in career services');
    
    // Update page title
    document.title = `${data.voornaam} ${data.achternaam} - Organisator Gegevens`;
    
    console.log('✅ UI updated successfully');
  }
  
  updateField(fieldId, value) {
    const field = document.querySelector(`[data-field="${fieldId}"]`);
    if (field) {
      const valueSpan = field.querySelector('.field-value') || field;
      const displayValue = value || 'Niet ingevuld';
      
      // Handle different field types
      if (fieldId === 'verantwoordelijkheden') {
        // For responsibilities, update the entire content after the <strong> tag
        const strongTag = field.querySelector('strong');
        if (strongTag) {
          field.innerHTML = `<strong>${strongTag.textContent}</strong><br><br>${displayValue}`;
        }
      } else if (valueSpan.tagName === 'SPAN') {
        valueSpan.textContent = displayValue;
      } else {
        // For direct text updates
        const strongContent = field.querySelector('strong')?.outerHTML || '';
        field.innerHTML = strongContent + ' ' + displayValue;
      }
      
      console.log(`📝 Updated field ${fieldId}:`, displayValue);
    } else {
      console.warn(`⚠️ Field not found: ${fieldId}`);
    }
  }
  
  // ✏️ Edit Mode
  enableEditMode() {
    console.log('✏️ Enabling edit mode');
    this.editMode = true;
    this.createEditForm();
    this.updateEditButtons(true);
  }
  
  createEditForm() {
    console.log('📝 Creating edit form');
    const editableFields = [
      { id: 'voornaam', type: 'text', label: 'Voornaam', field: 'voornaam' },
      { id: 'achternaam', type: 'text', label: 'Achternaam', field: 'achternaam' },
      { id: 'email', type: 'email', label: 'Email', field: 'email' },
      { id: 'functie', type: 'text', label: 'Functie', field: 'functie', isVirtual: true },
      { id: 'afdeling', type: 'text', label: 'Afdeling', field: 'afdeling', isVirtual: true },
      { id: 'campus', type: 'text', label: 'Campus', field: 'campus', isVirtual: true },
      { id: 'kantoor', type: 'text', label: 'Kantoor', field: 'kantoor', isVirtual: true },
      { id: 'specialisatie', type: 'text', label: 'Specialisatie', field: 'specialisatie', isVirtual: true },
      { id: 'ervaring', type: 'text', label: 'Ervaring', field: 'ervaring', isVirtual: true }
    ];
    
    editableFields.forEach(field => {
      const element = document.querySelector(`[data-field="${field.id}"]`);
      if (element) {
        let currentValue = '';
        
        if (field.isVirtual) {
          // For virtual fields, get the current displayed value
          const textContent = element.textContent || element.innerText;
          currentValue = textContent.replace(field.label + ':', '').trim();
        } else if (this.organisatorData && this.organisatorData[field.field]) {
          currentValue = this.organisatorData[field.field];
        }
        
        if (field.id === 'verantwoordelijkheden') {
          // Special handling for textarea
          element.innerHTML = `
            <strong>${field.label}:</strong><br><br>
            <textarea 
              id="edit-${field.id}" 
              class="edit-input"
              style="width: 100%; min-height: 100px; margin-top: 0.5rem; padding: 0.5rem; border: 1px solid #881538; border-radius: 4px; font-family: inherit; resize: vertical;"
            >${currentValue}</textarea>
          `;
        } else {
          element.innerHTML = `
            <strong>${field.label}:</strong>
            <input 
              type="${field.type}" 
              id="edit-${field.id}" 
              value="${currentValue}"
              class="edit-input"
              style="margin-left: 0.5rem; padding: 0.25rem; border: 1px solid #881538; border-radius: 4px;"
            >
          `;
        }
      }
    });
  }
  
  disableEditMode() {
    console.log('❌ Disabling edit mode');
    this.editMode = false;
    this.displayOrganisatorGegevens();
    this.updateEditButtons(false);
  }
  
  updateEditButtons(editMode) {
    const editBtn = document.querySelector('.ehbBtn.bewerken');
    const actionBtns = document.querySelector('.mt-4');
    
    if (editMode) {
      editBtn.textContent = 'Annuleren';
      editBtn.onclick = () => this.disableEditMode();
      
      // Add save button
      const saveBtn = document.createElement('button');
      saveBtn.className = 'ehbBtn';
      saveBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Opslaan';
      saveBtn.onclick = () => this.saveChanges();
      
      actionBtns.insertBefore(saveBtn, editBtn.nextSibling);
    } else {
      editBtn.textContent = 'Gegevens Bewerken';
      editBtn.onclick = () => this.enableEditMode();
      
      // Remove save button
      const saveBtn = actionBtns.querySelector('.ehbBtn[style*="22c55e"]');
      if (saveBtn) saveBtn.remove();
    }
  }
  
  async saveChanges() {
    console.log('💾 Saving changes');
    const formData = {};
    
    // Gather all input values
    document.querySelectorAll('.edit-input').forEach(input => {
      const fieldName = input.id.replace('edit-', '');
      const mappedField = this.getFieldMapping(fieldName);
      if (mappedField && !this.isVirtualField(fieldName)) {
        formData[mappedField] = input.value.trim();
      }
    });
    
    console.log('📦 Form data to save:', formData);
    await this.updateOrganisatorGegevens(formData);
  }
  
  getFieldMapping(fieldId) {
    const mapping = {
      'voornaam': 'voornaam',
      'achternaam': 'achternaam',
      'email': 'email'
    };
    return mapping[fieldId];
  }
  
  isVirtualField(fieldId) {
    const virtualFields = ['functie', 'afdeling', 'campus', 'kantoor', 'specialisatie', 'ervaring', 'verantwoordelijkheden'];
    return virtualFields.includes(fieldId);
  }
  
  // 🎯 Event Listeners
  setupEventListeners() {
    console.log('👂 Setting up event listeners');
    // Edit button
    const editBtn = document.querySelector('.ehbBtn.bewerken');
    if (editBtn) {
      editBtn.onclick = () => this.enableEditMode();
    }
  }
  
  // 🔧 Utility Methods
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }
  
  showError(message) {
    console.error('❌ Error:', message);
    if (window.showNotification) {
      window.showNotification(message, 'error');
    } else {
      alert('Error: ' + message);
    }
  }
  
  showSuccess(message) {
    console.log('✅ Success:', message);
    if (window.showNotification) {
      window.showNotification(message, 'success');
    } else {
      alert('Success: ' + message);
    }
  }
  
  redirectToLogin() {
    console.log('🔄 Redirecting to login');
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  }
}

// 🚀 Initialize
let organisatorGegevensManager;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Content Loaded, initializing OrganisatorGegevens');
  try {
    organisatorGegevensManager = new OrganisatorGegevens();
    console.log('✅ OrganisatorGegevens initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize OrganisatorGegevens:', error);
  }
});

// Global functions voor HTML onclick events
function enableEditMode() {
  console.log('🖱️ enableEditMode called from HTML');
  if (organisatorGegevensManager) {
    organisatorGegevensManager.enableEditMode();
  } else {
    console.error('❌ organisatorGegevensManager not initialized');
  }
}