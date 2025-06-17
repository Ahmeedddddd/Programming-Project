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
            console.log('📡 Loading project data and all students working on it...');
            
            let response = null;
            let endpointUsed = 'mock-data';
            let data = null;
            
            // Try to get all students/projects data first
            const endpoints = [
                { url: `${this.API_BASE}/api/studenten/projecten`, name: 'backend-student-projects' },
                { url: `${this.API_BASE}/api/studenten?hasProject=true`, name: 'backend-filtered-students' },
                { url: `${this.API_BASE}/api/studenten`, name: 'backend-all-students' }
            ];
            
            // Try each endpoint to get all project data
            for (const endpoint of endpoints) {
                try {
                    console.log(`🔍 Trying endpoint: ${endpoint.url}`);
                    
                    response = await fetch(endpoint.url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        endpointUsed = endpoint.name;
                        console.log(`✅ Success with ${endpoint.name}`);
                        break; // Exit loop on first success
                    } else {
                        console.warn(`⚠️ ${endpoint.name} failed with status: ${response.status}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ ${endpoint.name} failed with error:`, error.message);
                    // Continue to next endpoint
                }
            }
            
            // Process data if we got any
            if (data && (data.success !== false)) {
                const allProjects = data.data || data || [];
                
                // Filter projects to find the main project and all students working on it
                const targetProject = allProjects.find(project => 
                    project.studentnummer == this.projectId && 
                    project.projectTitel && 
                    project.projectTitel.trim() !== ''
                );
                
                if (targetProject) {
                    // Find all students working on the same project
                    const projectTitle = targetProject.projectTitel.trim();
                    const allStudentsOnProject = allProjects.filter(project => 
                        project.projectTitel && 
                        project.projectTitel.trim() === projectTitle
                    );

                    this.projectData = {
                        titel: targetProject.projectTitel,
                        beschrijving: targetProject.projectBeschrijving,
                        studenten: allStudentsOnProject.map(student => {
                            console.log('🔍 Processing student:', {
                                naam: student.studentNaam,
                                tafelNr: student.tafelNr,
                                hasTable: !!student.tafelNr
                            });
                            
                            const naam = student.studentNaam || 
                                       `${student.voornaam || ''} ${student.achternaam || ''}`.trim() || 
                                       `Student ${student.studentnummer}`;
                            
                            console.log('🏷️ Final name:', naam);
                              
                            return {
                                naam: naam,
                                email: student.email,
                                opleiding: student.opleiding,
                                opleidingsrichting: student.opleidingsrichting,
                                tafelNr: student.tafelNr || student.tafelNummer || student.tafelnummer,
                                studentnummer: student.studentnummer,
                                voornaam: student.voornaam,
                                achternaam: student.achternaam
                            };
                        })
                    };
                    
                    console.log(`✅ Project data loaded from ${endpointUsed}:`, this.projectData);
                    console.log(`👥 Found ${this.projectData.studenten.length} students working on this project`);
                    console.log('📊 Student data check:', this.projectData.studenten.map(s => ({
                        naam: s.naam,
                        voornaam: s.voornaam,
                        achternaam: s.achternaam,
                        tafelNr: s.tafelNr
                    })));
                    return; // Success! Exit function
                } else {
                    console.warn('⚠️ Project not found in API data');
                }
            } else {
                console.warn('⚠️ All API endpoints failed or returned invalid data');
            }
            
            // If we reach here, no data was found
            throw new Error(`Project met ID ${this.projectId} niet gevonden`);

        } catch (error) {
            console.error('❌ Error loading project data:', error);
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
            
            // Update info section
            this.updateInfoSection();
            
            // Add back button
            this.addBackButton();
            
            // Remove loading states
            this.removeLoadingStates();
            
            console.log('✅ Project details rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering project details:', error);
            this.showErrorState();
        }
    }

    updateHeader() {
        const projectTitle = document.querySelector('.project-title');
        if (projectTitle) {
            projectTitle.textContent = this.projectData.titel;
        }

        // Update skills/technologies if present - use first student's opleidingsrichting
        const projectSkills = document.querySelector('.project-skills');
        if (projectSkills && this.projectData.studenten && this.projectData.studenten.length > 0) {
            const firstStudent = this.projectData.studenten[0];
            if (firstStudent.opleidingsrichting) {
                projectSkills.textContent = `Technologies: ${firstStudent.opleidingsrichting}`;
            }
        }
    }

    updateDescriptionSection() {
        const descriptionSection = document.querySelector('.description-section');
        if (!descriptionSection) return;

        // Find or create description paragraph
        let descriptionP = descriptionSection.querySelector('p');
        if (!descriptionP) {
            const h2 = descriptionSection.querySelector('h2');
            descriptionP = document.createElement('p');
            if (h2 && h2.nextSibling) {
                descriptionSection.insertBefore(descriptionP, h2.nextSibling);
            } else {
                descriptionSection.appendChild(descriptionP);
            }
        }

        descriptionP.textContent = this.projectData.beschrijving || 'Geen projectbeschrijving beschikbaar.';
        
        // Add project metadata
        this.addProjectMetadata(descriptionSection);
    }

    addProjectMetadata(container) {
        // Remove existing metadata
        const existingMeta = container.querySelector('.project-metadata');
        if (existingMeta) {
            existingMeta.remove();
        }

        const metadata = document.createElement('div');
        metadata.className = 'project-metadata';
        metadata.style.cssText = `
            margin-top: 2rem;
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 12px;
            border-left: 4px solid #881538;
        `;

        let metadataHTML = `<h3 style="color: #881538; margin-bottom: 1rem; font-size: 1.1rem;">Project Informatie</h3>`;
        
        // Get unique values from all students
        if (this.projectData.studenten && this.projectData.studenten.length > 0) {
            const opleidingen = [...new Set(this.projectData.studenten.map(s => s.opleiding).filter(Boolean))];
            const richtingen = [...new Set(this.projectData.studenten.map(s => s.opleidingsrichting).filter(Boolean))];
            const jaren = [...new Set(this.projectData.studenten.map(s => s.leerjaar).filter(Boolean))];
            
            if (opleidingen.length > 0) {
                metadataHTML += `<p><strong>Opleiding:</strong> ${opleidingen.join(', ')}</p>`;
            }
            
            if (richtingen.length > 0) {
                metadataHTML += `<p><strong>Specialisatie:</strong> ${richtingen.join(', ')}</p>`;
            }
            
            if (jaren.length > 0) {
                metadataHTML += `<p><strong>Leerjaar:</strong> ${jaren.map(j => `${j}e jaar`).join(', ')}</p>`;
            }
        }

        metadata.innerHTML = metadataHTML;
        container.appendChild(metadata);
    }

    updateInfoSection() {
        const infoSection = document.querySelector('.info-section');
        if (!infoSection) return;

        // Update title with project team info and table numbers
        const h2 = infoSection.querySelector('h2');
        if (h2) {
            // Get unique table numbers from all students
            const tafelNummers = [...new Set(this.projectData.studenten
                .map(s => s.tafelNr)
                .filter(tafel => tafel !== undefined && tafel !== null && tafel !== 'TBD')
            )];
            
            let titleText = 'Team Info';
            if (tafelNummers.length > 0) {
                titleText += ` - Tafel ${tafelNummers.join(', ')}`;
            }
            
            h2.textContent = titleText;
        }

        // Update team list with all students working on the project
        const teamList = infoSection.querySelector('.team-list');
        if (teamList) {
            teamList.innerHTML = '';

            // Add all students working on this project
            this.projectData.studenten.forEach((student, index) => {
                const studentItem = document.createElement('li');

                studentItem.style.cssText = `
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #881538;
                    position: relative;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 150px;
                `;
                
                // Make the entire card clickable
                studentItem.addEventListener('click', () => {
                    window.location.href = `/zoekbalk-studenten?id=${student.studentnummer}`;
                });
                
                // Add hover effect
                studentItem.addEventListener('mouseenter', () => {
                    studentItem.style.transform = 'translateY(-2px)';
                    studentItem.style.boxShadow = '0 8px 25px rgba(136, 21, 56, 0.15)';
                    studentItem.style.background = '#f1f3f4';
                });
                
                studentItem.addEventListener('mouseleave', () => {
                    studentItem.style.transform = 'translateY(0)';
                    studentItem.style.boxShadow = 'none';
                    studentItem.style.background = '#f8f9fa';
                });

                studentItem.innerHTML = `
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #881538; margin-bottom: 0.5rem;">
                            👤 ${student.naam}
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.3rem;">
                            🎓 ${student.opleiding || 'Onbekende opleiding'}
                            ${student.opleidingsrichting ? ` - ${student.opleidingsrichting}` : ''}
                        </div>
                        <div style="font-size: 0.9rem; color: #666;">
                            📧 ${student.email || 'Geen email beschikbaar'}
                        </div>
                    </div>

                    <div style="
                        display: inline-block;
                        background: linear-gradient(135deg, #881538 0%, #A91B47 100%);
                        color: white;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        pointer-events: none;
                        margin-top: 1rem;
                        width: 100%;
                        text-align: center;
                        box-sizing: border-box;
                    ">
                        Ga naar profiel
                    </div>
                `;
                
                teamList.appendChild(studentItem);
            });
        }
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