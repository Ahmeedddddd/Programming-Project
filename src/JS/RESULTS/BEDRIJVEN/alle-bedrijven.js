// src/JS/RESULTS/BEDRIJVEN/alle-bedrijven.js
// ==========================================

class AlleBedrijvenPage {
  constructor() {
    this.bedrijven = [];
    this.filteredBedrijven = [];
    this.companyGrid = null;
    this.searchInput = null;
    this.loadingPlaceholder = null;
    this.init();
  }

  async init() {
    console.log("🚀 Initializing AlleBedrijvenPage");
    
    try {
      this.setupDOMReferences();
      this.setupEventListeners();
      await this.loadBedrijven();
      this.restoreScrollPosition();
    } catch (error) {
      console.error("❌ Initialization failed:", error);
      this.showError("Er ging iets mis bij het laden van de bedrijven");
    }
  }

  setupDOMReferences() {
    this.companyGrid = document.querySelector(".company-grid, .bedrijven-grid, .companies-grid");
    this.searchInput = document.querySelector(".search-input");
    this.loadingPlaceholder = document.querySelector("#loadingOverlay, .loading");
    
    if (!this.companyGrid) {
      console.error("❌ Company grid container not found");
      throw new Error("Required DOM elements not found");
    }
  }

  async loadBedrijven() {
    console.log("📊 Loading bedrijven...");
    this.showLoading(true);

    try {
      const response = await fetch("http://localhost:8383/api/bedrijven", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        this.bedrijven = data.data;
        this.filteredBedrijven = [...this.bedrijven];
        console.log(`✅ Loaded ${this.bedrijven.length} bedrijven`);

        this.renderBedrijven();
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (error) {
      console.error("❌ Failed to load bedrijven:", error);
      this.showError("Kon bedrijven niet laden. Probeer later opnieuw.");
    } finally {
      this.showLoading(false);
    }
  }

  renderBedrijven() {
    if (!this.companyGrid) {
      console.error("❌ Company grid not found");
      return;
    }

    if (this.filteredBedrijven.length === 0) {
      this.companyGrid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>Geen bedrijven gevonden</p>
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
    
    console.log("✅ Rendered bedrijven");
  }

  createBedrijfCard(bedrijf, index) {
    const article = document.createElement("article");
    article.className = "bedrijfTegel company-card";
    article.style.animationDelay = `${index * 0.05}s`;
    
    // Set data attributes for navigation
    article.dataset.companyId = bedrijf.bedrijfsnummer;
    article.dataset.bedrijfsnummer = bedrijf.bedrijfsnummer;
    
    // Make it clear it's clickable
    article.style.cursor = 'pointer';
    
    // FIX: Add click handler for navigation
    article.addEventListener("click", (e) => {
      // Don't navigate if clicking on a button
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }
      this.navigateToBedrijfDetail(bedrijf.bedrijfsnummer);
    });

    // Get description or fallback
    const beschrijving =
      bedrijf.beschrijving ||
      bedrijf.bechrijving || // Handle typo in database
      "Meer informatie beschikbaar op de detailpagina.";

    article.innerHTML = `
      <div class="bedrijf-header">
        <h2 class="bedrijfNaam">${bedrijf.naam}</h2>
        ${bedrijf.tafelNr ? `<span class="table-badge">Tafel ${bedrijf.tafelNr}</span>` : ''}
      </div>
      
      <p class="bedrijfSector">${bedrijf.sector || 'Sector niet gespecificeerd'}</p>
      
      <p class="bedrijfBeschrijving">
        ${beschrijving.length > 150 ? beschrijving.substring(0, 150) + '...' : beschrijving}
      </p>
      
      <div class="bedrijf-info">
        <span class="bedrijf-locatie">📍 ${bedrijf.gemeente || 'Locatie TBD'}</span>
        ${bedrijf.email ? '<span class="bedrijf-contact">📧 Contact mogelijk</span>' : ''}
      </div>
      
      <div class="bedrijf-actions">
        <button class="view-company-btn" data-company-id="${bedrijf.bedrijfsnummer}">
          Bekijk Bedrijf
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    `;

    // Also add click handler to button
    const button = article.querySelector('.view-company-btn');
    if (button) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigateToBedrijfDetail(bedrijf.bedrijfsnummer);
      });
    }

    return article;
  }

  // FIX: Navigate to correct bedrijf detail page
  navigateToBedrijfDetail(bedrijfsnummer) {
    console.log("🔗 Navigating to bedrijf detail:", bedrijfsnummer);
    
    // Store current scroll position for when user returns
    sessionStorage.setItem("alleBedrijvenScrollPosition", window.pageYOffset.toString());
    
    // Navigate with standardized path
    window.location.href = `/resultaat-bedrijf?id=${bedrijfsnummer}`;
  }

  setupEventListeners() {
    console.log("👂 Setting up event listeners");

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.debounce(() => this.handleSearch(e.target.value), 300)();
      });
    }

    // Sector filter
    const sectorFilter = document.querySelector("#sectorFilter");
    if (sectorFilter) {
      sectorFilter.addEventListener("change", (e) => {
        this.handleSectorFilter(e.target.value);
      });
    }

    // Location filter
    const locationFilter = document.querySelector("#locationFilter");
    if (locationFilter) {
      locationFilter.addEventListener("change", (e) => {
        this.handleLocationFilter(e.target.value);
      });
    }
  }

  handleSearch(searchTerm) {
    console.log("🔍 Searching for:", searchTerm);
    
    const term = searchTerm.toLowerCase();
    
    this.filteredBedrijven = this.bedrijven.filter(bedrijf => {
      const naam = (bedrijf.naam || '').toLowerCase();
      const sector = (bedrijf.sector || '').toLowerCase();
      const gemeente = (bedrijf.gemeente || '').toLowerCase();
      const beschrijving = (bedrijf.beschrijving || bedrijf.bechrijving || '').toLowerCase();
      
      return naam.includes(term) ||
             sector.includes(term) ||
             gemeente.includes(term) ||
             beschrijving.includes(term);
    });
    
    this.renderBedrijven();
    this.updateResultsCount();
  }

  handleSectorFilter(sector) {
    if (sector === 'alle') {
      this.filteredBedrijven = [...this.bedrijven];
    } else {
      this.filteredBedrijven = this.bedrijven.filter(b => b.sector === sector);
    }
    
    this.renderBedrijven();
    this.updateResultsCount();
  }

  handleLocationFilter(location) {
    if (location === 'alle') {
      this.filteredBedrijven = [...this.bedrijven];
    } else {
      this.filteredBedrijven = this.bedrijven.filter(b => b.gemeente === location);
    }
    
    this.renderBedrijven();
    this.updateResultsCount();
  }

  updateResultsCount() {
    const countElement = document.querySelector('.results-count, [data-count="bedrijven"]');
    if (countElement) {
      countElement.textContent = `${this.filteredBedrijven.length} bedrij${this.filteredBedrijven.length !== 1 ? 'ven' : 'f'}`;
    }
  }

  showLoading(show) {
    if (this.loadingPlaceholder) {
      this.loadingPlaceholder.style.display = show ? "flex" : "none";
    }
  }

  showError(message) {
    if (this.companyGrid) {
      this.companyGrid.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${message}</p>
          <button onclick="location.reload()">Probeer opnieuw</button>
        </div>
      `;
    }
  }

  showInfo(message) {
    const notification = document.createElement("div");
    notification.className = "notification notification-info";
    notification.innerHTML = `
      <i class="fas fa-info-circle"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  restoreScrollPosition() {
    const scrollPos = sessionStorage.getItem("alleBedrijvenScrollPosition");
    if (scrollPos) {
      window.scrollTo(0, parseInt(scrollPos));
      sessionStorage.removeItem("alleBedrijvenScrollPosition");
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌟 Starting AlleBedrijvenPage");
  new AlleBedrijvenPage();
});