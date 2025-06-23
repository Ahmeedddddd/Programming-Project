// src/Server/MODELS/bedrijf.js - FIXED VERSION

const { pool } = require('../CONFIG/database'); // Zorg dat dit pad klopt

class Bedrijf {
    static async getAll(limit = null, searchTerm = '') {
        console.log('\ud83d\udce1 Bedrijf.getAll called with:', { limit, searchTerm });
        
        try {
            // START with base SELECT and FROM - NO ORDER BY yet
            let query = `
                SELECT
                    bedrijfsnummer, TVA_nummer, naam, email, gsm_nummer, sector,
                    huisnummer, straatnaam, gemeente, postcode, bus, land,
                    tafelNr, bechrijving 
                FROM BEDRIJF`;
            
            const params = [];
            let whereConditions = [];

            // Add WHERE conditions if search term provided
            if (searchTerm && searchTerm.trim() !== '') {
                whereConditions.push('(naam LIKE ? OR sector LIKE ? OR gemeente LIKE ? OR bechrijving LIKE ?)');
                const searchPattern = `%${searchTerm.trim()}%`;
                params.push(searchPattern, searchPattern, searchPattern, searchPattern);
            }

            // Add WHERE clause if we have conditions
            if (whereConditions.length > 0) {
                query += ` WHERE ${whereConditions.join(' AND ')}`;
            }

            // NOW add ORDER BY (only once!)
            query += ` ORDER BY naam`;

            // Add LIMIT at the end if specified
            if (limit && !isNaN(limit) && limit > 0) {
                query += ` LIMIT ?`;
                params.push(limit);
            }

            console.log('\ud83d\udccb Final SQL query:', query);
            console.log('\ud83d\udccb Query params:', params);

            const [rows] = await pool.query(query, params);
            
            console.log(`\u2705 Found ${rows.length} bedrijven`);
            
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
            
        } catch (error) {
            console.error('\u274c Error in Bedrijf.getAll:', error);
            throw error;
        }
    }

    static async getById(bedrijfsnummer) {
        console.log('📡 Bedrijf.getById called with:', bedrijfsnummer);
        
        try {
            const sql = `
                SELECT
                    bedrijfsnummer, TVA_nummer, naam, email, gsm_nummer, sector,
                    huisnummer, straatnaam, gemeente, postcode, bus, land,
                    tafelNr, bechrijving 
                FROM BEDRIJF 
                WHERE bedrijfsnummer = ?`;
                
            const [rows] = await pool.query(sql, [bedrijfsnummer]);
            const bedrijf = rows[0];
            
            console.log('✅ Found bedrijf:', bedrijf ? bedrijf.naam : 'Not found');
            return bedrijf;
            
        } catch (error) {
            console.error('❌ Error in Bedrijf.getById:', error);
            throw error;
        }
    }

    static async create(bedrijfData) {
        console.log('📡 Bedrijf.create called');
        
        try {
            const {
                TVA_nummer, naam, email, gsm_nummer, sector,
                huisnummer, straatnaam, gemeente, postcode, bus, land,
                tafelNr, bechrijving
            } = bedrijfData;

            const sql = `
                INSERT INTO BEDRIJF (
                    TVA_nummer, naam, email, gsm_nummer, sector,
                    huisnummer, straatnaam, gemeente, postcode, bus, land,
                    tafelNr, bechrijving
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const [result] = await pool.query(sql, [
                TVA_nummer, naam, email, gsm_nummer, sector,
                huisnummer, straatnaam, gemeente, postcode, bus, land,
                tafelNr, bechrijving
            ]);

            console.log('✅ Created bedrijf with ID:', result.insertId);
            return result.insertId;
            
        } catch (error) {
            console.error('❌ Error in Bedrijf.create:', error);
            throw error;
        }
    }

    // Update bedrijf gegevens
    static async update(bedrijfsnummer, updates) {
        console.log('🔄 Bedrijf.update called with:', { bedrijfsnummer, updates });
        
        try {
            // Process the data to handle arrays and objects properly
            const processedUpdates = {};
            for (const [key, value] of Object.entries(updates)) {
                if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    // Convert arrays and objects to JSON strings
                    processedUpdates[key] = JSON.stringify(value);
                } else {
                    // Keep primitive values as-is
                    processedUpdates[key] = value;
                }
            }
            
            // Bouw de SET clause dynamisch op
            const setFields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(processedUpdates)) {
                setFields.push(`${key} = ?`);
                values.push(value);
            }
            
            if (setFields.length === 0) {
                throw new Error('Geen velden om te updaten');
            }
            
            const sql = `UPDATE BEDRIJF SET ${setFields.join(', ')} WHERE bedrijfsnummer = ?`;
            values.push(bedrijfsnummer);
            
            console.log('📋 Update SQL query:', sql);
            console.log('📋 Update params:', values);
            
            const [result] = await pool.query(sql, values);
            
            console.log(`✅ Updated ${result.affectedRows} bedrijf record(s)`);
            return result.affectedRows;
            
        } catch (error) {
            console.error('❌ Error in Bedrijf.update:', error);
            throw error;
        }
    }

    static async delete(bedrijfsnummer) {
        console.log('📡 Bedrijf.delete called:', bedrijfsnummer);
        
        try {
            const sql = 'DELETE FROM BEDRIJF WHERE bedrijfsnummer = ?';
            const [result] = await pool.query(sql, [bedrijfsnummer]);
            
            console.log('✅ Deleted bedrijf, affected rows:', result.affectedRows);
            return result.affectedRows;
            
        } catch (error) {
            console.error('❌ Error in Bedrijf.delete:', error);
            throw error;
        }
    }

    // Search bedrijven by various criteria
    static async search(searchTerm, limit = 20) {
        console.log('📡 Bedrijf.search called:', { searchTerm, limit });
        
        try {
            const sql = `
                SELECT
                    bedrijfsnummer, TVA_nummer, naam, email, gsm_nummer, sector,
                    huisnummer, straatnaam, gemeente, postcode, bus, land,
                    tafelNr, bechrijving 
                FROM BEDRIJF
                WHERE naam LIKE ? OR sector LIKE ? OR gemeente LIKE ? OR bechrijving LIKE ?
                ORDER BY naam
                LIMIT ?`;

            const searchPattern = `%${searchTerm}%`;
            const [rows] = await pool.query(sql, [
                searchPattern, searchPattern, searchPattern, searchPattern, limit
            ]);
            
            console.log(`✅ Search found ${rows.length} bedrijven`);
            return rows;
            
        } catch (error) {
            console.error('❌ Error in Bedrijf.search:', error);
            throw error;
        }
    }

    // Get bedrijven by sector
    static async getBySector(sector, limit = 20) {
        console.log('📡 Bedrijf.getBySector called:', { sector, limit });
        
        try {
            const sql = `
                SELECT
                    bedrijfsnummer, TVA_nummer, naam, email, gsm_nummer, sector,
                    huisnummer, straatnaam, gemeente, postcode, bus, land,
                    tafelNr, bechrijving 
                FROM BEDRIJF
                WHERE sector = ?
                ORDER BY naam
                LIMIT ?`;

            const [rows] = await pool.query(sql, [sector, limit]);
            
            console.log(`✅ Found ${rows.length} bedrijven in sector ${sector}`);
            return rows;
            
        } catch (error) {
            console.error('❌ Error in Bedrijf.getBySector:', error);
            throw error;
        }
    }

    // Get statistics
    static async getStats() {
        console.log('📡 Bedrijf.getStats called');
        
        try {
            const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM BEDRIJF');
            const [sectorRows] = await pool.query(`
                SELECT sector, COUNT(*) as count 
                FROM BEDRIJF 
                WHERE sector IS NOT NULL AND sector != ''
                GROUP BY sector 
                ORDER BY count DESC
            `);
            
            const stats = {
                total: totalRows[0].total,
                bySector: sectorRows
            };
            
            console.log('✅ Bedrijf stats:', stats);
            return stats;
            
        } catch (error) {
            console.error('❌ Error in Bedrijf.getStats:', error);
            return { total: 0, bySector: [] };
        }
    }

    // Methode om de basis beschikbare tijdslots in te stellen voor een bedrijf
    static async setBaseAvailableTimeSlots(bedrijfsnummer, timeSlotsArray) {
        console.log('📡 Bedrijf.setBaseAvailableTimeSlots called:', { bedrijfsnummer, timeSlotsArray });
        
        try {
            const [result] = await pool.query(
                'UPDATE BEDRIJF SET beschikbareTijdslots = ? WHERE bedrijfsnummer = ?',
                [JSON.stringify(timeSlotsArray), bedrijfsnummer]
            );
            
            console.log('✅ Updated time slots, affected rows:', result.affectedRows);
            return result.affectedRows;
            
        } catch (error) {
            console.error('❌ Error in Bedrijf.setBaseAvailableTimeSlots:', error);
            throw error;
        }
    }

    // Get available time slots for a bedrijf
    static async getAvailableTimeSlots(bedrijfsnummer) {
        console.log('📡 Bedrijf.getAvailableTimeSlots called:', bedrijfsnummer);
        
        try {
            const sql = 'SELECT beschikbareTijdslots FROM BEDRIJF WHERE bedrijfsnummer = ?';
            const [rows] = await pool.query(sql, [bedrijfsnummer]);
            
            if (rows.length === 0) {
                console.log('❌ Bedrijf not found, returning default slots');
                return this.getDefaultTimeSlots();
            }
            
            let timeSlots = rows[0].beschikbareTijdslots;
            if (!timeSlots) {
                console.log('📝 No time slots set, returning default slots');
                return this.getDefaultTimeSlots();
            }
            // Fix: parse alleen als het een string is
            if (typeof timeSlots === 'string') {
                try {
                    timeSlots = JSON.parse(timeSlots);
                } catch (parseError) {
                    console.error('❌ Error parsing time slots:', parseError);
                    return this.getDefaultTimeSlots();
                }
            }
            
            console.log('✅ Retrieved time slots:', timeSlots);
            return Array.isArray(timeSlots) ? timeSlots : this.getDefaultTimeSlots();
        } catch (error) {
            console.error('❌ Error in Bedrijf.getAvailableTimeSlots:', error);
            return this.getDefaultTimeSlots();
        }
    }

    // Get default time slots for Career Launch event
    static getDefaultTimeSlots() {
        const defaultSlots = [
            { id: 1, start: '13:00', end: '13:30' },
            { id: 2, start: '13:30', end: '14:00' },
            { id: 3, start: '14:00', end: '14:30' },
            { id: 4, start: '14:30', end: '15:00' },
            { id: 5, start: '15:00', end: '15:30' },
            { id: 6, start: '15:30', end: '16:00' },
            { id: 7, start: '16:00', end: '16:30' },
            { id: 8, start: '16:30', end: '17:00' },
            { id: 9, start: '17:00', end: '17:30' },
            { id: 10, start: '17:30', end: '18:00' },
            { id: 11, start: '18:00', end: '18:30' },
            { id: 12, start: '18:30', end: '19:00' }
        ];
        
        console.log('📝 Returning default time slots:', defaultSlots);
        return defaultSlots;
    }
}

module.exports = Bedrijf;