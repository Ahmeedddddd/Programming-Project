//Server/MODELS/afspraaks.js
const { pool } = require('../CONFIG/database');

class Afspraak {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        a.afspraakId, a.studentnummer, a.bedrijfsnummer,
        a.startTijd, a.eindTijd, a.status,
        CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
        b.naam as bedrijfNaam
      FROM AFSPRAAK a
      LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
      LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
      ORDER BY a.startTijd
    `);
    return rows;
  }

  static async create(afspraakData) {
    const { studentnummer, bedrijfsnummer, startTijd, eindTijd, status } = afspraakData;
    
    const [result] = await pool.query(`
      INSERT INTO AFSPRAAK (studentnummer, bedrijfsnummer, startTijd, eindTijd, status)
      VALUES (?, ?, ?, ?, ?)
    `, [studentnummer, bedrijfsnummer, startTijd, eindTijd, status || 'gepland']);
    
    return result.insertId;
  }

  static async updateStatus(afspraakId, status) {
    const [result] = await pool.query(
      'UPDATE AFSPRAAK SET status = ? WHERE afspraakId = ?',
      [status, afspraakId]
    );
    return result.affectedRows;
  }
}

module.exports = Afspraak;