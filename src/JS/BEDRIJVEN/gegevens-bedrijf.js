// gegevens-bedrijf.js - Bedrijf gegevens ophalen en weergeven

console.log('🚀 Bedrijf gegevens script geladen');

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

class BedrijfGegevens {
  constructor() {
    console.log('📝 BedrijfGegevens constructor aangeroepen');
    this.token = localStorage.getItem('authToken');
    this.bedrijfData = null;
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
    
    this.loadBedrijfGegevens();
    this.setupEventListeners();
  }
  
  async init() {
    console.log('🚀 Initializing BedrijfGegevens');
    if (!this.token) {
      console.warn('⚠️ No token found');
      this.redirectToLogin();
      return;
    }
    
    try {
      await this.loadBedrijfGegevens();
      this.setupEventListeners();
    } catch (error) {
      console.error('❌ Initialisatie mislukt:', error);
      this.showError('Er ging iets mis bij het laden van je gegevens');
    }
  }
  
  // 📡 API Calls
  async loadBedrijfGegevens() {
    console.log('📡 Loading bedrijf gegevens...');
    try {
      this.showLoading(true);
      
      const response = await fetch('/api/bedrijf/profile', {
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
        this.bedrijfData = result.data;
        console.log('✅ Bedrijf data loaded:', this.bedrijfData);
        this.displayBedrijfGegevens();
      } else {
        throw new Error(result.message || 'Onbekende fout');
      }
      
    } catch (error) {
      console.error('❌ Error loading bedrijf gegevens:', error);
      this.showError('Kan gegevens niet laden: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  async updateBedrijfGegevens(formData) {
    console.log('📝 Updating bedrijf gegevens:', formData);
    try {
      this.showLoading(true);
      
      const response = await fetch('/api/bedrijf/profile', {
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
        this.bedrijfData = result.data;
        this.displayBedrijfGegevens();
        this.disableEditMode();
        this.showSuccess('Gegevens succesvol bijgewerkt!');
      } else {
        throw new Error(result.message || 'Update mislukt');
      }
      
    } catch (error) {
      console.error('❌ Error updating bedrijf:', error);
      this.showError('Update mislukt: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  // 🎨 UI Updates
  displayBedrijfGegevens() {
    console.log('🎨 Displaying bedrijf gegevens');
    if (!this.bedrijfData) {
      console.warn('⚠️ No bedrijf data to display');
      return;
    }
    
    const data = this.bedrijfData;
    console.log('📊 Data to display:', data);
    
    // Update alle velden
    this.updateField('bedrijfsnummer', data.bedrijfsnummer);
    this.updateField('bedrijfsnaam', data.naam);
    this.updateField('tva-nummer', data.TVA_nummer);
    this.updateField('sector', data.sector);
    this.updateField('email', data.email);
    this.updateField('telefoon', data.gsm_nummer);
    this.updateField('straatnaam', data.straatnaam);
    this.updateField('huisnummer', data.huisnummer);
    this.updateField('bus', data.bus);
    this.updateField('postcode', data.postcode);
    this.updateField('gemeente', data.gemeente);
    this.updateField('land', data.land);
    
    // Account info
    this.updateField('account-status', 'Actief en Geverifieerd');
    
    // Update page title
    document.title = `${data.naam} - Bedrijf Gegevens`;
    
    console.log('✅ UI updated successfully');
  }
  
  updateField(fieldId, value) {
    const field = document.querySelector(`[data-field="${fieldId}"]`);
    if (field) {
      const valueSpan = field.querySelector('.field-value') || field;
      const displayValue = value || 'Niet ingevuld';
      valueSpan.textContent = displayValue;
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
      { id: 'bedrijfsnaam', type: 'text', label: 'Bedrijfsnaam', field: 'naam' },
      { id: 'tva-nummer', type: 'text', label: 'TVA-nummer', field: 'TVA_nummer' },
      { id: 'sector', type: 'text', label: 'Sector', field: 'sector' },
      { id: 'email', type: 'email', label: 'Email', field: 'email' },
      { id: 'telefoon', type: 'tel', label: 'Telefoon', field: 'gsm_nummer' },
      { id: 'straatnaam', type: 'text', label: 'Straatnaam', field: 'straatnaam' },
      { id: 'huisnummer', type: 'text', label: 'Huisnummer', field: 'huisnummer' },
      { id: 'bus', type: 'text', label: 'Bus', field: 'bus' },
      { id: 'postcode', type: 'text', label: 'Postcode', field: 'postcode' },
      { id: 'gemeente', type: 'text', label: 'Gemeente', field: 'gemeente' },
      { id: 'land', type: 'text', label: 'Land', field: 'land' }
    ];
    
    editableFields.forEach(field => {
      const element = document.querySelector(`[data-field="${field.id}"]`);
      if (element && this.bedrijfData) {
        const currentValue = this.bedrijfData[field.field] || '';
        
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
    });
  }
  
  disableEditMode() {
    console.log('❌ Disabling edit mode');
    this.editMode = false;
    this.displayBedrijfGegevens();
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
      if (mappedField) {
        formData[mappedField] = input.value.trim();
      }
    });
    
    console.log('📦 Form data to save:', formData);
    await this.updateBedrijfGegevens(formData);
  }
  
  getFieldMapping(fieldId) {
    const mapping = {
      'bedrijfsnaam': 'naam',
      'tva-nummer': 'TVA_nummer',
      'sector': 'sector',
      'email': 'email',
      'telefoon': 'gsm_nummer',
      'straatnaam': 'straatnaam',
      'huisnummer': 'huisnummer',
      'bus': 'bus',
      'postcode': 'postcode',
      'gemeente': 'gemeente',
      'land': 'land'
    };
    return mapping[fieldId];
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
let bedrijfGegevensManager;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Content Loaded, initializing BedrijfGegevens');
  try {
    bedrijfGegevensManager = new BedrijfGegevens();
    console.log('✅ BedrijfGegevens initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize BedrijfGegevens:', error);
  }
});

// Global functions voor HTML onclick events
function enableEditMode() {
  console.log('🖱️ enableEditMode called from HTML');
  if (bedrijfGegevensManager) {
    bedrijfGegevensManager.enableEditMode();
  } else {
    console.error('❌ bedrijfGegevensManager not initialized');
  }
}