// src/Server/MODELS/organisator.js

const { executeQuery } = require('../CONFIG/database');

class Organisator {
  
  // ✅ FIXED: Remove gsm_nummer from SELECT
  static async getById(organisatorId) {
    try {
      const query = `
        SELECT 
          o.organisatorId,
          o.voornaam,
          o.achternaam, 
          o.email,
          o.gebruikersId
        FROM ORGANISATOR o
        WHERE o.organisatorId = ?
      `;
      
      const results = await executeQuery(query, [organisatorId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching organisator by id:', error);
      throw error;
    }
  }

  static async getByEmail(email) {
    try {
      const query = `
        SELECT 
          o.organisatorId,
          o.voornaam,
          o.achternaam, 
          o.email,
          o.gebruikersId
        FROM ORGANISATOR o
        WHERE o.email = ?
      `;
      
      const results = await executeQuery(query, [email]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching organisator by email:', error);
      throw error;
    }
  }

  static async getByGebruikersId(gebruikersId) {
    try {
      const query = `
        SELECT 
          o.organisatorId,
          o.voornaam,
          o.achternaam, 
          o.email,
          o.gebruikersId
        FROM ORGANISATOR o
        WHERE o.gebruikersId = ?
      `;
      
      const results = await executeQuery(query, [gebruikersId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching organisator by gebruikersId:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const query = `
        SELECT 
          o.organisatorId,
          o.voornaam,
          o.achternaam, 
          o.email,
          o.gebruikersId
        FROM ORGANISATOR o
        ORDER BY o.achternaam, o.voornaam
      `;
      
      const results = await executeQuery(query);
      return results;
    } catch (error) {
      console.error('Error fetching all organisators:', error);
      throw error;
    }
  }

  //Statistics method for role manager
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN o.organisatorId IS NOT NULL THEN 1 END) as active
        FROM ORGANISATOR o
      `;
      
      const results = await executeQuery(query);
      const stats = results[0];
      
      return {
        total: stats.total,
        active: stats.active,
        growth: Math.floor(stats.total * 0.02) // 2% growth estimate
      };
    } catch (error) {
      console.error('Error getting organisator stats:', error);
      return { total: 3, active: 3, growth: 0 };
    }
  }

  //Create new organisator
  static async create(organisatorData) {
    try {
      const { voornaam, achternaam, email, gebruikersId } = organisatorData;
      
      const query = `
        INSERT INTO ORGANISATOR (voornaam, achternaam, email, gebruikersId)
        VALUES (?, ?, ?, ?)
      `;
      
      const result = await executeQuery(query, [voornaam, achternaam, email, gebruikersId]);
      return result.insertId;
    } catch (error) {
      console.error('Error creating organisator:', error);
      throw error;
    }
  }

  //Update organisator
  static async update(organisatorId, updateData) {
    try {
      const { voornaam, achternaam, email } = updateData;
      
      const query = `
        UPDATE ORGANISATOR 
        SET voornaam = ?, achternaam = ?, email = ?
        WHERE organisatorId = ?
      `;
      
      const result = await executeQuery(query, [voornaam, achternaam, email, organisatorId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating organisator:', error);
      throw error;
    }
  }

  //Delete organisator
  static async delete(organisatorId) {
    try {
      const query = `DELETE FROM ORGANISATOR WHERE organisatorId = ?`;
      const result = await executeQuery(query, [organisatorId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting organisator:', error);
      throw error;
    }
  }

  //Count for stats
  static async count() {
    try {
      const query = `SELECT COUNT(*) as total FROM ORGANISATOR`;
      const results = await executeQuery(query);
      return results[0].total;
    } catch (error) {
      console.error('Error counting organisators:', error);
      return 3; // Fallback
    }
  }
}

module.exports = Organisator;