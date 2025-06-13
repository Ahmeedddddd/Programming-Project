function switchUserType(type) {
    const bedrijfFields = document.getElementById('bedrijfFields');
    const studentFields = document.getElementById('studentFields');
    const registerTitle = document.getElementById('registerTitle');
    const registerButton = document.getElementById('registerButton');
    const toggleOptions = document.querySelectorAll('.toggle-option');
    
toggleOptions.forEach(option => option.classList.remove('active'));
    
    if (type === 'bedrijf') {
    
        bedrijfFields.classList.remove('hidden');
        studentFields.classList.add('hidden');

         registerTitle.textContent = 'Account Aanmaken als Bedrijf';
        registerButton.textContent = 'Bedrijfsaccount Aanmaken';

        toggleOptions[0].classList.add('active');

         // Reset required attributen
        setRequiredFields('bedrijf');
        
    } else if (type === 'student') {
        // Toon student velden, verberg bedrijf velden
        studentFields.classList.remove('hidden');
        bedrijfFields.classList.add('hidden');
        
        // Update titel en button tekst
        registerTitle.textContent = 'Account Aanmaken als Student';
        registerButton.textContent = 'Studentaccount Aanmaken';
        
        // Markeer student toggle als actief
        toggleOptions[1].classList.add('active');
        
        // Reset required attributen
        setRequiredFields('student');
    }
}

function setRequiredFields(type) {
    // Verwijder alle required attributen eerst
    const allInputs = document.querySelectorAll('#registerForm input, #registerForm select');
    allInputs.forEach(input => {
        if (input.id !== 'registerPassword' && input.id !== 'confirmPassword' && input.id !== 'agreeTerms') {
            input.removeAttribute('required');
        }
    });
    
    if (type === 'bedrijf') {
        // Zet required voor bedrijf velden
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
        // Zet required voor student velden
        const studentRequiredFields = [
            'studentNaam', 'studentAchternaam', 'studentennummer', 
            'opleiding', 'studentMail', 'gsmNummer'
        ];
        studentRequiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.setAttribute('required', 'required');
        });
    }
}

// File upload handler
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Initialiseer als bedrijf
    switchUserType('bedrijf');
});