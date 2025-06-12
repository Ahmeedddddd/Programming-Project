//src/Server/MODELS/reservatie.js
const { pool } = require('../CONFIG/database');

class Reservatie {
  static async getAll() {
    try {
      const [rows] = await pool.query(`
        SELECT 
          a.afspraakId as id,
          a.studentnummer, 
          a.bedrijfsnummer,
          a.startTijd, 
          a.eindTijd, 
          a.status,
          CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
          s.email as studentEmail,
          b.naam as bedrijfNaam,
          b.email as bedrijfEmail
        FROM AFSPRAAK a
        LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
        LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
        ORDER BY a.startTijd DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error fetching all reservations:', error);
      return [];
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          a.afspraakId as id,
          a.studentnummer, 
          a.bedrijfsnummer,
          a.startTijd, 
          a.eindTijd, 
          a.status,
          CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
          s.email as studentEmail,
          b.naam as bedrijfNaam,
          b.email as bedrijfEmail
        FROM AFSPRAAK a
        LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
        LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
        WHERE a.afspraakId = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching reservation by id:', error);
      return null;
    }
  }

  static async getByStudent(studentnummer) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          a.afspraakId as id,
          a.studentnummer, 
          a.bedrijfsnummer,
          a.startTijd, 
          a.eindTijd, 
          a.status,
          b.naam as bedrijfNaam,
          b.email as bedrijfEmail
        FROM AFSPRAAK a
        LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
        WHERE a.studentnummer = ?
        ORDER BY a.startTijd DESC
      `, [studentnummer]);
      return rows;
    } catch (error) {
      console.error('Error fetching reservations by student:', error);
      return [];
    }
  }

  static async getByBedrijf(bedrijfsnummer) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          a.afspraakId as id,
          a.studentnummer, 
          a.bedrijfsnummer,
          a.startTijd, 
          a.eindTijd, 
          a.status,
          CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
          s.email as studentEmail
        FROM AFSPRAAK a
        LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
        WHERE a.bedrijfsnummer = ?
        ORDER BY a.startTijd DESC
      `, [bedrijfsnummer]);
      return rows;
    } catch (error) {
      console.error('Error fetching reservations by bedrijf:', error);
      return [];
    }
  }

  static async create(reservatieData) {
    try {
      const {
        studentnummer,
        bedrijfsnummer,
        startTijd,
        eindTijd,
        status = 'aangevraagd'
      } = reservatieData;

      const [result] = await pool.query(`
        INSERT INTO AFSPRAAK (studentnummer, bedrijfsnummer, startTijd, eindTijd, status)
        VALUES (?, ?, ?, ?, ?)
      `, [studentnummer, bedrijfsnummer, startTijd, eindTijd, status]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  static async updateStatus(id, updateData) {
    try {
      const { status } = updateData;
      
      const [result] = await pool.query(
        'UPDATE AFSPRAAK SET status = ? WHERE afspraakId = ?',
        [status, id]
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error updating reservation status:', error);
      throw error;
    }
  }

  static async update(id, reservatieData) {
    try {
      const fields = Object.keys(reservatieData);
      const values = Object.values(reservatieData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const [result] = await pool.query(
        `UPDATE AFSPRAAK SET ${setClause} WHERE afspraakId = ?`,
        [...values, id]
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM AFSPRAAK WHERE afspraakId = ?',
        [id]
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  }

  static async checkTimeConflicts(studentnummer, bedrijfsnummer, startTijd, eindTijd) {
    try {
      const [rows] = await pool.query(`
        SELECT afspraakId, startTijd, eindTijd
        FROM AFSPRAAK 
        WHERE (studentnummer = ? OR bedrijfsnummer = ?)
        AND status IN ('aangevraagd', 'bevestigd')
        AND (
          (startTijd <= ? AND eindTijd > ?) OR
          (startTijd < ? AND eindTijd >= ?) OR
          (startTijd >= ? AND eindTijd <= ?)
        )
      `, [
        studentnummer, bedrijfsnummer,
        startTijd, startTijd,
        eindTijd, eindTijd,
        startTijd, eindTijd
      ]);
      return rows;
    } catch (error) {
      console.error('Error checking time conflicts:', error);
      return [];
    }
  }

  static async getStats() {
    try {
      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM AFSPRAAK');
      const [activeRows] = await pool.query(`
        SELECT COUNT(*) as active FROM AFSPRAAK 
        WHERE status IN ('aangevraagd', 'bevestigd')
      `);
      const [statusStats] = await pool.query(`
        SELECT status, COUNT(*) as count 
        FROM AFSPRAAK 
        GROUP BY status
      `);
      
      return {
        total: totalRows[0].total,
        active: activeRows[0].active,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting reservation stats:', error);
      return { total: 0, active: 0, byStatus: {} };
    }
  }

  static async getRecent(limit = 10) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          a.afspraakId as id,
          a.studentnummer, 
          a.bedrijfsnummer,
          a.startTijd, 
          a.status,
          CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
          b.naam as bedrijfNaam
        FROM AFSPRAAK a
        LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
        LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
        ORDER BY a.afspraakId DESC 
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting recent reservations:', error);
      return [];
    }
  }
}

module.exports = Reservatie;