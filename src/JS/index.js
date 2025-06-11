// index.js - Snelle en responsieve animaties voor index pagina

// Wacht tot DOM geladen is voor index-specifieke functionaliteit
function initIndexAnimations() {
  
  // ===== SNELLE SCROLL ANIMATIES =====
  const observerOptions = {
    threshold: 0.15, // Verhoogd van 0.1 naar 0.15 - triggert eerder
    rootMargin: "0px 0px -20px 0px", // Verkleind van -50px naar -20px
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Selecteer ALLE animeerbare elementen
  const animatableElements = [
    ...document.querySelectorAll('.aboutSection'),        // Hero sectie - EERSTE
    ...document.querySelectorAll('.searchSection'),       // Zoekbalk
    ...document.querySelectorAll('.content-sections'),    // Content secties
    ...document.querySelectorAll('.section-card'),        // Bedrijven/studenten kaarten
    ...document.querySelectorAll('.section-container'),   // Sectie containers
    ...document.querySelectorAll('.preview-card'),        // Preview kaarten
    ...document.querySelectorAll('.project-card'),        // Project kaarten  
    ...document.querySelectorAll('.projects-section')     // Project sectie
  ];

  // SNELLERE animaties met kortere delays
  animatableElements.forEach((element, index) => {
    // Zet startwaarden
    element.style.opacity = "0";
    element.style.transform = "translateY(20px)"; // Verkleind van 30px naar 20px
    
    // SNELLERE timing: 0.4s duur, 0.03s delay tussen elementen
    element.style.transition = `opacity 0.4s ease ${index * 0.03}s, transform 0.4s ease ${index * 0.03}s`;
    
    // Start observatie
    observer.observe(element);
  });

  // ===== SNELLE BUTTON RIPPLE EFFECTEN =====
  
  // Voeg ripple animatie CSS toe (eenmalig)
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

  // Voeg ripple effect toe aan alle knoppen
  const buttonSelectors = [
    '.btn',
    '.section-btn',
    '.section-btn1', 
    '.cta-btn',
    '.main-cta-btn'
  ];

  buttonSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(btn => {
      // Voorkom dubbele event listeners
      if (btn.hasAttribute('data-ripple-initialized')) return;
      btn.setAttribute('data-ripple-initialized', 'true');

      btn.addEventListener("click", (e) => {
        // Voeg ripple effect toe
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
        
        // Ruim ripple op na animatie
        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.remove();
          }
        }, 600);
      });
    });
  });

  // ===== GEOPTIMALISEERDE HOVER EFFECTEN =====
  
  // Smooth hover effect voor kaarten met snellere response
  document.querySelectorAll('.section-container, .preview-card, .project-card, .section-card').forEach(card => {
    // Snellere CSS transitions voor hover
    card.style.transition = 'all 0.25s ease'; // Verkort van 0.3s naar 0.25s
    
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-6px) scale(1.01)'; // Subtielere scale
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });
  });

  // ===== INSTANT VISIBILITY FOR CRITICAL CONTENT =====
  
  // Zorg dat belangrijke content DIRECT zichtbaar is
  const criticalElements = document.querySelectorAll('.coverImage, .nav');
  criticalElements.forEach(element => {
    element.style.opacity = "1";
    element.style.transform = "translateY(0)";
  });

  // ===== GEOPTIMALISEERDE PARALLAX =====
  
  // Subtielere parallax effect voor hero image
  const coverImage = document.querySelector('.coverImage');
  if (coverImage) {
    let ticking = false;
    
    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.3; // Verkleind van 0.5 naar 0.3
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

  // ===== FAST SCROLL DETECTION =====
  
  // Detecteer snelle scroll en skip animatie delays
  let lastScrollTop = 0;
  let scrollSpeed = 0;
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    scrollSpeed = Math.abs(scrollTop - lastScrollTop);
    lastScrollTop = scrollTop;
    
    // Bij snelle scroll (>20px per frame), trigger alle animaties direct
    if (scrollSpeed > 20) {
      document.querySelectorAll('[style*="opacity: 0"]').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        }
      });
    }
  }, { passive: true });

  // ===== PRELOAD ANIMATIONS =====
  
  // Voor elementen die al in viewport zijn bij page load
  const viewportHeight = window.innerHeight;
  animatableElements.forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.top < viewportHeight && rect.bottom > 0) {
      // Element is al zichtbaar, animeer direct met korte delay
      setTimeout(() => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
      }, 100); // Zeer korte delay voor smooth appearance
    }
  });
}

// Performance optimalisatie: debounce met korte delay
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

// Geoptimaliseerde scroll handler met kortere debounce
const optimizedScrollHandler = debounce(() => {
  // Eventuele scroll-based animaties hier
}, 8); // Verkort van 16ms naar 8ms voor snellere response

// Start index animaties wanneer DOM geladen is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIndexAnimations);
} else {
  initIndexAnimations();
}

window.addEventListener('scroll', optimizedScrollHandler, { passive: true });