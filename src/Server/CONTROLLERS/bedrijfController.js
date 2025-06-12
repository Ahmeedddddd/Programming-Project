//src/Server/CONTROLLERS/bedrijfController.js
const Bedrijf = require('../MODELS/bedrijf');
const { validationResult } = require('express-validator');

const bedrijfController = {
  
  // ===== PUBLIC ENDPOINTS =====
  
  // GET /api/bedrijven - Alle bedrijven ophalen
  async getAllBedrijven(req, res) {
    try {
      const bedrijven = await Bedrijf.getAll();
      res.json({
        success: true,
        data: bedrijven,
        count: bedrijven.length
      });
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch companies',
        message: 'Er ging iets mis bij het ophalen van de bedrijven'
      });
    }
  },

  // GET /api/bedrijven/:bedrijfsnummer - Specifiek bedrijf ophalen
  async getBedrijf(req, res) {
    try {
      const { bedrijfsnummer } = req.params;
      
      if (!bedrijfsnummer || isNaN(bedrijfsnummer)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid bedrijfsnummer provided' 
        });
      }

      const bedrijf = await Bedrijf.getById(bedrijfsnummer);
      
      if (!bedrijf) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found',
          message: 'Bedrijf met dit nummer bestaat niet'
        });
      }
      
      res.json({
        success: true,
        data: bedrijf
      });
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch company',
        message: 'Er ging iets mis bij het ophalen van het bedrijf'
      });
    }
  },

  // ===== AUTHENTICATED ENDPOINTS =====

  // GET /api/bedrijf/profile - Eigen bedrijfsgegevens bekijken
  async getOwnProfile(req, res) {
    try {
      // req.user.userId bevat het bedrijfsnummer voor bedrijven
      const bedrijfsnummer = req.user.userId;
      
      if (!bedrijfsnummer) {
        return res.status(400).json({ 
          success: false,
          error: 'Bedrijfsnummer not found in token',
          message: 'Uw sessie is ongeldig, log opnieuw in'
        });
      }

      const bedrijf = await Bedrijf.getById(bedrijfsnummer);
      
      if (!bedrijf) {
        return res.status(404).json({ 
          success: false,
          error: 'Bedrijf not found',
          message: 'Uw bedrijfsprofiel werd niet gevonden'
        });
      }

      res.json({
        success: true,
        data: bedrijf,
        message: 'Bedrijfsprofiel succesvol opgehaald'
      });
    } catch (error) {
      console.error('Error fetching own profile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch company profile',
        message: 'Er ging iets mis bij het ophalen van uw profiel'
      });
    }
  },

  // PUT /api/bedrijf/profile - Eigen bedrijfsgegevens bijwerken
  async updateOwnProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const bedrijfsnummer = req.user.userId;
      
      if (!bedrijfsnummer) {
        return res.status(400).json({ 
          success: false,
          error: 'Bedrijfsnummer not found in token'
        });
      }

      // Voorkom dat ze hun eigen ID kunnen wijzigen
      const updateData = { ...req.body };
      delete updateData.bedrijfsnummer;
      delete updateData.id;

      const affectedRows = await Bedrijf.update(bedrijfsnummer, updateData);
      
      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found',
          message: 'Uw bedrijfsprofiel werd niet gevonden'
        });
      }

      // Haal updated data op
      const updatedBedrijf = await Bedrijf.getById(bedrijfsnummer);

      res.json({ 
        success: true,
        message: 'Bedrijfsprofiel succesvol bijgewerkt',
        data: updatedBedrijf
      });
    } catch (error) {
      console.error('Error updating own profile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update company profile',
        message: 'Er ging iets mis bij het bijwerken van uw profiel'
      });
    }
  },

  // ===== ADMIN ENDPOINTS =====

  // POST /api/bedrijven - Nieuw bedrijf aanmaken (alleen organisator)
  async createBedrijf(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const bedrijfId = await Bedrijf.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: {
          bedrijfsnummer: bedrijfId,
          ...req.body
        }
      });
    } catch (error) {
      console.error('Error creating company:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ 
          success: false,
          error: 'Company already exists',
          message: 'Er bestaat al een bedrijf met deze gegevens'
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to create company',
          message: 'Er ging iets mis bij het aanmaken van het bedrijf'
        });
      }
    }
  },

  // PUT /api/bedrijven/:bedrijfsnummer - Bedrijf bijwerken (organisator of bedrijf zelf)
  async updateBedrijf(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { bedrijfsnummer } = req.params;
      
      // Check of bedrijf zichzelf wil updaten of organisator is
      if (req.user.userType === 'bedrijf' && req.user.userId !== parseInt(bedrijfsnummer)) {
        return res.status(403).json({ 
          success: false,
          error: 'Forbidden',
          message: 'U kunt alleen uw eigen bedrijfsprofiel bijwerken'
        });
      }

      const affectedRows = await Bedrijf.update(bedrijfsnummer, req.body);
      
      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      res.json({ 
        success: true,
        message: 'Company updated successfully',
        bedrijfsnummer: bedrijfsnummer
      });
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update company',
        message: 'Er ging iets mis bij het bijwerken van het bedrijf'
      });
    }
  },

  // DELETE /api/bedrijven/:bedrijfsnummer - Bedrijf verwijderen (alleen organisator)
  async deleteBedrijf(req, res) {
    try {
      const { bedrijfsnummer } = req.params;
      
      if (!bedrijfsnummer || isNaN(bedrijfsnummer)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid bedrijfsnummer provided'
        });
      }

      const affectedRows = await Bedrijf.delete(bedrijfsnummer);
      
      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      res.json({ 
        success: true,
        message: 'Company deleted successfully',
        bedrijfsnummer: bedrijfsnummer
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete company',
        message: 'Er ging iets mis bij het verwijderen van het bedrijf'
      });
    }
  }
};

module.exports = bedrijfController;