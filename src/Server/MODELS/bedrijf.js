//src/Server/MODELS/bedrijf.js
const { pool } = require('../CONFIG/database');

class Bedrijf {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT
        bedrijfsnummer, TVA_nummer, naam, email, gsm_nummer, sector,
        huisnummer, straatnaam, gemeente, postcode, bus, land, tafelNr, bechrijving
      FROM BEDRIJF
      ORDER BY naam
    `);
    return rows;
  }

  static async getById(bedrijfsnummer) {
    const [rows] = await pool.query(
      'SELECT * FROM BEDRIJF WHERE bedrijfsnummer = ?',
      [bedrijfsnummer]
    );
    return rows[0];
  }

  static async create(bedrijfData) {
    const {
      TVA_nummer, naam, email, gsm_nummer, sector,
      huisnummer, straatnaam, gemeente, postcode, bus, land, tafelNr, bechrijving
    } = bedrijfData;

    const [result] = await pool.query(`
      INSERT INTO BEDRIJF (
        TVA_nummer, naam, email, gsm_nummer, sector,
        huisnummer, straatnaam, gemeente, postcode, bus, land, tafelNr, bechrijving
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      TVA_nummer, naam, email, gsm_nummer, sector,
      huisnummer, straatnaam, gemeente, postcode, bus, land, tafelNr, bechrijving
    ]);

    return result.insertId;
  }

  static async update(bedrijfsnummer, bedrijfData) {
    const fields = Object.keys(bedrijfData);
    const values = Object.values(bedrijfData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const [result] = await pool.query(
      `UPDATE BEDRIJF SET ${setClause} WHERE bedrijfsnummer = ?`,
      [...values, bedrijfsnummer]
    );

    return result.affectedRows;
  }

  static async delete(bedrijfsnummer) {
    const [result] = await pool.query(
      'DELETE FROM BEDRIJF WHERE bedrijfsnummer = ?',
      [bedrijfsnummer]
    );
    return result.affectedRows;
  }

  // Missing methods for statistics
  static async getStats() {
    try {
      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM BEDRIJF');
      const [sectorStats] = await pool.query(`
        SELECT sector, COUNT(*) as count 
        FROM BEDRIJF 
        WHERE sector IS NOT NULL AND sector != ''
        GROUP BY sector
        ORDER BY count DESC
      `);

      return {
        total: totalRows[0].total,
        bySector: sectorStats.reduce((acc, stat) => {
          acc[stat.sector] = stat.count;
          return acc;
        }, {}),
        topSectors: sectorStats.slice(0, 5) // Top 5 sectors
      };
    } catch (error) {
      console.error('Error getting bedrijf stats:', error);
      return { total: 0, bySector: {}, topSectors: [] };
    }
  }

  static async getRecent(limit = 5) {
    try {
      const [rows] = await pool.query(`
        SELECT bedrijfsnummer, naam, email, sector, TVA_nummer
        FROM BEDRIJF 
        ORDER BY bedrijfsnummer DESC 
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting recent bedrijven:', error);
      return [];
    }
  }

  // Additional utility methods
  static async getBySector(sector) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM BEDRIJF WHERE sector = ? ORDER BY naam',
        [sector]
      );
      return rows;
    } catch (error) {
      console.error('Error getting bedrijven by sector:', error);
      return [];
    }
  }

  static async searchByName(searchTerm) {
    try {
      const [rows] = await pool.query(`
        SELECT bedrijfsnummer, naam, email, sector, gemeente
        FROM BEDRIJF 
        WHERE naam LIKE ? OR email LIKE ?
        ORDER BY naam
        LIMIT 20
      `, [`%${searchTerm}%`, `%${searchTerm}%`]);
      return rows;
    } catch (error) {
      console.error('Error searching bedrijven:', error);
      return [];
    }
  }
}

module.exports = Bedrijf;