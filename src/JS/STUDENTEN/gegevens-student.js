// gegevens-student.js - Student gegevens ophalen en weergeven en uitgebreid met project management

console.log("🚀 Student gegevens script geladen");

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

class StudentGegevens {
    constructor() {
        console.log("📝 StudentGegevens constructor aangeroepen");
        this.token = localStorage.getItem("authToken");
        this.studentData = null; // Dit bevat de laatst geladen data
        this.initialStudentData = null; // Sla de initiële data op voor annuleren
        this.editMode = false;
        this.projectEditMode = false;
        this.form = document.getElementById("studentForm"); // Algemeen formulier

        // Initialize
        this.init();
    }

    async init() {
        console.log("🚀 Initializing StudentGegevens");
        if (!this.token) {
            console.warn("⚠️ No token found");
            this.redirectToLogin();
            return;
        }

        try {
            await this.loadStudentGegevens();
            this.setupEventListeners();
            this.setupProjectHandling();
        } catch (error) {
            console.error("❌ Initialisatie mislukt:", error);
            this.showError("Er ging iets mis bij het laden van je gegevens");
        }
    }

    // 📡 API Calls
    async loadStudentGegevens() {
        console.log("📡 Loading student gegevens...");
        try {
            this.showLoading(true);

            const response = await fetch(
                "http://localhost:3301/api/student/profile",
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
                    "❌ Fout bij laden studentgegevens, respons:",
                    errorResult
                );
                throw new Error(`HTTP ${response.status}: ${errorResult.message}`);
            }

            const result = await response.json();
            console.log("📦 API Result:", result);

            if (result.success) {
                this.studentData = result.data;
                this.initialStudentData = { ...result.data }; // Maak een kopie voor annuleren
                console.log("✅ Student data loaded:", this.studentData);
                this.displayStudentGegevens();
                this.displayProjectInfo();
            } else {
                console.error("❌ Server gaf aan dat laden mislukt is:", result);
                throw new Error(result.message || "Onbekende fout bij laden");
            }
        } catch (error) {
            console.error("❌ Error loading student gegevens:", error);
            this.showError("Kan gegevens niet laden: " + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async updateStudentGegevens(updatedFields) {
        console.log("📝 Preparing to update student gegevens...");
        console.log("💡 Fields to update:", updatedFields);

        // Update this.studentData with the new values
        // The spread operator ensures existing fields are kept
        this.studentData = { ...this.studentData, ...updatedFields };

        try {
            this.showLoading(true);

            const response = await fetch(
                "http://localhost:3301/api/student/profile",
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(this.studentData), // Verstuur het hele, bijgewerkte studentData object
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
                this.studentData = result.data; // Gebruik de data die de server terugstuurt als de nieuwe state
                this.initialStudentData = { ...result.data }; // Update de initiële data ook
                this.displayStudentGegevens(); // Toon de algemene gegevens
                this.displayProjectInfo(); // Toon de projectgegevens
                this.disableEditMode(); // Schakel de algemene bewerkingsmodus uit
                this.disableProjectEditMode(); // Schakel de project bewerkingsmodus uit
                this.showSuccess("Gegevens succesvol bijgewerkt!");
            } else {
                // Belangrijk: Bij een fout, herstel this.studentData naar de initiële staat
                // zodat de UI de correcte (ongewijzigde) data toont.
                this.studentData = { ...this.initialStudentData };
                this.displayStudentGegevens();
                this.displayProjectInfo();

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
            console.error("❌ Error updating student:", error);
            this.showError("Update mislukt: " + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // 🎨 UI Updates
    displayStudentGegevens() {
        console.log("🎨 Displaying student gegevens");
        if (!this.studentData) {
            console.warn("⚠️ No student data to display");
            return;
        }

        const data = this.studentData;

        // Update persoonlijke gegevens
        this.updateField("studentnummer", data.studentnummer);
        this.updateField("voornaam", data.voornaam);
        this.updateField("achternaam", data.achternaam);
        this.updateField("email", data.email);
        this.updateField("telefoon", data.gsm_nummer);

        // Update studiegegevens
        this.updateField("opleiding", data.opleiding);
        this.updateField("opleidingsrichting", data.opleidingsrichting);
        // Correctie voor leerjaar (als het een input is geworden)
        this.updateField("leerjaar", data.leerjaar);


        // Update adresgegevens
        this.updateField("straatnaam", data.straatnaam);
        this.updateField("huisnummer", data.huisnummer);
        this.updateField("bus", data.bus);
        this.updateField("postcode", data.postcode);
        this.updateField("gemeente", data.gemeente);

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
            accountCreated.textContent = `Account aangemaakt: ${new Date().getFullYear()}`; // Of data.accountCreatedDate als beschikbaar
        if (lastUpdated)
            lastUpdated.textContent = `Laatste update: ${new Date().toLocaleDateString(
                "nl-BE"
            )}`; // Of data.lastUpdatedDate als beschikbaar

        console.log("✅ UI updated successfully");
    }

    // 🛠️ PROJECT MANAGEMENT
    displayProjectInfo() {
        console.log("🎨 Displaying project info");
        if (!this.studentData) return;

        const data = this.studentData;

        // Update project fields
        this.updateField("project-titel", data.projectTitel);
        this.updateField("project-beschrijving", data.projectBeschrijving);
        this.updateField("over-mezelf", data.overMezelf);
        this.updateField("tafel-nummer", data.tafelNr); // Tafelnummer is ook een 'project' veld in de UI

        // Update project links
        this.updateProjectLinks(data);

        // Update project statistics (tafelnummer etc. worden hier ook getoond)
        this.updateProjectStats(data);
    }

    updateProjectLinks(data) {
        const linkElements = {
            githubUrl: {
                id: "github-link",
                icon: "fab fa-github",
                text: "GitHub Repository",
                label: "GitHub",
                noLinkText: "Geen GitHub link",
            },
            cvUrl: {
                id: "cv-link",
                icon: "fas fa-file-pdf",
                text: "Download CV",
                label: "CV",
                noLinkText: "Geen CV geüpload",
            },
            linkedinUrl: {
                id: "linkedin-link",
                icon: "fab fa-linkedin",
                text: "LinkedIn Profiel",
                label: "LinkedIn",
                noLinkText: "Geen LinkedIn link",
            },
        };

        for (const key in linkElements) {
            const { id, icon, text, label, noLinkText } = linkElements[key];
            const linkContainer = document.getElementById(id);
            if (linkContainer) {
                // Alleen de weergave bijwerken als we NIET in bewerkingsmodus zijn voor dit veld
                const inputElement = linkContainer.querySelector("input");
                if (!this.projectEditMode || !inputElement) { // Belangrijk: Deze check is nu essentieel
                    if (data[key]) {
                        linkContainer.innerHTML = `<strong>${label}:</strong> <a href="${data[key]}" target="_blank" class="project-link"><i class="${icon}"></i> ${text}</a>`;
                    } else {
                        linkContainer.innerHTML = `<strong>${label}:</strong> <span class="no-link">${noLinkText}</span>`;
                    }
                }
            }
        }
    }

    updateProjectStats(data) {
        const completionPercentage = this.calculateProjectCompletion(data);
        const progressBar = document.getElementById("project-progress");
        if (progressBar) {
            progressBar.style.width = `${completionPercentage}%`;
            progressBar.textContent = `${completionPercentage}% compleet`;
        }
    }

    calculateProjectCompletion(data) {
        let completed = 0;
        const totalFields = 6;

        if (data.projectTitel) completed++;
        if (data.projectBeschrijving) completed++;
        if (data.overMezelf) completed++;
        if (data.githubUrl) completed++;
        if (data.cvUrl) completed++;
        if (data.linkedinUrl) completed++;

        return Math.round((completed / totalFields) * 100);
    }

    setupProjectHandling() {
        console.log("🛠️ Setting up project handling");

        const projectEditBtn = document.getElementById("projectEditBtn");
        if (projectEditBtn) {
            projectEditBtn.addEventListener("click", () =>
                this.enableProjectEditMode()
            );
        }

        const projectCancelBtn = document.getElementById("projectCancelBtn");
        if (projectCancelBtn) {
            projectCancelBtn.addEventListener("click", () =>
                this.disableProjectEditMode()
            );
        }

        const projectSaveBtn = document.getElementById("projectSaveBtn");
        if (projectSaveBtn) {
            projectSaveBtn.addEventListener("click", () => this.saveProjectChanges());
        }
    }

    // Aangepaste enableProjectEditMode
    enableProjectEditMode() {
        console.log("✏️ Enabling project edit mode");
        this.projectEditMode = true;
        this.editMode = false;

        document.getElementById("viewControls").style.display = "none";
        document.getElementById("editControls").style.display = "none";
        document.getElementById("projectEditControls").style.display = "flex";

        // Itereren over ALLE editable fields
        document.querySelectorAll('.editable-field').forEach(fieldDiv => {
            const fieldId = fieldDiv.getAttribute('data-field');
            const displaySpan = fieldDiv.querySelector('.display-mode');
            const editInput = fieldDiv.querySelector('.edit-mode');

            // Bepaal of dit een project, bewerkbaar veld is
            const isProjectEditableField = ['project-titel', 'project-beschrijving', 'over-mezelf', 'github-url', 'cv-url', 'linkedin-url'].includes(fieldId);

            if (isProjectEditableField) {
                // Toon de input, verberg de span
                if (displaySpan) displaySpan.style.display = 'none';
                if (editInput) {
                    editInput.value = this.getProjectFieldValue(fieldId); // Gebruik project mapping
                    editInput.style.display = (editInput.tagName === 'TEXTAREA' ? 'block' : 'inline-block');
                    // Stijlconsistentie
                    if (editInput.tagName === 'INPUT') {
                        editInput.style.width = '250px';
                        editInput.style.marginLeft = '0.5rem';
                        editInput.style.padding = '0.5rem';
                        editInput.style.border = '2px solid #881538';
                        editInput.style.borderRadius = '8px';
                    } else if (editInput.tagName === 'TEXTAREA') {
                        editInput.style.width = '100%';
                        editInput.style.minHeight = '80px';
                        editInput.style.padding = '0.75rem';
                        editInput.style.border = '2px solid #881538';
                        editInput.style.borderRadius = '8px';
                        editInput.style.fontFamily = 'inherit';
                        editInput.style.resize = 'vertical';
                    }
                }
            } else {
                // Dit veld is niet project-bewerkbaar, zorg dat het in display mode blijft
                if (displaySpan) displaySpan.style.display = 'inline-block'; // of 'block'
                if (editInput) editInput.style.display = 'none';
            }
        });
    }


    // Aangepaste disableProjectEditMode
    disableProjectEditMode() {
        console.log("❌ Disabling project edit mode");
        this.projectEditMode = false;
        this.studentData = { ...this.initialStudentData }; // Reset data op annuleren

        document.getElementById("viewControls").style.display = "flex";
        document.getElementById("editControls").style.display = "none";
        document.getElementById("projectEditControls").style.display = "none";

        document.querySelectorAll('.editable-field .edit-mode').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.editable-field .display-mode').forEach(el => el.style.display = 'inline-block'); // Of 'block' voor textarea spans

        this.displayProjectInfo();
        this.displayStudentGegevens();
    }

    // Deze functies zijn NIET meer nodig in de nieuwe aanpak
    // createEditableProjectFields() { /* Leeg of verwijder */ }
    // createEditableFields() { /* Leeg of verwijder */ }

    // HOUD DEZE FUNCTIES, ZE ZIJN OKÉ
    getProjectFieldValue(fieldId) {
        const mapping = {
            "project-titel": "projectTitel",
            "project-beschrijving": "projectBeschrijving",
            "over-mezelf": "overMezelf",
            "github-url": "githubUrl",
            "cv-url": "cvUrl",
            "linkedin-url": "linkedinUrl",
            "tafel-nummer": "tafelNr",
        };

        const dataField = mapping[fieldId];
        return dataField ? this.studentData[dataField] || "" : "";
    }

    getProjectFieldLabel(fieldId) {
        const labels = {
            "project-titel": "Project Titel",
            "project-beschrijving": "Project Beschrijving",
            "over-mezelf": "Over Mezelf",
            "github-url": "GitHub Repository URL",
            "cv-url": "CV Download Link",
            "linkedin-url": "LinkedIn Profiel URL",
            "tafel-nummer": "Tafel Nummer",
        };
        return labels[fieldId] || fieldId;
    }

    getFieldPlaceholder(fieldId) {
        const placeholders = {
            "project-titel": "Bijv: Smart Garden Assistant",
            "github-url": "https://github.com/username/repository",
            "cv-url": "https://example.com/cv/jouw-cv.pdf",
            "linkedin-url": "https://www.linkedin.com/in/jouw-profiel",
            "tafel-nummer": "Bijv: 1",
        };
        return placeholders[fieldId] || "";
    }

    async saveProjectChanges() {
        console.log("💾 Saving project changes");

        const projectData = {};

        // Haal de waardes op van ALLE project-gerelateerde inputvelden in bewerkingsmodus
        const projectInputs = document.querySelectorAll('[data-field^="project-"] .edit-mode, [data-field="tafel-nummer"] .edit-mode, [data-field="over-mezelf"] .edit-mode');

        projectInputs.forEach((input) => {
            const fieldId = input.id.replace("edit-", "");
            const mappedField = this.getProjectFieldMapping(fieldId); // Gebruik project mapping
            if (mappedField) {
                projectData[mappedField] = input.value.trim();
            }
        });

        console.log("📦 Project data to save:", projectData);

        if (!this.validateProjectData(projectData)) {
            return;
        }

        await this.updateStudentGegevens(projectData);
    }

    getProjectFieldMapping(fieldId) {
        const mapping = {
            "project-titel": "projectTitel",
            "project-beschrijving": "projectBeschrijving",
            "over-mezelf": "overMezelf", // Deze hoort bij project context in je HTML
            "github-url": "githubUrl",
            "cv-url": "cvUrl",
            "linkedin-url": "linkedinUrl",
            "tafel-nummer": "tafelNr",
        };
        return mapping[fieldId];
    }

    validateProjectData(data) {
        if (!data.projectTitel || data.projectTitel.length < 3) {
            this.showError("Project titel moet minimaal 3 karakters bevatten");
            return false;
        }

        if (!data.projectBeschrijving || data.projectBeschrijving.length < 20) {
            this.showError(
                "Project beschrijving moet minimaal 20 karakters bevatten"
            );
            return false;
        }

        const urlFields = ["githubUrl", "cvUrl", "linkedinUrl"];
        for (const field of urlFields) {
            if (data[field] && !this.isValidUrl(data[field])) {
                const fieldName = field.replace("Url", "").toUpperCase();
                this.showError(`${fieldName} URL is niet geldig`);
                return false;
            }
        }

        if (data.tafelNr && isNaN(parseInt(data.tafelNr))) {
            this.showError("Tafelnummer moet een geldig nummer zijn");
            return false;
        }

        return true;
    }

    isValidUrl(string) {
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
            const valueSpan = field.querySelector(".field-value"); // Zoekt naar de span met .field-value
            if (valueSpan) {
                const displayValue = value || "Niet ingevuld";
                valueSpan.textContent = displayValue;
            } else {
                console.warn(`⚠️ .field-value span not found for ${fieldId}.`); // Verbeterde waarschuwing
            }
        } else {
            console.warn(`⚠️ Field container not found: ${fieldId}`);
        }
    }

    // ✏️ Edit Mode Management
    // Aangepaste enableEditMode
    enableEditMode() {
        console.log("✏️ Enabling general edit mode");
        this.editMode = true;
        this.projectEditMode = false;

        document.getElementById("viewControls").style.display = "none";
        document.getElementById("editControls").style.display = "flex";
        document.getElementById("projectEditControls").style.display = "none";

        // Itereren over ALLE editable fields
        document.querySelectorAll('.editable-field').forEach(fieldDiv => {
            const fieldId = fieldDiv.getAttribute('data-field');
            const displaySpan = fieldDiv.querySelector('.display-mode');
            const editInput = fieldDiv.querySelector('.edit-mode');

            // Bepaal of dit een algemeen, bewerkbaar veld is
            const isGeneralEditableField = ['email', 'telefoon', 'opleiding', 'opleidingsrichting', 'straatnaam', 'huisnummer', 'bus', 'postcode', 'gemeente'].includes(fieldId);

            if (isGeneralEditableField) {
                // Toon de input, verberg de span
                if (displaySpan) displaySpan.style.display = 'none';
                if (editInput) {
                    editInput.value = this.getFieldValue(fieldId); // Vult de input
                    editInput.style.display = (editInput.tagName === 'TEXTAREA' ? 'block' : 'inline-block');
                    // Stijlconsistentie
                    editInput.style.width = '250px';
                    editInput.style.marginLeft = '0.5rem';
                    editInput.style.padding = '0.5rem';
                    editInput.style.border = '2px solid #881538';
                    editInput.style.borderRadius = '8px';
                }
            } else {
                // Dit veld is niet algemeen bewerkbaar, zorg dat het in display mode blijft
                if (displaySpan) displaySpan.style.display = 'inline-block'; // of 'block' voor tekstarea's
                if (editInput) editInput.style.display = 'none';
            }
        });

        // Specifieke niet-bewerkbare velden die sowieso altijd in display mode zijn:
        // Deze hebben geen editable-field class en geen edit-mode input, dus ze worden niet geraakt door bovenstaande loop
        // studentnummer, academiejaar, voornaam, achternaam, leerjaar, tafel-nummer
    }


    // Aangepaste disableEditMode
    disableEditMode() {
        console.log("❌ Disabling general edit mode");
        this.editMode = false;
        this.studentData = { ...this.initialStudentData }; // Reset data op annuleren

        document.getElementById("viewControls").style.display = "flex";
        document.getElementById("editControls").style.display = "none";
        document.getElementById("projectEditControls").style.display = "none"; // Zorg dat project edit controls ook verborgen zijn

        document.querySelectorAll('.editable-field .edit-mode').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.editable-field .display-mode').forEach(el => el.style.display = 'inline-block'); // Of 'block' voor textarea spans

        this.displayStudentGegevens();
        this.displayProjectInfo();
    }

    // DEZE FUNCTIES ZIJN VERWIJDERD OF LEEG GEMAAKT NU DE HTML EN LOGICA IS AANGEPAST.
    // createEditableFields() { /* NIET MEER NODIG */ }
    // createEditableProjectFields() { /* NIET MEER NODIG */ }


    getFieldMapping(fieldId) {
        const mapping = {
            voornaam: "voornaam",
            achternaam: "achternaam",
            email: "email",
            telefoon: "gsm_nummer",
            opleiding: "opleiding",
            opleidingsrichting: "opleidingsrichting",
            leerjaar: "leerjaar",
            straatnaam: "straatnaam",
            huisnummer: "huisnummer",
            bus: "bus",
            postcode: "postcode",
            gemeente: "gemeente",
            // Zorg ervoor dat project-gerelateerde velden NIET hier gemapt worden
        };
        return mapping[fieldId];
    }

    getInputType(fieldId) {
        const typeMapping = {
            email: "email",
            telefoon: "tel",
            postcode: "text",
            huisnummer: "text",
            leerjaar: "number",
        };
        return typeMapping[fieldId] || "text";
    }

    getFieldValue(fieldId) {
        const mapping = {
            email: "email",
            telefoon: "gsm_nummer",
            opleiding: "opleiding",
            opleidingsrichting: "opleidingsrichting",
            straatnaam: "straatnaam",
            huisnummer: "huisnummer",
            bus: "bus",
            postcode: "postcode",
            gemeente: "gemeente",
        };

        const dataField = mapping[fieldId];
        return dataField ? this.studentData[dataField] || "" : "";
    }

    // 📝 Form Handling (Aangepast)
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

        // Save button for general data (NIEUWE ID)
        const saveGeneralBtn = document.getElementById("saveGeneralBtn");
        if (saveGeneralBtn) {
            saveGeneralBtn.addEventListener("click", () => this.saveGeneralChanges());
        }

        // Project edit button
        const projectEditBtn = document.getElementById("projectEditBtn");
        if (projectEditBtn) {
            projectEditBtn.addEventListener("click", () => this.enableProjectEditMode());
        }

        // Project cancel button
        const projectCancelBtn = document.getElementById("projectCancelBtn");
        if (projectCancelBtn) {
            projectCancelBtn.addEventListener("click", () => this.disableProjectEditMode());
        }

        // Project save button
        const projectSaveBtn = document.getElementById("projectSaveBtn");
        if (projectSaveBtn) {
            projectSaveBtn.addEventListener("click", () => this.saveProjectChanges());
        }

        // Neutraliseer eventuele form submit als deze niet expliciet wordt afgehandeld door knoppen
        if (this.form) {
            this.form.addEventListener("submit", (e) => {
                e.preventDefault();
                console.warn("Form submit event prevented. All saves should go through dedicated buttons.");
            });
        }
    }

    async saveGeneralChanges() {
        console.log("💾 Saving general student changes");

        const generalData = {};
        // Selecteer alleen de edit-mode inputs die werkelijk bewerkbaar zijn voor algemene gegevens
        const generalEditableFieldIds = ['email', 'telefoon', 'opleiding', 'opleidingsrichting', 'straatnaam', 'huisnummer', 'bus', 'postcode', 'gemeente'];

        generalEditableFieldIds.forEach(fieldId => {
            const input = document.getElementById(`edit-${fieldId}`);
            if (input) {
                const mappedField = this.getFieldMapping(fieldId);
                if (mappedField) {
                    generalData[mappedField] = input.value.trim();
                }
            }
        });

        console.log("📦 General data to save:", generalData);
        await this.updateStudentGegevens(generalData);
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
    console.log("🎯 DOM Content Loaded, initializing StudentGegevens");
    try {
        window.studentGegevensManager = new StudentGegevens();
        console.log("✅ StudentGegevens initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize StudentGegevens:", error);
    }
});

// Global variables
let currentUser = null;

// === MODAL FUNCTIONS ===
function openPasswordModal() {
    // Render sluit-kruis en oogje-knoppen als ze ontbreken
    const modalHeader = document.querySelector('#passwordModal .password-modal-header');
    if (modalHeader && !modalHeader.querySelector('.password-modal-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'password-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.title = 'Sluiten';
        closeBtn.onclick = closePasswordModal;
        modalHeader.appendChild(closeBtn);
    }

    document.getElementById('passwordModal').style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Get current user info
    getCurrentUser();

    // Focus on first input
    setTimeout(() => {
        document.getElementById('currentPassword').focus();
        // Voeg oogje-knoppen toe aan password inputs als ze ontbreken
        ['currentPassword','newPassword','confirmPassword'].forEach(id => {
            const input = document.getElementById(id);
            if (input && !input.nextElementSibling?.classList?.contains('password-toggle')) {
                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'password-toggle';
                toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
                toggleBtn.onclick = () => togglePasswordVisibility(id);
                input.parentNode.insertBefore(toggleBtn, input.nextSibling);
            }
        });
    }, 100);
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.body.style.overflow = 'auto';

    // Reset form
    document.getElementById('passwordChangeForm').reset();
    document.getElementById('modalMessage').innerHTML = '';
    document.getElementById('passwordStrengthMeter').style.display = 'none';
    document.getElementById('savePasswordBtn').disabled = true;

    // Reset requirements
    resetPasswordRequirements();
}

// === PASSWORD VISIBILITY TOGGLE ===
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// === PASSWORD STRENGTH VALIDATION ===
function validatePasswordStrength(password) {
    const requirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        noCommonPatterns: !/(password|123456|qwerty|admin|welcome|login)/i.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const isValid = score >= 6 && requirements.minLength;

    return {
        requirements,
        score,
        maxScore: 6,
        isValid,
        level: getSecurityLevel(score),
        message: getSecurityMessage(score)
    };
}

function getSecurityLevel(score) {
    if (score >= 6) return 'maximum';
    if (score >= 5) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
}

function getSecurityMessage(score) {
    if (score >= 6) return 'Uitstekend - Maximale beveiliging';
    if (score >= 5) return 'Sterk - Goede beveiliging';
    if (score >= 3) return 'Gemiddeld - Kan beter';
    return 'Zwak - Niet veilig genoeg';
}

function updatePasswordStrength(password) {
    const meter = document.getElementById('passwordStrengthMeter');

    if (!password) {
        meter.style.display = 'none';
        return false;
    }

    meter.style.display = 'block';

    const validation = validatePasswordStrength(password);
    const { requirements, score, level, message } = validation;

    // Update progress bar
    const progressBar = document.getElementById('strengthBar');
    const progressText = document.getElementById('strengthText');

    const percentage = (score / 6) * 100;
    progressBar.style.width = percentage + '%';
    progressBar.className = `strength-fill strength-${level}`;
    progressText.textContent = `Wachtwoord sterkte: ${message}`;

    // Update requirements list
    updateRequirement('req-length', requirements.minLength);
    updateRequirement('req-uppercase', requirements.hasUppercase);
    updateRequirement('req-lowercase', requirements.hasLowercase);
    updateRequirement('req-number', requirements.hasNumbers);
    updateRequirement('req-special', requirements.hasSpecialChars);
    updateRequirement('req-patterns', requirements.noCommonPatterns);

    return validation.isValid;
}

function updateRequirement(elementId, isValid) {
    const element = document.getElementById(elementId);
    const icon = element.querySelector('.requirement-icon');

    if (isValid) {
        element.className = 'valid';
        icon.className = 'requirement-icon valid';
        icon.textContent = '✓';
    } else {
        element.className = 'invalid';
        icon.className = 'requirement-icon invalid';
        icon.textContent = '✗';
    }
}

function resetPasswordRequirements() {
    const requirements = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special', 'req-patterns'];
    requirements.forEach(req => updateRequirement(req, false));
}

// === FORM VALIDATION ===
function validateForm() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const hasCurrentPassword = currentPassword.length > 0;
    const hasValidNewPassword = updatePasswordStrength(newPassword);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

    const isValid = hasCurrentPassword && hasValidNewPassword && passwordsMatch;

    document.getElementById('savePasswordBtn').disabled = !isValid;

    return isValid;
}

// === USER MANAGEMENT ===
async function getCurrentUser() {
    try {
        // Try to get user from session storage
        currentUser = {
            gebruikersId: sessionStorage.getItem('gebruikersId') || localStorage.getItem('gebruikersId'),
            userType: sessionStorage.getItem('userType') || localStorage.getItem('userType'),
            email: sessionStorage.getItem('email') || localStorage.getItem('email')
        };

        console.log('Current user:', currentUser);
    } catch (error) {
        console.error('Error getting current user:', error);
    }
}

// === PASSWORD CHANGE API ===
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showMessage('Wachtwoorden komen niet overeen', 'error');
        return;
    }

    // Validate strength
    if (!updatePasswordStrength(newPassword)) {
        showMessage('Nieuw wachtwoord voldoet niet aan alle beveiligingseisen', 'error');
        return;
    }

    // Show loading state
    const saveBtn = document.getElementById('savePasswordBtn');
    const originalContent = saveBtn.innerHTML;
    saveBtn.innerHTML = '<div class="loading-spinner"></div> Bezig met opslaan...';
    saveBtn.disabled = true;

    // Haal token op (zoals in de StudentGegevens class)
    let token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            credentials: 'include',
            body: JSON.stringify({
                gebruikersId: currentUser?.gebruikersId,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage('Wachtwoord succesvol gewijzigd! 🎉', 'success');
            setTimeout(() => {
                closePasswordModal();
            }, 2000);
        } else {
            showMessage(result.message || 'Er ging iets mis bij het wijzigen van het wachtwoord', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showMessage('Netwerkfout: Kan geen verbinding maken met de server', 'error');
    } finally {
        // Restore button
        saveBtn.innerHTML = originalContent;
        saveBtn.disabled = false;
        validateForm();
    }
}

// === MESSAGE DISPLAY ===
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('modalMessage');
    const className = type === 'error' ? 'error-message' : 'success-message';
    const icon = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';

    messageContainer.innerHTML = `
        <div class="${className}">
            <i class="${icon}"></i>
            ${message}
        </div>
    `;

    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', function () {
    // Password input event listeners
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const currentPasswordInput = document.getElementById('currentPassword');

    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function () {
            updatePasswordStrength(this.value);
            validateForm();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validateForm);
    }

    if (currentPasswordInput) {
        currentPasswordInput.addEventListener('input', validateForm);
    }

    // Save button click
    const saveBtn = document.getElementById('savePasswordBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', changePassword);
    }

    // Form submit prevention
    const form = document.getElementById('passwordChangeForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (validateForm()) {
                changePassword();
            }
        });
    }

    // Close modal on outside click
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closePasswordModal();
            }
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && document.getElementById('passwordModal').style.display === 'block') {
            closePasswordModal();
        }
    });

    // Connect existing password change buttons
    connectPasswordChangeButtons();
});

// === INTEGRATION HELPER ===
function connectPasswordChangeButtons() {
    // Find all password change buttons and connect them
    const buttons = document.querySelectorAll('button');

    buttons.forEach(button => {
        const buttonText = button.textContent || button.innerText;
        const buttonHTML = button.innerHTML;

        // Check if this is a password change button
        if ((buttonText.includes('Wachtwoord') && buttonText.includes('Wijzigen')) ||
            buttonHTML.includes('fa-key')) {

            // Remove any existing onclick handlers
            button.removeAttribute('onclick');

            // Add new event listener
            button.addEventListener('click', function (e) {
                e.preventDefault();
                openPasswordModal();
            });

            console.log('✅ Connected password change button:', button);
        }
    });
}

// Export for module usage
export default StudentGegevens;