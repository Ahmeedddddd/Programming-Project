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
      // Verwijder setupFormHandling, we gebruiken nu de save knoppen direct
      // en de form submit wordt opgevangen in de save functies.
      // this.setupFormHandling();
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
    // Deze functie ontvangt nu alleen de velden die *gewijzigd* zijn
    // We versturen het HELE studentData object naar de server, met de gewijzigde velden erin.
    // Dit zorgt ervoor dat de server altijd een compleet object krijgt.

    console.log("📝 Preparing to update student gegevens...");
    console.log("💡 Fields to update:", updatedFields);

    // Update this.studentData met de nieuwe waarden
    // De spread operator zorgt ervoor dat bestaande velden behouden blijven
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
    this.updateField("tafel-nummer", data.tafelNr);

    // Update project links
    this.updateProjectLinks(data);

    // Update project statistics
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
        if (!this.projectEditMode || !inputElement) {
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

    const projectStats = document.getElementById("project-stats");
    if (projectStats) {
      // Bestaande stat items verwijderen om duplicatie te voorkomen
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

  enableProjectEditMode() {
    console.log("✏️ Enabling project edit mode");
    this.projectEditMode = true;
    this.editMode = false; // Zorg dat algemene bewerkingsmodus uit staat

    document.getElementById("viewControls").style.display = "none";
    document.getElementById("editControls").style.display = "none"; // Zorg dat algemene edit controls verborgen zijn
    document.getElementById("projectEditControls").style.display = "flex";

    this.createEditableProjectFields();
  }

  disableProjectEditMode() {
    console.log("❌ Disabling project edit mode");
    this.projectEditMode = false;

    // Reset project data to initial state if cancelled
    this.studentData = { ...this.initialStudentData };

    document.getElementById("viewControls").style.display = "flex";
    document.getElementById("editControls").style.display = "none";
    document.getElementById("projectEditControls").style.display = "none";

    this.displayProjectInfo(); // Herstel projectveld weergave met oorspronkelijke data
    this.displayStudentGegevens(); // Zorg dat ook de algemene gegevens correct zijn (ongewijzigd)
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
      "tafel-nummer",
    ];

    projectFields.forEach((fieldId) => {
      const field = document.querySelector(`[data-field="${fieldId}"]`);
      if (field && this.studentData) {
        const currentValue = this.getProjectFieldValue(fieldId);
        const label = this.getProjectFieldLabel(fieldId);

        if (fieldId === "project-beschrijving" || fieldId === "over-mezelf") {
          field.innerHTML = `
            <div class="project-field-edit">
              <label for="edit-${fieldId}"><strong>${label}</strong></label>
              <textarea
                id="edit-${fieldId}"
                class="project-edit-input"
                rows="6"
                placeholder="Beschrijf je ${
                  fieldId.includes("beschrijving") ? "project" : "achtergrond"
                } hier..."
              >${currentValue}</textarea>
            </div>
          `;
        } else {
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

    const projectInputs = document.querySelectorAll(".project-edit-input");
    projectInputs.forEach((input) => {
      const fieldId = input.id.replace("edit-", "");
      const mappedField = this.getProjectFieldMapping(fieldId);
      if (mappedField) {
        projectData[mappedField] = input.value.trim();
      }
    });

    console.log("📦 Project data to save:", projectData);

    if (!this.validateProjectData(projectData)) {
      return;
    }

    // Roep de algemene update functie aan met de projectData
    // De updateStudentGegevens functie zal deze velden combineren met de rest van studentData
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
      const valueSpan = field.querySelector(".field-value");
      if (valueSpan) {
        const displayValue = value || "Niet ingevuld";
        valueSpan.textContent = displayValue;
        // console.log(`📝 Updated field ${fieldId}:`, displayValue); // Minder console.logs tijdens UI updates
      }
    } else {
      console.warn(`⚠️ Field not found: ${fieldId}`);
    }
  }

  // ✏️ Edit Mode Management
  enableEditMode() {
    console.log("✏️ Enabling edit mode");
    this.editMode = true;
    this.projectEditMode = false; // Zorg dat project bewerkingsmodus uit staat

    document.getElementById("viewControls").style.display = "none";
    document.getElementById("projectEditControls").style.display = "none"; // Zorg dat project edit controls verborgen zijn
    document.getElementById("editControls").style.display = "flex";

    this.createEditableFields();
  }

  disableEditMode() {
    console.log("❌ Disabling edit mode");
    this.editMode = false;

    // Reset student data to initial state if cancelled
    this.studentData = { ...this.initialStudentData };

    document.getElementById("viewControls").style.display = "flex";
    document.getElementById("editControls").style.display = "none";

    this.displayStudentGegevens(); // Herstel de weergave met de oorspronkelijke data
    this.displayProjectInfo(); // Zorg dat ook projectgegevens correct zijn (ongewijzigd)
  }

  createEditableFields() {
    console.log("📝 Creating editable fields");

    const editableFields = document.querySelectorAll(".editable-field");
    editableFields.forEach((field) => {
      const fieldId = field.getAttribute("data-field");
      const strongElement = field.querySelector("strong");

      // Skip project-related fields
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
        // Zorg ervoor dat deze velden terug naar hun display mode gaan
        this.updateField(fieldId, this.getProjectFieldValue(fieldId));
        return; // Sla het aanmaken van een input voor deze velden over
      }

      if (fieldId && this.studentData) {
        const currentValue = this.getFieldValue(fieldId);
        const labelText = strongElement ? strongElement.textContent : fieldId;

        // Geen textarea's meer in algemene modus, enkel input
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

  // 📝 Form Handling (Aangepast)
  // Deze methode is vereenvoudigd omdat de "save" knoppen direct updateStudentGegevens aanroepen
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
    const saveBtn = document.getElementById("saveBtn"); // Assuming you have a saveBtn for general data
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveGeneralChanges());
    }
  }

  async saveGeneralChanges() {
    console.log("💾 Saving general student changes");

    const generalData = {};
    const editInputs = document.querySelectorAll(
      '.editable-field:not([data-field^="project-"]) .edit-input'
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