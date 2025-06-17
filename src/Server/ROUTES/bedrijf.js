// src/Server/ROUTES/bedrijf.js
const express = require("express");
const router = express.Router();
const Bedrijf = require("../MODELS/bedrijf");
const Reservatie = require("../MODELS/reservatie");
const { authenticateToken, requireRole } = require("../MIDDLEWARE/auth");

const EVENT_DATE_STRING = "2025-06-25"; // De vaste datum van het evenement

// ... (rest van de routes: router.get('/', router.get('/:id'), router.put('/profile')) ...

// NIEUW: Route om de planning (beschikbare en bezette tijdslots) van een bedrijf op te halen
router.get(
  "/:id/planning/:date",
  authenticateToken,
  requireRole(["student", "bedrijf"]),
  async (req, res) => {
    const { id: bedrijfsnummer, date } = req.params; // 'date' wordt hier ontvangen, maar genegeerd in DB query voor AFSPRAAK tabel

    try {
      const bedrijf = await Bedrijf.getById(bedrijfsnummer);
      if (!bedrijf) {
        return res
          .status(404)
          .json({ success: false, message: "Bedrijf niet gevonden." });
      }

      const baseAvailableSlots = bedrijf.beschikbareTijdslots || [];

      if (baseAvailableSlots.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Bedrijf heeft nog geen planning ingesteld.",
          data: {
            bedrijfsnummer: bedrijf.bedrijfsnummer,
            naam: bedrijf.naam,
            datum: EVENT_DATE_STRING, // Gebruik de vaste datum
            allAvailableSlots: [],
            occupiedSlots: [],
            availableSlots: [],
          },
        });
      }

      // Haal alle BEVESTIGDE en AANGEVRAAGDE afspraken op voor dit bedrijf.
      // Aangezien AFSPRAAK geen datum kolom heeft, filteren we hier niet op datum in de DB.
      const occupiedReservations = await Reservatie.getByBedrijfAndDate(
        bedrijfsnummer,
        date
      ); // date parameter is genegeerd in model
      const occupiedSlots = occupiedReservations.map((r) => {
        // Tijd kan direct worden gebruikt, ze zijn al strings (HH:MM:SS)
        const start = r.startTijd.substring(0, 5); // HH:MM
        const end = r.eindTijd.substring(0, 5); // HH:MM
        return `<span class="math-inline">\{start\}\-</span>{end}`;
      });

      const currentAvailableSlots = baseAvailableSlots.filter((slot) => {
        const isOccupied = occupiedSlots.some((occupied) => {
          // Controlleer op exacte match of overlap, afhankelijk van hoe strikt je wilt zijn
          return occupied === slot;
        });
        return !isOccupied;
      });

      res.status(200).json({
        success: true,
        data: {
          bedrijfsnummer: bedrijf.bedrijfsnummer,
          naam: bedrijf.naam,
          datum: EVENT_DATE_STRING, // Gebruik de vaste datum
          allAvailableSlots: baseAvailableSlots,
          occupiedSlots: occupiedSlots,
          availableSlots: currentAvailableSlots,
        },
      });
    } catch (error) {
      console.error("Error fetching company planning:", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het ophalen van de bedrijfsplanning.",
      });
    }
  }
);

// Optioneel: route om beschikbare tijdslots te configureren voor een bedrijf
// ... (deze route blijft hetzelfde als in vorige antwoord) ...

module.exports = router;
