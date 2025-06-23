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

// ✅ VERNIEUWD: Form submission handler voor registratie
async function handleRegistration(event) {
    event.preventDefault();
    const loadingOverlay = document.getElementById('loadingOverlay');
    const registerButton = document.getElementById('registerButton');
    try {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        if (registerButton) registerButton.disabled = true;
        // Validatie wachtwoorden
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
                opleidingsrichting: '',
                projectTitel: '',
                projectBeschrijving: '',
                overMezelf: '',
                huisnummer: '',
                straatnaam: '',
                gemeente: '',
                postcode: '',
                bus: '',
                evenementId: 1,
                leerjaar: 3,
                tafelNr: 1,
                password: password
            };
        }
        // Stuur registratie request
        console.log('Registratie data:', JSON.stringify(registrationData)); // Debug: log payload
        const endpoint = `http://localhost:8383/api/auth/register/${currentUserType === 'bedrijf' ? 'bedrijf' : 'student'}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });
        const result = await response.json();
        if (!response.ok) {
            // Toon backend validatiefouten indien aanwezig
            if (result.details && Array.isArray(result.details)) {
                const detailMsg = result.details.map(e => e.msg).join('\n');
                throw new Error(detailMsg || result.message || 'Registratie mislukt');
            }
            throw new Error(result.message || 'Registratie mislukt');
        }
        // Zet token in localStorage en als cookie (voor backend)
        if (result.token) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userType', result.user.userType);
            document.cookie = `authToken=${result.token}; path=/; SameSite=Lax`;
        }
        // Succesmelding
        alert('Account succesvol aangemaakt! Je wordt doorgestuurd...');
        // Redirect naar juiste homepage
        let targetUrl = '/';
        if (result.user && result.user.userType === 'bedrijf') {
            targetUrl = '/bedrijf-homepage';
        } else if (result.user && result.user.userType === 'student') {
            targetUrl = '/student-homepage';
        }
        window.location.replace(targetUrl);
    } catch (error) {
        console.error('Registration error:', error);
        alert(`Fout bij registratie: ${error.message}`);
    } finally {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (registerButton) registerButton.disabled = false;
    }
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
    }
    // Initialize as bedrijf
    switchUserType('bedrijf');
});

// ✅ NEW: Show/hide login form functionality
function showLoginForm() {
    window.location.href = '/login';
}