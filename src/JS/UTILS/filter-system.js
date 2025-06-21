// src/JS/UTILS/filter-system.js
// Filter systeem voor de homepage zoekbalk
console.log('🔧 Filter systeem geladen');

class FilterSystem {
  constructor() {
    this.filterBtn = document.getElementById('filterBtn');
    this.filterModal = document.getElementById('filterModal');
    this.filterModalClose = document.getElementById('filterModalClose');
    this.filterApplyBtn = document.getElementById('filterApplyBtn');
    this.filterClearBtn = document.getElementById('filterClearBtn');
    
    // Filter inputs
    this.studierichtingFilter = document.getElementById('studierichtingFilter');
    this.sectorFilter = document.getElementById('sectorFilter');
    this.techFilters = document.querySelectorAll('.techFilter');
    
    // Huidige filters
    this.activeFilters = {
      studierichting: '',
      sector: '',
      technologieen: []
    };
    
    this.init();
  }
  
  init() {
    if (!this.filterBtn || !this.filterModal) {
      console.error('❌ Filter elementen niet gevonden');
      return;
    }
    
    this.setupEventListeners();
    this.loadFilterOptions();
  }
  
  setupEventListeners() {
    // Filter knop
    this.filterBtn.addEventListener('click', () => this.openFilterModal());
    
    // Modal sluiten
    this.filterModalClose.addEventListener('click', () => this.closeFilterModal());
    this.filterModal.addEventListener('click', (e) => {
      if (e.target === this.filterModal) {
        this.closeFilterModal();
      }
    });
    
    // Filter acties
    this.filterApplyBtn.addEventListener('click', () => this.applyFilters());
    this.filterClearBtn.addEventListener('click', () => this.clearFilters());
    
    // ESC toets om modal te sluiten
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.filterModal.classList.contains('show')) {
        this.closeFilterModal();
      }
    });
  }
  
  async loadFilterOptions() {
    try {
      // Laad beschikbare studierichtingen uit de database
      const response = await fetch('/api/studenten');
      if (response.ok) {
        const data = await response.json();
        const studenten = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        
        // Verzamel unieke studierichtingen
        const studierichtingen = [...new Set(studenten.map(s => s.opleiding).filter(Boolean))];
        
        // Update de dropdown
        this.updateStudierichtingOptions(studierichtingen);
      }
    } catch (error) {
      console.warn('⚠️ Kon studierichtingen niet laden:', error);
    }
    
    try {
      // Laad beschikbare sectoren uit de database
      const response = await fetch('/api/bedrijven');
      if (response.ok) {
        const data = await response.json();
        const bedrijven = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        
        // Verzamel unieke sectoren
        const sectoren = [...new Set(bedrijven.map(b => b.sector).filter(Boolean))];
        
        // Update de dropdown
        this.updateSectorOptions(sectoren);
      }
    } catch (error) {
      console.warn('⚠️ Kon sectoren niet laden:', error);
    }
  }
  
  updateStudierichtingOptions(studierichtingen) {
    if (!this.studierichtingFilter) return;
    
    // Behoud de eerste optie (Alle studierichtingen)
    const firstOption = this.studierichtingFilter.firstElementChild;
    this.studierichtingFilter.innerHTML = '';
    this.studierichtingFilter.appendChild(firstOption);
    
    // Voeg nieuwe opties toe
    studierichtingen.forEach(studierichting => {
      const option = document.createElement('option');
      option.value = studierichting;
      option.textContent = studierichting;
      this.studierichtingFilter.appendChild(option);
    });
  }
  
  updateSectorOptions(sectoren) {
    if (!this.sectorFilter) return;
    
    // Behoud de eerste optie (Alle sectoren)
    const firstOption = this.sectorFilter.firstElementChild;
    this.sectorFilter.innerHTML = '';
    this.sectorFilter.appendChild(firstOption);
    
    // Voeg nieuwe opties toe
    sectoren.forEach(sector => {
      const option = document.createElement('option');
      option.value = sector;
      option.textContent = sector;
      this.sectorFilter.appendChild(option);
    });
  }
  
  openFilterModal() {
    this.filterModal.classList.add('show');
    this.filterBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  closeFilterModal() {
    this.filterModal.classList.remove('show');
    this.filterBtn.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  applyFilters() {
    // Verzamel filter waarden
    this.activeFilters.studierichting = this.studierichtingFilter.value;
    this.activeFilters.sector = this.sectorFilter.value;
    this.activeFilters.technologieen = Array.from(this.techFilters)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    // Sluit modal
    this.closeFilterModal();
    
    // Update zoekresultaten met filters
    this.updateSearchResults();
    
    // Toon feedback
    this.showFilterFeedback();
  }
  
  clearFilters() {
    // Reset alle filters
    this.studierichtingFilter.value = '';
    this.sectorFilter.value = '';
    this.techFilters.forEach(checkbox => checkbox.checked = false);
    
    this.activeFilters = {
      studierichting: '',
      sector: '',
      technologieen: []
    };
    
    // Update zoekresultaten
    this.updateSearchResults();
    
    // Toon feedback
    this.showFilterFeedback('Filters gewist');
  }
  
  updateSearchResults() {
    // Trigger een nieuwe zoekopdracht met de huidige zoekterm en filters
    const searchInput = document.querySelector('.search-input');
    if (searchInput && window.zoekbalkHomepage) {
      // Trigger de zoekfunctie opnieuw met filters
      window.zoekbalkHomepage.onSearch(searchInput.value);
    }
  }
  
  showFilterFeedback(message = null) {
    // Toon een kleine notificatie
    const feedback = document.createElement('div');
    feedback.className = 'filter-feedback';
    feedback.textContent = message || this.getFilterSummary();
    
    // Voeg feedback toe aan de pagina
    document.body.appendChild(feedback);
    
    // Verwijder na 3 seconden
    setTimeout(() => {
      feedback.remove();
    }, 3000);
  }
  
  getFilterSummary() {
    const filters = [];
    
    if (this.activeFilters.studierichting) {
      filters.push(`Studierichting: ${this.activeFilters.studierichting}`);
    }
    
    if (this.activeFilters.sector) {
      filters.push(`Sector: ${this.activeFilters.sector}`);
    }
    
    if (this.activeFilters.technologieen.length > 0) {
      filters.push(`Technologieën: ${this.activeFilters.technologieen.join(', ')}`);
    }
    
    return filters.length > 0 ? `Filters toegepast: ${filters.join(' | ')}` : 'Geen filters actief';
  }
  
  // Methode om te controleren of een item voldoet aan de filters
  matchesFilters(item) {
    // Studierichting filter
    if (this.activeFilters.studierichting && item._type === 'student') {
      if (item.opleiding !== this.activeFilters.studierichting) {
        return false;
      }
    }
    
    // Sector filter
    if (this.activeFilters.sector && item._type === 'bedrijf') {
      if (item.sector !== this.activeFilters.sector) {
        return false;
      }
    }
    
    // Technologieën filter
    if (this.activeFilters.technologieen.length > 0) {
      let hasMatchingTech = false;
      
      if (item._type === 'project' && item.technologieen) {
        // Voor projecten, check technologieën
        hasMatchingTech = this.activeFilters.technologieen.some(tech => 
          item.technologieen.toLowerCase().includes(tech.toLowerCase())
        );
      } else if (item._type === 'student' && item.vaardigheden) {
        // Voor studenten, check vaardigheden
        hasMatchingTech = this.activeFilters.technologieen.some(tech => 
          item.vaardigheden.toLowerCase().includes(tech.toLowerCase())
        );
      } else if (item._type === 'bedrijf' && item.technologieen) {
        // Voor bedrijven, check technologieën
        hasMatchingTech = this.activeFilters.technologieen.some(tech => 
          item.technologieen.toLowerCase().includes(tech.toLowerCase())
        );
      }
      
      if (!hasMatchingTech) {
        return false;
      }
    }
    
    return true;
  }
  
  // Methode om de zoekresultaten te filteren
  filterSearchResults(results) {
    if (!this.hasActiveFilters()) {
      return results;
    }
    
    return results.filter(item => this.matchesFilters(item));
  }
  
  hasActiveFilters() {
    return this.activeFilters.studierichting || 
           this.activeFilters.sector || 
           this.activeFilters.technologieen.length > 0;
  }
}

// Start het filter systeem
window.addEventListener('DOMContentLoaded', () => {
  window.filterSystem = new FilterSystem();
});

// Export voor gebruik in andere bestanden
export default FilterSystem; 