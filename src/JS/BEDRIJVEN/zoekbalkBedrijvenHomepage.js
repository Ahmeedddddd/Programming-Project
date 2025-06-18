// Zoekbalk alleen voor studenten & projecten op de bedrijven-homepage

console.log('🔎 ZoekbalkHomepage voor bedrijven loaded');

// Global caches
window.entityCaches = {
  studenten: { data: [], timestamp: 0, maxAge: 5 * 60 * 1000 },
  projecten: { data: [], timestamp: 0, maxAge: 5 * 60 * 1000 }
};

class ZoekbalkHomepage {
  constructor() {
    this.searchInput = document.querySelector('.search-input');
    this.datalist = document.querySelector('#search-suggestions');
    this.resultsWrap = document.querySelector('#searchResults');

    if (!this.searchInput || !this.resultsWrap) {
      console.error('❌ Zoekbalk of resultaten-container niet gevonden');
      return;
    }

    this.searchInput.addEventListener('input', e => this.onSearch(e.target.value));
    this.init();
  }

  async init() {
    try {
      // Alleen studenten en projecten ophalen
      await Promise.all([
        this.loadData('studenten', '/api/studenten'),
        this.loadData('projecten', '/api/projecten')
      ]);
      this.renderResults([], '');
    } catch (err) {
      console.error('❌ Initialisatie fout:', err);
    }
  }

  isCacheValid(cache) {
    return (Date.now() - cache.timestamp) < cache.maxAge;
  }

  async loadData(key, endpoint) {
    const cache = window.entityCaches[key];
    if (this.isCacheValid(cache)) return;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const list = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
      cache.data = list;
    } catch (err) {
      console.warn(`⚠️ Fout bij laden ${key}, fallback voor ${key}`, err);
      if (key === 'projecten') {
        cache.data = [
          { projectId: 'static-1', projectTitel: 'Voorbeeld Project 1', projectBeschrijving: 'Beschrijving...', studentNaam: 'Naam Student' }
        ];
      } else {
        cache.data = [];
      }
    } finally {
      cache.timestamp = Date.now();
    }
  }

  onSearch(raw) {
    const term = raw.trim().toLowerCase();
    this.updateDatalist(term);
    this.filterAndDisplay(term);
  }

  updateDatalist(term) {
    if (!this.datalist) return;
    const { studenten, projecten } = window.entityCaches;
    const allNames = [
      ...studenten.data.map(s => `${s.voornaam} ${s.achternaam}`),
      ...projecten.data.map(p => p.projectTitel)
    ];

    const opts = [...new Set(
      allNames.filter(n => n.toLowerCase().startsWith(term)).slice(0, 10)
    )];

    this.datalist.innerHTML = opts.map(v => `<option value="${v}">`).join('');
  }

  filterAndDisplay(term) {
    const { studenten, projecten } = window.entityCaches;
    const match = text => text && text.toLowerCase().includes(term);

    const fs = term
      ? studenten.data.filter(s => match(`${s.voornaam} ${s.achternaam}`) || match(s.opleiding) || match(s.gemeente))
      : [];
    const fp = term
      ? projecten.data.filter(p => match(p.projectTitel) || match(p.studentNaam))
      : [];

    const combined = [
      ...fs.map(s => ({ ...s, _type: 'student' })),
      ...fp.map(p => ({ ...p, _type: 'project' }))
    ].slice(0, 5);

    this.renderResults(combined, term);
  }

  renderResults(items, term) {
    this.resultsWrap.innerHTML = '';
    if (!term || items.length === 0) return;

    this.resultsWrap.style.display = 'flex';
    this.resultsWrap.style.flexWrap = 'wrap';
    this.resultsWrap.style.gap = '1rem';
    this.resultsWrap.style.justifyContent = items.length === 1 ? 'center' : 'flex-start';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'infoblock';
      card.onclick = () => {
        let url = '#';
        if (item._type === 'student') url = `/zoekbalk-studenten?id=${item.studentnummer}`;
        if (item._type === 'project') url = `/zoekbalk-projecten?id=${item.projectId}`;
        window.location.href = url;
      };

      const icon = {
        student: '🎓',
        project: '🚀'
      }[item._type] || '';

      const title = item._type === 'project'
        ? item.projectTitel
        : `${item.voornaam} ${item.achternaam}`;

      const subtitle = item._type === 'student'
        ? item.opleiding
        : item.projectBeschrijving || '';

      card.innerHTML = `
        <div class="infoblock-icon">${icon}</div>
        <h4 class="infoblock-title">${title}</h4>
        <p class="infoblock-subtitle">${subtitle}</p>
      `;

      this.resultsWrap.appendChild(card);
    });
  }
}

// start alleen op de bedrijven homepage!
window.addEventListener('DOMContentLoaded', () => new ZoekbalkHomepage());
