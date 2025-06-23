// src/JS/RESULTS/PROJECTEN/zoekbalk-projecten.js
// Project Detail pagina functionaliteit - Herstelde versie gebaseerd op de feedback van de gebruiker.

console.log('🚀 Project Detail script loading...');

class ProjectDetailManager {
    constructor() {
        this.projectId = null;
        this.projectData = null;
        this.API_BASE = window.location.origin;
    }

    async init() {
        try {
            console.log('🔍 Initializing ProjectDetailManager...');
            
            this.projectId = this.getProjectIdFromUrl();
            
            if (!this.projectId) {
                console.error('❌ No project ID found in URL');
                this.showErrorState();
                return;
            }

            console.log(`🎯 Loading project with ID: ${this.projectId}`);
            
            await this.loadProjectData();
            
            this.renderProjectDetails();
            
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
            console.log(`📡 Loading project data for ID ${this.projectId} from project endpoint...`);
            
            // GEWIJZIGD: Gebruik de project endpoint in plaats van student endpoint
            const response = await fetch(`${this.API_BASE}/api/projecten/${this.projectId}`);
            
            console.log(`📡 [DEBUG] Response status: ${response.status}`);
            console.log(`📡 [DEBUG] Response ok: ${response.ok}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`📡 [DEBUG] Response error text:`, errorText);
                throw new Error(`Failed to fetch project data: ${response.statusText} (status: ${response.status})`);
            }
            
            const result = await response.json();
            console.log(`📡 [DEBUG] Raw API response:`, result);
            
            if (!result.success || !result.data) {
                console.error(`📡 [DEBUG] API response indicates failure:`, result);
                throw new Error('Project not found or invalid API response.');
            }
            
            this.projectData = result.data;
            console.log('✅ Project data loaded successfully:', this.projectData);
            console.log('📊 [DEBUG] Project data structure analysis:', {
                hasData: !!this.projectData,
                isProject: this.projectData?.isProject,
                titel: this.projectData?.titel,
                beschrijving: this.projectData?.beschrijving,
                tafelNr: this.projectData?.tafelNr,
                hasTeam: !!this.projectData?.team,
                teamSize: this.projectData?.team?.length || 0,
                hasTechnologies: !!this.projectData?.technologieen,
                technologies: this.projectData?.technologieen
            });

        } catch (error) {
            console.error('❌ Error in loadProjectData:', error);
            console.error('❌ [DEBUG] Full error details:', {
                message: error.message,
                stack: error.stack,
                projectId: this.projectId
            });
            this.showErrorState();
            throw error; // Re-throw to be caught by init
        }
    }

    renderProjectDetails() {
        if (!this.projectData) {
            console.error('❌ [DEBUG] No project data available for rendering');
            this.showErrorState();
            return;
        }

        console.log('🎨 [DEBUG] Starting to render project details...');
        console.log('📊 [DEBUG] Project data for rendering:', this.projectData);

        document.title = this.projectData.titel || 'Project Details';

        // Update Header
        const titleElement = document.querySelector('.project-title-text');
        if (titleElement) {
            titleElement.textContent = this.projectData.titel || 'Geen titel';
            console.log('✅ [DEBUG] Project title updated');
        } else {
            console.error('❌ [DEBUG] Project title element not found');
        }

        // Update Description
        const descriptionElement = document.querySelector('.project-description-text');
        if (descriptionElement) {
            descriptionElement.textContent = this.projectData.beschrijving || 'Geen beschrijving beschikbaar.';
            console.log('✅ [DEBUG] Project description updated');
        } else {
            console.error('❌ [DEBUG] Project description element not found');
        }

        // Update Technologies - ENHANCED DEBUGGING
        const technologiesList = document.getElementById('project-technologies');
        if (technologiesList) {
            console.log('🔧 [DEBUG] Updating technologies list...');
            console.log('🔧 [DEBUG] Technologies data:', this.projectData.technologieen);
            
            if (this.projectData.technologieen && this.projectData.technologieen.trim()) {
                const technologies = this.projectData.technologieen.split(',').map(tech => tech.trim());
                console.log('🔧 [DEBUG] Parsed technologies:', technologies);
                
                technologiesList.innerHTML = technologies.map(tech => 
                    `<li><i class="fas fa-code"></i> ${tech}</li>`
                ).join('');
                console.log(`✅ [DEBUG] Technologies updated: ${technologies.length} technologies rendered`);
            } else {
                technologiesList.innerHTML = '<li><i class="fas fa-info-circle"></i> Geen technologieën opgegeven</li>';
                console.log('⚠️ [DEBUG] No technologies found, showing placeholder');
            }
        } else {
            console.error('❌ [DEBUG] Technologies list element not found');
        }

        // Update Team Members - ENHANCED DEBUGGING
        const teamList = document.getElementById('project-team-members');
        if (teamList) {
            console.log('👥 [DEBUG] Updating team members list...');
            console.log('👥 [DEBUG] Team data:', this.projectData.team);
            
            if (this.projectData.team && this.projectData.team.length > 0) {
                console.log(`👥 [DEBUG] Found ${this.projectData.team.length} team members`);
                
                const teamMembersHTML = this.projectData.team.map(member => {
                    console.log('👥 [DEBUG] Processing team member:', member);
                    return `
                        <li class="team-member-card">
                            <a href="/zoekbalk-studenten?id=${member.studentnummer}" class="team-member-link">
                                <div class="member-info">
                                    <span class="member-name">${member.voornaam} ${member.achternaam}</span>
                                    <div class="member-detail">
                                        <i class="fas fa-graduation-cap"></i> ${member.opleiding || 'N/A'}
                                    </div>
                                    ${member.opleidingsrichting ? `
                                        <div class="member-detail">
                                            <i class="fas fa-book"></i> ${member.opleidingsrichting}
                                        </div>
                                    ` : ''}
                                    ${member.gemeente ? `
                                        <div class="member-detail">
                                            <i class="fas fa-map-marker-alt"></i> ${member.gemeente}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="profile-link">
                                    <i class="fas fa-external-link-alt"></i> Bekijk profiel
                                </div>
                            </a>
                        </li>
                    `;
                }).join('');
                
                teamList.innerHTML = teamMembersHTML;
                console.log(`✅ [DEBUG] Team members updated: ${this.projectData.team.length} members rendered`);
            } else {
                teamList.innerHTML = '<li class="team-member-card"><div class="member-info"><span class="member-name">Geen teamleden gevonden</span></div></li>';
                console.log('⚠️ [DEBUG] No team members found, showing placeholder');
            }
        } else {
            console.error('❌ [DEBUG] Team members list element not found');
        }

        // Update Table Number - ENHANCED DEBUGGING
        const tableInfo = document.getElementById('project-tafel-info');
        if (tableInfo) {
            console.log('📍 [DEBUG] Updating table info...');
            console.log('📍 [DEBUG] Table number data:', this.projectData.tafelNr);
            
            if (this.projectData.tafelNr) {
                tableInfo.innerHTML = `
                    <i class="fas fa-map-marker-alt"></i>
                    <strong>Tafel ${this.projectData.tafelNr}</strong>
                    <br>
                    <small>Locatie op de beurs</small>
                `;
                console.log(`✅ [DEBUG] Table number updated: Tafel ${this.projectData.tafelNr}`);
            } else {
                tableInfo.innerHTML = `
                    <i class="fas fa-info-circle"></i>
                    <strong>Locatie wordt nog bepaald</strong>
                    <br>
                    <small>Check later voor updates</small>
                `;
                console.log('⚠️ [DEBUG] No table number found, showing placeholder');
            }
        } else {
            console.error('❌ [DEBUG] Table info element not found');
        }

        // Remove loading states
        this.removeLoadingStates();
        
        console.log('✅ Project details rendered successfully');
    }

    removeLoadingStates() {
        console.log('🔄 Removing skeleton loading states...');
        
        // Remove skeleton elements
        const skeletonElements = document.querySelectorAll('.skeleton');
        skeletonElements.forEach(el => el.remove());
        
        // Add content-loaded class to main container
        const mainContainer = document.querySelector('.layout');
        if (mainContainer) {
            mainContainer.classList.add('content-loaded');
        }
        
        // Add back button if it doesn't exist
        this.addBackButton();
    }

    addBackButton() {
        if (document.querySelector('.back-button')) return;

        const backButton = document.createElement('a');
        backButton.href = '/alle-projecten';
        backButton.className = 'back-button';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Terug naar projecten';
        
        const header = document.querySelector('.site-header');
        if (header) {
            header.insertAdjacentElement('afterend', backButton);
        } else {
            document.body.prepend(backButton);
        }
    }

    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        // Essentieel om navigatieproblemen te voorkomen
        document.body.addEventListener('click', (event) => {
            const memberLink = event.target.closest('.team-member-link');
            if (memberLink) {
                event.preventDefault(); 
                const url = memberLink.href;
                console.log(`Navigating to student profile: ${url}`);
                window.location.href = url;
            }
        });
    }

    showErrorState() {
        this.removeLoadingStates();
        const layout = document.querySelector('.layout');
        if (layout) {
            layout.style.display = 'none';
        }

        let errorState = document.querySelector('.error-state');
        if (errorState) {
            errorState.style.display = 'flex';
        } else {
            errorState = document.createElement('div');
            errorState.className = 'error-state';
            errorState.style.display = 'flex';
            errorState.innerHTML = `
                <h3><i class="fas fa-exclamation-triangle"></i> Project niet gevonden</h3>
                <p>Het opgevraagde project kon niet worden geladen. Dit kan komen door een verkeerde link of een technisch probleem.</p>
                <a href="/alle-projecten.html" class="retry-btn"><i class="fas fa-arrow-left"></i> Terug naar alle projecten</a>
            `;
            document.body.appendChild(errorState);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing ProjectDetailManager...');
    const projectDetailManager = new ProjectDetailManager();
    projectDetailManager.init();
});

console.log('✅ Project Detail script loaded successfully');