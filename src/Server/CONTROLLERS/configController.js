// src/Server/CONTROLLERS/configController.js
const { pool } = require('../CONFIG/database');

const configController = {
  // GET /api/config/:sleutel - Haal specifieke configuratie waarde op
  async getConfigValue(req, res) {
    try {
      const { sleutel } = req.params;
      
      const [rows] = await pool.query(
        'SELECT * FROM CONFIG WHERE `sleutel` = ?',
        [sleutel]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Config sleutel not found',
          message: `Configuratie sleutel '${sleutel}' niet gevonden`
        });
      }
      
      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('❌ Error getting config value:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get config value',
        message: 'Er ging iets mis bij het ophalen van de configuratie'
      });
    }
  },

  // GET /api/config/categorie/:categorie - Haal alle configuratie van een categorie op
  async getConfigByCategory(req, res) {
    try {
      const { categorie } = req.params;
      
      const [rows] = await pool.query(
        'SELECT * FROM CONFIG WHERE categorie = ? ORDER BY `sleutel`',
        [categorie]
      );
      
      // Converteer naar sleutel-waarde object voor makkelijk gebruik
      const config = {};
      rows.forEach(row => {
        config[row.sleutel] = {
          waarde: row.waarde,
          beschrijving: row.beschrijving,
          updated_at: row.updated_at
        };
      });
      
      res.json({
        success: true,
        data: config,
        count: rows.length
      });
    } catch (error) {
      console.error('❌ Error getting config by categorie:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get config by categorie',
        message: 'Er ging iets mis bij het ophalen van de configuratie'
      });
    }
  },

  // PUT /api/config/:sleutel - Update configuratie waarde (alleen voor organisatoren)
  async updateConfigValue(req, res) {
    try {
      const { sleutel } = req.params;
      const { waarde } = req.body;
      const userId = req.user?.userId; // Van authenticateToken middleware
      
      if (!waarde) {
        return res.status(400).json({
          success: false,
          error: 'Waarde is required',
          message: 'Waarde is verplicht'
        });
      }
      
      // Validatie voor tafel configuratie
      if (sleutel.includes('aantal_tafels')) {
        const numWaarde = parseInt(waarde);
        if (isNaN(numWaarde) || numWaarde < 1 || numWaarde > 50) {
          return res.status(400).json({
            success: false,
            error: 'Invalid table count',
            message: 'Aantal tafels moet tussen 1 en 50 zijn'
          });
        }
      }
      
      const [result] = await pool.query(
        'UPDATE CONFIG SET waarde = ?, updated_by = ? WHERE `sleutel` = ?',
        [waarde, userId, sleutel]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Config sleutel not found',
          message: `Configuratie sleutel '${sleutel}' niet gevonden`
        });
      }
      
      // Haal de bijgewerkte configuratie op
      const [updated] = await pool.query(
        'SELECT * FROM CONFIG WHERE `sleutel` = ?',
        [sleutel]
      );
      
      res.json({
        success: true,
        message: `Configuratie '${sleutel}' succesvol bijgewerkt`,
        data: updated[0]
      });
    } catch (error) {
      console.error('❌ Error updating config waarde:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update config waarde',
        message: 'Er ging iets mis bij het bijwerken van de configuratie'
      });
    }
  },

  // GET /api/config/tafels - Specifieke endpoint voor tafel configuratie
  async getTafelConfig(req, res) {
    try {
      const [rows] = await pool.query(
        `SELECT \`sleutel\`, waarde FROM CONFIG 
         WHERE \`sleutel\` IN ('voormiddag_aantal_tafels', 'namiddag_aantal_tafels', 'max_tafels_limit')`
      );
      
      const config = {};
      rows.forEach(row => {
        config[row.sleutel] = parseInt(row.waarde);
      });
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('❌ Error getting tafel config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tafel config',
        message: 'Er ging iets mis bij het ophalen van de tafel configuratie'
      });
    }
  },

  // PUT /api/config/tafels - Update tafel configuratie
  async updateTafelConfig(req, res) {
    try {
      const { voormiddag_aantal_tafels, namiddag_aantal_tafels } = req.body;
      const userId = req.user?.userId;
      
      const updates = [];
      
      if (voormiddag_aantal_tafels !== undefined) {
        const num = parseInt(voormiddag_aantal_tafels);
        if (isNaN(num) || num < 1 || num > 50) {
          return res.status(400).json({
            success: false,
            error: 'Invalid voormiddag table count',
            message: 'Aantal voormiddag tafels moet tussen 1 en 50 zijn'
          });
        }
        updates.push(['voormiddag_aantal_tafels', num.toString()]);
      }
      
      if (namiddag_aantal_tafels !== undefined) {
        const num = parseInt(namiddag_aantal_tafels);
        if (isNaN(num) || num < 1 || num > 50) {
          return res.status(400).json({
            success: false,
            error: 'Invalid namiddag table count',
            message: 'Aantal namiddag tafels moet tussen 1 en 50 zijn'
          });
        }
        updates.push(['namiddag_aantal_tafels', num.toString()]);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid updates provided',
          message: 'Geen geldige updates opgegeven'
        });
      }
      
      // Voer alle updates uit in een transactie
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        
        for (const [sleutel, waarde] of updates) {
          await connection.query(
            'UPDATE CONFIG SET waarde = ?, updated_by = ? WHERE `sleutel` = ?',
            [waarde, userId, sleutel]
          );
        }
        
        await connection.commit();
        
        res.json({
          success: true,
          message: 'Tafel configuratie succesvol bijgewerkt',
          data: Object.fromEntries(updates)
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('❌ Error updating tafel config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update tafel config',
        message: 'Er ging iets mis bij het bijwerken van de tafel configuratie'
      });
    }
  }
};

module.exports = configController;