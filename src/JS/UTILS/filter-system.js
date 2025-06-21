// src/JS/UTILS/filter-system.js
// Filter systeem voor de homepage zoekbalk
console.log('🔧 Filter systeem geladen (v1 - Modal)');

class FilterSystem {
  constructor() {
    this.filterBtn = document.getElementById('filterBtn');
    this.filterModal = document.getElementById('filterModal');
    this.filterModalClose = document.getElementById('filterModalClose');
    this.filterApplyBtn = document.getElementById('filterApplyBtn');
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
    if (!this.filterBtn || !this.filterModal) return;
    
    // Event listeners
    this.filterBtn.addEventListener('click', () => this.openModal());
    this.filterModalClose.addEventListener('click', () => this.closeModal());
    this.filterModal.addEventListener('click', (e) => {
        if (e.target === this.filterModal) {
            this.closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.filterModal.classList.contains('show')) {
            this.closeModal();
        }
    });

    this.filterApplyBtn.addEventListener('click', () => this.applyFilters());
    this.filterClearBtn.addEventListener('click', () => this.clearFilters());

    this.loadFilterOptions();
  }

  openModal() {
    this.filterModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.filterModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  async loadFilterOptions() {
    try {
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
    
    this.closeModal();
    
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
      if (item._type === 'student') {
        if (this.activeFilters.studierichting && item.opleiding !== this.activeFilters.studierichting) return false;
        if (this.activeFilters.opleidingsrichting && item.opleidingsrichting !== this.activeFilters.opleidingsrichting) return false;
        if (this.activeFilters.taal && (!item.talen || !item.talen.includes(this.activeFilters.taal))) return false;
      }
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