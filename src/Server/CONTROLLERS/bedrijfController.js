const Bedrijf = require('../MODELS/bedrijf');
const { validationResult } = require('express-validator');

const bedrijfController = {
  async getAllBedrijven(req, res) {
    try {
      const bedrijven = await Bedrijf.getAll();
      res.json(bedrijven);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  },

  async getBedrijf(req, res) {
    try {
      const bedrijf = await Bedrijf.getById(req.params.bedrijfsnummer);
      if (!bedrijf) {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json(bedrijf);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ error: 'Failed to fetch company' });
    }
  },

  async createBedrijf(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bedrijfId = await Bedrijf.create(req.body);
      res.status(201).json({
        message: 'Company created successfully',
        bedrijfsnummer: bedrijfId
      });
    } catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({ error: 'Failed to create company' });
    }
  },

  async getGegevensBedrijf(req, res) {
  try {
    // req.user.userId bevat het bedrijfsnummer voor bedrijven
    const bedrijfsnummer = req.user.userId;
    
    const bedrijf = await Bedrijf.getById(bedrijfsnummer);
    
    if (!bedrijf) {
      return res.status(404).json({ error: 'Bedrijf not found' });
    }

    res.json(bedrijf); 

  } catch (error) {
    console.error('Error fetching company details:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
},

  async updateBedrijf(req, res) {
    try {
      const affectedRows = await Bedrijf.update(req.params.bedrijfsnummer, req.body);
      if (affectedRows === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json({ message: 'Company updated successfully' });
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  },

  async deleteBedrijf(req, res) {
    try {
      const affectedRows = await Bedrijf.delete(req.params.bedrijfsnummer);
      if (affectedRows === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json({ message: 'Company deleted successfully' });
    } catch (error) {
      console.error('Error deleting company:', error);
      res.status(500).json({ error: 'Failed to delete company' });
    }
  }
};

module.exports = bedrijfController;