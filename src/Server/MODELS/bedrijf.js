// src/Server/MODELS/bedrijf.js
const { pool } = require('../CONFIG/database'); // Zorg dat dit pad klopt

class Bedrijf {
    static async getAll(limit = null, searchTerm = '') {
        let query = `
            SELECT
                bedrijfsnummer, naam, sector, gemeente, beschrijving, email, telefoon, logoUrl, tafelNr, beschikbareTijdslots
            FROM BEDRIJF
        `;
        const params = [];
        let whereConditions = [];

        if (searchTerm) {
            whereConditions.push('(naam LIKE ? OR sector LIKE ? OR gemeente LIKE ? OR beschrijving LIKE ?)');
            const searchPattern = `%${searchTerm}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        query += ` ORDER BY naam`;

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit);
        }
        const [rows] = await pool.query(query, params);
        return rows.map(row => {
            // Parse beschikbareTijdslots from JSON string to array
            if (row.beschikbareTijdslots) {
                try {
                    row.beschikbareTijdslots = JSON.parse(row.beschikbareTijdslots);
                } catch (e) {
                    console.error("Fout bij parsen beschikbareTijdslots:", e);
                    row.beschikbareTijdslots = [];
                }
            } else {
                row.beschikbareTijdslots = [];
            }
            return row;
        });
    }

    static async getById(bedrijfsnummer) {
        const [rows] = await pool.query(
            'SELECT bedrijfsnummer, naam, sector, gemeente, beschrijving, email, telefoon, logoUrl, tafelNr, beschikbareTijdslots FROM BEDRIJF WHERE bedrijfsnummer = ?',
            [bedrijfsnummer]
        );
        const bedrijf = rows[0];
        if (bedrijf && typeof bedrijf.beschikbareTijdslots === 'string') { // Check if it's a string from DB
            try {
                bedrijf.beschikbareTijdslots = JSON.parse(bedrijf.beschikbareTijdslots);
            } catch (e) {
                console.error("Fout bij parsen beschikbareTijdslots voor ID", bedrijfsnummer, e);
                bedrijf.beschikbareTijdslots = [];
            }
        } else if (bedrijf) {
            bedrijf.beschikbareTijdslots = []; // Zorg altijd voor een array als het null/undefined is
        }
        return bedrijf;
    }

    // Methode om de basis beschikbare tijdslots in te stellen voor een bedrijf
    static async setBaseAvailableTimeSlots(bedrijfsnummer, timeSlotsArray) {
        try {
            const [result] = await pool.query(
                'UPDATE BEDRIJF SET beschikbareTijdslots = ? WHERE bedrijfsnummer = ?',
                [JSON.stringify(timeSlotsArray), bedrijfsnummer]
            );
            return result.affectedRows;
        } catch (error) {
            console.error('Error updating base available time slots for company:', error);
            throw error;
        }
    }

    // Voeg hier de update methode toe voor algemene bedrijfsgegevens
    static async update(bedrijfsnummer, bedrijfData) {
        const fields = Object.keys(bedrijfData);
        const values = Object.values(bedrijfData);
        const setClause = fields.map(field => {
            // Speciaal geval voor JSON kolom
            if (field === 'beschikbareTijdslots') {
                return `${field} = JSON_ARRAY(?)`; // Als je JSON_ARRAY wil gebruiken
            }
            return `${field} = ?`;
        }).join(', ');

        // Zorg ervoor dat beschikbareTijdslots als JSON string wordt opgeslagen
        if (bedrijfData.beschikbareTijdslots && Array.isArray(bedrijfData.beschikbareTijdslots)) {
            bedrijfData.beschikbareTijdslots = JSON.stringify(bedrijfData.beschikbareTijdslots);
        }

        const [result] = await pool.query(
            `UPDATE BEDRIJF SET ${setClause} WHERE bedrijfsnummer = ?`,
            [...values, bedrijfsnummer]
        );
        return result.affectedRows;
    }

    // ... andere methodes zoals create, delete, search, etc.
}

module.exports = Bedrijf;