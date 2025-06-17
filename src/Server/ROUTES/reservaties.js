// src/Server/ROUTES/reservaties.js
const express = require("express");
const router = express.Router();
const Reservatie = require("../MODELS/reservatie"); // Zorg dat dit pad klopt
const { authenticateToken, requireRole } = require("../MIDDLEWARE/auth"); // Zorg dat dit pad klopt

const EVENT_DATE_STRING = "2025-06-25"; // De vaste datum van het evenement

// Student vraagt een reservatie aan
router.post(
  "/request",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    const { bedrijfsnummer, tijdslot } = req.body; // 'datum' is niet meer nodig uit frontend, we gebruiken EVENT_DATE_STRING
    const studentnummer = req.user.studentnummer;

    if (!studentnummer || !bedrijfsnummer || !tijdslot) {
      return res.status(400).json({
        success: false,
        message:
          "Ontbrekende gegevens voor reservatie. Zorg dat tijdslot is geselecteerd.",
      });
    }

    try {
      const [startTimeStr, endTimeStr] = tijdslot.split("-");
      // BELANGRIJK: We creëren Date objecten met de VASTE EVENT_DATE_STRING
      const startTijd = new Date(
        `<span class="math-inline">\{EVENT\_DATE\_STRING\}T</span>{startTimeStr}:00`
      );
      const eindTijd = new Date(
        `<span class="math-inline">\{EVENT\_DATE\_STRING\}T</span>{endTimeStr}:00`
      );

      // Controleer op conflicten voor student EN bedrijf
      const conflicts = await Reservatie.checkTimeConflicts(
        studentnummer,
        bedrijfsnummer,
        startTijd,
        eindTijd
      );
      if (conflicts.length > 0) {
        const studentConflict = conflicts.some(
          (c) => c.studentnummer === studentnummer
        );
        const companyConflict = conflicts.some(
          (c) => c.bedrijfsnummer === bedrijfsnummer
        );

        if (studentConflict && companyConflict) {
          return res.status(409).json({
            success: false,
            message:
              "Dit tijdslot conflicteert met jouw planning én de planning van het bedrijf.",
          });
        } else if (studentConflict) {
          return res.status(409).json({
            success: false,
            message:
              "Dit tijdslot conflicteert met een reeds geplande afspraak in jouw agenda.",
          });
        } else if (companyConflict) {
          return res.status(409).json({
            success: false,
            message: "Dit tijdslot is al bezet of aangevraagd bij het bedrijf.",
          });
        }
      }

      const reservatieId = await Reservatie.create({
        studentnummer,
        bedrijfsnummer,
        startTijd: startTijd.toTimeString().split(" ")[0], // Sla alleen de tijd op als string "HH:MM:SS"
        eindTijd: eindTijd.toTimeString().split(" ")[0], // Sla alleen de tijd op als string "HH:MM:SS"
        status: "aangevraagd",
      });

      if (reservatieId) {
        res.status(201).json({
          success: true,
          message:
            "Reservatie succesvol aangevraagd. Wacht op bevestiging van het bedrijf.",
          reservatieId,
        });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Kon reservatie niet aanmaken." });
      }
    } catch (error) {
      console.error("Error creating reservation request:", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het aanvragen van de afspraak.",
      });
    }
  }
);

// Haal alle reservaties op voor de ingelogde student
router.get(
  "/my",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    const studentnummer = req.user.studentnummer;
    try {
      const reservaties = await Reservatie.getByStudent(studentnummer);
      // Voor de frontend, voeg de vaste datum toe aan de tijdvelden
      const formattedReservations = reservaties.map((r) => ({
        ...r,
        startTijd: new Date(
          `<span class="math-inline">\{EVENT\_DATE\_STRING\}T</span>{r.startTijd}`
        ).toISOString(),
        eindTijd: new Date(
          `<span class="math-inline">\{EVENT\_DATE\_STRING\}T</span>{r.eindTijd}`
        ).toISOString(),
      }));
      res.status(200).json({ success: true, data: formattedReservations });
    } catch (error) {
      console.error("Error fetching student reservations:", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het ophalen van studentafspraken.",
      });
    }
  }
);

// Haal alle reservaties (pending & confirmed) op voor het ingelogde bedrijf
router.get(
  "/company",
  authenticateToken,
  requireRole(["bedrijf"]),
  async (req, res) => {
    const bedrijfsnummer = req.user.bedrijfsnummer;
    try {
      const reservaties = await Reservatie.getByBedrijf(bedrijfsnummer);
      // Voor de frontend, voeg de vaste datum toe aan de tijdvelden
      const formattedReservations = reservaties.map((r) => ({
        ...r,
        startTijd: new Date(
          `<span class="math-inline">\{EVENT\_DATE\_STRING\}T</span>{r.startTijd}`
        ).toISOString(),
        eindTijd: new Date(
          `<span class="math-inline">\{EVENT\_DATE\_STRING\}T</span>{r.eindTijd}`
        ).toISOString(),
      }));
      res.status(200).json({ success: true, data: formattedReservations });
    } catch (error) {
      console.error("Error fetching company reservations:", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het ophalen van bedrijfsafspraken.",
      });
    }
  }
);

// Bedrijf accepteert een reservatie
router.put(
  "/:id/accept",
  authenticateToken,
  requireRole(["bedrijf"]),
  async (req, res) => {
    const { id: afspraakId } = req.params;
    const bedrijfsnummer = req.user.bedrijfsnummer;

    try {
      const reservatie = await Reservatie.getById(afspraakId);
      if (!reservatie || reservatie.bedrijfsnummer !== bedrijfsnummer) {
        return res.status(403).json({
          success: false,
          message: "Niet geautoriseerd om deze reservatie te beheren.",
        });
      }
      if (reservatie.status !== "aangevraagd") {
        return res.status(400).json({
          success: false,
          message:
            "Reservatie kan niet worden geaccepteerd in de huidige status.",
        });
      }

      const affectedRows = await Reservatie.updateStatus(afspraakId, {
        status: "bevestigd",
      });

      if (affectedRows > 0) {
        res
          .status(200)
          .json({ success: true, message: "Reservatie succesvol bevestigd." });
      } else {
        res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden of niet gewijzigd.",
        });
      }
    } catch (error) {
      console.error("Error accepting reservation:", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het accepteren van de afspraak.",
      });
    }
  }
);

// Bedrijf weigert een reservatie
router.put(
  "/:id/reject",
  authenticateToken,
  requireRole(["bedrijf"]),
  async (req, res) => {
    const { id: afspraakId } = req.params;
    const bedrijfsnummer = req.user.bedrijfsnummer;
    const { reden } = req.body;

    try {
      const reservatie = await Reservatie.getById(afspraakId);
      if (!reservatie || reservatie.bedrijfsnummer !== bedrijfsnummer) {
        return res.status(403).json({
          success: false,
          message: "Niet geautoriseerd om deze reservatie te beheren.",
        });
      }
      if (reservatie.status !== "aangevraagd") {
        return res.status(400).json({
          success: false,
          message: "Reservatie kan niet worden geweigerd in de huidige status.",
        });
      }

      const updateData = { status: "geweigerd" };
      if (reden) updateData.redenWeigering = reden;

      const affectedRows = await Reservatie.update(afspraakId, updateData);

      if (affectedRows > 0) {
        res
          .status(200)
          .json({ success: true, message: "Reservatie succesvol geweigerd." });
      } else {
        res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden of niet gewijzigd.",
        });
      }
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het weigeren van de afspraak.",
      });
    }
  }
);

// Student annuleert een reservatie
router.put(
  "/:id/cancel",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    const { id: afspraakId } = req.params;
    const studentnummer = req.user.studentnummer;

    try {
      const reservatie = await Reservatie.getById(afspraakId);
      if (!reservatie || reservatie.studentnummer !== studentnummer) {
        return res.status(403).json({
          success: false,
          message: "Niet geautoriseerd om deze reservatie te annuleren.",
        });
      }
      if (
        reservatie.status !== "aangevraagd" &&
        reservatie.status !== "bevestigd"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Reservatie kan niet worden geannuleerd in de huidige status.",
        });
      }

      const affectedRows = await Reservatie.updateStatus(afspraakId, {
        status: "geannuleerd",
      });

      if (affectedRows > 0) {
        res.status(200).json({
          success: true,
          message: "Reservatie succesvol geannuleerd.",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden of niet gewijzigd.",
        });
      }
    } catch (error) {
      console.error("Error canceling reservation:", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het annuleren van de afspraak.",
      });
    }
  }
);

module.exports = router;
