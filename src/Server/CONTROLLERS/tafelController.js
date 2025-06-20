// src/Server/CONTROLLERS/tafelController.js
const { pool } = require('../CONFIG/database');

const tafelController = {
  // ===== TAFEL CONFIGURATIE ENDPOINTS =====

  // GET /api/tafels/config - Haal tafel configuratie op
  async getTafelConfig(req, res) {
    try {
      console.log('📊 Fetching tafel configuration...');

      const [rows] = await pool.query(
        `SELECT \`sleutel\`, waarde, beschrijving, updated_at 
         FROM CONFIG 
         WHERE categorie = 'tafels' 
         ORDER BY \`sleutel\``
      );

      const config = {};
      rows.forEach(row => {
        config[row.sleutel] = {
          waarde: parseInt(row.waarde) || 15,
          beschrijving: row.beschrijving,
          updated_at: row.updated_at
        };
      });

      // Zorg voor default waarden als ze niet bestaan
      if (!config.voormiddag_aantal_tafels) {
        config.voormiddag_aantal_tafels = { waarde: 15, beschrijving: 'Aantal tafels voormiddag (default)' };
      }
      if (!config.namiddag_aantal_tafels) {
        config.namiddag_aantal_tafels = { waarde: 15, beschrijving: 'Aantal tafels namiddag (default)' };
      }
      if (!config.max_tafels_limit) {
        config.max_tafels_limit = { waarde: 50, beschrijving: 'Maximum aantal tafels (default)' };
      }

      res.json({
        success: true,
        data: config,
        message: 'Tafel configuratie opgehaald'
      });

    } catch (error) {
      console.error('❌ Error fetching tafel config:', error);
      
      // Fallback naar default waarden
      res.json({
        success: true,
        data: {
          voormiddag_aantal_tafels: { waarde: 15, beschrijving: 'Default waarde' },
          namiddag_aantal_tafels: { waarde: 15, beschrijving: 'Default waarde' },
          max_tafels_limit: { waarde: 50, beschrijving: 'Default waarde' }
        },
        message: 'Tafel configuratie opgehaald (default waarden)',
        warning: 'Database configuratie kon niet worden geladen'
      });
    }
  },

  // POST /api/tafels/voormiddag/config - Configureer aantal tafels voor voormiddag  
  async configureVoormiddagTafels(req, res) {
    try {
      const { aantalTafels } = req.body;
      const userId = req.user?.userId;
      
      console.log(`📊 Configuring voormiddag tables: ${aantalTafels}`);
      
      // Validatie
      if (!aantalTafels || aantalTafels < 1 || aantalTafels > 50) {
        return res.status(400).json({
          success: false,
          error: 'Invalid aantal tafels',
          message: 'Aantal tafels moet tussen 1 en 50 zijn'
        });
      }

      // Update de configuratie in de database
      const [result] = await pool.query(
        'UPDATE CONFIG SET waarde = ?, updated_by = ? WHERE `sleutel` = ?',
        [aantalTafels.toString(), userId, 'voormiddag_aantal_tafels']
      );

      if (result.affectedRows === 0) {
        // Als de sleutel niet bestaat, maak deze aan
        await pool.query(
          'INSERT INTO CONFIG (`sleutel`, waarde, beschrijving, categorie, updated_by) VALUES (?, ?, ?, ?, ?)',
          ['voormiddag_aantal_tafels', aantalTafels.toString(), 'Aantal tafels beschikbaar tijdens voormiddag sessie', 'tafels', userId]
        );
      }

      console.log(`✅ Voormiddag tafels geconfigureerd naar ${aantalTafels} in database`);
      
      res.json({
        success: true,
        message: `Aantal voormiddag tafels ingesteld op ${aantalTafels}`,
        data: {
          sleutel: 'voormiddag_aantal_tafels',
          waarde: aantalTafels,
          updated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error configuring voormiddag tafels:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to configure voormiddag tafels',
        message: 'Er ging iets mis bij het configureren van de tafels'
      });
    }
  },

  // POST /api/tafels/namiddag/config - Configureer aantal tafels voor namiddag
  async configureNamiddagTafels(req, res) {
    try {
      const { aantalTafels } = req.body;
      const userId = req.user?.userId;
      
      console.log(`📊 Configuring namiddag tables: ${aantalTafels}`);
      
      // Validatie
      if (!aantalTafels || aantalTafels < 1 || aantalTafels > 50) {
        return res.status(400).json({
          success: false,
          error: 'Invalid aantal tafels',
          message: 'Aantal tafels moet tussen 1 en 50 zijn'
        });
      }

      // Update de configuratie in de database
      const [result] = await pool.query(
        'UPDATE CONFIG SET waarde = ?, updated_by = ? WHERE `sleutel` = ?',
        [aantalTafels.toString(), userId, 'namiddag_aantal_tafels']
      );

      if (result.affectedRows === 0) {
        // Als de sleutel niet bestaat, maak deze aan
        await pool.query(
          'INSERT INTO CONFIG (`sleutel`, waarde, beschrijving, categorie, updated_by) VALUES (?, ?, ?, ?, ?)',
          ['namiddag_aantal_tafels', aantalTafels.toString(), 'Aantal tafels beschikbaar tijdens namiddag sessie', 'tafels', userId]
        );
      }

      console.log(`✅ Namiddag tafels geconfigureerd naar ${aantalTafels} in database`);
      
      res.json({
        success: true,
        message: `Aantal namiddag tafels ingesteld op ${aantalTafels}`,
        data: {
          sleutel: 'namiddag_aantal_tafels',
          waarde: aantalTafels,
          updated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error configuring namiddag tafels:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to configure namiddag tafels',
        message: 'Er ging iets mis bij het configureren van de tafels'
      });
    }
  },

  // ===== TAFEL OVERZICHT ENDPOINTS =====

  // GET /api/tafels/voormiddag - Alle tafel toewijzingen voor voormiddag (studenten aan tafels)
  async getVoormiddagTafels(req, res) {
    try {
      console.log('📊 Fetching voormiddag tafel assignments...');

      const [assignments] = await pool.query(`
        SELECT 
          s.studentnummer,
          s.voornaam,
          s.achternaam,
          s.email,
          s.tafelNr,
          s.klasgroep,
          s.studiegebied
        FROM STUDENT s
        WHERE s.tafelNr IS NOT NULL AND s.tafelNr > 0
        ORDER BY s.tafelNr, s.achternaam, s.voornaam
      `);

      // Groepeer per tafel
      const tafelGroepen = {};
      assignments.forEach(student => {
        const tafelNr = student.tafelNr;
        if (!tafelGroepen[tafelNr]) {
          tafelGroepen[tafelNr] = [];
        }
        tafelGroepen[tafelNr].push(student);
      });

      res.json({
        success: true,
        data: {
          assignments: assignments,
          groupedByTable: tafelGroepen,
          totalStudents: assignments.length,
          tablesUsed: Object.keys(tafelGroepen).length
        },
        message: 'Voormiddag tafel toewijzingen opgehaald'
      });

    } catch (error) {
      console.error('❌ Error fetching voormiddag tafels:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch voormiddag tafels',
        message: 'Er ging iets mis bij het ophalen van de voormiddag tafels'
      });
    }
  },

  // GET /api/tafels/namiddag - Alle tafel toewijzingen voor namiddag (bedrijven aan tafels)
  async getNamiddagTafels(req, res) {
    try {
      console.log('📊 Fetching namiddag tafel assignments...');

      const [assignments] = await pool.query(`
        SELECT 
          b.bedrijfsnummer,
          b.naam,
          b.sector,
          b.gemeente,
          b.email,
          b.telefoon,
          b.tafelNr
        FROM BEDRIJF b
        WHERE b.tafelNr IS NOT NULL AND b.tafelNr > 0
        ORDER BY b.tafelNr, b.naam
      `);

      // Groepeer per tafel
      const tafelGroepen = {};
      assignments.forEach(bedrijf => {
        const tafelNr = bedrijf.tafelNr;
        if (!tafelGroepen[tafelNr]) {
          tafelGroepen[tafelNr] = [];
        }
        tafelGroepen[tafelNr].push(bedrijf);
      });

      res.json({
        success: true,
        data: {
          assignments: assignments,
          groupedByTable: tafelGroepen,
          totalCompanies: assignments.length,
          tablesUsed: Object.keys(tafelGroepen).length
        },
        message: 'Namiddag tafel toewijzingen opgehaald'
      });

    } catch (error) {
      console.error('❌ Error fetching namiddag tafels:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch namiddag tafels',
        message: 'Er ging iets mis bij het ophalen van de namiddag tafels'
      });
    }
  },

  // GET /api/tafels/overzicht - Volledig overzicht van alle tafel toewijzingen
  async getTafelOverzicht(req, res) {
    try {
      console.log('📊 Fetching complete tafel overview...');

      // Haal beide sessies op
      const [voormiddagData] = await pool.query(`
        SELECT 
          s.studentnummer as id,
          s.voornaam,
          s.achternaam,
          s.email,
          s.tafelNr,
          s.klasgroep,
          s.studiegebied,
          'student' as type,
          'voormiddag' as sessie
        FROM STUDENT s
        WHERE s.tafelNr IS NOT NULL AND s.tafelNr > 0
      `);

      const [namiddagData] = await pool.query(`
        SELECT 
          b.bedrijfsnummer as id,
          b.naam as voornaam,
          '' as achternaam,
          b.email,
          b.tafelNr,
          b.sector as klasgroep,
          b.gemeente as studiegebied,
          'bedrijf' as type,
          'namiddag' as sessie
        FROM BEDRIJF b
        WHERE b.tafelNr IS NOT NULL AND b.tafelNr > 0
      `);

      // Combineer en groepeer data
      const alleAssignments = [...voormiddagData, ...namiddagData];
      const overzichtPerSessie = {
        voormiddag: {},
        namiddag: {}
      };

      voormiddagData.forEach(item => {
        if (!overzichtPerSessie.voormiddag[item.tafelNr]) {
          overzichtPerSessie.voormiddag[item.tafelNr] = [];
        }
        overzichtPerSessie.voormiddag[item.tafelNr].push(item);
      });

      namiddagData.forEach(item => {
        if (!overzichtPerSessie.namiddag[item.tafelNr]) {
          overzichtPerSessie.namiddag[item.tafelNr] = [];
        }
        overzichtPerSessie.namiddag[item.tafelNr].push(item);
      });

      res.json({
        success: true,
        data: {
          volledigOverzicht: alleAssignments,
          perSessie: overzichtPerSessie,
          statistieken: {
            totaalStudenten: voormiddagData.length,
            totaalBedrijven: namiddagData.length,
            voormiddagTafelsInGebruik: Object.keys(overzichtPerSessie.voormiddag).length,
            namiddagTafelsInGebruik: Object.keys(overzichtPerSessie.namiddag).length
          }
        },
        message: 'Volledig tafel overzicht opgehaald'
      });

    } catch (error) {
      console.error('❌ Error fetching tafel overzicht:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tafel overzicht',
        message: 'Er ging iets mis bij het ophalen van het tafel overzicht'
      });
    }
  },

  // ===== TAFEL TOEWIJZING ENDPOINTS =====

  // PUT /api/tafels/student/:studentnummer/tafel/:tafelNr - Wijs student toe aan tafel
  async wijsStudentToeAanTafel(req, res) {
    try {
      const { studentnummer, tafelNr } = req.params;
      const userId = req.user?.userId;

      console.log(`📝 Assigning student ${studentnummer} to table ${tafelNr}`);

      // Validatie
      const tafelNummer = parseInt(tafelNr);
      if (isNaN(tafelNummer) || tafelNummer < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid table number',
          message: 'Tafel nummer moet een positief getal zijn'
        });
      }

      // Controleer of student bestaat
      const [studentCheck] = await pool.query(
        'SELECT studentnummer, voornaam, achternaam FROM STUDENT WHERE studentnummer = ?',
        [studentnummer]
      );

      if (studentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      // Wijs toe aan tafel
      const [result] = await pool.query(
        'UPDATE STUDENT SET tafelNr = ? WHERE studentnummer = ?',
        [tafelNummer, studentnummer]
      );

      const student = studentCheck[0];
      console.log(`✅ Student ${student.voornaam} ${student.achternaam} toegewezen aan tafel ${tafelNummer}`);

      res.json({
        success: true,
        message: `Student ${student.voornaam} ${student.achternaam} toegewezen aan tafel ${tafelNummer}`,
        data: {
          studentnummer: studentnummer,
          naam: `${student.voornaam} ${student.achternaam}`,
          tafelNr: tafelNummer
        }
      });

    } catch (error) {
      console.error('❌ Error assigning student to table:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign student to table',
        message: 'Er ging iets mis bij het toewijzen van de student aan de tafel'
      });
    }
  },

  // PUT /api/tafels/bedrijf/:bedrijfsnummer/tafel/:tafelNr - Wijs bedrijf toe aan tafel
  async wijsBedrijfToeAanTafel(req, res) {
    try {
      const { bedrijfsnummer, tafelNr } = req.params;
      const userId = req.user?.userId;

      console.log(`📝 Assigning company ${bedrijfsnummer} to table ${tafelNr}`);

      // Validatie
      const tafelNummer = parseInt(tafelNr);
      if (isNaN(tafelNummer) || tafelNummer < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid table number',
          message: 'Tafel nummer moet een positief getal zijn'
        });
      }

      // Controleer of bedrijf bestaat
      const [bedrijfCheck] = await pool.query(
        'SELECT bedrijfsnummer, naam FROM BEDRIJF WHERE bedrijfsnummer = ?',
        [bedrijfsnummer]
      );

      if (bedrijfCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      // Wijs toe aan tafel
      const [result] = await pool.query(
        'UPDATE BEDRIJF SET tafelNr = ? WHERE bedrijfsnummer = ?',
        [tafelNummer, bedrijfsnummer]
      );

      const bedrijf = bedrijfCheck[0];
      console.log(`✅ Bedrijf ${bedrijf.naam} toegewezen aan tafel ${tafelNummer}`);

      res.json({
        success: true,
        message: `Bedrijf ${bedrijf.naam} toegewezen aan tafel ${tafelNummer}`,
        data: {
          bedrijfsnummer: bedrijfsnummer,
          naam: bedrijf.naam,
          tafelNr: tafelNummer
        }
      });

    } catch (error) {
      console.error('❌ Error assigning company to table:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign company to table',
        message: 'Er ging iets mis bij het toewijzen van het bedrijf aan de tafel'
      });
    }
  },

  // DELETE /api/tafels/student/:studentnummer - Verwijder student van tafel
  async verwijderStudentVanTafel(req, res) {
    try {
      const { studentnummer } = req.params;

      console.log(`🗑️ Removing student ${studentnummer} from table`);

      // Controleer of student bestaat en heeft een tafel
      const [studentCheck] = await pool.query(
        'SELECT studentnummer, voornaam, achternaam, tafelNr FROM STUDENT WHERE studentnummer = ?',
        [studentnummer]
      );

      if (studentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      const student = studentCheck[0];
      const oldTafelNr = student.tafelNr;

      // Verwijder van tafel
      await pool.query(
        'UPDATE STUDENT SET tafelNr = NULL WHERE studentnummer = ?',
        [studentnummer]
      );

      console.log(`✅ Student ${student.voornaam} ${student.achternaam} verwijderd van tafel ${oldTafelNr}`);

      res.json({
        success: true,
        message: `Student ${student.voornaam} ${student.achternaam} verwijderd van tafel ${oldTafelNr || 'onbekend'}`,
        data: {
          studentnummer: studentnummer,
          naam: `${student.voornaam} ${student.achternaam}`,
          previousTafelNr: oldTafelNr
        }
      });

    } catch (error) {
      console.error('❌ Error removing student from table:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove student from table',
        message: 'Er ging iets mis bij het verwijderen van de student van de tafel'
      });
    }
  },

  // DELETE /api/tafels/bedrijf/:bedrijfsnummer - Verwijder bedrijf van tafel
  async verwijderBedrijfVanTafel(req, res) {
    try {
      const { bedrijfsnummer } = req.params;

      console.log(`🗑️ Removing company ${bedrijfsnummer} from table`);

      // Controleer of bedrijf bestaat en heeft een tafel
      const [bedrijfCheck] = await pool.query(
        'SELECT bedrijfsnummer, naam, tafelNr FROM BEDRIJF WHERE bedrijfsnummer = ?',
        [bedrijfsnummer]
      );

      if (bedrijfCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      const bedrijf = bedrijfCheck[0];
      const oldTafelNr = bedrijf.tafelNr;

      // Verwijder van tafel
      await pool.query(
        'UPDATE BEDRIJF SET tafelNr = NULL WHERE bedrijfsnummer = ?',
        [bedrijfsnummer]
      );

      console.log(`✅ Bedrijf ${bedrijf.naam} verwijderd van tafel ${oldTafelNr}`);

      res.json({
        success: true,
        message: `Bedrijf ${bedrijf.naam} verwijderd van tafel ${oldTafelNr || 'onbekend'}`,
        data: {
          bedrijfsnummer: bedrijfsnummer,
          naam: bedrijf.naam,
          previousTafelNr: oldTafelNr
        }
      });

    } catch (error) {
      console.error('❌ Error removing company from table:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove company from table',
        message: 'Er ging iets mis bij het verwijderen van het bedrijf van de tafel'
      });
    }
  },

  // ===== BULK & UTILITY ENDPOINTS =====

  // POST /api/tafels/bulk-assign - Bulk toewijzing van tafels
  async bulkTafelToewijzing(req, res) {
    try {
      const { assignments } = req.body; // [{ type: 'student', id: '123', tafelNr: 1 }, ...]
      const userId = req.user?.userId;

      console.log(`📝 Processing bulk table assignments: ${assignments.length} items`);

      if (!Array.isArray(assignments) || assignments.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid assignments data',
          message: 'Assignments moet een array zijn met tenminste 1 item'
        });
      }

      const results = [];
      const errors = [];

      // Process in transaction
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        for (const assignment of assignments) {
          const { type, id, tafelNr } = assignment;

          try {
            if (type === 'student') {
              await connection.query(
                'UPDATE STUDENT SET tafelNr = ? WHERE studentnummer = ?',
                [tafelNr, id]
              );
              results.push({ type, id, tafelNr, status: 'success' });
            } else if (type === 'bedrijf') {
              await connection.query(
                'UPDATE BEDRIJF SET tafelNr = ? WHERE bedrijfsnummer = ?',
                [tafelNr, id]
              );
              results.push({ type, id, tafelNr, status: 'success' });
            } else {
              errors.push({ type, id, tafelNr, error: 'Invalid type' });
            }
          } catch (itemError) {
            errors.push({ type, id, tafelNr, error: itemError.message });
          }
        }

        await connection.commit();

        res.json({
          success: true,
          message: `Bulk assignment completed: ${results.length} successful, ${errors.length} errors`,
          data: {
            successful: results,
            errors: errors,
            totalProcessed: assignments.length
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('❌ Error in bulk table assignment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process bulk assignment',
        message: 'Er ging iets mis bij het verwerken van de bulk toewijzing'
      });
    }
  },

  // GET /api/tafels/beschikbaar - Krijg lijst van beschikbare tafels
  async getBeschikbareTafels(req, res) {
    try {
      const { sessie } = req.query; // 'voormiddag' of 'namiddag'

      console.log(`📊 Fetching available tables for session: ${sessie || 'both'}`);

      let voormiddagBezet = [];
      let namiddagBezet = [];

      // Haal bezette tafels op
      if (!sessie || sessie === 'voormiddag') {
        const [voormiddagRows] = await pool.query(
          'SELECT DISTINCT tafelNr FROM STUDENT WHERE tafelNr IS NOT NULL AND tafelNr > 0'
        );
        voormiddagBezet = voormiddagRows.map(row => row.tafelNr);
      }

      if (!sessie || sessie === 'namiddag') {
        const [namiddagRows] = await pool.query(
          'SELECT DISTINCT tafelNr FROM BEDRIJF WHERE tafelNr IS NOT NULL AND tafelNr > 0'
        );
        namiddagBezet = namiddagRows.map(row => row.tafelNr);
      }

      // Haal max aantal tafels uit configuratie
      const [configRows] = await pool.query(
        `SELECT \`sleutel\`, waarde FROM CONFIG 
         WHERE \`sleutel\` IN ('voormiddag_aantal_tafels', 'namiddag_aantal_tafels')`
      );

      let maxVoormiddag = 15;
      let maxNamiddag = 15;

      configRows.forEach(row => {
        if (row.sleutel === 'voormiddag_aantal_tafels') {
          maxVoormiddag = parseInt(row.waarde) || 15;
        } else if (row.sleutel === 'namiddag_aantal_tafels') {
          maxNamiddag = parseInt(row.waarde) || 15;
        }
      });

      // Genereer beschikbare tafels
      const voormiddagBeschikbaar = [];
      const namiddagBeschikbaar = [];

      for (let i = 1; i <= maxVoormiddag; i++) {
        voormiddagBeschikbaar.push({
          tafelNr: i,
          beschikbaar: !voormiddagBezet.includes(i),
          bezet: voormiddagBezet.includes(i)
        });
      }

      for (let i = 1; i <= maxNamiddag; i++) {
        namiddagBeschikbaar.push({
          tafelNr: i,
          beschikbaar: !namiddagBezet.includes(i),
          bezet: namiddagBezet.includes(i)
        });
      }

      const responseData = {
        voormiddag: {
          tafels: voormiddagBeschikbaar,
          maxTafels: maxVoormiddag,
          bezetteTafels: voormiddagBezet.length,
          beschikbareTafels: maxVoormiddag - voormiddagBezet.length
        },
        namiddag: {
          tafels: namiddagBeschikbaar,
          maxTafels: maxNamiddag,
          bezetteTafels: namiddagBezet.length,
          beschikbareTafels: maxNamiddag - namiddagBezet.length
        }
      };

      // Filter op sessie als gevraagd
      if (sessie === 'voormiddag') {
        delete responseData.namiddag;
      } else if (sessie === 'namiddag') {
        delete responseData.voormiddag;
      }

      res.json({
        success: true,
        data: responseData,
        message: 'Beschikbare tafels opgehaald'
      });

    } catch (error) {
      console.error('❌ Error fetching available tables:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available tables',
        message: 'Er ging iets mis bij het ophalen van de beschikbare tafels'
      });
    }
  },

  // GET /api/tafels/statistieken - Tafel statistieken
  async getTafelStatistieken(req, res) {
    try {
      console.log('📊 Fetching table statistics...');

      // Parallelle queries voor betere performance
      const [
        studentStats,
        bedrijfStats,
        configStats
      ] = await Promise.all([
        pool.query(`
          SELECT 
            COUNT(*) as totaal,
            COUNT(tafelNr) as toegewezen,
            COUNT(*) - COUNT(tafelNr) as nietToegew
          FROM STUDENT
        `),
        pool.query(`
          SELECT 
            COUNT(*) as totaal,
            COUNT(tafelNr) as toegewezen,
            COUNT(*) - COUNT(tafelNr) as nietToegew
          FROM BEDRIJF
        `),
        pool.query(`
          SELECT \`sleutel\`, waarde 
          FROM CONFIG 
          WHERE \`sleutel\` IN ('voormiddag_aantal_tafels', 'namiddag_aantal_tafels')
        `)
      ]);

      const studentData = studentStats[0][0];
      const bedrijfData = bedrijfStats[0][0];

      let maxVoormiddag = 15;
      let maxNamiddag = 15;

      configStats[0].forEach(row => {
        if (row.sleutel === 'voormiddag_aantal_tafels') {
          maxVoormiddag = parseInt(row.waarde) || 15;
        } else if (row.sleutel === 'namiddag_aantal_tafels') {
          maxNamiddag = parseInt(row.waarde) || 15;
        }
      });

      const statistieken = {
        voormiddag: {
          maxTafels: maxVoormiddag,
          totaalStudenten: studentData.totaal,
          toegewezenStudenten: studentData.toegewezen,
          nietToegew: studentData.nietToegew,
          bezettingsgraad: maxVoormiddag > 0 ? Math.round((studentData.toegewezen / maxVoormiddag) * 100) : 0
        },
        namiddag: {
          maxTafels: maxNamiddag,
          totaalBedrijven: bedrijfData.totaal,
          toegewezenBedrijven: bedrijfData.toegewezen,
          nietToegew: bedrijfData.nietToegew,
          bezettingsgraad: maxNamiddag > 0 ? Math.round((bedrijfData.toegewezen / maxNamiddag) * 100) : 0
        },
        algemeen: {
          totaalEntiteiten: studentData.totaal + bedrijfData.totaal,
          totaalToegew: studentData.toegewezen + bedrijfData.toegewezen,
          totaalNietToegew: studentData.nietToegew + bedrijfData.nietToegew,
          totaalTafels: maxVoormiddag + maxNamiddag
        }
      };

      res.json({
        success: true,
        data: statistieken,
        message: 'Tafel statistieken opgehaald',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error fetching table statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch table statistics',
        message: 'Er ging iets mis bij het ophalen van de tafel statistieken'
      });
    }
  }
};

module.exports = tafelController;