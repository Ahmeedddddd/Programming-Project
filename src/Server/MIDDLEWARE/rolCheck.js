// src/Server/MIDDLEWARE/rolCheck.js - ENHANCED VERSION

const jwt = require('jsonwebtoken');
const config = require('../CONFIG/config');
const path = require('path');
const { pool } = require('../CONFIG/database');

// Get current user from token
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

// ✅ ENHANCED: Middleware om juiste homepage te serveren
const serveRoleBasedHomepage = async (req, res, next) => {
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

  // 🔥 ENHANCED: Gebaseerd op userType, serve verschillende bestanden
  let homepageFile;
  switch (user.userType) {
    case 'student':
      homepageFile = path.join(__dirname, '../../src/HTML/STUDENTEN/student-homepage.html');
      console.log('🎓 Serving student homepage');
      break;
    case 'bedrijf':
      homepageFile = path.join(__dirname, '../../src/HTML/BEDRIJVEN/bedrijf-homepage.html');
      console.log('🏢 Serving bedrijf homepage');
      break;
    case 'organisator':
      homepageFile = path.join(__dirname, '../../src/HTML/ORGANISATOR/organisator-homepage.html');
      console.log('👔 Serving organisator homepage');
      break;
    default:
      homepageFile = path.join(__dirname, '../../public/index.html');
  }

  // Check of bestand bestaat, anders fallback naar guest
  const fs = require('fs');
  if (fs.existsSync(homepageFile)) {
    res.sendFile(homepageFile);
  } else {
    console.warn(`⚠️ Homepage file not found: ${homepageFile}, serving guest page`);
    res.sendFile(path.join(__dirname, '../../public/index.html'));
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

    // Get live user data from database
    let userData = {
      email: user.email,
      userType: user.userType,
      userId: user.userId,
      naam: user.naam || ''
    };

    try {
      // Load fresh user data based on type
      if (user.userType === 'student') {
        const [students] = await pool.query('SELECT * FROM STUDENT WHERE email = ?', [user.email]);
        if (students.length > 0) {
          userData = { 
            ...userData, 
            ...students[0],
            naam: `${students[0].voornaam} ${students[0].achternaam}`
          };
        }
      } else if (user.userType === 'bedrijf') {
        const [bedrijven] = await pool.query('SELECT * FROM BEDRIJF WHERE email = ?', [user.email]);
        if (bedrijven.length > 0) {
          userData = { ...userData, ...bedrijven[0] };
        }
      } else if (user.userType === 'organisator') {
        const [organisators] = await pool.query('SELECT * FROM ORGANISATOR WHERE email = ?', [user.email]);
        if (organisators.length > 0) {
          userData = { 
            ...userData, 
            ...organisators[0],
            naam: `${organisators[0].voornaam} ${organisators[0].achternaam}`
          };
        }
      }
    } catch (dbError) {
      console.warn('⚠️ Could not load additional user data:', dbError.message);
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

// Require authentication (any logged in user)
const requireAuth = (req, res, next) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.redirect('/login');
  }
  req.user = user;
  next();
};

// Require specific roles
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
        message: `Required role: ${allowedRoles.join(' or ')}, but you are: ${user.userType}`
      });
    }
    
    console.log(`✅ Access granted: ${user.userType} accessing ${req.path}`);
    req.user = user;
    next();
  };
};

// Generate dynamic client-side script with live data
const generateClientSideScript = async () => {
  try {
    console.log('🔥 Generating enhanced role manager script with live data...');
    
    // Get live stats from database
    let stats = {
      totalStudents: 0,
      totalCompanies: 0,
      totalProjects: 187,
      totalReservations: 0,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM STUDENT');
      const [bedrijfCount] = await pool.query('SELECT COUNT(*) as count FROM BEDRIJF');
      
      let afspraakCount = [{ count: 0 }];
      try {
        [afspraakCount] = await pool.query('SELECT COUNT(*) as count FROM AFSPRAAK');
      } catch (e) {
        console.log('AFSPRAAK table not available');
      }

      stats = {
        totalStudents: studentCount[0]?.count || 0,
        totalCompanies: bedrijfCount[0]?.count || 0,
        totalProjects: 187,
        totalReservations: afspraakCount[0]?.count || 0,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('📊 Live stats loaded:', stats);
    } catch (dbError) {
      console.warn('⚠️ Using fallback stats:', dbError.message);
    }

    return `
/**
 * 🚀 ENHANCED CAREERLAUNCH ROLE MANAGER WITH LIVE DATA
 * Generated at: ${new Date().toISOString()}
 */

// ===== SERVER DATA INJECTION =====
window.LIVE_STATS = ${JSON.stringify(stats, null, 2)};

console.log('🔥 Role Manager: Live server data loaded');
console.log('📊 Live stats:', window.LIVE_STATS);

class EnhancedRoleManager {
  constructor() {
    this.currentUser = null;
    this.stats = window.LIVE_STATS;
    this.init();
  }
  
  async init() {
    try {
      console.log('🚀 Initializing Enhanced Role Manager...');
      await this.loadUserInfo();
      this.setupUI();
      this.updateLiveStats();
      this.startAutoRefresh();
      console.log('✅ Enhanced Role Manager initialized successfully');
    } catch (error) {
      console.error('❌ Role Manager initialization failed:', error);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
      this.setupUI();
    }
  }
  
  async loadUserInfo() {
    try {
      const response = await fetch('/api/user-info', {
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || '')
        }
      });
      
      if (response.ok) {
        this.currentUser = await response.json();
        console.log('🔍 Current user loaded:', this.currentUser);
      } else {
        throw new Error(\`HTTP \${response.status}\`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load user info:', error.message);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
    }
  }
  
  updateLiveStats() {
    // Update elements with data-count attributes
    document.querySelectorAll('[data-count]').forEach(el => {
      const countType = el.getAttribute('data-count');
      
      switch(countType) {
        case 'students':
          el.textContent = this.stats.totalStudents;
          break;
        case 'companies':
        case 'bedrijven':
          el.textContent = this.stats.totalCompanies;
          break;
        case 'projects':
        case 'projecten':
          el.textContent = this.stats.totalProjects;
          break;
        case 'reservations':
        case 'afspraken':
          el.textContent = this.stats.totalReservations;
          break;
      }
    });
    
    console.log('📊 Live stats updated in UI');
  }
  
  setupUI() {
    this.updateNavigation();
    this.updateSideMenu();
    this.updateContent();
    this.addNavigationInterceptors();
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
            { href: '/mijnProject', text: 'Mijn Project' },
            { href: '/alleBedrijven', text: 'Bedrijven' },
            { href: '/accountStudent', text: 'Account' }
          ];
          break;
        case 'bedrijf':
          navItems = [
            { href: '/', text: 'Home', active: true },
            { href: '/programma', text: 'Programma' },
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/accountBedrijf', text: 'Account' }
          ];
          break;
        case 'organisator':
          navItems = [
            { href: '/', text: 'Dashboard', active: true },
            { href: '/adminPanel', text: 'Admin Panel' },
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/alleBedrijven', text: 'Bedrijven' },
            { href: '/accountOrganisator', text: 'Account' }
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
  }
  
  updateSideMenu() {
    const sideMenuContent = document.querySelector('.sideMenu-content');
    if (!sideMenuContent) return;
    
    // Clear existing links
    const existingLinks = sideMenuContent.querySelectorAll('a');
    existingLinks.forEach(link => link.remove());
    
    let menuItems = [];
    
    if (this.currentUser.isLoggedIn) {
      switch (this.currentUser.userType) {
        case 'student':
          menuItems = [
            { href: '/accountStudent', icon: 'fas fa-user', text: 'Mijn Account' },
            { href: '/mijnProject', icon: 'fas fa-project-diagram', text: 'Mijn Project' }
          ];
          break;
        case 'bedrijf':
          menuItems = [
            { href: '/accountBedrijf', icon: 'fas fa-user', text: 'Mijn Account' },
            { href: '/alleStudenten', icon: 'fas fa-users', text: 'Studenten' }
          ];
          break;
        case 'organisator':
          menuItems = [
            { href: '/accountOrganisator', icon: 'fas fa-user', text: 'Mijn Account' },
            { href: '/adminPanel', icon: 'fas fa-cogs', text: 'Admin Panel' }
          ];
          break;
      }
      
      menuItems.push(
        { href: '#', icon: 'fas fa-sign-out-alt', text: 'Uitloggen', onclick: 'logout()' }
      );
    } else {
      menuItems = [
        { href: '/login', icon: 'fas fa-sign-in-alt', text: 'Login' },
        { href: '/register', icon: 'fas fa-user-plus', text: 'Registreren' }
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
  }
  
  updateContent() {
    // Update welcome messages
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
  
  addNavigationInterceptors() {
    // Intercept home navigation to ensure correct homepage
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && (link.getAttribute('href') === '/' || link.getAttribute('href') === '/index.html')) {
        // Let the server handle this - it will serve the correct homepage
        console.log('🏠 Navigating to role-based homepage...');
      }
    });
  }
  
  startAutoRefresh() {
    // Refresh every 2 minutes
    setInterval(async () => {
      console.log('🔄 Auto-refreshing live data...');
      
      try {
        const response = await fetch('/api/stats/live');
        if (response.ok) {
          this.stats = await response.json();
          this.updateLiveStats();
        }
      } catch (error) {
        console.warn('Failed to refresh stats:', error);
      }
    }, 2 * 60 * 1000);
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
  
  getLiveStats() {
    return this.stats;
  }
  
  async refresh() {
    console.log('🔄 Refreshing enhanced role manager...');
    await this.loadUserInfo();
    this.setupUI();
    this.updateLiveStats();
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
    localStorage.clear();
    sessionStorage.clear();
    console.log('🚪 User logged out successfully');
    window.location.href = '/login';
  }
};

// Utility functions
window.checkAuthStatus = () => window.roleManager ? window.roleManager.isLoggedIn() : false;
window.getUserType = () => window.roleManager ? window.roleManager.getUserType() : 'guest';
window.getLiveStats = () => window.roleManager ? window.roleManager.getLiveStats() : window.LIVE_STATS;
window.refreshRoleUI = () => window.roleManager && window.roleManager.refresh();

// ===== INITIALIZATION =====
function initializeRoleManager() {
  try {
    console.log('🚀 Initializing Enhanced Role Manager...');
    window.roleManager = new EnhancedRoleManager();
  } catch (error) {
    console.error('❌ Role Manager initialization failed:', error);
    window.roleManager = {
      getCurrentUser: () => ({ isLoggedIn: false, userType: 'guest' }),
      isLoggedIn: () => false,
      getUserType: () => 'guest',
      refresh: () => console.warn('Role Manager not properly initialized'),
      getLiveStats: () => window.LIVE_STATS || {}
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRoleManager);
} else {
  initializeRoleManager();
}

console.log('✅ Enhanced Role Manager loaded successfully');
`;

  } catch (error) {
    console.error('❌ Error generating enhanced client script:', error);
    return `console.error('Failed to generate role manager');`;
  }
};

module.exports = {
  serveRoleBasedHomepage,
  getUserInfo,
  getCurrentUser,
  requireAuth,
  requireRole,
  generateClientSideScript,
  isLoggedIn: (req) => getCurrentUser(req) !== null,
  getUserType: (req) => getCurrentUser(req)?.userType || 'guest'
};