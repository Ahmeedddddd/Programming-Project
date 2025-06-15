//src/Server/MODELS/organisator.js
const { pool } = require('../CONFIG/database');

class Organisator {
  static async getAll() {
    try {
      const [rows] = await pool.query(`
        SELECT 
          o.organisatorId,
          o.voornaam,
          o.achternaam, 
          o.email,
          o.gebruikersId
        FROM ORGANISATOR o
        ORDER BY o.achternaam, o.voornaam
      `);
      return rows;
    } catch (error) {
      console.error('Error fetching all organisators:', error);
      return [];
    }
  }

  static async getById(organisatorId) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          o.organisatorId,
          o.voornaam,
          o.achternaam, 
          o.email,
          o.gebruikersId
        FROM ORGANISATOR o
        WHERE o.organisatorId = ?
      `, [organisatorId]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching organisator by id:', error);
      return null;
    }
  }

  static async create(organisatorData) {
    try {
      const {
        voornaam,
        achternaam,
        email,
        gebruikersId
      } = organisatorData;

      const [result] = await pool.query(`
        INSERT INTO ORGANISATOR (voornaam, achternaam, email, gebruikersId)
        VALUES (?, ?, ?, ?)
      `, [voornaam, achternaam, email, gebruikersId]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating organisator:', error);
      throw error;
    }
  }

  static async update(organisatorId, organisatorData) {
    try {
      // Filter out undefined values and only allow certain fields
      const allowedFields = ['voornaam', 'achternaam', 'email'];
      const filteredData = {};
      
      Object.keys(organisatorData).forEach(key => {
        if (allowedFields.includes(key) && organisatorData[key] !== undefined) {
          filteredData[key] = organisatorData[key];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        console.warn('No valid fields to update');
        return 0;
      }

      const fields = Object.keys(filteredData);
      const values = Object.values(filteredData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const [result] = await pool.query(
        `UPDATE ORGANISATOR SET ${setClause} WHERE organisatorId = ?`,
        [...values, organisatorId]
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error updating organisator:', error);
      throw error;
    }
  }

  static async delete(organisatorId) {
    try {
      const [result] = await pool.query(
        'DELETE FROM ORGANISATOR WHERE organisatorId = ?',
        [organisatorId]
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting organisator:', error);
      throw error;
    }
  }

  static async getStats() {
    try {
      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM ORGANISATOR');
      
      // Additional statistics
      const [recentActivity] = await pool.query(`
        SELECT COUNT(*) as recent_count 
        FROM ORGANISATOR 
        WHERE organisatorId IN (
          SELECT organisatorId 
          FROM ORGANISATOR 
          ORDER BY organisatorId DESC 
          LIMIT 5
        )
      `);
      
      return {
        total: totalRows[0].total,
        recentActivity: recentActivity[0].recent_count
      };
    } catch (error) {
      console.error('Error getting organisator stats:', error);
      return { total: 0, recentActivity: 0 };
    }
  }

  static async getRecent(limit = 5) {
    try {
      const [rows] = await pool.query(`
        SELECT organisatorId, voornaam, achternaam, email
        FROM ORGANISATOR 
        ORDER BY organisatorId DESC 
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting recent organisators:', error);
      return [];
    }
  }

  // ✅ NEW: Additional utility methods for consistency with bedrijf model
  static async getByEmail(email) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          o.organisatorId,
          o.voornaam,
          o.achternaam, 
          o.email,
          o.gebruikersId
        FROM ORGANISATOR o
        WHERE o.email = ?
      `, [email]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching organisator by email:', error);
      return null;
    }
  }

  static async searchByName(searchTerm) {
    try {
      const [rows] = await pool.query(`
        SELECT organisatorId, voornaam, achternaam, email
        FROM ORGANISATOR 
        WHERE voornaam LIKE ? OR achternaam LIKE ? OR email LIKE ?
        ORDER BY achternaam, voornaam
        LIMIT 20
      `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
      return rows;
    } catch (error) {
      console.error('Error searching organisators:', error);
      return [];
    }
  }

  // ✅ NEW: Method to check if organisator exists by gebruikersId
  static async getByGebruikersId(gebruikersId) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          o.organisatorId,
          o.voornaam,
          o.achternaam, 
          o.email,
          o.gebruikersId
        FROM ORGANISATOR o
        WHERE o.gebruikersId = ?
      `, [gebruikersId]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching organisator by gebruikersId:', error);
      return null;
    }
  }

  // ✅ NEW: Validation helper
  static validateOrganisatorData(data) {
    const errors = [];
    
    if (!data.voornaam || data.voornaam.trim().length < 2) {
      errors.push('Voornaam moet minstens 2 karakters bevatten');
    }
    
    if (!data.achternaam || data.achternaam.trim().length < 2) {
      errors.push('Achternaam moet minstens 2 karakters bevatten');
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Geldig emailadres is vereist');
    }
    
    return errors;
  }

  // Helper methods
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = Organisator;