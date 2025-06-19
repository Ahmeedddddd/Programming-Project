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

class BedrijfGegevens {
    constructor() {
        console.log("📝 BedrijfGegevens constructor aangeroepen");
        this.token = localStorage.getItem("authToken");
        this.bedrijfData = null;
        this.initialBedrijfData = null;
        this.editMode = false;
        this.form = document.getElementById("bedrijfForm");

        // Initialize
        this.init();
    }

    async init() {
        console.log("🚀 Initializing BedrijfGegevens");
        if (!this.token) {
            console.warn("⚠️ No token found");
            this.redirectToLogin();
            return;
        }

        try {
            await this.loadBedrijfGegevens();
            this.setupEventListeners();
        } catch (error) {
            console.error("❌ Initialisatie mislukt:", error);
            this.showError("Er ging iets mis bij het laden van je gegevens");
        }
    }

    // 📡 API Calls
    async loadBedrijfGegevens() {
        console.log("📡 Loading bedrijf gegevens...");
        try {
            this.showLoading(true);

            const response = await fetch(
                "http://localhost:3301/api/bedrijven/profile",
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
                    "❌ Fout bij laden bedrijfgegevens, respons:",
                    errorResult
                );
                throw new Error(`HTTP ${response.status}: ${errorResult.message}`);
            }

            const result = await response.json();
            console.log("📦 API Result:", result);

            if (result.success) {
                this.bedrijfData = result.data;
                this.initialBedrijfData = { ...result.data };
                console.log("✅ Bedrijf data loaded:", this.bedrijfData);
                this.displayBedrijfGegevens();
            } else {
                console.error("❌ Server gaf aan dat laden mislukt is:", result);
                throw new Error(result.message || "Onbekende fout bij laden");
            }
        } catch (error) {
            console.error("❌ Error loading bedrijf gegevens:", error);
            this.showError("Kan gegevens niet laden: " + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async updateBedrijfGegevens(updatedFields) {
        console.log("📝 Preparing to update bedrijf gegevens...");
        console.log("💡 Fields to update:", updatedFields);

        this.bedrijfData = { ...this.bedrijfData, ...updatedFields };

        try {
            this.showLoading(true);

            const response = await fetch(
                "http://localhost:3301/api/bedrijven/profile",
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(this.bedrijfData),
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
                this.bedrijfData = result.data;
                this.initialBedrijfData = { ...result.data };
                this.displayBedrijfGegevens();
                this.disableEditMode(); // Schakel de algemene bewerkingsmodus uit
                this.showSuccess("Gegevens succesvol bijgewerkt!");
            } else {
                this.bedrijfData = { ...this.initialBedrijfData };
                this.displayBedrijfGegevens();

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
            console.error("❌ Error updating bedrijf:", error);
            this.showError("Update mislukt: " + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // 🎨 UI Updates
    displayBedrijfGegevens() {
        console.log("🎨 Displaying bedrijf gegevens");
        if (!this.bedrijfData) {
            console.warn("⚠️ No bedrijf data to display");
            return;
        }

        const data = this.bedrijfData;

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
    enableEditMode() {
        console.log("✏️ Enabling edit mode for Bedrijf");
        this.editMode = true;

        document.getElementById("viewControls").style.display = "none";
        document.getElementById("editControls").style.display = "flex";
        
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

    disableEditMode() {
        console.log("❌ Disabling edit mode for Bedrijf");
        this.editMode = false;
        this.bedrijfData = { ...this.initialBedrijfData };

        document.getElementById("viewControls").style.display = "flex";
        document.getElementById("editControls").style.display = "none";

        document.querySelectorAll('.editable-field .edit-mode').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.editable-field .display-mode').forEach(el => el.style.display = 'inline-block');

        this.displayBedrijfGegevens();    
    }

    getFieldMapping(fieldId) {
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

    getInputType(fieldId) {
        const typeMapping = {
            email: "email",
            telefoon: "tel",
            postcode: "text",
            huisnummer: "text",
        };
        return typeMapping[fieldId] || "text";
    }

    getFieldValue(fieldId) {
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
        const saveGeneralBtn = document.getElementById("saveGeneralBtn");
        if (saveGeneralBtn) {
            saveGeneralBtn.addEventListener("click", () => this.saveChanges());
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

    async saveChanges() {
        console.log("💾 Saving company changes");

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

        console.log("📦 Company data to save:", formData);
        await this.updateBedrijfGegevens(formData);
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
    console.log("🎯 DOM Content Loaded, initializing BedrijfGegevens");
    try {
        window.bedrijfGegevensManager = new BedrijfGegevens();
        console.log("✅ BedrijfGegevens initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize BedrijfGegevens:", error);
    }
});

// Export for module usage
export default BedrijfGegevens;