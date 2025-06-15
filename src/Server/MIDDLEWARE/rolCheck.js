<<<<<<< Updated upstream
<<<<<<< Updated upstream
//src/Server/MIDDLEWARE/rolCheck.js
=======
<<<<<<< Updated upstream
=======
// src/Server/MIDDLEWARE/rolCheck.js
>>>>>>> Stashed changes
=======
=======
// src/Server/MIDDLEWARE/rolCheck.js
>>>>>>> Stashed changes

const jwt = require('jsonwebtoken');
const config = require('../CONFIG/config');
const path = require('path');
<<<<<<< Updated upstream
<<<<<<< Updated upstream

/**
 * ===== SERVER-SIDE MIDDLEWARE =====
 * Deze middleware bepaalt welke HTML bestanden worden geserveerd
 */

// Check of gebruiker ingelogd is (optioneel)
=======
const { pool } = require('../CONFIG/database');

// Get current user from token
>>>>>>> Stashed changes
=======
const { pool } = require('../CONFIG/database');

// Get current user from token
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// Middleware om juiste homepage te serveren
const serveRoleBasedHomepage = (req, res, next) => {
=======
// ✅ ENHANCED: Middleware om juiste homepage te serveren
const serveRoleBasedHomepage = async (req, res, next) => {
>>>>>>> Stashed changes
=======
// ✅ ENHANCED: Middleware om juiste homepage te serveren
const serveRoleBasedHomepage = async (req, res, next) => {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  // Gebaseerd op userType, serve verschillende bestanden
=======
  // 🔥 ENHANCED: Gebaseerd op userType, serve verschillende bestanden
>>>>>>> Stashed changes
=======
  // 🔥 ENHANCED: Gebaseerd op userType, serve verschillende bestanden
>>>>>>> Stashed changes
  let homepageFile;
  switch (user.userType) {
    case 'student':
      homepageFile = path.join(__dirname, '../../src/HTML/STUDENTEN/student-homepage.html');
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      break;
    case 'bedrijf':
      homepageFile = path.join(__dirname, '../../src/HTML/BEDRIJVEN/bedrijf-homepage.html');
      break;
    case 'organisator':
      homepageFile = path.join(__dirname, '../../src/HTML/ORGANISATOR/organisator-homepage.html');
=======
=======
>>>>>>> Stashed changes
      console.log('🎓 Serving student homepage');
      break;
    case 'bedrijf':
      homepageFile = path.join(__dirname, '../../src/HTML/BEDRIJVEN/bedrijf-homepage.html');
      console.log('🏢 Serving bedrijf homepage');
      break;
    case 'organisator':
      homepageFile = path.join(__dirname, '../../src/HTML/ORGANISATOR/organisator-homepage.html');
      console.log('👔 Serving organisator homepage');
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      break;
    default:
      homepageFile = path.join(__dirname, '../../public/index.html');
  }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  console.log(`🎯 Serving ${user.userType} homepage: ${path.basename(homepageFile)}`);

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  // Check of bestand bestaat, anders fallback naar guest
  const fs = require('fs');
  if (fs.existsSync(homepageFile)) {
    res.sendFile(homepageFile);
  } else {
    console.warn(`⚠️ Homepage file not found: ${homepageFile}, serving guest page`);
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  }
};

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
/**
 * ===== AUTHENTICATION MIDDLEWARE =====
 */

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
// Require authentication (any logged in user)
const requireAuth = (req, res, next) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.redirect('/login');
  }
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  req.user = user; // Add user to request object
  next();
};

// ✅ ADDED: Require specific roles
=======
=======
>>>>>>> Stashed changes
  req.user = user;
  next();
};

// Require specific roles
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        message: `Required role: ${allowedRoles.join(' or ')}, but you are: ${user.userType}`,
        userType: user.userType,
        requiredRoles: allowedRoles
=======
        message: `Required role: ${allowedRoles.join(' or ')}, but you are: ${user.userType}`
>>>>>>> Stashed changes
=======
        message: `Required role: ${allowedRoles.join(' or ')}, but you are: ${user.userType}`
>>>>>>> Stashed changes
      });
    }
    
    console.log(`✅ Access granted: ${user.userType} accessing ${req.path}`);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    req.user = user; // Add user to request object
=======
    req.user = user;
>>>>>>> Stashed changes
=======
    req.user = user;
>>>>>>> Stashed changes
    next();
  };
};

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
// Generate dynamic client-side script with live data
const generateClientSideScript = async () => {
  try {
    console.log('🔥 Generating enhanced role manager script with live data...');
    
    // Get live stats from database
    let stats = {
      totalStudents: 0,
      totalCompanies: 0,
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      totalProjects: 187,
      totalReservations: 0,
      lastUpdated: new Date().toISOString()
    };
    
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    this.stats = window.LIVE_STATS;
    this.init();
  }
  
  async init() {
    try {
      console.log('🚀 Initializing Enhanced Role Manager...');
      await this.loadUserInfo();
      this.setupUI();
      this.updateLiveStats();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      
      if (this.config.features.realTimeUpdates) {
        this.startAutoRefresh();
      }
      
      console.log('✅ Role Manager initialized successfully');
=======
      this.startAutoRefresh();
      console.log('✅ Enhanced Role Manager initialized successfully');
>>>>>>> Stashed changes
=======
      this.startAutoRefresh();
      console.log('✅ Enhanced Role Manager initialized successfully');
>>>>>>> Stashed changes
    } catch (error) {
      console.error('❌ Role Manager initialization failed:', error);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
      this.setupUI();
    }
  }
  
  async loadUserInfo() {
    try {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      const response = await fetch(\`\${this.config.apiBaseUrl}/api/user-info\`, {
=======
      const response = await fetch('/api/user-info', {
>>>>>>> Stashed changes
=======
      const response = await fetch('/api/user-info', {
>>>>>>> Stashed changes
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || '')
        }
      });
      
      if (response.ok) {
        this.currentUser = await response.json();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        
        if (this.config.features.debugMode) {
          console.log('🔍 Current user loaded:', this.currentUser);
        }
=======
        console.log('🔍 Current user loaded:', this.currentUser);
>>>>>>> Stashed changes
=======
        console.log('🔍 Current user loaded:', this.currentUser);
>>>>>>> Stashed changes
      } else {
        throw new Error(\`HTTP \${response.status}\`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load user info:', error.message);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
    }
  }
  
  updateLiveStats() {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  }
  
  setupUI() {
    this.updateNavigation();
    this.updateSideMenu();
    this.updateContent();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    this.updateActions();
=======
    this.addNavigationInterceptors();
>>>>>>> Stashed changes
=======
    this.addNavigationInterceptors();
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            { href: '/gesprekkenOverzicht', text: 'Mijn gesprekken' },
            { href: '/mijnProject', text: 'Mijn Project' },
            { href: '/account', text: 'Account' }
          ];
          break;
          
=======
=======
>>>>>>> Stashed changes
            { href: '/mijnProject', text: 'Mijn Project' },
            { href: '/alleBedrijven', text: 'Bedrijven' },
            { href: '/accountStudent', text: 'Account' }
          ];
          break;
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        case 'bedrijf':
          navItems = [
            { href: '/', text: 'Home', active: true },
            { href: '/programma', text: 'Programma' },
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            { href: '/gesprekkenOverzicht', text: 'Gesprekken' },
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/account', text: 'Account' }
          ];
          break;
          
=======
=======
>>>>>>> Stashed changes
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/accountBedrijf', text: 'Account' }
          ];
          break;
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        case 'organisator':
          navItems = [
            { href: '/', text: 'Dashboard', active: true },
            { href: '/adminPanel', text: 'Admin Panel' },
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            { href: '/overzichtOrganisator', text: 'Overzicht' },
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/alleBedrijven', text: 'Bedrijven' },
            { href: '/account', text: 'Account' }
=======
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/alleBedrijven', text: 'Bedrijven' },
            { href: '/accountOrganisator', text: 'Account' }
>>>>>>> Stashed changes
=======
            { href: '/alleStudenten', text: 'Studenten' },
            { href: '/alleBedrijven', text: 'Bedrijven' },
            { href: '/accountOrganisator', text: 'Account' }
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    
    if (this.config.features.debugMode) {
      console.log(\`🧭 Navigation updated for \${this.currentUser.userType}\`);
    }
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  }
  
  updateSideMenu() {
    const sideMenuContent = document.querySelector('.sideMenu-content');
    if (!sideMenuContent) return;
    
    // Clear existing links
    const existingLinks = sideMenuContent.querySelectorAll('a');
    existingLinks.forEach(link => link.remove());
    
    let menuItems = [];
    
    if (this.currentUser.isLoggedIn) {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        { href: '#', icon: 'fas fa-sign-out-alt', text: 'Uitloggen', onclick: 'logout()' }
      );
    } else {
      menuItems = [
        { href: '/login', icon: 'fas fa-sign-in-alt', text: 'Login' },
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        { href: '/register', icon: 'fas fa-user-plus', text: 'Registreren' },
        { href: '/contacteer', icon: 'fas fa-envelope', text: 'Contact us' }
=======
        { href: '/register', icon: 'fas fa-user-plus', text: 'Registreren' }
>>>>>>> Stashed changes
=======
        { href: '/register', icon: 'fas fa-user-plus', text: 'Registreren' }
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    
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
=======
=======
>>>>>>> Stashed changes
  }
  
  updateContent() {
    // Update welcome messages
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
  
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  updateActions() {
    // Update action buttons based on role
    const actionButtons = document.querySelectorAll('.section-btn, .cta-btn');
    
    actionButtons.forEach(button => {
      if (this.currentUser.isLoggedIn) {
        this.updateButtonForRole(button);
=======
=======
>>>>>>> Stashed changes
  addNavigationInterceptors() {
    // Intercept home navigation to ensure correct homepage
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && (link.getAttribute('href') === '/' || link.getAttribute('href') === '/index.html')) {
        // Let the server handle this - it will serve the correct homepage
        console.log('🏠 Navigating to role-based homepage...');
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      }
    });
  }
  
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
  
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  getServerConfig() {
    return this.config;
  }
  
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  getLiveStats() {
    return this.stats;
  }
  
  async refresh() {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    console.log('🔄 Refreshing role manager...');
    await this.loadUserInfo();
    this.setupUI();
=======
=======
>>>>>>> Stashed changes
    console.log('🔄 Refreshing enhanced role manager...');
    await this.loadUserInfo();
    this.setupUI();
    this.updateLiveStats();
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
=======
    localStorage.clear();
    sessionStorage.clear();
>>>>>>> Stashed changes
=======
    localStorage.clear();
    sessionStorage.clear();
>>>>>>> Stashed changes
    console.log('🚪 User logged out successfully');
    window.location.href = '/login';
  }
};

// Utility functions
window.checkAuthStatus = () => window.roleManager ? window.roleManager.isLoggedIn() : false;
window.getUserType = () => window.roleManager ? window.roleManager.getUserType() : 'guest';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
window.getServerConfig = () => window.roleManager ? window.roleManager.getServerConfig() : window.SERVER_CONFIG;
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
window.getLiveStats = () => window.roleManager ? window.roleManager.getLiveStats() : window.LIVE_STATS;
window.refreshRoleUI = () => window.roleManager && window.roleManager.refresh();

// ===== INITIALIZATION =====
function initializeRoleManager() {
  try {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    console.log('🚀 Initializing Role Manager...');
    window.roleManager = new RoleManager();
  } catch (error) {
    console.error('❌ Role Manager initialization failed:', error);
    // Fallback
=======
=======
>>>>>>> Stashed changes
    console.log('🚀 Initializing Enhanced Role Manager...');
    window.roleManager = new EnhancedRoleManager();
  } catch (error) {
    console.error('❌ Role Manager initialization failed:', error);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    window.roleManager = {
      getCurrentUser: () => ({ isLoggedIn: false, userType: 'guest' }),
      isLoggedIn: () => false,
      getUserType: () => 'guest',
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      refresh: () => console.warn('Role Manager not properly initialized')
=======
      refresh: () => console.warn('Role Manager not properly initialized'),
      getLiveStats: () => window.LIVE_STATS || {}
>>>>>>> Stashed changes
=======
      refresh: () => console.warn('Role Manager not properly initialized'),
      getLiveStats: () => window.LIVE_STATS || {}
>>>>>>> Stashed changes
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRoleManager);
} else {
  initializeRoleManager();
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
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
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
