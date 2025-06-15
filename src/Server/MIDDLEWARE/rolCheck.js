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
const getUserInfo = (req, res) => {
  const user = getCurrentUser(req);
  
  if (!user) {
    return res.json({ 
      isLoggedIn: false, 
      userType: 'guest',
      user: null
    });
  }

  res.json({
    isLoggedIn: true,
    userType: user.userType,
    user: {
      userId: user.userId,
      email: user.email,
      userType: user.userType
    }
  });
};

/**
 * ===== EXPORT VOOR CLIENT-SIDE GEBRUIK =====
 * Deze functies kunnen gebruikt worden in je frontend JavaScript
 */

const generateClientSideScript = () => {
  return `
    <script>
    /**
     * CLIENT-SIDE ROLE MANAGEMENT
     * Deze functies passen de UI dynamisch aan op basis van user role
     */
    
    class RoleManager {
      constructor() {
        this.currentUser = null;
        this.init();
      }
      
      async init() {
        await this.loadUserInfo();
        this.setupUI();
      }
      
      async loadUserInfo() {
        try {
          const response = await fetch('/api/user-info');
          this.currentUser = await response.json();
        } catch (error) {
          console.error('Failed to load user info:', error);
          this.currentUser = { isLoggedIn: false, userType: 'guest' };
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
        
        // Remove existing navigation
        navbar.innerHTML = '';
        
        // Add base navigation
        const baseItems = [
          { href: '/', text: 'Home', active: window.location.pathname === '/' }
        ];
        
        // Add role-specific items
        if (this.currentUser.isLoggedIn) {
          switch (this.currentUser.userType) {
            case 'student':
              baseItems.push(
                { href: '/programma', text: 'Programma' },
                { href: '/gesprekkenOverzicht', text: 'Mijn gesprekken' },
                { href: '/mijnProject', text: 'Mijn Project' },
                { href: '/account', text: 'Mijn Account' }
              );
              break;
              
            case 'bedrijf':
              baseItems.push(
                { href: '/programma', text: 'Programma' },
                { href: '/gesprekkenOverzicht', text: 'Gesprekken' },
                { href: '/alleStudenten', text: 'Studenten' },
                { href: '/account', text: 'Mijn Account' }
              );
              break;
              
            case 'organisator':
              baseItems.push(
                { href: '/adminPanel', text: 'Admin Panel' },
                { href: '/overzichtOrganisator', text: 'Overzicht' },
                { href: '/alleStudenten', text: 'Studenten' },
                { href: '/alleBedrijven', text: 'Bedrijven' },
                { href: '/account', text: 'Account' }
              );
              break;
          }
        } else {
          // Guest navigation
          baseItems.push(
            { href: '/programma', text: 'Programma' },
            { href: '/info', text: 'Info' },
            { href: '/login', text: 'Login' }
          );
        }
        
        // Create navigation elements
        baseItems.forEach(item => {
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
        
        // Clear existing content (but keep structure)
        const existingLinks = sideMenuContent.querySelectorAll('a');
        existingLinks.forEach(link => link.remove());
        
        if (this.currentUser.isLoggedIn) {
          // Logged in menu
          const menuItems = [
            { href: '/account', icon: 'fas fa-user', text: 'Mijn Account' },
            { href: '/change-password', icon: 'fas fa-key', text: 'Wachtwoord wijzigen' },
            { href: '#', icon: 'fas fa-sign-out-alt', text: 'Uitloggen', onclick: 'logout()' }
          ];
          
          menuItems.forEach(item => {
            const link = document.createElement('a');
            link.href = item.href;
            if (item.onclick) {
              link.setAttribute('onclick', item.onclick);
            }
            link.innerHTML = \`<i class="\${item.icon}"></i> \${item.text}\`;
            sideMenuContent.appendChild(link);
          });
        } else {
          // Guest menu  
          const guestItems = [
            { href: '/login', icon: 'fas fa-sign-in-alt', text: 'Login' },
            { href: '/register', icon: 'fas fa-user-plus', text: 'Registreren' },
            { href: '/contacteer', icon: 'fas fa-envelope', text: 'Contact us' }
          ];
          
          guestItems.forEach(item => {
            const link = document.createElement('a');
            link.href = item.href;
            link.innerHTML = \`<i class="\${item.icon}"></i> \${item.text}\`;
            sideMenuContent.appendChild(link);
          });
        }
      }
      
      updateContent() {
        // Update page content based on role
        const welcomeSection = document.querySelector('.aboutSection h1');
        if (welcomeSection && this.currentUser.isLoggedIn) {
          switch (this.currentUser.userType) {
            case 'student':
              welcomeSection.textContent = 'Welkom terug, Student!';
              break;
            case 'bedrijf':
              welcomeSection.textContent = 'Welkom terug bij CareerLaunch!';
              break;
            case 'organisator':
              welcomeSection.textContent = 'Admin Dashboard';
              break;
          }
        }
        
        // Hide/show sections based on role
        this.toggleSectionsByRole();
      }
      
      toggleSectionsByRole() {
        const sections = {
          '.content-sections': true, // Always show
          '.projects-section': this.currentUser.userType !== 'bedrijf' // Hide for bedrijf
        };
        
        Object.entries(sections).forEach(([selector, shouldShow]) => {
          const element = document.querySelector(selector);
          if (element) {
            element.style.display = shouldShow ? 'block' : 'none';
          }
        });
      }
      
      updateActions() {
        // Update action buttons based on role
        const actionButtons = document.querySelectorAll('.section-btn, .cta-btn');
        
        actionButtons.forEach(button => {
          if (this.currentUser.isLoggedIn) {
            // Customize button actions for logged in users
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
            // Admin gets access to everything
            if (originalHref.includes('/info')) {
              button.textContent = 'Beheer ' + button.textContent;
            }
            break;
        }
      }
      
      // Public method to get current user
      getCurrentUser() {
        return this.currentUser;
      }
      
      // Method to refresh user info
      async refresh() {
        await this.loadUserInfo();
        this.setupUI();
      }
    }
    
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
        console.error('Logout error:', error);
      } finally {
        // Clear local storage
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Redirect to login
        window.location.href = '/login';
      }
    };
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      window.roleManager = new RoleManager();
    });
    
    // Auto-refresh user info when navigating back
    window.addEventListener('pageshow', function(event) {
      if (event.persisted && window.roleManager) {
        window.roleManager.refresh();
      }
    });
    </script>
  `;
};

module.exports = {
  // Server-side middleware
  serveRoleBasedHomepage,
  serveRoleBasedAccountPage,
  getUserInfo,
  getCurrentUser,
  
  // Client-side script generator
  generateClientSideScript,
  
  // Utility functions
  isLoggedIn: (req) => getCurrentUser(req) !== null,
  getUserType: (req) => getCurrentUser(req)?.userType || 'guest',
  requireAuth: (req, res, next) => {
    if (!getCurrentUser(req)) {
      return res.redirect('/login');
    }
    next();
  }
};