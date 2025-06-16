/**
 * 🎯 NAVIGATION CONFIGURATIE - VERBETERDE VERSIE
 *
 * HIER PAS JE ALLE NAVIGATIE ITEMS AAN
 * Dit bestand wordt gebruikt door de backend om dynamische navigatie te genereren
 */

// ===== 📍 NAVIGATION CONFIG - HIER ALLES AANPASSEN =====
const NAVIGATION_CONFIG = {
  // ===== 👤 GUEST NAVIGATION (niet ingelogd) =====
  guest: {
    navbar: [
      { href: "/", text: "Home", icon: "fas fa-home" },
      { href: "/programma", text: "Programma", icon: "fas fa-calendar" },
      { href: "/info", text: "Info", icon: "fas fa-info-circle" },
      {
        href: "/login",
        text: "Login",
        icon: "fas fa-sign-in-alt",
        highlight: true,
      },
    ],
    sidebar: [
      { href: "/login", text: "Inloggen", icon: "fas fa-sign-in-alt" },
      { href: "/register", text: "Registreren", icon: "fas fa-user-plus" },
      { divider: true },
      { href: "/info", text: "Informatie", icon: "fas fa-info-circle" },
      { href: "/contacteer", text: "Contact", icon: "fas fa-envelope" }, // Aangepast naar /contacteer uit app.js
    ],
  },

  // ===== 🎓 STUDENT NAVIGATION =====
  student: {
    navbar: [
      { href: "/student-homepage", text: "Home", icon: "fas fa-home" },
      {
        href: "/programmaStudenten",
        text: "Programma",
        icon: "fas fa-calendar",
      },
      {
        href: "/mijnProject",
        text: "Mijn Project",
        icon: "fas fa-project-diagram",
      },
      { href: "/alleBedrijven", text: "Bedrijven", icon: "fas fa-building" },
      {
        href: "/gesprekkenOverzichtStudenten", // Aangepast naar de exacte route uit app.js
        text: "Mijn Gesprekken",
        icon: "fas fa-comments",
      },
    ],
    sidebar: [
      { href: "/accountStudent", text: "Mijn Account", icon: "fas fa-user" },
      {
        href: "/mijnProject",
        text: "Mijn Project",
        icon: "fas fa-project-diagram",
      },
      { divider: true },
      {
        href: "/alleBedrijven",
        text: "Alle Bedrijven",
        icon: "fas fa-building",
      },
      {
        href: "/gesprekkenOverzichtStudenten", // Aangepast naar de exacte route uit app.js
        text: "Mijn Gesprekken",
        icon: "fas fa-comments",
      },
      // Let op: '/planningStudent' is niet gedefinieerd in je app.js routes, tenzij het een generieke file is of via client-side routing.
      // Ik laat hem staan maar wees je ervan bewust dat hij een 404 kan geven.
      {
        href: "/planningStudent",
        text: "Mijn Planning",
        icon: "fas fa-calendar-alt",
      },
      { divider: true },
      { href: "/programma", text: "Programma", icon: "fas fa-calendar" },
      { href: "/info", text: "Info", icon: "fas fa-info-circle" },
      { divider: true },
      {
        action: "logout",
        text: "Uitloggen",
        icon: "fas fa-sign-out-alt",
        danger: true,
      },
    ],
  },

  // ===== 🏢 BEDRIJF NAVIGATION =====
  bedrijf: {
    navbar: [
      { href: "/bedrijf-homepage", text: "Home", icon: "fas fa-home" },
      {
        href: "/programmaBedrijven",
        text: "Programma",
        icon: "fas fa-calendar",
      },
      // Let op: '/geinteresseerden' is niet gedefinieerd in je app.js routes. Pas dit aan of voeg de route toe.
      {
        href: "/geinteresseerden",
        text: "Geïnteresseerden",
        icon: "fas fa-heart",
      },
      // Let op: '/gesprekken' is niet gedefinieerd in je app.js routes. Pas dit aan naar bijv. /gesprekkenOverzichtBedrijven of voeg de route toe.
      {
        href: "/gesprekkenOverzichtBedrijven",
        text: "Gesprekken",
        icon: "fas fa-comments",
      }, // Aangepast
      // Let op: '/planning' is niet gedefinieerd in je app.js routes. Pas dit aan of voeg de route toe.
      { href: "/planning", text: "Planning", icon: "fas fa-clock" },
    ],
    sidebar: [
      {
        href: "/accountBedrijf",
        text: "Bedrijfsprofiel",
        icon: "fas fa-building",
      },
      { divider: true },
      // Let op: '/geinteresseerden' is niet gedefinieerd in je app.js routes. Pas dit aan of voeg de route toe.
      {
        href: "/geinteresseerden",
        text: "Geïnteresseerde Studenten",
        icon: "fas fa-heart",
      },
      // Let op: '/gesprekken' is niet gedefinieerd in je app.js routes. Pas dit aan.
      {
        href: "/gesprekkenOverzichtBedrijven", // Aangepast
        text: "Gesprek Aanvragen",
        icon: "fas fa-comments",
      },
      // Let op: '/planning' is niet gedefinieerd in je app.js routes. Pas dit aan of voeg de route toe.
      { href: "/planning", text: "Mijn Planning", icon: "fas fa-clock" },
      { divider: true },
      { href: "/alleStudenten", text: "Alle Studenten", icon: "fas fa-users" },
      // Let op: '/projectenOverzicht' is niet gedefinieerd in je app.js routes. Pas dit aan naar /alleProjecten of voeg de route toe.
      {
        href: "/alleProjecten", // Aangepast naar een bestaande route
        text: "Student Projecten",
        icon: "fas fa-rocket",
      },
      { divider: true },
      { href: "/programma", text: "Programma", icon: "fas fa-calendar" },
      // Let op: '/statistieken' is niet gedefinieerd in je app.js routes. Pas dit aan of voeg de route toe.
      {
        href: "/statistieken",
        text: "Mijn Statistieken",
        icon: "fas fa-chart-bar",
      },
      { divider: true },
      {
        action: "logout",
        text: "Uitloggen",
        icon: "fas fa-sign-out-alt",
        danger: true,
      },
    ],
  },

  // ===== 👔 ORGANISATOR NAVIGATION =====  
  organisator: {
    navbar: [
      {
        href: "/accountOrganisator",
        text: "Dashboard",
        icon: "fas fa-tachometer-alt",
      }, // Meestal is dashboard de account pagina voor organisator
      { href: "/adminPanel", text: "Admin Panel", icon: "fas fa-cogs" },
      { href: "/alleStudenten", text: "Studenten", icon: "fas fa-users" },
      { href: "/alleBedrijven", text: "Bedrijven", icon: "fas fa-building" },
      { href: "/programma", text: "Programma", icon: "fas fa-calendar" },
    ],
    sidebar: [
      {
        href: "/accountOrganisator",
        text: "Mijn Account",
        icon: "fas fa-user",
      },
      { divider: true },
      { href: "/adminPanel", text: "Admin Panel", icon: "fas fa-cogs" },
      // De volgende routes zijn NIET gedefinieerd in je app.js.
      // Je moet ofwel routes toevoegen in app.js, of deze uit de config verwijderen/aanpassen naar bestaande routes.
      {
        href: "/gebruikersBeheer", // Deze route bestaat niet in app.js
        text: "Gebruikers Beheer",
        icon: "fas fa-users-cog",
      },
      { divider: true },
      {
        href: "/alleStudenten", // Deze route bestaat wel
        text: "Studenten Beheer",
        icon: "fas fa-users",
      },
      {
        href: "/alleBedrijven", // Deze route bestaat wel
        text: "Bedrijven Beheer",
        icon: "fas fa-building",
      },
      {
        href: "/evenementBeheer", // Deze route bestaat niet in app.js
        text: "Evenement Beheer",
        icon: "fas fa-calendar-plus",
      },
      { divider: true },
      {
        href: "/statistieken", // Deze route bestaat niet in app.js, tenzij het /api/stats/live is?
        text: "Live Statistieken",
        icon: "fas fa-chart-line",
      },
      { href: "/rapporten", text: "Rapporten", icon: "fas fa-file-alt" }, // Deze route bestaat niet in app.js
      { href: "/logs", text: "System Logs", icon: "fas fa-list-alt" }, // Deze route bestaat niet in app.js
      { divider: true },
      {
        href: "/instellingen", // Deze route bestaat niet in app.js
        text: "Systeeminstellingen",
        icon: "fas fa-wrench",
      },
      { href: "/backup", text: "Backup & Export", icon: "fas fa-download" }, // Deze route bestaat niet in app.js
      { divider: true },
      {
        action: "logout",
        text: "Uitloggen",
        icon: "fas fa-sign-out-alt",
        danger: true,
      },
    ],
  },
};

// ===== 🎨 UI INSTELLINGEN =====
const UI_SETTINGS = {
  // Automatisch active class zetten op huidige pagina
  autoSetActive: true,

  // CSS classes (pas aan naar jouw CSS)
  classes: {
    navbar: {
      default: "navItem",
      active: "active",
      highlight: "highlight-btn",
    },
    sidebar: {
      default: "sideMenu-item",
      danger: "danger-action",
      divider: "sideMenu-divider",
    },
  },

  // Debug mode (zet op false voor productie)
  debug: true, // ZET DEZE TIJDELIJK OP TRUE VOOR DEBUGGING!

  // Selectoren voor HTML elementen - Aangepast om je student-homepage.html te matchen
  selectors: {
    navbar: ".navBar, .navBarStudenten", // Voeg .navBarStudenten toe, of nog beter: verander de class in de HTML naar .navBar
    sidebar: ".sideMenu-content",
    welcomeMessage:
      ".aboutTitle, .planningHeader h2, .welcome-title, .aboutTitleStudenten", // Voeg .aboutTitleStudenten toe
  },
};

// ===== 📊 STATISTIEKEN CONFIGURATIE =====
const STATS_CONFIG = {
  // Welke statistieken te tonen
  enabled: true,

  // Database queries (gebruikt door backend)
  queries: {
    students: "SELECT COUNT(*) as count FROM STUDENT",
    companies: "SELECT COUNT(*) as count FROM BEDRIJF",
    appointments: "SELECT COUNT(*) as count FROM AFSPRAAK",
    projects:
      "SELECT COUNT(DISTINCT projectTitel) as count FROM STUDENT WHERE projectTitel IS NOT NULL",
  },

  // Fallback waarden als database niet beschikbaar
  fallback: {
    totalStudents: 21,
    totalCompanies: 17,
    totalProjects: 8,
    totalReservations: 12,
  },
};

// ===== 📤 EXPORTS - MOET AAN HET EINDE STAAN =====
module.exports = {
  NAVIGATION_CONFIG,
  UI_SETTINGS,
  STATS_CONFIG,
};
