// src/Server/CONTROLLERS/tafelController.js
// Controller voor tafel management en plattegrond functionaliteit

const { pool } = require('../CONFIG/database');
const Student = require('../MODELS/student');
const Bedrijf = require('../MODELS/bedrijf');

const tafelController = {

  // ===== PUBLIC ENDPOINTS =====

  // GET /api/tafels/voormiddag - Studenten aan tafels (voormiddag)
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
        ORDER BY s.tafelNr ASC
      `);

      // Groepeer per tafel
      const tafelGroepen = {};
      rows.forEach(student => {
        const tafelNr = student.tafelNr;
        if (!tafelGroepen[tafelNr]) {
          tafelGroepen[tafelNr] = {
            tafelNr: tafelNr,
            type: 'student',
            periode: 'voormiddag',
            items: []
          };
        }
        tafelGroepen[tafelNr].items.push({
          id: student.studentnummer,
          naam: `${student.voornaam} ${student.achternaam}`,
          titel: student.projectTitel,
          beschrijving: student.projectBeschrijving,
          opleiding: student.opleiding,
          opleidingsrichting: student.opleidingsrichting,
          email: student.email,
          type: 'student'
        });
      });

      res.json({
        success: true,
        data: Object.values(tafelGroepen),
        count: Object.keys(tafelGroepen).length,
        periode: 'voormiddag',
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

  // PUT /api/tafels/student/:studentnummer/tafel/:tafelNr
  async wijsStudentToeAanTafel(req, res) {
    try {
      const { studentnummer, tafelNr } = req.params;
      
      console.log(`📝 Assigning student ${studentnummer} to tafel ${tafelNr}`);

      // Controleer of student bestaat
      const student = await Student.getById(studentnummer);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      // Update student tafel nummer
      const result = await Student.update(studentnummer, { tafelNr: parseInt(tafelNr) });

      if (result === 0) {
        return res.status(404).json({
          success: false,
          error: 'Update failed',
          message: 'Tafel toewijzing mislukt'
        });
      }

      res.json({
        success: true,
        message: `Student ${student.voornaam} ${student.achternaam} toegewezen aan tafel ${tafelNr}`,
        data: {
          studentnummer,
          tafelNr: parseInt(tafelNr),
          studentNaam: `${student.voornaam} ${student.achternaam}`
        }
      });

    } catch (error) {
      console.error('❌ Error assigning student to tafel:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign student to tafel',
        message: 'Er ging iets mis bij het toewijzen van de student aan de tafel'
      });
    }
  },

  // PUT /api/tafels/bedrijf/:bedrijfsnummer/tafel/:tafelNr
  async wijsBedrijfToeAanTafel(req, res) {
    try {
      const { bedrijfsnummer, tafelNr } = req.params;
      
      console.log(`📝 Assigning bedrijf ${bedrijfsnummer} to tafel ${tafelNr}`);

      // Controleer of bedrijf bestaat
      const bedrijf = await Bedrijf.getById(bedrijfsnummer);
      if (!bedrijf) {
        return res.status(404).json({
          success: false,
          error: 'Bedrijf not found',
          message: 'Bedrijf niet gevonden'
        });
      }

      // Update bedrijf tafel nummer
      const result = await Bedrijf.update(bedrijfsnummer, { tafelNr: parseInt(tafelNr) });

      if (result === 0) {
        return res.status(404).json({
          success: false,
          error: 'Update failed',
          message: 'Tafel toewijzing mislukt'
        });
      }

      res.json({
        success: true,
        message: `Bedrijf ${bedrijf.naam} toegewezen aan tafel ${tafelNr}`,
        data: {
          bedrijfsnummer,
          tafelNr: parseInt(tafelNr),
          bedrijfNaam: bedrijf.naam
        }
      });

    } catch (error) {
      console.error('❌ Error assigning bedrijf to tafel:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign bedrijf to tafel',
        message: 'Er ging iets mis bij het toewijzen van het bedrijf aan de tafel'
      });
    }
  },

  // DELETE /api/tafels/student/:studentnummer
  async verwijderStudentVanTafel(req, res) {
    try {
      const { studentnummer } = req.params;
      
      console.log(`🗑️ Removing student ${studentnummer} from tafel`);

      const result = await Student.update(studentnummer, { tafelNr: null });

      if (result === 0) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          message: 'Student niet gevonden'
        });
      }

      res.json({
        success: true,
        message: 'Student verwijderd van tafel',
        data: { studentnummer }
      });

    } catch (error) {
      console.error('❌ Error removing student from tafel:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove student from tafel',
        message: 'Er ging iets mis bij het verwijderen van de student van de tafel'
      });
    }
  },

  // DELETE /api/tafels/bedrijf/:bedrijfsnummer
  async verwijderBedrijfVanTafel(req, res) {
    try {
      const { bedrijfsnummer } = req.params;
      
      console.log(`🗑️ Removing bedrijf ${bedrijfsnummer} from tafel`);

      const result = await Bedrijf.update(bedrijfsnummer, { tafelNr: null });

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
  }
};

module.exports = tafelController;