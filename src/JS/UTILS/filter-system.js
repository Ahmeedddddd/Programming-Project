// src/JS/UTILS/filter-system.js
// Filter systeem voor de homepage zoekbalk
console.log('🔧 Filter systeem geladen (v2 - Dropdown)');

class FilterSystem {
  constructor() {
    this.filterBtn = document.getElementById('filterBtn');
    this.filterContainer = document.getElementById('filterContainer');
    this.filterClearBtn = document.getElementById('filterClearBtn');
    
    // Filter inputs
    this.studierichtingFilter = document.getElementById('studierichtingFilter');
    this.opleidingsrichtingFilter = document.getElementById('opleidingsrichtingFilter');
    this.talenFilter = document.getElementById('talenFilter');
    this.sectorFilter = document.getElementById('sectorFilter');
    
    // Huidige filters
    this.activeFilters = {
      studierichting: '',
      opleidingsrichting: '',
      taal: '',
      sector: '',
    };

    this.init();
  }

  init() {
    if (!this.filterBtn || !this.filterContainer) return;
    
    this.filterBtn.addEventListener('click', () => this.toggleFilterContainer());
    this.filterClearBtn.addEventListener('click', () => this.clearFilters());

    // Event listeners to apply filters immediately on change
    this.studierichtingFilter.addEventListener('change', () => this.applyFilters());
    this.opleidingsrichtingFilter.addEventListener('change', () => this.applyFilters());
    this.talenFilter.addEventListener('change', () => this.applyFilters());
    this.sectorFilter.addEventListener('change', () => this.applyFilters());

    document.addEventListener('click', (e) => {
      if (!this.filterContainer.contains(e.target) && !this.filterBtn.contains(e.target)) {
        this.closeFilterContainer();
      }
    });

    this.loadFilterOptions();
  }

  toggleFilterContainer() {
    this.filterContainer.classList.toggle('visible');
  }

  closeFilterContainer() {
    this.filterContainer.classList.remove('visible');
  }

  async loadFilterOptions() {
    try {
      // Fetch and populate all filters
      this.populateSelect(this.studierichtingFilter, (await window.api.get('/studenten/studierichtingen')).data);
      this.populateSelect(this.opleidingsrichtingFilter, (await window.api.get('/studenten/opleidingsrichtingen')).data);
      this.populateSelect(this.talenFilter, (await window.api.get('/studenten/talen')).data);
      this.populateSelect(this.sectorFilter, (await window.api.get('/bedrijven/sectoren')).data);
    } catch (error) {
      console.warn('⚠️ Kon een of meerdere filter-opties niet laden:', error);
    }
  }
  
  populateSelect(selectElement, options) {
    if (!selectElement || !Array.isArray(options)) return;
    
    const firstOption = selectElement.firstElementChild;
    selectElement.innerHTML = '';
    selectElement.appendChild(firstOption);
    
    options.forEach(optionData => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.text;
      selectElement.appendChild(option);
    });
  }
  
  applyFilters() {
    this.activeFilters.studierichting = this.studierichtingFilter.value;
    this.activeFilters.opleidingsrichting = this.opleidingsrichtingFilter.value;
    this.activeFilters.taal = this.talenFilter.value;
    this.activeFilters.sector = this.sectorFilter.value;
    
    // Trigger search in zoekbalkHomepage.js
    if (window.zoekbalkHomepage) {
      window.zoekbalkHomepage.filterAndDisplay();
    }
  }

  clearFilters() {
    this.studierichtingFilter.value = '';
    this.opleidingsrichtingFilter.value = '';
    this.talenFilter.value = '';
    this.sectorFilter.value = '';
    this.applyFilters();
  }

  hasActiveFilters() {
    return Object.values(this.activeFilters).some(val => val !== '');
  }

  filterSearchResults(items) {
    if (!this.hasActiveFilters()) {
      return items;
    }

    return items.filter(item => {
      // Student filters
      if (item._type === 'student') {
        if (this.activeFilters.studierichting && item.opleiding !== this.activeFilters.studierichting) return false;
        if (this.activeFilters.opleidingsrichting && item.opleidingsrichting !== this.activeFilters.opleidingsrichting) return false;
        if (this.activeFilters.taal && (!item.talen || !item.talen.includes(this.activeFilters.taal))) return false;
      }
      // Bedrijf filters
      if (item._type === 'bedrijf') {
        if (this.activeFilters.sector && item.sector !== this.activeFilters.sector) return false;
      }
      return true;
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.filterSystem = new FilterSystem();
});

// Export voor gebruik in andere bestanden
export default FilterSystem; 