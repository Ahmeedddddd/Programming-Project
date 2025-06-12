const { pool } = require('../database');

class Bedrijf {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        bedrijfsnummer, TVA_nummer, naam, email, gsm_nummer, sector,
        huisnummer, straatnaam, gemeente, postcode, bus, land
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
      huisnummer, straatnaam, gemeente, postcode, bus, land
    } = bedrijfData;

    const [result] = await pool.query(`
      INSERT INTO BEDRIJF (
        TVA_nummer, naam, email, gsm_nummer, sector,
        huisnummer, straatnaam, gemeente, postcode, bus, land
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      TVA_nummer, naam, email, gsm_nummer, sector,
      huisnummer, straatnaam, gemeente, postcode, bus, land
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
}

module.exports = Bedrijf;