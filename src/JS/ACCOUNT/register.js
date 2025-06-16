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
        // Show loading
        loadingOverlay.style.display = 'flex';
        registerButton.disabled = true;
        
        // Validate passwords match
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            throw new Error('Wachtwoorden komen niet overeen');
        }
        
        if (password.length < 8) {
            throw new Error('Wachtwoord moet minimaal 8 karakters lang zijn');
        }
        
        // Check terms agreement
        const agreeTerms = document.getElementById('agreeTerms').checked;
        if (!agreeTerms) {
            throw new Error('Je moet akkoord gaan met de algemene voorwaarden');
        }
        
        // Collect form data based on user type
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
                bus: '', // Optional field
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
        
        // Send registration request
        const response = await fetch(`http://localhost:3301/api/auth/register/${currentUserType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Registratie mislukt');
        }
        
        // Success! Store token and redirect
        if (result.token) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userType', result.user.userType);
        }
        
        // Show success message
        alert('Account succesvol aangemaakt! Je wordt doorgestuurd...');
        
        // Redirect based on user type
        if (currentUserType === 'bedrijf') {
            window.location.href = '/accountBedrijf';
        } else {
            window.location.href = '/accountStudent';
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        alert(`Fout bij registratie: ${error.message}`);
    } finally {
        // Hide loading
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
    
    // Initialize as bedrijf
    switchUserType('bedrijf');
});

// ✅ NEW: Show/hide login form functionality
function showLoginForm() {
    window.location.href = '/login';
}