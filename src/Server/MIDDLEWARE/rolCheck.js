// src/Server/MIDDLEWARE/rolCheck.js
// =================================

const jwt = require("jsonwebtoken");
const config = require("../CONFIG/config");
const path = require("path");
const fs = require("fs");
const { pool } = require("../CONFIG/database");
const { NAVIGATION_CONFIG, UI_SETTINGS, STATS_CONFIG } = require("./navigation-config");

// ===== ENHANCED USER MANAGEMENT =====

const getCurrentUser = (req) => {
  console.log('🔍 getCurrentUser called for path:', req.path);
  
  let token = null;
  
  // Method 1: Check Authorization header (voor API calls)
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    token = authHeader.split(" ")[1];
    console.log('   → Token from Authorization header: ✅');
  }
  
  // Method 2: Check cookies (voor page navigation) - NIEUWE FUNCTIONALITEIT
  if (!token && req.headers.cookie) {
    console.log('   → Checking cookies for auth token...');
    const cookies = req.headers.cookie.split(';');
    
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken') {
        token = value;
        console.log('   → Token found in cookies: ✅');
        break;
      }
    }
  }
  
  if (!token) {
    console.log('   → No token found in headers or cookies');
    return null;
  }

  try {
    const user = jwt.verify(token, config.jwt.secret);
    console.log('   → JWT verified successfully ✅');
    console.log(`   → User: ${user.email} (${user.userType})`);
    
    return {
      ...user,
      isLoggedIn: true,
      lastActivity: new Date().toISOString()
    };
    
  } catch (error) {
    console.warn("🔐 JWT verification failed:", error.message);
    console.warn("   → Token:", token ? token.substring(0, 20) + '...' : 'undefined');
    return null;
  }
};

// Enhanced middleware to serve role-based homepage
const serveRoleBasedHomepage = async (req, res, next) => {
  console.log('🏠 serveRoleBasedHomepage called for path:', req.path);
  
  if (req.path !== "/" && req.path !== "/index.html") {
    console.log('   → Not homepage request, passing to next middleware');
    return next();
  }

  const user = getCurrentUser(req);
  console.log('👤 Current user:', user ? `${user.email} (${user.userType})` : 'No user');

  if (!user) {
    console.log("🎯 Serving guest homepage");
    return res.sendFile(path.join(__dirname, "../../../public/index.html"));
  }

  let homepageFile;
  let userTypeForLog;
  
  switch (user.userType) {
    case "student":
      homepageFile = path.join(__dirname, "../../src/HTML/STUDENTEN/student-homepage.html");
      userTypeForLog = "🎓 Student";
      break;
      
    case "bedrijf":
      homepageFile = path.join(__dirname, "../../src/HTML/BEDRIJVEN/homepage-bedrijf.html");
      userTypeForLog = "🏢 Bedrijf";
      break;
      
    case "organisator":
      homepageFile = path.join(__dirname, "../../src/HTML/ORGANISATOR/organisator-homepage.html");
      userTypeForLog = "👔 Organisator";
      break;
      
    default:
      console.warn(`❓ Unknown user type: ${user.userType}, serving guest homepage`);
      homepageFile = path.join(__dirname, "../../public/index.html");
      userTypeForLog = "❓ Unknown";
  }

  try {
    console.log(`🔍 Checking file exists: ${homepageFile}`);
    
    if (!fs.existsSync(homepageFile)) {
      console.error(`❌ Homepage file not found: ${homepageFile}`);
      console.error(`   → Falling back to guest homepage`);
      return res.sendFile(path.join(__dirname, "../../public/index.html"));
    }
    
    console.log(`✅ ${userTypeForLog} homepage serving: ${user.email}`);
    console.log(`   → File: ${homepageFile}`);
    
    res.sendFile(homepageFile);
    
  } catch (error) {
    console.error("❌ Error serving homepage:", error);
    console.error("   → Stack:", error.stack);
    res.sendFile(path.join(__dirname, "../../public/index.html"));
  }
};

// FIXED: Enhanced getUserInfo with correct database column names
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
        // FIXED: Use correct column name 'organisatorId' instead of 'id'
        const [organisatorData] = await pool.query(
          "SELECT * FROM ORGANISATOR WHERE organisatorId = ?",
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

// Enhanced getLiveStats remains the same
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
  console.log(`🔒 requireAuth middleware called for: ${req.path}`);
  
  const user = getCurrentUser(req);
  
  if (!user) {
    console.log(`❌ Auth required but no user found for: ${req.path}`);
    console.log('   → Redirecting to /login');
    return res.redirect("/login");
  }
  
  console.log(`✅ Auth successful: ${user.email} (${user.userType}) accessing ${req.path}`);
  req.user = user;
  next();
};

// Enhanced role checking
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log(`🛡️ requireRole middleware called for: ${req.path}`);
    console.log(`   → Required roles: [${allowedRoles.join(", ")}]`);
    
    const user = getCurrentUser(req);

    if (!user) {
      console.log(`❌ No user found for protected route: ${req.path}`);
      return res.redirect("/login");
    }
    
    console.log(`   → User role: ${user.userType}`);

    if (!allowedRoles.includes(user.userType)) {
      console.log(`❌ Access denied: ${user.userType} not in [${allowedRoles.join(", ")}] for ${req.path}`);
      
      const redirectMap = {
        'student': '/student-homepage',
        'bedrijf': '/bedrijf-homepage', 
        'organisator': '/organisator-homepage'
      };
      
      const redirectUrl = redirectMap[user.userType] || '/';
      console.log(`   → Redirecting to: ${redirectUrl}`);
      
      return res.status(403).json({
        error: "Access denied",
        message: `Required role: ${allowedRoles.join(" or ")}, but you are: ${user.userType}`,
        redirect: redirectUrl
      });
    }

    console.log(`✅ Access granted: ${user.userType} accessing ${req.path}`);
    req.user = user;
    next();
  };
};

// Enhanced client-side script generation remains the same but with fixed API calls
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
 * Version: 2.4.0 - Fixed database queries & API routes
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
      this.setupAccountButtonHandler();
      this.startAutoRefresh();
      
      this.isInitialized = true;
      this.log('✅ Enhanced Navigation Manager initialized successfully');
      
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
        this.retryCount = 0;
        return;
      } catch (error) {
        this.retryCount++;
        this.log(\`⚠️ User info load attempt \${attempt + 1} failed:\`, error.message);
        
        if (attempt < this.maxRetries - 1) {
          await this.sleep(1000 * (attempt + 1));
        }
      }
    }
    
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
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      const text = link.textContent.toLowerCase();
      
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
    
    const existingItems = navbar.querySelectorAll('.navItem');
    existingItems.forEach(item => item.remove());
    
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
    
    sidebar.innerHTML = '';
    
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
    Object.entries(this.stats).forEach(([key, value]) => {
      const elements = document.querySelectorAll(\`[data-count="\${key}"], #\${key}\`);
      elements.forEach(el => {
        if (el) el.textContent = value;
      });
    });
  }
  
  setupEventListeners() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isInitialized) {
        this.refresh();
      }
    });
    
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        this.validatePageAccess(link.href);
      }
    });
  }
  
  validatePageAccess(href) {
    const userType = this.getUserType();
    const url = new URL(href, window.location.origin);
    const path = url.pathname;
    
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

window.refreshNavigation = () => {
  if (window.navigationManager) {
    window.navigationManager.refresh();
  }
};

window.checkAuthStatus = () => window.navigationManager ? window.navigationManager.isLoggedIn() : false;
window.getUserType = () => window.navigationManager ? window.navigationManager.getUserType() : 'guest';
window.getLiveStats = () => window.navigationManager ? window.navigationManager.stats : window.LIVE_STATS;
window.refreshRoleUI = () => window.refreshNavigation();

function logout() {
  if (window.navigationManager) {
    window.navigationManager.logout();
  } else {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
  initializeNavigation();
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.navigationManager) {
    window.navigationManager.refresh();
  }
});

console.log('✅ Enhanced Navigation Manager v2.4.0 loaded and ready');
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