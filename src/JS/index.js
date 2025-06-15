// index.js - Enhanced met scroll-to-top, data count en quality of life features

// Wacht tot DOM geladen is voor index-specifieke functionaliteit
function initIndexAnimations() {
  
  // ===== SCROLL TO TOP BUTTON =====
  createScrollToTopButton();
  
  // ===== DATA COUNT ANIMATIONS =====
  initializeDataCounters();
  
  // ===== SNELLE SCROLL ANIMATIES =====
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -20px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Selecteer ALLE animeerbare elementen
  const animatableElements = [
    ...document.querySelectorAll('.aboutSection'),
    ...document.querySelectorAll('.searchSection'),
    ...document.querySelectorAll('.content-sections'),
    ...document.querySelectorAll('.section-card'),
    ...document.querySelectorAll('.section-container'),
    ...document.querySelectorAll('.preview-card'),
    ...document.querySelectorAll('.project-card'),
    ...document.querySelectorAll('.projects-section'),
    ...document.querySelectorAll('.main-grid')
  ];

  // SNELLERE animaties met kortere delays
  animatableElements.forEach((element, index) => {
    if (!element.classList.contains('no-animate')) {
      element.style.opacity = "0";
      element.style.transform = "translateY(20px)";
      element.style.transition = `opacity 0.4s ease ${index * 0.03}s, transform 0.4s ease ${index * 0.03}s`;
      observer.observe(element);
    }
  });

  // ===== BUTTON RIPPLE EFFECTEN =====
  initializeRippleEffects();
  
  // ===== QUALITY OF LIFE FEATURES =====
  initializeQualityOfLife();
  
  // ===== GEOPTIMALISEERDE HOVER EFFECTEN =====
  initializeHoverEffects();
  
  // ===== SCROLL PROGRESS INDICATOR =====
  createScrollProgressIndicator();
}

// ===== SCROLL TO TOP BUTTON =====
function createScrollToTopButton() {
  // Check of button al bestaat
  if (document.getElementById('scrollToTop')) return;
  
  const scrollButton = document.createElement('button');
  scrollButton.id = 'scrollToTop';
  scrollButton.innerHTML = '↑';
  scrollButton.setAttribute('aria-label', 'Scroll naar boven');
  scrollButton.title = 'Terug naar boven';
  
  // Styling
  Object.assign(scrollButton.style, {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #881538, #A91B47)',
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(136, 21, 56, 0.4)',
    zIndex: '999',
    opacity: '0',
    transform: 'translateY(100px)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  
  document.body.appendChild(scrollButton);
  
  // Show/hide logic
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    if (scrolled > 300) {
      scrollButton.style.opacity = '1';
      scrollButton.style.transform = 'translateY(0)';
    } else {
      scrollButton.style.opacity = '0';
      scrollButton.style.transform = 'translateY(100px)';
    }
    
    // Auto-hide after scroll stops
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (scrolled > 300) {
        scrollButton.style.opacity = '0.7';
      }
    }, 2000);
  }, { passive: true });
  
  // Hover effects
  scrollButton.addEventListener('mouseenter', () => {
    scrollButton.style.transform = 'translateY(0) scale(1.1)';
    scrollButton.style.boxShadow = '0 8px 25px rgba(136, 21, 56, 0.6)';
    scrollButton.style.opacity = '1';
  });
  
  scrollButton.addEventListener('mouseleave', () => {
    scrollButton.style.transform = 'translateY(0) scale(1)';
    scrollButton.style.boxShadow = '0 4px 15px rgba(136, 21, 56, 0.4)';
  });
  
  // Click to scroll
  scrollButton.addEventListener('click', () => {
    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Button animation feedback
    scrollButton.style.transform = 'translateY(0) scale(0.9)';
    setTimeout(() => {
      scrollButton.style.transform = 'translateY(0) scale(1)';
    }, 150);
  });
  
}

// ===== DATA COUNT ANIMATIONS =====
function initializeDataCounters() {
  const counters = document.querySelectorAll('[data-count]');
  
  const countUp = (element, target) => {
    const duration = 2000; // 2 seconds
    const start = 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);
      
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = target;
      }
    };
    
    requestAnimationFrame(animate);
  };
  
  // Intersection observer voor counters
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        entry.target.classList.add('counted');
        const target = parseInt(entry.target.getAttribute('data-count')) || 25;
        countUp(entry.target, target);
      }
    });
  }, { threshold: 0.3 });
  
  counters.forEach(counter => {
    counter.textContent = '0';
    counterObserver.observe(counter);
  });
  
}

// ===== RIPPLE EFFECTS =====
function initializeRippleEffects() {
  // Voeg ripple animatie CSS toe
  if (!document.getElementById('ripple-styles')) {
    const style = document.createElement("style");
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      .btn, .section-btn, .section-btn1, .cta-btn, .main-cta-btn {
        position: relative;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }

  const buttonSelectors = ['.btn', '.section-btn', '.section-btn1', '.cta-btn', '.main-cta-btn'];

  buttonSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(btn => {
      if (btn.hasAttribute('data-ripple-initialized')) return;
      btn.setAttribute('data-ripple-initialized', 'true');

      btn.addEventListener("click", (e) => {
        const ripple = document.createElement("span");
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
       
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
          z-index: 0;
        `;
       
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  });
}

// ===== QUALITY OF LIFE FEATURES =====
function initializeQualityOfLife() {
  // 1. Smooth scrolling voor de hele pagina
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // 2. Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('*').forEach(el => {
      el.style.transition = 'none !important';
      el.style.animation = 'none !important';
    });
  }
  
  // 3. Keyboard navigation improvements
  document.addEventListener('keydown', (e) => {
    // Space bar scrolling
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      window.scrollBy(0, e.shiftKey ? -window.innerHeight * 0.8 : window.innerHeight * 0.8);
    }
    
    // Arrow key scrolling
    if (e.code === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      window.scrollBy(0, 100);
    }
    if (e.code === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      window.scrollBy(0, -100);
    }
  });
  
  // 4. Better focus states
  const style = document.createElement('style');
  style.textContent = `
    *:focus-visible {
      outline: 2px solid #881538 !important;
      outline-offset: 2px !important;
      border-radius: 4px !important;
    }
    
    .btn:focus-visible,
    .section-btn:focus-visible,
    .section-btn1:focus-visible,
    .cta-btn:focus-visible {
      outline: 3px solid #fff !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 5px rgba(136, 21, 56, 0.5) !important;
    }
  `;
  document.head.appendChild(style);
  
  // 5. Loading states voor buttons
  document.querySelectorAll('.btn, .section-btn, .section-btn1, .cta-btn, .main-cta-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.href && !btn.href.startsWith('#')) {
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';
        if (!btn.innerHTML.includes('⏳')) {
  btn.innerHTML += ' <span style="margin-left: 8px;">⏳</span>';
}
        
        setTimeout(() => {
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        }, 2000);
      }
    });
  });
  
  // 6. Image lazy loading feedback
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => {
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    });
    
    img.addEventListener('error', () => {
      img.style.opacity = '0.5';
      img.alt = img.alt + ' (Failed to load)';
    });
  });
  
}

// ===== HOVER EFFECTS =====
function initializeHoverEffects() {
  document.querySelectorAll('.section-container, .preview-card, .project-card, .section-card').forEach(card => {
    card.style.transition = 'all 0.25s ease';
    
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-6px) scale(1.01)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });
  });
  
  // Critical elements direct zichtbaar
  document.querySelectorAll('.coverImage, .nav').forEach(element => {
    element.style.opacity = "1";
    element.style.transform = "translateY(0)";
    element.classList.add('no-animate');
  });
}

// ===== SCROLL PROGRESS INDICATOR =====
function createScrollProgressIndicator() {
  if (document.getElementById('scrollProgress')) return;
  
  const progressBar = document.createElement('div');
  progressBar.id = 'scrollProgress';
  
  Object.assign(progressBar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0%',
    height: '3px',
    background: 'linear-gradient(90deg, #881538, #A91B47)',
    zIndex: '9999',
    transition: 'width 0.1s ease'
  });
  
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrolled / maxScroll) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
  }, { passive: true });
  
}

// ===== PARALLAX OPTIMIZATION =====
function initializeParallax() {
  const coverImage = document.querySelector('.coverImage');
  if (coverImage) {
    let ticking = false;
    
    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.3;
      coverImage.style.transform = `translateY(${parallax}px)`;
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }
}

// ===== PERFORMANCE OPTIMIZATION =====
function optimizePerformance() {
  // Preload critical images
  const criticalImages = ['/images/image.png', '/images/careerlaunch.jpg'];
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
  
  // Intersection observer cleanup
  const cleanupObservers = () => {
    document.querySelectorAll('.animate-in').forEach(el => {
      if (el.observer) {
        el.observer.unobserve(el);
      }
    });
  };
  
  window.addEventListener('beforeunload', cleanupObservers);
  
}

// Performance optimalisatie: debounce
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

// Start alle functies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initIndexAnimations();
    initializeParallax();
    optimizePerformance();
  });
} else {
  initIndexAnimations();
  initializeParallax();
  optimizePerformance();
}

// Export voor gebruik in andere bestanden
window.IndexFeatures = {
  createScrollToTopButton,
  initializeDataCounters,
  forceScrollToTop: () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};