// gegevens-bedrijf.js - Bedrijf gegevens ophalen en weergeven

console.log("🚀 Bedrijf gegevens script geladen");

// 🔔 Notification System
window.showNotification = function (message, type = "success") {
    const container = document.getElementById("notification-container");
    if (!container) {
        console.warn("⚠️ Notification container not found");
        return;
    }

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add("show"), 100);

    // Auto remove
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, 4000);
};

class BedrijfGegevens { // Naam van klasse gewijzigd
    constructor() {
        console.log("📝 BedrijfGegevens constructor aangeroepen");
        this.token = localStorage.getItem("authToken");
        this.bedrijfData = null; // studentData naar bedrijfData
        this.initialBedrijfData = null; // initialStudentData naar initialBedrijfData
        this.editMode = false;
        // projectEditMode is verwijderd, omdat dit niet van toepassing is op bedrijven
        this.form = document.getElementById("bedrijfForm"); // studentForm naar bedrijfForm

        // Initialize
        this.init();
    }

    async init() {
        console.log("🚀 Initializing BedrijfGegevens"); // Console log aangepast
        if (!this.token) {
            console.warn("⚠️ No token found");
            this.redirectToLogin();
            return;
        }

        try {
            await this.loadBedrijfGegevens();
            this.setupEventListeners();
            // setupProjectHandling is verwijderd
        } catch (error) {
            console.error("❌ Initialisatie mislukt:", error);
            this.showError("Er ging iets mis bij het laden van je gegevens");
        }
    }

    // 📡 API Calls
    async loadBedrijfGegevens() { // Naam van functie gewijzigd
        console.log("📡 Loading bedrijf gegevens..."); // Console log aangepast
        try {
            this.showLoading(true);

            const response = await fetch(
                "http://localhost:3301/api/bedrijven/profile", // API endpoint gewijzigd
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("📡 API Response status:", response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("🔒 Unauthorized, redirecting to login");
                    this.redirectToLogin();
                    return;
                }
                const errorResult = await response
                    .json()
                    .catch(() => ({ message: response.statusText || "Onbekende fout" }));
                console.error(
                    "❌ Fout bij laden bedrijfgegevens, respons:", // Console log aangepast
                    errorResult
                );
                throw new Error(`HTTP ${response.status}: ${errorResult.message}`);
            }

            const result = await response.json();
            console.log("📦 API Result:", result);

            if (result.success) {
                this.bedrijfData = result.data; // studentData naar bedrijfData
                this.initialBedrijfData = { ...result.data }; // initialStudentData naar initialBedrijfData
                console.log("✅ Bedrijf data loaded:", this.bedrijfData); // Console log aangepast
                this.displayBedrijfGegevens(); // Naam van functie gewijzigd
                // displayProjectInfo is verwijderd
            } else {
                console.error("❌ Server gaf aan dat laden mislukt is:", result); // Console log aangepast
                throw new Error(result.message || "Onbekende fout bij laden");
            }
        } catch (error) {
            console.error("❌ Error loading bedrijf gegevens:", error); // Console log aangepast
            this.showError("Kan gegevens niet laden: " + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async updateBedrijfGegevens(updatedFields) { // Naam van functie gewijzigd
        console.log("📝 Preparing to update bedrijf gegevens..."); // Console log aangepast
        console.log("💡 Fields to update:", updatedFields);

        this.bedrijfData = { ...this.bedrijfData, ...updatedFields }; // studentData naar bedrijfData

        try {
            this.showLoading(true);

            const response = await fetch(
                "http://localhost:3301/api/bedrijven/profile", // API endpoint gewijzigd
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(this.bedrijfData), // studentData naar bedrijfData
                }
            );

            const result = await response.json().catch(() => {
                return {
                    success: false,
                    message:
                        response.statusText ||
                        "Server respons was geen geldige JSON of leeg.",
                };
            });

            console.log("📝 Update API response result:", result);

            if (response.ok && result.success) {
                this.bedrijfData = result.data; // studentData naar bedrijfData
                this.initialBedrijfData = { ...result.data }; // initialStudentData naar initialBedrijfData
                this.displayBedrijfGegevens(); // Naam van functie gewijzigd
                // displayProjectInfo is verwijderd
                this.disableEditMode(); // Schakel de algemene bewerkingsmodus uit
                // disableProjectEditMode is verwijderd
                this.showSuccess("Gegevens succesvol bijgewerkt!");
            } else {
                this.bedrijfData = { ...this.initialBedrijfData }; // studentData naar bedrijfData
                this.displayBedrijfGegevens(); // Naam van functie gewijzigd
                // displayProjectInfo is verwijderd

                console.error(
                    "❌ Fout bij bijwerken, HTTP Status:",
                    response.status,
                    "Status Text:",
                    response.statusText,
                    "Result:",
                    result
                );
                throw new Error(
                    result.message || `Update mislukt (HTTP ${response.status})`
                );
            }
        } catch (error) {
            console.error("❌ Error updating bedrijf:", error); // Console log aangepast
            this.showError("Update mislukt: " + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // 🎨 UI Updates
    displayBedrijfGegevens() { // Naam van functie gewijzigd
        console.log("🎨 Displaying bedrijf gegevens"); // Console log aangepast
        if (!this.bedrijfData) { // studentData naar bedrijfData
            console.warn("⚠️ No bedrijf data to display"); // Console log aangepast
            return;
        }

        const data = this.bedrijfData; // studentData naar bedrijfData

        // Update bedrijf gegevens (allemaal niet-bewerkbaar in de HTML, maar worden hier bijgewerkt)
        this.updateField("bedrijfsnummer", data.bedrijfsnummer);
        this.updateField("bedrijfsnaam", data.naam);
        this.updateField("tva-nummer", data.TVA_nummer);
        this.updateField("sector", data.sector);
        this.updateField("email", data.email);
        this.updateField("telefoon", data.gsm_nummer);
        this.updateField("straatnaam", data.straatnaam);
        this.updateField("huisnummer", data.huisnummer);
        this.updateField("bus", data.bus);
        this.updateField("postcode", data.postcode);
        this.updateField("gemeente", data.gemeente);
        this.updateField("land", data.land);


        // Account info (niet bewerkbaar)
        this.updateField("account-status", "Actief en Geverifieerd");
        this.updateField(
            "last-login",
            "Vandaag om " +
            new Date().toLocaleTimeString("nl-BE", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );

        const accountCreated = document.getElementById("account-created");
        const lastUpdated = document.getElementById("last-updated");
        if (accountCreated)
            accountCreated.textContent = `Account aangemaakt: ${new Date().getFullYear()}`;
        if (lastUpdated)
            lastUpdated.textContent = `Laatste update: ${new Date().toLocaleDateString(
                "nl-BE"
            )}`;

        console.log("✅ UI updated successfully");
    }

    // PROJECT MANAGEMENT functies zijn volledig verwijderd
    // updateProjectLinks, updateProjectStats, calculateProjectCompletion, setupProjectHandling,
    // enableProjectEditMode, disableProjectEditMode, getProjectFieldValue, getProjectFieldLabel,
    // getFieldPlaceholder (project-specifiek), saveProjectChanges, getProjectFieldMapping, validateProjectData zijn verwijderd

    isValidUrl(string) { // Deze functie behouden voor algemene URL validatie indien nodig in de toekomst.
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    updateField(fieldId, value) {
        const field = document.querySelector(`[data-field="${fieldId}"]`);
        if (field) {
            const valueSpan = field.querySelector(".field-value");
            if (valueSpan) {
                const displayValue = value || "Niet ingevuld";
                valueSpan.textContent = displayValue;
            } else {
                console.warn(`⚠️ .field-value span not found for ${fieldId}.`);
            }
        } else {
            console.warn(`⚠️ Field container not found: ${fieldId}`);
        }
    }

    // ✏️ Edit Mode Management
    enableEditMode() { // Aangepast voor Bedrijf
        console.log("✏️ Enabling edit mode for Bedrijf"); // Console log aangepast
        this.editMode = true;
        // projectEditMode is verwijderd, was this.projectEditMode = false;

        document.getElementById("viewControls").style.display = "none";
        document.getElementById("editControls").style.display = "flex";
        // projectEditControls is verwijderd
        
        // Definieer hier expliciet welke velden voor een bedrijf bewerkbaar zijn
        const companyEditableFieldIds = [
            'bedrijfsnaam', 'tva-nummer', 'sector', 'email', 'telefoon',
            'straatnaam', 'huisnummer', 'bus', 'postcode', 'gemeente', 'land'
        ];

        document.querySelectorAll('.editable-field').forEach(fieldDiv => {
            const fieldId = fieldDiv.getAttribute('data-field');
            const displaySpan = fieldDiv.querySelector('.display-mode');
            const editInput = fieldDiv.querySelector('.edit-mode');

            if (companyEditableFieldIds.includes(fieldId)) {
                // Toon de input, verberg de span
                if (displaySpan) displaySpan.style.display = 'none';
                if (editInput) {
                    editInput.value = this.getFieldValue(fieldId);
                    editInput.style.display = (editInput.tagName === 'TEXTAREA' ? 'block' : 'inline-block'); // Voor textarea, gebruik 'block'
                    // Styling consistentie
                    editInput.style.width = '250px';
                    editInput.style.marginLeft = '0.5rem';
                    editInput.style.padding = '0.5rem';
                    editInput.style.border = '2px solid #881538';
                    editInput.style.borderRadius = '8px';
                }
            } else {
                // Niet bewerkbaar in deze modus, zorg dat het in display mode blijft
                if (displaySpan) displaySpan.style.display = 'inline-block'; // of 'block' voor tekstarea's
                if (editInput) editInput.style.display = 'none';
            }
        });
        // Specifieke niet-bewerkbare velden die sowieso altijd in display mode zijn:
        // bedrijfsnummer, account-status, last-login etc. worden niet geraakt door de .editable-field selector
    }

    disableEditMode() { // Aangepast voor Bedrijf
        console.log("❌ Disabling edit mode for Bedrijf"); // Console log aangepast
        this.editMode = false;
        this.bedrijfData = { ...this.initialBedrijfData }; // studentData naar bedrijfData

        document.getElementById("viewControls").style.display = "flex";
        document.getElementById("editControls").style.display = "none";
        // projectEditControls is verwijderd

        document.querySelectorAll('.editable-field .edit-mode').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.editable-field .display-mode').forEach(el => el.style.display = 'inline-block');

        this.displayBedrijfGegevens(); // Naam van functie gewijzigd
        // displayProjectInfo is verwijderd
    }

    // createEditableFields en createEditableProjectFields zijn verwijderd.

    getFieldMapping(fieldId) { // Aangepast voor Bedrijf
        const mapping = {
            'bedrijfsnaam': 'naam',
            'tva-nummer': 'TVA_nummer',
            'sector': 'sector',
            'email': 'email',
            'telefoon': 'gsm_nummer',
            'straatnaam': 'straatnaam',
            'huisnummer': 'huisnummer',
            'bus': 'bus',
            'postcode': 'postcode',
            'gemeente': 'gemeente',
            'land': 'land'
        };
        return mapping[fieldId];
    }

    getInputType(fieldId) { // Aangepast voor Bedrijf (geen leerjaar meer, etc.)
        const typeMapping = {
            email: "email",
            telefoon: "tel",
            postcode: "text",
            huisnummer: "text",
            // leerjaar is verwijderd
        };
        return typeMapping[fieldId] || "text";
    }

    getFieldValue(fieldId) { // Aangepast voor Bedrijf (mapping is al in getFieldMapping)
        const mappedField = this.getFieldMapping(fieldId);
        return mappedField ? this.bedrijfData[mappedField] || "" : "";
    }

    // 📝 Form Handling
    setupEventListeners() {
        console.log("👂 Setting up event listeners");

        // Edit button (general data)
        const editBtn = document.getElementById("editBtn");
        if (editBtn) {
            editBtn.addEventListener("click", () => this.enableEditMode());
        }

        // Cancel button for general data
        const cancelBtn = document.getElementById("cancelBtn");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => this.disableEditMode());
        }

        // Save button for general data
        const saveGeneralBtn = document.getElementById("saveGeneralBtn"); // ID gewijzigd van saveBtn naar saveGeneralBtn
        if (saveGeneralBtn) {
            saveGeneralBtn.addEventListener("click", () => this.saveChanges()); // Naam van functie gewijzigd
        }

        // Project specifieke knoppen zijn verwijderd
        // Neutraliseer eventuele form submit (indien je een <form> element toevoegt)
        if (this.form) {
            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                console.warn("Form submit event prevented. All saves should go through dedicated buttons.");
            });
        }
    }

    async saveChanges() { // Naam van functie gewijzigd van saveGeneralChanges
        console.log("💾 Saving company changes"); // Console log aangepast

        const formData = {};
        // Lijst van bewerkbare velden voor bedrijven
        const companyEditableFieldIds = [
            'bedrijfsnaam', 'tva-nummer', 'sector', 'email', 'telefoon',
            'straatnaam', 'huisnummer', 'bus', 'postcode', 'gemeente', 'land'
        ];

        companyEditableFieldIds.forEach(fieldId => {
            const input = document.getElementById(`edit-${fieldId}`);
            if (input) {
                const mappedField = this.getFieldMapping(fieldId);
                if (mappedField) {
                    formData[mappedField] = input.value.trim();
                }
            }
        });

        console.log("📦 Company data to save:", formData); // Console log aangepast
        await this.updateBedrijfGegevens(formData); // Naam van functie gewijzigd
    }


    // 🔧 Utility Methods
    showLoading(show) {
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) {
            overlay.style.display = show ? "flex" : "none";
        }
    }

    showError(message) {
        console.error("❌ Error:", message);
        if (window.showNotification) {
            window.showNotification(message, "error");
        } else {
            console.error(
                "Notification system not available, showing alert: " + message
            );
        }
    }

    showSuccess(message) {
        console.log("✅ Success:", message);
        if (window.showNotification) {
            window.showNotification(message, "success");
        } else {
            console.log(
                "Notification system not available, showing alert: " + message
            );
        }
    }

    redirectToLogin() {
        console.log("🔄 Redirecting to login");
        localStorage.removeItem("authToken");
        window.location.href = "/login";
    }
}

// 🚀 Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("🎯 DOM Content Loaded, initializing BedrijfGegevens"); // Console log aangepast
    try {
        window.bedrijfGegevensManager = new BedrijfGegevens(); // Naam van instantie gewijzigd
        console.log("✅ BedrijfGegevens initialized successfully"); // Console log aangepast
    } catch (error) {
        console.error("❌ Failed to initialize BedrijfGegevens:", error); // Console log aangepast
    }
});

// Export for module usage
export default BedrijfGegevens; // Naam van export gewijzigd