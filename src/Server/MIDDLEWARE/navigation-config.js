// src/Server/UTILS/navigation-config.js
// =====================================

/**
 * 🎯 NAVIGATION CONFIGURATIE
 *
 * Dit bestand wordt gebruikt door de backend om dynamische navigatie te genereren
 * FIX: Guest navigation zonder login redirects
 * FIX: Organisator navigation met correcte links
 */

// ===== 📍 NAVIGATION CONFIG =====
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
      { href: "/contacteer", text: "Contact", icon: "fas fa-envelope" },
      { divider: true },
      // FIX: Guest users can access these without login
      { href: "/alleBedrijven", text: "Bekijk Bedrijven", icon: "fas fa-building" },
      { href: "/alleStudenten", text: "Bekijk Studenten", icon: "fas fa-users" },
      { href: "/alleProjecten", text: "Bekijk Projecten", icon: "fas fa-rocket" }
    ]
  },

  student: {
    navbar: [
      { href: "/student-homepage", text: "Home" },
      { href: "/programma-studenten", text: "Programma" },
      { href: "/gesprekken-overzicht", text: "Mijn Gesprekken" },
      { href: "/alleBedrijven", text: "Bedrijven" },
      { href: "/alleProjecten", text: "Projecten" },
      { href: "/account-student", text: "Account", highlight: true }
    ],
    sidebar: [
      { href: "/account-student", text: "Mijn Account", icon: "fas fa-user" },
      { href: "/gegevens-student", text: "Mijn Gegevens", icon: "fas fa-id-card" },
      { href: "/mijn-project", text: "Mijn Project", icon: "fas fa-project-diagram" },
      { href: "/gesprekken-overzicht", text: "Mijn Gesprekken", icon: "fas fa-calendar-alt" },
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

  // FIX: Organisator navigation met correcte links
  organisator: {
    navbar: [
      { href: "/organisator-homepage", text: "Dashboard" },
      { href: "/admin-panel", text: "Admin Panel" },
      { href: "/overzicht-organisator", text: "Overzicht" },
      { href: "/alleStudenten", text: "Studenten" }, // FIX: Direct link naar alle-studenten
      { href: "/alleBedrijven", text: "Bedrijven" }, // FIX: Direct link naar alle-bedrijven
      { href: "/account-organisator", text: "Account", highlight: true }
    ],
    sidebar: [
      { href: "/account-organisator", text: "Mijn Account", icon: "fas fa-user-shield" },
      { href: "/gegevens-organisator", text: "Mijn Gegevens", icon: "fas fa-id-card" },
      { divider: true },
      { href: "/admin-panel", text: "Admin Panel", icon: "fas fa-cogs" },
      { href: "/overzicht-organisator", text: "Overzicht", icon: "fas fa-chart-bar" },
      { divider: true },
      { href: "/alleStudenten", text: "Alle Studenten", icon: "fas fa-users" },
      { href: "/alleBedrijven", text: "Alle Bedrijven", icon: "fas fa-building" },
      { href: "/alleProjecten", text: "Alle Projecten", icon: "fas fa-rocket" },
      { divider: true },
      { action: "logout", text: "Uitloggen", icon: "fas fa-sign-out-alt", danger: true }
    ]
  }
};

// ===== 🎨 UI SETTINGS =====
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

// ===== 📊 STATS CONFIGURATION =====
const STATS_CONFIG = {
  enabled: true,
  queries: {
    students: "SELECT COUNT(*) as count FROM STUDENT",
    companies: "SELECT COUNT(*) as count FROM BEDRIJF", 
    appointments: "SELECT COUNT(*) as count FROM AFSPRAAK",
    projects: "SELECT COUNT(DISTINCT projectId) as count FROM PROJECTEN"
  },
  fallback: {
    totalStudents: 21,
    totalCompanies: 17,
    totalProjects: 8,
    totalReservations: 12
  }
};

// ===== 🚪 PUBLIC ROUTES (NO AUTH REQUIRED) =====
const PUBLIC_ROUTES = [
  '/',
  '/index.html',
  '/login',
  '/register',
  '/programma',
  '/info',
  '/contacteer',
  '/alle-bedrijven',
  '/alle-studenten', 
  '/alle-projecten',
  '/zoekbalk-studenten',
  '/zoekbalk-projecten',
  '/zoekbalk-bedrijven',
  '/resultaat-bedrijf',
  '/resultaat-student',
  '/resultaat-project'
];

// ===== 🔒 PROTECTED ROUTES BY ROLE =====
const PROTECTED_ROUTES = {
  student: [
    '/student-homepage',
    '/account-student',
    '/gegevens-student',
    '/mijn-project',
    '/gesprekken-overzicht',
    '/programma-studenten'
  ],
  bedrijf: [
    '/bedrijf-homepage',
    '/account-bedrijf',
    '/gegevens-bedrijf',
    '/gesprekken-overzicht-bedrijven',
    '/programma-bedrijven',
    '/tarieven'
  ],
  organisator: [
    '/organisator-homepage',
    '/account-organisator',
    '/gegevens-organisator',
    '/admin-panel',
    '/overzicht-organisator'
  ]
};

// ===== 📤 EXPORTS =====
module.exports = {
  NAVIGATION_CONFIG,
  UI_SETTINGS,
  STATS_CONFIG,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES
};