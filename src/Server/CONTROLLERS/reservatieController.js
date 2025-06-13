//src/Server/CONTROLLERS/reservatieController.js
const Reservatie = require('../MODELS/reservatie');
const { validationResult } = require('express-validator');

const reservatieController = {

  // ===== PUBLIC/ADMIN ENDPOINTS =====

  // GET /api/reservaties - Alle reservaties ophalen (admin only)
  async getAllReservaties(req, res) {
    try {
      const reservaties = await Reservatie.getAll();
      res.json({
        success: true,
        data: reservaties,
        count: reservaties.length
      });
    } catch (error) {
      console.error('Error fetching reservations:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch reservations',
        message: 'Er ging iets mis bij het ophalen van de reservaties'
      });
    }
  },

  // GET /api/reservaties/:id - Specifieke reservatie ophalen
  async getReservatie(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid reservation ID provided' 
        });
      }

      const reservatie = await Reservatie.getById(id);
      
      if (!reservatie) {
        return res.status(404).json({ 
          success: false,
          error: 'Reservation not found',
          message: 'Reservatie niet gevonden'
        });
      }

      // Check if user can access this reservation
      if (req.user.userType !== 'organisator') {
        const canAccess = (req.user.userType === 'student' && reservatie.studentnummer === req.user.userId) ||
                         (req.user.userType === 'bedrijf' && reservatie.bedrijfsnummer === req.user.userId);
        
        if (!canAccess) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'U heeft geen toegang tot deze reservatie'
          });
        }
      }
      
      res.json({
        success: true,
        data: reservatie
      });
    } catch (error) {
      console.error('Error fetching reservation:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch reservation',
        message: 'Er ging iets mis bij het ophalen van de reservatie'
      });
    }
  },

  // ===== USER SPECIFIC ENDPOINTS =====

  // GET /api/reservaties/my - Eigen reservaties ophalen
  async getMyReservaties(req, res) {
    try {
      const userId = req.user.userId;
      const userType = req.user.userType;
      
      let reservaties;
      
      if (userType === 'student') {
        reservaties = await Reservatie.getByStudent(userId);
      } else if (userType === 'bedrijf') {
        reservaties = await Reservatie.getByBedrijf(userId);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid user type for this endpoint'
        });
      }

      res.json({
        success: true,
        data: reservaties,
        count: reservaties.length,
        userType: userType
      });
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch your reservations',
        message: 'Er ging iets mis bij het ophalen van uw reservaties'
      });
    }
  },

  // ===== CRUD ENDPOINTS =====

  // POST /api/reservaties - Nieuwe reservatie aanmaken
  async createReservatie(req, res) {
    try {
      const { studentnummer, bedrijfsnummer, startTijd, eindTijd, opmerkingen } = req.body;
      
      // Basic validation
      if (!studentnummer || !bedrijfsnummer || !startTijd || !eindTijd) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields',
          message: 'Studentnummer, bedrijfsnummer, startTijd en eindTijd zijn verplicht',
          required: ['studentnummer', 'bedrijfsnummer', 'startTijd', 'eindTijd']
        });
      }

      // Check if user can create this reservation
      if (req.user.userType === 'student' && req.user.userId !== studentnummer) {
        return res.status(403).json({
          success: false,
          error: 'Students can only create reservations for themselves'
        });
      }

      if (req.user.userType === 'bedrijf' && req.user.userId !== parseInt(bedrijfsnummer)) {
        return res.status(403).json({
          success: false,
          error: 'Companies can only accept reservations for themselves'
        });
      }

      // Check for time conflicts
      const conflicts = await Reservatie.checkTimeConflicts(studentnummer, bedrijfsnummer, startTijd, eindTijd);
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Time conflict detected',
          message: 'Er is al een reservatie op dit tijdstip',
          conflicts: conflicts
        });
      }

      const reservatieData = {
        studentnummer,
        bedrijfsnummer,
        startTijd,
        eindTijd,
        opmerkingen: opmerkingen || null,
        status: 'aangevraagd'
      };

      const reservatieId = await Reservatie.create(reservatieData);
      
      // Haal de nieuwe reservatie op met alle details
      const newReservatie = await Reservatie.getById(reservatieId);

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: newReservatie
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create reservation',
        message: 'Er ging iets mis bij het aanmaken van de reservatie'
      });
    }
  },

  // PUT /api/reservaties/:id/status - Reservatie status bijwerken
  async updateReservatieStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, opmerkingen } = req.body;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid reservation ID provided'
        });
      }

      if (!status) {
        return res.status(400).json({ 
          success: false,
          error: 'Status is required'
        });
      }
      
      const validStatuses = ['aangevraagd', 'bevestigd', 'geweigerd', 'geannuleerd', 'afgewerkt', 'no-show'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: `Status moet een van de volgende zijn: ${validStatuses.join(', ')}`,
          validStatuses: validStatuses
        });
      }

      // Haal reservatie op om rechten te checken
      const reservatie = await Reservatie.getById(id);
      if (!reservatie) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      // Check permissions
      const canUpdate = req.user.userType === 'organisator' ||
                       (req.user.userType === 'bedrijf' && reservatie.bedrijfsnummer == req.user.userId) ||
                       (req.user.userType === 'student' && reservatie.studentnummer === req.user.userId && status === 'geannuleerd');

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'U heeft geen rechten om deze reservatie bij te werken'
        });
      }

      const updateData = { 
        status,
        opmerkingen: opmerkingen || reservatie.opmerkingen
      };

      const affectedRows = await Reservatie.updateStatus(id, updateData);
      
      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      // Haal bijgewerkte reservatie op
      const updatedReservatie = await Reservatie.getById(id);

      res.json({ 
        success: true,
        message: 'Reservation status updated successfully',
        data: updatedReservatie
      });
    } catch (error) {
      console.error('Error updating reservation status:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update reservation status',
        message: 'Er ging iets mis bij het bijwerken van de reservatie'
      });
    }
  },

  // PUT /api/reservaties/:id - Volledige reservatie bijwerken
  async updateReservatie(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid reservation ID provided'
        });
      }

      // Alleen organisator kan volledige updates doen
      if (req.user.userType !== 'organisator') {
        return res.status(403).json({
          success: false,
          error: 'Only organisators can fully update reservations'
        });
      }

      const affectedRows = await Reservatie.update(id, req.body);
      
      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      res.json({ 
        success: true,
        message: 'Reservation updated successfully'
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update reservation',
        message: 'Er ging iets mis bij het bijwerken van de reservatie'
      });
    }
  },

  // DELETE /api/reservaties/:id - Reservatie verwijderen
  async deleteReservatie(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid reservation ID provided'
        });
      }

      // Alleen organisator kan reservaties verwijderen
      if (req.user.userType !== 'organisator') {
        return res.status(403).json({
          success: false,
          error: 'Only organisators can delete reservations'
        });
      }

      const affectedRows = await Reservatie.delete(id);
      
      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        });
      }

      res.json({ 
        success: true,
        message: 'Reservation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting reservation:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete reservation',
        message: 'Er ging iets mis bij het verwijderen van de reservatie'
      });
    }
  },

  // ===== STATISTICS ENDPOINTS =====

  // GET /api/reservaties/stats - Reservatie statistieken
  async getReservatieStats(req, res) {
    try {
      const stats = await Reservatie.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching reservation stats:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch reservation statistics'
      });
    }
  }
};

module.exports = reservatieController;