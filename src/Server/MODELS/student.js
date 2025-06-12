//src/Server/MODELS/student.js
const { pool } = require('../CONFIG/database'); // ✅ FIXED: Correct import

class Student {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT
        studentnummer, voornaam, achternaam, email, gsm_nummer,
        opleiding, opleidingsrichting, projectTitel, projectBeschrijving,
        overMezelf, huisnummer, straatnaam, gemeente, postcode, bus
      FROM STUDENT
      ORDER BY achternaam, voornaam
    `);
    return rows;
  }

  static async getById(studentnummer) {
    const [rows] = await pool.query(
      'SELECT * FROM STUDENT WHERE studentnummer = ?',
      [studentnummer]
    );
    return rows[0];
  }

  static async create(studentData) {
    const {
      studentnummer, voornaam, achternaam, email, gsm_nummer,
      opleiding, opleidingsrichting, projectTitel, projectBeschrijving,
      overMezelf, huisnummer, straatnaam, gemeente, postcode, bus
    } = studentData;

    const [result] = await pool.query(`
      INSERT INTO STUDENT (
        studentnummer, voornaam, achternaam, email, gsm_nummer,
        opleiding, opleidingsrichting, projectTitel, projectBeschrijving,
        overMezelf, huisnummer, straatnaam, gemeente, postcode, bus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      studentnummer, voornaam, achternaam, email, gsm_nummer,
      opleiding, opleidingsrichting, projectTitel, projectBeschrijving,
      overMezelf, huisnummer, straatnaam, gemeente, postcode, bus
    ]);
   
    return result.insertId;
  }

  static async update(studentnummer, studentData) {
    const fields = Object.keys(studentData);
    const values = Object.values(studentData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
   
    const [result] = await pool.query(
      `UPDATE STUDENT SET ${setClause} WHERE studentnummer = ?`,
      [...values, studentnummer]
    );
   
    return result.affectedRows;
  }

  static async delete(studentnummer) {
    const [result] = await pool.query(
      'DELETE FROM STUDENT WHERE studentnummer = ?',
      [studentnummer]
    );
    return result.affectedRows;
  }

  static async getWithProjects() {
    const [rows] = await pool.query(`
      SELECT
        studentnummer,
        CONCAT(voornaam, ' ', achternaam) as studentNaam,
        email, projectTitel, projectBeschrijving,
        opleiding, opleidingsrichting
      FROM STUDENT
      WHERE projectTitel IS NOT NULL AND projectTitel != ''
      ORDER BY projectTitel
    `);
    return rows;
  }

  // ✅ NEW: Extra methods for future use
  static async getStats() {
    try {
      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM STUDENT');
      const [withProjectsRows] = await pool.query(`
        SELECT COUNT(*) as withProjects FROM STUDENT 
        WHERE projectTitel IS NOT NULL AND projectTitel != ''
      `);
      
      return {
        total: totalRows[0].total,
        withProjects: withProjectsRows[0].withProjects,
        withoutProjects: totalRows[0].total - withProjectsRows[0].withProjects
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      return { total: 0, withProjects: 0, withoutProjects: 0 };
    }
  }

  static async getRecent(limit = 5) {
    try {
      const [rows] = await pool.query(`
        SELECT studentnummer, voornaam, achternaam, email, opleiding
        FROM STUDENT 
        ORDER BY studentnummer DESC 
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting recent students:', error);
      return [];
    }
  }
}

module.exports = Student;