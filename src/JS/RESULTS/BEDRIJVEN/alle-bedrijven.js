// alle-bedrijven.js - Alle bedrijven laden en weergeven MET CACHING

console.log('🏢 Alle bedrijven script geladen');

// 🔧 GLOBAL CACHE - shared across page loads
window.bedrijvenCache = window.bedrijvenCache || {
  data: null,
  timestamp: null,
  maxAge: 5 * 60 * 1000 // 5 minutes cache
};

class AlleBedrijvenManager {
  constructor() {
    console.log('📝 AlleBedrijvenManager constructor aangeroepen');
    this.bedrijven = [];
    this.filteredBedrijven = [];
    this.init();
  }

  async init() {
    console.log('🚀 Initializing AlleBedrijvenManager');
    try {
      this.setupEventListeners();
      await this.loadAlleBedrijven();
      this.updateStats();
      
      // 🔧 RESTORE SCROLL POSITION if returning from detail page
      this.restoreScrollPosition();
      
    } catch (error) {
      console.error('❌ Initialisatie mislukt:', error);
      this.showError('Er ging iets mis bij het laden van de bedrijven');
    }
  }

  // 🔧 RESTORE SCROLL POSITION
  restoreScrollPosition() {
    const savedPosition = sessionStorage.getItem('alleBedrijvenScrollPosition');
    if (savedPosition) {
      console.log('📜 Restoring scroll position:', savedPosition);
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition));
        sessionStorage.removeItem('alleBedrijvenScrollPosition');
      }, 100); // Small delay to ensure content is loaded
    }
  }

  // 🔧 CHECK CACHE FIRST
  isCacheValid() {
    const cache = window.bedrijvenCache;
    if (!cache.data || !cache.timestamp) {
      return false;
    }
    
    const now = Date.now();
    const isValid = (now - cache.timestamp) < cache.maxAge;
    console.log(`💾 Cache check: ${isValid ? 'VALID' : 'EXPIRED'} (age: ${Math.round((now - cache.timestamp) / 1000)}s)`);
    return isValid;
  }

  // 📡 API Calls WITH CACHING
  async loadAlleBedrijven() {
    console.log('📡 Loading alle bedrijven...');
    
    // 🔧 CHECK CACHE FIRST
    if (this.isCacheValid()) {
      console.log('💾 Using cached bedrijven data');
      this.bedrijven = window.bedrijvenCache.data;
      this.filteredBedrijven = [...this.bedrijven];
      this.displayBedrijven();
      this.hideLoadingPlaceholder();
      return;
    }
    
    try {
      this.showLoading(true);
      
      // 🔧 FIX: Use correct backend API URL
      const response = await fetch('http://localhost:3301/api/bedrijven', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 API Result:', result);
      
      if (result.success) {
        this.bedrijven = result.data;
        this.filteredBedrijven = [...this.bedrijven]; // Copy voor filtering
        
        // 💾 CACHE THE DATA
        window.bedrijvenCache = {
          data: this.bedrijven,
          timestamp: Date.now()
        };
        console.log(`💾 Cached ${this.bedrijven.length} bedrijven`);
        
        console.log('✅ Bedrijven data loaded:', this.bedrijven.length);
        this.displayBedrijven();
      } else {
        throw new Error(result.message || 'Onbekende fout');
      }
      
    } catch (error) {
      console.error('❌ Error loading bedrijven:', error);
      this.showError('Kan bedrijven niet laden: ' + error.message);
      this.displayFallbackBedrijven();
    } finally {
      this.showLoading(false);
      this.hideLoadingPlaceholder();
    }
  }

  // 🎨 UI Updates - OPTIMIZED
  displayBedrijven() {
    console.log('🎨 Displaying bedrijven:', this.filteredBedrijven.length);
    
    const container = document.querySelector('.bedrijfTegels');
    if (!container) {
      console.error('❌ Bedrijf container not found');
      return;
    }

    // 🔧 IMMEDIATE UI FEEDBACK
    this.hideLoadingPlaceholder();

    if (this.filteredBedrijven.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <h3>Geen bedrijven gevonden</h3>
          <p>Probeer uw zoekopdracht aan te passen</p>
        </div>
      `;
      return;
    }

    // 🔧 OPTIMIZED: Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    this.filteredBedrijven.forEach((bedrijf, index) => {
      const bedrijfCard = this.createBedrijfCard(bedrijf, index);
      fragment.appendChild(bedrijfCard);
    });

    // 🔧 SINGLE DOM UPDATE
    container.innerHTML = '';
    container.appendChild(fragment);

    console.log('✅ UI updated successfully');
  }

  // 🔧 HIDE LOADING PLACEHOLDER
  hideLoadingPlaceholder() {
    const placeholder = document.querySelector('.loading-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  }

  createBedrijfCard(bedrijf, index) {
    const article = document.createElement('article');
    article.className = 'bedrijfTegel';
    article.style.animationDelay = `${index * 0.1}s`;
    
    // Add click handler for navigation
    article.addEventListener('click', () => {
      this.navigateToBedrijfDetail(bedrijf.bedrijfsnummer);
    });

    // Get company icon based on sector
    const icon = this.getCompanyIcon(bedrijf.sector);
    
    // Get description or fallback
    const beschrijving = bedrijf.bechrijving || bedrijf.beschrijving || 'Meer informatie beschikbaar op de detailpagina.';

    article.innerHTML = `
      <h2 class="bedrijfNaam">${icon} ${bedrijf.naam}</h2>
      <p class="bedrijfSector">${bedrijf.sector}</p>
      <p class="bedrijfBeschrijving">
        ${beschrijving}
      </p>
      <div class="bedrijf-info">
        <span class="bedrijf-locatie">📍 ${bedrijf.gemeente}</span>
        <span class="bedrijf-tafel">🏷️ Tafel ${bedrijf.tafelNr || 'TBD'}</span>
      </div>
    `;

    return article;
  }

  getCompanyIcon(sector) {
    const sectorIcons = {
      'AI': '🤖',
      'Health informatics': '⚕️',
      'Netwerk- en infrastructuurtechnologie': '🌐',
      'Informatie- en communicatietechnologie': '💻',
      'Duurzaamheid': '🌱',
      'Onderwijs': '📚',
      'Gezondheidszorg': '🏥',
      'Landbouwtechnologie': '🚜',
      'Luchtvaartindustrie': '✈️',
      'Software': '💻',
      'Biotech': '🧬',
      'Milieu': '🌿',
      'IT Consulting': '💼',
      'Design & Engineering': '🎨',
      'Duurzame Energie': '⚡',
      'Design': '🎨'
    };
    
    return sectorIcons[sector] || '🏢';
  }

  navigateToBedrijfDetail(bedrijfsnummer) {
    console.log('🔗 Navigating to bedrijf detail:', bedrijfsnummer);
    
    // 🔧 NO LOADING OVERLAY - just navigate immediately
    // this.showLoading(true);
    
    // 💾 STORE CURRENT SCROLL POSITION for when user returns
    sessionStorage.setItem('alleBedrijvenScrollPosition', window.pageYOffset.toString());
    
    // Navigate with bedrijfsnummer as URL parameter
    window.location.href = `/resultaatBedrijf?id=${bedrijfsnummer}`;
  }

  // 🔍 Search and Filter
  setupEventListeners() {
    console.log('👂 Setting up event listeners');
    
    // Search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Filter button (placeholder for future functionality)
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        console.log('🔍 Filter button clicked');
        // TODO: Implement filter modal/dropdown
        this.showInfo('Filter functionaliteit komt binnenkort beschikbaar!');
      });
    }
  }

  handleSearch(searchTerm) {
    console.log('🔍 Searching for:', searchTerm);
    
    if (!searchTerm.trim()) {
      this.filteredBedrijven = [...this.bedrijven];
    } else {
      const term = searchTerm.toLowerCase().trim();
      this.filteredBedrijven = this.bedrijven.filter(bedrijf => 
        bedrijf.naam.toLowerCase().includes(term) ||
        bedrijf.sector.toLowerCase().includes(term) ||
        bedrijf.gemeente.toLowerCase().includes(term) ||
        (bedrijf.bechrijving && bedrijf.bechrijving.toLowerCase().includes(term)) ||
        (bedrijf.beschrijving && bedrijf.beschrijving.toLowerCase().includes(term))
      );
    }
    
    this.displayBedrijven();
    this.updateStats();
  }

  updateStats() {
    const statsText = document.querySelector('.stats-text');
    if (statsText) {
      const count = this.filteredBedrijven.length;
      statsText.textContent = `💼 ${count} bedrijven beschikbaar voor gesprekken`;
    }
  }

  // 🔧 Utility Methods
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
      
      // 🔧 FIX: Auto-hide loading after 10 seconds to prevent infinite loading
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
    this.showNotification(message, 'error');
  }

  showInfo(message) {
    console.log('ℹ️ Info:', message);
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    // Try to use existing notification system
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      // Fallback to alert
      alert(message);
    }
  }

  // Fallback data in case API fails
  displayFallbackBedrijven() {
    console.log('📦 Using fallback bedrijven data');
    
    const fallbackBedrijven = [
      {
        bedrijfsnummer: 84,
        naam: 'BilalAICorp',
        sector: 'AI',
        gemeente: 'Gent',
        tafelNr: 1,
        bechrijving: 'BilalAICorp bouwt slimme AI-oplossingen die zich aanpassen aan de gebruiker - ideaal voor zorg, onderwijs en industrie.'
      },
      {
        bedrijfsnummer: 85,
        naam: "Vital'O Network",
        sector: 'Health informatics',
        gemeente: 'Brussel',
        tafelNr: 2,
        bechrijving: "Vital'O Network verbindt medische systemen met elkaar voor vlotte en veilige datastromen."
      },
      {
        bedrijfsnummer: 99,
        naam: 'Microsoft',
        sector: 'Software',
        gemeente: 'Brussel',
        tafelNr: 16,
        bechrijving: 'Microsoft leidt wereldwijd in cloud computing, productiviteitstools en AI-innovatie.'
      }
    ];
    
    this.bedrijven = fallbackBedrijven;
    this.filteredBedrijven = [...this.bedrijven];
    this.displayBedrijven();
  }
}

// 🚀 Initialize
let alleBedrijvenManager;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Content Loaded, initializing AlleBedrijvenManager');
  try {
    alleBedrijvenManager = new AlleBedrijvenManager();
    console.log('✅ AlleBedrijvenManager initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AlleBedrijvenManager:', error);
  }
});

// 🔧 GLOBAL REFRESH FUNCTION for HTML button
window.refreshBedrijven = function() {
  console.log('🔄 Manual refresh triggered');
  if (alleBedrijvenManager) {
    // Clear cache
    window.bedrijvenCache = { data: null, timestamp: null, maxAge: 5 * 60 * 1000 };
    // Reload
    alleBedrijvenManager.loadAlleBedrijven();
  }
};

// Export for potential use
window.AlleBedrijvenManager = AlleBedrijvenManager;