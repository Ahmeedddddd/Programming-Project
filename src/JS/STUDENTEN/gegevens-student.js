// gegevens-student.js - Student gegevens ophalen en weergeven

console.log('🚀 Student gegevens script geladen');

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

class StudentGegevens {
  constructor() {
    console.log('📝 StudentGegevens constructor aangeroepen');
    this.token = localStorage.getItem('authToken');
    this.studentData = null;
    this.editMode = false;
    this.form = document.getElementById('studentForm');
    
    // Initialize
    this.init();
  }
  
  async init() {
    console.log('🚀 Initializing StudentGegevens');
    if (!this.token) {
      console.warn('⚠️ No token found');
      this.redirectToLogin();
      return;
    }
    
    try {
      await this.loadStudentGegevens();
      this.setupEventListeners();
      this.setupFormHandling();
    } catch (error) {
      console.error('❌ Initialisatie mislukt:', error);
      this.showError('Er ging iets mis bij het laden van je gegevens');
    }
  }
  
  // 📡 API Calls
  async loadStudentGegevens() {
    console.log('📡 Loading student gegevens...');
    try {
      this.showLoading(true);
      
      const response = await fetch('/api/studenten/profile', {
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
        this.studentData = result.data;
        console.log('✅ Student data loaded:', this.studentData);
        this.displayStudentGegevens();
      } else {
        throw new Error(result.message || 'Onbekende fout');
      }
      
    } catch (error) {
      console.error('❌ Error loading student gegevens:', error);
      this.showError('Kan gegevens niet laden: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  async updateStudentGegevens(formData) {
    console.log('📝 Updating student gegevens:', formData);
    try {
      this.showLoading(true);
      
      const response = await fetch('/api/studenten/profile', {
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
        this.studentData = result.data;
        this.displayStudentGegevens();
        this.disableEditMode();
        this.showSuccess('Gegevens succesvol bijgewerkt!');
      } else {
        throw new Error(result.message || 'Update mislukt');
      }
      
    } catch (error) {
      console.error('❌ Error updating student:', error);
      this.showError('Update mislukt: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  // 🎨 UI Updates
  displayStudentGegevens() {
    console.log('🎨 Displaying student gegevens');
    if (!this.studentData) {
      console.warn('⚠️ No student data to display');
      return;
    }
    
    const data = this.studentData;
    console.log('📊 Data to display:', data);
    
    // Update persoonlijke gegevens
    this.updateField('studentnummer', data.studentnummer);
    this.updateField('voornaam', data.voornaam);
    this.updateField('achternaam', data.achternaam);
    this.updateField('email', data.email);
    this.updateField('telefoon', data.gsm_nummer);
    
    // Update studiegegevens
    this.updateField('opleiding', data.opleiding);
    this.updateField('opleidingsrichting', data.opleidingsrichting);
    
    // Update projectgegevens
    this.updateField('project-titel', data.projectTitel);
    this.updateField('project-beschrijving', data.projectBeschrijving);
    this.updateField('over-mezelf', data.overMezelf);
    
    // Update adresgegevens
    this.updateField('straatnaam', data.straatnaam);
    this.updateField('huisnummer', data.huisnummer);
    this.updateField('bus', data.bus);
    this.updateField('postcode', data.postcode);
    this.updateField('gemeente', data.gemeente);
    
    // Account info
    this.updateField('account-status', 'Actief en Geverifieerd');
    this.updateField('last-login', 'Vandaag om ' + new Date().toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'}));
    
    // Update extra info
    const accountCreated = document.getElementById('account-created');
    const lastUpdated = document.getElementById('last-updated');
    if (accountCreated) accountCreated.textContent = `Account aangemaakt: ${new Date().getFullYear()}`;
    if (lastUpdated) lastUpdated.textContent = `Laatste update: ${new Date().toLocaleDateString('nl-BE')}`;
    
    console.log('✅ UI updated successfully');
  }
  
  updateField(fieldId, value) {
    const field = document.querySelector(`[data-field="${fieldId}"]`);
    if (field) {
      const valueSpan = field.querySelector('.field-value');
      if (valueSpan) {
        const displayValue = value || 'Niet ingevuld';
        valueSpan.textContent = displayValue;
        console.log(`📝 Updated field ${fieldId}:`, displayValue);
      }
    } else {
      console.warn(`⚠️ Field not found: ${fieldId}`);
    }
  }
  
  // ✏️ Edit Mode Management
  enableEditMode() {
    console.log('✏️ Enabling edit mode');
    this.editMode = true;
    
    // Hide view controls, show edit controls
    document.getElementById('viewControls').style.display = 'none';
    document.getElementById('editControls').style.display = 'flex';
    
    // Convert fields to inputs
    this.createEditableFields();
  }
  
  disableEditMode() {
    console.log('❌ Disabling edit mode');
    this.editMode = false;
    
    // Show view controls, hide edit controls
    document.getElementById('viewControls').style.display = 'flex';
    document.getElementById('editControls').style.display = 'none';
    
    // Restore field display
    this.displayStudentGegevens();
  }
  
  createEditableFields() {
    console.log('📝 Creating editable fields');
    
    const editableFields = document.querySelectorAll('.editable-field');
    editableFields.forEach(field => {
      const fieldId = field.getAttribute('data-field');
      const valueSpan = field.querySelector('.field-value');
      const strongElement = field.querySelector('strong');
      
      if (valueSpan && fieldId && this.studentData) {
        const currentValue = this.getFieldValue(fieldId);
        const labelText = strongElement ? strongElement.textContent : fieldId;
        
        if (fieldId === 'project-beschrijving' || fieldId === 'over-mezelf') {
          // Create textarea for longer text fields
          field.innerHTML = `
            <strong>${labelText}</strong><br><br>
            <textarea 
              id="edit-${fieldId}" 
              class="edit-input"
              style="width: 100%; min-height: 80px; padding: 0.75rem; border: 2px solid #881538; border-radius: 8px; font-family: inherit; resize: vertical;"
            >${currentValue}</textarea>
          `;
        } else {
          // Create input for regular fields
          const inputType = this.getInputType(fieldId);
          field.innerHTML = `
            <strong>${labelText}</strong>
            <input 
              type="${inputType}" 
              id="edit-${fieldId}" 
              value="${currentValue}"
              class="edit-input"
              style="margin-left: 0.5rem; padding: 0.5rem; border: 2px solid #881538; border-radius: 8px; width: 250px;"
            >
          `;
        }
      }
    });
  }
  
  getFieldValue(fieldId) {
    const mapping = {
      'voornaam': 'voornaam',
      'achternaam': 'achternaam',
      'email': 'email',
      'telefoon': 'gsm_nummer',
      'opleiding': 'opleiding',
      'opleidingsrichting': 'opleidingsrichting',
      'project-titel': 'projectTitel',
      'project-beschrijving': 'projectBeschrijving',
      'over-mezelf': 'overMezelf',
      'straatnaam': 'straatnaam',
      'huisnummer': 'huisnummer',
      'bus': 'bus',
      'postcode': 'postcode',
      'gemeente': 'gemeente'
    };
    
    const dataField = mapping[fieldId];
    return dataField ? (this.studentData[dataField] || '') : '';
  }
  
  getInputType(fieldId) {
    const typeMapping = {
      'email': 'email',
      'telefoon': 'tel',
      'postcode': 'text',
      'huisnummer': 'text'
    };
    return typeMapping[fieldId] || 'text';
  }
  
  // 📝 Form Handling
  setupFormHandling() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
  }
  
  async handleFormSubmit() {
    console.log('💾 Handling form submit');
    
    const formData = {};
    const editInputs = document.querySelectorAll('.edit-input');
    
    editInputs.forEach(input => {
      const fieldId = input.id.replace('edit-', '');
      const mappedField = this.getFieldMapping(fieldId);
      if (mappedField) {
        formData[mappedField] = input.value.trim();
      }
    });
    
    console.log('📦 Form data to submit:', formData);
    await this.updateStudentGegevens(formData);
  }
  
  getFieldMapping(fieldId) {
    const mapping = {
      'voornaam': 'voornaam',
      'achternaam': 'achternaam',
      'email': 'email',
      'telefoon': 'gsm_nummer',
      'opleiding': 'opleiding',
      'opleidingsrichting': 'opleidingsrichting',
      'project-titel': 'projectTitel',
      'project-beschrijving': 'projectBeschrijving',
      'over-mezelf': 'overMezelf',
      'straatnaam': 'straatnaam',
      'huisnummer': 'huisnummer',
      'bus': 'bus',
      'postcode': 'postcode',
      'gemeente': 'gemeente'
    };
    return mapping[fieldId];
  }
  
  // 🎯 Event Listeners
  setupEventListeners() {
    console.log('👂 Setting up event listeners');
    
    // Edit button
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => this.enableEditMode());
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.disableEditMode());
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

// 🚀 Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Content Loaded, initializing StudentGegevens');
  try {
    window.studentGegevensManager = new StudentGegevens();
    console.log('✅ StudentGegevens initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize StudentGegevens:', error);
  }
});

// Export for module usage
export default StudentGegevens;