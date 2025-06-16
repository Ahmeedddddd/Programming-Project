// startPage.js - Herbruikbare functionaliteit met QoL features voor alle paginas
// Wacht tot DOM volledig geladen is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

function initializePage() {
  // Start alle systemen
  hideLoading();
  scrollToTop();
  initializeMenu();
  initializeGlobalFeatures();
  initializeQualityOfLifeFeatures(); // 🌟 BESTAANDE QOL FEATURES
  initializeExtraQoL(); // 🌟 NIEUWE EXTRA QOL FEATURES
}

// Verberg loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// Scroll naar boven bij pagina laden
function scrollToTop() {
  const isIndexPage = window.location.pathname === '/' || 
                     window.location.pathname.includes('index.html') ||
                     window.location.pathname === '';
  
  if (isIndexPage) {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }, 50);
    
  }
}

// Menu systeem - werkt op alle paginas
function initializeMenu() {
  const avatar = document.getElementById('burgerToggle');
  const sideMenu = document.getElementById('sideMenu');
  
  if (!avatar || !sideMenu) {
    return;
  }

  function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.querySelector('.menu-overlay');
    const body = document.body;
    
    
    if (sideMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    const overlay = document.querySelector('.menu-overlay');
    const body = document.body;
    
    sideMenu.classList.add('open');
    
    if (overlay) {
      overlay.classList.add('show');
    }
    
    body.classList.add('menu-open');
  }

  function closeMenu() {
    const overlay = document.querySelector('.menu-overlay');
    const body = document.body;
    
    sideMenu.classList.remove('open');
    sideMenu.style.right = '';
    
    if (overlay) {
      overlay.classList.remove('show');
    }
    
    body.classList.remove('menu-open');
    body.style.overflow = '';
    body.style.paddingRight = '';
    
  }

  // Event listeners
  avatar.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  const closeBtn = sideMenu.querySelector('.sideMenu-closeBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
    });
  }

  const overlay = document.querySelector('.menu-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeMenu();
    });
  }

  document.addEventListener('click', (e) => {
    if (sideMenu.classList.contains('open') && 
        !sideMenu.contains(e.target) && 
        !avatar.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
      closeMenu();
    }
  });

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
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      
      // Check if href is more than just '#' and is a valid selector
      if (href && href.length > 1) {
        try {
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        } catch (error) {
          console.warn('Invalid selector:', href);
        }
      }
    });
  });

  setActiveNavigation();
  enhanceForms();
  
  window.fixScroll = function() {
    const body = document.body;
    body.classList.remove('menu-open');
    body.style.overflow = '';
    body.style.paddingRight = '';
  };
}

// ===== 🌟 QUALITY OF LIFE FEATURES ===== 
function initializeQualityOfLifeFeatures() {
  
  // 1. Performance Monitoring
  initializePerformanceMonitoring();
  
  // 2. Network Status Detection
  initializeNetworkStatus();
  
  // 3. Global Keyboard Shortcuts
  initializeKeyboardShortcuts();
  
  // 4. Context Menu Enhancement
  initializeContextMenu();
  
  // 5. Auto-save Form Data
  initializeAutoSave();
  
  // 6. Copy URL Feature
  initializeCopyURL();
  
  // 7. Print Page Feature
  initializePrintFeature();
  
  // 8. Back Button Enhancement
  initializeBackButton();
  
  // 9. Tooltip System
  initializeTooltips();
  
  // 10. Notification System
  initializeNotificationSystem();
  
  // 11. Error Boundary
  initializeErrorHandling();
  
  // 12. Time-based Features
  initializeTimeBasedFeatures();
  
  // 13. Accessibility Tools
  initializeAccessibilityTools();
  
  // 14. Developer Tools (alleen in development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    initializeDeveloperTools();
  }
  
}

// ===== 🌟 EXTRA QOL FEATURES ===== 
function initializeExtraQoL() {
  
  // 1. 📚 Recent Pages Tracking
  initializeRecentPages();
  
  // 2. 🔍 Quick Search (Ctrl+K enhancement)
  initializeQuickSearch();
  
  // 3. 📱 Mobile Gestures
  initializeMobileGestures();
  
}

// 📊 Performance Monitoring
function initializePerformanceMonitoring() {
  const loadTime = performance.now();
  
  window.addEventListener('load', () => {
    const totalLoadTime = performance.now() - loadTime;
    
    // Warn voor trage pagina's
    if (totalLoadTime > 3000) {
      console.warn('🐌 Page load time is slow (>3s)');
      showNotification('Pagina laadt traag. Check je internet verbinding.', 'warning');
    }
  });
  
  // Memory usage monitoring
  if ('memory' in performance) {
    setInterval(() => {
      const memory = performance.memory;
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
        console.warn('⚠️ High memory usage detected');
      }
    }, 30000); // Check elke 30 seconden
  }
}

// 🌐 Network Status
function initializeNetworkStatus() {
  if ('onLine' in navigator) {
    window.addEventListener('online', () => {
      showNotification('✅ Internet verbinding hersteld!', 'success');
    });
    
    window.addEventListener('offline', () => {
      showNotification('❌ Geen internet verbinding', 'error');
    });
  }
  
  // Connection quality monitoring
  if ('connection' in navigator) {
    const connection = navigator.connection;
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      showNotification('🐌 Trage internet verbinding gedetecteerd', 'warning');
    }
  }
}

// ⌨️ Global Keyboard Shortcuts
function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K - Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openQuickSearch(); // Nu direct naar enhanced search
    }
    
    // Ctrl/Cmd + / - Show shortcuts help
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      showKeyboardShortcuts();
    }
    
    // Ctrl/Cmd + Shift + C - Copy current URL
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      copyCurrentURL();
    }
    
    // Ctrl/Cmd + P - Enhanced print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      printPage();
    }
    
    // Alt + Home - Go to homepage
    if (e.altKey && e.key === 'Home') {
      e.preventDefault();
      window.location.href = '/index.html';
    }
  });
  
}

// 🖱️ Enhanced Context Menu
function initializeContextMenu() {
  // Disable right-click op images (optioneel)
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('contextmenu', (e) => {
      // Alleen disablen voor logo's en belangrijke images
      if (img.classList.contains('logo') || img.src.includes('logo')) {
        e.preventDefault();
        showNotification('🖼️ Image beveiligd', 'info');
      }
    });
  });
}

// 💾 Auto-save Form Data
function initializeAutoSave() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach((form, formIndex) => {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach((input, inputIndex) => {
      if (input.type !== 'password' && input.type !== 'submit') {
        const storageKey = `autosave_form${formIndex}_input${inputIndex}`;
        
        // Restore saved data
        const savedValue = localStorage.getItem(storageKey);
        if (savedValue && !input.value) {
          input.value = savedValue;
        }
        
        // Auto-save on input
        const saveData = debounce(() => {
          if (input.value.trim()) {
            localStorage.setItem(storageKey, input.value);
          }
        }, 1000);
        
        input.addEventListener('input', saveData);
        
        // Clear saved data on form submit
        form.addEventListener('submit', () => {
          localStorage.removeItem(storageKey);
        });
      }
    });
  });
}

// 📋 Copy URL Feature
function initializeCopyURL() {
  window.copyCurrentURL = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showNotification('📋 URL gekopieerd naar klembord!', 'success');
    } catch (err) {
      // Fallback voor oudere browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('📋 URL gekopieerd!', 'success');
    }
  };
}

// 🖨️ Enhanced Print Feature
function initializePrintFeature() {
  window.printPage = () => {
    // Add print-specific styles
    const printStyles = document.createElement('style');
    printStyles.media = 'print';
    printStyles.textContent = `
      @media print {
        .nav, .sideMenu, .menu-overlay, #scrollToTop, #scrollProgress {
          display: none !important;
        }
        
        body {
          background: white !important;
          color: black !important;
        }
        
        .coverImage {
          max-height: 200px !important;
          object-fit: cover !important;
        }
        
        @page {
          margin: 1in;
          size: A4;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    setTimeout(() => {
      window.print();
      showNotification('🖨️ Print dialog geopend', 'info');
    }, 100);
  };
}

// ⬅️ Enhanced Back Button
function initializeBackButton() {
  // Alleen tonen als er history is
  if (window.history.length > 1) {
    const backButton = document.createElement('button');
    backButton.innerHTML = '← Terug';
    backButton.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 2rem;
      padding: 0.5rem 1rem;
      background: rgba(136, 21, 56, 0.9);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      z-index: 998;
      font-size: 0.9rem;
      backdrop-filter: blur(10px);
      opacity: 0.8;
      transition: all 0.3s ease;
    `;
    
    backButton.addEventListener('click', () => {
      window.history.back();
    });
    
    backButton.addEventListener('mouseenter', () => {
      backButton.style.opacity = '1';
      backButton.style.transform = 'scale(1.05)';
    });
    
    backButton.addEventListener('mouseleave', () => {
      backButton.style.opacity = '0.8';
      backButton.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(backButton);
  }
}

// 💡 Tooltip System
function initializeTooltips() {
  document.querySelectorAll('[title]').forEach(element => {
    const originalTitle = element.title;
    element.removeAttribute('title'); // Prevent default tooltip
    
    const tooltip = document.createElement('div');
    tooltip.textContent = originalTitle;
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      max-width: 200px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(tooltip);
    
    element.addEventListener('mouseenter', (e) => {
      tooltip.style.opacity = '1';
    });
    
    element.addEventListener('mousemove', (e) => {
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY - 40}px`;
    });
    
    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

// 📢 Notification System
function initializeNotificationSystem() {
  const container = document.createElement('div');
  container.id = 'notification-container';
  container.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `;
  document.body.appendChild(container);
  
  window.showNotification = (message, type = 'info', duration = 4000) => {
    const notification = document.createElement('div');
    
    // EHB ROOD KLEUREN SCHEMA
    const colors = {
      info: 'linear-gradient(135deg, #881538, #A91B47)',      // EHB Rood
      success: 'linear-gradient(135deg, #10b981, #047857)',   // Groen
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)',   // Oranje
      error: 'linear-gradient(135deg, #881538, #B91B47)'      // Donkerder EHB Rood
    };
    
    notification.style.cssText = `
      background: ${colors[type]};
      color: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(136, 21, 56, 0.3);
      max-width: 300px;
      font-size: 0.9rem;
      cursor: pointer;
      transform: translateX(100%);
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    `;
    
    notification.textContent = message;
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, duration);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    });
  };
  
}

// 🚨 Error Handling
function initializeErrorHandling() {
  window.addEventListener('error', (e) => {
    console.error('🚨 Global error caught:', e.error);
    showNotification('Er is een fout opgetreden. Probeer de pagina te vernieuwen.', 'error');
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 Unhandled promise rejection:', e.reason);
    showNotification('Er is een netwerk fout opgetreden.', 'error');
  });
}

// ♿ Accessibility Tools
function initializeAccessibilityTools() {
  // Font size controls
  let fontSize = 100;
  
  window.adjustFontSize = (change) => {
    fontSize += change;
    fontSize = Math.max(80, Math.min(150, fontSize)); // Between 80% and 150%
    document.documentElement.style.fontSize = `${fontSize}%`;
    showNotification(`📝 Lettergrootte: ${fontSize}%`, 'info');
  };
  
  // High contrast toggle
  window.toggleHighContrast = () => {
    document.body.classList.toggle('high-contrast');
    const isActive = document.body.classList.contains('high-contrast');
    showNotification(`🎨 Hoog contrast: ${isActive ? 'aan' : 'uit'}`, 'info');
  };
  
  // Add high contrast styles
  const style = document.createElement('style');
  style.textContent = `
    .high-contrast {
      filter: contrast(200%) brightness(150%) !important;
    }
    
    .high-contrast img {
      filter: contrast(120%) brightness(90%) !important;
    }
  `;
  document.head.appendChild(style);
}

// 🛠️ Developer Tools (alleen localhost)
function initializeDeveloperTools() {
  
  // Show page info
  const pageInfo = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    connection: navigator.connection?.effectiveType || 'unknown'
  };
  
  console.table(pageInfo);
  
  // Add developer shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl + Shift + D - Toggle debug mode
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      document.body.classList.toggle('debug-mode');
      showNotification('🐛 Debug mode toggled', 'info');
    }
  });
  
  // Debug styles
  const debugStyle = document.createElement('style');
  debugStyle.textContent = `
    .debug-mode * {
      outline: 1px solid red !important;
    }
    
    .debug-mode *:hover {
      background: rgba(255, 0, 0, 0.1) !important;
    }
  `;
  document.head.appendChild(debugStyle);
}

// ===== 🌟 EXTRA QOL FEATURES FUNCTIONS =====

// 📚 Recent Pages Tracking
function initializeRecentPages() {
  const currentPage = {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    path: window.location.pathname
  };
  
  // Voeg huidige pagina toe aan recente pagina's
  let recentPages = JSON.parse(localStorage.getItem('ehb_recent_pages') || '[]');
  
  // Verwijder duplicaten
  recentPages = recentPages.filter(page => page.url !== currentPage.url);
  
  // Voeg nieuwe pagina toe aan begin
  recentPages.unshift(currentPage);
  
  // Bewaar alleen laatste 10 pagina's
  recentPages = recentPages.slice(0, 10);
  
  localStorage.setItem('ehb_recent_pages', JSON.stringify(recentPages));
  
  // Voeg recent pages dropdown toe aan menu indien gewenst
  addRecentPagesToMenu(recentPages);
}

function addRecentPagesToMenu(recentPages) {
  const sideMenu = document.getElementById('sideMenu');
  if (sideMenu && recentPages.length > 1) {
    const recentSection = document.createElement('div');
    recentSection.style.cssText = `
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    recentSection.innerHTML = `
      <h4 style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; margin-bottom: 0.5rem;">
        📚 Recent Bezocht
      </h4>
    `;
    
    // Toon laatste 5 bezochte pagina's (excluding current)
    recentPages.slice(1, 6).forEach(page => {
      const link = document.createElement('a');
      link.href = page.url;
      link.style.cssText = `
        display: block;
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        padding: 0.3rem 0;
        font-size: 0.8rem;
        transition: all 0.3s ease;
      `;
      
      const pageTitle = page.title.replace(' - EHB', '').substring(0, 30);
      link.innerHTML = `<i class="fas fa-history"></i> ${pageTitle}`;
      
      link.addEventListener('mouseenter', () => {
        link.style.color = 'white';
        link.style.transform = 'translateX(5px)';
      });
      
      link.addEventListener('mouseleave', () => {
        link.style.color = 'rgba(255, 255, 255, 0.9)';
        link.style.transform = 'translateX(0)';
      });
      
      recentSection.appendChild(link);
    });
    
    const menuContent = sideMenu.querySelector('.sideMenu-content');
    if (menuContent) {
      menuContent.appendChild(recentSection);
    }
  }
}

// 🔍 Enhanced Quick Search
function initializeQuickSearch() {
  // Create search overlay
  const searchOverlay = document.createElement('div');
  searchOverlay.id = 'quick-search-overlay';
  searchOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
  `;
  
  const searchBox = document.createElement('div');
  searchBox.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  `;
  
  searchBox.innerHTML = `
    <h3 style="margin: 0 0 1rem 0; color: #881538;">🔍 Zoeken</h3>
    <input type="text" id="quick-search-input" placeholder="Zoek naar pagina's, content, functies..." style="
      width: 100%;
      padding: 1rem;
      border: 2px solid #e5e5e5;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
    ">
    <div id="search-results" style="margin-top: 1rem; max-height: 300px; overflow-y: auto;"></div>
    <div style="margin-top: 1rem; font-size: 0.8rem; color: #666;">
      💡 Tip: Gebruik Ctrl+K om te zoeken, Escape om te sluiten
    </div>
  `;
  
  searchOverlay.appendChild(searchBox);
  document.body.appendChild(searchOverlay);
  
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) {
      closeQuickSearch();
    }
  });
  
  // Search functionality
  const searchInput = searchBox.querySelector('#quick-search-input');
  const resultsDiv = searchBox.querySelector('#search-results');
  
  searchInput.addEventListener('input', (e) => {
    performQuickSearch(e.target.value, resultsDiv);
  });
  
  window.openQuickSearch = function() {
    searchOverlay.style.display = 'flex';
    searchInput.focus();
    searchInput.value = '';
    resultsDiv.innerHTML = '';
  };
  
  window.closeQuickSearch = function() {
    searchOverlay.style.display = 'none';
  };
  
  // Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.style.display === 'flex') {
      closeQuickSearch();
    }
  });
}

function performQuickSearch(query, resultsDiv) {
  if (!query.trim()) {
    resultsDiv.innerHTML = '';
    return;
  }
  
  const searchablePages = [
    { title: '🏠 Homepage', url: '/index.html', description: 'Hoofdpagina van CareerLaunch' },
    { title: '👤 Account Bedrijf', url: '/account-bedrijf.html', description: 'Bedrijf account gegevens' },
    { title: '🎓 Account Student', url: '/account-student.html', description: 'Student account gegevens' },
    { title: '🏫 Account Organisator', url: '/account-organisator.html', description: 'Organisator account gegevens' },
    { title: '📅 Programma', url: '/programma.html', description: 'Event programma en schema' },
    { title: '🚀 Projecten', url: '/projecten.html', description: 'Student projecten overzicht' },
    { title: 'ℹ️ Informatie', url: '/info.html', description: 'Algemene informatie' }
  ];
  
  const results = searchablePages.filter(page => 
    page.title.toLowerCase().includes(query.toLowerCase()) ||
    page.description.toLowerCase().includes(query.toLowerCase())
  );
  
  if (results.length === 0) {
    resultsDiv.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem;">Geen resultaten gevonden</p>';
    return;
  }
  
  resultsDiv.innerHTML = results.map(result => `
    <a href="${result.url}" style="
      display: block;
      padding: 1rem;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
    " onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#881538'" 
       onmouseout="this.style.background=''; this.style.borderColor='#e5e5e5'">
      <div style="font-weight: 600; color: #881538;">${result.title}</div>
      <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">${result.description}</div>
    </a>
  `).join('');
}

// 📱 Mobile Gestures
function initializeMobileGestures() {
  if ('ontouchstart' in window) {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Swipe right to open menu (alleen als er geen horizontale scroll is)
      if (deltaX > 100 && Math.abs(deltaY) < 50 && touchStartX < 50) {
        const sideMenu = document.getElementById('sideMenu');
        if (sideMenu && !sideMenu.classList.contains('open')) {
          // Trigger menu open
          const burgerToggle = document.getElementById('burgerToggle');
          if (burgerToggle) {
            burgerToggle.click();
          }
        }
      }
      
      // Swipe left to close menu
      if (deltaX < -100 && Math.abs(deltaY) < 50) {
        const sideMenu = document.getElementById('sideMenu');
        if (sideMenu && sideMenu.classList.contains('open')) {
          const closeBtn = sideMenu.querySelector('.sideMenu-closeBtn');
          if (closeBtn) {
            closeBtn.click();
          }
        }
      }
    }, { passive: true });
  }
}

// Helper function - Keyboard shortcuts help
function showKeyboardShortcuts() {
  const shortcuts = `
🌟 KEYBOARD SHORTCUTS:
⌨️ Ctrl/Cmd + K - Open zoek overlay
⌨️ Ctrl/Cmd + / - Toon deze help
⌨️ Ctrl/Cmd + Shift + C - Kopieer URL
⌨️ Ctrl/Cmd + P - Print pagina
⌨️ Alt + Home - Ga naar homepage
⌨️ Spatie - Scroll naar beneden
⌨️ Shift + Spatie - Scroll naar boven
⌨️ Escape - Sluit menu/modals/search
  `;
  
  alert(shortcuts); // Je kunt dit later vervangen door een mooiere modal
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

// Verbeter formulieren
function enhanceForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
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

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export functions
export function showNotification(message, type = 'info') {
  if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
  }
}

export function isMenuOpen() {
  const sideMenu = document.getElementById('sideMenu');
  return sideMenu ? sideMenu.classList.contains('open') : false;
}

export function closeMenuProgrammatically() {
  const sideMenu = document.getElementById('sideMenu');
  const body = document.body;
  
  if (sideMenu && sideMenu.classList.contains('open')) {
    sideMenu.classList.remove('open');
    
    body.classList.remove('menu-open');
    body.style.overflow = '';
    body.style.paddingRight = '';
    
    const overlay = document.querySelector('.menu-overlay');
    if (overlay) {
      overlay.classList.remove('show');
    }
    
  }
}

export function forceScrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}