// src/Server/MIDDLEWARE/rolCheck.js - UPGRADED VERSION WITH DYNAMIC NAVIGATION

const jwt = require("jsonwebtoken");
const config = require("../CONFIG/config");
const path = require("path");
const { pool } = require("../CONFIG/database");

// 🎯 Import navigation configuration
const {
  NAVIGATION_CONFIG,
  UI_SETTINGS,
  STATS_CONFIG,
} = require("./navigation-config");

// Get current user from token
const getCurrentUser = (req) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

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
  if (req.path !== "/" && req.path !== "/index.html") {
    return next();
  }

  const user = getCurrentUser(req);

  if (!user) {
    // Guest - serve standaard homepage
    console.log("🎯 Serving guest homepage: index.html");
    return res.sendFile(path.join(__dirname, "../../public/index.html"));
  }

  // 🔥 ENHANCED: Gebaseerd op userType, serve verschillende bestanden
  let homepageFile;
  switch (user.userType) {
    case "student":
      homepageFile = path.join(
        __dirname,
        "../../src/HTML/STUDENTEN/student-homepage.html"
      );
      console.log("🎓 Serving student homepage");
      break;
    case "bedrijf":
      homepageFile = path.join(
        __dirname,
        "../../src/HTML/BEDRIJVEN/bedrijf-homepage.html"
      );
      console.log("🏢 Serving bedrijf homepage");
      break;
    case "organisator":
      homepageFile = path.join(
        __dirname,
        "../../src/HTML/ORGANISATOR/organisator-homepage.html"
      );
      console.log("👔 Serving organisator homepage");
      break;
    default:
      homepageFile = path.join(__dirname, "../../public/index.html");
  }

  // Check of bestand bestaat, anders fallback naar guest
  const fs = require("fs");
  if (fs.existsSync(homepageFile)) {
    res.sendFile(homepageFile);
  } else {
    console.warn(
      `⚠️ Homepage file not found: ${homepageFile}, serving guest page`
    );
    res.sendFile(path.join(__dirname, "../../public/index.html"));
  }
};

// API endpoint om user info te krijgen voor frontend
const getUserInfo = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      return res.json({
        isLoggedIn: false,
        userType: "guest",
        user: null,
      });
    }

    // Get live user data from database
    let userData = {
      email: user.email,
      userType: user.userType,
      userId: user.userId,
      naam: user.naam || "",
    };

    try {
      // Load fresh user data based on type
      if (user.userType === "student") {
        const [students] = await pool.query(
          "SELECT * FROM STUDENT WHERE email = ?",
          [user.email]
        );
        if (students.length > 0) {
          userData = {
            ...userData,
            ...students[0],
            naam: `${students[0].voornaam} ${students[0].achternaam}`,
          };
        }
      } else if (user.userType === "bedrijf") {
        const [bedrijven] = await pool.query(
          "SELECT * FROM BEDRIJF WHERE email = ?",
          [user.email]
        );
        if (bedrijven.length > 0) {
          userData = { ...userData, ...bedrijven[0] };
        }
      } else if (user.userType === "organisator") {
        const [organisators] = await pool.query(
          "SELECT * FROM ORGANISATOR WHERE email = ?",
          [user.email]
        );
        if (organisators.length > 0) {
          userData = {
            ...userData,
            ...organisators[0],
            naam: `${organisators[0].voornaam} ${organisators[0].achternaam}`,
          };
        }
      }
    } catch (dbError) {
      console.warn("⚠️ Could not load additional user data:", dbError.message);
    }

    res.json({
      isLoggedIn: true,
      userType: user.userType,
      user: userData,
    });
  } catch (error) {
    console.error("Error in getUserInfo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🆕 NEW: Live stats endpoint
const getLiveStats = async (req, res) => {
  try {
    let stats = { ...STATS_CONFIG.fallback };

    if (STATS_CONFIG.enabled) {
      try {
        // Execute configured queries
        for (const [key, query] of Object.entries(STATS_CONFIG.queries)) {
          const [result] = await pool.query(query);
          const statKey =
            key === "students"
              ? "totalStudents"
              : key === "companies"
              ? "totalCompanies"
              : key === "appointments"
              ? "totalReservations"
              : key === "projects"
              ? "totalProjects"
              : key;

          stats[statKey] = result[0]?.count || 0;
        }
      } catch (dbError) {
        console.warn("⚠️ Using fallback stats:", dbError.message);
      }
    }

    stats.lastUpdated = new Date().toISOString();
    res.json(stats);
  } catch (error) {
    console.error("Error in getLiveStats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// Require authentication (any logged in user)
const requireAuth = (req, res, next) => {
  const user = getCurrentUser(req);
  if (!user) {
    return res.redirect("/login");
  }
  req.user = user;
  next();
};

// Require specific roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = getCurrentUser(req);

    if (!user) {
      console.log("❌ No user found, redirecting to login");
      return res.redirect("/login");
    }

    if (!allowedRoles.includes(user.userType)) {
      console.log(
        `❌ Access denied: ${user.userType} not in [${allowedRoles.join(", ")}]`
      );
      return res.status(403).json({
        error: "Access denied",
        message: `Required role: ${allowedRoles.join(" or ")}, but you are: ${
          user.userType
        }`,
      });
    }

    console.log(`✅ Access granted: ${user.userType} accessing ${req.path}`);
    req.user = user;
    next();
  };
};

// 🚀 UPGRADED: Generate dynamic client-side script with navigation manager
const generateClientSideScript = async () => {
  try {
    console.log("🔥 Generating enhanced navigation manager with live data...");

    // Get live stats from database
    let stats = { ...STATS_CONFIG.fallback };

    if (STATS_CONFIG.enabled) {
      try {
        for (const [key, query] of Object.entries(STATS_CONFIG.queries)) {
          const [result] = await pool.query(query);
          const statKey =
            key === "students"
              ? "totalStudents"
              : key === "companies"
              ? "totalCompanies"
              : key === "appointments"
              ? "totalReservations"
              : key === "projects"
              ? "totalProjects"
              : key;

          stats[statKey] = result[0]?.count || 0;
        }

        console.log("📊 Live stats loaded:", stats);
      } catch (dbError) {
        console.warn("⚠️ Using fallback stats:", dbError.message);
      }
    }

    stats.lastUpdated = new Date().toISOString();

    return `
/**
 * 🚀 CAREERLAUNCH DYNAMIC NAVIGATION MANAGER
 * Generated at: ${new Date().toISOString()}
 */

// ===== 📊 SERVER DATA INJECTION =====
window.LIVE_STATS = ${JSON.stringify(stats, null, 2)};
window.NAVIGATION_CONFIG = ${JSON.stringify(NAVIGATION_CONFIG, null, 2)};
window.UI_SETTINGS = ${JSON.stringify(UI_SETTINGS, null, 2)};

console.log('🔥 Navigation Manager: Server data loaded');
console.log('📊 Live stats:', window.LIVE_STATS);

// ===== 🛠️ NAVIGATION MANAGER CLASS =====
class NavigationManager {
  constructor() {
    this.currentUser = null;
    this.currentPath = window.location.pathname;
    this.config = window.NAVIGATION_CONFIG;
    this.settings = window.UI_SETTINGS;
    this.stats = window.LIVE_STATS;
    
    this.log('🚀 Navigation Manager initializing...');
    this.init();
  }
  
  async init() {
    try {
      await this.loadUserInfo();
      this.updateNavigation();
      this.updateLiveStats();
      this.setupEventListeners();
      this.startAutoRefresh();
      
      this.log('✅ Navigation Manager initialized successfully');
    } catch (error) {
      this.log('❌ Navigation Manager failed to initialize:', error);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
      this.updateNavigation();
    }
  }
  
  async loadUserInfo() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.currentUser = { isLoggedIn: false, userType: 'guest' };
        return;
      }
      
      const response = await fetch('/api/user-info', {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      
      if (response.ok) {
        this.currentUser = await response.json();
        this.log('👤 User loaded:', this.currentUser);
      } else {
        throw new Error(\`HTTP \${response.status}\`);
      }
    } catch (error) {
      this.log('⚠️ Failed to load user info:', error.message);
      this.currentUser = { isLoggedIn: false, userType: 'guest' };
    }
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
  }
  
  updateNavbar(navItems) {
    const navbar = document.querySelector(this.settings.selectors.navbar);
    if (!navbar) {
      this.log('⚠️ Navbar element not found:', this.settings.selectors.navbar);
      return;
    }
    
    // Clear existing items
    const existingItems = navbar.querySelectorAll('.' + this.settings.classes.navbar.default + ', a:not(.logo)');
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
      this.log('⚠️ Sidebar element not found:', this.settings.selectors.sidebar);
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
    
    if (this.settings.autoSetActive && this.isCurrentPage(item.href)) {
      link.classList.add(this.settings.classes.navbar.active);
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
    link.innerHTML = \`\${icon}\${item.text}\`;
    
    link.className = this.settings.classes.sidebar.default;
    if (item.danger) {
      link.classList.add(this.settings.classes.sidebar.danger);
    }
    
    return link;
  }
  
  updateLiveStats() {
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
    
    this.log('📊 Live stats updated in UI');
  }
  
  updateWelcomeMessage() {
    if (!this.currentUser?.isLoggedIn || !this.currentUser?.user) return;
    
    const welcomeElement = document.querySelector(this.settings.selectors.welcomeMessage);
    if (!welcomeElement) return;
    
    const userData = this.currentUser.user;
    let welcomeText = '';
    
    switch (this.currentUser.userType) {
      case 'student':
        if (userData.voornaam) {
          welcomeText = \`Welkom terug, \${userData.voornaam}! 🎓\`;
        }
        break;
      case 'bedrijf':
        if (userData.naam) {
          welcomeText = \`Welkom, \${userData.naam}! 🏢\`;
        }
        break;
      case 'organisator':
        if (userData.voornaam) {
          welcomeText = \`Admin Dashboard - \${userData.voornaam} 🛠️\`;
        }
        break;
    }
    
    if (welcomeText) {
      welcomeElement.textContent = welcomeText;
      this.log(\`👋 Updated welcome message: \${welcomeText}\`);
    }
  }
  
  setupEventListeners() {
    // Cross-tab logout detection
    window.addEventListener('storage', (e) => {
      if (e.key === 'authToken' && !e.newValue) {
        this.log('🔄 Token removed in other tab, refreshing...');
        this.refresh();
      }
    });
    
    // Page visibility change refresh
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.refresh();
      }
    });
  }
  
  startAutoRefresh() {
    setInterval(async () => {
      this.log('🔄 Auto-refreshing data...');
      
      try {
        const response = await fetch('/api/stats/live');
        if (response.ok) {
          this.stats = await response.json();
          this.updateLiveStats();
        }
      } catch (error) {
        this.log('⚠️ Failed to refresh stats:', error);
      }
    }, 2 * 60 * 1000); // Every 2 minutes
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
  
  async logout() {
    try {
      this.log('🚪 Logging out...');
      
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      this.log('❌ Logout error:', error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      this.log('✅ Logout successful');
      window.location.href = '/login';
    }
  }
  
  // ===== 🔧 UTILITY METHODS =====
  
  getUserType() {
    return this.currentUser?.userType || 'guest';
  }
  
  isLoggedIn() {
    return this.currentUser?.isLoggedIn || false;
  }
  
  isCurrentPage(href) {
    const currentPath = this.currentPath === '' ? '/' : this.currentPath;
    const targetPath = href === '' ? '/' : href;
    
    return currentPath === targetPath || 
           (currentPath !== '/' && targetPath !== '/' && currentPath.includes(targetPath));
  }
  
  async refresh() {
    this.log('🔄 Refreshing navigation...');
    await this.loadUserInfo();
    this.updateNavigation();
    this.updateLiveStats();
  }
  
  log(...args) {
    if (this.settings.debug) {
      console.log('[NavigationManager]', ...args);
    }
  }
  
  // ===== 📢 PUBLIC API =====
  
  addNavItem(userType, section, item, position = -1) {
    if (!this.config[userType] || !this.config[userType][section]) {
      this.log(\`❌ Invalid userType (\${userType}) or section (\${section})\`);
      return;
    }
    
    if (position === -1) {
      this.config[userType][section].push(item);
    } else {
      this.config[userType][section].splice(position, 0, item);
    }
    
    this.log(\`➕ Added item to \${userType}.\${section}:\`, item);
    this.updateNavigation();
  }
  
  removeNavItem(userType, section, text) {
    if (!this.config[userType] || !this.config[userType][section]) return;
    
    const index = this.config[userType][section].findIndex(item => item.text === text);
    if (index !== -1) {
      this.config[userType][section].splice(index, 1);
      this.log(\`➖ Removed item from \${userType}.\${section}:\`, text);
      this.updateNavigation();
    }
  }
  
  updateNavItem(userType, section, text, newItem) {
    if (!this.config[userType] || !this.config[userType][section]) return;
    
    const index = this.config[userType][section].findIndex(item => item.text === text);
    if (index !== -1) {
      this.config[userType][section][index] = { ...this.config[userType][section][index], ...newItem };
      this.log(\`🔄 Updated item in \${userType}.\${section}:\`, newItem);
      this.updateNavigation();
    }
  }
}

// ===== 🌐 GLOBAL FUNCTIONS =====

window.navigationManager = null;

// Initialize function
function initializeNavigation() {
  try {
    if (window.navigationManager) {
      window.navigationManager.refresh();
    } else {
      window.navigationManager = new NavigationManager();
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

window.addNavItem = (userType, section, item, position) => {
  if (window.navigationManager) {
    window.navigationManager.addNavItem(userType, section, item, position);
  }
};

window.removeNavItem = (userType, section, text) => {
  if (window.navigationManager) {
    window.navigationManager.removeNavItem(userType, section, text);
  }
};

window.updateNavItem = (userType, section, text, newItem) => {
  if (window.navigationManager) {
    window.navigationManager.updateNavItem(userType, section, text, newItem);
  }
};

// Legacy functions for compatibility
window.checkAuthStatus = () => window.navigationManager ? window.navigationManager.isLoggedIn() : false;
window.getUserType = () => window.navigationManager ? window.navigationManager.getUserType() : 'guest';
window.getLiveStats = () => window.navigationManager ? window.navigationManager.stats : window.LIVE_STATS;
window.refreshRoleUI = () => window.refreshNavigation();

// ===== 🎬 INITIALIZATION =====

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

console.log('✅ Navigation Manager loaded and ready');
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
