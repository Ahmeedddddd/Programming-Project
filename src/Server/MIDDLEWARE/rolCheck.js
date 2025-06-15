//src/Server/MIDDLEWARE/rolCheck.js

const jwt = require('jsonwebtoken');
const config = require('../CONFIG/config');
const path = require('path');

/**
 * ===== SERVER-SIDE MIDDLEWARE =====
 * Deze middleware bepaalt welke HTML bestanden worden geserveerd
 */

// Check of gebruiker ingelogd is (optioneel)
const getCurrentUser = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return null;
  
  try {
    const user = jwt.verify(token, config.jwt.secret);
    return user;
  } catch (error) {
    return null;
  }
};

// Middleware om juiste homepage te serveren
const serveRoleBasedHomepage = (req, res, next) => {
  // Alleen voor homepage requests
  if (req.path !== '/' && req.path !== '/index.html') {
    return next();
  }

  const user = getCurrentUser(req);
  
  if (!user) {
    // Guest - serve standaard homepage
    console.log('🎯 Serving guest homepage: index.html');
    return res.sendFile(path.join(__dirname, '../../public/index.html'));
  }

  // Gebaseerd op userType, serve verschillende bestanden
  let homepageFile;
  switch (user.userType) {
    case 'student':
      homepageFile = path.join(__dirname, '../../src/HTML/STUDENTEN/student-homepage.html');
      break;
    case 'bedrijf':
      homepageFile = path.join(__dirname, '../../src/HTML/BEDRIJVEN/bedrijf-homepage.html');
      break;
    case 'organisator':
      homepageFile = path.join(__dirname, '../../src/HTML/ORGANISATOR/organisator-homepage.html');
      break;
    default:
      homepageFile = path.join(__dirname, '../../public/index.html');
  }

  console.log(`🎯 Serving ${user.userType} homepage: ${path.basename(homepageFile)}`);

  // Check of bestand bestaat, anders fallback naar guest
  const fs = require('fs');
  if (fs.existsSync(homepageFile)) {
    res.sendFile(homepageFile);
  } else {
    console.warn(`⚠️ Homepage file not found: ${homepageFile}, serving guest page`);
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  }
};

// Middleware om role-based account pagina's te serveren  
const serveRoleBasedAccountPage = (req, res, next) => {
  // Voor account gerelateerde routes
  const accountRoutes = ['/account', '/mijn-account', '/profile'];
  
  if (!accountRoutes.some(route => req.path.includes(route))) {
    return next();
  }

  const user = getCurrentUser(req);
  
  if (!user) {
    // Niet ingelogd - redirect naar login
    return res.redirect('/login');
  }

  let accountFile;
  switch (user.userType) {
    case 'student':
      accountFile = path.join(__dirname, '../../src/HTML/STUDENTEN/account-student.html');
      break;
    case 'bedrijf':
      accountFile = path.join(__dirname, '../../src/HTML/BEDRIJVEN/account-bedrijf.html');
      break;
    case 'organisator':
      accountFile = path.join(__dirname, '../../src/HTML/ORGANISATOR/account-organisator.html');
      break;
    default:
      return res.redirect('/login');
  }

  // Check of bestand bestaat
  const fs = require('fs');
  if (fs.existsSync(accountFile)) {
    res.sendFile(accountFile);
  } else {
    console.warn(`⚠️ Account file not found: ${accountFile}`);
    res.status(404).json({ error: 'Account page not found' });
  }
};

// API endpoint om user info te krijgen voor frontend
const getUserInfo = async (req, res) => {
  try {
    const user = getCurrentUser(req);
    
    if (!user) {
      return res.json({ 
        isLoggedIn: false, 
        userType: 'guest',
        user: null
      });
    }

    // Try to get additional user data from database if available
    let userData = {
      userId: user.userId,
      email: user.email,
      userType: user.userType
    };

    try {
      // Load user-specific data based on type
      if (user.userType === 'student') {
        // Try to load student data
        const Student = require('../MODELS/student');
        const studentData = await Student.findByStudentnummer(user.userId);
        if (studentData) {
          userData = { ...userData, ...studentData };
        }
      } else if (user.userType === 'bedrijf') {
        // Try to load bedrijf data
        const Bedrijf = require('../MODELS/bedrijf');
        const bedrijfData = await Bedrijf.findByBedrijfsnummer(user.userId);
        if (bedrijfData) {
          userData = { ...userData, ...bedrijfData };
        }
      } else if (user.userType === 'organisator') {
        // Try to load organisator data
        const Organisator = require('../MODELS/organisator');
        const organisatorData = await Organisator.findByOrganisatornummer(user.userId);
        if (organisatorData) {
          userData = { ...userData, ...organisatorData };
        }
      }
    } catch (modelError) {
      // Models might not exist, use basic user data
      console.warn('⚠️ Could not load additional user data:', modelError.message);
    }

    res.json({
      isLoggedIn: true,
      userType: user.userType,
      user: userData
    });

  } catch (error) {
    console.error('Error in getUserInfo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * ===== AUTHENTICATION MIDDLEWARE =====
 */

// Require authentication (any logged in user)
const requireAuth = (req, res, next) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.redirect('/login');
  }
  req.user = user; // Add user to request object
  next();
};

// ✅ ADDED: Require specific roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = getCurrentUser(req);
    
    if (!user) {
      console.log('❌ No user found, redirecting to login');
      return res.redirect('/login');
    }
    
    if (!allowedRoles.includes(user.userType)) {
      console.log(`❌ Access denied: ${user.userType} not in [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ 
        error: 'Access denied',
        message: `Required role: ${allowedRoles.join(' or ')}, but you are: ${user.userType}`,
        userType: user.userType,
        requiredRoles: allowedRoles
      });
    }
    
    console.log(`✅ Access granted: ${user.userType} accessing ${req.path}`);
    req.user = user; // Add user to request object
    next();
  };
};

/**
 * ===== CLIENT-SIDE SCRIPT GENERATION =====
 */

const generateClientSideScript = async () => {
  try {
    console.log('🔥 Generating enhanced role manager script...');
    
    // Get live stats from database (with fallbacks)
    let stats = {
      totalStudents: 252,
      totalCompanies: 84,
      totalProjects: 187,
      totalReservations: 0,
      lastUpdated: new Date().toISOString()
    };
    
    // Try to get real stats
    try {
      // You can add real database calls here later
      const Student = require('../MODELS/student');
      const studentCount = await Student.count?.() || 252;
      stats.totalStudents = studentCount;
    } catch (error) {
      console.warn('⚠️ Using fallback stats:', error.message);
    }
    
    const serverConfig = {
      apiBaseUrl: process.env.API_URL || 'http://localhost:3301',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8383',
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      features: {
        emailNotifications: true,
        realTimeUpdates: true,
        advancedSearch: true,
        debugMode: process.env.NODE_ENV === 'development'
      }
    };

    return `
/**
 * 🚀 ENHANCED CAREERLAUNCH ROLE MANAGER
 * Generated at: ${new Date().toISOString()}
 * Version: ${serverConfig.version}
 */

// ===== SERVER DATA INJECTION =====
window.SERVER_CONFIG = ${JSON.stringify(serverConfig, null, 2)};
window.LIVE_STATS = ${JSON.stringify(stats, null, 2)};

if (window.SERVER_CONFIG.features.debugMode) {
  console.log('🔥 Role Manager: Server data loaded');
  console.log('📊 Live stats:', window.LIVE_STATS);
}

class RoleManager {
  constructor() {
    this.currentUser = null;
    this.config = window.SERVER_CONFIG;
    this.stats = window.LIVE_STATS;
    this.init();
  }
  
  async init() {
    try {
      console.log('🚀 Initializing Enhanced Role Manager...');
      await this.loadUserInfo();
      this.setupUI();
      this.updateLiveStats();
      
      if (this.config.features.realTimeUpdates) {
        this.startAutoRefresh();
      }
      
      console.log('✅ Role Manager initialized successfully');
    } catch (error) {
      console.error('❌ Role Manager initialization failed:', error);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
      this.setupUI();
    }
  }
  
  async loadUserInfo() {
    try {
      const response = await fetch(\`\${this.config.apiBaseUrl}/api/user-info\`, {
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || '')
        }
      });
      
      if (response.ok) {
        this.currentUser = await response.json();
        
        if (this.config.features.debugMode) {
          console.log('🔍 Current user loaded:', this.currentUser);
        }
      } else {
        throw new Error(\`HTTP \${response.status}\`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load user info:', error.message);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
    }
  }
  
  updateLiveStats() {
    // Update student/company counts on page
    const countElements = document.querySelectorAll('[data-count]');
    countElements.forEach(el => {
      const parentText = el.closest('.section-title')?.textContent || '';
      
      if (parentText.toLowerCase().includes('student')) {
        el.textContent = this.stats.totalStudents;
      } else if (parentText.toLowerCase().includes('bedrijf')) {
        el.textContent = this.stats.totalCompanies;
      } else if (parentText.toLowerCase().includes('project')) {
        el.textContent = this.stats.totalProjects;
      }
    });
    
    if (this.config.features.debugMode) {
      console.log('📊 Live stats updated in UI');
    }
  }
  
  setupUI() {
    this.updateNavigation();
    this.updateSideMenu();
    this.updateContent();
    this.updateActions();
  }
  
  updateNavigation() {
    const navbar = document.querySelector('.navBar');
    if (!navbar) return;
    
    // Clear existing items
    const existingItems = navbar.querySelectorAll('.navItem');
    existingItems.forEach(item => item.remove());
    
    let navItems = [];
    
    if (this.currentUser.isLoggedIn) {
      switch (this.currentUser.userType) {
        case 'student':
          navItems = [
            { href: '/', text: 'Home', active: true },
            { href: '/programma', text: 'Programma' },
            { href: '/gesprekkenOverzicht', text: 'Mijn gesprekken' },
            { href: '/mijnProject', text: 'Mijn Project' },
            { href: '/account', text: 'Account' }
          ];
          break;
          
        case 'bedrijf':
          navItems = [
            { href: '/', text: 'Home', active: true },
            { href: '/programma', text: 'Programma' },
            { href: '/gesprekkenOverzicht', text: 'Gesprekken' },
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/account', text: 'Account' }
          ];
          break;
          
        case 'organisator':
          navItems = [
            { href: '/', text: 'Dashboard', active: true },
            { href: '/adminPanel', text: 'Admin Panel' },
            { href: '/overzichtOrganisator', text: 'Overzicht' },
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/alleBedrijven', text: 'Bedrijven' },
            { href: '/account', text: 'Account' }
          ];
          break;
      }
    } else {
      navItems = [
        { href: '/', text: 'Home', active: true },
        { href: '/programma', text: 'Programma' },
        { href: '/info', text: 'Info' },
        { href: '/login', text: 'Login' }
      ];
    }
    
    // Create navigation elements
    navItems.forEach(item => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.text;
      link.className = 'navItem' + (item.active ? ' active' : '');
      navbar.appendChild(link);
    });
    
    if (this.config.features.debugMode) {
      console.log(\`🧭 Navigation updated for \${this.currentUser.userType}\`);
    }
  }
  
  updateSideMenu() {
    const sideMenuContent = document.querySelector('.sideMenu-content');
    if (!sideMenuContent) return;
    
    // Clear existing links
    const existingLinks = sideMenuContent.querySelectorAll('a');
    existingLinks.forEach(link => link.remove());
    
    let menuItems = [];
    
    if (this.currentUser.isLoggedIn) {
      menuItems = [
        { href: '/account', icon: 'fas fa-user', text: 'Mijn Account' }
      ];
      
      // Role-specific items
      if (this.currentUser.userType === 'student') {
        menuItems.unshift({ href: '/mijnProject', icon: 'fas fa-project-diagram', text: 'Mijn Project' });
      } else if (this.currentUser.userType === 'bedrijf') {
        menuItems.unshift({ href: '/gesprekkenOverzicht', icon: 'fas fa-calendar-alt', text: 'Gesprekken' });
      } else if (this.currentUser.userType === 'organisator') {
        menuItems.unshift({ href: '/adminPanel', icon: 'fas fa-cogs', text: 'Admin Panel' });
      }
      
      menuItems.push(
        { href: '/change-password', icon: 'fas fa-key', text: 'Wachtwoord wijzigen' },
        { href: '#', icon: 'fas fa-sign-out-alt', text: 'Uitloggen', onclick: 'logout()' }
      );
    } else {
      menuItems = [
        { href: '/login', icon: 'fas fa-sign-in-alt', text: 'Login' },
        { href: '/register', icon: 'fas fa-user-plus', text: 'Registreren' },
        { href: '/contacteer', icon: 'fas fa-envelope', text: 'Contact us' }
      ];
    }
    
    // Create menu elements
    menuItems.forEach(item => {
      const link = document.createElement('a');
      link.href = item.href;
      if (item.onclick) {
        link.setAttribute('onclick', item.onclick);
      }
      link.innerHTML = \`<i class="\${item.icon}"></i> \${item.text}\`;
      sideMenuContent.appendChild(link);
    });
    
    // Ensure divider exists
    let divider = sideMenuContent.querySelector('.sideMenu-divider');
    if (!divider) {
      divider = document.createElement('hr');
      divider.className = 'sideMenu-divider';
      sideMenuContent.appendChild(divider);
    }
  }
  
  updateContent() {
    // Update welcome messages based on user data
    if (this.currentUser.isLoggedIn && this.currentUser.user) {
      const welcomeElement = document.querySelector('.aboutTitle');
      if (welcomeElement) {
        const userData = this.currentUser.user;
        
        switch (this.currentUser.userType) {
          case 'student':
            if (userData.voornaam) {
              welcomeElement.textContent = \`Welkom terug, \${userData.voornaam}! 🎓\`;
            }
            break;
          case 'bedrijf':
            if (userData.naam) {
              welcomeElement.textContent = \`Welkom terug, \${userData.naam}! 🏢\`;
            }
            break;
          case 'organisator':
            if (userData.voornaam) {
              welcomeElement.textContent = \`Admin Dashboard - \${userData.voornaam} 🛠️\`;
            }
            break;
        }
      }
    }
  }
  
  updateActions() {
    // Update action buttons based on role
    const actionButtons = document.querySelectorAll('.section-btn, .cta-btn');
    
    actionButtons.forEach(button => {
      if (this.currentUser.isLoggedIn) {
        this.updateButtonForRole(button);
      }
    });
  }
  
  updateButtonForRole(button) {
    const originalHref = button.getAttribute('href');
    
    switch (this.currentUser.userType) {
      case 'student':
        if (originalHref === '/infoBedrijf') {
          button.textContent = 'Bekijk Bedrijven';
          button.href = '/alleBedrijven';
        }
        break;
        
      case 'bedrijf':
        if (originalHref === '/infoStudent') {
          button.textContent = 'Bekijk Studenten';
          button.href = '/alleStudenten';
        }
        break;
        
      case 'organisator':
        if (originalHref.includes('/info')) {
          button.textContent = 'Beheer ' + button.textContent;
        }
        break;
    }
  }
  
  startAutoRefresh() {
    // Refresh every 5 minutes
    setInterval(() => {
      if (this.config.features.debugMode) {
        console.log('🔄 Auto-refreshing role manager...');
      }
      this.loadUserInfo().then(() => this.setupUI());
    }, 5 * 60 * 1000);
  }
  
  // Public API methods
  getCurrentUser() {
    return this.currentUser;
  }
  
  isLoggedIn() {
    return this.currentUser && this.currentUser.isLoggedIn;
  }
  
  getUserType() {
    return this.currentUser ? this.currentUser.userType : 'guest';
  }
  
  getServerConfig() {
    return this.config;
  }
  
  getLiveStats() {
    return this.stats;
  }
  
  async refresh() {
    console.log('🔄 Refreshing role manager...');
    await this.loadUserInfo();
    this.setupUI();
  }
}

// ===== GLOBAL FUNCTIONS =====

// Global logout function
window.logout = async function() {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
  } finally {
    // Clear all stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('🚪 User logged out successfully');
    window.location.href = '/login';
  }
};

// Utility functions
window.checkAuthStatus = () => window.roleManager ? window.roleManager.isLoggedIn() : false;
window.getUserType = () => window.roleManager ? window.roleManager.getUserType() : 'guest';
window.getServerConfig = () => window.roleManager ? window.roleManager.getServerConfig() : window.SERVER_CONFIG;
window.getLiveStats = () => window.roleManager ? window.roleManager.getLiveStats() : window.LIVE_STATS;
window.refreshRoleUI = () => window.roleManager && window.roleManager.refresh();

// ===== INITIALIZATION =====
function initializeRoleManager() {
  try {
    console.log('🚀 Initializing Role Manager...');
    window.roleManager = new RoleManager();
  } catch (error) {
    console.error('❌ Role Manager initialization failed:', error);
    // Fallback
    window.roleManager = {
      getCurrentUser: () => ({ isLoggedIn: false, userType: 'guest' }),
      isLoggedIn: () => false,
      getUserType: () => 'guest',
      refresh: () => console.warn('Role Manager not properly initialized')
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRoleManager);
} else {
  initializeRoleManager();
}

// Handle page navigation
window.addEventListener('pageshow', function(event) {
  if (event.persisted && window.roleManager && window.roleManager.refresh) {
    console.log('🔄 Page restored, refreshing role manager...');
    window.roleManager.refresh();
  }
});

console.log('✅ Enhanced Role Manager loaded successfully');
console.log('🔥 Generated at: ${new Date().toISOString()}');
`;

  } catch (error) {
    console.error('❌ Error generating client script:', error);
    
    // Emergency fallback script
    return `
console.error('Failed to generate enhanced role manager:', '${error.message}');

// Emergency fallback
class BasicRoleManager {
  constructor() {
    this.currentUser = { isLoggedIn: false, userType: 'guest' };
    console.warn('⚠️ Using basic fallback role manager');
  }
  
  getCurrentUser() { return this.currentUser; }
  isLoggedIn() { return false; }
  getUserType() { return 'guest'; }
  refresh() { console.warn('Basic role manager - refresh not available'); }
}

window.roleManager = new BasicRoleManager();
window.logout = function() { 
  localStorage.clear(); 
  window.location.href = '/login'; 
};

console.log('⚠️ Fallback role manager active');
    `;
  }
};

/**
 * ===== MODULE EXPORTS =====
 */

module.exports = {
  // Server-side middleware
  serveRoleBasedHomepage,
  serveRoleBasedAccountPage,
  getUserInfo,
  getCurrentUser,
  
  // ✅ ADDED: Enhanced authentication middleware
  requireAuth,
  requireRole,  // This was missing!
  
  // Client-side script generator
  generateClientSideScript,
  
  // Utility functions
  isLoggedIn: (req) => getCurrentUser(req) !== null,
  getUserType: (req) => getCurrentUser(req)?.userType || 'guest'
};