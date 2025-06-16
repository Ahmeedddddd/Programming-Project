// src/JS/index.js

// ===== DATA FETCHING CLASS =====
class HomepageDataFetcher {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3301/api';
        this.isLoading = false;
        
        console.log('🚀 HomepageDataFetcher initialized');
    }

    // Show loading state
    showLoading() {
        this.isLoading = true;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Generic API fetch function
    async fetchAPI(endpoint, options = {}) {
        try {
            const url = `${this.API_BASE_URL}${endpoint}`;
            console.log(`📡 Fetching: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Successfully fetched ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`❌ Error fetching ${endpoint}:`, error);
            throw error;
        }
    }

    // Fetch all statistics (counts)
    async fetchStats() {
        try {
            const stats = await this.fetchAPI('/stats');
            this.updateCounts(stats);
            return stats;
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Set default counts if API fails
            this.updateCounts({
                studenten: 0,
                bedrijven: 0,
                afspraken: 0
            });
        }
    }

    // Fetch companies data
    async fetchCompanies() {
        try {
            const companies = await this.fetchAPI('/bedrijven');
            this.updateCompaniesSection(companies);
            return companies;
        } catch (error) {
            console.error('Failed to fetch companies:', error);
            this.showError('bedrijven', 'Kon bedrijven niet laden');
            return [];
        }
    }

    // Fetch students data
    async fetchStudents() {
        try {
            const students = await this.fetchAPI('/studenten');
            this.updateStudentsSection(students);
            return students;
        } catch (error) {
            console.error('Failed to fetch students:', error);
            this.showError('studenten', 'Kon studenten niet laden');
            return [];
        }
    }

    // Update all counters on the page
    updateCounts(stats) {
        console.log('📊 Updating counts:', stats);
        
        // Update company count
        const bedrijvenCounts = document.querySelectorAll('[data-count]');
        bedrijvenCounts.forEach(element => {
            const parentTitle = element.closest('.section-title');
            if (parentTitle && parentTitle.textContent.includes('Bedrijven')) {
                this.animateCounter(element, stats.bedrijven || 0);
            } else if (parentTitle && parentTitle.textContent.includes('Studenten')) {
                this.animateCounter(element, stats.studenten || 0);
            }
        });

        // Update projects count manually (static for now since no API endpoint)
        const projectsTitle = document.querySelector('.projects-section .section-title span[data-count]');
        if (projectsTitle) {
            this.animateCounter(projectsTitle, 4); // Static count for existing projects
        }
    }

    // Animate counter from current value to target
    animateCounter(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 20);
        
        if (currentValue < targetValue) {
            element.textContent = Math.min(currentValue + increment, targetValue);
            setTimeout(() => this.animateCounter(element, targetValue), 50);
        } else {
            element.textContent = targetValue;
        }
    }

    // Update companies section with real data
    updateCompaniesSection(companies) {
        console.log('🏢 Updating companies section with', companies.length, 'companies');
        
        const companiesGrid = document.querySelector('.main-grid .section-container:first-child .card-grid');
        if (!companiesGrid) {
            console.warn('Companies grid not found');
            return;
        }

        // Clear existing cards
        companiesGrid.innerHTML = '';

        // Show first 4 companies as preview
        const previewCompanies = companies.slice(0, 4);
        
        previewCompanies.forEach(company => {
            const companyCard = this.createCompanyCard(company);
            companiesGrid.appendChild(companyCard);
        });

        // If no companies, show placeholder
        if (companies.length === 0) {
            companiesGrid.innerHTML = '<p class="no-data">Geen bedrijven gevonden</p>';
        }
    }

    // Create company card HTML
    createCompanyCard(company) {
        const card = document.createElement('a');
        card.href = `/resultaatBedrijf?id=${company.id}`;
        card.className = 'preview-card';
        
        // Truncate description if too long
        const description = company.beschrijving || company.omschrijving || 'Geen beschrijving beschikbaar';
        const truncatedDesc = description.length > 150 ? 
            description.substring(0, 150) + '...' : description;
        
        card.innerHTML = `
            <h3 class="card-title">${company.naam || company.bedrijfsnaam || 'Onbekend bedrijf'}</h3>
            <p class="card-description">${truncatedDesc}</p>
        `;
        
        return card;
    }

    // Update students section with real data
    updateStudentsSection(students) {
        console.log('🎓 Updating students section with', students.length, 'students');
        
        const studentsGrid = document.querySelector('.main-grid .section-container:last-child .card-grid');
        if (!studentsGrid) {
            console.warn('Students grid not found');
            return;
        }

        // Clear existing cards
        studentsGrid.innerHTML = '';

        // Show first 4 students as preview
        const previewStudents = students.slice(0, 4);
        
        previewStudents.forEach(student => {
            const studentCard = this.createStudentCard(student);
            studentsGrid.appendChild(studentCard);
        });

        // If no students, show placeholder
        if (students.length === 0) {
            studentsGrid.innerHTML = '<p class="no-data">Geen studenten gevonden</p>';
        }
    }

    // Create student card HTML
    createStudentCard(student) {
        const card = document.createElement('a');
        card.href = `/zoekbalkStudenten?id=${student.id}`;
        card.className = 'preview-card';
        
        // Combine name from different possible fields
        const naam = student.naam || 
                    `${student.voornaam || ''} ${student.achternaam || ''}`.trim() ||
                    student.full_name || 
                    'Onbekende student';
        
        // Get description/bio
        const description = student.beschrijving || 
                          student.bio || 
                          student.omschrijving ||
                          'Nog geen beschrijving toegevoegd';
        
        const truncatedDesc = description.length > 150 ? 
            description.substring(0, 150) + '...' : description;
        
        card.innerHTML = `
            <h3 class="card-title">${naam}</h3>
            <p class="card-description">${truncatedDesc}</p>
        `;
        
        return card;
    }

    // Show error message
    showError(section, message) {
        console.error(`Error in ${section}:`, message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
            text-align: center;
        `;
        errorDiv.textContent = message;
        
        // Find the appropriate section and show error
        const sectionElement = document.querySelector(`.${section}-section, .section-container`);
        if (sectionElement) {
            sectionElement.appendChild(errorDiv);
        }
    }

    // Main function to load all homepage data
    async loadHomepageData() {
        console.log('🎯 Loading homepage data...');
        this.showLoading();

        try {
            // Fetch all data in parallel for better performance
            const [stats, companies, students] = await Promise.allSettled([
                this.fetchStats(),
                this.fetchCompanies(),
                this.fetchStudents()
            ]);

            console.log('✅ Homepage data loading completed');
            
            // Show success message in console
            console.log('📊 Loaded data summary:', {
                stats: stats.status === 'fulfilled' ? stats.value : 'failed',
                companies: companies.status === 'fulfilled' ? `${companies.value.length} companies` : 'failed',
                students: students.status === 'fulfilled' ? `${students.value.length} students` : 'failed'
            });

        } catch (error) {
            console.error('❌ Failed to load homepage data:', error);
            this.showError('general', 'Er is een fout opgetreden bij het laden van de gegevens');
        } finally {
            this.hideLoading();
        }
    }
}

// ===== INITIALIZATION =====
let dataFetcher;

// Main initialization function
function initIndexAnimations() {
  console.log('🎯 Initializing index page...');
  
  // Initialize data fetcher
  dataFetcher = new HomepageDataFetcher();
  
  // ===== LOAD DATA FIRST =====
  loadHomepageData();
  
  // ===== SCROLL TO TOP BUTTON =====
  createScrollToTopButton();
  
  // ===== DATA COUNT ANIMATIONS =====
  initializeDataCounters();
  
  // ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
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
  initializeOptimizedHoverEffects();
}

// ===== DATA LOADING FUNCTIONS =====
async function loadHomepageData() {
  console.log('📡 Starting data load...');
  
  try {
    await dataFetcher.loadHomepageData();
    console.log('✅ Data loaded successfully');
    
    // Trigger counter animations after data is loaded
    setTimeout(() => {
      initializeDataCounters();
    }, 500);
    
  } catch (error) {
    console.error('❌ Failed to load homepage data:', error);
  }
}

// ===== SCROLL TO TOP BUTTON =====
function createScrollToTopButton() {
  const scrollButton = document.createElement('button');
  scrollButton.innerHTML = '⬆️';
  scrollButton.id = 'scrollToTopBtn';
  scrollButton.title = 'Ga naar boven';
  scrollButton.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #cd4e4e, #a53333);
    color: white;
    border: none;
    border-radius: 50%;
    width: 55px;
    height: 55px;
    font-size: 18px;
    cursor: pointer;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(205, 78, 78, 0.3);
  `;

  scrollButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  document.body.appendChild(scrollButton);

  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollButton.style.opacity = '1';
      scrollButton.style.visibility = 'visible';
      scrollButton.style.transform = 'scale(1)';
    } else {
      scrollButton.style.opacity = '0';
      scrollButton.style.visibility = 'hidden';
      scrollButton.style.transform = 'scale(0.8)';
    }
  });
}

// ===== DATA COUNTERS =====
function initializeDataCounters() {
  const counters = document.querySelectorAll('[data-count]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute('data-count')) || parseInt(counter.textContent) || 0;
        animateCounter(counter, 0, target);
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.7 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, start, end) {
  const duration = 2000;
  const startTime = performance.now();
  
  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const current = Math.floor(start + (end - start) * easeOutQuart(progress));
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }
  
  requestAnimationFrame(updateCounter);
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

// ===== RIPPLE EFFECTS =====
function initializeRippleEffects() {
  const buttons = document.querySelectorAll('.btn, .section-btn, .section-btn1, .cta-btn, .main-cta-btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      createRipple(e, this);
    });
  });
}

function createRipple(event, element) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple 0.6s linear;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    pointer-events: none;
  `;
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Add ripple animation CSS
const rippleCSS = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;

if (!document.querySelector('#ripple-styles')) {
  const style = document.createElement('style');
  style.id = 'ripple-styles';
  style.textContent = rippleCSS;
  document.head.appendChild(style);
}

// ===== QUALITY OF LIFE FEATURES =====
function initializeQualityOfLife() {
  // Image lazy loading
  const images = document.querySelectorAll('img[src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => {
    if (img.dataset.src) {
      imageObserver.observe(img);
    }
  });

  // Form improvements
  enhanceFormInputs();
  
  // Link prefetching for faster navigation
  prefetchImportantLinks();
}

function enhanceFormInputs() {
  const inputs = document.querySelectorAll('input, textarea');
  
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
      if (this.value) {
        this.parentElement.classList.add('has-value');
      } else {
        this.parentElement.classList.remove('has-value');
      }
    });
  });
}

function prefetchImportantLinks() {
  const importantLinks = document.querySelectorAll('a[href^="/alleBedrijven"], a[href^="/alleStudenten"], a[href^="/alleProjecten"]');
  
  importantLinks.forEach(link => {
    link.addEventListener('mouseenter', function() {
      const linkElement = document.createElement('link');
      linkElement.rel = 'prefetch';
      linkElement.href = this.href;
      document.head.appendChild(linkElement);
    }, { once: true });
  });
}

// ===== OPTIMIZED HOVER EFFECTS =====
function initializeOptimizedHoverEffects() {
  const cards = document.querySelectorAll('.preview-card, .project-card, .section-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      this.style.transform = 'translateY(-5px) scale(1.02)';
      this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
    });
  });
}

// ===== INITIALIZATION TRIGGERS =====

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIndexAnimations);
} else {
  initIndexAnimations();
}

// Global refresh function for debugging
window.refreshHomepageData = () => {
  if (dataFetcher) {
    dataFetcher.loadHomepageData();
  }
};

console.log('✅ Enhanced index.js loaded with data fetching capabilities');