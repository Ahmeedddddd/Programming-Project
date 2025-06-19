// src/Server/CONTROLLERS/bedrijfController.js

const { pool } = require('../CONFIG/database');
const { validationResult } = require('express-validator');

const bedrijfController = {
  
  // ===== PUBLIC ENDPOINTS =====
  
  // GET /api/bedrijven - Alle bedrijven ophalen
  async getAllBedrijven(req, res) {
    try {
      console.log('📋 [bedrijfController] getAllBedrijven called');
      
      let limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
      if (isNaN(limit) || limit < 1) limit = 50; // Default limit
      
      const searchTerm = req.query.search || '';
      
      let query = `
        SELECT 
          bedrijfsnummer,
          bedrijfsnaam,
          email,
          website,
          stad,
          beschrijving,
          sector,
          werknemers,
          logo_url,
          created_at
        FROM bedrijven 
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramCount = 0;

      // Add search filter if provided
      if (searchTerm) {
        paramCount++;
        query += ` AND (bedrijfsnaam ILIKE $${paramCount} OR beschrijving ILIKE $${paramCount} OR sector ILIKE $${paramCount})`;
        queryParams.push(`%${searchTerm}%`);
      }

      query += ` ORDER BY bedrijfsnaam ASC`;
      
      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        queryParams.push(limit);
      }

      const result = await pool.query(query, queryParams);
      
      console.log(`✅ [bedrijfController] Found ${result.rows.length} bedrijven`);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        searchTerm: searchTerm || null
      });
    } catch (error) {
      console.error('❌ [bedrijfController] Error fetching companies:', error);
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
      console.log('🔍 [bedrijfController] getBedrijf called');
      const { bedrijfsnummer } = req.params;
      
      if (!bedrijfsnummer || isNaN(bedrijfsnummer)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid bedrijfsnummer provided',
          message: 'Ongeldig bedrijfsnummer'
        });
      }

      const query = `
        SELECT 
          bedrijfsnummer,
          bedrijfsnaam,
          email,
          website,
          adres,
          postcode,
          stad,
          beschrijving,
          sector,
          werknemers,
          logo_url,
          contactpersoon_naam,
          contactpersoon_functie,
          created_at
        FROM bedrijven 
        WHERE bedrijfsnummer = $1
      `;

      const result = await pool.query(query, [bedrijfsnummer]);
      
      if (result.rows.length === 0) {
        console.log('❌ [bedrijfController] Bedrijf not found:', bedrijfsnummer);
        return res.status(404).json({ 
          success: false,
          error: 'Company not found',
          message: 'Bedrijf met dit nummer bestaat niet'
        });
      }
      
      console.log('✅ [bedrijfController] Bedrijf found:', result.rows[0].bedrijfsnaam);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ [bedrijfController] Error fetching company:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch company',
        message: 'Er ging iets mis bij het ophalen van het bedrijf'
      });
    }
  },

  // ===== AUTHENTICATED ENDPOINTS =====

  // GET /api/bedrijven/profile - Eigen bedrijfsgegevens bekijken
  async getOwnProfile(req, res) {
    try {
      console.log('👤 [bedrijfController] getOwnProfile called for user:', req.user?.email);
      
      if (!req.user || req.user.userType !== 'bedrijf') {
        console.log('❌ [bedrijfController] Unauthorized access attempt');
        return res.status(403).json({ 
          success: false,
          error: 'Access denied',
          message: 'Alleen bedrijven kunnen hun eigen profiel bekijken'
        });
      }

      // Get bedrijf data based on user email (since bedrijven are identified by email)
      const query = `
        SELECT 
          bedrijfsnummer,
          bedrijfsnaam,
          email,
          telefoonnummer,
          website,
          adres,
          postcode,
          stad,
          beschrijving,
          sector,
          werknemers,
          logo_url,
          contactpersoon_naam,
          contactpersoon_functie,
          contactpersoon_email,
          contactpersoon_telefoon,
          created_at,
          updated_at
        FROM bedrijven 
        WHERE email = $1
      `;

      const result = await pool.query(query, [req.user.email]);
      
      if (result.rows.length === 0) {
        console.log('❌ [bedrijfController] No bedrijf found for email:', req.user.email);
        return res.status(404).json({ 
          success: false,
          error: 'Bedrijf not found',
          message: 'Uw bedrijfsprofiel werd niet gevonden'
        });
      }

      const bedrijf = result.rows[0];
      console.log('✅ [bedrijfController] Profile loaded for:', bedrijf.bedrijfsnaam);

      res.json({
        success: true,
        data: bedrijf,
        message: 'Bedrijfsprofiel succesvol opgehaald'
      });
    } catch (error) {
      console.error('❌ [bedrijfController] Error fetching own profile:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch company profile',
        message: 'Er ging iets mis bij het ophalen van uw profiel'
      });
    }
  },

  // PUT /api/bedrijven/profile - Eigen bedrijfsgegevens bijwerken
  async updateOwnProfile(req, res) {
    try {
      console.log('📝 [bedrijfController] updateOwnProfile called for user:', req.user?.email);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      if (!req.user || req.user.userType !== 'bedrijf') {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied',
          message: 'Alleen bedrijven kunnen hun eigen profiel bijwerken'
        });
      }

      // First check if bedrijf exists
      const checkQuery = 'SELECT bedrijfsnummer FROM bedrijven WHERE email = $1';
      const checkResult = await pool.query(checkQuery, [req.user.email]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Bedrijf not found',
          message: 'Uw bedrijfsprofiel werd niet gevonden'
        });
      }

      // Prepare update data (exclude sensitive fields)
      const updateData = { ...req.body };
      delete updateData.bedrijfsnummer;
      delete updateData.email; // Don't allow email changes
      delete updateData.created_at;
      delete updateData.updated_at;

      // Build dynamic update query
      const allowedFields = [
        'bedrijfsnaam', 'telefoonnummer', 'website', 'adres', 'postcode', 'stad',
        'beschrijving', 'sector', 'werknemers', 'logo_url', 'contactpersoon_naam',
        'contactpersoon_functie', 'contactpersoon_email', 'contactpersoon_telefoon'
      ];

      const updates = [];
      const values = [];
      let paramCount = 0;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          paramCount++;
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update',
          message: 'Geen geldige velden om bij te werken'
        });
      }

      // Add updated_at and email parameter
      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(req.user.email);

      const updateQuery = `
        UPDATE bedrijven 
        SET ${updates.join(', ')}
        WHERE email = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, values);

      console.log('✅ [bedrijfController] Profile updated successfully');

      res.json({ 
        success: true,
        message: 'Bedrijfsprofiel succesvol bijgewerkt',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ [bedrijfController] Error updating own profile:', error);
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
      console.log('➕ [bedrijfController] createBedrijf called');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        bedrijfsnaam, email, telefoonnummer, website, adres, postcode, stad,
        beschrijving, sector, werknemers, logo_url, contactpersoon_naam,
        contactpersoon_functie, contactpersoon_email, contactpersoon_telefoon
      } = req.body;

      // Check if bedrijf already exists
      const checkQuery = 'SELECT bedrijfsnummer FROM bedrijven WHERE email = $1';
      const checkResult = await pool.query(checkQuery, [email]);

      if (checkResult.rows.length > 0) {
        return res.status(409).json({ 
          success: false,
          error: 'Company already exists',
          message: 'Er bestaat al een bedrijf met dit email-adres'
        });
      }

      const insertQuery = `
        INSERT INTO bedrijven (
          bedrijfsnaam, email, telefoonnummer, website, adres, postcode, stad,
          beschrijving, sector, werknemers, logo_url, contactpersoon_naam,
          contactpersoon_functie, contactpersoon_email, contactpersoon_telefoon,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      const values = [
        bedrijfsnaam, email, telefoonnummer, website, adres, postcode, stad,
        beschrijving, sector, werknemers, logo_url, contactpersoon_naam,
        contactpersoon_functie, contactpersoon_email, contactpersoon_telefoon
      ];

      const result = await pool.query(insertQuery, values);

      console.log('✅ [bedrijfController] Bedrijf created:', result.rows[0].bedrijfsnaam);
      
      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ [bedrijfController] Error creating company:', error);
      
      if (error.code === '23505') { // PostgreSQL unique violation
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
      console.log('📝 [bedrijfController] updateBedrijf called');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { bedrijfsnummer } = req.params;
      
      // Check if bedrijf exists
      const checkQuery = 'SELECT email FROM bedrijven WHERE bedrijfsnummer = $1';
      const checkResult = await pool.query(checkQuery, [bedrijfsnummer]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      // Check permissions: organisator can edit any, bedrijf can only edit their own
      const bedrijfEmail = checkResult.rows[0].email;
      if (req.user.userType === 'bedrijf' && req.user.email !== bedrijfEmail) {
        return res.status(403).json({ 
          success: false,
          error: 'Forbidden',
          message: 'U kunt alleen uw eigen bedrijfsprofiel bijwerken'
        });
      }

      // Prepare update data
      const updateData = { ...req.body };
      delete updateData.bedrijfsnummer;
      delete updateData.created_at;

      // Build dynamic update query
      const allowedFields = [
        'bedrijfsnaam', 'email', 'telefoonnummer', 'website', 'adres', 'postcode', 'stad',
        'beschrijving', 'sector', 'werknemers', 'logo_url', 'contactpersoon_naam',
        'contactpersoon_functie', 'contactpersoon_email', 'contactpersoon_telefoon'
      ];

      const updates = [];
      const values = [];
      let paramCount = 0;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          paramCount++;
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // Add updated_at and bedrijfsnummer parameter
      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(bedrijfsnummer);

      const updateQuery = `
        UPDATE bedrijven 
        SET ${updates.join(', ')}
        WHERE bedrijfsnummer = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, values);

      console.log('✅ [bedrijfController] Bedrijf updated successfully');

      res.json({ 
        success: true,
        message: 'Company updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ [bedrijfController] Error updating company:', error);
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
      console.log('🗑️ [bedrijfController] deleteBedrijf called');
      const { bedrijfsnummer } = req.params;
      
      if (!bedrijfsnummer || isNaN(bedrijfsnummer)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid bedrijfsnummer provided'
        });
      }

      // Check if bedrijf exists
      const checkQuery = 'SELECT bedrijfsnaam FROM bedrijven WHERE bedrijfsnummer = $1';
      const checkResult = await pool.query(checkQuery, [bedrijfsnummer]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      const bedrijfsnaam = checkResult.rows[0].bedrijfsnaam;

      // Delete the bedrijf
      const deleteQuery = 'DELETE FROM bedrijven WHERE bedrijfsnummer = $1';
      await pool.query(deleteQuery, [bedrijfsnummer]);

      console.log('✅ [bedrijfController] Bedrijf deleted:', bedrijfsnaam);

      res.json({ 
        success: true,
        message: 'Company deleted successfully',
        bedrijfsnummer: bedrijfsnummer
      });
    } catch (error) {
      console.error('❌ [bedrijfController] Error deleting company:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete company',
        message: 'Er ging iets mis bij het verwijderen van het bedrijf'
      });
    }
  }
};

// Legacy export for backwards compatibility
exports.register = async (req, res) => {
  try {
    console.log('📝 [bedrijfController] Legacy register endpoint called');
    const bedrijfData = req.body;
    res.status(201).json({ 
      message: 'Bedrijf succesvol geregistreerd', 
      bedrijf: bedrijfData 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = bedrijfController;