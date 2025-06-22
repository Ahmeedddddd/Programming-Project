// src/Server/CONTROLLERS/tafelController.js
// Controller voor tafel management en plattegrond functionaliteit

const { pool } = require('../CONFIG/database');
const Student = require('../MODELS/student');
const Bedrijf = require('../MODELS/bedrijf');

const tafelController = {

  // ===== PUBLIC ENDPOINTS =====
  // GET /api/tafels/voormiddag - Projecten aan tafels (voormiddag)
  async getVoormiddagTafels(req, res) {
    try {
      console.log('📡 Fetching voormiddag tafel assignments...');

      const [rows] = await pool.query(`
        SELECT 
          s.studentnummer,
          s.voornaam,
          s.achternaam,
          s.projectTitel,
          s.projectBeschrijving,
          s.tafelNr,
          s.opleiding,
          s.opleidingsrichting,
          s.email
        FROM STUDENT s 
        WHERE s.tafelNr IS NOT NULL 
        AND s.projectTitel IS NOT NULL 
        AND s.projectTitel != ''
        ORDER BY s.tafelNr ASC, s.projectTitel ASC
      `);

      // Groepeer per tafel en dan per project
      const tafelGroepen = {};
      const projectGroepen = {};
      
      rows.forEach(student => {
        const tafelNr = student.tafelNr;
        const projectTitel = student.projectTitel;
        
        // Groepeer studenten per project
        if (!projectGroepen[projectTitel]) {
          projectGroepen[projectTitel] = {
            projectTitel: projectTitel,
            projectBeschrijving: student.projectBeschrijving,
            studenten: [],
            tafelNr: tafelNr
          };
        }
        
        projectGroepen[projectTitel].studenten.push({
          studentnummer: student.studentnummer,
          naam: `${student.voornaam} ${student.achternaam}`,
          email: student.email,
          opleiding: student.opleiding,
          opleidingsrichting: student.opleidingsrichting
        });
      });

      // Converteer naar tafel structuur met projecten
      Object.values(projectGroepen).forEach(project => {
        const tafelNr = project.tafelNr;
        if (!tafelGroepen[tafelNr]) {
          tafelGroepen[tafelNr] = {
            tafelNr: tafelNr,
            type: 'project',
            periode: 'voormiddag',
            items: []
          };
        }
        
        tafelGroepen[tafelNr].items.push({
          id: project.projectTitel, // Gebruik project titel als ID
          naam: project.projectTitel,
          titel: project.projectTitel,
          beschrijving: project.projectBeschrijving,
          studenten: project.studenten,
          aantalStudenten: project.studenten.length,
          type: 'project'
        });
      });

      res.json({
        success: true,
        data: Object.values(tafelGroepen),
        count: Object.keys(tafelGroepen).length,
        periode: 'voormiddag',
        message: 'Voormiddag project toewijzingen opgehaald'
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

  // GET /api/tafels/namiddag - Bedrijven aan tafels (namiddag)
  async getNamiddagTafels(req, res) {
    try {
      console.log('📡 Fetching namiddag tafel assignments...');

      const [rows] = await pool.query(`
        SELECT 
          b.bedrijfsnummer,
          b.naam,
          b.sector,
          b.bechrijving as beschrijving,
          b.tafelNr,
          b.email,
          b.gemeente,
          c.voornaam as contactVoornaam,
          c.achternaam as contactAchternaam
        FROM BEDRIJF b
        LEFT JOIN CONTACTPERSOON c ON b.bedrijfsnummer = c.bedrijfsnummer
        WHERE b.tafelNr IS NOT NULL
        ORDER BY b.tafelNr ASC
      `);

      // Groepeer per tafel
      const tafelGroepen = {};
      rows.forEach(bedrijf => {
        const tafelNr = bedrijf.tafelNr;
        if (!tafelGroepen[tafelNr]) {
          tafelGroepen[tafelNr] = {
            tafelNr: tafelNr,
            type: 'bedrijf',
            periode: 'namiddag',
            items: []
          };
        }

        // Check of bedrijf al bestaat (vanwege JOIN met contactpersoon)
        const existingBedrijf = tafelGroepen[tafelNr].items.find(
          item => item.id === bedrijf.bedrijfsnummer
        );

        if (!existingBedrijf) {
          tafelGroepen[tafelNr].items.push({
            id: bedrijf.bedrijfsnummer,
            naam: bedrijf.naam,
            titel: bedrijf.naam,
            beschrijving: bedrijf.beschrijving,
            sector: bedrijf.sector,
            email: bedrijf.email,
            gemeente: bedrijf.gemeente,
            contactpersoon: bedrijf.contactVoornaam && bedrijf.contactAchternaam ? 
              `${bedrijf.contactVoornaam} ${bedrijf.contactAchternaam}` : null,
            type: 'bedrijf'
          });
        }
      });

      res.json({
        success: true,
        data: Object.values(tafelGroepen),
        count: Object.keys(tafelGroepen).length,
        periode: 'namiddag',
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

  // GET /api/tafels/overzicht - Volledig overzicht
  async getTafelOverzicht(req, res) {
    try {
      console.log('📡 Fetching complete tafel overzicht...');

      // Haal beide periodes op
      const voormiddagResponse = { json: data => data };
      const namiddagResponse = { json: data => data };

      await this.getVoormiddagTafels({ query: {} }, voormiddagResponse);
      await this.getNamiddagTafels({ query: {} }, namiddagResponse);

      const voormiddagData = voormiddagResponse._data || [];
      const namiddagData = namiddagResponse._data || [];

      res.json({
        success: true,
        data: {
          voormiddag: voormiddagData,
          namiddag: namiddagData
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

  // ===== ORGANISATOR ENDPOINTS =====
  // PUT /api/tafels/student/:studentnummer/tafel/:tafelNr - Wijs student en alle projectgenoten toe aan tafel
  async wijsStudentToeAanTafel(req, res) {
    try {
      const { studentnummer, tafelNr } = req.params;
      const userId = req.user?.id || 'system';

      console.log(`📝 Assigning student ${studentnummer} and all project members to tafel ${tafelNr}`);      // Validatie
      if (!studentnummer || !tafelNr) {
        console.log(`❌ Missing parameters: studentnummer=${studentnummer}, tafelNr=${tafelNr}`);
        return res.status(400).json({
          success: false,
          error: 'Missing parameters',
          message: 'Studentnummer en tafelnummer zijn vereist'
        });
      }

      // Extra validatie: controleer of studentnummer numeriek is
      const studentNum = parseInt(studentnummer);
      if (isNaN(studentNum) || studentNum < 1) {
        console.log(`❌ Invalid student number: ${studentnummer}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid student number',
          message: 'Studentnummer moet een positief getal zijn'
        });
      }

      const tafelNum = parseInt(tafelNr);
      if (isNaN(tafelNum) || tafelNum < 1) {
        console.log(`❌ Invalid tafel number: ${tafelNr}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid tafel number',
          message: 'Tafelnummer moet een positief getal zijn'
        });
      }      // STAP 1: Haal projecttitel op van de student
      console.log(`🔍 Looking up student ${studentNum} in database...`);
      const [studentCheck] = await pool.query(
        'SELECT studentnummer, projectTitel FROM STUDENT WHERE studentnummer = ?',
        [studentNum]
      );

      if (studentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      const projectTitel = studentCheck[0].projectTitel;
      
      // Controleer of projectTitel bestaat en niet leeg is
      if (!projectTitel || projectTitel.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'No project title',
          message: 'Student heeft geen projecttitel - kan niet worden toegewezen'
        });
      }

      console.log(`📋 Project found: "${projectTitel}" - proceeding with bulk assignment`);

      // STAP 2: Zoek alle studenten met dezelfde projecttitel
      const [projectStudents] = await pool.query(
        'SELECT studentnummer, voornaam, achternaam FROM STUDENT WHERE projectTitel = ?',
        [projectTitel]
      );

      if (projectStudents.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No project students found',
          message: 'Geen studenten gevonden voor dit project'
        });
      }      // STAP 3: Bulk update - alle studenten met dit project toewijzen aan tafel
      const [updateResult] = await pool.query(`
        UPDATE STUDENT 
        SET tafelNr = ? 
        WHERE projectTitel = ?
      `, [tafelNum, projectTitel]);

      console.log(`✅ Bulk assigned ${updateResult.affectedRows} students to tafel ${tafelNum}`);

      res.json({
        success: true,
        message: `Project "${projectTitel}" toegewezen aan tafel ${tafelNr}`,
        projectTitel: projectTitel,
        studentsUpdated: updateResult.affectedRows,
        students: projectStudents.map(s => `${s.voornaam} ${s.achternaam}`),
        tafelNr: tafelNum,
        timestamp: new Date().toISOString()
      });    } catch (error) {
      console.error('❌ Error assigning student to tafel:', error);
      
      // Verbeterde error logging
      if (error.code) {
        console.error(`Database error code: ${error.code}`);
      }
      if (error.sqlMessage) {
        console.error(`SQL error: ${error.sqlMessage}`);
      }
      
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Er ging iets mis bij het toewijzen van de student: ' + error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // PUT /api/tafels/bedrijf/:bedrijfsnummer/tafel/:tafelNr
  async wijsBedrijfToeAanTafel(req, res) {
    try {
      const { bedrijfsnummer, tafelNr } = req.params;
      const userId = req.user?.id || 'system';

      console.log(`📝 Assigning bedrijf ${bedrijfsnummer} to tafel ${tafelNr}`);

      // Validatie
      if (!bedrijfsnummer || !tafelNr) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameters',
          message: 'Bedrijfsnummer en tafelnummer zijn vereist'
        });
      }

      const tafelNum = parseInt(tafelNr);
      if (isNaN(tafelNum) || tafelNum < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tafel number',
          message: 'Tafelnummer moet een positief getal zijn'
        });
      }

      // Check of bedrijf bestaat
      const [bedrijfCheck] = await pool.query(
        'SELECT bedrijfsnummer, naam FROM BEDRIJF WHERE bedrijfsnummer = ?',
        [bedrijfsnummer]
      );

      if (bedrijfCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Bedrijf not found',
          message: 'Bedrijf niet gevonden'
        });
      }      // Update bedrijf tafel toewijzing
      const [updateResult] = await pool.query(`
        UPDATE BEDRIJF 
        SET tafelNr = ? 
        WHERE bedrijfsnummer = ?
      `, [tafelNum, bedrijfsnummer]);

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Bedrijf not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      console.log(`✅ Bedrijf ${bedrijfsnummer} assigned to tafel ${tafelNum}`);

      res.json({
        success: true,
        message: `Bedrijf ${bedrijfsnummer} toegewezen aan tafel ${tafelNum}`,
        bedrijfsnummer: bedrijfsnummer,
        tafelNr: tafelNum,
        timestamp: new Date().toISOString()
      });    } catch (error) {
      console.error('❌ Error assigning bedrijf to tafel:', error);
      
      // Verbeterde error logging
      if (error.code) {
        console.error(`Database error code: ${error.code}`);
      }
      if (error.sqlMessage) {
        console.error(`SQL error: ${error.sqlMessage}`);
      }
      
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Er ging iets mis bij het toewijzen van het bedrijf: ' + error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  // DELETE /api/tafels/student/:studentnummer
  async verwijderStudentVanTafel(req, res) {
    try {
      const { studentnummer } = req.params;
      const userId = req.user?.id || 'system';

      console.log(`🗑️ Removing student ${studentnummer} and all project members from tafel`);      // Validatie
      if (!studentnummer) {
        console.log(`❌ Missing parameter: studentnummer=${studentnummer}`);
        return res.status(400).json({
          success: false,
          error: 'Missing parameter',
          message: 'Studentnummer is vereist'
        });
      }

      // Extra validatie: controleer of studentnummer numeriek is
      const studentNum = parseInt(studentnummer);
      if (isNaN(studentNum) || studentNum < 1) {
        console.log(`❌ Invalid student number: ${studentnummer}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid student number',
          message: 'Studentnummer moet een positief getal zijn'
        });
      }      // STAP 1: Haal projecttitel en huidige tafel op van de student
      console.log(`🔍 Looking up student ${studentNum} for removal...`);
      const [studentCheck] = await pool.query(
        'SELECT studentnummer, tafelNr, projectTitel FROM STUDENT WHERE studentnummer = ?',
        [studentNum]
      );

      if (studentCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      const projectTitel = studentCheck[0].projectTitel;
      const currentTafel = studentCheck[0].tafelNr;
      
      // Controleer of projectTitel bestaat en niet leeg is
      if (!projectTitel || projectTitel.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'No project title',
          message: 'Student heeft geen projecttitel - kan niet worden verwijderd'
        });
      }

      console.log(`📋 Project found: "${projectTitel}" - proceeding with bulk removal from tafel ${currentTafel || 'none'}`);

      // STAP 2: Zoek alle studenten met dezelfde projecttitel
      const [projectStudents] = await pool.query(
        'SELECT studentnummer, voornaam, achternaam FROM STUDENT WHERE projectTitel = ?',
        [projectTitel]
      );

      if (projectStudents.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No project students found',
          message: 'Geen studenten gevonden voor dit project'
        });
      }      // STAP 3: Bulk update - alle studenten met dit project verwijderen van tafel
      const [updateResult] = await pool.query(`
        UPDATE STUDENT 
        SET tafelNr = NULL 
        WHERE projectTitel = ?
      `, [projectTitel]);

      console.log(`✅ Bulk removed ${updateResult.affectedRows} students from tafel ${currentTafel || 'none'}`);

      res.json({
        success: true,
        message: `Project "${projectTitel}" verwijderd van tafel ${currentTafel || 'none'}`,
        projectTitel: projectTitel,
        studentsUpdated: updateResult.affectedRows,
        students: projectStudents.map(s => `${s.voornaam} ${s.achternaam}`),
        previousTafelNr: currentTafel,
        timestamp: new Date().toISOString()
      });    } catch (error) {
      console.error('❌ Error removing student from tafel:', error);
      
      // Verbeterde error logging
      if (error.code) {
        console.error(`Database error code: ${error.code}`);
      }
      if (error.sqlMessage) {
        console.error(`SQL error: ${error.sqlMessage}`);
      }
      
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Er ging iets mis bij het verwijderen van de student: ' + error.message,
        timestamp: new Date().toISOString()
      });
    }
  },// DELETE /api/tafels/bedrijf/:bedrijfsnummer
  async verwijderBedrijfVanTafel(req, res) {
    try {
      const { bedrijfsnummer } = req.params;
      
      console.log(`🗑️ Removing bedrijf ${bedrijfsnummer} from tafel`);
      console.log('📋 Request params:', req.params);

      // Debug: Check if Bedrijf model and update function exist
      console.log('📋 Bedrijf model:', typeof Bedrijf);
      console.log('📋 Bedrijf.update function:', typeof Bedrijf.update);

      const result = await Bedrijf.update(bedrijfsnummer, { tafelNr: null });

      console.log('📊 Update result from model:', result);

      if (result === 0) {
        return res.status(404).json({
          success: false,
          error: 'Bedrijf not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      res.json({
        success: true,
        message: 'Bedrijf verwijderd van tafel',
        data: { bedrijfsnummer }
      });

    } catch (error) {
      console.error('❌ Error removing bedrijf from tafel:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to remove bedrijf from tafel',
        message: 'Er ging iets mis bij het verwijderen van het bedrijf van de tafel'
      });
    }
  },

  // POST /api/tafels/bulk-assign
  async bulkTafelToewijzing(req, res) {
    try {
      const { assignments } = req.body; // [{ type: 'student', id: 232, tafelNr: 1 }, ...]
      
      console.log('📦 Processing bulk tafel assignments:', assignments);

      if (!assignments || !Array.isArray(assignments)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid assignments data',
          message: 'Ongeldige toewijzings data'
        });
      }

      const results = [];
      const errors = [];

      for (const assignment of assignments) {
        try {
          const { type, id, tafelNr } = assignment;

          if (type === 'student') {
            await Student.update(id, { tafelNr: tafelNr ? parseInt(tafelNr) : null });
            results.push({ type, id, tafelNr, status: 'success' });
          } else if (type === 'bedrijf') {
            await Bedrijf.update(id, { tafelNr: tafelNr ? parseInt(tafelNr) : null });
            results.push({ type, id, tafelNr, status: 'success' });
          } else {
            errors.push({ assignment, error: 'Invalid type' });
          }
        } catch (error) {
          errors.push({ assignment, error: error.message });
        }
      }

      res.json({
        success: true,
        message: `Bulk toewijzing voltooid: ${results.length} succesvol, ${errors.length} fouten`,
        data: {
          successful: results,
          errors: errors,
          summary: {
            total: assignments.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Error in bulk tafel assignment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process bulk assignments',
        message: 'Er ging iets mis bij de bulk toewijzing'
      });
    }
  },

  // GET /api/tafels/beschikbaar
  async getBeschikbareTafels(req, res) {
    try {
      console.log('📋 Fetching beschikbare tafels...');

      // Definieer het maximale aantal tafels (kan uit config komen)
      const MAX_TAFELS = 20;
      const beschikbareTafels = [];

      for (let i = 1; i <= MAX_TAFELS; i++) {
        beschikbareTafels.push({
          tafelNr: i,
          beschikbaar: true,
          voormiddagBezet: false,
          namiddagBezet: false
        });
      }

      // Controleer welke tafels bezet zijn
      const [studentTafels] = await pool.query(`
        SELECT DISTINCT tafelNr FROM STUDENT WHERE tafelNr IS NOT NULL
      `);

      const [bedrijfTafels] = await pool.query(`
        SELECT DISTINCT tafelNr FROM BEDRIJF WHERE tafelNr IS NOT NULL
      `);

      // Update bezetting status
      studentTafels.forEach(row => {
        const tafel = beschikbareTafels.find(t => t.tafelNr === row.tafelNr);
        if (tafel) {
          tafel.voormiddagBezet = true;
          tafel.beschikbaar = false;
        }
      });

      bedrijfTafels.forEach(row => {
        const tafel = beschikbareTafels.find(t => t.tafelNr === row.tafelNr);
        if (tafel) {
          tafel.namiddagBezet = true;
          tafel.beschikbaar = false;
        }
      });

      res.json({
        success: true,
        data: beschikbareTafels,
        summary: {
          totaalTafels: MAX_TAFELS,
          beschikbaar: beschikbareTafels.filter(t => t.beschikbaar).length,
          voormiddagBezet: beschikbareTafels.filter(t => t.voormiddagBezet).length,
          namiddagBezet: beschikbareTafels.filter(t => t.namiddagBezet).length
        }
      });

    } catch (error) {
      console.error('❌ Error fetching beschikbare tafels:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch beschikbare tafels',
        message: 'Er ging iets mis bij het ophalen van beschikbare tafels'
      });
    }
  },

  // GET /api/tafels/statistieken
  async getTafelStatistieken(req, res) {
    try {
      console.log('📊 Fetching tafel statistieken...');

      const [studentStats] = await pool.query(`
        SELECT 
          COUNT(*) as totaalStudenten,
          COUNT(tafelNr) as studentenMetTafel,
          COUNT(*) - COUNT(tafelNr) as studentenZonderTafel
        FROM STUDENT
      `);

      const [bedrijfStats] = await pool.query(`
        SELECT 
          COUNT(*) as totaalBedrijven,
          COUNT(tafelNr) as bedrijvenMetTafel,
          COUNT(*) - COUNT(tafelNr) as bedrijvenZonderTafel
        FROM BEDRIJF
      `);

      const [tafelVerdeling] = await pool.query(`
        SELECT 
          tafelNr,
          COUNT(*) as aantalStudenten,
          'student' as type
        FROM STUDENT 
        WHERE tafelNr IS NOT NULL 
        GROUP BY tafelNr
        
        UNION ALL
        
        SELECT 
          tafelNr,
          COUNT(*) as aantalBedrijven,
          'bedrijf' as type
        FROM BEDRIJF 
        WHERE tafelNr IS NOT NULL 
        GROUP BY tafelNr
        
        ORDER BY tafelNr
      `);

      res.json({
        success: true,
        data: {
          studenten: studentStats[0],
          bedrijven: bedrijfStats[0],
          tafelVerdeling: tafelVerdeling,
          gegenereerOp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error fetching tafel statistieken:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tafel statistieken',
        message: 'Er ging iets mis bij het ophalen van tafel statistieken'
      });
    }
  },

  // ===== CONFIGURATION ENDPOINTS =====
  // POST /api/tafels/voormiddag/config - Configureer aantal tafels voor voormiddag  // POST /api/tafels/voormiddag/config - Configureer aantal tafels voor voormiddag
  async configureVoormiddagTafels(req, res) {
    try {
      const { aantalTafels } = req.body;
      const userId = req.user?.userId;
      
      console.log(`📊 Configuring voormiddag tables: ${aantalTafels}`);
      
      // Validatie
      if (!aantalTafels || isNaN(aantalTafels) || aantalTafels < 1 || aantalTafels > 500) {
        return res.status(400).json({
          success: false,
          error: 'Invalid aantal tafels',
          message: 'Aantal tafels moet tussen 1 en 500 zijn en moet een geldig nummer zijn'
        });
      }

      // Check huidige toewijzingen vs nieuwe limiet
      const [currentAssignments] = await pool.query(`
        SELECT COUNT(DISTINCT tafelNr) as aantalBoven 
        FROM STUDENT 
        WHERE tafelNr IS NOT NULL AND tafelNr > ?
      `, [aantalTafels]);
      
      const aantalBoven = currentAssignments[0]?.aantalBoven || 0;
      let warning = null;
      
      if (aantalBoven > 0) {
        warning = `Let op: Er zijn studenten toegewezen aan ${aantalBoven} tafelnummer(s) hoger dan ${aantalTafels}. Deze blijven bestaan maar zijn mogelijk niet zichtbaar in het overzicht.`;
      }

      // Update configuratie in CONFIG tabel
      const [updateResult] = await pool.query(`
        UPDATE CONFIG 
        SET waarde = ?, updated_by = ?, updated_at = NOW() 
        WHERE \`sleutel\` = 'voormiddag_aantal_tafels'
      `, [aantalTafels.toString(), userId]);

      // Als de sleutel niet bestaat, voeg hem toe
      if (updateResult.affectedRows === 0) {
        await pool.query(`
          INSERT INTO CONFIG (\`sleutel\`, waarde, beschrijving, categorie, updated_by) 
          VALUES ('voormiddag_aantal_tafels', ?, 'Aantal beschikbare tafels voor voormiddag programma', 'tafels', ?)
        `, [aantalTafels.toString(), userId]);
      }
      
      console.log(`✅ Voormiddag tafels geconfigureerd naar ${aantalTafels} in database`);
      
      res.json({
        success: true,
        message: `Aantal voormiddag tafels succesvol ingesteld op ${aantalTafels}`,
        aantalTafels: aantalTafels,
        warning: warning,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error configuring voormiddag tafels:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to configure voormiddag tafels',
        message: 'Er ging iets mis bij het configureren van de tafels'
      });
    }
  },  // POST /api/tafels/namiddag/config - Configureer aantal tafels voor namiddag
  async configureNamiddagTafels(req, res) {
    try {
      const { aantalTafels } = req.body;
      const userId = req.user?.userId;
      
      console.log(`📊 Configuring namiddag tables: ${aantalTafels}`);
      
      // Validatie
      if (!aantalTafels || isNaN(aantalTafels) || aantalTafels < 1 || aantalTafels > 500) {
        return res.status(400).json({
          success: false,
          error: 'Invalid aantal tafels',
          message: 'Aantal tafels moet tussen 1 en 500 zijn en moet een geldig nummer zijn'
        });
      }

      // Check huidige toewijzingen vs nieuwe limiet
      const [currentAssignments] = await pool.query(`
        SELECT COUNT(DISTINCT tafelNr) as aantalBoven 
        FROM BEDRIJF 
        WHERE tafelNr IS NOT NULL AND tafelNr > ?
      `, [aantalTafels]);
      
      const aantalBoven = currentAssignments[0]?.aantalBoven || 0;
      let warning = null;
      
      if (aantalBoven > 0) {
        warning = `Let op: Er zijn bedrijven toegewezen aan ${aantalBoven} tafelnummer(s) hoger dan ${aantalTafels}. Deze blijven bestaan maar zijn mogelijk niet zichtbaar in het overzicht.`;
      }

      // Update configuratie in CONFIG tabel
      const [updateResult] = await pool.query(`
        UPDATE CONFIG 
        SET waarde = ?, updated_by = ?, updated_at = NOW() 
        WHERE \`sleutel\` = 'namiddag_aantal_tafels'
      `, [aantalTafels.toString(), userId]);

      // Als de sleutel niet bestaat, voeg hem toe
      if (updateResult.affectedRows === 0) {
        await pool.query(`
          INSERT INTO CONFIG (\`sleutel\`, waarde, beschrijving, categorie, updated_by) 
          VALUES ('namiddag_aantal_tafels', ?, 'Aantal beschikbare tafels voor namiddag programma', 'tafels', ?)
        `, [aantalTafels.toString(), userId]);
      }
      
      console.log(`✅ Namiddag tafels geconfigureerd naar ${aantalTafels} in database`);
      
      res.json({
        success: true,
        message: `Aantal namiddag tafels succesvol ingesteld op ${aantalTafels}`,
        aantalTafels: aantalTafels,
        warning: warning,
        timestamp: new Date().toISOString()
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

  // PUT /api/tafels/project/:projectTitel/tafel/:tafelNr - Bulk project toewijzing
  async wijsProjectToeAanTafel(req, res) {
    try {
      const { projectTitel, tafelNr } = req.params;
      const userId = req.user?.id || 'system';

      console.log(`📝 Bulk assigning project "${projectTitel}" to tafel ${tafelNr}`);

      // Validatie
      if (!projectTitel || !tafelNr) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameters',
          message: 'Project titel en tafelnummer zijn vereist'
        });
      }

      const tafelNum = parseInt(tafelNr);
      if (isNaN(tafelNum) || tafelNum < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tafel number',
          message: 'Tafelnummer moet een positief getal zijn'
        });
      }

      // Check of project bestaat en hoeveel studenten
      const [projectCheck] = await pool.query(
        'SELECT COUNT(*) as count FROM STUDENT WHERE projectTitel = ?',
        [projectTitel]
      );

      if (projectCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
          message: 'Geen studenten gevonden voor dit project'
        });
      }

      const studentCount = projectCheck[0].count;

      // Bulk update alle studenten met dit project
      const [updateResult] = await pool.query(`        UPDATE STUDENT 
        SET tafelNr = ? 
        WHERE projectTitel = ?
      `, [tafelNum, projectTitel]);

      console.log(`✅ Project "${projectTitel}" assigned to tafel ${tafelNum} (${updateResult.affectedRows} studenten)`);

      res.json({
        success: true,
        message: `Project "${projectTitel}" toegewezen aan tafel ${tafelNr}`,
        projectTitel: projectTitel,
        tafelNr: tafelNum,
        studentsUpdated: updateResult.affectedRows,
        expectedStudents: studentCount,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error assigning project to tafel:', error);
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Er ging iets mis bij het toewijzen van het project'
      });
    }
  },

  // DELETE /api/tafels/project/:projectTitel - Bulk project verwijdering
  async verwijderProjectVanTafel(req, res) {
    try {
      const { projectTitel } = req.params;
      const userId = req.user?.id || 'system';

      console.log(`🗑️ Bulk removing project "${projectTitel}" from tafel`);

      // Validatie
      if (!projectTitel) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameter',
          message: 'Project titel is vereist'
        });
      }

      // Check huidige toewijzingen
      const [currentAssignments] = await pool.query(
        'SELECT COUNT(*) as count, tafelNr FROM STUDENT WHERE projectTitel = ? AND tafelNr IS NOT NULL GROUP BY tafelNr',
        [projectTitel]
      );

      if (currentAssignments.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project not assigned',
          message: 'Project is niet toegewezen aan een tafel'
        });
      }

      const currentTafel = currentAssignments[0].tafelNr;
      const studentCount = currentAssignments[0].count;      // Bulk update alle studenten van dit project (set tafelNr to NULL)
      const [updateResult] = await pool.query(`
        UPDATE STUDENT 
        SET tafelNr = NULL 
        WHERE projectTitel = ?
      `, [projectTitel]);

      console.log(`✅ Project "${projectTitel}" removed from tafel ${currentTafel} (${updateResult.affectedRows} studenten)`);

      res.json({
        success: true,
        message: `Project "${projectTitel}" verwijderd van tafel ${currentTafel}`,
        projectTitel: projectTitel,
        previousTafelNr: currentTafel,
        studentsUpdated: updateResult.affectedRows,
        expectedStudents: studentCount,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error removing project from tafel:', error);
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Er ging iets mis bij het verwijderen van het project'
      });
    }
  },

  // POST /api/tafels/project/bulk-assign - Bulk toewijzing van project aan tafel
  async bulkAssignProjectToTafel(req, res) {
    try {
      const { projectTitel, tafelNr } = req.body;
      const userId = req.user?.id || 'system';

      console.log(`📝 Bulk assigning project "${projectTitel}" to tafel ${tafelNr}`);

      // Validatie
      if (!projectTitel || !tafelNr) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameters',
          message: 'ProjectTitel en tafelnummer zijn vereist'
        });
      }

      // Valideer projectTitel is niet leeg
      if (typeof projectTitel !== 'string' || projectTitel.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Invalid project title',
          message: 'ProjectTitel mag niet leeg zijn'
        });
      }

      const tafelNum = parseInt(tafelNr);
      if (isNaN(tafelNum) || tafelNum < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tafel number',
          message: 'Tafelnummer moet een positief getal zijn'
        });
      }

      // Extra validatie: check of de tafel bestaat voor voormiddag (max 40 tafels)
      if (tafelNum > 40) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tafel number',
          message: 'Tafelnummer mag niet hoger zijn dan 40 voor voormiddag'
        });
      }

      // Zoek alle studenten met dit project
      console.log(`🔍 Searching for students with project: "${projectTitel.trim()}"`);
      const [studentsToUpdate] = await pool.query(
        'SELECT studentnummer, voornaam, achternaam, tafelNr FROM STUDENT WHERE projectTitel = ?',
        [projectTitel.trim()]
      );
      console.log(`📊 Found ${studentsToUpdate.length} students for project "${projectTitel}"`);
      if (studentsToUpdate.length > 0) {
        console.log(`📋 Students found:`, studentsToUpdate.map(s => `${s.voornaam} ${s.achternaam} (tafel: ${s.tafelNr})`));
      }

      if (studentsToUpdate.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No students found',
          message: `Geen studenten gevonden voor project "${projectTitel}"`
        });
      }

      // Check of het project al toegewezen is aan een andere tafel
      const alreadyAssigned = studentsToUpdate.filter(s => s.tafelNr && s.tafelNr !== tafelNum);
      if (alreadyAssigned.length > 0) {
        console.log(`⚠️ Project "${projectTitel}" is already assigned to tafel ${alreadyAssigned[0].tafelNr}`);
        return res.status(409).json({
          success: false,
          error: 'Project already assigned',
          message: `Project "${projectTitel}" is al toegewezen aan tafel ${alreadyAssigned[0].tafelNr}. Verwijder eerst de huidige toewijzing.`
        });
      }      // Bulk update alle studenten van dit project
      const [updateResult] = await pool.query(`
        UPDATE STUDENT 
        SET tafelNr = ? 
        WHERE projectTitel = ?
      `, [tafelNum, projectTitel.trim()]);

      console.log(`✅ Bulk assigned ${updateResult.affectedRows} students to tafel ${tafelNum}`);

      res.json({
        success: true,
        message: `Project "${projectTitel}" toegewezen aan tafel ${tafelNum}`,
        projectTitel: projectTitel,
        tafelNr: tafelNum,
        studentsUpdated: updateResult.affectedRows,
        students: studentsToUpdate.map(s => `${s.voornaam} ${s.achternaam}`),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error bulk assigning project to tafel:', error);
      
      // Verbeterde error logging
      if (error.code) {
        console.error(`Database error code: ${error.code}`);
      }
      if (error.sqlMessage) {
        console.error(`SQL error: ${error.sqlMessage}`);
      }
      
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Er ging iets mis bij het toewijzen van het project: ' + error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  // DELETE /api/tafels/project/bulk-remove - Bulk verwijdering van project van tafel
  async bulkRemoveProjectFromTafel(req, res) {
    try {
      const { projectTitel } = req.body;
      const userId = req.user?.id || 'system';

      console.log(`🗑️ Bulk removing project "${projectTitel}" from tafel`);

      // Validatie
      if (!projectTitel) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameter',
          message: 'ProjectTitel is vereist'
        });
      }

      // Valideer projectTitel is niet leeg
      if (typeof projectTitel !== 'string' || projectTitel.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Invalid project title',
          message: 'ProjectTitel mag niet leeg zijn'
        });
      }

      // Zoek alle studenten met dit project
      const [studentsToUpdate] = await pool.query(
        'SELECT studentnummer, voornaam, achternaam, tafelNr FROM STUDENT WHERE projectTitel = ?',
        [projectTitel.trim()]
      );

      if (studentsToUpdate.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No students found',
          message: `Geen studenten gevonden voor project "${projectTitel}"`
        });
      }

      const previousTafel = studentsToUpdate[0]?.tafelNr;
      
      // Check of project überhaupt toegewezen is aan een tafel
      if (!previousTafel) {
        return res.status(400).json({
          success: false,
          error: 'Project not assigned',
          message: `Project "${projectTitel}" is niet toegewezen aan een tafel`
        });
      }      // Bulk verwijder tafel toewijzing (set to NULL)
      const [updateResult] = await pool.query(`
        UPDATE STUDENT 
        SET tafelNr = NULL 
        WHERE projectTitel = ?
      `, [projectTitel.trim()]);

      console.log(`✅ Bulk removed ${updateResult.affectedRows} students from tafel ${previousTafel}`);

      res.json({
        success: true,
        message: `Project "${projectTitel}" verwijderd van tafel ${previousTafel}`,
        projectTitel: projectTitel,
        previousTafelNr: previousTafel,
        studentsUpdated: updateResult.affectedRows,
        students: studentsToUpdate.map(s => `${s.voornaam} ${s.achternaam}`),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error bulk removing project from tafel:', error);
      
      // Verbeterde error logging
      if (error.code) {
        console.error(`Database error code: ${error.code}`);
      }
      if (error.sqlMessage) {
        console.error(`SQL error: ${error.sqlMessage}`);
      }
      
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Er ging iets mis bij het verwijderen van het project: ' + error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
};

module.exports = tafelController;