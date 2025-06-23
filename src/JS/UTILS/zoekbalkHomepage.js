/**
 * 🔍 ZoekbalkHomepage.js - Geünificeerde zoekfunctionaliteit met live suggesties en info-blokken
 * 
 * Dit bestand implementeert een geavanceerde zoekfunctie die:
 * - Live suggesties toont tijdens het typen
 * - Resultaten cachet voor betere prestaties
 * - Zoekt door bedrijven, studenten en projecten
 * - Mooie info-blokken toont voor zoekresultaten
 * 
 * Belangrijke functionaliteiten:
 * - Real-time zoeken met live suggesties
 * - Intelligente caching voor betere prestaties
 * - Multi-categorie zoeken (bedrijven, studenten, projecten)
 * - Visuele resultaten met klikbare kaarten
 * - Automatische navigatie naar detailpagina's
 * - Responsive design ondersteuning
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

/**
 * 🌐 Globale caches voor betere prestaties
 * 
 * Slaat data op voor 5 minuten om onnodige API-calls te voorkomen
 * en de gebruikerservaring te verbeteren
 */
window.entityCaches = {
  bedrijven: { data: [], timestamp: 0, maxAge: 5 * 60 * 1000 }, // 5 minuten cache
  studenten: { data: [], timestamp: 0, maxAge: 5 * 60 * 1000 }, // 5 minuten cache
  projecten: { data: [], timestamp: 0, maxAge: 5 * 60 * 1000 }  // 5 minuten cache
};

/**
 * 🎯 Hoofdklasse voor de zoekfunctionaliteit
 * 
 * Deze klasse beheert alle aspecten van het zoeken en weergeven van resultaten:
 * - Initialisatie van DOM elementen
 * - Data loading en caching
 * - Real-time zoeken en filtering
 * - Rendering van zoekresultaten
 * - Navigatie naar detailpagina's
 */
class ZoekbalkHomepage {
  /**
   * Constructor voor de ZoekbalkHomepage klasse
   * 
   * Initialiseert de zoekfunctionaliteit door:
   * - DOM elementen op te halen
   * - Event listeners toe te voegen
   * - Validatie van vereiste elementen
   * - Start van de initialisatie
   */
  constructor() {
    // DOM-elementen ophalen
    this.searchInput = document.querySelector('.search-input');
    this.datalist = document.querySelector('#search-suggestions');
    this.resultsWrap = document.querySelector('#searchResults');

    // Validatie van vereiste elementen
    if (!this.searchInput || !this.resultsWrap) {
      return;
    }

    // Event listener voor live zoeken
    this.searchInput.addEventListener('input', e => this.onSearch(e.target.value));
    this.init();
  }

  /**
   * 🚀 Initialiseert de zoekfunctionaliteit
   * 
   * Deze functie laadt alle benodigde data en zet de interface op:
   * - Laadt data voor alle categorieën parallel
   * - Toont initiële lege staat
   * - Handelt fouten af met fallback data
   * 
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // 📥 Laad alle data parallel voor betere prestaties
      await Promise.all([
        this.loadData('bedrijven', '/api/bedrijven'),
        this.loadData('studenten', '/api/studenten'),
        this.loadData('projecten', '/api/projecten')
      ]);
      
      // 🎯 Toon geen resultaten bij lege zoekterm
      this.renderResults([], '');
    } catch (err) {
      // Stille fout handling - gebruik bestaande cache indien beschikbaar
    }
  }

  /**
   * ⏰ Controleert of de cache nog geldig is
   * 
   * Deze functie controleert of de opgeslagen data nog binnen
   * de geldigheidsperiode valt om onnodige API-calls te voorkomen
   * 
   * @param {Object} cache - Cache object met timestamp en maxAge
   * @returns {boolean} - Of de cache nog geldig is
   */
  isCacheValid(cache) {
    return (Date.now() - cache.timestamp) < cache.maxAge;
  }

  /**
   * 📡 Laadt data van de API met caching
   * 
   * Deze functie laadt data van de backend API met intelligente caching:
   * - Controleert eerst of cache nog geldig is
   * - Maakt API call indien nodig
   * - Handelt verschillende data formaten af
   * - Biedt fallback data bij fouten
   * 
   * @param {string} key - Cache sleutel (bedrijven/studenten/projecten)
   * @param {string} endpoint - API endpoint URL
   * @returns {Promise<void>}
   */
  async loadData(key, endpoint) {
    const cache = window.entityCaches[key];
    
    // Gebruik cache als deze nog geldig is
    if (this.isCacheValid(cache)) return;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const payload = await res.json();
      // Flexibele data-extractie voor verschillende API-formaten
      const list = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
      cache.data = list;
    } catch (err) {
      // 🔄 Optionele fallback voor projecten
      if (key === 'projecten') {
        cache.data = [
          { 
            projectId: 'static-1', 
            projectTitel: 'Voorbeeld Project 1', 
            projectBeschrijving: 'Beschrijving van een voorbeeldproject...', 
            studentNaam: 'Naam Student' 
          }
        ];
      } else {
        cache.data = [];
      }
    } finally {
      cache.timestamp = Date.now();
    }
  }

  /**
   * 🔍 Verwerkt zoekinput en triggert zoekacties
   * 
   * Deze functie wordt aangeroepen bij elke input wijziging en:
   * - Normaliseert de zoekterm
   * - Werkt de datalist bij met suggesties
   * - Filtert en toont resultaten
   * 
   * @param {string} raw - Ruwe zoekinput van gebruiker
   * @returns {void}
   */
  onSearch(raw) {
    const term = raw.trim().toLowerCase();
    this.updateDatalist(term);
    this.filterAndDisplay(term);
  }

  /**
   * 📝 Werkt de datalist bij met live suggesties
   * 
   * Deze functie genereert real-time suggesties voor de zoekbalk:
   * - Verzamelt namen uit alle categorieën
   * - Filtert op basis van huidige zoekterm
   * - Beperkt tot 10 suggesties voor performance
   * - Verwijdert duplicaten
   * 
   * @param {string} term - Huidige zoekterm
   * @returns {void}
   */
  updateDatalist(term) {
    if (!this.datalist) return;
    
    const { bedrijven, studenten, projecten } = window.entityCaches;
    
    // Verzamel alle namen voor suggesties
    const allNames = [
      ...bedrijven.data.map(b => b.naam),
      ...studenten.data.map(s => `${s.voornaam} ${s.achternaam}`),
      ...projecten.data.map(p => p.projectTitel)
    ];

    // Filter en beperk suggesties
    const opts = [...new Set(
      allNames.filter(n => n.toLowerCase().startsWith(term)).slice(0, 10)
    )];

    // Update datalist HTML
    this.datalist.innerHTML = opts.map(v => `<option value="${v}">`).join('');
  }

  /**
   * 🔍 Filtert data en toont resultaten
   * 
   * Deze functie filtert de gecachte data op basis van de zoekterm:
   * - Zoekt door bedrijfsnamen, sectoren en gemeenten
   * - Zoekt door studentnamen, opleidingen en gemeenten
   * - Zoekt door projecttitels en studentnamen
   * - Combineert resultaten en voegt type informatie toe
   * 
   * @param {string} term - Zoekterm voor filtering
   * @returns {void}
   */
  filterAndDisplay(term) {
    const { bedrijven, studenten, projecten } = window.entityCaches;
    
    // Helper functie voor tekst matching
    const match = text => text && text.toLowerCase().includes(term);

    // Filter elke categorie
    const fb = term
      ? bedrijven.data.filter(b => match(b.naam) || match(b.sector) || match(b.gemeente))
      : [];
    const fs = term
      ? studenten.data.filter(s => match(`${s.voornaam} ${s.achternaam}`) || match(s.opleiding) || match(s.gemeente))
      : [];
    const fp = term
      ? projecten.data.filter(p => match(p.projectTitel) || match(p.studentNaam))
      : [];

    // Combineer en voeg type toe voor identificatie
    const combined = [
      ...fb.map(b => ({ ...b, _type: 'bedrijf' })),
      ...fs.map(s => ({ ...s, _type: 'student' })),
      ...fp.map(p => ({ ...p, _type: 'project' }))
    ].slice(0, 5); // Beperk tot 5 resultaten

    this.renderResults(combined, term);
  }

  /**
   * 🎨 Rendert zoekresultaten als mooie info-blokken
   * 
   * Deze functie creëert visuele kaarten voor elk zoekresultaat:
   * - Maakt klikbare kaarten met hover effecten
   * - Toont relevante informatie per type
   * - Handelt navigatie naar detailpagina's af
   * - Past layout aan op basis van aantal resultaten
   * 
   * @param {Array} items - Gefilterde items om te tonen
   * @param {string} term - Huidige zoekterm
   * @returns {void}
   */
  renderResults(items, term) {
    // 🧹 Maak resultaten leeg
    this.resultsWrap.innerHTML = '';
    if (!term || items.length === 0) return;

    // 📐 Layout instellingen
    this.resultsWrap.style.display = 'flex';
    this.resultsWrap.style.flexWrap = 'wrap';
    this.resultsWrap.style.gap = '1rem';
    this.resultsWrap.style.justifyContent = items.length === 1 ? 'center' : 'flex-start';

    // 🎴 Maak kaarten voor elk resultaat
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'infoblock';
      
      // 🖱️ Click handler voor navigatie
      card.onclick = () => {
        let url = '#';
        if (item._type === 'bedrijf') url = `/resultaat-bedrijf?id=${item.bedrijfsnummer}`;
        if (item._type === 'student') url = `/zoekbalk-studenten?id=${item.studentnummer}`;
        if (item._type === 'project') url = `/zoekbalk-projecten?id=${item.projectId}`;
        window.location.href = url;
      };

      // 🎯 Icon mapping per type
      const icon = {
        bedrijf: '🏢',
        student: '🎓',
        project: '🚀'
      }[item._type] || '';

      // 📝 Titel generatie per type
      const title = item._type === 'project'
        ? item.projectTitel
        : item._type === 'student'
        ? `${item.voornaam} ${item.achternaam}`
        : item.naam;

      // 📄 Subtitel generatie per type
      const subtitle = item._type === 'bedrijf'
        ? `${item.sector} · ${item.gemeente}`
        : item._type === 'student'
        ? item.opleiding
        : item.projectBeschrijving || '';

      // 🎨 HTML structuur voor info-blok
      card.innerHTML = `
        <div class="infoblock-icon">${icon}</div>
        <h4 class="infoblock-title">${title}</h4>
        <p class="infoblock-subtitle">${subtitle}</p>
      `;

      this.resultsWrap.appendChild(card);
    });
  }
}

// 🚀 Start de zoekfunctionaliteit wanneer DOM geladen is
window.addEventListener('DOMContentLoaded', () => new ZoekbalkHomepage());
