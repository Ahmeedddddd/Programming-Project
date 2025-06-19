/**
 * 🎯 NAVIGATION CONFIGURATIE - VERBETERDE VERSIE
 *
 * HIER PAS JE ALLE NAVIGATIE ITEMS AAN
 * Dit bestand wordt gebruikt door de backend om dynamische navigatie te genereren
 */

// ===== 📍 NAVIGATION CONFIG - HIER ALLES AANPASSEN =====
const NAVIGATION_CONFIG = {
  guest: {
    navbar: [
      { href: "/", text: "Home" },
      { href: "/programma", text: "Programma" },
      { href: "/info", text: "Info" },
      { href: "/login", text: "Login", highlight: true }
    ],
    sidebar: [
      { href: "/login", text: "Inloggen", icon: "fas fa-sign-in-alt" },
      { href: "/register", text: "Registreren", icon: "fas fa-user-plus" },
      { href: "/contacteer", text: "Contact", icon: "fas fa-envelope" }
    ]
  },

  student: {
    navbar: [
      { href: "/student-homepage", text: "Home" },
      { href: "/programma", text: "Programma" },
      { href: "/gesprekkenOverzichtStudenten", text: "Mijn Gesprekken" },
      { href: "/alleBedrijven", text: "Bedrijven" },
      { href: "/alleProjecten", text: "Projecten" },
      { href: "/account-student", text: "Account", highlight: true }
    ],
    sidebar: [
      { href: "/account-student", text: "Mijn Account", icon: "fas fa-user" },
      { href: "/gegevens-student", text: "Mijn Gegevens", icon: "fas fa-id-card" },
      { href: "/mijn-project", text: "Mijn Project", icon: "fas fa-project-diagram" },
      { href: "/gesprekkenOverzichtStudenten", text: "Mijn Gesprekken", icon: "fas fa-calendar-alt" },
      { divider: true },
      { href: "/alleBedrijven", text: "Bedrijven Zoeken", icon: "fas fa-building" },
      { href: "/alleProjecten", text: "Andere Projecten", icon: "fas fa-rocket" },
      { divider: true },
      { action: "logout", text: "Uitloggen", icon: "fas fa-sign-out-alt", danger: true }
    ]
  },

  bedrijf: {
    navbar: [
      { href: "/bedrijf-homepage", text: "Home" },
      { href: "/programma-bedrijven", text: "Programma" },
      { href: "/gesprekken-overzicht-bedrijven", text: "Gesprekken" },
      { href: "/alleStudenten", text: "Studenten" },
      { href: "/account-bedrijf", text: "Account", highlight: true }
    ],
    sidebar: [
      { href: "/account-bedrijf", text: "Bedrijfsprofiel", icon: "fas fa-building" },
      { href: "/gegevens-bedrijf", text: "Bedrijfsgegevens", icon: "fas fa-edit" },
      { href: "/gesprekken-overzicht-bedrijven", text: "Gesprekken", icon: "fas fa-calendar-alt" },
      { divider: true },
      { href: "/alleStudenten", text: "Studenten Zoeken", icon: "fas fa-users" },
      { href: "/alleProjecten", text: "Student Projecten", icon: "fas fa-rocket" },
      { divider: true },
      { action: "logout", text: "Uitloggen", icon: "fas fa-sign-out-alt", danger: true }
    ]
  },

  // ===== FIXED ORGANISATOR CONFIG - REMOVED UNWANTED ITEMS =====
  organisator: {
    navbar: [
      { href: "/organisator-homepage", text: "Dashboard" },
      { href: "/admin-panel", text: "Admin Panel" },
      { href: "/overzicht-organisator", text: "Overzicht" },
      { href: "/account-organisator", text: "Account", highlight: true }
    ],
    sidebar: [
      { href: "/account-organisator", text: "Mijn Account", icon: "fas fa-user-shield" },
      { href: "/gegevens-organisator", text: "Mijn Gegevens", icon: "fas fa-id-card" },
      { divider: true },
      { href: "/admin-panel", text: "Admin Panel", icon: "fas fa-cogs" },
      { href: "/overzicht-organisator", text: "Overzicht", icon: "fas fa-chart-bar" },
      { divider: true },
      { action: "logout", text: "Uitloggen", icon: "fas fa-sign-out-alt", danger: true }
    ]
  }
};

const UI_SETTINGS = {
  debug: process.env.NODE_ENV === 'development',
  autoSetActive: true,
  refreshInterval: 30000,
  selectors: {
    navbar: '.navBar',
    sidebar: '.sideMenu-content'
  },
  classes: {
    navbar: {
      default: 'navItem',
      active: 'active',
      highlight: 'highlight'
    },
    sidebar: {
      divider: 'sideMenu-divider'
    }
  }
};

const STATS_CONFIG = {
  enabled: true,
  queries: {
    students: "SELECT COUNT(*) as count FROM STUDENT",
    companies: "SELECT COUNT(*) as count FROM BEDRIJF", 
    appointments: "SELECT COUNT(*) as count FROM AFSPRAAK"
  },
  fallback: {
    totalStudents: 21,
    totalCompanies: 17,
    totalProjects: 8,
    totalReservations: 12
  }
};

// ===== 📤 EXPORTS - MOET AAN HET EINDE STAAN =====
module.exports = {
  NAVIGATION_CONFIG,
  UI_SETTINGS,
  STATS_CONFIG,
};