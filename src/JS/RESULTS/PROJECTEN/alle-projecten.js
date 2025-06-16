// src/JS/RESULTS/PROJECTEN/alle-projecten.js
// Alle Projecten pagina functionaliteit

console.log('Alle Projecten script loading...');

class ProjectenManager {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.currentFilter = 'Alle';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        try {
            console.log('🔍 Initializing ProjectenManager...');
            
            // Setup event listeners
            this.setupEventListeners();
              // Load projects from backend (with mock fallback)
            await this.loadProjects();
            
            // Group projects by name for alle-projecten.html
            this.projects = this.groupProjectsByName(this.projects);
            
            // Initialize filtered projects and render initial view
            this.filteredProjects = [...this.projects]; // Initialize with all projects
            this.renderProjects();
            this.updateStatsBar();
            
            console.log('✅ ProjectenManager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing ProjectenManager:', error);
            
            // Emergency fallback - should not happen with new loadProjects
            console.log('🚨 Emergency fallback: using mock data');
            this.projects = this.getMockProjects();
            this.renderProjects();
            this.updateStatsBar();
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterAndRenderProjects();
            });
        }

        // Category pills
        const categoryPills = document.querySelectorAll('.category-pill');
        categoryPills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                // Remove active class from all pills
                categoryPills.forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked pill
                e.target.classList.add('active');
                
                // Update filter
                this.currentFilter = e.target.textContent;
                this.filterAndRenderProjects();
            });
        });

        // Filter button
        const filterBtn = document.querySelector('.filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.filterAndRenderProjects();
            });
        }

        // Year filter
        const yearSelect = document.querySelector('.filter-select');
        if (yearSelect) {
            yearSelect.addEventListener('change', () => {
                this.filterAndRenderProjects();
            });
        }
    }

    async loadProjects() {
        try {
            console.log('📡 Loading projects from API...');
            
            let response = null;
            let endpointUsed = 'mock-data';
            let data = null;
              // Try different endpoints, but don't throw errors - just log them
            const endpoints = [
                { url: 'http://localhost:3301/api/studenten/projecten', name: 'backend-student-projects' },
                { url: 'http://localhost:3301/api/studenten?hasProject=true', name: 'backend-filtered-students' },
                { url: '/api/studenten?hasProject=true', name: 'frontend-fallback' }
            ];
            
            // Try each endpoint
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
                this.projects = data.data || data || [];
                
                // Filter out projects without title or description
                this.projects = this.projects.filter(project => 
                    project.projectTitel && 
                    project.projectTitel.trim() !== '' &&
                    project.projectBeschrijving &&
                    project.projectBeschrijving.trim() !== ''
                );
                
                if (this.projects.length > 0) {
                    console.log(`✅ Loaded ${this.projects.length} projects from ${endpointUsed}`);
                    this.updateStatsBar();
                    return; // Success! Exit function
                } else {
                    console.warn('⚠️ No valid projects found in API response, using mock data');
                }
            } else {
                console.warn('⚠️ All API endpoints failed or returned invalid data, using mock data');
            }
            
            // If we reach here, all API endpoints failed - use mock data
            console.log('📝 Using mock data as fallback');
            this.projects = this.getMockProjects();
            endpointUsed = 'mock-data';
            
            console.log(`✅ Loaded ${this.projects.length} projects from ${endpointUsed}`);
            this.updateStatsBar();

        } catch (error) {
            // This should never happen with the new error handling, but just in case
            console.error('❌ Unexpected error in loadProjects:', error);
            console.log('📝 Using mock data as emergency fallback');
            
            this.projects = this.getMockProjects();
            console.log(`✅ Loaded ${this.projects.length} projects from emergency mock data`);
            this.updateStatsBar();
        }
    }

    getMockProjects() {
        return [
            {
                studentnummer: 232,
                projectTitel: "Kokende AI Robot",
                projectBeschrijving: "De Kokende AI Robot is een geavanceerde huishoudrobot ontworpen om volledig zelfstandig maaltijden te bereiden. Uitgerust met kunstmatige intelligentie, spraakherkenning en honderden ingebouwde recepten, analyseert hij voedingsvoorkeuren, allergieën en beschikbare ingrediënten.",
                studentNaam: "John Doe",
                voornaam: "John",
                achternaam: "Doe",
                email: "john.doe@student.ehb.be",
                opleiding: "Toegepaste informatica",
                opleidingsrichting: "Intelligent Robotics",
                tafelNr: 1,
                leerjaar: 3
            },
            {
                studentnummer: 233,
                projectTitel: "NeuroTrack",
                projectBeschrijving: "NeuroTrack is een draagbare EEG-headset die hersenactiviteit meet tijdens sport en meditatie. Het analyseert realtime biosignalen om focus, stress en cognitieve belasting te monitoren.",
                studentNaam: "Jeretom Carnomina",
                voornaam: "Jeretom",
                achternaam: "Carnomina",
                email: "jeretom.carnomina@student.ehb.be",
                opleiding: "Toegepaste informatica",
                opleidingsrichting: "Software Engineering",
                tafelNr: 2,
                leerjaar: 3
            },
            {
                studentnummer: 234,
                projectTitel: "Geïntegreerd campus-beheer via Cisco DNA Center",
                projectBeschrijving: "Ontwikkeling van een CI/CD-geïntegreerde workflow waarin Cisco Catalyst Center API's netwerkconfiguraties automatisch uitrollen, compliance checks uitvoeren en real-time netwerk-telemetrie aanleveren voor DevOps-teams.",
                studentNaam: "Ben Huur",
                voornaam: "Ben",
                achternaam: "Huur",
                email: "ben.huur@student.ehb.be",
                opleiding: "Toegepaste informatica",
                opleidingsrichting: "Networks & Security",
                tafelNr: 3,
                leerjaar: 3
            },
            {
                studentnummer: 235,
                projectTitel: "SecureCloudGuard – End-to-End Geautomatiseerd Beveiligingsplatform",
                projectBeschrijving: "SecureCloudGuard is een end-to-end cloud-native beveiligingsplatform dat uitgebreide SAST- en DAST-scans integreert, Azure Policy- en RBAC-regels opstelt en real-time threat-detectie biedt.",
                studentNaam: "Elina Verstegen",
                voornaam: "Elina",
                achternaam: "Verstegen",
                email: "elina.verstegen@student.ehb.be",
                opleiding: "Toegepaste informatica",
                opleidingsrichting: "Network & Security",
                tafelNr: 4,
                leerjaar: 2
            },
            {
                studentnummer: 236,
                projectTitel: "Real-time Debug Dashboard",
                projectBeschrijving: "Het Real-time Debug Dashboard is een tool die live systeemlogs en metrics corrigeert en visualiseert. Met WebSocket-verbindingen worden foutmeldingen en performance-indicatoren in real time geaggregeerd.",
                studentNaam: "Anatoly Kaas",
                voornaam: "Anatoly",
                achternaam: "Kaas",
                email: "anatoly.kaas@student.ehb.be",
                opleiding: "Graduaat Programmeren",
                opleidingsrichting: "Software Engineering",
                tafelNr: 5,
                leerjaar: 2
            },
            {
                studentnummer: 237,
                projectTitel: "AR Tour Guide App",
                projectBeschrijving: "De AR Tour Guide App helpt toeristen door middel van augmented reality-pictogrammen op locaties in Vlaamse steden. Gebruikt Flutter voor cross-platform en ARKit/ARCore voor AR-elementen.",
                studentNaam: "Lucas Vancouver",
                voornaam: "Lucas",
                achternaam: "Vancouver",
                email: "lucas.vancouver@student.ehb.be",
                opleiding: "Multimedia & Creatieve Technologie",
                opleidingsrichting: "Creative Media",
                tafelNr: 6,
                leerjaar: 3
            },
            {
                studentnummer: 238,
                projectTitel: "Predictive Maintenance Platform",
                projectBeschrijving: "Een Predictive Maintenance Platform dat machinegegevens verzamelt via IoT-sensoren, streaming analyse uitvoert met Apache Kafka en Machine Learning-modellen gebruikt om onderhoudsproblemen te voorspellen.",
                studentNaam: "Jane Smith",
                voornaam: "Jane",
                achternaam: "Smith",
                email: "jane.smith@student.ehb.be",
                opleiding: "Toegepaste informatica",
                opleidingsrichting: "Business IT",
                tafelNr: 7,
                leerjaar: 3
            },
            {
                studentnummer: 244,
                projectTitel: "Autonome Drone voor Milieumonitoring",
                projectBeschrijving: "Een autonome drone die luchtkwaliteit en waterkwaliteit meet met sensormodules, en data realtime uploadt naar een cloud-API via 4G/LoRa. De drone stuurt zichzelf aan via een onboard Raspberry Pi met ROS.",
                studentNaam: "Anakin Volto",
                voornaam: "Anakin",
                achternaam: "Volto",
                email: "anakin.volto@student.ehb.be",
                opleiding: "Embedded Systems",
                opleidingsrichting: "Intelligent Robotics",
                tafelNr: 12,
                leerjaar: 3
            },
            {
                studentnummer: 247,
                projectTitel: "Smart Garden Assistant",
                projectBeschrijving: "App en sensorplatform dat plantenwater en licht regelt met ML-analyse van bodemdata. De Smart Garden Assistant ontwikkelt een slim systeem dat planten automatisch van water en licht voorziet.",
                studentNaam: "Eva Bekaert",
                voornaam: "Eva",
                achternaam: "Bekaert",
                email: "eva.bekaert@student.ehb.be",
                opleiding: "Toegepaste informatica",
                opleidingsrichting: "IoT & Data",
                tafelNr: 15,
                leerjaar: 3
            },
            {
                studentnummer: 252,                projectTitel: "Smart Home Automation",
                projectBeschrijving: "Ontwikkeling van een Smart Home-systeem dat apparaten zoals verlichting, verwarming en beveiliging integreert via een centrale hub. Het systeem maakt gebruik van IoT-protocollen zoals MQTT en CoAP.",
                studentNaam: "Han Solo",
                voornaam: "Han",
                achternaam: "Solo",                email: "han.solo@student.ehb.be",
                opleiding: "Multimedia & Creatieve Technologie",
                opleidingsrichting: "Digital Design",
                tafelNr: 17,                
                leerjaar: 3
            },
            // Duplicate project to test grouping
            {
                studentnummer: 253,
                projectTitel: "Smart Home Automation",
                projectBeschrijving: "Ontwikkeling van een Smart Home-systeem dat apparaten zoals verlichting, verwarming en beveiliging integreert via een centrale hub. Het systeem maakt gebruik van IoT-protocollen zoals MQTT en CoAP.",
                studentNaam: "Leia Organa",
                voornaam: "Leia",
                achternaam: "Organa",
                email: "leia.organa@student.ehb.be",
                opleiding: "Toegepaste informatica",
                opleidingsrichting: "IoT & Data",
                tafelNr: 18,
                leerjaar: 3
            },
            // Another duplicate project
            {
                studentnummer: 254,
                projectTitel: "NeuroTrack",
                projectBeschrijving: "NeuroTrack is een draagbare EEG-headset die hersenactiviteit meet tijdens sport en meditatie. Het analyseert realtime biosignalen om focus, stress en cognitieve belasting te monitoren.",
                studentNaam: "Luke Skywalker",
                voornaam: "Luke",
                achternaam: "Skywalker",
                email: "luke.skywalker@student.ehb.be",
                opleiding: "Toegepaste informatica",
                opleidingsrichting: "AI & Machine Learning",
                tafelNr: 19,
                leerjaar: 2
            }
        ];
    }

    // Group projects by name and combine students working on the same project
    groupProjectsByName(projects) {
        const projectGroups = {};
        
        projects.forEach(project => {
            const projectTitle = project.projectTitel.trim();
            
            if (!projectGroups[projectTitle]) {
                // First occurrence of this project - create the group
                projectGroups[projectTitle] = {
                    ...project,
                    studenten: [{
                        studentnummer: project.studentnummer,
                        voornaam: project.voornaam,
                        achternaam: project.achternaam,
                        studentNaam: project.studentNaam,
                        email: project.email,
                        opleiding: project.opleiding,
                        opleidingsrichting: project.opleidingsrichting,
                        tafelNr: project.tafelNr,
                        leerjaar: project.leerjaar
                    }],
                    studentCount: 1
                };
            } else {
                // Project already exists - add this student to the group
                projectGroups[projectTitle].studenten.push({
                    studentnummer: project.studentnummer,
                    voornaam: project.voornaam,
                    achternaam: project.achternaam,
                    studentNaam: project.studentNaam,
                    email: project.email,
                    opleiding: project.opleiding,
                    opleidingsrichting: project.opleidingsrichting,
                    tafelNr: project.tafelNr,
                    leerjaar: project.leerjaar
                });
                projectGroups[projectTitle].studentCount++;
                
                // Update table numbers if different students have different tables
                if (project.tafelNr && project.tafelNr !== projectGroups[projectTitle].tafelNr) {
                    if (typeof projectGroups[projectTitle].tafelNr === 'number') {
                        projectGroups[projectTitle].tafelNr = [projectGroups[projectTitle].tafelNr, project.tafelNr];
                    } else if (Array.isArray(projectGroups[projectTitle].tafelNr)) {
                        projectGroups[projectTitle].tafelNr.push(project.tafelNr);
                    }
                }
            }
        });
        
        // Convert object back to array
        const groupedProjects = Object.values(projectGroups);
        
        console.log(`📊 Grouped ${projects.length} individual entries into ${groupedProjects.length} unique projects`);
        return groupedProjects;
    }

    filterAndRenderProjects() {
        try {
            console.log('🔍 Filtering projects...', {
                totalProjects: this.projects.length,
                currentFilter: this.currentFilter,
                searchTerm: this.searchTerm
            });

            this.filteredProjects = this.projects.filter(project => {
                // Search filter
                const matchesSearch = !this.searchTerm || 
                    project.projectTitel.toLowerCase().includes(this.searchTerm) ||
                    project.projectBeschrijving.toLowerCase().includes(this.searchTerm) ||
                    (project.studentNaam && project.studentNaam.toLowerCase().includes(this.searchTerm)) ||
                    (project.voornaam && project.voornaam.toLowerCase().includes(this.searchTerm)) ||
                    (project.achternaam && project.achternaam.toLowerCase().includes(this.searchTerm));

                // Category filter
                const projectCategory = this.getCategoryFromProject(project);
                const matchesCategory = this.currentFilter === 'Alle' || projectCategory === this.currentFilter;

                // Year filter
                const yearSelect = document.querySelector('.filter-select');
                const selectedYear = yearSelect ? yearSelect.value : 'Alle jaren';
                const projectYear = this.getYearFromProject(project);
                const matchesYear = selectedYear === 'Alle jaren' || projectYear === selectedYear;

                console.log(`Project: ${project.projectTitel}`, {
                    matchesSearch,
                    matchesCategory,
                    matchesYear,
                    projectCategory,
                    projectYear
                });

                return matchesSearch && matchesCategory && matchesYear;
            });

            console.log(`✅ Filtered ${this.filteredProjects.length} projects from ${this.projects.length} total`);

            this.renderProjects();
            this.updateStatsBar();
        } catch (error) {
            console.error('❌ Error filtering projects:', error);
        }
    }

    getCategoryFromProject(project) {
        if (!project.opleidingsrichting && !project.opleiding) return 'Alle';
        
        const richting = project.opleidingsrichting || '';
        const opleiding = project.opleiding || '';
        
        // Map opleidingsrichtingen to categories
        if (richting.includes('AI') || richting.includes('Robotica') || richting.includes('Intelligent')) {
            return 'AI & Robotica';
        }
        if (richting.includes('Web') || richting.includes('Software') || opleiding.includes('Informatica')) {
            return 'Web Development';
        }
        if (richting.includes('Hardware') || richting.includes('IoT') || richting.includes('Embedded')) {
            return 'Hardware & IoT';
        }
        if (richting.includes('Security') || richting.includes('Cybersecurity')) {
            return 'Cybersecurity';
        }
        
        return 'Alle';
    }

    getYearFromProject(project) {
        if (project.leerjaar) {
            return `${project.leerjaar}e jaar`;
        }
        return '3e jaar'; // Default
    }    renderProjects() {
        const container = document.querySelector('.projectTegels');
        if (!container) {
            console.error('❌ Projects container not found');
            return;
        }

        // Initialize filteredProjects if not set
        if (!this.filteredProjects) {
            this.filteredProjects = [...this.projects];
        }

        // Clear loading state
        container.innerHTML = '';

        if (this.filteredProjects.length === 0) {
            this.showNoResults(container);
            return;
        }

        // Render project cards
        this.filteredProjects.forEach((project, index) => {
            const projectCard = this.createProjectCard(project, index);
            container.appendChild(projectCard);
        });

        console.log(`✅ Rendered ${this.filteredProjects.length} project cards`);
    }

    createProjectCard(project, index) {
        const article = document.createElement('article');
        article.className = 'projectTegel';
        article.style.animationDelay = `${index * 0.1}s`;
          // Make it clickable - navigate to project detail
        article.style.cursor = 'pointer';
        article.addEventListener('click', () => {
            // For grouped projects, use the first student's number as project ID
            let projectId;
            
            if (project.studenten && Array.isArray(project.studenten)) {
                // Grouped project - use first student's number
                projectId = project.studenten[0].studentnummer;
            } else {
                // Single project - use direct studentnummer
                projectId = project.studentnummer || project.id;
            }
            
            if (projectId) {
                console.log(`🔗 Navigating to project detail: ${projectId}`);
                console.log('Project data:', project);
                window.location.href = `/zoekbalkProjecten?id=${projectId}`;
            } else {
                console.error('❌ No project ID found for navigation');
                console.error('Project object:', project);
            }
        });

        // Add hover effect
        article.addEventListener('mouseenter', () => {
            article.style.transform = 'translateY(-8px)';
            article.style.boxShadow = '0 15px 45px rgba(136, 21, 56, 0.3)';
        });

        article.addEventListener('mouseleave', () => {
            article.style.transform = 'translateY(-5px)';
            article.style.boxShadow = '0 12px 40px rgba(136, 21, 56, 0.25)';
        });

        // Project title
        const title = document.createElement('h2');
        title.className = 'projectTitel';
        title.textContent = project.projectTitel || 'Untitled Project';

        // Project description
        const description = document.createElement('p');
        description.className = 'projectBeschrijving';
        const fullDescription = project.projectBeschrijving || 'Geen beschrijving beschikbaar.';
        
        // Truncate description if too long
        const maxLength = 300;
        description.textContent = fullDescription.length > maxLength 
            ? fullDescription.substring(0, maxLength) + '...'
            : fullDescription;        // Student info (multiple students support)
        const studentInfo = document.createElement('div');
        studentInfo.className = 'student-info';
        studentInfo.style.cssText = `
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #dee2e6;
            font-size: 0.9rem;
            color: #666;
        `;

        // Handle multiple students or single student
        if (project.studenten && Array.isArray(project.studenten)) {
            // Multiple students working on this project
            const studentsHeader = document.createElement('div');
            studentsHeader.style.cssText = `
                font-weight: 600;
                color: #881538;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            `;
            studentsHeader.innerHTML = `👥 Team (${project.studenten.length} ${project.studenten.length === 1 ? 'student' : 'studenten'}):`;
            studentInfo.appendChild(studentsHeader);

            project.studenten.forEach((student, studentIndex) => {
                const studentDiv = document.createElement('div');
                studentDiv.style.cssText = `
                    margin-bottom: 0.4rem;
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border-left: 3px solid #881538;
                `;

                const studentName = student.studentNaam || 
                                  (student.voornaam && student.achternaam ? `${student.voornaam} ${student.achternaam}` : `Student ${student.studentnummer}`);
                
                const nameSpan = document.createElement('div');
                nameSpan.style.cssText = `
                    font-weight: 600;
                    color: #881538;
                    margin-bottom: 0.2rem;
                `;
                nameSpan.textContent = studentName;
                studentDiv.appendChild(nameSpan);                if (student.opleiding || student.opleidingsrichting) {
                    const studySpan = document.createElement('div');
                    studySpan.style.cssText = `
                        color: #666;
                        font-size: 0.8rem;
                    `;
                    const studyInfo = student.opleidingsrichting || student.opleiding;
                    studySpan.innerHTML = `🎓 ${studyInfo}`;
                    studentDiv.appendChild(studySpan);
                }

                studentInfo.appendChild(studentDiv);
            });
        } else {
            // Single student (backward compatibility)
            const studentName = project.studentNaam || 
                              (project.voornaam && project.achternaam ? `${project.voornaam} ${project.achternaam}` : null);
            
            if (studentName) {
                const nameSpan = document.createElement('span');
                nameSpan.style.cssText = `
                    font-weight: 600;
                    color: #881538;
                    display: block;
                    margin-bottom: 0.25rem;
                `;
                nameSpan.innerHTML = `👤 ${studentName}`;
                studentInfo.appendChild(nameSpan);
            }            if (project.opleiding || project.opleidingsrichting) {
                const studySpan = document.createElement('span');
                studySpan.style.cssText = `
                    color: #666;
                    font-size: 0.85rem;
                `;
                const studyInfo = project.opleidingsrichting || project.opleiding;
                studySpan.innerHTML = `🎓 ${studyInfo}`;
                studentInfo.appendChild(studySpan);
            }
        }        // Create table number display for bottom left
        const tableInfo = document.createElement('div');
        tableInfo.style.cssText = `
            position: absolute;
            bottom: 1rem;
            left: 1rem;
            background: #881538;
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(136, 21, 56, 0.3);
            z-index: 10;
        `;

        // Get table number(s) for display
        let tableNumbers = [];
        if (project.studenten && Array.isArray(project.studenten)) {
            // Multiple students - get unique table numbers
            tableNumbers = [...new Set(project.studenten
                .map(s => s.tafelNr)
                .filter(nr => nr !== undefined && nr !== null)
            )];
        } else if (project.tafelNr) {
            // Single student
            if (Array.isArray(project.tafelNr)) {
                tableNumbers = project.tafelNr;
            } else {
                tableNumbers = [project.tafelNr];
            }
        }

        if (tableNumbers.length > 0) {
            const tableDisplay = tableNumbers.length > 1 
                ? `Tafels ${tableNumbers.join(', ')}` 
                : `Tafel ${tableNumbers[0]}`;
            tableInfo.innerHTML = `📍 ${tableDisplay}`;
        } else {
            tableInfo.innerHTML = `📍 Tafel TBD`;
        }        // Make article position relative and add bottom padding for table info
        article.style.position = 'relative';
        article.style.paddingBottom = '4rem'; // More space for table badge// Assemble card
        article.appendChild(title);
        article.appendChild(description);
        if (studentInfo.children.length > 0) {
            article.appendChild(studentInfo);
        }
        article.appendChild(tableInfo);

        return article;
    }

    showNoResults(container) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <h3>🔍 Geen projecten gevonden</h3>
            <p>Er zijn geen projecten die voldoen aan je zoekcriteria.</p>
            <button class="retry-btn" onclick="location.reload()">
                <i class="fas fa-redo"></i> Vernieuwen
            </button>
        `;
        container.appendChild(noResults);
    }

    showErrorState(message) {
        const container = document.querySelector('.projectTegels');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <h3><i class="fas fa-exclamation-triangle"></i> Fout bij laden</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Probeer opnieuw
                </button>
            </div>
        `;
    }

    updateStatsBar() {
        const statsText = document.querySelector('.stats-text');
        if (statsText) {
            const total = this.projects.length;
            const filtered = this.filteredProjects.length;
              if (filtered === total) {
                statsText.textContent = `${total} innovatieve projecten beschikbaar voor gesprekken`;
            } else {
                statsText.textContent = `${filtered} van ${total} projecten gevonden`;
            }
        }
    }

    groupProjectsByName(projects) {
        const grouped = {};

        projects.forEach(project => {
            const name = project.projectTitel || 'Onbekend Project';

            if (!grouped[name]) {
                grouped[name] = {
                    projectTitel: name,
                    projectBeschrijving: project.projectBeschrijving,
                    studenten: []
                };
            }

            // Add student info
            grouped[name].studenten.push({
                studentnummer: project.studentnummer,
                studentNaam: project.studentNaam,
                voornaam: project.voornaam,
                achternaam: project.achternaam,
                email: project.email,
                opleiding: project.opleiding,
                opleidingsrichting: project.opleidingsrichting,
                tafelNr: project.tafelNr,
                leerjaar: project.leerjaar
            });
        });

        // Convert back to array
        return Object.values(grouped);
    }

    // Public API
    refresh() {
        console.log('🔄 Refreshing projects...');
        this.loadProjects().then(() => {
            this.filterAndRenderProjects();
        }).catch(error => {
            console.error('❌ Error refreshing projects:', error);
            this.showErrorState('Er ging iets mis bij het verversen van de projecten.');
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProjectenManager...');
    window.projectenManager = new ProjectenManager();
});

// Utility function for external use
window.refreshProjects = () => {
    if (window.projectenManager) {
        window.projectenManager.refresh();
    }
};

console.log('✅ Alle Projecten script loaded successfully');