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
          o.gsm_nummer
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
          o.gsm_nummer,
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
        gsm_nummer,
        gebruikersId
      } = organisatorData;

      const [result] = await pool.query(`
        INSERT INTO ORGANISATOR (voornaam, achternaam, email, gsm_nummer, gebruikersId)
        VALUES (?, ?, ?, ?, ?)
      `, [voornaam, achternaam, email, gsm_nummer, gebruikersId]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating organisator:', error);
      throw error;
    }
  }

  static async update(organisatorId, organisatorData) {
    try {
      const fields = Object.keys(organisatorData);
      const values = Object.values(organisatorData);
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
      
      return {
        total: totalRows[0].total
      };
    } catch (error) {
      console.error('Error getting organisator stats:', error);
      return { total: 0 };
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
}

module.exports = Organisator;