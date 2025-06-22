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
        if (currentUserType === 'bedrijf') {
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
                password: password
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

// Initialize when DOM is loaded
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
    const registerForm = document.querySelector('#registerForm form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Voeg stap 2 (pakketkeuze) toe als bedrijf
    if (currentUserType === 'bedrijf') {
        showStep1();
    }
    
    // Initialize as bedrijf
    switchUserType('bedrijf');
});

// ✅ NEW: Show/hide login form functionality
function showLoginForm() {
    window.location.href = '/login';
}

function showStep2() {
    // Verberg registratieformulier, toon pakketkeuze
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('packageStep').classList.remove('hidden');
}

function showStep1() {
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('packageStep').classList.add('hidden');
}

// PATCH: Toon "Volgende stap" knop voor bedrijven
function updateRegisterButton() {
    const registerButton = document.getElementById('registerButton');
    if (currentUserType === 'bedrijf') {
        registerButton.textContent = 'Volgende stap';
        registerButton.onclick = function(e) {
            e.preventDefault();
            showStep2();
        };
    } else {
        registerButton.textContent = 'Studentaccount Aanmaken';
        registerButton.onclick = null;
    }
}

// Call updateRegisterButton bij switchUserType
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
    updateRegisterButton();
}

// PATCH: Pakketkeuze stap HTML toevoegen (voorbeeld, voeg in je HTML toe)
// <div id="packageStep" class="hidden">
//   <h2>Kies een pakket</h2>
//   <div id="packageOptions">
//     <!-- Dynamisch gegenereerde pakketten -->
//   </div>
//   <button id="finalRegisterBtn">Bedrijfsaccount Aanmaken</button>
//   <button onclick="showStep1()">Terug</button>
// </div>

// PATCH: Dynamisch pakketten tonen en keuze opslaan
const packages = [
    { id: 'bronze', name: 'Bronze Partner', price: 160 },
    { id: 'silver', name: 'Silver Partner', price: 460 },
    { id: 'gold', name: 'Gold Partner', price: 650 },
    { id: 'startup', name: 'Startup Pakket', price: 130 }
];
let selectedPackage = null;

function renderPackages() {
    const container = document.getElementById('packageOptions');
    container.innerHTML = '';
    packages.forEach(pkg => {
        const btn = document.createElement('button');
        btn.textContent = `${pkg.name} (€${pkg.price})`;
        btn.className = 'package-btn';
        btn.onclick = () => {
            selectedPackage = pkg;
            document.querySelectorAll('.package-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
        container.appendChild(btn);
    });
}

// PATCH: Final registratie knop
if (document.getElementById('finalRegisterBtn')) {
    document.getElementById('finalRegisterBtn').onclick = async function(e) {
        e.preventDefault();
        if (!selectedPackage) {
            alert('Selecteer eerst een pakket.');
            return;
        }
        // Vul hidden field in met pakket info
        document.getElementById('selectedPackage').value = selectedPackage.id;
        // Trigger originele registratie
        await handleRegistration(new Event('submit'));
    };
}

// PATCH: In handleRegistration, voeg pakket toe aan registrationData
// ...existing code...
if (currentUserType === 'bedrijf') {
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
        pakket: selectedPackage ? selectedPackage.id : null,
        pakketPrijs: selectedPackage ? selectedPackage.price : null,
    };
}
// ...existing code...

// PATCH: Toon bevestigingsbericht na registratie (bedrijf of student)
function showSuccessDialog() {
    alert('Uw inschrijving is succesvol ontvangen.\n\nU ontvangt spoedig een e-mail met uw inschrijvingsgegevens en de factuur.\n\nMocht u binnen 10 minuten geen e-mail ontvangen, neem dan contact op met de organisator.');
}

// PATCH: Stuur factuurmail na registratie (server moet endpoint /api/send-invoice ondersteunen)
// (Client stuurt automatisch factuurdata na registratie, zie sendInvoice.js)   