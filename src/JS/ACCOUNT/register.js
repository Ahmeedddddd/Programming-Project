// src/JS/ACCOUNT/register.js

let currentUserType = 'bedrijf';

function switchUserType(type) {
    const bedrijfFields = document.getElementById('bedrijfFields');
    const studentFields = document.getElementById('studentFields');
    const registerTitle = document.getElementById('registerTitle');
    const registerButton = document.getElementById('registerButton');
    const toggleOptions = document.querySelectorAll('.toggle-option');
    
    currentUserType = type; // Store current type
    
    toggleOptions.forEach(option => option.classList.remove('active'));
    
    if (type === 'bedrijf') {
        bedrijfFields.classList.remove('hidden');
        studentFields.classList.add('hidden');
        registerTitle.textContent = 'Account Aanmaken als Bedrijf';
        registerButton.textContent = 'Bedrijfsaccount Aanmaken';
        toggleOptions[0].classList.add('active');
        setRequiredFields('bedrijf');
    } else if (type === 'student') {
        studentFields.classList.remove('hidden');
        bedrijfFields.classList.add('hidden');
        registerTitle.textContent = 'Account Aanmaken als Student';
        registerButton.textContent = 'Studentaccount Aanmaken';
        toggleOptions[1].classList.add('active');
        setRequiredFields('student');
    }
}

function setRequiredFields(type) {
    // Remove all required attributes first
    const allInputs = document.querySelectorAll('#registerForm input, #registerForm select');
    allInputs.forEach(input => {
        if (input.id !== 'registerPassword' && input.id !== 'confirmPassword' && input.id !== 'agreeTerms') {
            input.removeAttribute('required');
        }
    });
    
    if (type === 'bedrijf') {
        const bedrijfRequiredFields = [
            'bedrijfNaam', 'voornaam', 'achternaam', 'btwNummer',
            'emailContactpersoon', 'straat', 'nummer', 'postcode',
            'gemeente', 'telefoonnummer'
        ];
        bedrijfRequiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.setAttribute('required', 'required');
        });
    } else if (type === 'student') {
        const studentRequiredFields = [
            'studentNaam', 'studentAchternaam',
            'opleiding', 'studentMail', 'gsmNummer'
        ];
        studentRequiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.setAttribute('required', 'required');
        });
    }
}

// ✅ NEW: Form submission handler
async function handleRegistration(event) {
    event.preventDefault();
    const loadingOverlay = document.getElementById('loadingOverlay');
    const registerButton = document.getElementById('registerButton');
    try {
        loadingOverlay.style.display = 'flex';
        registerButton.disabled = true;
        // Validate passwords match
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (password !== confirmPassword) throw new Error('Wachtwoorden komen niet overeen');
        if (password.length < 8) throw new Error('Wachtwoord moet minimaal 8 karakters lang zijn');
        const agreeTerms = document.getElementById('agreeTerms').checked;
        if (!agreeTerms) throw new Error('Je moet akkoord gaan met de algemene voorwaarden');
        // Verzamel form data
        let registrationData;
        let pakket = null;
        if (currentUserType === 'bedrijf') {
            // Haal pakket info op
            const pakketVal = document.getElementById('selectedPakketInput').value;
            if (!pakketVal) throw new Error('Kies een pakket om verder te gaan.');
            pakket = JSON.parse(pakketVal);
            registrationData = {
                naam: document.getElementById('bedrijfNaam').value,
                voornaam: document.getElementById('voornaam').value,
                achternaam: document.getElementById('achternaam').value,
                TVA_nummer: document.getElementById('btwNummer').value,
                email: document.getElementById('emailContactpersoon').value,
                straatnaam: document.getElementById('straat').value,
                huisnummer: document.getElementById('nummer').value,
                postcode: document.getElementById('postcode').value,
                gemeente: document.getElementById('gemeente').value,
                gsm_nummer: document.getElementById('telefoonnummer').value,
                sector: document.getElementById('websiteLinkedin')?.value || '',
                bus: '',
                land: 'België',
                password: password,
                pakket: pakket // voeg pakket toe
            };
        } else {
            registrationData = {
                voornaam: document.getElementById('studentNaam').value,
                achternaam: document.getElementById('studentAchternaam').value,
                opleiding: document.getElementById('opleiding').value,
                email: document.getElementById('studentMail').value,
                gsm_nummer: document.getElementById('gsmNummer').value,
                password: password
            };
        }
        // Stuur registratie request
        const response = await fetch(`http://localhost:8383/api/auth/register/${currentUserType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Registratie mislukt');
        // Zet token in localStorage en als cookie (voor backend)
        if (result.token) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userType', result.user.userType);
            // Zet cookie met juiste flags (voor localhost: gebruik geen Secure, voor productie wel)
            document.cookie = `authToken=${result.token}; path=/; SameSite=Lax`;
        }
        // Succesmelding
        alert('Account succesvol aangemaakt! Je wordt doorgestuurd...');
        // Hard redirect naar juiste homepage (zorgt voor volledige reload)
        let targetUrl;
        if (result.user && result.user.userType === 'bedrijf') {
            targetUrl = '/bedrijf-homepage';
        } else if (result.user && result.user.userType === 'student') {
            targetUrl = '/student-homepage';
        } else {
            targetUrl = '/';
        }
        window.location.replace(targetUrl);
    } catch (error) {
        console.error('Registration error:', error);
        alert(`Fout bij registratie: ${error.message}`);
    } finally {
        loadingOverlay.style.display = 'none';
        registerButton.disabled = false;
    }
}

// Pakket selectie en validatie
let selectedPakket = null;

function showPakketOverlay() {
    const overlay = document.getElementById('pakketOverlay');
    const pakketList = document.getElementById('pakketList');
    const bevestigenBtn = document.getElementById('pakketBevestigenBtn');
    pakketList.innerHTML = '';
    selectedPakket = null;
    bevestigenBtn.disabled = true;
    // Pakket data hardcoded (kan later via API)
    const pakketten = [
        {
            naam: 'Bronze Partner', prijs: 160, beschrijving: [
                'Stand: 1,5m x 1,5m',
                'Duur: 1 dag',
                'Team: Maximaal 2 informanten',
                'Ideaal voor bedrijven met minder dan 20 werknemers'
            ]
        },
        {
            naam: 'Silver Partner', prijs: 460, beschrijving: [
                'Stand: 3m x 2m',
                'Duur: 1 dag',
                'Team: Maximaal 2 informanten'
            ]
        },
        {
            naam: 'Gold Partner', prijs: 650, beschrijving: [
                'Presentatie: 30 minuten',
                'Discussie: Premium vakdiscussie',
                'Stand: 3m x 2m',
                'Duur: 1 dag',
                'Tickets: 4 informanten'
            ]
        },
        {
            naam: 'Startup Pakket', prijs: 130, beschrijving: [
                'Voorwaarde: Jonger dan 5 jaar',
                'Stand: 2m x 2m',
                'Speciaal tarief voor nieuwe bedrijven'
            ]
        }
    ];
    pakketten.forEach((pakket, idx) => {
        const card = document.createElement('div');
        card.className = 'pakket-card';
        card.innerHTML = `<div class='pakket-title'>${pakket.naam}</div><div class='pakket-price'>€${pakket.prijs}</div><ul>${pakket.beschrijving.map(f => `<li>${f}</li>`).join('')}</ul>`;
        card.onclick = () => {
            document.querySelectorAll('.pakket-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPakket = pakket;
            bevestigenBtn.disabled = false;
        };
        pakketList.appendChild(card);
    });
    overlay.style.display = 'flex';
}

function hidePakketOverlay() {
    document.getElementById('pakketOverlay').style.display = 'none';
}

// Initialize when DOM is loaded
let registerForm;
document.addEventListener('DOMContentLoaded', function() {
    // File upload handler
    const fileInput = document.getElementById('bedrijfslogo');
    const fileName = document.getElementById('fileName');
    
    if (fileInput && fileName) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                fileName.textContent = this.files[0].name;
            } else {
                fileName.textContent = '';
            }
        });
    }
    
    // ✅ ADD FORM SUBMIT HANDLER
    registerForm = document.querySelector('#registerForm form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
        // Intercept submit voor bedrijf
        registerForm.addEventListener('submit', function(e) {
            if (currentUserType === 'bedrijf') {
                // Check of pakket gekozen is
                const pakketVal = document.getElementById('selectedPakketInput').value;
                if (!pakketVal) {
                    e.preventDefault();
                    showPakketOverlay();
                    return false;
                }
            }
        }, true);
    }
    
    // Pakket overlay annuleren
    document.getElementById('pakketAnnulerenBtn').onclick = hidePakketOverlay;
    // Pakket bevestigen
    document.getElementById('pakketBevestigenBtn').onclick = function() {
        hidePakketOverlay();
        // Vul hidden input met pakket info
        document.getElementById('selectedPakketInput').value = JSON.stringify(selectedPakket);
        // NIET automatisch submitten! Gebruiker klikt daarna zelf op registreren.
    };
    
    // Pakketten knop opent overlay
    const openPakketBtn = document.getElementById('openPakketOverlayBtn');
    if (openPakketBtn) {
        openPakketBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showPakketOverlay();
        });
    }
    
    // Initialize as bedrijf
    switchUserType('bedrijf');
});

// ✅ NEW: Show/hide login form functionality
function showLoginForm() {
    window.location.href = '/login';
}