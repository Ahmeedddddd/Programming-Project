// resultaat-bedrijf.js - Bedrijf detail pagina

console.log('🏢 Bedrijf detail script geladen');

class BedrijfDetailManager {
  constructor() {
    console.log('📝 BedrijfDetailManager constructor aangeroepen');
    this.bedrijfData = null;
    this.contactpersoonData = null;
    this.bedrijfId = null;
    this.API_BASE = window.location.origin; // FIXED: Use same port as frontend
    this.init();
  }

  async init() {
    console.log('🚀 Initializing BedrijfDetailManager');
    try {
      this.bedrijfId = this.getBedrijfIdFromUrl();
      
      if (!this.bedrijfId) {
        console.error('❌ No bedrijf ID found in URL');
        console.log('🔧 Current URL:', window.location.href);
        console.log('🔧 Expected format: /resultaat-bedrijf?id=1');
        
        // Try to load first available bedrijf as fallback
        await this.loadFirstAvailableBedrijf();
        return;
      }

      console.log('🎯 Loading bedrijf with ID:', this.bedrijfId);
      await this.loadBedrijfDetail();
      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ Initialisatie mislukt:', error);
      this.showError('Er ging iets mis bij het laden van de bedrijfsgegevens');
    }
  }

  async loadFirstAvailableBedrijf() {
    try {
      console.log('🔄 No ID provided, loading first available bedrijf...');
      
      const response = await fetch(`${this.API_BASE}/api/bedrijven`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const firstBedrijf = data.data[0];
          this.bedrijfId = firstBedrijf.bedrijfsnummer;
          
          console.log(`✅ Using first available bedrijf: ${firstBedrijf.naam} (ID: ${this.bedrijfId})`);
          
          // Update URL without redirect
          const newUrl = `${window.location.pathname}?id=${this.bedrijfId}`;
          window.history.replaceState({}, '', newUrl);
          
          await this.loadBedrijfDetail();
          this.setupEventListeners();
          return;
        }
      }
      
      this.showError('Geen bedrijf ID gevonden en geen bedrijven beschikbaar. Ga terug naar alle bedrijven.');
    } catch (error) {
      console.error('❌ Error loading first bedrijf:', error);
      this.showError('Geen bedrijf ID gevonden. Ga terug naar alle bedrijven.');
    }
  }

  getBedrijfIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    console.log('🔍 Bedrijf ID from URL:', id);
    return id;
  }

  // 📡 API Calls
  async loadBedrijfDetail() {
    console.log('📡 Loading bedrijf detail...');
    try {
      this.showLoading(true);
      
      // FIXED: Use correct API URL (same port as frontend)
      const response = await fetch(`${this.API_BASE}/api/bedrijven/${this.bedrijfId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Bedrijf niet gevonden');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 API Result:', result);
      
      if (result.success) {
        this.bedrijfData = result.data;
        console.log('✅ Bedrijf data loaded:', this.bedrijfData);
        this.displayBedrijfDetail();
        await this.loadContactpersoon();
      } else {
        throw new Error(result.message || 'Onbekende fout');
      }
      
    } catch (error) {
      console.error('❌ Error loading bedrijf detail:', error);
      this.showError('Kan bedrijfsgegevens niet laden: ' + error.message);
      this.displayFallbackData();
    } finally {
      this.showLoading(false);
    }
  }

  async loadContactpersoon() {
    try {
      // FIXED: Use correct API URL (same port as frontend)
      const response = await fetch(`${this.API_BASE}/api/contactpersonen/bedrijf/${this.bedrijfId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          this.contactpersoonData = result.data[0]; // Take first contact person
          this.updateContactInfo();
        }
      }
      
    } catch (error) {
      console.log('ℹ️ No contact person data available:', error.message);
      // Not a critical error, continue without contact person
    }
  }

  // 🎨 UI Updates
  displayBedrijfDetail() {
    console.log('🎨 Displaying bedrijf detail');
    if (!this.bedrijfData) {
      console.warn('⚠️ No bedrijf data to display');
      return;
    }

    const data = this.bedrijfData;
    console.log('📊 Data to display:', data);

    // Update page title
    document.title = `${data.naam} - Bedrijfsdetails`;

    // Update main company info
    this.updateField('.bedrijf-naam', data.naam);
    this.updateField('.bedrijf-type', this.getCompanyTypeDescription(data.sector));
    
    // Update logo with first letters of company name
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
      const initials = this.getCompanyInitials(data.naam);
      logoContainer.textContent = initials;
    }

    // Update description
    const beschrijving = data.bechrijving || data.beschrijving || this.generateDefaultDescription(data);
    this.updateField('.bedrijf-beschrijving', beschrijving);

    // Update table info
    const tafelInfo = data.tafelNr ? 
      `Bezoek ons op Tafel ${data.tafelNr} tijdens het evenement` :
      'Tafel informatie wordt binnenkort bekendgemaakt';
    this.updateField('.tafel-highlight', tafelInfo);

    // Update contact information
    this.updateContactCard(data);

    console.log('✅ UI updated successfully');
  }

  updateContactCard(data) {
    const adresInfo = document.querySelector('.adres-info');
    if (adresInfo) {
      const adres = this.formatAddress(data);
      adresInfo.innerHTML = `
        <strong>${data.naam}</strong><br/>
        ${adres}<br/>
        <br/>
        <strong>Contact:</strong><br/>
        📧 ${data.email}<br/>
        📞 ${data.gsm_nummer}<br/>
        🏢 ${data.sector}
      `;
    }
  }

  updateContactInfo() {
    if (!this.contactpersoonData) return;

    const contact = this.contactpersoonData;
    const adresInfo = document.querySelector('.adres-info');
    
    if (adresInfo) {
      const currentContent = adresInfo.innerHTML;
      adresInfo.innerHTML = currentContent + `
        <br/>
        <strong>Contactpersoon:</strong><br/>
        👤 ${contact.voornaam} ${contact.achternaam}<br/>
        📧 ${contact.email}<br/>
        📞 ${contact.gsm_nummer}
      `;
    }
  }

  formatAddress(data) {
    const parts = [];
    
    if (data.straatnaam) parts.push(data.straatnaam);
    if (data.huisnummer) parts.push(data.huisnummer);
    if (data.bus) parts.push(`bus ${data.bus}`);
    
    const streetAddress = parts.join(' ');
    
    const cityParts = [];
    if (data.postcode) cityParts.push(data.postcode);
    if (data.gemeente) cityParts.push(data.gemeente);
    
    const cityAddress = cityParts.join(' ');
    
    const fullAddress = [streetAddress, cityAddress, data.land].filter(Boolean).join('<br/>');
    
    return fullAddress || 'Adres informatie niet beschikbaar';
  }

  getCompanyInitials(naam) {
    return naam
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  getCompanyTypeDescription(sector) {
    const descriptions = {
      'AI': 'Kunstmatige Intelligentie & Robotica',
      'Health informatics': 'Gezondheids-IT & Medische Technologie',
      'Netwerk- en infrastructuurtechnologie': 'Netwerk & Infrastructuur',
      'Informatie- en communicatietechnologie': 'ICT & Consultancy',
      'Duurzaamheid': 'Duurzame Technologie & Milieu',
      'Onderwijs': 'EdTech & E-learning',
      'Gezondheidszorg': 'Healthcare & Medtech',
      'Landbouwtechnologie': 'AgTech & Robotica',
      'Luchtvaartindustrie': 'Luchtvaart & Drone Technologie',
      'Software': 'Software Development & Cloud',
      'Biotech': 'Biotechnologie & Life Sciences',
      'Milieu': 'Milieubeheer & Monitoring',
      'IT Consulting': 'IT Consultancy & Services',
      'Design & Engineering': 'Design & Technische Innovatie',
      'Duurzame Energie': 'Hernieuwbare Energie & Technologie',
      'Design': 'Digital Design & Collaboration'
    };
    
    return descriptions[sector] || sector;
  }

  generateDefaultDescription(data) {
    return `${data.naam} is een innovatief bedrijf actief in de ${data.sector} sector. ` +
           `Gevestigd in ${data.gemeente}, bieden zij cutting-edge oplossingen ` +
           `en zijn zij aanwezig tijdens CareerLaunch om hun expertise en carrière-opportuniteiten te delen.`;
  }

  updateField(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
      console.log(`📝 Updated ${selector}:`, value);
    } else {
      console.warn(`⚠️ Element not found: ${selector}`);
    }
  }

  // 🎯 Event Listeners
  setupEventListeners() {
    console.log('👂 Setting up event listeners');

    // Contact button
    const contactBtn = document.querySelector('.contact-btn');
    if (contactBtn) {
      contactBtn.addEventListener('click', () => {
        this.handleContactClick();
      });
    }

    // Favoriet/Reserve button
    const favorietBtn = document.querySelector('.favoriet-btn');
    if (favorietBtn) {
      favorietBtn.addEventListener('click', () => {
        this.handleFavorietClick();
      });
    }

    // Back button (if exists)
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.goBack();
      });
    }

    // Add back functionality to browser back button
    window.addEventListener('popstate', () => {
      this.goBack();
    });
  }

  handleContactClick() {
    if (!this.bedrijfData) return;

    const email = this.bedrijfData.email;
    const subject = encodeURIComponent(`CareerLaunch - Contact via website`);
    const body = encodeURIComponent(`Beste ${this.bedrijfData.naam},\n\nIk heb jullie profiel bekeken op CareerLaunch en zou graag in contact komen.\n\nMet vriendelijke groeten`);
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  handleFavorietClick() {
    console.log('⭐ Adding to favorites/reservations');
    
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.showError('Log in om een reservatie te maken');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    // TODO: Implement reservation functionality
    this.showInfo('Reservatie functionaliteit komt binnenkort beschikbaar!');
  }

  goBack() {
    console.log('🔙 Navigating back to alle bedrijven');
    
    // Check if we can go back in history
    if (document.referrer && document.referrer.includes('alleBedrijven')) {
      window.history.back();
    } else {
      // Fallback to alle bedrijven page
      window.location.href = '/alle-bedrijven';
    }
  }

  // 🔧 Utility Methods
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
      
      // Auto-hide loading after 10 seconds to prevent infinite loading
      if (show) {
        setTimeout(() => {
          overlay.style.display = 'none';
          console.log('⏰ Loading timeout - hiding overlay');
        }, 10000);
      }
    }
  }

  showError(message) {
    console.error('❌ Error:', message);
    
    // Show helpful error message
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(136, 21, 56, 0.15);
      border-left: 4px solid #dc2626;
      max-width: 500px;
      z-index: 10000;
      text-align: center;
    `;
    
    errorContainer.innerHTML = `
      <h3 style="color: #881538; margin-bottom: 1rem;">⚠️ Probleem met bedrijfsgegevens</h3>
      <p style="margin-bottom: 1rem; color: #666;">${message}</p>
      <div style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #555;">
        <strong>Mogelijke oplossingen:</strong><br/>
        • Probeer: <code>/resultaat-bedrijf?id=1</code><br/>
        • Of ga terug naar alle bedrijven en klik op een bedrijf
      </div>
      <button onclick="window.location.href='/alle-bedrijven'" style="background: #881538; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; margin-right: 1rem; cursor: pointer;">
        ← Alle bedrijven
      </button>
      <button onclick="window.location.reload()" style="background: #666; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
        🔄 Probeer opnieuw
      </button>
    `;
    
    document.body.appendChild(errorContainer);
    
    this.showNotification(message, 'error');
  }

  showInfo(message) {
    console.log('ℹ️ Info:', message);
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      alert(message);
    }
  }

  displayFallbackData() {
    console.log('📦 Using fallback data');
    
    // Use the ID to show a generic company
    this.bedrijfData = {
      bedrijfsnummer: this.bedrijfId,
      naam: 'Bedrijf Informatie Niet Beschikbaar',
      sector: 'Algemeen',
      gemeente: 'Locatie onbekend',
      email: 'info@bedrijf.be',
      gsm_nummer: 'Telefoonnummer niet beschikbaar',
      bechrijving: 'De gedetailleerde informatie voor dit bedrijf is momenteel niet beschikbaar. Probeer later opnieuw of ga terug naar alle bedrijven.'
    };
    
    this.displayBedrijfDetail();
  }
}

// 🚀 Initialize
let bedrijfDetailManager;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Content Loaded, initializing BedrijfDetailManager');
  try {
    bedrijfDetailManager = new BedrijfDetailManager();
    console.log('✅ BedrijfDetailManager initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize BedrijfDetailManager:', error);
  }
});

// Export for potential use
window.BedrijfDetailManager = BedrijfDetailManager;