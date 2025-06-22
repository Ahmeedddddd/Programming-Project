// src/JS/RESULTS/PROJECTEN/zoekbalk-projecten.js
// Project Detail pagina functionaliteit

console.log('🚀 Project Detail script loading...');

class ProjectDetailManager {
    constructor() {
        this.projectId = null;
        this.projectData = null;
        this.studentData = null;
        this.API_BASE = window.location.origin; // FIXED: Use same port as frontend
        this.init();
    }

    async init() {
        try {
            console.log('🔍 Initializing ProjectDetailManager...');
            
            // Get project ID from URL
            this.projectId = this.getProjectIdFromUrl();
            
            if (!this.projectId) {
                console.error('❌ No project ID found in URL');
                this.showErrorState();
                return;
            }

            console.log(`🎯 Loading project with ID: ${this.projectId}`);
            
            // Load project data (with mock fallback)
            await this.loadProjectData();
            
            // Render project details
            this.renderProjectDetails();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ ProjectDetailManager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing ProjectDetailManager:', error);
            console.log('🚨 Showing error state due to initialization failure');
            this.showErrorState();
        }
    }

    getProjectIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        console.log('🔗 Project ID from URL:', id);
        return id;
    }

    async loadProjectData() {
        try {
            console.log('📡 Loading project data using project ID...');
            const response = await fetch(`${this.API_BASE}/api/projecten/${this.projectId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch project data: ${response.statusText}`);
            }
            const result = await response.json();
            if (!result.success || !result.data) {
                throw new Error('Project not found or invalid response.');
            }
            this.projectData = result.data;
            console.log('✅ Project data loaded:', this.projectData);
        } catch (error) {
            console.error('❌ Error in loadProjectData:', error);
            this.showErrorState();
            throw error;
        }
    }

    renderProjectDetails() {
        try {
            console.log('🎨 Rendering project details...');
            
            // Update page title
            document.title = `Project - ${this.projectData.titel}`;
            
            // Update header
            this.updateHeader();
            
            // Update description section
            this.updateDescriptionSection();
            
            // Update info section with team members
            this.updateInfoSection();
            
            // Add back button
            this.addBackButton();

            // Remove loading skeletons
            this.removeLoadingStates();
            
            console.log('✅ Project details rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering project details:', error);
            this.showErrorState();
        }
    }

    updateHeader() {
        const titleEl = document.querySelector('.project-title-text');
        const techEl = document.querySelector('.project-skills ul');

        if (titleEl) {
            titleEl.textContent = this.projectData.titel;
        }

        if (techEl && this.projectData.technologieen) {
            const technologies = this.projectData.technologieen.split(',').map(t => t.trim());
            techEl.innerHTML = technologies.map(tech => `<li>${tech}</li>`).join('');
        }
    }

    updateDescriptionSection() {
        const descriptionEl = document.querySelector('.description-section .project-description-text');
        if (descriptionEl) {
            descriptionEl.textContent = this.projectData.beschrijving || 'Geen beschrijving beschikbaar.';
        }
    }

    updateInfoSection() {
        const teamListEl = document.querySelector('.team-list ul');
        if (!teamListEl) return;

        const students = this.projectData.studenten || [];
        
        if (students.length === 0) {
            teamListEl.innerHTML = '<li>Geen teamleden gevonden voor dit project.</li>';
            return;
        }

        teamListEl.innerHTML = students.map(student => `
            <li class="team-member-card" data-student-id="${student.studentnummer}">
                <a href="/zoekbalk-studenten?id=${student.studentnummer}" style="text-decoration: none; color: inherit;">
                    <div class="member-info">
                        <strong class="member-name">
                            <i class="fas fa-user"></i> ${student.naam}
                        </strong>
                        <div class="member-detail">
                            <i class="fas fa-graduation-cap"></i> ${student.opleiding || 'Opleiding onbekend'}
                        </div>
                        <div class="member-detail">
                            <i class="fas fa-envelope"></i> ${student.email || 'Email onbekend'}
                        </div>
                    </div>
                    <div class="profile-link">
                        <span>Bekijk profiel <i class="fas fa-arrow-right"></i></span>
                    </div>
                </a>
            </li>
        `).join('');
    }

    addBackButton() {
        // Check if back button already exists
        if (document.querySelector('.back-button')) return;

        const backButton = document.createElement('a');
        backButton.href = '/alle-projecten';
        backButton.className = 'back-button';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Terug naar projecten';
        backButton.style.cssText = `
            position: fixed;
            top: 140px;
            left: 2rem;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #881538;
            color: #881538;
            padding: 0.75rem 1.5rem;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            z-index: 100;
            box-shadow: 0 4px 15px rgba(136, 21, 56, 0.2);
        `;

        backButton.addEventListener('mouseenter', () => {
            backButton.style.background = '#881538';
            backButton.style.color = 'white';
            backButton.style.transform = 'translateY(-2px)';
            backButton.style.boxShadow = '0 8px 25px rgba(136, 21, 56, 0.3)';
        });

        backButton.addEventListener('mouseleave', () => {
            backButton.style.background = 'rgba(255, 255, 255, 0.95)';
            backButton.style.color = '#881538';
            backButton.style.transform = 'translateY(0)';
            backButton.style.boxShadow = '0 4px 15px rgba(136, 21, 56, 0.2)';
        });

        document.body.appendChild(backButton);
    }

    removeLoadingStates() {
        // Remove skeleton loading elements
        const skeletons = document.querySelectorAll('.skeleton');
        skeletons.forEach(skeleton => skeleton.remove());

        // Remove loading content
        const loadingContent = document.querySelectorAll('.loading-content');
        loadingContent.forEach(content => content.remove());

        // Mark content as loaded
        document.body.classList.add('content-loaded');
    }

    setupEventListeners() {
        // Add any additional event listeners here
        console.log('🎯 Setting up event listeners...');
    }

    showErrorState() {
        // Hide main content
        const container = document.querySelector('.container');
        const layoutContainer = document.querySelector('.layout-container');
        
        if (layoutContainer) {
            layoutContainer.style.display = 'none';
        }

        // Show error state
        const errorState = document.getElementById('errorState');
        if (errorState) {
            errorState.style.display = 'block';
        } else {
            // Create error state if not exists
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-state';
            errorDiv.innerHTML = `
                <h3><i class="fas fa-exclamation-triangle"></i> Project niet gevonden</h3>
                <p>Het gevraagde project kon niet worden geladen. Dit kan komen door een verkeerde link of tijdelijke technische problemen.</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    <i class="fas fa-redo"></i> Probeer opnieuw
                </button>
                <br><br>
                <a href="/alle-projecten" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Terug naar alle projecten
                </a>
            `;
            
            if (container) {
                container.appendChild(errorDiv);
            } else {
                document.body.appendChild(errorDiv);
            }
        }
    }

    // Public API
    refresh() {
        console.log('🔄 Refreshing project details...');
        this.loadProjectData().then(() => {
            this.renderProjectDetails();
        }).catch(error => {
            console.error('❌ Error refreshing project details:', error);
            this.showErrorState();
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing ProjectDetailManager...');
    window.projectDetailManager = new ProjectDetailManager();
});

// Utility function for external use
window.refreshProjectDetails = () => {
    if (window.projectDetailManager) {
        window.projectDetailManager.refresh();
    }
};

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    console.log('🔄 Navigation detected, refreshing...');
    if (window.projectDetailManager) {
        window.projectDetailManager.refresh();
    }
});

console.log('✅ Project Detail script loaded successfully');