// src/Server/MODELS/reservatie.js
const { pool } = require("../CONFIG/database"); // Zorg dat dit pad klopt

// De vaste datum van het evenement. Cruciaal voor het maken van Date objecten in de ROUTES.
// Let op: Dit model werkt nu met TIME strings, en de ROUTES zullen de EVENT_DATE gebruiken
// om ISO strings te reconstrueren voor de frontend.
const EVENT_DATE_FOR_FRONTEND = "2025-06-25"; // Datum van Student Project Showcase 2025

class Reservatie {
  static async getAll() {
    try {
      const [rows] = await pool.query(`
                SELECT
                    a.afspraakId as id,
                    a.studentnummer,
                    a.bedrijfsnummer,
                    -- a.datum,  <-- DEZE IS VERWIJDERD
                    a.startTijd,
                    a.eindTijd,
                    a.status,
                    a.redenWeigering,
                    CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
                    s.email as studentEmail,
                    b.naam as bedrijfNaam,
                    b.email as bedrijfEmail,
                    b.tafelNr as bedrijfTafelNr
                FROM AFSPRAAK a
                LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
                LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
                ORDER BY a.startTijd DESC
            `);
      return rows;
    } catch (error) {
      console.error("Error fetching all reservations:", error);
      throw error; // Propagate error
    }
  }

  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `
                SELECT
                    a.afspraakId as id,
                    a.studentnummer,
                    a.bedrijfsnummer,
                    -- a.datum,  <-- DEZE IS VERWIJDERD
                    a.startTijd,
                    a.eindTijd,
                    a.status,
                    a.redenWeigering,
                    CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
                    s.email as studentEmail,
                    b.naam as bedrijfNaam,
                    b.email as bedrijfEmail,
                    b.tafelNr as bedrijfTafelNr
                FROM AFSPRAAK a
                LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
                LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
                WHERE a.afspraakId = ?
            `,
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error("Error fetching reservation by id:", error);
      throw error;
    }
  }

  static async getByStudent(studentnummer) {
    try {
      const [rows] = await pool.query(
        `
                SELECT
                    a.afspraakId as id,
                    a.studentnummer,
                    a.bedrijfsnummer,
                    -- a.datum,  <-- DEZE IS VERWIJDERD
                    a.startTijd,
                    a.eindTijd,
                    a.status,
                    a.redenWeigering,
                    b.naam as bedrijfNaam,
                    b.email as bedrijfEmail,
                    b.tafelNr as bedrijfTafelNr
                FROM AFSPRAAK a
                LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
                WHERE a.studentnummer = ?
                ORDER BY a.startTijd DESC
            `,
        [studentnummer]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching reservations by student:", error);
      throw error;
    }
  }

  static async getByBedrijf(bedrijfsnummer) {
    try {
      const [rows] = await pool.query(
        `
                SELECT
                    a.afspraakId as id,
                    a.studentnummer,
                    a.bedrijfsnummer,
                    -- a.datum,  <-- DEZE IS VERWIJDERD
                    a.startTijd,
                    a.eindTijd,
                    a.status,
                    a.redenWeigering,
                    CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
                    s.email as studentEmail,
                    s.projectTitel as studentProject,
                    s.tafelNr as studentTafelNr
                FROM AFSPRAAK a
                LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
                WHERE a.bedrijfsnummer = ?
                ORDER BY a.startTijd DESC
            `,
        [bedrijfsnummer]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching reservations by bedrijf:", error);
      throw error;
    }
  }

  static async getByBedrijfAndDate(bedrijfsnummer) {
    // 'dateString' parameter niet nodig in query, maar behouden in signature
    try {
      const [rows] = await pool.query(
        `
                SELECT
                    afspraakId as id,
                    studentnummer,
                    bedrijfsnummer,
                    -- datum,  <-- DEZE IS VERWIJDERD
                    startTijd,
                    eindTijd,
                    status
                FROM AFSPRAAK
                WHERE bedrijfsnummer = ?
                AND status IN ('aangevraagd', 'bevestigd')
                ORDER BY startTijd ASC
            `,
        [bedrijfsnummer]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching reservations by company and date:", error);
      throw error;
    }
  }

  static async create(reservatieData) {
    try {
      const {
        studentnummer,
        bedrijfsnummer,
        startTijd, // String HH:MM:SS
        eindTijd, // String HH:MM:SS
        status = "aangevraagd",
      } = reservatieData;

      const [result] = await pool.query(
        `
                INSERT INTO AFSPRAAK (studentnummer, bedrijfsnummer, startTijd, eindTijd, status)
                VALUES (?, ?, ?, ?, ?)
            `,
        [studentnummer, bedrijfsnummer, startTijd, eindTijd, status]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error creating reservation:", error);
      throw error;
    }
  }

  static async updateStatus(id, updateData) {
    try {
      const { status } = updateData;

      // Als er een reden van weigering is, voeg die toe aan de update
      let setClause = "status = ?";
      const params = [status];
      if (updateData.hasOwnProperty("redenWeigering")) {
        setClause += ", redenWeigering = ?";
        params.push(updateData.redenWeigering);
      }

      const [result] = await pool.query(
        `UPDATE AFSPRAAK SET ${setClause} WHERE afspraakId = ?`,
        [...params, id]
      );

      // Extra logica: als status 'bevestigd', weiger alle andere aanvragen voor hetzelfde bedrijf en tijdslot
      if (status === 'bevestigd') {
        // Haal de details van deze afspraak op
        const [rows] = await pool.query(
          `SELECT bedrijfsnummer, startTijd, eindTijd FROM AFSPRAAK WHERE afspraakId = ?`,
          [id]
        );
        if (rows.length > 0) {
          const { bedrijfsnummer, startTijd, eindTijd } = rows[0];
          // Zet alle andere aanvragen voor dit bedrijf en tijdslot op 'geweigerd'
          await pool.query(
            `UPDATE AFSPRAAK SET status = 'geweigerd', redenWeigering = 'Tijdslot reeds bevestigd voor andere student.'
             WHERE bedrijfsnummer = ? AND startTijd = ? AND eindTijd = ? AND status = 'aangevraagd' AND afspraakId != ?`,
            [bedrijfsnummer, startTijd, eindTijd, id]
          );
        }
      }

      return result.affectedRows;
    } catch (error) {
      console.error("Error updating reservation status:", error);
      throw error;
    }
  }

  static async update(id, reservatieData) {
    try {
      const fields = Object.keys(reservatieData);
      const values = Object.values(reservatieData);
      const filteredFields = fields.filter((field) => field !== "id");
      const filteredValues = filteredFields.map(
        (field) => reservatieData[field]
      );

      const setClause = filteredFields
        .map((field) => `${field} = ?`)
        .join(", ");

      if (filteredFields.length === 0) {
        return 0; // Nothing to update
      }

      const [result] = await pool.query(
        `UPDATE AFSPRAAK SET ${setClause} WHERE afspraakId = ?`,
        [...filteredValues, id]
      );

      return result.affectedRows;
    } catch (error) {
      console.error("Error updating reservation:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query(
        "DELETE FROM AFSPRAAK WHERE afspraakId = ?",
        [id]
      );
      return result.affectedRows;
    } catch (error) {
      console.error("Error deleting reservation:", error);
      throw error;
    }
  }

  static async checkTimeConflicts(
    studentnummer,
    bedrijfsnummer,
    startTijd,
    eindTijd
  ) {
    try {
      const [rows] = await pool.query(
        `
                SELECT afspraakId, studentnummer, bedrijfsnummer, startTijd, eindTijd, status
                FROM AFSPRAAK
                WHERE (studentnummer = ? OR bedrijfsnummer = ?)
                AND status IN ('aangevraagd', 'bevestigd')
                AND (
                    (startTijd < ? AND eindTijd > ?)
                )
            `,
        [studentnummer, bedrijfsnummer, eindTijd, startTijd]
      );
      return rows;
    } catch (error) {
      console.error("Error checking time conflicts:", error);
      throw error;
    }
  }

  static async getStats() {
    try {
      const [totalRows] = await pool.query(
        "SELECT COUNT(*) as total FROM AFSPRAAK"
      );
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
        }, {}),
      };
    } catch (error) {
      console.error("Error getting reservation stats:", error);
      return { total: 0, active: 0, byStatus: {} };
    }
  }

  static async getRecent(limit = 10) {
    try {
      const [rows] = await pool.query(
        `
                SELECT
                    a.afspraakId as id,
                    a.studentnummer,
                    a.bedrijfsnummer,
                    -- a.datum, <-- DEZE IS VERWIJDERD
                    a.startTijd,
                    a.status,
                    CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
                    b.naam as bedrijfNaam
                FROM AFSPRAAK a
                LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
                LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
                ORDER BY a.afspraakId DESC
                LIMIT ?
            `,
        [limit]
      );
      return rows;
    } catch (error) {
      console.error("Error getting recent reservations:", error);
      return [];
    }
  }
}

module.exports = Reservatie;
