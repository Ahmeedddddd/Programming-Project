// startPage.js - Herbruikbare functionaliteit voor alle paginas

export function startPage() {
  // Wacht tot DOM volledig geladen is
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
  } else {
    initializePage();
  }
}

function initializePage() {
  // Start alle systemen
  hideLoading();
  initializeMenu();
  initializeGlobalFeatures();
}

// Verberg loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// Menu systeem - werkt op alle paginas
function initializeMenu() {
  const avatar = document.getElementById('burgerToggle');
  const sideMenu = document.getElementById('sideMenu');
  
  // Controleer of menu elementen bestaan
  if (!avatar || !sideMenu) {
    return;
  }

  // Menu toggle functie
  function toggleMenu() {
    const isOpen = sideMenu.classList.contains('open');
    
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Open menu
  function openMenu() {
    sideMenu.classList.add('open');
    
    const overlay = document.querySelector('.menu-overlay');
    if (overlay) {
      overlay.classList.add('show');
    }
    
    // Voorkom achtergrond scrollen
    document.body.style.overflow = 'hidden';
  }

  // Sluit menu
  function closeMenu() {
    sideMenu.classList.remove('open');
    
    // Reset inline style if it was set
    sideMenu.style.right = '';
    
    const overlay = document.querySelector('.menu-overlay');
    if (overlay) {
      overlay.classList.remove('show');
    }
    
    // Herstel scrollen
    document.body.style.overflow = '';
  }

  // Avatar click handler - toggle menu
  avatar.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close button handler (zoek binnen het menu)
  const closeBtn = sideMenu.querySelector('.sideMenu-closeBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
    });
  }

  // Overlay handler
  const overlay = document.querySelector('.menu-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeMenu();
    });
  }

  // Sluit menu bij klik buiten menu
  document.addEventListener('click', (e) => {
    if (sideMenu.classList.contains('open') && 
        !sideMenu.contains(e.target) && 
        !avatar.contains(e.target)) {
      closeMenu();
    }
  });

  // Escape toets handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  // Voeg hover effecten toe aan menu links
  const menuLinks = sideMenu.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.transform = 'translateX(8px) translateY(-2px) scale(1.02)';
    });
    
    link.addEventListener('mouseleave', () => {
      if (!link.classList.contains('active')) {
        link.style.transform = '';
      }
    });
  });
}

// Globale features die op alle paginas werken
function initializeGlobalFeatures() {
  // Smooth scroll voor anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Active navigation states
  setActiveNavigation();
  
  // Form enhancements (als er forms zijn)
  enhanceForms();
}

// Zet actieve navigatie status
function setActiveNavigation() {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.navItem');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && (currentPath.includes(href) || (href === '/index.html' && currentPath === '/'))) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Verbeter formulieren (als ze bestaan)
function enhanceForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // Voeg loading states toe aan submit buttons
    form.addEventListener('submit', (e) => {
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
        }, 2000);
      }
    });
  });
}

// Extra utility functions voor hergebruik
export function showNotification(message, type = 'info') {
  console.log(`📢 ${type.toUpperCase()}: ${message}`);
  // Hier kan je later een toast notification systeem toevoegen
}

export function isMenuOpen() {
  const sideMenu = document.getElementById('sideMenu');
  return sideMenu ? sideMenu.classList.contains('open') : false;
}

export function closeMenuProgrammatically() {
  const sideMenu = document.getElementById('sideMenu');
  if (sideMenu && sideMenu.classList.contains('open')) {
    sideMenu.classList.remove('open');
    document.body.style.overflow = '';
    const overlay = document.querySelector('.menu-overlay');
    if (overlay) {
      overlay.classList.remove('show');
    }
  }
}

startPage();