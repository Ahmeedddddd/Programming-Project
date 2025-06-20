// src/JS/RESULTS/STUDENTEN/zoekbalk-studenten.js
// JavaScript voor student detail pagina - ENHANCED VERSION

// Wacht tot DOM geladen is
document.addEventListener('DOMContentLoaded', async () => {
    await initializeStudentDetailPage();
});

// Globale variabelen
let currentStudent = null;
let studentId = null;
const API_BASE = window.location.origin; // FIXED: Use same port as frontend

// ===== MAIN INITIALIZATION =====
async function initializeStudentDetailPage() {
    try {
        console.log('🎓 Initializing student detail page...');
        showLoadingState();
        
        // Haal student ID uit URL
        studentId = getStudentIdFromURL();
        console.log('📋 Student ID from URL:', studentId);
        
        if (!studentId) {
            console.error('❌ No student ID found in URL');
            showErrorState('Geen student ID gevonden in URL');
            return;
        }
        
        // Test backend connectivity eerst
        await testBackendConnectivity();
        
        // Laad student details
        await loadStudentDetails(studentId);
        
        if (!currentStudent) {
            console.error('❌ Student not found');
            showErrorState('Student niet gevonden');
            return;
        }
        
        console.log('✅ Student loaded:', currentStudent);
        
        // Render student details
        renderStudentDetails();
        
        // Setup functionaliteit
        setupContactButtons();
        setupReservationButton();
        setupNavigation();
        
        hideLoadingState();
        
        console.log('✅ Student detail pagina geïnitialiseerd voor:', currentStudent.voornaam, currentStudent.achternaam);
        
    } catch (error) {
        console.error('❌ Fout bij laden van student details:', error);
        showErrorState('Er ging iets mis bij het laden van de student details: ' + error.message);
    }
}

// ===== BACKEND CONNECTIVITY TEST =====
async function testBackendConnectivity() {
    console.log('🔍 Testing backend connectivity...');
    
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is healthy:', data.message);
            return true;
        } else {
            throw new Error(`Backend health check failed: ${response.status}`);
        }
        
    } catch (error) {
        console.warn('⚠️ Backend connectivity issue:', error.message);
        showNotification('⚠️ Backend server mogelijk offline - gebruik test data', 'warning');
        return false;
    }
}

// ===== URL PARSING =====
function getStudentIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    console.log('🔍 Parsing URL for student ID...');
    console.log('   Full URL:', window.location.href);
    console.log('   Search params:', window.location.search);
    console.log('   Parsed ID:', id);
    
    return id;
}

// ===== API CALLS =====
async function loadStudentDetails(studentId) {
    console.log('📡 Loading student details for ID:', studentId);
    
    try {
        // Gebruik fetch zonder Authorization header zodat gasten deze pagina kunnen zien
        const response = await fetch(`/api/studenten/${studentId}`);
        if (!response.ok) throw new Error('Student niet gevonden');
        const data = await response.json();
        console.log('📊 Raw API response:', data);
        
        if (data.success && data.data) {
            currentStudent = data.data;
            console.log('✅ Student details loaded from API:', currentStudent);
        } else {
            throw new Error('Invalid response format: ' + JSON.stringify(data));
        }
        
    } catch (error) {
        console.error('❌ API call failed:', error);
        
        // Fallback: gebruik mock data voor testing
        console.log('🔄 Falling back to mock data for student:', studentId);
        currentStudent = getMockStudentDetails(studentId);
        
        if (currentStudent) {
            console.log('✅ Using mock data:', currentStudent);
            showNotification('⚠️ Offline modus: test data wordt gebruikt', 'warning');
        } else {
            throw new Error(`Geen data beschikbaar voor student ${studentId}`);
        }
    }
}

// ===== RENDERING =====
function renderStudentDetails() {
    if (!currentStudent) {
        console.error('❌ No student data to render');
        return;
    }
    
    console.log('🎨 Rendering student details for:', currentStudent.voornaam, currentStudent.achternaam);
    
    try {
        // Remove all skeleton elements first
        const allSkeletons = document.querySelectorAll('.skeleton');
        console.log('🧹 Removing', allSkeletons.length, 'skeleton elements');
        allSkeletons.forEach(skeleton => {
            skeleton.style.display = 'none';
            skeleton.remove();
        });
        
        // Mark content as loaded
        document.body.classList.add('content-loaded');
        
        // Update page components
        updatePageTitle();
        renderHeader();
        renderProject();
        renderAboutSection();
        renderContactInfo();
        renderProfileLinks();
        
        console.log('✅ Student details rendered successfully');
        
    } catch (error) {
        console.error('❌ Error rendering student details:', error);
        showErrorState('Fout bij het renderen van student details');
    }
}

function updatePageTitle() {
    console.log('📝 Updating page title');
    
    // Update main title in header
    const siteTitle = document.querySelector('.site-title');
    if (siteTitle) {
        // Remove any skeleton first
        const skeleton = siteTitle.querySelector('.skeleton');
        if (skeleton) {
            skeleton.remove();
        }
        siteTitle.textContent = `${currentStudent.voornaam} ${currentStudent.achternaam}`;
        console.log('✅ Page title updated');
    } else {
        console.warn('⚠️ .site-title element not found');
    }
    
    // Update browser title
    document.title = `${currentStudent.voornaam} ${currentStudent.achternaam} – Portfolio & Reservatie`;
}

function renderHeader() {
    console.log('📝 Rendering header info');
    
    const header = document.querySelector('.site-header');
    if (header) {
        // Add student info to header if needed
        const existingInfo = header.querySelector('.student-header-info');
        if (!existingInfo) {
            const studentInfo = document.createElement('div');
            studentInfo.className = 'student-header-info';
            studentInfo.innerHTML = `
                <p class="student-specialization">${currentStudent.opleidingsrichting || currentStudent.opleiding || ''}</p>
                <p class="student-year">${getStudentYearText(currentStudent.studentnummer)}</p>
            `;
            header.appendChild(studentInfo);
            console.log('✅ Header info added');
        }
    }
}

function renderProject() {
    console.log('📝 Rendering project section');
    
    const projectSection = document.querySelector('.section-project');
    if (!projectSection) {
        console.error('❌ Project section not found! HTML structure issue.');
        return;
    }
    
    if (!currentStudent.projectTitel || currentStudent.projectTitel.trim() === '') {
        console.log('📝 No project title found, showing no-project message');
        projectSection.innerHTML = `
            <h2>Mijn Project</h2>
            <div class="no-project">
                <p>Deze student heeft nog geen project beschrijving toegevoegd.</p>
            </div>
        `;
        return;
    }
    
    console.log('📝 Rendering project:', currentStudent.projectTitel);
    
    // Completely rebuild the project section
    projectSection.innerHTML = `
        <h2>Mijn Project</h2>
        <article class="project-article">
            <h3 class="project-title">${currentStudent.projectTitel}</h3>
            <p class="project-description">
                ${currentStudent.projectBeschrijving || 'Geen project beschrijving beschikbaar.'}
            </p>
            <div class="project-keywords">
                <h4>Kernwoorden</h4>
                <ul>
                    <!-- Keywords worden dynamisch toegevoegd -->
                </ul>
            </div>
        </article>
    `;
    
    // Add technologies
    renderProjectKeywords();
    
    console.log('✅ Project section rendered successfully');
}

function renderProjectKeywords() {
    const keywordsSection = document.querySelector('.project-keywords ul');
    if (keywordsSection) {
        const defaultKeywords = getDefaultKeywords(currentStudent.opleidingsrichting);
        
        keywordsSection.innerHTML = '';
        defaultKeywords.forEach(keyword => {
            const li = document.createElement('li');
            li.textContent = keyword;
            keywordsSection.appendChild(li);
        });
        console.log('✅ Project keywords rendered');
    }
}

function renderAboutSection() {
    console.log('📝 Rendering about section');
    
    const aboutSection = document.querySelector('.section-over');
    if (!aboutSection) {
        console.error('❌ About section not found! HTML structure issue.');
        return;
    }
    
    const aboutText = currentStudent.overMezelf || 
                     `Hallo! Ik ben ${currentStudent.voornaam} ${currentStudent.achternaam}, student ${currentStudent.opleiding || 'aan de Erasmushogeschool Brussel'}. ` +
                     (currentStudent.projectTitel ? `Ik werk momenteel aan het project "${currentStudent.projectTitel}".` : '') +
                     ` Neem gerust contact met me op voor meer informatie!`;
    
    // Completely rebuild the about section
    aboutSection.innerHTML = `
        <h2>Over mezelf</h2>
        <p>${aboutText}</p>
    `;
    
    console.log('✅ About section rendered successfully');
}

function renderContactInfo() {
    console.log('📞 Rendering contact info');
    
    // 🔧 FIX: Proper tafel number logic
    const rawTafelNr = currentStudent.tafelNr;
    const displayTafelNr = (rawTafelNr !== null && rawTafelNr !== undefined && rawTafelNr !== '') 
        ? rawTafelNr 
        : 'TBD';
    
    console.log('📍 [DEBUG] Tafel info:', {
        raw: rawTafelNr,
        display: displayTafelNr,
        studentData: currentStudent
    });
    
    // Handle standalone tafel element if it exists
    const tafelElement = document.querySelector('.tafel-nummer');
    if (tafelElement) {
        tafelElement.textContent = displayTafelNr !== 'TBD' 
            ? `Tafel ${displayTafelNr}` 
            : 'Tafel TBD';
        console.log('📍 Updated standalone tafel element:', tafelElement.textContent);
    }
   
    const infoLinks = document.querySelector('.info-links ul');
    if (!infoLinks) {
        console.warn('⚠️ Info links container not found');
        return;
    }
   
    // Clear all existing content including skeletons
    infoLinks.innerHTML = '';
   
    // Add phone if available
    if (currentStudent.gsm_nummer) {
        const phoneLi = document.createElement('li');
        phoneLi.innerHTML = `<a href="tel:${currentStudent.gsm_nummer}">📞 ${currentStudent.gsm_nummer}</a>`;
        infoLinks.appendChild(phoneLi);
        console.log('📞 Added phone:', currentStudent.gsm_nummer);
    }
   
    // Add email link
    if (currentStudent.email) {
        const emailLi = document.createElement('li');
        emailLi.innerHTML = `<a href="mailto:${currentStudent.email}">📧 ${currentStudent.email}</a>`;
        infoLinks.appendChild(emailLi);
        console.log('📧 Added email:', currentStudent.email);
    }
   
    // Add location info
    if (currentStudent.gemeente) {
        const locationLi = document.createElement('li');
        locationLi.innerHTML = `<span>🏠 ${currentStudent.gemeente}</span>`;
        infoLinks.appendChild(locationLi);
        console.log('🏠 Added location:', currentStudent.gemeente);
    }
   
    // 🔧 FIX: Single tafel handling with proper logic
    const tableLi = document.createElement('li');
    if (displayTafelNr !== 'TBD') {
        tableLi.innerHTML = `<span>📍 Tafel ${displayTafelNr}</span>`;
        console.log('📍 Added tafel number:', displayTafelNr);
    } else {
        tableLi.innerHTML = `<span style="color: #999;">📍 Tafel TBD</span>`;
        console.log('📍 Added TBD tafel (no tafel assigned)');
    }
    infoLinks.appendChild(tableLi);
   
    console.log('✅ Contact info rendered');
}

function renderProfileLinks() {
    console.log('🔗 Rendering profile links');
    
    const profileLinks = document.querySelector('.profile-links');
    if (!profileLinks) {
        console.warn('⚠️ Profile links container not found');
        return;
    }
    
    // Clear all existing content including skeletons
    profileLinks.innerHTML = '';
    
    // LinkedIn link
    if (currentStudent.linkedinUrl) {
        const linkedinLink = document.createElement('a');
        linkedinLink.href = currentStudent.linkedinUrl;
        linkedinLink.target = '_blank';
        linkedinLink.rel = 'noopener';
        linkedinLink.className = 'link-item';
        linkedinLink.innerHTML = '<span>LinkedIn Profiel</span>';
        profileLinks.appendChild(linkedinLink);
    }
    
    // GitHub link
    if (currentStudent.githubUrl) {
        const githubLink = document.createElement('a');
        githubLink.href = currentStudent.githubUrl;
        githubLink.target = '_blank';
        githubLink.rel = 'noopener';
        githubLink.className = 'link-item';
        githubLink.innerHTML = '<span>GitHub Repository</span>';
        profileLinks.appendChild(githubLink);
    }
    
    // CV download link
    if (currentStudent.cvUrl) {
        const cvLink = document.createElement('a');
        cvLink.href = currentStudent.cvUrl;
        cvLink.target = '_blank';
        cvLink.className = 'link-item';
        cvLink.innerHTML = '<span>CV Downloaden</span>';
        profileLinks.appendChild(cvLink);
    }
    
    // Als geen links beschikbaar zijn
    if (profileLinks.children.length === 0) {
        profileLinks.innerHTML = `
            <p class="no-links">Geen externe links beschikbaar</p>
        `;
    }
    
    console.log('✅ Profile links rendered');
}

// ===== INTERACTION SETUP =====
function setupContactButtons() {
    // Email button functionality
    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    emailLinks.forEach(link => {
        link.addEventListener('click', () => {
            showNotification('📧 Email client wordt geopend...', 'info');
        });
    });
    
    // Phone button functionality  
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', () => {
            showNotification('📞 Telefoon app wordt geopend...', 'info');
        });
    });
}

function setupReservationButton() {
    const reserveBtn = document.querySelector('.btn-reserve');
    if (reserveBtn) {
        reserveBtn.addEventListener('click', () => {
            handleReservation();
        });
    }
}

function setupNavigation() {
    // Back to students list button wordt al door de HTML template aangemaakt
}

// ===== RESERVATION HANDLING =====
function handleReservation() {
    if (!currentStudent) {
        showNotification('❌ Geen student informatie beschikbaar', 'error');
        return;
    }
    // Gebruik een mooie RESTful URL
    const reservationURL = `/reserveren/student/${currentStudent.studentnummer}`;
    showNotification('📅 Reservatie wordt voorbereid...', 'info');
    setTimeout(() => {
        window.location.href = reservationURL;
    }, 1000);
}

// ===== UTILITY FUNCTIONS =====
function getStudentYearText(studentnummer) {
    const year = getStudentYear(studentnummer);
    return `${year}e jaar student`;
}

function getStudentYear(studentnummer) {
    const lastDigit = parseInt(studentnummer.toString().slice(-1));
    if (lastDigit >= 0 && lastDigit <= 3) return 1;
    if (lastDigit >= 4 && lastDigit <= 6) return 2;
    return 3;
}

function getDefaultKeywords(opleidingsrichting) {
    const keywordMap = {
        'Intelligent Robotics': ['AI', 'Embedded software', 'Mechatronica', 'Machine Learning', 'ROS', 'IoT', 'Sensorintegratie'],
        'Software Engineering': ['Python', 'JavaScript', 'Node.js', 'React', 'Database', 'API Design', 'DevOps'],
        'Network & Security': ['Cybersecurity', 'Firewalls', 'Network', 'Security', 'Ethical Hacking', 'Penetration Testing'],
        'Business IT': ['Data Analysis', 'Business Intelligence', 'Project Management', 'ERP Systems', 'Process Optimization'],
        'Creative Media': ['UX/UI Design', 'Frontend', 'Creative Coding', 'Digital Design', 'User Experience']
    };
    
    return keywordMap[opleidingsrichting] || ['Programming', 'Technology', 'Innovation', 'Problem Solving', 'Teamwork'];
}

// ===== LOADING STATES =====
function showLoadingState() {
    console.log('⏳ Showing loading state');
    const container = document.querySelector('.main-content, .layout');
    if (container) {
        // Don't completely replace, just show a loading indicator
        let loadingEl = document.querySelector('.loading-indicator');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'loading-indicator';
            loadingEl.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 10000;
            `;
            loadingEl.innerHTML = `
                <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #881538; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Student details laden...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loadingEl);
        }
        loadingEl.style.display = 'block';
    }
}

function hideLoadingState() {
    console.log('✅ Hiding loading state');
    const loadingEl = document.querySelector('.loading-indicator');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function showErrorState(message) {
    console.error('❌ Showing error state:', message);
    
    hideLoadingState();
    
    const mainContent = document.querySelector('.main-content, .layout');
    if (mainContent) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-state';
        errorContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 500px;
            text-align: center;
        `;
        errorContainer.innerHTML = `
            <h3 style="color: #881538; margin-bottom: 1rem;">⚠️ ${message}</h3>
            <p style="margin-bottom: 2rem;">Controleer de URL of probeer het opnieuw.</p>
            <button onclick="window.location.href='/alle-studenten'" style="background: #881538; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; margin-right: 1rem; cursor: pointer;">
                ← Terug naar alle studenten
            </button>
            <button onclick="location.reload()" style="background: #666; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
                🔄 Probeer opnieuw
            </button>
        `;
        document.body.appendChild(errorContainer);
    }
}

// ===== MOCK DATA (fallback) =====
function getMockStudentDetails(studentId) {
    console.log('🎭 Getting mock student data for ID:', studentId);
    
    const mockStudents = {
        '232': {
            studentnummer: 232,
            voornaam: 'John',
            achternaam: 'Doe',
            email: 'john.doe@student.ehb.be',
            gsm_nummer: '+32412356522',
            opleiding: 'Toegepaste informatica',
            opleidingsrichting: 'Intelligent Robotics',
            projectTitel: 'Kokende AI Robot',
            projectBeschrijving: 'De Kokende AI Robot is een geavanceerde huishoudrobot ontworpen om volledig zelfstandig maaltijden te bereiden. Uitgerust met kunstmatige intelligentie, spraakherkenning en honderden ingebouwde recepten, analyseert hij voedingsvoorkeuren, allergieën en beschikbare ingrediënten.',
            gemeente: 'Gent',
            tafelNr: 1,
            overMezelf: 'Ik ben John Doe, derdejaarsstudent Toegepaste Informatica aan de Erasmushogeschool Brussel, altijd op zoek naar de volgende technische uitdaging.',
            linkedinUrl: 'https://www.linkedin.com/in/john-doe-12a03456b/',
            githubUrl: 'https://github.com/jonddoe3',
            cvUrl: 'https://example.com/cv/dummy.pdf'
        },
        '233': {
            studentnummer: 233,
            voornaam: 'Jeretom',
            achternaam: 'Carnomina',
            email: 'jeretomcarnomina@student.ehb.be',
            gsm_nummer: '+32412356485',
            opleiding: 'Toegepaste informatica',
            opleidingsrichting: 'Software Engineering',
            projectTitel: 'NeuroTrack',
            projectBeschrijving: 'NeuroTrack is een draagbare EEG-headset die hersenactiviteit meet tijdens sport en meditatie. Het analyseert realtime biosignalen om focus, stress en cognitieve belasting te monitoren. Via een app en LED-indicatoren geeft het directe feedback voor betere prestaties en welzijn. NeuroTrack is in samenwerking met sportcoaches en mindfulness-trainers getest in real-world scenario\'s, waarbij atleten en beoefenaars van meditatie direct inzicht krijgen in hun mentale staat.',
            gemeente: 'Antwerpen',
            tafelNr: 2,
            overMezelf: 'Ik ben Jeretom Carnomina, derdejaarsstudent Toegepaste Informatica aan de Erasmushogeschool Brussel met een voorliefde voor multidisciplinaire hardware-software integratie. In mijn vrije tijd experimenteer ik graag met 3D-geprinte robotonderdelen en optimaliseer ik realtime besturingsalgoritmes.',
            linkedinUrl: 'https://www.linkedin.com/in/jeretom-carnomina-23c04567d/',
            githubUrl: 'https://github.com/jerettcarnomina',
            cvUrl: 'https://example.com/cv/dummy.pdf'
        },
        '234': {
            studentnummer: 234,
            voornaam: 'Ben',
            achternaam: 'Huur',
            email: 'ben.jan.huur@student.ehb.be',
            gsm_nummer: '+32481386514',
            opleiding: 'Toegepaste informatica',
            opleidingsrichting: 'Networks & Security',
            projectTitel: 'Geïntegreerd campus-beheer via Cisco DNA Center',
            projectBeschrijving: 'Ontwikkeling van een CI/CD-geïntegreerde workflow waarin Cisco Catalyst Center (voorheen DNA Center) APIs netwerkconfiguraties automatisch uitrollen, compliance checks uitvoeren en real-time netwerk-telemetrie aanleveren voor DevOps-teams.',
            gemeente: 'Brussel',
            tafelNr: 3,
            overMezelf: 'Ik ben Ben Huur, derdejaarsstudent Toegepaste Informatica met een passie voor backendontwikkeling, automatisatie en alles wat processen slimmer maakt.'
        }
    };
    
    const student = mockStudents[studentId];
    if (student) {
        console.log('✅ Mock student found:', student.voornaam, student.achternaam);
    } else {
        console.log('❌ No mock student found for ID:', studentId);
    }
    
    return student || null;
}

// ===== UTILITIES =====
function showNotification(message, type = 'info') {
    // Gebruik het bestaande notification system
    if (window.showNotification) {
        window.showNotification(message, type);
    } else if (window.toast) {
        window.toast[type] && window.toast[type](message);
    } else {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        alert(message); // Fallback
    }
}

// Global functions voor debugging
window.debugStudentPage = {
    currentStudent,
    studentId,
    reloadStudent: () => {
        window.location.reload();
    },
    testAPI: async () => {
        await testBackendConnectivity();
    }
};