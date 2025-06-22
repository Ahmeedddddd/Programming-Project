// src/Server/ROUTES/reservaties.js
const express = require("express");
const router = express.Router();
const Reservatie = require("../MODELS/reservatie"); // Zorg dat dit pad klopt
const { authenticateToken, requireRole } = require("../MIDDLEWARE/auth"); // Zorg dat dit pad klopt
const Notificatie = require('../MODELS/notificatie');

const EVENT_DATE_STRING = "2025-06-25"; // De vaste datum van het evenement

// Organisator haalt alle reservaties op (voor admin panel)
router.get(
  "/",
  authenticateToken,
  requireRole(["organisator"]),
  async (req, res) => {
    try {
      const reservaties = await Reservatie.getAll();
      // Voor de frontend, voeg de vaste datum toe aan de tijdvelden
      const formattedReservations = reservaties.map((r) => ({
        ...r,
        startTijd: new Date(`${EVENT_DATE_STRING}T${r.startTijd}`).toISOString(),
        eindTijd: new Date(`${EVENT_DATE_STRING}T${r.eindTijd}`).toISOString(),
      }));
      res.status(200).json({ success: true, data: formattedReservations });
    } catch (error) {
      console.error("Error fetching all reservations:", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het ophalen van alle reservaties.",
      });
    }
  }
);

// Student of bedrijf vraagt een reservatie aan
router.post(
  "/request",
  authenticateToken,
  requireRole(["student", "bedrijf"]),
  async (req, res) => {
    const { bedrijfsnummer, studentnummer, tijdslot } = req.body;
    const user = req.user;
    let reserverendeStudent = null;
    let reserverendBedrijf = null;

    // Gebruik userType voor consistentie
    if (user.userType === 'student') {
      reserverendeStudent = user.studentnummer || user.userId || user.gebruikersId;
      reserverendBedrijf = bedrijfsnummer;
    } else if (user.userType === 'bedrijf') {
      reserverendeStudent = studentnummer;
      reserverendBedrijf = user.bedrijfsnummer || user.userId || user.gebruikersId;
    }

    // Debug logging
    console.log('[RESERVERING] userType:', user.userType, '| studentnummer:', reserverendeStudent, '| bedrijfsnummer:', reserverendBedrijf, '| tijdslot:', tijdslot);

    // Split tijdslot in startTijd en eindTijd
    let startTijd = null, eindTijd = null;
    if (tijdslot && tijdslot.includes('-')) {
      [startTijd, eindTijd] = tijdslot.split('-').map(t => t.trim());
    }

    if (!reserverendeStudent || !reserverendBedrijf || !startTijd || !eindTijd) {
      return res.status(400).json({
        success: false,
        message: `Ontbrekende gegevens voor reservatie. Ontvangen: studentnummer=${reserverendeStudent}, bedrijfsnummer=${reserverendBedrijf}, startTijd=${startTijd}, eindTijd=${eindTijd}`
      });
    }

    try {
      // Controleer op tijdsconflicten (bevestigde afspraken)
      const conflicts = await Reservatie.checkTimeConflicts(reserverendeStudent, reserverendBedrijf, startTijd, eindTijd);
      if (conflicts && conflicts.some(r => r.status === 'bevestigd')) {
        return res.status(409).json({
          success: false,
          message: 'Dit tijdslot is al bezet door een bevestigde afspraak.'
        });
      }

      const reservatieId = await Reservatie.create({
        studentnummer: reserverendeStudent,
        bedrijfsnummer: reserverendBedrijf,
        startTijd,
        eindTijd,
        status: 'aangevraagd',
        aangevraagdDoor: user.userType
      });

      if (reservatieId) {
        // Notificatie voor de andere partij
        if (user.userType === 'student') {
          await Notificatie.create({
            bedrijfsnummer: reserverendBedrijf,
            type: 'reservering_aanvraag',
            boodschap: `Nieuwe reserveringsaanvraag van student ${reserverendeStudent} voor tijdslot ${startTijd}-${eindTijd}.`
          });
        } else if (user.userType === 'bedrijf') {
          await Notificatie.create({
            studentnummer: reserverendeStudent,
            type: 'reservering_aanvraag',
            boodschap: `Nieuwe reserveringsaanvraag van bedrijf ${reserverendBedrijf} voor tijdslot ${startTijd}-${eindTijd}.`
          });
        }
        res.status(201).json({
          success: true,
          message: 'Reservatie succesvol aangevraagd. Wacht op bevestiging.',
          reservatieId,
        });
      } else {
        res.status(500).json({ success: false, message: 'Kon reservatie niet aanmaken.' });
      }
    } catch (error) {
      console.error('Error creating reservation request:', error);
      res.status(500).json({
        success: false,
        message: 'Interne serverfout bij het aanvragen van de afspraak.',
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
    // Pak altijd het juiste studentnummer uit de token
    const studentnummer = req.user.studentnummer || req.user.userId || req.user.gebruikersId;
    try {
      const reservaties = await Reservatie.getByStudent(studentnummer);
      // Voor de frontend, voeg de vaste datum toe aan de tijdvelden
      const formattedReservations = reservaties.map((r) => ({
        ...r,
        startTijd: new Date(`${EVENT_DATE_STRING}T${r.startTijd}`).toISOString(),
        eindTijd: new Date(`${EVENT_DATE_STRING}T${r.eindTijd}`).toISOString(),
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
    console.log("[DEBUG] req.user object:", req.user);
    const bedrijfsnummer = req.user.bedrijfsnummer || req.user.userId || req.user.gebruikersId;
    console.log("[DEBUG] Bedrijfsnummer uit token:", bedrijfsnummer);
    try {
      const reservaties = await Reservatie.getByBedrijf(bedrijfsnummer);
      // Voor de frontend, voeg de vaste datum toe aan de tijdvelden
      const formattedReservations = reservaties.map((r) => ({
        ...r,
        startTijd: new Date(`${EVENT_DATE_STRING}T${r.startTijd}`).toISOString(),
        eindTijd: new Date(`${EVENT_DATE_STRING}T${r.eindTijd}`).toISOString(),
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
    const bedrijfsnummer = req.user.bedrijfsnummer || req.user.userId || req.user.gebruikersId;

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
        // Notificatie voor student: geaccepteerd
        await Notificatie.create({
          studentnummer: reservatie.studentnummer,
          type: 'reservering_geaccepteerd',
          boodschap: `Je reservering bij bedrijf ${reservatie.bedrijfNaam || reservatie.bedrijfsnummer} is geaccepteerd voor tijdslot ${reservatie.startTijd}-${reservatie.eindTijd}.`
        });
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
    const bedrijfsnummer = req.user.bedrijfsnummer || req.user.userId || req.user.gebruikersId;
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
        // Notificatie voor student: geweigerd
        await Notificatie.create({
          studentnummer: reservatie.studentnummer,
          type: 'reservering_geweigerd',
          boodschap: `Je reservering bij bedrijf ${reservatie.bedrijfNaam || reservatie.bedrijfsnummer} is geweigerd voor tijdslot ${reservatie.startTijd}-${reservatie.eindTijd}.`
        });
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

// DELETE /api/reservaties/:id - Verwijder een geweigerde reservatie (alleen student, alleen als geweigerd)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['student']),
  async (req, res) => {
    const { id } = req.params;
    const studentnummer = req.user.studentnummer || req.user.userId || req.user.gebruikersId;
    try {
      const reservatie = await Reservatie.getById(id);
      if (!reservatie) {
        return res.status(404).json({ success: false, message: 'Reservatie niet gevonden.' });
      }
      if (reservatie.studentnummer != studentnummer) {
        return res.status(403).json({ success: false, message: 'Je mag alleen je eigen afspraken verwijderen.' });
      }
      if (reservatie.status !== 'geweigerd') {
        return res.status(400).json({ success: false, message: 'Alleen geweigerde afspraken kunnen verwijderd worden.' });
      }
      const deleted = await Reservatie.delete(id);
      if (deleted) {
        return res.status(200).json({ success: true, message: 'Reservatie succesvol verwijderd.' });
      } else {
        return res.status(500).json({ success: false, message: 'Verwijderen mislukt.' });
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      return res.status(500).json({ success: false, message: 'Interne serverfout bij verwijderen.' });
    }
  }
);

/* LET OP: Tijdslot mag alleen als bezet worden beschouwd als er een bevestigde afspraak is
Dit moet je ook in de frontend meenemen bij het tonen van slots (optioneel: backend kan een endpoint bieden)
In de backend: check alleen op status 'bevestigd' bij het bepalen van bezette slots
(Dit kan in de functie checkTimeConflicts of in de logica voor het ophalen van beschikbare slots)
*/
module.exports = router;
