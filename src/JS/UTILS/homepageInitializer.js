// src/JS/UTILS/homepageInitializer.js - Enhanced Homepage Features

/**
 * 🏠 Homepage Initializer
 * Handles role-specific content loading and live data updates
 * Works with Enhanced Role Manager
 */

class HomepageInitializer {
    constructor() {
        this.currentUser = null;
        this.dashboardData = null;
        this.autoRefreshInterval = null;
        this.init();
    }

    async init() {
        console.log('🏠 Homepage Initializer starting...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupHomepage());
        } else {
            this.setupHomepage();
        }
    }

    async setupHomepage() {
        try {
            console.log('🔄 Setting up enhanced homepage features...');
            
            // Wait for role manager to be available
            await this.waitForRoleManager();
            
            // Get current user
            this.currentUser = window.roleManager.getCurrentUser();
            
            if (!this.currentUser || !this.currentUser.isLoggedIn) {
                console.log('👤 Guest user detected, loading basic features');
                this.setupGuestFeatures();
                return;
            }
            
            console.log(`✅ Logged in user detected: ${this.currentUser.userType}`);
            
            // Load role-specific features
            await this.loadRoleSpecificData();
            this.updateLiveStats();
            this.setupAutoRefresh();
            
            console.log('✅ Enhanced homepage features loaded successfully');
            
        } catch (error) {
            console.error('❌ Error setting up homepage:', error);
            this.setupFallbackFeatures();
        }
    }

    async waitForRoleManager(maxWait = 5000) {
        const startTime = Date.now();
        
        while (!window.roleManager && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!window.roleManager) {
            throw new Error('Role Manager not available after timeout');
        }
        
        console.log('✅ Role Manager available');
    }

    async loadRoleSpecificData() {
        const userType = this.currentUser.userType;
        const token = localStorage.getItem('authToken');
        
        if (!token) return;
        
        try {
            let endpoint;
            switch(userType) {
                case 'student':
                    endpoint = '/api/student/dashboard-data';
                    break;
                case 'bedrijf':
                    endpoint = '/api/bedrijf/dashboard-data';
                    break;
                case 'organisator':
                    endpoint = '/api/admin/dashboard-stats';
                    break;
                default:
                    return;
            }
            
            const response = await fetch(endpoint, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.dashboardData = data.data;
                this.updatePageWithRoleData(this.dashboardData, userType);
            } else {
                console.warn(`⚠️ Failed to load ${userType} dashboard data:`, response.status);
            }
        } catch (error) {
            console.error('Failed to load role-specific data:', error);
        }
    }

    updatePageWithRoleData(data, userType) {
        // Update welcome message
        const welcomeElements = document.querySelectorAll('.aboutTitle, .welcome-title, h1');
        welcomeElements.forEach(el => {
            if (data.welcomeMessage && el.textContent.includes('Welkom')) {
                el.textContent = data.welcomeMessage;
            }
        });
        
        // Role-specific content updates
        switch(userType) {
            case 'student':
                this.updateStudentContent(data);
                break;
            case 'bedrijf':
                this.updateBedrijfContent(data);
                break;
            case 'organisator':
                this.updateOrganisatorContent(data);
                break;
        }
    }

    updateStudentContent(data) {
        // Update project information if available
        if (data.projectTitle && data.projectTitle !== 'Nog geen project ingesteld') {
            this.addProjectInfoSection(data);
        }
        
        // Update study information
        if (data.opleiding) {
            this.addStudyInfoSection(data);
        }
    }

    updateBedrijfContent(data) {
        // Update company information
        if (data.sector) {
            this.addCompanyInfoSection(data);
        }
    }

    updateOrganisatorContent(data) {
        // Update admin dashboard
        if (data.students !== undefined) {
            this.addAdminDashboardSection(data);
        }
    }

    addProjectInfoSection(data) {
        // Check if project section already exists
        if (document.querySelector('.enhanced-project-info')) return;
        
        const projectSection = document.createElement('div');
        projectSection.className = 'enhanced-project-info';
        projectSection.innerHTML = `
            <div class="project-card">
                <h3>📋 ${data.projectTitle}</h3>
                <p><strong>Opleiding:</strong> ${data.opleiding}</p>
                ${data.opleidingsrichting ? `<p><strong>Richting:</strong> ${data.opleidingsrichting}</p>` : ''}
                <p class="project-description">${data.projectDescription || 'Nog geen beschrijving toegevoegd.'}</p>
                <a href="/mijnProject" class="btn-primary">Project Beheren</a>
            </div>
        `;
        
        this.insertAfterElement(projectSection, '.welcome-section, .aboutTitle');
    }

    addCompanyInfoSection(data) {
        if (document.querySelector('.enhanced-company-info')) return;
        
        const companySection = document.createElement('div');
        companySection.className = 'enhanced-company-info';
        companySection.innerHTML = `
            <div class="company-card">
                <h3>🏢 Bedrijf Informatie</h3>
                <p><strong>Sector:</strong> ${data.sector}</p>
                ${data.tafelNr ? `<p><strong>Tafel Nr:</strong> ${data.tafelNr}</p>` : ''}
                <p>${data.beschrijving || 'Nog geen beschrijving toegevoegd.'}</p>
                <a href="/alleStudenten" class="btn-primary">Bekijk Studenten</a>
            </div>
        `;
        
        this.insertAfterElement(companySection, '.welcome-section, .aboutTitle');
    }

    addAdminDashboardSection(data) {
        if (document.querySelector('.enhanced-admin-dashboard')) return;
        
        const adminSection = document.createElement('div');
        adminSection.className = 'enhanced-admin-dashboard';
        adminSection.innerHTML = `
            <div class="admin-stats-card">
                <h3>📊 Admin Dashboard</h3>
                <div class="admin-stats-grid">
                    <div class="admin-stat">
                        <span class="admin-number">${data.students || 0}</span>
                        <span class="admin-label">Studenten</span>
                    </div>
                    <div class="admin-stat">
                        <span class="admin-number">${data.companies || 0}</span>
                        <span class="admin-label">Bedrijven</span>
                    </div>
                    <div class="admin-stat">
                        <span class="admin-number">${data.meetings || 0}</span>
                        <span class="admin-label">Gesprekken</span>
                    </div>
                </div>
                <a href="/adminPanel" class="btn-primary">Admin Panel</a>
            </div>
        `;
        
        this.insertAfterElement(adminSection, '.welcome-section, .aboutTitle');
    }

    updateLiveStats() {
        if (!window.getLiveStats) return;
        
        const stats = window.getLiveStats();
        console.log('📊 Updating live stats:', stats);
        
        // Update any elements with data-count attributes
        document.querySelectorAll('[data-count]').forEach(el => {
            const countType = el.getAttribute('data-count');
            let value = 0;
            
            switch(countType) {
                case 'students':
                case 'studenten':
                    value = stats.totalStudents || 0;
                    break;
                case 'companies':
                case 'bedrijven':
                    value = stats.totalCompanies || 0;
                    break;
                case 'projects':
                case 'projecten':
                    value = stats.totalProjects || 0;
                    break;
                case 'reservations':
                case 'afspraken':
                    value = stats.totalReservations || 0;
                    break;
            }
            
            // Animate number change if current value is different
            const currentValue = parseInt(el.textContent) || 0;
            if (currentValue !== value) {
                this.animateNumber(el, currentValue, value);
            }
        });
    }

    animateNumber(element, start, end) {
        const duration = 1000;
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    setupGuestFeatures() {
        console.log('🎯 Setting up guest features');
        
        // Update live stats for guests
        this.updateLiveStats();
        
        // Basic welcome message
        const welcomeElements = document.querySelectorAll('.aboutTitle');
        welcomeElements.forEach(el => {
            if (!el.textContent.includes('Welkom bij')) {
                el.textContent = 'Welkom bij CareerLaunch 2025';
            }
        });
    }

    setupFallbackFeatures() {
        console.log('⚠️ Setting up fallback features');
        
        // Basic functionality without enhanced features
        const welcomeElements = document.querySelectorAll('.aboutTitle');
        welcomeElements.forEach(el => {
            el.textContent = 'CareerLaunch 2025';
        });
    }

    setupAutoRefresh() {
        // Refresh data every 3 minutes
        this.autoRefreshInterval = setInterval(async () => {
            console.log('🔄 Auto-refreshing homepage data...');
            
            try {
                // Refresh role-specific data
                await this.loadRoleSpecificData();
                
                // Refresh live stats
                this.updateLiveStats();
                
            } catch (error) {
                console.warn('Failed to auto-refresh:', error);
            }
        }, 3 * 60 * 1000);
    }

    // Utility methods
    insertAfterElement(newElement, selector) {
        const targetElement = document.querySelector(selector);
        if (targetElement) {
            targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
        } else {
            // Fallback: append to main content area
            const mainContent = document.querySelector('main, .main-content, body');
            if (mainContent) {
                mainContent.appendChild(newElement);
            }
        }
    }

    // Public API
    async refresh() {
        console.log('🔄 Manual refresh requested');
        await this.loadRoleSpecificData();
        this.updateLiveStats();
    }

    getCurrentData() {
        return {
            currentUser: this.currentUser,
            dashboardData: this.dashboardData
        };
    }

    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        console.log('🧹 Homepage Initializer destroyed');
    }
}

// Enhanced CSS for the new elements
const enhancedStyles = `
<style>
.enhanced-project-info,
.enhanced-company-info,
.enhanced-admin-dashboard {
    margin: 20px 0;
    animation: fadeInUp 0.5s ease-out;
}

.project-card,
.company-card,
.admin-stats-card {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.project-card h3,
.company-card h3,
.admin-stats-card h3 {
    margin-bottom: 15px;
    color: #333;
}

.project-description {
    color: #666;
    line-height: 1.6;
    margin: 15px 0;
}

.admin-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.admin-stat {
    text-align: center;
}

.admin-number {
    display: block;
    font-size: 1.8em;
    font-weight: bold;
    color: #007bff;
}

.admin-label {
    font-size: 0.9em;
    color: #666;
}

.btn-primary {
    display: inline-block;
    background: #007bff;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    background: #0056b3;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .admin-stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }
    
    .project-card,
    .company-card,
    .admin-stats-card {
        padding: 20px;
    }
}
</style>
`;

// Add enhanced styles to the page
function addEnhancedStyles() {
    if (!document.querySelector('#homepage-enhanced-styles')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'homepage-enhanced-styles';
        styleElement.innerHTML = enhancedStyles;
        document.head.appendChild(styleElement);
    }
}

// Initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
    // Add enhanced styles
    addEnhancedStyles();
    
    // Initialize homepage features
    window.homepageInitializer = new HomepageInitializer();
});

// Global functions for debugging
window.refreshHomepage = () => {
    if (window.homepageInitializer) {
        window.homepageInitializer.refresh();
    }
};

window.getHomepageData = () => {
    if (window.homepageInitializer) {
        return window.homepageInitializer.getCurrentData();
    }
    return null;
};

console.log('✅ Homepage Initializer script loaded');