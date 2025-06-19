// src/JS/RESULTS/BEDRIJVEN/resultaat-bedrijf.js
// Requires: api.js (for fetchWithAuth), reservatieService.js, notification-system.js

console.log("🏢 Bedrijf detail script geladen");

const EVENT_DATE_FOR_PLANNING = "2025-06-25"; // Datum van Student Project Showcase 2025

class BedrijfDetailManager {
  constructor() {
    console.log("📝 BedrijfDetailManager constructor aangeroepen");
    this.bedrijfData = null;
    this.contactpersoonData = null;
    this.bedrijfId = null;
    // API_BASE is niet nodig als je fetchWithAuth gebruikt met relatieve paden.
    // Dit is alleen relevant als je direct 'fetch' gebruikt naar absolute URLs.
    // Aangezien fetchWithAuth relatieve paden al afhandelt, kan this.API_BASE hier weggelaten worden,
    // of gebruikt worden voor externe API's indien nodig.
    // Voor de consistentie met je eerdere gedachten, laten we het hier als window.location.origin.
    this.API_BASE = window.location.origin;

    // Elementen voor de planning sectie
    this.reservationPlanningSection = document.getElementById(
      "reservationPlanningSection"
    );
    this.planningDateInput = document.getElementById("planningDateInput");
    this.prevDayBtn = document.getElementById("prevDayBtn");
    this.nextDayBtn = document.getElementById("nextDayBtn");
    this.timeSlotsContainer = document.getElementById("timeSlotsContainer");
    this.planningLoadingMessage = document.getElementById(
      "planningLoadingMessage"
    );
    this.planningNoSlotsMessage = document.getElementById(
      "planningNoSlotsMessage"
    );
    this.planningErrorMessage = document.getElementById("planningErrorMessage");
    this.currentPlanningDateDisplay = document.getElementById(
      "currentPlanningDateDisplay"
    );
    this.selectedSlotInfo = document.getElementById("selectedSlotInfo");
    this.confirmReservationBtn = document.getElementById(
      "confirmReservationBtn"
    );

    this.init(); // Constructor roept init aan
  }

  async init() {
    console.log("🚀 Initializing BedrijfDetailManager");
    try {
      this.bedrijfId = this.getBedrijfIdFromUrl();

      if (!this.bedrijfId) {
        console.error("❌ Geen bedrijf ID gevonden in URL");
        console.log("🔧 Huidige URL:", window.location.href);
        console.log("🔧 Verwacht formaat: /resultaat-bedrijf?id=1");

        // Probeer het eerste beschikbare bedrijf te laden als fallback
        await this.loadFirstAvailableBedrijf();
        // Als loadFirstAvailableBedrijf het bedrijfId succesvol zet, gaat de rest van init verder.
        // Als het faalt, toont het een error en is bedrijfId nog steeds null.
        if (!this.bedrijfId) {
          // Nog steeds geen bedrijfId na fallback poging
          this.showError(
            "Geen bedrijf ID gevonden en geen bedrijven beschikbaar. Ga terug naar alle bedrijven."
          );
          this.displayErrorState();
          return;
        }
      }

      console.log("🎯 Laden bedrijf met ID:", this.bedrijfId);
      await this.loadBedrijfDetail(); // Laad details van het nu geldige bedrijfId
      this.setupEventListeners();

      // Configureer de vaste datum in de planner UI
      this.configureFixedDatePlanningUI();
      // Laad direct de planning voor de vaste datum
      await this.loadCompanyPlanning(this.bedrijfId, EVENT_DATE_FOR_PLANNING);

      // Zet altijd de juiste bedrijf-id in de reserveren-link
      const reserveerLink = document.getElementById('reserveerLink');
      if (reserveerLink && this.bedrijfId) {
        reserveerLink.href = `/reservatie?bedrijfId=${this.bedrijfId}`;
        reserveerLink.classList.remove('disabled');
        reserveerLink.onclick = null;
      } else if (reserveerLink) {
        reserveerLink.href = '#';
        reserveerLink.classList.add('disabled');
        reserveerLink.onclick = (e) => { e.preventDefault(); alert('Geen bedrijf geselecteerd.'); };
      }
    } catch (error) {
      console.error("❌ Initialisatie mislukt:", error);
      this.showError(
        "Er ging iets mis bij het laden van de bedrijfsgegevens: " +
          error.message
      );
      this.displayErrorState(); // Toon de error state HTML bij init faling
    }
  }

  getBedrijfIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    console.log("🔍 Bedrijf ID from URL:", id);
    return id;
  }

  async loadFirstAvailableBedrijf() {
    try {
      console.log(
        "🔄 Geen ID opgegeven, laden van het eerste beschikbare bedrijf..."
      );

      // Gebruik fetch zonder Authorization header zodat gasten deze pagina kunnen zien
      const response = await fetch("/api/bedrijven");

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const firstBedrijf = data.data[0];
          this.bedrijfId = firstBedrijf.bedrijfsnummer;

          console.log(
            `✅ Eerste beschikbare bedrijf gebruikt: ${firstBedrijf.naam} (ID: ${this.bedrijfId})`
          );

          // Update URL zonder redirect voor een betere gebruikerservaring
          const newUrl = `${window.location.pathname}?id=${this.bedrijfId}`;
          window.history.replaceState({}, "", newUrl);

          return; // Keer terug, de hoofd init() flow zal loadBedrijfDetail aanroepen
        }
      }

      // Als er geen bedrijven zijn of de fetch faalt op een manier die niet door fetchWithAuth wordt afgehandeld
      this.showError(
        "Geen bedrijf ID gevonden en geen bedrijven beschikbaar. Ga terug naar alle bedrijven."
      );
    } catch (error) {
      console.error("❌ Fout bij het laden van het eerste bedrijf:", error);
      this.showError(
        "Fout bij het laden van bedrijven. Probeer later opnieuw of ga terug naar alle bedrijven."
      );
    }
  }

  // 📡 API Calls
  async loadBedrijfDetail() {
    console.log("📡 Laden bedrijfsdetails...");
    try {
      this.showLoading(true);

      // FIX: Gebruik fetch zonder Authorization header zodat gasten deze pagina kunnen zien
      const response = await fetch(`/api/bedrijven/${this.bedrijfId}`);

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Bedrijf niet gevonden");
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("📦 API Result:", result);

      if (result.success) {
        this.bedrijfData = result.data;
        console.log("✅ Bedrijf data geladen:", this.bedrijfData);
        this.displayBedrijfDetail();
        await this.loadContactpersoon(); // Laad contactpersoon na bedrijfsdetails
      } else {
        throw new Error(result.message || "Onbekende fout");
      }
    } catch (error) {
      console.error("❌ Fout bij het laden van bedrijfsdetails:", error);
      this.showError("Kan bedrijfsgegevens niet laden: " + error.message);
      this.displayErrorState();
    } finally {
      this.showLoading(false);
    }
  }

  async loadContactpersoon() {
    try {
      // Gebruik fetch zonder Authorization header zodat gasten deze pagina kunnen zien
      const response = await fetch(`/api/contactpersonen/bedrijf/${this.bedrijfId}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          this.contactpersoonData = result.data[0]; // Neem de eerste contactpersoon
          this.updateContactInfo();
        } else {
          console.log(
            "ℹ️ Geen contactpersoon data beschikbaar voor dit bedrijf."
          );
        }
      } else {
        console.warn(
          `⚠️ Fout bij het ophalen van contactpersonen: HTTP ${response.status}`
        );
      }
    } catch (error) {
      console.log(
        "❌ Fout bij het laden van contactpersonen (niet kritiek):",
        error.message
      );
    }
  }

  async loadCompanyPlanning(companyId, date) {
    if (!this.timeSlotsContainer) {
      console.error("❌ Time slots container not found.");
      return;
    }
    if (this.planningLoadingMessage)
      this.planningLoadingMessage.style.display = "block";
    if (this.planningNoSlotsMessage)
      this.planningNoSlotsMessage.style.display = "none";
    if (this.planningErrorMessage)
      this.planningErrorMessage.style.display = "none";
    this.timeSlotsContainer.innerHTML = "";

    this.selectedTimeSlot = null;
    if (this.selectedSlotInfo) this.selectedSlotInfo.classList.remove("show");

    if (this.currentPlanningDateDisplay) {
      const dateObj = new Date(EVENT_DATE_FOR_PLANNING);
      this.currentPlanningDateDisplay.textContent = dateObj.toLocaleDateString(
        "nl-BE",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      );
    }

    try {
      // Stuur de vaste datum mee, ook al negeert de backend de datum query voor AFSPRAAK
      const response = await fetch(`/api/bedrijven/${companyId}/planning/${date}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Fout bij het laden van de planning."
        );
      }

      const planning = result.data;
      const allAvailableSlots = planning.allAvailableSlots || [];
      const availableSlots = planning.availableSlots || [];
      const occupiedSlots = planning.occupiedSlots || [];

      if (this.timeSlotsContainer) {
        if (allAvailableSlots.length > 0) {
          allAvailableSlots.forEach((slot) => {
            const slotDiv = document.createElement("div");
            slotDiv.textContent = slot;
            slotDiv.classList.add("time-slot");

            if (occupiedSlots.includes(slot)) {
              slotDiv.classList.add("occupied");
              slotDiv.title = "Bezet";
            } else if (availableSlots.includes(slot)) {
              slotDiv.classList.add("available");
              slotDiv.title = "Beschikbaar";
              slotDiv.addEventListener("click", () =>
                this.selectTimeSlot(slot, slotDiv)
              );
            } else {
              slotDiv.classList.add("unavailable");
              slotDiv.title = "Niet beschikbaar";
              slotDiv.style.cursor = "not-allowed";
              slotDiv.style.opacity = "0.8";
            }
            this.timeSlotsContainer.appendChild(slotDiv);
          });
        } else {
          if (this.planningNoSlotsMessage)
            this.planningNoSlotsMessage.style.display = "block";
        }
      }
    } catch (error) {
      console.error("Error loading company planning:", error);
      if (this.planningErrorMessage) {
        this.planningErrorMessage.textContent = `Fout bij het laden van planning: ${error.message}`;
        this.planningErrorMessage.style.display = "block";
      }
    } finally {
      if (this.planningLoadingMessage)
        this.planningLoadingMessage.style.display = "none";
    }
  }

  // 🎨 UI Updates
  displayBedrijfDetail() {
    console.log("🎨 Displaying bedrijf detail");
    if (!this.bedrijfData) {
      console.warn("⚠️ Geen bedrijfsdata om weer te geven");
      return;
    }

    const mainContent = document.querySelector(".bedrijf-detail");
    if (mainContent) {
      mainContent.classList.add("content-loaded"); // Verberg skeleton
      mainContent.style.display = "grid"; // Zorg dat de main content zichtbaar is
    }
    const errorState = document.getElementById("errorState");
    if (errorState) errorState.style.display = "none"; // Verberg error state

    const data = this.bedrijfData;
    console.log("📊 Data om weer te geven:", data);

    document.title = `${data.naam} - CareerLaunch`; // Update pagina titel

    // Update logo met eerste letters van bedrijfsnaam of afbeelding
    const logoContainer = document.querySelector(".logo-container");
    if (logoContainer) {
      logoContainer.innerHTML = ""; // Leeg skeleton
      if (data.logoUrl) {
        const img = document.createElement("img");
        img.src = data.logoUrl;
        img.alt = `${data.naam} Logo`;
        img.className = "bedrijf-logo-img";
        logoContainer.appendChild(img);
      } else {
        const initials = this.getCompanyInitials(data.naam);
        const initialsDiv = document.createElement("div");
        initialsDiv.className = "bedrijf-initials"; // Vereist CSS voor .bedrijf-initials
        initialsDiv.textContent = initials;
        logoContainer.appendChild(initialsDiv);
      }
    }

    // Update hoofdinfo
    this.updateField("#companyNameDisplay", data.naam);
    this.updateField(
      "#companySectorDisplay",
      this.getCompanyTypeDescription(data.sector)
    );
    this.updateField(
      "#companyDescriptionDisplay",
      data.bechrijving || this.generateDefaultDescription(data)
    ); // Let op: bechrijving
    this.updateField(
      "#companyTableLocationDisplay",
      data.tafelNr ? `Tafel ${data.tafelNr}` : "Nog niet toegewezen"
    );

    // Update contactinformatie
    this.updateContactCard(data);
    this.updateContactInfo(); // Laad contactpersoon info als beschikbaar

    // Zorg ervoor dat de bedrijfsnaam ook in de planning sectie staat
    this.updateField("#planningCompanyNameDisplay", data.naam);

    console.log("✅ UI updated successfully");
  }

  updateContactCard(data) {
    const adresInfo = document.querySelector(".adres-info");
    if (adresInfo) {
      const adres = this.formatAddress(data);
      adresInfo.innerHTML = `
                <strong>${data.naam || "Bedrijf"}</strong><br/>
                ${adres}<br/>
                <br/>
                <strong>Contact:</strong><br/>
                📧 ${data.email || "N.v.t."}<br/>
                📞 ${data.gsm_nummer || "N.v.t."}<br/>
                🏢 ${data.sector || "N.v.t."}
            `;
    }
  }

  updateContactInfo() {
    if (!this.contactpersoonData) return;

    const contact = this.contactpersoonData;
    const adresInfo = document.querySelector(".adres-info");

    if (adresInfo) {
      adresInfo.innerHTML += `
                <br/>
                <strong>Contactpersoon:</strong><br/>
                👤 ${contact.voornaam} ${contact.achternaam}<br/>
                📧 ${contact.email}<br/>
                📞 ${contact.gsm_nummer}
            `;
    }
  }

  formatAddress(data) {
    const parts = [];

    if (data.straatnaam) parts.push(data.straatnaam);
    if (data.huisnummer) parts.push(data.huisnummer);
    if (data.bus) parts.push(`bus ${data.bus}`);

    const streetAddress = parts.filter(Boolean).join(" ");

    const cityParts = [];
    if (data.postcode) cityParts.push(data.postcode);
    if (data.gemeente) cityParts.push(data.gemeente);

    const cityAddress = cityParts.filter(Boolean).join(" ");

    const fullAddress = [streetAddress, cityAddress, data.land]
      .filter(Boolean)
      .join("<br/>");

    return fullAddress || "Adres informatie niet beschikbaar";
  }

  getCompanyInitials(naam) {
    if (!naam) return "";
    return naam
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  getCompanyTypeDescription(sector) {
    const descriptions = {
      AI: "Kunstmatige Intelligentie & Robotica",
      "Health informatics": "Gezondheids-IT & Medische Technologie",
      "Netwerk- en infrastructuurtechnologie": "Netwerk & Infrastructuur",
      "Informatie- en communicatietechnologie": "ICT & Consultancy",
      Duurzaamheid: "Duurzame Technologie & Milieu",
      Onderwijs: "EdTech & E-learning",
      Gezondheidszorg: "Healthcare & Medtech",
      Landbouwtechnologie: "AgTech & Robotica",
      Luchtvaartindustrie: "Luchtvaart & Drone Technologie",
      Software: "Software Development & Cloud",
      Biotech: "Biotechnologie & Life Sciences",
      Milieu: "Milieubeheer & Monitoring",
      "IT Consulting": "IT Consultancy & Services",
      "Design & Engineering": "Design & Technische Innovatie",
      "Duurzame Energie": "Hernieuwbare Energie & Technologie",
      Design: "Digital Design & Collaboration",
    };

    return descriptions[sector] || sector;
  }

  generateDefaultDescription(data) {
    if (!data.naam || !data.sector || !data.gemeente)
      return "Algemene informatie niet beschikbaar.";
    return (
      `${data.naam} is een innovatief bedrijf actief in de ${data.sector} sector. ` +
      `Gevestigd in ${data.gemeente}, bieden zij cutting-edge oplossingen ` +
      `en zijn zij aanwezig tijdens CareerLaunch om hun expertise en carrière-opportuniteiten te delen.`
    );
  }

  updateField(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
      console.log(`📝 Updated ${selector}:`, value);
    } else {
      console.warn(`⚠️ Element not found: ${selector}`);
    }
  }

  // Handlers voor de planning sectie
  selectTimeSlot(slot, element) {
    // Deselecteer eventueel eerder geselecteerd slot
    const previouslySelected = document.querySelector(".time-slot.selected");
    if (previouslySelected) {
      previouslySelected.classList.remove("selected");
    }

    // Selecteer het nieuwe slot
    element.classList.add("selected");
    this.selectedTimeSlot = slot;

    // Update de weergave van het geselecteerde slot
    if (document.getElementById("selectedTimeSlotDisplay")) {
      document.getElementById("selectedTimeSlotDisplay").textContent =
        this.selectedTimeSlot;
    }
    if (document.getElementById("selectedDateDisplay")) {
      const dateObj = new Date(EVENT_DATE_FOR_PLANNING);
      document.getElementById("selectedDateDisplay").textContent =
        dateObj.toLocaleDateString("nl-BE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    }
    if (this.selectedSlotInfo) {
      this.selectedSlotInfo.classList.add("show"); // Toon de sectie
    }
  }

  async handleReservation() {
    if (!this.bedrijfId || !this.selectedTimeSlot) {
      this.showNotification(
        "Selecteer een tijdslot om te reserveren.",
        "warning"
      );
      return;
    }

    this.showLoading(true);
    try {
      // Roep de reservatieService aan met het bedrijfsnummer en het geselecteerde tijdslot
      const success = await window.ReservatieService.requestReservation(
        this.bedrijfId,
        this.selectedTimeSlot
      );
      if (success) {
        // Na succesvolle aanvraag, herlaad de planning om de bijgewerkte status te zien
        await this.loadCompanyPlanning(this.bedrijfId, EVENT_DATE_FOR_PLANNING);
        if (this.selectedSlotInfo)
          this.selectedSlotInfo.classList.remove("show"); // Verberg selectie info
      }
    } catch (error) {
      console.error("Error during reservation:", error);
      this.showNotification(
        `Fout bij het reserveren: ${error.message}`,
        "error"
      );
    } finally {
      this.showLoading(false);
    }
  }

  // 🎯 Event Listeners
  setupEventListeners() {
    console.log("👂 Setting up event listeners");

    // Contact button
    const contactBtn = document.querySelector(".contact-btn");
    if (contactBtn) {
      contactBtn.addEventListener("click", () => {
        this.handleContactClick();
      });
    }

    // Favoriet/Reserve button - Deze knop opent nu de reserveringsplanner
    const favorietBtn = document.getElementById("favoriteBtn"); // Zorg dat de HTML id="favoriteBtn" heeft
    if (favorietBtn) {
      favorietBtn.addEventListener("click", () => {
        // Controleer of de gebruiker is ingelogd
        if (!localStorage.getItem("authToken")) {
          this.showError("Log in om een afspraak te plannen.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }
        // Toon de reserveringssectie
        if (this.reservationPlanningSection) {
          this.reservationPlanningSection.style.display = "block";
          this.reservationPlanningSection.scrollIntoView({
            behavior: "smooth",
          });
        }
      });
    }

    // Reserveringsbevestigingsknop
    if (this.confirmReservationBtn) {
      this.confirmReservationBtn.addEventListener("click", () =>
        this.handleReservation()
      );
    }

    // Back button (if exists)
    const backBtn = document.querySelector(".back-button"); // Zorg dat deze selector klopt
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        this.goBack();
      });
    }

    // Add back functionality to browser back button (optional, but good UX)
    window.addEventListener("popstate", () => {
      this.goBack();
    });
  }

  // Configureer de UI elementen voor een vaste datum planning
  configureFixedDatePlanningUI() {
    if (this.planningDateInput) {
      this.planningDateInput.value = EVENT_DATE_FOR_PLANNING;
      this.planningDateInput.readOnly = true;
      this.planningDateInput.style.pointerEvents = "none"; // Voorkom interactie
      this.planningDateInput.style.backgroundColor = "#f0f0f0"; // Grijze achtergrond
    }
    if (this.prevDayBtn) this.prevDayBtn.style.display = "none";
    if (this.nextDayBtn) this.nextDayBtn.style.display = "none";
  }

  handleContactClick() {
    if (!this.bedrijfData) return;

    const email = this.bedrijfData.email;
    const subject = encodeURIComponent(`CareerLaunch - Contact via website`);
    const body = encodeURIComponent(
      `Beste ${this.bedrijfData.naam},\n\nIk heb jullie profiel bekeken op CareerLaunch en zou graag in contact komen.\n\nMet vriendelijke groeten`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  goBack() {
    console.log("🔙 Navigeren terug naar alle bedrijven");

    // FIX: Navigeer met het gestandaardiseerde pad
    window.location.href = "/alle-bedrijven";
  }

  // 🔧 Utility Methods
  showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.style.display = show ? "flex" : "none";

      if (show) {
        setTimeout(() => {
          overlay.style.display = "none";
          console.log("⏰ Loading timeout - hiding overlay");
        }, 10000); // Auto-hide na 10 seconden
      }
    }
  }

  showError(message) {
    console.error("❌ Error:", message);
    // Gebruik de globale showNotification functie
    if (window.showNotification) {
      window.showNotification(message, "error");
    } else {
      alert("Error: " + message);
    }
  }

  showInfo(message) {
    console.log("ℹ️ Info:", message);
    // Gebruik de globale showNotification functie
    if (window.showNotification) {
      window.showNotification(message, "info");
    } else {
      alert(message);
    }
  }

  showNotification(message, type = "info") {
    // Deze methode is hier gedefinieerd als fallback, maar de intentie is om window.showNotification te gebruiken.
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      alert(message);
    }
  }

  displayErrorState() {
    const mainContent = document.querySelector(".bedrijf-detail");
    const errorState = document.getElementById("errorState");
    if (mainContent) mainContent.style.display = "none";
    if (errorState) errorState.style.display = "block";
  }

  displayFallbackData() {
    console.log("📦 Using fallback data");
    const mainContent = document.querySelector(".bedrijf-detail");
    if (mainContent) mainContent.classList.add("content-loaded"); // Om skeleton te verbergen

    this.bedrijfData = {
      bedrijfsnummer: this.bedrijfId,
      naam: "Bedrijf Informatie Niet Beschikbaar",
      sector: "Algemeen",
      gemeente: "Locatie onbekend",
      email: "info@bedrijf.be",
      gsm_nummer: "Telefoonnummer niet beschikbaar",
      bechrijving:
        "De gedetailleerde informatie voor dit bedrijf is momenteel niet beschikbaar. Probeer later opnieuw of ga terug naar alle bedrijven.",
    };

    this.displayBedrijfDetail();
    this.displayErrorState(); // Toon de fallback, maar ook de error state om dit duidelijk te maken
  }
}

// 🚀 Initialize
let bedrijfDetailManager;

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎯 DOM Content Loaded, initializing BedrijfDetailManager");
  try {
    bedrijfDetailManager = new BedrijfDetailManager();
    console.log("✅ BedrijfDetailManager initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize BedrijfDetailManager:", error);
  }
});

// Export for potential use (if other modules need to access this manager)
window.BedrijfDetailManager = BedrijfDetailManager;
