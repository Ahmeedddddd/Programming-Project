// src/Server/CONTROLLERS/bedrijfController.js
// Dit is de controller voor alle bedrijfs-gerelateerde API-endpoints.
// Hier worden alle verzoeken afgehandeld die te maken hebben met bedrijven, zoals ophalen, aanmaken, bijwerken en verwijderen.
// De controller gebruikt het Bedrijf-model voor alle database-acties.

const Bedrijf = require('../MODELS/bedrijf');
const { validationResult } = require('express-validator');

const bedrijfController = {
  /**
   * Haal alle bedrijven op.
   * Optioneel: limiet en zoekterm via querystring.
   * GET /api/bedrijven
   */
  async getAllBedrijven(req, res) {
    try {
      let limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
      if (isNaN(limit) || limit < 1) limit = null;
      const searchTerm = req.query.search || '';
      // Haal bedrijven op via het model
      const bedrijven = await Bedrijf.getAll(limit, searchTerm);
      res.json({
        success: true,
        data: bedrijven,
        count: bedrijven.length
      });
    } catch (error) {
      // Fout bij ophalen bedrijven
      console.error('Error fetching companies:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch companies' });
    }
  },

  /**
   * Haal één bedrijf op via bedrijfsnummer.
   * GET /api/bedrijven/:bedrijfsnummer
   */
  async getBedrijf(req, res) {
    try {
      const { bedrijfsnummer } = req.params;
      if (!bedrijfsnummer || isNaN(bedrijfsnummer)) {
        // Ongeldig bedrijfsnummer meegegeven
        return res.status(400).json({ success: false, error: 'Invalid bedrijfsnummer provided' });
      }
      // Haal bedrijf op via het model
      const bedrijf = await Bedrijf.getById(bedrijfsnummer);
      if (!bedrijf) {
        // Bedrijf niet gevonden
        return res.status(404).json({ success: false, error: 'Company not found' });
      }
      // Voeg logo_url toe (default of op basis van bedrijfsnummer)
      bedrijf.logo_url = `/images/mystery man avatar.webp`;
      res.json({ success: true, data: bedrijf });
    } catch (error) {
      // Fout bij ophalen bedrijf
      console.error('Error fetching company:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch company' });
    }
  },

  /**
   * Haal de beschikbare tijdsloten van een bedrijf op.
   * GET /api/bedrijven/:bedrijfsnummer/slots
   */
  async getAvailableTimeSlots(req, res) {
    try {
      const { bedrijfsnummer } = req.params;
      // Haal tijdsloten op via het model
      const slots = await Bedrijf.getAvailableTimeSlots(bedrijfsnummer);
      res.json({ success: true, data: slots });
    } catch (error) {
      // Fout bij ophalen tijdsloten
      res.status(500).json({ success: false, message: 'Kon tijdsloten niet ophalen.' });
    }
  },

  /**
   * Haal het profiel van het ingelogde bedrijf op.
   * GET /api/bedrijven/profile
   */
  async getOwnProfile(req, res) {
    try {
      const bedrijfsnummer = req.user?.userId;
      if (!bedrijfsnummer) {
        // Geen bedrijfsnummer in token gevonden
        return res.status(400).json({ success: false, error: 'Bedrijfsnummer not found in token' });
      }
      // Haal bedrijf op via het model
      const bedrijf = await Bedrijf.getById(bedrijfsnummer);
      if (!bedrijf) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }
      res.json({ success: true, data: bedrijf });
    } catch (error) {
      // Fout bij ophalen profiel
      console.error('Error fetching own profile:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch company profile' });
    }
  },

  /**
   * Werk het profiel van het ingelogde bedrijf bij.
   * PUT /api/bedrijven/profile
   */
  async updateOwnProfile(req, res) {
    try {
      const bedrijfsnummer = req.user?.userId;
      if (!bedrijfsnummer) {
        return res.status(400).json({ success: false, error: 'Bedrijfsnummer not found in token' });
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Validatie is mislukt
        return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      }
      // Maak updateData aan zonder bedrijfsnummer/id
      const updateData = { ...req.body };
      delete updateData.bedrijfsnummer;
      delete updateData.id;
      // Update via het model
      const affectedRows = await Bedrijf.update(bedrijfsnummer, updateData);
      if (affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }
      const updatedBedrijf = await Bedrijf.getById(bedrijfsnummer);
      res.json({ success: true, message: 'Bedrijfsprofiel succesvol bijgewerkt', data: updatedBedrijf });
    } catch (error) {
      // Fout bij bijwerken profiel
      console.error('Error updating own profile:', error);
      res.status(500).json({ success: false, error: 'Failed to update company profile' });
    }
  },

  /**
   * Maak een nieuw bedrijf aan.
   * POST /api/bedrijven
   */
  async createBedrijf(req, res) {
    try {
      // Maak bedrijf aan via het model
      const bedrijfId = await Bedrijf.create(req.body);
      res.status(201).json({ success: true, message: 'Company created successfully', data: { bedrijfsnummer: bedrijfId, ...req.body } });
    } catch (error) {
      // Fout bij aanmaken bedrijf
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ success: false, error: 'Company already exists' });
      } else {
        console.error('Error creating company:', error);
        res.status(500).json({ success: false, error: 'Failed to create company' });
      }
    }
  },

  /**
   * Werk een bestaand bedrijf bij.
   * PUT /api/bedrijven/:bedrijfsnummer
   */
  async updateBedrijf(req, res) {
    try {
      const { bedrijfsnummer } = req.params;
      // Update via het model
      const affectedRows = await Bedrijf.update(bedrijfsnummer, req.body);
      if (affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }
      const updatedBedrijf = await Bedrijf.getById(bedrijfsnummer);
      res.json({ success: true, message: 'Company updated successfully', data: updatedBedrijf });
    } catch (error) {
      // Fout bij bijwerken bedrijf
      console.error('Error updating company:', error);
      res.status(500).json({ success: false, error: 'Failed to update company' });
    }
  },

  /**
   * Verwijder een bedrijf.
   * DELETE /api/bedrijven/:bedrijfsnummer
   */
  async deleteBedrijf(req, res) {
    try {
      const { bedrijfsnummer } = req.params;
      // Verwijder via het model
      const affectedRows = await Bedrijf.delete(bedrijfsnummer);
      if (affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }
      res.json({ success: true, message: 'Company deleted successfully', bedrijfsnummer });
    } catch (error) {
      // Fout bij verwijderen bedrijf
      console.error('Error deleting company:', error);
      res.status(500).json({ success: false, error: 'Failed to delete company' });
    }
  }
};

module.exports = bedrijfController;