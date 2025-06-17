// src/Server/MIDDLEWARE/rolCheck.js
// =================================

const jwt = require("jsonwebtoken");
const config = require("../CONFIG/config");
const path = require("path");
const { pool } = require("../CONFIG/database");

// Enhanced navigation configuration
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
      { href: "/gesprekken-overzicht", text: "Mijn Gesprekken" },
      { href: "/alle-bedrijven", text: "Bedrijven" },
      { href: "/alle-projecten", text: "Projecten" },
      { href: "/account-student", text: "Account", highlight: true }
    ],
    sidebar: [
      { href: "/account-student", text: "Mijn Account", icon: "fas fa-user" },
      { href: "/gegevens-student", text: "Mijn Gegevens", icon: "fas fa-id-card" },
      { href: "/mijn-project", text: "Mijn Project", icon: "fas fa-project-diagram" },
      { href: "/gesprekken-overzicht", text: "Mijn Gesprekken", icon: "fas fa-calendar-alt" },
      { divider: true },
      { href: "/alle-bedrijven", text: "Bedrijven Zoeken", icon: "fas fa-building" },
      { href: "/alle-projecten", text: "Andere Projecten", icon: "fas fa-rocket" },
      { divider: true },
      { action: "logout", text: "Uitloggen", icon: "fas fa-sign-out-alt", danger: true }
    ]
  },

  bedrijf: {
    navbar: [
      { href: "/bedrijf-homepage", text: "Home" },
      { href: "/programma-bedrijven", text: "Programma" },
      { href: "/gesprekken-overzicht-bedrijven", text: "Gesprekken" },
      { href: "/alle-studenten", text: "Studenten" },
      { href: "/account-bedrijf", text: "Account", highlight: true }
    ],
    sidebar: [
      { href: "/account-bedrijf", text: "Bedrijfsprofiel", icon: "fas fa-building" },
      { href: "/gegevens-bedrijf", text: "Bedrijfsgegevens", icon: "fas fa-edit" },
      { href: "/gesprekken-overzicht-bedrijven", text: "Gesprekken", icon: "fas fa-calendar-alt" },
      { divider: true },
      { href: "/alle-studenten", text: "Studenten Zoeken", icon: "fas fa-users" },
      { href: "/alle-projecten", text: "Student Projecten", icon: "fas fa-rocket" },
      { divider: true },
      { action: "logout", text: "Uitloggen", icon: "fas fa-sign-out-alt", danger: true }
    ]
  },

  organisator: {
    navbar: [
      { href: "/organisator-homepage", text: "Dashboard" },
      { href: "/admin-panel", text: "Admin Panel" },
      { href: "/overzicht-organisator", text: "Overzicht" },
      { href: "/alle-studenten", text: "Studenten" },
      { href: "/alle-bedrijven", text: "Bedrijven" },
      { href: "/account-organisator", text: "Account", highlight: true }
    ],
    sidebar: [
      { href: "/account-organisator", text: "Mijn Account", icon: "fas fa-user-shield" },
      { href: "/gegevens-organisator", text: "Mijn Gegevens", icon: "fas fa-id-card" },
      { divider: true },
      { href: "/admin-panel", text: "Admin Panel", icon: "fas fa-cogs" },
      { href: "/overzicht-organisator", text: "Overzicht", icon: "fas fa-chart-bar" },
      { href: "/alle-studenten", text: "Studenten Beheer", icon: "fas fa-users" },
      { href: "/alle-bedrijven", text: "Bedrijven Beheer", icon: "fas fa-building" },
      { divider: true },
      { action: "logout", text: "Uitloggen", icon: "fas fa-sign-out-alt", danger: true }
    ]
  }
};

const UI_SETTINGS = {
  debug: process.env.NODE_ENV === 'development',
  autoSetActive: true,
  refreshInterval: 30000, // 30 seconds
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
    totalStudents: 0,
    totalCompanies: 0,
    totalProjects: 0,
    totalReservations: 0
  }
};

// ===== ENHANCED USER MANAGEMENT =====

const getCurrentUser = (req) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return null;

  try {
    const user = jwt.verify(token, config.jwt.secret);
    
    // Enhanced user object with additional properties
    return {
      ...user,
      isLoggedIn: true,
      lastActivity: new Date().toISOString()
    };
  } catch (error) {
    console.warn("🔐 Invalid token:", error.message);
    return null;
  }
};

// Enhanced middleware to serve role-based homepage
const serveRoleBasedHomepage = async (req, res, next) => {
  if (req.path !== "/" && req.path !== "/index.html") {
    return next();
  }

  const user = getCurrentUser(req);

  if (!user) {
    console.log("🎯 Serving guest homepage");
    return res.sendFile(path.join(__dirname, "../../public/index.html"));
  }

  let homepageFile;
  switch (user.userType) {
    case "student":
      homepageFile = path.join(__dirname, "../../src/HTML/STUDENTEN/student-homepage.html");
      console.log(`🎓 Serving student homepage for: ${user.email}`);
      break;
    case "bedrijf":
      homepageFile = path.join(__dirname, "../../src/HTML/BEDRIJVEN/homepage-bedrijf.html");
      console.log(`🏢 Serving bedrijf homepage for: ${user.email}`);
      break;
    case "organisator":
      homepageFile = path.join(__dirname, "../../src/HTML/ORGANISATOR/organisator-homepage.html");
      console.log(`👔 Serving organisator homepage for: ${user.email}`);
      break;
    default:
      homepageFile = path.join(__dirname, "../../public/index.html");
      console.log(`❓ Unknown user type: ${user.userType}, serving guest homepage`);
  }

  try {
    res.sendFile(homepageFile);
  } catch (error) {
    console.error("❌ Error serving homepage:", error);
    res.sendFile(path.join(__dirname, "../../public/index.html"));
  }
};

// Enhanced getUserInfo with better error handling
const getUserInfo = async (req, res) => {
  try {
    const user = getCurrentUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "No valid authentication token",
        isLoggedIn: false,
        userType: "guest"
      });
    }

    // Get additional user data from database
    let userData = { ...user };
    
    try {
      if (user.userType === 'student') {
        const [studentData] = await pool.query(
          "SELECT * FROM STUDENT WHERE studentnummer = ?",
          [user.userId]
        );
        if (studentData[0]) {
          userData = { ...userData, ...studentData[0] };
        }
      } else if (user.userType === 'bedrijf') {
        const [bedrijfData] = await pool.query(
          "SELECT * FROM BEDRIJF WHERE bedrijfsnummer = ?", 
          [user.userId]
        );
        if (bedrijfData[0]) {
          userData = { ...userData, ...bedrijfData[0] };
        }
      } else if (user.userType === 'organisator') {
        const [organisatorData] = await pool.query(
          "SELECT * FROM ORGANISATOR WHERE id = ?",
          [user.userId]
        );
        if (organisatorData[0]) {
          userData = { ...userData, ...organisatorData[0] };
        }
      }
    } catch (dbError) {
      console.warn("⚠️ Could not fetch additional user data:", dbError.message);
      // Continue with basic user data
    }

    // Remove sensitive data
    delete userData.wachtwoord;
    delete userData.password;

    res.json({
      success: true,
      data: userData,
      isLoggedIn: true,
      userType: user.userType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error in getUserInfo:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user info",
      isLoggedIn: false,
      userType: "guest"
    });
  }
};

// Enhanced getLiveStats with better error handling
const getLiveStats = async (req, res) => {
  try {
    let stats = { ...STATS_CONFIG.fallback };

    if (STATS_CONFIG.enabled) {
      try {
        for (const [key, query] of Object.entries(STATS_CONFIG.queries)) {
          try {
            const [result] = await pool.query(query);
            const statKey = key === "students" ? "totalStudents"
              : key === "companies" ? "totalCompanies"
              : key === "appointments" ? "totalReservations"
              : key === "projects" ? "totalProjects"
              : key;

            stats[statKey] = result[0]?.count || 0;
          } catch (queryError) {
            console.warn(`⚠️ Failed to get ${key} stats:`, queryError.message);
            // Keep fallback value
          }
        }

        console.log("📊 Live stats loaded:", stats);
      } catch (dbError) {
        console.warn("⚠️ Using fallback stats:", dbError.message);
      }
    }

    stats.lastUpdated = new Date().toISOString();
    res.json(stats);
  } catch (error) {
    console.error("❌ Error in getLiveStats:", error);
    res.status(500).json({ 
      error: "Failed to fetch stats",
      ...STATS_CONFIG.fallback,
      lastUpdated: new Date().toISOString()
    });
  }
};

// Enhanced authentication middleware
const requireAuth = (req, res, next) => {
  const user = getCurrentUser(req);
  if (!user) {
    console.log(`🔒 Auth required for: ${req.path}`);
    return res.redirect("/login");
  }
  req.user = user;
  next();
};

// Enhanced role checking
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = getCurrentUser(req);

    if (!user) {
      console.log(`❌ No user found for protected route: ${req.path}`);
      return res.redirect("/login");
    }

    if (!allowedRoles.includes(user.userType)) {
      console.log(`❌ Access denied: ${user.userType} not in [${allowedRoles.join(", ")}] for ${req.path}`);
      return res.status(403).json({
        error: "Access denied",
        message: `Required role: ${allowedRoles.join(" or ")}, but you are: ${user.userType}`,
        redirect: user.userType === 'student' ? '/student-homepage' 
          : user.userType === 'bedrijf' ? '/bedrijf-homepage'
          : user.userType === 'organisator' ? '/organisator-homepage'
          : '/'
      });
    }

    console.log(`✅ Access granted: ${user.userType} accessing ${req.path}`);
    req.user = user;
    next();
  };
};

// Enhanced client-side script generation
const generateClientSideScript = async () => {
  try {
    console.log("🔥 Generating enhanced navigation manager with live data...");

    let stats = { ...STATS_CONFIG.fallback };

    if (STATS_CONFIG.enabled) {
      try {
        for (const [key, query] of Object.entries(STATS_CONFIG.queries)) {
          try {
            const [result] = await pool.query(query);
            const statKey = key === "students" ? "totalStudents"
              : key === "companies" ? "totalCompanies" 
              : key === "appointments" ? "totalReservations"
              : key === "projects" ? "totalProjects"
              : key;

            stats[statKey] = result[0]?.count || 0;
          } catch (queryError) {
            console.warn(`⚠️ Query failed for ${key}:`, queryError.message);
          }
        }
        console.log("📊 Live stats for client:", stats);
      } catch (dbError) {
        console.warn("⚠️ Using fallback stats for client:", dbError.message);
      }
    }

    stats.lastUpdated = new Date().toISOString();

    return `
/**
 * 🚀 CAREERLAUNCH ENHANCED NAVIGATION MANAGER
 * Generated at: ${new Date().toISOString()}
 * Version: 2.2.0 - Improved reliability & bug fixes
 */

// ===== 📊 SERVER DATA INJECTION =====
window.LIVE_STATS = ${JSON.stringify(stats, null, 2)};
window.NAVIGATION_CONFIG = ${JSON.stringify(NAVIGATION_CONFIG, null, 2)};
window.UI_SETTINGS = ${JSON.stringify(UI_SETTINGS, null, 2)};

console.log('🔥 Enhanced Navigation Manager: Server data loaded');
console.log('📊 Live stats:', window.LIVE_STATS);

// ===== 🛠️ ENHANCED NAVIGATION MANAGER CLASS =====
class EnhancedNavigationManager {
  constructor() {
    this.currentUser = null;
    this.currentPath = window.location.pathname;
    this.config = window.NAVIGATION_CONFIG;
    this.settings = window.UI_SETTINGS;
    this.stats = window.LIVE_STATS;
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    this.log('🚀 Enhanced Navigation Manager initializing...');
    this.init();
  }
  
  async init() {
    try {
      await this.loadUserInfoWithRetry();
      this.updateNavigation();
      this.updateLiveStats();
      this.setupEventListeners();
      this.setupAccountButtonHandler(); // NEW: Enhanced account button handling
      this.startAutoRefresh();
      
      this.isInitialized = true;
      this.log('✅ Enhanced Navigation Manager initialized successfully');
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('navigationManagerReady', {
        detail: { userType: this.getUserType(), user: this.currentUser }
      }));
      
    } catch (error) {
      this.log('❌ Navigation Manager failed to initialize:', error);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
      this.updateNavigation();
    }
  }
  
  async loadUserInfoWithRetry() {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.loadUserInfo();
        this.retryCount = 0; // Reset on success
        return;
      } catch (error) {
        this.retryCount++;
        this.log(\`⚠️ User info load attempt \${attempt + 1} failed:\`, error.message);
        
        if (attempt < this.maxRetries - 1) {
          await this.sleep(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }
    
    // All attempts failed
    this.log('❌ All attempts to load user info failed, using guest mode');
    this.currentUser = { isLoggedIn: false, userType: 'guest' };
  }
  
  async loadUserInfo() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.currentUser = { isLoggedIn: false, userType: 'guest' };
        return;
      }
      
      const response = await fetch('/api/user-info', {
        headers: { 'Authorization': \`Bearer \${token}\` },
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          this.currentUser = {
            ...result.data,
            isLoggedIn: true,
            userType: result.userType
          };
          this.log('👤 User loaded:', this.currentUser.email, '-', this.currentUser.userType);
        } else {
          throw new Error(result.error || 'Invalid user data received');
        }
      } else {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          this.log('🔐 Token expired, cleared from storage');
        }
        throw new Error(\`HTTP \${response.status}\`);
      }
    } catch (error) {
      this.log('⚠️ Failed to load user info:', error.message);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
      throw error;
    }
  }
  
  setupAccountButtonHandler() {
    // Enhanced account button click handler
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      const text = link.textContent.toLowerCase();
      
      // Check if this is an account-related link
      if (href === '/account' || 
          text.includes('account') || 
          text.includes('mijn account') ||
          text.includes('profiel')) {
        
        e.preventDefault();
        this.handleAccountRedirect();
      }
    });
  }
  
  handleAccountRedirect() {
    const userType = this.getUserType();
    this.log(\`🔄 Account redirect for user type: \${userType}\`);
    
    const accountPages = {
      'student': '/account-student',
      'bedrijf': '/account-bedrijf',
      'organisator': '/account-organisator',
      'guest': '/login'
    };
    
    const targetPage = accountPages[userType] || '/login';
    this.log(\`➡️ Redirecting to: \${targetPage}\`);
    
    window.location.href = targetPage;
  }
  
  updateNavigation() {
    const userType = this.getUserType();
    const navConfig = this.config[userType];
    
    if (!navConfig) {
      this.log(\`❌ No navigation config found for user type: \${userType}\`);
      return;
    }
    
    this.log(\`🔄 Updating navigation for: \${userType}\`);
    
    this.updateNavbar(navConfig.navbar);
    this.updateSidebar(navConfig.sidebar);
    this.updateWelcomeMessage();
    this.updateActiveStates();
  }
  
  updateNavbar(navItems) {
    const navbar = document.querySelector(this.settings.selectors.navbar);
    if (!navbar) {
      this.log('⚠️ Navbar element not found');
      return;
    }
    
    // Clear existing nav items (but keep logo)
    const existingItems = navbar.querySelectorAll('.navItem');
    existingItems.forEach(item => item.remove());
    
    // Add new items
    navItems.forEach(item => {
      const link = this.createNavItem(item);
      navbar.appendChild(link);
    });
    
    this.log(\`📋 Updated navbar with \${navItems.length} items\`);
  }
  
  updateSidebar(sidebarItems) {
    const sidebar = document.querySelector(this.settings.selectors.sidebar);
    if (!sidebar) {
      this.log('⚠️ Sidebar element not found');
      return;
    }
    
    // Clear existing content
    sidebar.innerHTML = '';
    
    // Add new items
    sidebarItems.forEach(item => {
      if (item.divider) {
        const divider = document.createElement('hr');
        divider.className = this.settings.classes.sidebar.divider;
        sidebar.appendChild(divider);
      } else {
        const link = this.createSidebarItem(item);
        sidebar.appendChild(link);
      }
    });
    
    this.log(\`📋 Updated sidebar with \${sidebarItems.length} items\`);
  }
  
  createNavItem(item) {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.text;
    link.className = this.settings.classes.navbar.default;
    
    if (item.highlight) {
      link.classList.add(this.settings.classes.navbar.highlight);
    }
    
    return link;
  }
  
  createSidebarItem(item) {
    const link = document.createElement('a');
    
    if (item.action) {
      link.href = '#';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAction(item.action);
      });
    } else {
      link.href = item.href;
    }
    
    const icon = item.icon ? \`<i class="\${item.icon}"></i> \` : '';
    link.innerHTML = icon + item.text;
    
    if (item.danger) {
      link.style.color = '#e74c3c';
    }
    
    return link;
  }
  
  updateActiveStates() {
    if (!this.settings.autoSetActive) return;
    
    // Update navbar active states
    document.querySelectorAll('.navItem').forEach(item => {
      item.classList.remove('active');
      if (this.isCurrentPage(item.getAttribute('href'))) {
        item.classList.add('active');
      }
    });
  }
  
  updateWelcomeMessage() {
    if (!this.currentUser || !this.currentUser.isLoggedIn) return;
    
    const welcomeElements = document.querySelectorAll(
      '#welcomeTitle, .aboutTitle, .aboutTitleStudenten, #bedrijfWelcomeTitle, #adminWelcomeTitle'
    );
    
    welcomeElements.forEach(element => {
      if (element) {
        const name = this.currentUser.voornaam || this.currentUser.naam || 'User';
        const emoji = this.getUserType() === 'student' ? '🎓' 
          : this.getUserType() === 'bedrijf' ? '🏢' 
          : this.getUserType() === 'organisator' ? '🛠️' : '👋';
        
        element.textContent = \`Welkom terug, \${name}! \${emoji}\`;
      }
    });
  }
  
  updateLiveStats() {
    // Update live statistics on page
    Object.entries(this.stats).forEach(([key, value]) => {
      const elements = document.querySelectorAll(\`[data-count="\${key}"], #\${key}\`);
      elements.forEach(el => {
        if (el) el.textContent = value;
      });
    });
  }
  
  setupEventListeners() {
    // Auto-refresh on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isInitialized) {
        this.refresh();
      }
    });
    
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        // Check if user has access to this page
        this.validatePageAccess(link.href);
      }
    });
  }
  
  validatePageAccess(href) {
    // Basic page access validation
    const userType = this.getUserType();
    const url = new URL(href, window.location.origin);
    const path = url.pathname;
    
    // Check for protected paths
    const protectedPaths = {
      'student': ['/account-student', '/gegevens-student', '/mijn-project'],
      'bedrijf': ['/account-bedrijf', '/gegevens-bedrijf'],
      'organisator': ['/account-organisator', '/admin-panel', '/overzicht-organisator']
    };
    
    Object.entries(protectedPaths).forEach(([requiredRole, paths]) => {
      if (paths.some(p => path.startsWith(p)) && userType !== requiredRole && userType !== 'guest') {
        this.log(\`⚠️ Access validation: \${userType} accessing \${requiredRole} page\`);
      }
    });
  }
  
  startAutoRefresh() {
    if (this.settings.refreshInterval > 0) {
      setInterval(() => {
        if (!document.hidden) {
          this.refreshStats();
        }
      }, this.settings.refreshInterval);
    }
  }
  
  async refreshStats() {
    try {
      const response = await fetch('/api/stats/live', { cache: 'no-cache' });
      if (response.ok) {
        this.stats = await response.json();
        this.updateLiveStats();
        this.log('📊 Stats refreshed');
      }
    } catch (error) {
      this.log('⚠️ Failed to refresh stats:', error.message);
    }
  }
  
  async refresh() {
    this.log('🔄 Refreshing navigation...');
    await this.loadUserInfoWithRetry();
    this.updateNavigation();
    this.updateLiveStats();
  }
  
  handleAction(action) {
    switch (action) {
      case 'logout':
        this.logout();
        break;
      default:
        this.log(\`❓ Unknown action: \${action}\`);
    }
  }
  
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenTimestamp'); 
    this.log('🚪 User logged out');
    window.location.href = '/';
  }
  
  isCurrentPage(href) {
    if (!href) return false;
    const currentPath = window.location.pathname === '/' ? '/' : window.location.pathname;
    const targetPath = href === '' ? '/' : href;
    
    return currentPath === targetPath || 
           (currentPath !== '/' && targetPath !== '/' && currentPath.includes(targetPath));
  }
  
  getUserType() {
    return this.currentUser?.userType || 'guest';
  }
  
  isLoggedIn() {
    return this.currentUser?.isLoggedIn || false;
  }
  
  getUser() {
    return this.currentUser;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  log(...args) {
    if (this.settings.debug) {
      console.log('[NavigationManager]', ...args);
    }
  }
}

// ===== 🌐 GLOBAL FUNCTIONS & INITIALIZATION =====

window.navigationManager = null;

function initializeNavigation() {
  try {
    if (window.navigationManager) {
      window.navigationManager.refresh();
    } else {
      window.navigationManager = new EnhancedNavigationManager();
    }
  } catch (error) {
    console.error('[NavigationManager] Initialization failed:', error);
  }
}

// Public API functions
window.refreshNavigation = () => {
  if (window.navigationManager) {
    window.navigationManager.refresh();
  }
};

// Legacy compatibility functions
window.checkAuthStatus = () => window.navigationManager ? window.navigationManager.isLoggedIn() : false;
window.getUserType = () => window.navigationManager ? window.navigationManager.getUserType() : 'guest';
window.getLiveStats = () => window.navigationManager ? window.navigationManager.stats : window.LIVE_STATS;
window.refreshRoleUI = () => window.refreshNavigation();

// Global logout function
function logout() {
  if (window.navigationManager) {
    window.navigationManager.logout();
  } else {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  }
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
  initializeNavigation();
}

// Re-initialize on page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.navigationManager) {
    window.navigationManager.refresh();
  }
});

console.log('✅ Enhanced Navigation Manager v2.2.0 loaded and ready');
`;
  } catch (error) {
    console.error("❌ Error generating navigation manager:", error);
    return `console.error('Failed to generate navigation manager: ${error.message}');`;
  }
};

module.exports = {
  serveRoleBasedHomepage,
  getUserInfo,
  getLiveStats,
  getCurrentUser,
  requireAuth,
  requireRole,
  generateClientSideScript,
  isLoggedIn: (req) => getCurrentUser(req) !== null,
  getUserType: (req) => getCurrentUser(req)?.userType || "guest",
};