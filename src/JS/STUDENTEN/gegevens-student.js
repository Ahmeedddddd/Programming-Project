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
    this.studentData = null;
    this.editMode = false;
    this.projectEditMode = false;
    this.form = document.getElementById("studentForm");

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
      this.setupFormHandling();
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
        // Log de responsbody als er een fout is
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

  async updateStudentGegevens(formData) {
    console.log("📝 Updating student gegevens:", formData);
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
          body: JSON.stringify(formData),
        }
      );

      // Probeer de JSON respons te parsen, zelfs bij een niet-OK status
      const result = await response.json().catch(() => {
        // Als JSON parsen faalt, geef een generiek object terug
        return {
          success: false,
          message:
            response.statusText ||
            "Server respons was geen geldige JSON of leeg.",
        };
      });

      console.log("📝 Update result:", result);

      if (response.ok && result.success) {
        // Combineer checks voor robuustheid
        this.studentData = result.data;
        this.displayStudentGegevens();
        this.displayProjectInfo();
        this.disableEditMode(); // Belangrijk: Schakel de algemene bewerkingsmodus uit
        this.disableProjectEditMode(); // Belangrijk: Schakel ook de project bewerkingsmodus uit
        this.showSuccess("Gegevens succesvol bijgewerkt!");
      } else {
        // Log de volledige respons en het resultaat voor debugging
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
    console.log("📊 Data to display:", data);

    // Update persoonlijke gegevens
    this.updateField("studentnummer", data.studentnummer);
    this.updateField("voornaam", data.voornaam);
    this.updateField("achternaam", data.achternaam);
    this.updateField("email", data.email);
    this.updateField("telefoon", data.gsm_nummer);

    // Update studiegegevens
    this.updateField("opleiding", data.opleiding);
    this.updateField("opleidingsrichting", data.opleidingsrichting);
    this.updateField("leerjaar", data.leerjaar);

    // Update adresgegevens
    this.updateField("straatnaam", data.straatnaam);
    this.updateField("huisnummer", data.huisnummer);
    this.updateField("bus", data.bus);
    this.updateField("postcode", data.postcode);
    this.updateField("gemeente", data.gemeente);

    // Account info
    this.updateField("account-status", "Actief en Geverifieerd");
    this.updateField(
      "last-login",
      "Vandaag om " +
        new Date().toLocaleTimeString("nl-BE", {
          hour: "2-digit",
          minute: "2-digit",
        })
    );

    // Update extra info
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

  // 🛠️ PROJECT MANAGEMENT
  displayProjectInfo() {
    console.log("🎨 Displaying project info");
    if (!this.studentData) return;

    const data = this.studentData;

    // Update project fields
    this.updateField("project-titel", data.projectTitel);
    this.updateField("project-beschrijving", data.projectBeschrijving);
    this.updateField("over-mezelf", data.overMezelf);
    this.updateField("tafel-nummer", data.tafelNr);

    // Update project links
    this.updateProjectLinks(data);

    // Update project statistics
    this.updateProjectStats(data);
  }

  updateProjectLinks(data) {
    // GitHub link
    const githubLink = document.getElementById("github-link");
    if (githubLink) {
      // Check if the current content is not an input field (i.e., in view mode)
      if (!githubLink.querySelector("input")) {
        if (data.githubUrl) {
          githubLink.innerHTML = `<strong>GitHub:</strong> <a href="${data.githubUrl}" target="_blank" class="project-link">
                        <i class="fab fa-github"></i> GitHub Repository
                    </a>`;
        } else {
          githubLink.innerHTML =
            '<strong>GitHub:</strong> <span class="no-link">Geen GitHub link</span>';
        }
      }
    }

    // CV link
    const cvLink = document.getElementById("cv-link");
    if (cvLink) {
      // Check if the current content is not an input field (i.e., in view mode)
      if (!cvLink.querySelector("input")) {
        if (data.cvUrl) {
          cvLink.innerHTML = `<strong>CV:</strong> <a href="${data.cvUrl}" target="_blank" class="project-link">
                        <i class="fas fa-file-pdf"></i> Download CV
                    </a>`;
        } else {
          cvLink.innerHTML =
            '<strong>CV:</strong> <span class="no-link">Geen CV geüpload</span>';
        }
      }
    }

    // LinkedIn link
    const linkedinLink = document.getElementById("linkedin-link");
    if (linkedinLink) {
      // Check if the current content is not an input field (i.e., in view mode)
      if (!linkedinLink.querySelector("input")) {
        if (data.linkedinUrl) {
          linkedinLink.innerHTML = `<strong>LinkedIn:</strong> <a href="${data.linkedinUrl}" target="_blank" class="project-link">
                        <i class="fab fa-linkedin"></i> LinkedIn Profiel
                    </a>`;
        } else {
          linkedinLink.innerHTML =
            '<strong>LinkedIn:</strong> <span class="no-link">Geen LinkedIn link</span>';
        }
      }
    }
  }

  updateProjectStats(data) {
    // Project completion percentage (example calculation)
    const completionPercentage = this.calculateProjectCompletion(data);
    const progressBar = document.getElementById("project-progress");
    if (progressBar) {
      progressBar.style.width = `${completionPercentage}%`;
      progressBar.textContent = `${completionPercentage}% compleet`;
    }

    // Project info stats
    const projectStats = document.getElementById("project-stats");
    if (projectStats) {
      // Remove existing stat items to prevent duplication
      projectStats.innerHTML = "";
      const tafelNrElement = document.createElement("div");
      tafelNrElement.className = "stat-item ehbVeld";
      tafelNrElement.innerHTML = `<strong>Tafel:</strong> <span class="field-value">${
        data.tafelNr || "Niet toegewezen"
      }</span>`;
      projectStats.appendChild(tafelNrElement);

      const leerjaarElement = document.createElement("div");
      leerjaarElement.className = "stat-item ehbVeld";
      leerjaarElement.innerHTML = `<strong>Leerjaar:</strong> <span class="field-value">${
        data.leerjaar || "Niet ingevuld"
      }</span>`;
      projectStats.appendChild(leerjaarElement);

      const opleidingElement = document.createElement("div");
      opleidingElement.className = "stat-item ehbVeld";
      opleidingElement.innerHTML = `<strong>Opleiding:</strong> <span class="field-value">${
        data.opleiding || "Niet ingevuld"
      }</span>`;
      projectStats.appendChild(opleidingElement);
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

    // Project edit button
    const projectEditBtn = document.getElementById("projectEditBtn");
    if (projectEditBtn) {
      projectEditBtn.addEventListener("click", () =>
        this.enableProjectEditMode()
      );
    }

    // Project cancel button
    const projectCancelBtn = document.getElementById("projectCancelBtn");
    if (projectCancelBtn) {
      projectCancelBtn.addEventListener("click", () =>
        this.disableProjectEditMode()
      );
    }

    // Project save button
    const projectSaveBtn = document.getElementById("projectSaveBtn");
    if (projectSaveBtn) {
      projectSaveBtn.addEventListener("click", () => this.saveProjectChanges());
    }
  }

  enableProjectEditMode() {
    console.log("✏️ Enabling project edit mode");
    this.projectEditMode = true;

    // Verberg algemene view controls en toon project edit controls
    document.getElementById("viewControls").style.display = "none";
    document.getElementById("projectEditControls").style.display = "flex";
    // Verberg ook de algemene edit controls als deze toevallig zichtbaar zijn
    document.getElementById("editControls").style.display = "none";

    // Converteer projectvelden naar inputs
    this.createEditableProjectFields();
  }

  disableProjectEditMode() {
    console.log("❌ Disabling project edit mode");
    this.projectEditMode = false;

    // Toon algemene view controls en verberg project edit controls
    document.getElementById("viewControls").style.display = "flex";
    document.getElementById("projectEditControls").style.display = "none";
    // Zorg ervoor dat de algemene bewerkingsknoppen ook verborgen blijven of correct verschijnen
    document.getElementById("editControls").style.display = "none";

    // Herstel projectveld weergave
    this.displayProjectInfo();
  }

  createEditableProjectFields() {
    console.log("📝 Creating editable project fields");

    const projectFields = [
      "project-titel",
      "project-beschrijving",
      "over-mezelf",
      "github-url",
      "cv-url",
      "linkedin-url",
      "tafel-nummer", // Tafelnummer is nu ook bewerkbaar
    ];

    projectFields.forEach((fieldId) => {
      const field = document.querySelector(`[data-field="${fieldId}"]`);
      if (field && this.studentData) {
        const currentValue = this.getProjectFieldValue(fieldId);
        const label = this.getProjectFieldLabel(fieldId);

        if (fieldId === "project-beschrijving" || fieldId === "over-mezelf") {
          // Textarea for longer content
          field.innerHTML = `
                        <div class="project-field-edit">
                            <label for="edit-${fieldId}"><strong>${label}</strong></label>
                            <textarea
                                id="edit-${fieldId}"
                                class="project-edit-input"
                                rows="6"
                                placeholder="Beschrijf je ${
                                  fieldId.includes("beschrijving")
                                    ? "project"
                                    : "achtergrond"
                                } hier..."
                            >${currentValue}</textarea>
                        </div>
                    `;
        } else {
          // Input for other fields
          const inputType = fieldId.includes("url")
            ? "url"
            : fieldId === "tafel-nummer"
            ? "number"
            : "text";
          const placeholder = this.getFieldPlaceholder(fieldId);

          field.innerHTML = `
                        <div class="project-field-edit">
                            <label for="edit-${fieldId}"><strong>${label}</strong></label>
                            <input
                                type="${inputType}"
                                id="edit-${fieldId}"
                                value="${currentValue}"
                                class="project-edit-input"
                                placeholder="${placeholder}"
                            >
                        </div>
                    `;
        }
      }
    });
  }

  getProjectFieldValue(fieldId) {
    const mapping = {
      "project-titel": "projectTitel",
      "project-beschrijving": "projectBeschrijving",
      "over-mezelf": "overMezelf",
      "github-url": "githubUrl",
      "cv-url": "cvUrl",
      "linkedin-url": "linkedinUrl",
      "tafel-nummer": "tafelNr", // Mapping voor tafelnummer
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
      "tafel-nummer": "Tafel Nummer", // Label voor tafelnummer
    };
    return labels[fieldId] || fieldId;
  }

  getFieldPlaceholder(fieldId) {
    const placeholders = {
      "project-titel": "Bijv: Smart Garden Assistant",
      "github-url": "https://github.com/username/repository",
      "cv-url": "https://example.com/cv/jouw-cv.pdf",
      "linkedin-url": "https://www.linkedin.com/in/jouw-profiel",
      "tafel-nummer": "Bijv: 1", // Placeholder voor tafelnummer
    };
    return placeholders[fieldId] || "";
  }

  async saveProjectChanges() {
    console.log("💾 Saving project changes");

    const projectData = {};

    // Collect all project field values
    const projectInputs = document.querySelectorAll(".project-edit-input");
    projectInputs.forEach((input) => {
      const fieldId = input.id.replace("edit-", "");
      const mappedField = this.getProjectFieldMapping(fieldId);
      if (mappedField) {
        projectData[mappedField] = input.value.trim();
      }
    });

    console.log("📦 Project data to save:", projectData);

    // Validate URLs
    if (!this.validateProjectData(projectData)) {
      return;
    }

    await this.updateStudentGegevens(projectData);
  }

  getProjectFieldMapping(fieldId) {
    const mapping = {
      "project-titel": "projectTitel",
      "project-beschrijving": "projectBeschrijving",
      "over-mezelf": "overMezelf",
      "github-url": "githubUrl",
      "cv-url": "cvUrl",
      "linkedin-url": "linkedinUrl",
      "tafel-nummer": "tafelNr",
    };
    return mapping[fieldId];
  }

  validateProjectData(data) {
    // Check required fields
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

    // Validate URLs
    const urlFields = ["githubUrl", "cvUrl", "linkedinUrl"];
    for (const field of urlFields) {
      if (data[field] && !this.isValidUrl(data[field])) {
        const fieldName = field.replace("Url", "").toUpperCase();
        this.showError(`${fieldName} URL is niet geldig`);
        return false;
      }
    }

    // Validate tafelnummer if it's provided and is a number
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
      const valueSpan = field.querySelector(".field-value");
      if (valueSpan) {
        const displayValue = value || "Niet ingevuld";
        valueSpan.textContent = displayValue;
        console.log(`📝 Updated field ${fieldId}:`, displayValue);
      }
    } else {
      console.warn(`⚠️ Field not found: ${fieldId}`);
    }
  }

  // ✏️ Edit Mode Management (existing methods...)
  enableEditMode() {
    console.log("✏️ Enabling edit mode");
    this.editMode = true;
    this.projectEditMode = false; // Zorg dat project bewerkingsmodus uit staat

    // Verberg alle view controls en toon algemene edit controls
    document.getElementById("viewControls").style.display = "none";
    document.getElementById("editControls").style.display = "flex";
    // Zorg ervoor dat project edit controls ook verborgen zijn
    document.getElementById("projectEditControls").style.display = "none";

    // Converteer velden naar inputs
    this.createEditableFields();
  }

  disableEditMode() {
    console.log("❌ Disabling edit mode");
    this.editMode = false;

    // Toon algemene view controls en verberg algemene edit controls
    document.getElementById("viewControls").style.display = "flex";
    document.getElementById("editControls").style.display = "none";

    // Herstel veld weergave
    this.displayStudentGegevens();
  }

  createEditableFields() {
    console.log("📝 Creating editable fields");

    const editableFields = document.querySelectorAll(".editable-field");
    editableFields.forEach((field) => {
      const fieldId = field.getAttribute("data-field");
      const valueSpan = field.querySelector(".field-value");
      const strongElement = field.querySelector("strong");

      // Skip project-related fields if we are in general edit mode
      const projectRelatedFields = [
        "project-titel",
        "project-beschrijving",
        "over-mezelf",
        "github-url",
        "cv-url",
        "linkedin-url",
        "tafel-nummer",
      ];
      if (projectRelatedFields.includes(fieldId)) {
        // Restore their original display and skip creating input for them in this mode
        this.updateField(fieldId, this.getProjectFieldValue(fieldId)); // Zorg dat ze correct worden bijgewerkt
        return;
      }

      if (valueSpan && fieldId && this.studentData) {
        const currentValue = this.getFieldValue(fieldId);
        const labelText = strongElement ? strongElement.textContent : fieldId;

        if (fieldId === "project-beschrijving" || fieldId === "over-mezelf") {
          // Create textarea for longer text fields
          field.innerHTML = `
                        <strong>${labelText}</strong><br><br>
                        <textarea
                            id="edit-${fieldId}"
                            class="edit-input"
                            style="width: 100%; min-height: 80px; padding: 0.75rem; border: 2px solid #881538; border-radius: 8px; font-family: inherit; resize: vertical;"
                        >${currentValue}</textarea>
                    `;
        } else {
          // Create input for regular fields
          const inputType = this.getInputType(fieldId);
          field.innerHTML = `
                        <strong>${labelText}</strong>
                        <input
                            type="${inputType}"
                            id="edit-${fieldId}"
                            value="${currentValue}"
                            class="edit-input"
                            style="margin-left: 0.5rem; padding: 0.5rem; border: 2px solid #881538; border-radius: 8px; width: 250px;"
                        >
                    `;
        }
      }
    });
  }

  getFieldValue(fieldId) {
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
    };

    const dataField = mapping[fieldId];
    return dataField ? this.studentData[dataField] || "" : "";
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

  // 📝 Form Handling
  setupFormHandling() {
    if (this.form) {
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        // Controleer welke modus actief is voordat je de submit afhandelt
        if (this.editMode) {
          this.handleFormSubmit();
        } else if (this.projectEditMode) {
          this.saveProjectChanges();
        }
      });
    }
  }

  async handleFormSubmit() {
    console.log("💾 Handling form submit for general data");

    const formData = {};
    const editInputs = document.querySelectorAll(
      '.editable-field:not([data-field^="project-"]):not([data-field="github-url"]):not([data-field="cv-url"]):not([data-field="linkedin-url"]):not([data-field="tafel-nummer"]) .edit-input'
    );

    editInputs.forEach((input) => {
      const fieldId = input.id.replace("edit-", "");
      const mappedField = this.getFieldMapping(fieldId);
      if (mappedField) {
        formData[mappedField] = input.value.trim();
      }
    });

    console.log("📦 Form data to submit:", formData);
    await this.updateStudentGegevens(formData);
  }

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
    };
    return mapping[fieldId];
  }

  // 🎯 Event Listeners
  setupEventListeners() {
    console.log("👂 Setting up event listeners");

    // Edit button
    const editBtn = document.getElementById("editBtn");
    if (editBtn) {
      editBtn.addEventListener("click", () => this.enableEditMode());
    }

    // Cancel button for general data
    const cancelBtn = document.getElementById("cancelBtn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.disableEditMode());
    }
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
      // Fallback for environments without notification system
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
      // Fallback for environments without notification system
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
