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

/**
 * 📅 Haalt alle reservaties op voor de ingelogde student
 * 
 * Endpoint voor studenten om hun eigen reservaties op te halen.
 * Retourneert alle reservaties (aangevraagd en bevestigd) voor de student.
 * 
 * @route GET /api/reservaties/my
 * @middleware authenticateToken, requireRole(["student"])
 * @returns {Object} JSON response met reservaties
 */
router.get(
  "/my",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    // Pak altijd het juiste studentnummer uit de token
    const studentnummer = req.user.userId;
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

/**
 * 🏢 Haalt alle reservaties op voor het ingelogde bedrijf
 * 
 * Endpoint voor bedrijven om hun eigen reservaties op te halen.
 * Retourneert alle reservaties (aangevraagd en bevestigd) voor het bedrijf.
 * 
 * @route GET /api/reservaties/company
 * @middleware authenticateToken, requireRole(["bedrijf"])
 * @returns {Object} JSON response met reservaties
 */
router.get(
  "/company",
  authenticateToken,
  requireRole(["bedrijf"]),
  async (req, res) => {
    const bedrijfsnummer = req.user.userId;
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

/**
 * ✅ Accepteert een reservatie (bedrijf of student)
 * 
 * Endpoint voor bedrijven en studenten om een aangevraagde reservatie te accepteren.
 * Controleert eerst of de gebruiker eigenaar is van de reservatie.
 * 
 * @route PUT /api/reservaties/:id/accept
 * @middleware authenticateToken, requireRole(["bedrijf", "student"])
 * @param {string} id - Reservatie ID
 * @returns {Object} JSON response met bevestiging
 */
router.put(
  "/:id/accept",
  authenticateToken,
  requireRole(["bedrijf", "student"]),
  async (req, res) => {
    const { id: afspraakId } = req.params;
    const { userType, userId } = req.user;

    try {
      const reservatie = await Reservatie.getById(afspraakId);
      if (!reservatie) {
        return res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden.",
        });
      }

      // Check ownership based on user type - use userId from JWT
      let isOwner = false;
      if (userType === 'bedrijf') {
        isOwner = reservatie.bedrijfsnummer == userId;
      } else if (userType === 'student') {
        isOwner = reservatie.studentnummer == userId;
      }

      if (!isOwner) {
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
        // Notificatie voor de andere partij
        try {
          if (userType === 'bedrijf') {
            await Notificatie.create({
              studentnummer: reservatie.studentnummer,
              type: 'reservering_geaccepteerd',
              boodschap: `Je reservering bij bedrijf ${reservatie.bedrijfNaam || reservatie.bedrijfsnummer} is geaccepteerd voor tijdslot ${reservatie.startTijd}-${reservatie.eindTijd}.`
            });
          } else if (userType === 'student') {
            await Notificatie.create({
              bedrijfsnummer: reservatie.bedrijfsnummer,
              type: 'reservering_geaccepteerd',
              boodschap: `Student ${reservatie.studentNaam || reservatie.studentnummer} heeft je reserveringsaanvraag geaccepteerd voor tijdslot ${reservatie.startTijd}-${reservatie.eindTijd}.`
            });
          }
        } catch (notificationError) {
          console.warn('[ACCEPT] Could not send notification:', notificationError);
          // Continue anyway - acceptance was successful
        }
        
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
  requireRole(["bedrijf", "student"]),
  async (req, res) => {
    const { id: afspraakId } = req.params;
    const { userType, userId } = req.user;
    const { reden } = req.body;

    // Debug logging
    console.log('[REJECT] User object:', req.user);
    console.log('[REJECT] Reservation ID:', afspraakId);
    console.log('[REJECT] Reason:', reden);

    try {
      const reservatie = await Reservatie.getById(afspraakId);
      if (!reservatie) {
        console.log('[REJECT] Reservation not found:', afspraakId);
        return res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden.",
        });
      }

      console.log('[REJECT] Found reservation:', {
        id: reservatie.id || reservatie.afspraakId,
        studentnummer: reservatie.studentnummer,
        bedrijfsnummer: reservatie.bedrijfsnummer,
        status: reservatie.status
      });

      // Check ownership based on user type - use userId from JWT
      let isOwner = false;
      if (userType === 'bedrijf') {
        isOwner = reservatie.bedrijfsnummer == userId;
        console.log('[REJECT] Company ownership check:', {
          reservationCompany: reservatie.bedrijfsnummer,
          userCompany: userId,
          isOwner: isOwner
        });
      } else if (userType === 'student') {
        isOwner = reservatie.studentnummer == userId;
        console.log('[REJECT] Student ownership check:', {
          reservationStudent: reservatie.studentnummer,
          userStudent: userId,
          isOwner: isOwner
        });
      }

      if (!isOwner) {
        console.log('[REJECT] Access denied - not owner');
        return res.status(403).json({
          success: false,
          message: "Niet geautoriseerd om deze reservatie te beheren.",
        });
      }

      if (reservatie.status !== "aangevraagd") {
        console.log('[REJECT] Invalid status:', reservatie.status);
        return res.status(400).json({
          success: false,
          message: "Reservatie kan niet worden geweigerd in de huidige status.",
        });
      }

      const updateData = { status: "geweigerd" };
      if (reden) updateData.redenWeigering = reden;

      const affectedRows = await Reservatie.update(afspraakId, updateData);

      if (affectedRows > 0) {
        // Notificatie voor de andere partij
        try {
          if (userType === 'bedrijf') {
            await Notificatie.create({
              studentnummer: reservatie.studentnummer,
              type: 'reservering_geweigerd',
              boodschap: `Je reservering bij bedrijf ${reservatie.bedrijfNaam || reservatie.bedrijfsnummer} is geweigerd voor tijdslot ${reservatie.startTijd}-${reservatie.eindTijd}.`
            });
          } else if (userType === 'student') {
            await Notificatie.create({
              bedrijfsnummer: reservatie.bedrijfsnummer,
              type: 'reservering_geweigerd',
              boodschap: `Student ${reservatie.studentNaam || reservatie.studentnummer} heeft je reserveringsaanvraag geweigerd voor tijdslot ${reservatie.startTijd}-${reservatie.eindTijd}.`
            });
          }
        } catch (notificationError) {
          console.warn('[REJECT] Could not send notification:', notificationError);
          // Continue anyway - rejection was successful
        }
        
        console.log('[REJECT] Success - reservation rejected');
        res
          .status(200)
          .json({ success: true, message: "Reservatie succesvol geweigerd." });
      } else {
        console.log('[REJECT] No rows affected');
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
  requireRole(["student", "bedrijf"]),
  async (req, res) => {
    const { id: afspraakId } = req.params;
    const { userType, userId } = req.user;

    // Debug logging
    console.log('[CANCEL] User object:', req.user);
    console.log('[CANCEL] Reservation ID:', afspraakId);

    try {
      const reservatie = await Reservatie.getById(afspraakId);
      if (!reservatie) {
        console.log('[CANCEL] Reservation not found:', afspraakId);
        return res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden.",
        });
      }

      console.log('[CANCEL] Found reservation:', {
        id: reservatie.id || reservatie.afspraakId,
        studentnummer: reservatie.studentnummer,
        bedrijfsnummer: reservatie.bedrijfsnummer,
        status: reservatie.status
      });

      // Check ownership based on user type - use userId from JWT
      let isOwner = false;
      if (userType === 'student') {
        isOwner = reservatie.studentnummer == userId;
        console.log('[CANCEL] Student ownership check:', {
          reservationStudent: reservatie.studentnummer,
          userStudent: userId,
          isOwner: isOwner
        });
      } else if (userType === 'bedrijf') {
        isOwner = reservatie.bedrijfsnummer == userId;
        console.log('[CANCEL] Company ownership check:', {
          reservationCompany: reservatie.bedrijfsnummer,
          userCompany: userId,
          isOwner: isOwner
        });
      }

      if (!isOwner) {
        console.log('[CANCEL] Access denied - not owner');
        return res.status(403).json({
          success: false,
          message: "Niet geautoriseerd om deze reservatie te annuleren.",
        });
      }

      if (
        reservatie.status !== "aangevraagd" &&
        reservatie.status !== "bevestigd"
      ) {
        console.log('[CANCEL] Invalid status:', reservatie.status);
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
        // Notificatie voor de andere partij
        try {
          if (userType === 'student') {
            await Notificatie.create({
              bedrijfsnummer: reservatie.bedrijfsnummer,
              type: 'reservering_geannuleerd',
              boodschap: `Student ${reservatie.studentNaam || reservatie.studentnummer} heeft de reservering geannuleerd voor tijdslot ${reservatie.startTijd}-${reservatie.eindTijd}.`
            });
          } else if (userType === 'bedrijf') {
            await Notificatie.create({
              studentnummer: reservatie.studentnummer,
              type: 'reservering_geannuleerd',
              boodschap: `Bedrijf ${reservatie.bedrijfNaam || reservatie.bedrijfsnummer} heeft de reservering geannuleerd voor tijdslot ${reservatie.startTijd}-${reservatie.eindTijd}.`
            });
          }
        } catch (notificationError) {
          console.warn('[CANCEL] Could not send notification:', notificationError);
          // Continue anyway - cancellation was successful
        }
        
        console.log('[CANCEL] Success - reservation cancelled');
        res.status(200).json({
          success: true,
          message: "Reservatie succesvol geannuleerd.",
        });
      } else {
        console.log('[CANCEL] No rows affected');
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
  requireRole(['student', 'bedrijf']),
  async (req, res) => {
    const { id } = req.params;
    const { userType, userId } = req.user;

    // Debug logging
    console.log('[DELETE] User object:', req.user);
    console.log('[DELETE] Reservation ID:', id);

    try {
      const reservatie = await Reservatie.getById(id);
      if (!reservatie) {
        console.log('[DELETE] Reservation not found:', id);
        return res.status(404).json({ success: false, message: 'Reservatie niet gevonden.' });
      }

      console.log('[DELETE] Found reservation:', {
        id: reservatie.id || reservatie.afspraakId,
        studentnummer: reservatie.studentnummer,
        bedrijfsnummer: reservatie.bedrijfsnummer,
        status: reservatie.status
      });

      // Check ownership - use userId from JWT
      const isOwner = (userType === 'student' && reservatie.studentnummer == userId) ||
                      (userType === 'bedrijf' && reservatie.bedrijfsnummer == userId);

      console.log('[DELETE] Ownership check:', {
        userType: userType,
        reservationStudent: reservatie.studentnummer,
        reservationCompany: reservatie.bedrijfsnummer,
        userStudent: userType === 'student' ? userId : null,
        userCompany: userType === 'bedrijf' ? userId : null,
        isOwner: isOwner
      });

      if (!isOwner) {
        console.log('[DELETE] Access denied - not owner');
        return res.status(403).json({ success: false, message: 'Je mag alleen je eigen afspraken verwijderen.' });
      }
      
      // Allow deletion for cancelled or rejected appointments
      if (!['geweigerd', 'geannuleerd'].includes(reservatie.status)) {
        console.log('[DELETE] Invalid status for deletion:', reservatie.status);
        return res.status(400).json({ success: false, message: 'Alleen geannuleerde of geweigerde afspraken kunnen worden verwijderd.' });
      }

      const deleted = await Reservatie.delete(id);
      if (deleted > 0) {
        console.log('[DELETE] Success - reservation deleted');
        return res.status(200).json({ success: true, message: 'Reservatie succesvol verwijderd.' });
      } else {
        console.log('[DELETE] Delete failed - no rows affected');
        return res.status(500).json({ success: false, message: 'Verwijderen mislukt.' });
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      return res.status(500).json({ success: false, message: 'Interne serverfout bij verwijderen.' });
    }
  }
);

// Organisator annuleert een reservatie (admin functie)
router.put(
  "/:id/admin-cancel",
  authenticateToken,
  requireRole(["organisator"]),
  async (req, res) => {
    const { id: afspraakId } = req.params;

    try {
      const reservatie = await Reservatie.getById(afspraakId);
      if (!reservatie) {
        return res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden.",
        });
      }

      // Organisator mag elke afspraak annuleren (behalve al geannuleerde)
      if (reservatie.status === "geannuleerd") {
        return res.status(400).json({
          success: false,
          message: "Reservatie is al geannuleerd.",
        });
      }

      const affectedRows = await Reservatie.updateStatus(afspraakId, {
        status: "geannuleerd",
      });

      if (affectedRows > 0) {
        // Optioneel: verstuur notificatie naar student en bedrijf
        try {
          await Notificatie.create({
            studentnummer: reservatie.studentnummer,
            bedrijfsnummer: reservatie.bedrijfsnummer,
            type: 'afspraak_geannuleerd_admin',
            bericht: `Uw afspraak van ${reservatie.startTijd} is geannuleerd door de organisator.`,
            status: 'nieuw'
          });
        } catch (notificationError) {
          console.warn('Could not send notification:', notificationError);
          // Continue anyway - cancellation was successful
        }

        res.status(200).json({
          success: true,
          message: "Reservatie succesvol geannuleerd door organisator.",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden of niet gewijzigd.",
        });
      }
    } catch (error) {
      console.error("Error canceling reservation (admin):", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het annuleren van de afspraak.",
      });
    }
  }
);

// Organisator wijzigt status van een reservatie (admin functie)
router.put(
  "/:id/admin-status",
  authenticateToken,
  requireRole(["organisator"]),
  async (req, res) => {
    const { id: afspraakId } = req.params;
    const { status } = req.body;

    // Valideer status
    const validStatuses = ['aangevraagd', 'bevestigd', 'geannuleerd', 'afgewerkt', 'no-show', 'geweigerd'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Ongeldige status. Toegestane waarden: ${validStatuses.join(', ')}`,
      });
    }

    try {
      const reservatie = await Reservatie.getById(afspraakId);
      if (!reservatie) {
        return res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden.",
        });
      }

      const affectedRows = await Reservatie.updateStatus(afspraakId, { status });

      if (affectedRows > 0) {
        // Optioneel: verstuur notificatie bij statuswijziging
        try {
          await Notificatie.create({
            studentnummer: reservatie.studentnummer,
            bedrijfsnummer: reservatie.bedrijfsnummer,
            type: 'afspraak_status_gewijzigd',
            bericht: `Status van uw afspraak is gewijzigd naar: ${status}`,
            status: 'nieuw'
          });
        } catch (notificationError) {
          console.warn('Could not send notification:', notificationError);
        }

        res.status(200).json({
          success: true,
          message: `Status succesvol gewijzigd naar: ${status}`,
          data: { id: afspraakId, status }
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Reservatie niet gevonden of niet gewijzigd.",
        });
      }
    } catch (error) {
      console.error("Error updating reservation status (admin):", error);
      res.status(500).json({
        success: false,
        message: "Interne serverfout bij het wijzigen van de status.",
      });
    }
  }
);

// Herstel een geannuleerde/geweigerde reservatie
router.put(
  '/:id/restore',
  authenticateToken,
  requireRole(['student', 'bedrijf']),
  async (req, res) => {
    const { id } = req.params;
    const { userType, userId } = req.user;

    // Debug logging
    console.log('[RESTORE] User object:', req.user);
    console.log('[RESTORE] Reservation ID:', id);

    try {
        const reservatie = await Reservatie.getById(id);
        if (!reservatie) {
            console.log('[RESTORE] Reservation not found:', id);
            return res.status(404).json({ success: false, message: 'Reservatie niet gevonden.' });
        }

        console.log('[RESTORE] Found reservation:', {
            id: reservatie.id || reservatie.afspraakId,
            studentnummer: reservatie.studentnummer,
            bedrijfsnummer: reservatie.bedrijfsnummer,
            status: reservatie.status
        });

        // Check ownership - use userId from JWT
        const isOwner = (userType === 'student' && reservatie.studentnummer == userId) ||
                        (userType === 'bedrijf' && reservatie.bedrijfsnummer == userId);

        console.log('[RESTORE] Ownership check:', {
            userType: userType,
            reservationStudent: reservatie.studentnummer,
            reservationCompany: reservatie.bedrijfsnummer,
            userStudent: userType === 'student' ? userId : null,
            userCompany: userType === 'bedrijf' ? userId : null,
            isOwner: isOwner
        });

        if (!isOwner) {
            console.log('[RESTORE] Access denied - not owner');
            return res.status(403).json({ success: false, message: 'Niet geautoriseerd voor deze actie.' });
        }
        
        // Check if restorable
        if (!['geannuleerd', 'geweigerd'].includes(reservatie.status)) {
            console.log('[RESTORE] Invalid status for restore:', reservatie.status);
            return res.status(400).json({ success: false, message: 'Deze afspraak kan niet hersteld worden.' });
        }

        // De status wordt teruggezet naar 'aangevraagd'
        const affectedRows = await Reservatie.updateStatus(id, { status: 'aangevraagd' });

        if (affectedRows > 0) {
            // Stuur notificatie naar de andere partij
            try {
                const otherParty = reservatie.aangevraagdDoor === 'student' ? 'bedrijf' : 'student';
                const message = `Een ${reservatie.status} afspraak is hersteld door de ${userType} en is opnieuw aangevraagd.`;
                
                if (otherParty === 'bedrijf') {
                    await Notificatie.create({ bedrijfsnummer: reservatie.bedrijfsnummer, type: 'reservering_hersteld', boodschap: message });
                } else {
                    await Notificatie.create({ studentnummer: reservatie.studentnummer, type: 'reservering_hersteld', boodschap: message });
                }
            } catch (notificationError) {
                console.warn('[RESTORE] Could not send notification:', notificationError);
                // Continue anyway - restore was successful
            }

            console.log('[RESTORE] Success - reservation restored');
            res.status(200).json({ success: true, message: 'Afspraak succesvol hersteld.' });
        } else {
            console.log('[RESTORE] No rows affected');
            res.status(500).json({ success: false, message: 'Herstellen van afspraak mislukt.' });
        }
    } catch (error) {
        console.error('Error restoring reservation:', error);
        res.status(500).json({ success: false, message: 'Interne serverfout bij herstellen van afspraak.' });
    }
  }
);

/* LET OP: Tijdslot mag alleen als bezet worden beschouwd als er een bevestigde afspraak is
Dit moet je ook in de frontend meenemen bij het tonen van slots (optioneel: backend kan een endpoint bieden)
In de backend: check alleen op status 'bevestigd' bij het bepalen van bezette slots
(Dit kan in de functie checkTimeConflicts of in de logica voor het ophalen van beschikbare slots)
*/
module.exports = router;
