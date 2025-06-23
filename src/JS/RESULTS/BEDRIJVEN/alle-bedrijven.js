/**
 * 🏢 alle-bedrijven.js - Bedrijven Overzicht Pagina voor CareerLaunch EHB
 * 
 * Dit bestand beheert de overzichtspagina voor alle bedrijven:
 * - Dynamisch laden van alle bedrijfsgegevens uit de API
 * - Rendering van bedrijfskaarten met basisinformatie
 * - Zoek- en filterfunctionaliteit
 * - Navigatie naar individuele bedrijf detailpagina's
 * - Caching voor performance optimalisatie
 * 
 * Belangrijke functionaliteiten:
 * - API integratie voor bedrijfsgegevens
 * - Real-time zoeken en filteren
 * - Scroll positie herstel bij navigatie
 * - Statistieken en tellingen
 * - Animaties en loading states
 * - Error handling met fallback data
 * - Caching systeem voor betere performance
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

// 🔧 GLOBAL CACHE - shared across page loads
window.bedrijvenCache = window.bedrijvenCache || {
  data: null,
  timestamp: null,
  maxAge: 5 * 60 * 1000, // 5 minutes cache
};

/**
 * 🏢 AlleBedrijvenManager - Hoofdklasse voor bedrijven overzicht
 * 
 * Deze klasse beheert alle functionaliteit voor de bedrijven overzichtspagina:
 * - Laden en cachen van bedrijfsgegevens
 * - Rendering van bedrijfskaarten
 * - Zoek- en filterfunctionaliteit
 * - Navigatie en scroll positie beheer
 * - Error handling en loading states
 * 
 * @class AlleBedrijvenManager
 */
class AlleBedrijvenManager {
  /**
   * Constructor voor AlleBedrijvenManager
   * 
   * Initialiseert de manager en start het laden van bedrijfsgegevens
   */
  constructor() {
    this.bedrijven = [];
    this.filteredBedrijven = [];
    this.companyGrid = document.querySelector(".bedrijfTegels");
    this.searchInput = document.querySelector(".filter-bar .search-input");
    this.statsText = document.querySelector(".stats-bar .stats-text");
    this.loadingPlaceholder = document.querySelector(".loading-placeholder");

    this.init();
  }

  /**
   * 🚀 Initialiseert de bedrijven manager
   * 
   * Zet event listeners op, laadt bedrijfsgegevens en herstelt scroll positie
   * 
   * @returns {Promise<void>}
   */
  async init() {
    try {
      this.setupEventListeners();
      await this.loadAlleBedrijven();
      this.updateStats();
      this.restoreScrollPosition();
    } catch (error) {
      this.showError("Er ging iets mis bij het laden van de bedrijven");
    }
  }

  /**
   * 📜 Herstelt scroll positie bij terugkeer
   * 
   * Herstelt de scroll positie die opgeslagen was bij het verlaten van de pagina
   * 
   * @returns {void}
   */
  restoreScrollPosition() {
    const savedPosition = sessionStorage.getItem("alleBedrijvenScrollPosition");
    if (savedPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition));
        sessionStorage.removeItem("alleBedrijvenScrollPosition");
      }, 100); // Kleine vertraging om te verzekeren dat content geladen is
    }
  }

  /**
   * 💾 Controleert of cache nog geldig is
   * 
   * Bepaalt of de gecachte bedrijfsgegevens nog bruikbaar zijn
   * 
   * @returns {boolean} True als cache geldig is
   */
  isCacheValid() {
    const cache = window.bedrijvenCache;
    if (!cache.data || !cache.timestamp) {
      return false;
    }
    const now = Date.now();
    const isValid = now - cache.timestamp < cache.maxAge;
    return isValid;
  }

  /**
   * 📡 Laadt alle bedrijven via API met caching
   * 
   * Haalt bedrijfsgegevens op van de backend met caching voor performance
   * en handelt errors af met fallback data
   * 
   * @returns {Promise<void>}
   */
  async loadAlleBedrijven() {
    // Check cache first
    if (this.isCacheValid()) {
      this.bedrijven = window.bedrijvenCache.data;
      this.filteredBedrijven = [...this.bedrijven];
      this.displayBedrijven();
      this.hideLoadingPlaceholder();
      return;
    }
    
    try {
      this.showLoading(true);
      const response = await fetch("/api/bedrijven", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.bedrijven = result.data;
        this.filteredBedrijven = [...this.bedrijven];
        
        // Cache the data
        window.bedrijvenCache = {
          data: this.bedrijven,
          timestamp: Date.now(),
          maxAge: window.bedrijvenCache.maxAge,
        };
        
        this.displayBedrijven();
      } else {
        throw new Error(result.message || "Onbekende fout");
      }
    } catch (error) {
      this.showError("Kan bedrijven niet laden: " + error.message);
      this.displayFallbackBedrijven();
    } finally {
      this.showLoading(false);
      this.hideLoadingPlaceholder();
    }
  }

  /**
   * 🎨 Toont bedrijven in de UI
   * 
   * Rendert alle bedrijven als klikbare kaarten met geoptimaliseerde performance
   * 
   * @returns {void}
   */
  displayBedrijven() {
    if (!this.companyGrid) {
      return;
    }

    this.hideLoadingPlaceholder();

    if (this.filteredBedrijven.length === 0) {
      this.companyGrid.innerHTML = `
        <div class="no-results">
          <h3>Geen bedrijven gevonden</h3>
          <p>Probeer uw zoekopdracht aan te passen</p>
        </div>
      `;
      return;
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    this.filteredBedrijven.forEach((bedrijf, index) => {
      const bedrijfCard = this.createBedrijfCard(bedrijf, index);
      fragment.appendChild(bedrijfCard);
    });

    this.companyGrid.innerHTML = "";
    this.companyGrid.appendChild(fragment);
  }

  /**
   * 🔧 Verbergt loading placeholder
   * 
   * Verwijdert de loading indicator uit de UI
   * 
   * @returns {void}
   */
  hideLoadingPlaceholder() {
    if (this.loadingPlaceholder) {
      this.loadingPlaceholder.style.display = "none";
    }
  }

  /**
   * 🎴 Creëert een individuele bedrijfskaart
   * 
   * Genereert een klikbare kaart met bedrijfsinformatie
   * die navigeert naar de detailpagina
   * 
   * @param {Object} bedrijf - Bedrijf object met gegevens
   * @param {number} index - Index voor animatie delay
   * @returns {HTMLElement} Bedrijf kaart element
   */
  createBedrijfCard(bedrijf, index) {
    const card = document.createElement('a');
    card.className = 'bedrijfTegel';
    card.href = `/resultaat-bedrijf?id=${bedrijf.bedrijfsnummer}`;
    card.style.animationDelay = `${index * 0.1}s`;
    card.addEventListener("click", () => {
      this.navigateToBedrijfDetail(bedrijf.bedrijfsnummer);
    });
    
    // Get description or fallback
    const beschrijving =
      bedrijf.bechrijving ||
      bedrijf.beschrijving ||
      "Meer informatie beschikbaar op de detailpagina.";
    
    // Extra info
    const email = bedrijf.email ? `<span class='bedrijf-email'><i class='fas fa-envelope'></i> ${bedrijf.email}</span>` : '';
    const telefoon = bedrijf.gsm_nummer ? `<span class='bedrijf-telefoon'><i class='fas fa-phone'></i> ${bedrijf.gsm_nummer}</span>` : '';
    
    card.innerHTML = `
      <h2 class="bedrijfNaam">${bedrijf.naam}</h2>
      <p class="bedrijfSector">${bedrijf.sector}</p>
      <p class="bedrijfBeschrijving">${beschrijving}</p>
      <div class="bedrijf-info">
        <span class="bedrijf-locatie">📍 ${bedrijf.gemeente}</span>
        <span class="bedrijf-tafel">🏷️ Tafel ${bedrijf.tafelNr || "TBD"}</span>
      </div>
      <div class="bedrijf-contact" style="margin-top:0.5rem; font-size:0.9em; color:#881538; display:flex; gap:1.5rem; flex-wrap:wrap;">
        ${email}
        ${telefoon}
      </div>
    `;
    return card;
  }

  /**
   * 🔗 Navigeert naar bedrijf detailpagina
   * 
   * Slaat huidige scroll positie op en navigeert naar detailpagina
   * 
   * @param {string} bedrijfsnummer - Het bedrijfsnummer van het bedrijf
   * @returns {void}
   */
  navigateToBedrijfDetail(bedrijfsnummer) {
    // Store current scroll position for when user returns
    sessionStorage.setItem(
      "alleBedrijvenScrollPosition",
      window.pageYOffset.toString()
    );
    
    window.location.href = `/resultaat-bedrijf?id=${bedrijfsnummer}`;
  }

  /**
   * 🔍 Zet event listeners op
   * 
   * Initialiseert event listeners voor zoeken en filteren
   * 
   * @returns {void}
   */
  setupEventListeners() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Filter button (placeholder for future functionality)
    const filterBtn = document.querySelector(".filter-btn");
    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
        // TODO: Implement filter modal/dropdown
      });
    }
  }

  /**
   * 🔍 Handelt zoeken af
   * 
   * Filtert bedrijven op basis van zoekterm en update de weergave
   * 
   * @param {string} searchTerm - De zoekterm om op te filteren
   * @returns {void}
   */
  handleSearch(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === "") {
      this.filteredBedrijven = [...this.bedrijven];
    } else {
      this.filteredBedrijven = this.bedrijven.filter(bedrijf => {
        const searchableText = `
          ${bedrijf.naam} 
          ${bedrijf.sector} 
          ${bedrijf.gemeente} 
          ${bedrijf.beschrijving || bedrijf.bechrijving || ""}
        `.toLowerCase();
        
        return searchableText.includes(term);
      });
    }
    
    this.displayBedrijven();
    this.updateStats();
  }

  /**
   * 📊 Werkt statistieken bij
   * 
   * Toont het aantal bedrijven en andere relevante statistieken
   * 
   * @returns {void}
   */
  updateStats() {
    if (this.statsText) {
      this.statsText.textContent = `${this.filteredBedrijven.length} bedrijven gevonden`;
    }
  }

  /**
   * ⏳ Toont/verbergt loading state
   * 
   * Controleert de zichtbaarheid van loading indicators
   * 
   * @param {boolean} show - Of loading state getoond moet worden
   * @returns {void}
   */
  showLoading(show) {
    const loadingElements = document.querySelectorAll('.loading-indicator, .spinner');
    loadingElements.forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });
  }

  /**
   * ❌ Toont error state
   * 
   * Toont een foutmelding aan de gebruiker
   * 
   * @param {string} message - De foutmelding om te tonen
   * @returns {void}
   */
  showError(message) {
    if (this.companyGrid) {
      this.companyGrid.innerHTML = `
        <div class="error-state">
          <h3>⚠️ Fout bij laden</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="retry-btn">🔄 Probeer opnieuw</button>
        </div>
      `;
    }
  }

  /**
   * ℹ️ Toont info melding
   * 
   * Toont een informatieve melding aan de gebruiker
   * 
   * @param {string} message - De melding om te tonen
   * @returns {void}
   */
  showInfo(message) {
    this.showNotification(message, 'info');
  }

  /**
   * 📢 Toont notificatie aan gebruiker
   * 
   * Deze functie toont een notificatie met verschillende types
   * 
   * @param {string} message - De melding om te tonen
   * @param {string} type - Het type notificatie ('info', 'success', 'warning', 'error')
   * @returns {void}
   */
  showNotification(message, type = "info") {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      alert(`${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * 🎭 Toont fallback bedrijven data
   * 
   * Toont test data wanneer de API niet beschikbaar is
   * 
   * @returns {void}
   */
  displayFallbackBedrijven() {
    const fallbackData = [
      {
        bedrijfsnummer: '1',
        naam: 'TechCorp Solutions',
        sector: 'IT & Software',
        gemeente: 'Brussel',
        email: 'info@techcorp.be',
        gsm_nummer: '+32 2 123 45 67',
        beschrijving: 'Innovatieve IT oplossingen voor moderne bedrijven.',
        tafelNr: 'A1'
      },
      {
        bedrijfsnummer: '2',
        naam: 'Digital Innovations',
        sector: 'Digital Marketing',
        gemeente: 'Antwerpen',
        email: 'contact@digitalinnovations.be',
        gsm_nummer: '+32 3 234 56 78',
        beschrijving: 'Digitale transformatie en marketing strategieën.',
        tafelNr: 'B2'
      }
    ];

    this.bedrijven = fallbackData;
    this.filteredBedrijven = [...fallbackData];
    this.displayBedrijven();
    this.showInfo('Test data wordt gebruikt - API niet beschikbaar');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AlleBedrijvenManager();
});

// 🔧 GLOBAL REFRESH FUNCTION for HTML button (used by onclick="refreshBedrijven()")
/**
 * 🔄 Handmatige refresh functie voor bedrijven lijst
 * 
 * Deze functie wordt aangeroepen door de HTML refresh knop
 * en zorgt ervoor dat de bedrijven cache wordt gewist en
 * de lijst opnieuw wordt geladen
 * 
 * @returns {void}
 */
window.refreshBedrijven = function () {
  if (alleBedrijvenManager) {
    // Clear cache
    window.bedrijvenCache = {
      data: null,
      timestamp: null,
      maxAge: window.bedrijvenCache.maxAge || 5 * 60 * 1000,
    }; // Reload
    alleBedrijvenManager.loadAlleBedrijven();
  }
};

// Export for potential use (if other modules need to access this manager)
window.AlleBedrijvenManager = AlleBedrijvenManager;
