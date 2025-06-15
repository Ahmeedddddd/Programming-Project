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
    
    this.loadStudentGegevens();
    this.setupEventListeners();
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
      
      const response = await fetch('/api/student/profile', {
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
      
      const response = await fetch('/api/student/profile', {
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
    this.updateField('inschrijvingsjaar', new Date().getFullYear());
    this.updateField('last-login', 'Vandaag om ' + new Date().toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'}));
    
    // Update page title
    document.title = `${data.voornaam} ${data.achternaam} - Student Gegevens`;
    
    console.log('✅ UI updated successfully');
  }
  
  updateField(fieldId, value) {
    const field = document.querySelector(`[data-field="${fieldId}"]`);
    if (field) {
      const valueSpan = field.querySelector('.field-value') || field;
      const displayValue = value || 'Niet ingevuld';
      
      // Handle different field types
      if (fieldId === 'project-beschrijving' || fieldId === 'over-mezelf') {
        // For longer text fields, handle them specially
        const strongTag = field.querySelector('strong');
        if (strongTag) {
          field.innerHTML = `<strong>${strongTag.textContent}</strong><br><br>${displayValue}`;
        } else {
          valueSpan.textContent = displayValue;
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
      { id: 'telefoon', type: 'tel', label: 'Telefoon', field: 'gsm_nummer' },
      { id: 'opleiding', type: 'text', label: 'Opleiding', field: 'opleiding' },
      { id: 'opleidingsrichting', type: 'text', label: 'Opleidingsrichting', field: 'opleidingsrichting' },
      { id: 'project-titel', type: 'text', label: 'Project Titel', field: 'projectTitel' },
      { id: 'project-beschrijving', type: 'textarea', label: 'Project Beschrijving', field: 'projectBeschrijving' },
      { id: 'over-mezelf', type: 'textarea', label: 'Over Mezelf', field: 'overMezelf' },
      { id: 'straatnaam', type: 'text', label: 'Straatnaam', field: 'straatnaam' },
      { id: 'huisnummer', type: 'text', label: 'Huisnummer', field: 'huisnummer' },
      { id: 'bus', type: 'text', label: 'Bus', field: 'bus' },
      { id: 'postcode', type: 'text', label: 'Postcode', field: 'postcode' },
      { id: 'gemeente', type: 'text', label: 'Gemeente', field: 'gemeente' }
    ];
    
    editableFields.forEach(field => {
      const element = document.querySelector(`[data-field="${field.id}"]`);
      if (element && this.studentData) {
        const currentValue = this.studentData[field.field] || '';
        
        if (field.type === 'textarea') {
          element.innerHTML = `
            <strong>${field.label}:</strong><br><br>
            <textarea 
              id="edit-${field.id}" 
              class="edit-input"
              style="width: 100%; min-height: 80px; margin-top: 0.5rem; padding: 0.5rem; border: 1px solid #881538; border-radius: 4px; font-family: inherit; resize: vertical;"
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
    this.displayStudentGegevens();
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
let studentGegevensManager;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Content Loaded, initializing StudentGegevens');
  try {
    studentGegevensManager = new StudentGegevens();
    console.log('✅ StudentGegevens initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize StudentGegevens:', error);
  }
});

// Global functions voor HTML onclick events
function enableEditMode() {
  console.log('🖱️ enableEditMode called from HTML');
  if (studentGegevensManager) {
    studentGegevensManager.enableEditMode();
  } else {
    console.error('❌ studentGegevensManager not initialized');
  }
}