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
        this.editMode = false; // Zorg dat algemene bewerkingsmodus uit staat

        document.getElementById("viewControls").style.display = "none";
        document.getElementById("editControls").style.display = "none";
        document.getElementById("projectEditControls").style.display = "flex";

        // Verberg alle display-mode spans en toon alle edit-mode inputs/textareas
        document.querySelectorAll('.editable-field .display-mode').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.editable-field .edit-mode').forEach(el => {
            const fieldId = el.id.replace('edit-', '');
            let value = '';
            // Haal de waarde op basis van de correcte mapping (project of algemeen)
            const mappedProjectField = this.getProjectFieldMapping(fieldId);
            const mappedGeneralField = this.getFieldMapping(fieldId);

            if (mappedProjectField) {
                value = this.studentData[mappedProjectField] || '';
            } else if (mappedGeneralField) {
                // Als het geen projectveld is, maar wel een algemeen veld
                value = this.studentData[mappedGeneralField] || '';
            }

            el.value = value;
            el.style.display = (el.tagName === 'TEXTAREA' ? 'block' : 'inline-block'); // Blok voor textarea, inline-block voor input
            // Pas style aan indien nodig, bijv. `el.style.width = '100%'` voor inputs
            if (el.tagName === 'INPUT') {
                el.style.width = '250px'; // Consistent met algemene inputs
                el.style.marginLeft = '0.5rem';
                el.style.padding = '0.5rem';
                el.style.border = '2px solid #881538';
                el.style.borderRadius = '8px';
            } else if (el.tagName === 'TEXTAREA') {
                el.style.width = '100%';
                el.style.minHeight = '80px';
                el.style.padding = '0.75rem';
                el.style.border = '2px solid #881538';
                el.style.borderRadius = '8px';
                el.style.fontFamily = 'inherit';
                el.style.resize = 'vertical';
            }
        });

        // Specifieke uitzondering: studentnummer en academiejjaar zijn niet-bewerkbaar en hebben geen edit-mode
        document.querySelector('[data-field="studentnummer"] .field-value').style.display = 'inline-block';
        document.querySelector('[data-field="academiejaar"] .field-value').style.display = 'inline-block';
    }


    // Aangepaste disableProjectEditMode
    disableProjectEditMode() {
        console.log("❌ Disabling project edit mode");
        this.projectEditMode = false;

        // Reset project data to initial state if cancelled
        this.studentData = { ...this.initialStudentData };

        document.getElementById("viewControls").style.display = "flex";
        document.getElementById("editControls").style.display = "none";
        document.getElementById("projectEditControls").style.display = "none";

        // Verberg alle edit-mode inputs/textareas en toon alle display-mode spans
        document.querySelectorAll('.editable-field .edit-mode').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.editable-field .display-mode').forEach(el => el.style.display = 'inline-block');

        this.displayProjectInfo(); // Herstel projectveld weergave met oorspronkelijke data
        this.displayStudentGegevens(); // Zorg dat ook de algemene gegevens correct zijn (ongewijzigd)
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
        // Zorg ervoor dat de display-mode voor projectvelden zichtbaar blijft
        document.querySelectorAll('[data-field^="project-"] .display-mode, [data-field="tafel-nummer"] .display-mode, [data-field="over-mezelf"] .display-mode').forEach(el => el.style.display = 'inline-block');

         // Specifieke uitzondering: studentnummer en academiejjaar zijn niet-bewerkbaar en hebben geen edit-mode
        document.querySelector('[data-field="studentnummer"] .field-value').style.display = 'inline-block';
        document.querySelector('[data-field="academiejaar"] .field-value').style.display = 'inline-block';
    }


    // Aangepaste disableEditMode
    disableEditMode() {
        console.log("❌ Disabling general edit mode");
        this.editMode = false;

        // Reset student data to initial state if cancelled
        this.studentData = { ...this.initialStudentData };

        document.getElementById("viewControls").style.display = "flex";
        document.getElementById("editControls").style.display = "none";

        // Verberg alle edit-mode inputs en toon alle display-mode spans
        document.querySelectorAll('.editable-field .edit-mode').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.editable-field .display-mode').forEach(el => el.style.display = 'inline-block');

        this.displayStudentGegevens(); // Herstel de weergave met de oorspronkelijke data
        this.displayProjectInfo(); // Zorg dat ook projectgegevens correct zijn (ongewijzigd)
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
        // Selecteer ALLE inputs met class 'edit-input' die GEEN project-gerelateerd veld zijn
        const editInputs = document.querySelectorAll(
            '.editable-field .edit-mode:not([id^="edit-project-"]):not([id="edit-github-url"]):not([id="edit-cv-url"]):not([id="edit-linkedin-url"]):not([id="edit-tafel-nummer"]):not([id="edit-over-mezelf"])'
        );

        editInputs.forEach((input) => {
            const fieldId = input.id.replace("edit-", "");
            const mappedField = this.getFieldMapping(fieldId);
            if (mappedField) {
                generalData[mappedField] = input.value.trim();
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

// Export for module usage
export default StudentGegevens;