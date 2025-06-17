// src/JS/RESULTS/zoekbalkHomepage.js
// Unified search with live suggestions and info blocks
console.log('🔎 ZoekbalkHomepage loaded');

// Global caches
window.entityCaches = {
  bedrijven: { data: null, timestamp: null, maxAge: 5 * 60 * 1000 },
  studenten: { data: null, timestamp: null, maxAge: 5 * 60 * 1000 },
  projecten: { data: null, timestamp: null, maxAge: 5 * 60 * 1000 }
};

class ZoekbalkHomepage {
  constructor() {
    this.searchInput  = document.querySelector('.search-input');
    this.datalist     = document.querySelector('#search-suggestions');
    this.resultsWrap  = document.querySelector('#searchResults');

    if (!this.searchInput || !this.resultsWrap) {
      console.error('❌ Zoekbalk of resultaten-container niet gevonden');
      return;
    }

    this.setupSearch();
    this.init();
  }

  async init() {
    try {
      // preload data
      await Promise.all([
        this.load('bedrijven', '/api/bedrijven'),
        this.load('studenten', '/api/studenten'),
        this.load('projecten', '/api/projecten')
      ]);
      // initial empty display
      this.filterAndDisplay('');
    } catch (e) {
      console.error('❌ Initialisatie fout:', e);
    }
  }

  setupSearch() {
    this.searchInput.addEventListener('input', e => {
      const term = e.target.value.toLowerCase().trim();
      this.updateDatalist(term);
      this.filterAndDisplay(term);
    });
  }

  isValid(cache) {
    return cache.data && (Date.now() - cache.timestamp < cache.maxAge);
  }

  async load(key, url) {
    const cache = window.entityCaches[key];
    if (this.isValid(cache)) return;
    const res  = await fetch(url);
    const json = await res.json();
    window.entityCaches[key] = {
      ...cache,
      data: json.success ? json.data : [],
      timestamp: Date.now()
    };
  }

  filterAndDisplay(term) {
    const e = window.entityCaches;
    const match = (str='') => str.toLowerCase().includes(term);

    const fb = term
      ? e.bedrijven.data.filter(b => match(b.naam) || match(b.sector) || match(b.gemeente))
      : e.bedrijven.data;
    const fs = term
      ? e.studenten.data.filter(s =>{
          const name = `${s.voornaam} ${s.achternaam}`;
          return match(name) || match(s.opleiding) || match(s.gemeente);
        })
      : e.studenten.data;
    const fp = term
      ? e.projecten.data.filter(p => match(p.projectTitel) || match(p.studentNaam))
      : e.projecten.data;

    // Combine and limit
    const combined = [
      ...fb.map(b => ({ ...b, _type: 'bedrijf' })),
      ...fs.map(s => ({ ...s, _type: 'student' })),
      ...fp.map(p => ({ ...p, _type: 'project' }))
    ].slice(0, 5);

    this.renderResults(combined, term);
  }

  updateDatalist(term) {
    if (!this.datalist) return;
    const e = window.entityCaches;
    const starts = arr => arr
      .filter(item => item.toLowerCase().startsWith(term))
      .slice(0, 5);

    const compNames = (e.bedrijven.data || []).map(b => b.naam);
    const studNames = (e.studenten.data || []).map(s => `${s.voornaam} ${s.achternaam}`);
    const projTitles = (e.projecten.data || []).map(p => p.projectTitel);

    const opts = Array.from(new Set([
      ...starts(compNames),
      ...starts(studNames),
      ...starts(projTitles)
    ])).slice(0, 10);

    this.datalist.innerHTML = opts.map(v => `<option value="${v}">`).join('');
  }

  renderResults(items, term) {
    // Layout: flex container, center if single
    this.resultsWrap.style.display = 'flex';
    this.resultsWrap.style.flexWrap = 'wrap';
    this.resultsWrap.style.gap = '1rem';
    this.resultsWrap.style.justifyContent = items.length === 1 ? 'center' : 'flex-start';

    // Clear
    this.resultsWrap.innerHTML = '';
    if (!term || items.length === 0) return;

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'infoblock';
      card.style.cursor = 'pointer';
      let inner = '';
      let href = '#';
      switch(item._type) {
        case 'bedrijf':
          inner = `<h3>${item.naam}</h3><p>${item.sector} &#x2022; ${item.gemeente}</p>`;
          href = `/resultaat-bedrijf?id=${item.bedrijfsnummer}`;
          break;
        case 'student':
          inner = `<h3>${item.voornaam} ${item.achternaam}</h3><p>${item.opleiding}</p>`;
          href = `/zoekbalk-studenten?id=${item.studentnummer}`;
          break;
        case 'project':
          inner = `<h3>${item.projectTitel}</h3><p>${item.projectBeschrijving || ''}</p>`;
          href = `/zoekbalk-projecten?id=${item.projectId}`;
          break;
      }
      card.innerHTML = inner;
      card.addEventListener('click', () => window.location.href = href);
      this.resultsWrap.appendChild(card);
    });
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => new ZoekbalkHomepage());
