/**
 * 🎓 zoekbalk-studenten.js - Student Detail Pagina voor CareerLaunch EHB
 * 
 * Dit bestand beheert de detailpagina voor individuele studenten:
 * - Dynamisch laden van studentgegevens uit URL parameters
 * - Rendering van studentprofiel met projectinformatie
 * - Contact functionaliteit en reservatie mogelijkheden
 * - Fallback naar mock data bij API problemen
 * - Responsive design ondersteuning
 * 
 * Belangrijke functionaliteiten:
 * - URL parsing voor student ID's
 * - API integratie met backend endpoints
 * - Skeleton loading states voor betere UX
 * - Error handling met gebruiksvriendelijke meldingen
 * - Mock data fallback voor offline ontwikkeling
 * - Contact en reservatie functionaliteit
 * 
 * @author CareerLaunch EHB Team
 * @version 1.0.0
 * @since 2024
 */

// Wacht tot DOM geladen is
document.addEventListener('DOMContentLoaded', async () => {
    await initializeStudentDetailPage();
});

// 🎯 Globale variabelen voor student detail management
let currentStudent = null;
let studentId = null;
const API_BASE = window.location.origin; // Gebruik dezelfde poort als frontend

/**
 * 🚀 Initialiseert de student detail pagina
 * 
 * Deze functie is het hoofdpunt voor het laden van studentgegevens:
 * - Haalt student ID uit URL parameters
 * - Test backend connectiviteit
 * - Laadt studentgegevens via API of fallback
 * - Rendert alle UI componenten
 * - Zet event listeners op
 * 
 * @returns {Promise<void>}
 * @throws {Error} Bij fouten tijdens initialisatie
 */
async function initializeStudentDetailPage() {
    try {
        showLoadingState();
        
        // Haal student ID uit URL
        studentId = getStudentIdFromURL();
        
        if (!studentId) {
            showErrorState('Geen student ID gevonden in URL');
            return;
        }
        
        // Test backend connectivity eerst
        await testBackendConnectivity();
        
        // Laad student details
        await loadStudentDetails(studentId);
        
        if (!currentStudent) {
            showErrorState('Student niet gevonden');
            return;
        }
        
        // Render student details
        renderStudentDetails();
        
        // Setup functionaliteit
        setupContactButtons();
        setupReservationButton();
        setupNavigation();
        
        hideLoadingState();
        
    } catch (error) {
        showErrorState('Er ging iets mis bij het laden van de student details: ' + error.message);
    }
}

/**
 * 🔍 Test de connectiviteit met de backend server
 * 
 * Deze functie controleert of de backend API beschikbaar is
 * voordat we proberen studentgegevens te laden
 * 
 * @returns {Promise<boolean>} True als backend bereikbaar is
 */
async function testBackendConnectivity() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        
        if (response.ok) {
            const data = await response.json();
            return true;
        } else {
            throw new Error(`Backend health check failed: ${response.status}`);
        }
        
    } catch (error) {
        showNotification('⚠️ Backend server mogelijk offline - gebruik test data', 'warning');
        return false;
    }
}

/**
 * 🔗 Haalt student ID uit URL parameters
 * 
 * Parseert de URL search parameters om het student ID te vinden
 * dat gebruikt wordt om de juiste studentgegevens te laden
 * 
 * @returns {string|null} Het student ID uit de URL of null als niet gevonden
 */
function getStudentIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    return id;
}

/**
 * 📡 Laadt studentgegevens via API of fallback
 * 
 * Deze functie probeert eerst de studentgegevens via de API te laden.
 * Als dat mislukt, wordt er teruggevallen op mock data voor ontwikkeling.
 * 
 * @param {string} studentId - Het ID van de student om te laden
 * @returns {Promise<void>}
 * @throws {Error} Als geen data beschikbaar is
 */
async function loadStudentDetails(studentId) {
    try {
        // Gebruik fetch zonder Authorization header zodat gasten deze pagina kunnen zien
        const response = await fetch(`/api/studenten/${studentId}`);
        if (!response.ok) throw new Error('Student niet gevonden');
        const data = await response.json();
        
        if (data.success && data.data) {
            currentStudent = data.data;
        } else {
            throw new Error('Invalid response format: ' + JSON.stringify(data));
        }
        
    } catch (error) {
        // Fallback: gebruik mock data voor testing
        currentStudent = getMockStudentDetails(studentId);
        
        if (currentStudent) {
            showNotification('⚠️ Offline modus: test data wordt gebruikt', 'warning');
        } else {
            throw new Error(`Geen data beschikbaar voor student ${studentId}`);
        }
    }
}

/**
 * 🎨 Rendert alle student details in de UI
 * 
 * Deze functie verwijdert skeleton loading states en rendert
 * alle studentgegevens in de verschillende secties van de pagina
 * 
 * @returns {void}
 */
function renderStudentDetails() {
    if (!currentStudent) {
        return;
    }
    
    try {
        // Remove all skeleton elements first
        const allSkeletons = document.querySelectorAll('.skeleton');
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
        
    } catch (error) {
        showErrorState('Fout bij het renderen van student details');
    }
}

/**
 * 📝 Werkt de paginatitel bij met studentnaam
 * 
 * Update zowel de hoofdtekst in de header als de browser titel
 * met de naam van de huidige student
 * 
 * @returns {void}
 */
function updatePageTitle() {
    // Update main title in header
    const siteTitle = document.querySelector('.site-title');
    if (siteTitle) {
        // Remove any skeleton first
        const skeleton = siteTitle.querySelector('.skeleton');
        if (skeleton) {
            skeleton.remove();
        }
        siteTitle.textContent = `${currentStudent.voornaam} ${currentStudent.achternaam}`;
    }
    
    // Update browser title
    document.title = `${currentStudent.voornaam} ${currentStudent.achternaam} – Portfolio & Reservatie`;
}

/**
 * 🎨 Rendert de header sectie met studentinformatie
 * 
 * Voegt studentinformatie toe aan de header van de pagina
 * inclusief opleidingsrichting en andere relevante details
 * 
 * @returns {void}
 */
function renderHeader() {
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
        }
    }
}

/**
 * 🎨 Rendert de project sectie
 * 
 * Toont het project van de student met titel, beschrijving en kernwoorden.
 * Als er geen project is, wordt een placeholder getoond.
 * 
 * @returns {void}
 */
function renderProject() {
    const projectSection = document.querySelector('.section-project');
    if (!projectSection) {
        return;
    }
    
    if (!currentStudent.projectTitel || currentStudent.projectTitel.trim() === '') {
        projectSection.innerHTML = `
            <h2>Mijn Project</h2>
            <div class="no-project">
                <p>Deze student heeft nog geen project beschrijving toegevoegd.</p>
            </div>
        `;
        return;
    }
    
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
}

/**
 * 🔧 Rendert project kernwoorden
 * 
 * Voegt relevante kernwoorden toe aan het project op basis van
 * de opleidingsrichting van de student
 * 
 * @returns {void}
 */
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
    }
}

/**
 * 📝 Rendert de "Over mezelf" sectie
 * 
 * Toont informatie over de student, inclusief een persoonlijke beschrijving
 * en projectinformatie indien beschikbaar
 * 
 * @returns {void}
 */
function renderAboutSection() {
    const aboutSection = document.querySelector('.section-over');
    if (!aboutSection) {
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
}

/**
 * 📞 Rendert contactinformatie
 * 
 * Toont alle beschikbare contactgegevens van de student inclusief
 * telefoon, email, locatie en tafelnummer voor het evenement
 * 
 * @returns {void}
 */
function renderContactInfo() {
    // 🔧 FIX: Proper tafel number logic
    const rawTafelNr = currentStudent.tafelNr;
    const displayTafelNr = (rawTafelNr !== null && rawTafelNr !== undefined && rawTafelNr !== '') 
        ? rawTafelNr 
        : 'TBD';
    
    // Handle standalone tafel element if it exists
    const tafelElement = document.querySelector('.tafel-nummer');
    if (tafelElement) {
        tafelElement.textContent = displayTafelNr !== 'TBD' 
            ? `Tafel ${displayTafelNr}` 
            : 'Tafel TBD';
    }
   
    const infoLinks = document.querySelector('.info-links ul');
    if (!infoLinks) {
        return;
    }
   
    // Clear all existing content including skeletons
    infoLinks.innerHTML = '';
    
    // Add phone number if available
    if (currentStudent.gsm_nummer) {
        const phoneLi = document.createElement('li');
        phoneLi.innerHTML = `
            <a href="tel:${currentStudent.gsm_nummer}">
                <i class="fas fa-phone"></i>
                <span>${currentStudent.gsm_nummer}</span>
            </a>
        `;
        infoLinks.appendChild(phoneLi);
    }
    
    // Add email if available
    if (currentStudent.email) {
        const emailLi = document.createElement('li');
        emailLi.innerHTML = `
            <a href="mailto:${currentStudent.email}">
                <i class="fas fa-envelope"></i>
                <span>${currentStudent.email}</span>
            </a>
        `;
        infoLinks.appendChild(emailLi);
    }
    
    // Add location if available
    if (currentStudent.gemeente) {
        const locationLi = document.createElement('li');
        locationLi.innerHTML = `
            <span>
                <i class="fas fa-map-marker-alt"></i>
                <span>${currentStudent.gemeente}</span>
            </span>
        `;
        infoLinks.appendChild(locationLi);
    }
    
    // Add table number
    const tableLi = document.createElement('li');
    if (displayTafelNr !== 'TBD') {
        tableLi.innerHTML = `
            <span>
                <i class="fas fa-table"></i>
                <span>Tafel ${displayTafelNr}</span>
            </span>
        `;
    } else {
        tableLi.innerHTML = `
            <span>
                <i class="fas fa-table"></i>
                <span>Tafel TBD</span>
            </span>
        `;
    }
    infoLinks.appendChild(tableLi);
}

/**
 * 🔗 Rendert profiel links
 * 
 * Toont links naar gerelateerde pagina's zoals gegevens,
 * project en reservatie functionaliteit
 * 
 * @returns {void}
 */
function renderProfileLinks() {
    const profileLinks = document.querySelector('.profile-links');
    if (!profileLinks) {
        return;
    }
    
    // Clear existing content
    profileLinks.innerHTML = '';
    
    // Add profile links
    const links = [
        {
            url: `/gegevens-student?id=${currentStudent.studentnummer}`,
            text: 'Mijn Gegevens',
            icon: 'fas fa-user'
        },
        {
            url: `/mijn-project?id=${currentStudent.studentnummer}`,
            text: 'Mijn Project',
            icon: 'fas fa-project-diagram'
        },
        {
            url: `/gesprekken-overzicht-studenten?id=${currentStudent.studentnummer}`,
            text: 'Mijn Gesprekken',
            icon: 'fas fa-calendar-alt'
        }
    ];
    
    links.forEach(link => {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.innerHTML = `
            <a href="${link.url}">
                <i class="${link.icon}"></i>
                <span>${link.text}</span>
            </a>
        `;
        profileLinks.appendChild(linkItem);
    });
}

/**
 * 📞 Zet contact knoppen op
 * 
 * Initialiseert event listeners voor contact functionaliteit
 * zoals telefoon en email links
 * 
 * @returns {void}
 */
function setupContactButtons() {
    // Contact buttons worden automatisch werkend door de HTML structure
    // Geen extra JavaScript nodig voor basis functionaliteit
}

/**
 * 📅 Zet reservatie knop op
 * 
 * Initialiseert de reservatie functionaliteit voor het
 * boeken van gesprekken met deze student
 * 
 * @returns {void}
 */
function setupReservationButton() {
    const reserveBtn = document.querySelector('.btn-reserve');
    if (reserveBtn) {
        reserveBtn.addEventListener('click', handleReservation);
    }
}

/**
 * 🧭 Zet navigatie op
 * 
 * Initialiseert navigatie functionaliteit zoals
 * terug knoppen en breadcrumbs
 * 
 * @returns {void}
 */
function setupNavigation() {
    // Navigatie functionaliteit wordt automatisch afgehandeld
}

/**
 * 📅 Handelt reservatie aanvraag af
 * 
 * Navigeert naar de reservatie pagina voor deze student
 * 
 * @returns {void}
 */
function handleReservation() {
    const url = `/reservatie?studentId=${currentStudent.studentnummer}`;
    window.location.href = url;
}

/**
 * 📊 Converteert studentnummer naar jaar tekst
 * 
 * Bepaalt het studiejaar op basis van het studentnummer
 * 
 * @param {string} studentnummer - Het studentnummer
 * @returns {string} Het studiejaar als tekst
 */
function getStudentYearText(studentnummer) {
    const year = getStudentYear(studentnummer);
    switch(year) {
        case 1: return '1e jaar';
        case 2: return '2e jaar';
        case 3: return '3e jaar';
        case 4: return 'Master';
        default: return 'Onbekend jaar';
    }
}

/**
 * 🔢 Bepaalt studiejaar uit studentnummer
 * 
 * @param {string} studentnummer - Het studentnummer
 * @returns {number} Het studiejaar (1-4)
 */
function getStudentYear(studentnummer) {
    if (!studentnummer) return 1;
    const year = parseInt(studentnummer.toString().substring(0, 1));
    return year >= 1 && year <= 4 ? year : 1;
}

/**
 * 🏷️ Genereert standaard kernwoorden per opleiding
 * 
 * @param {string} opleidingsrichting - De opleidingsrichting
 * @returns {Array<string>} Array van relevante kernwoorden
 */
function getDefaultKeywords(opleidingsrichting) {
    const keywords = {
        'Dagtraject Toegepaste informatica': ['JavaScript', 'Python', 'Web Development', 'Database', 'API'],
        'Werktraject Toegepaste informatica': ['JavaScript', 'Python', 'Web Development', 'Database', 'API'],
        'Graduaat Programmeren': ['Programming', 'Software Development', 'Problem Solving', 'Algorithms'],
        'Graduaat IOT': ['IoT', 'Embedded Systems', 'Sensors', 'Connectivity', 'Hardware'],
        'Multimedia & Creatieve Technologie': ['Design', 'Creative Technology', 'Multimedia', 'User Experience']
    };
    
    return keywords[opleidingsrichting] || ['Technology', 'Innovation', 'Problem Solving'];
}

/**
 * ⏳ Toont loading state
 * 
 * Verbergt content en toont loading indicator
 * 
 * @returns {void}
 */
function showLoadingState() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.opacity = '0.5';
        mainContent.style.pointerEvents = 'none';
    }
    
    // Show loading overlay if it exists
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * ✅ Verbergt loading state
 * 
 * Toont content en verbergt loading indicator
 * 
 * @returns {void}
 */
function hideLoadingState() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.opacity = '1';
        mainContent.style.pointerEvents = 'auto';
    }
    
    // Hide loading overlay if it exists
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * ❌ Toont error state
 * 
 * Toont een foutmelding aan de gebruiker
 * 
 * @param {string} message - De foutmelding om te tonen
 * @returns {void}
 */
function showErrorState(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-state">
                <h2>Er is iets misgegaan</h2>
                <p>${message}</p>
                <button onclick="window.location.reload()" class="retry-btn">Opnieuw proberen</button>
            </div>
        `;
    }
}

/**
 * 🎭 Genereert mock student data voor ontwikkeling
 * 
 * Deze functie biedt test data voor wanneer de API niet beschikbaar is
 * 
 * @param {string} studentId - Het student ID
 * @returns {Object|null} Mock student object of null
 */
function getMockStudentDetails(studentId) {
    const mockStudents = {
        '1': {
            studentnummer: '1',
            voornaam: 'Jan',
            achternaam: 'Janssens',
            email: 'jan.janssens@student.ehb.be',
            gsm_nummer: '+32 470 123 456',
            gemeente: 'Brussel',
            opleiding: 'Dagtraject Toegepaste informatica',
            opleidingsrichting: 'Dagtraject Toegepaste informatica',
            projectTitel: 'Smart City Dashboard',
            projectBeschrijving: 'Een innovatief dashboard voor het monitoren van stedelijke data in real-time.',
            overMezelf: 'Passionele ontwikkelaar met interesse in smart city technologieën.',
            tafelNr: 'A1'
        },
        '2': {
            studentnummer: '2',
            voornaam: 'Marie',
            achternaam: 'Maertens',
            email: 'marie.maertens@student.ehb.be',
            gsm_nummer: '+32 470 234 567',
            gemeente: 'Antwerpen',
            opleiding: 'Graduaat Programmeren',
            opleidingsrichting: 'Graduaat Programmeren',
            projectTitel: 'E-commerce Platform',
            projectBeschrijving: 'Een volledig functioneel e-commerce platform gebouwd met moderne technologieën.',
            overMezelf: 'Software developer gespecialiseerd in web development en user experience.',
            tafelNr: 'B2'
        }
    };
    
    const student = mockStudents[studentId];
    if (student) {
        return student;
    }
    
    return null;
}

/**
 * 📢 Toont notificatie aan gebruiker
 * 
 * Deze functie toont een notificatie met verschillende types
 * 
 * @param {string} message - De melding om te tonen
 * @param {string} type - Het type notificatie ('info', 'success', 'warning', 'error')
 * @returns {void}
 */
function showNotification(message, type = 'info') {
    // Fallback naar alert als geen notificatie systeem beschikbaar is
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}