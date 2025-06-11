require('dotenv').config();
const express = require('express');
<<<<<<< Updated upstream:src/Server/database.js
const mysql = require('mysql2/promise'); // Gebruik mysql2/promise voor async/await
const bodyParser = require('body-parser');
const cors = require('cors'); // Voor cross-origin requests

=======
const mysql = require('mysql2/promise');
const cors = require('cors');
>>>>>>> Stashed changes:src/Server/CONFIG/database.js
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
<<<<<<< Updated upstream:src/Server/database.js
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
=======
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
>>>>>>> Stashed changes:src/Server/CONFIG/database.js

// Database configuratie
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mysql', // Gebruik specifieke database naam uit .env of default 'mysql'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

<<<<<<< Updated upstream:src/Server/database.js
// Maak een connection pool (beter voor performance)
=======
>>>>>>> Stashed changes:src/Server/CONFIG/database.js
const pool = mysql.createPool(dbConfig);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CareerLaunch API is working' });
});

<<<<<<< Updated upstream:src/Server/database.js
// Voorbeeld: GET endpoint om data op te halen
app.get('/api/dataStudent', async (req, res) => {
=======
// ===== STUDENT APIs =====

// Alle studenten ophalen
app.get('/api/studenten', async (req, res) => {
>>>>>>> Stashed changes:src/Server/CONFIG/database.js
  try {
    const [rows] = await pool.query(`
      SELECT 
        studentnummer,
        voornaam,
        achternaam,
        email,
        gsm_nummer,
        opleiding,
        opleidingsrichting,
        projectTitel,
        projectBeschrijving,
        overMezelf,
        huisnummer,
        straatnaam,
        gemeente,
        postcode,
        bus
      FROM STUDENT 
      ORDER BY achternaam, voornaam
    `);
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

<<<<<<< Updated upstream:src/Server/database.js
// Voorbeeld: GET endpoint om data op te halen
app.get('/api/dataBedrijf', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM your_table_name LIMIT 100');
      res.json(rows);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Database query failed' });
    }
  });

// Voorbeeld: GET endpoint om data op te halen
app.get('/api/dataProject', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM your_table_name LIMIT 100');
      res.json(rows);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Database query failed' });
    }
  });

// Voorbeeld: POST endpoint om data toe te voegen
app.post('/api/data', async (req, res) => {
  const { column1, column2 } = req.body;
  
  if (!column1 || !column2) {
=======
// Specifieke student ophalen
app.get('/api/studenten/:studentnummer', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM STUDENT WHERE studentnummer = ?',
      [req.params.studentnummer]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Student toevoegen
app.post('/api/studenten', async (req, res) => {
  const {
    studentnummer,
    voornaam,
    achternaam,
    email,
    gsm_nummer,
    opleiding,
    opleidingsrichting,
    projectTitel,
    projectBeschrijving,
    overMezelf,
    huisnummer,
    straatnaam,
    gemeente,
    postcode,
    bus
  } = req.body;

  if (!studentnummer || !voornaam || !achternaam || !email) {
    return res.status(400).json({ error: 'Missing required fields: studentnummer, voornaam, achternaam, email' });
  }

  try {
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
    
    res.status(201).json({ 
      message: 'Student created successfully',
      studentnummer: studentnummer
    });
  } catch (error) {
    console.error('Database error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Student number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create student' });
    }
  }
});

// Student bijwerken
app.put('/api/studenten/:studentnummer', async (req, res) => {
  const {
    voornaam,
    achternaam,
    email,
    gsm_nummer,
    opleiding,
    opleidingsrichting,
    projectTitel,
    projectBeschrijving,
    overMezelf,
    huisnummer,
    straatnaam,
    gemeente,
    postcode,
    bus
  } = req.body;

  try {
    const [result] = await pool.query(`
      UPDATE STUDENT SET 
        voornaam = ?, achternaam = ?, email = ?, gsm_nummer = ?,
        opleiding = ?, opleidingsrichting = ?, projectTitel = ?, 
        projectBeschrijving = ?, overMezelf = ?, huisnummer = ?,
        straatnaam = ?, gemeente = ?, postcode = ?, bus = ?
      WHERE studentnummer = ?
    `, [
      voornaam, achternaam, email, gsm_nummer, opleiding,
      opleidingsrichting, projectTitel, projectBeschrijving, overMezelf,
      huisnummer, straatnaam, gemeente, postcode, bus, req.params.studentnummer
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Student verwijderen
app.delete('/api/studenten/:studentnummer', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM STUDENT WHERE studentnummer = ?',
      [req.params.studentnummer]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// ===== BEDRIJF APIs =====

// Alle bedrijven ophalen
app.get('/api/bedrijven', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        bedrijfsnummer,
        TVA_nummer,
        naam,
        email,
        gsm_nummer,
        sector,
        huisnummer,
        straatnaam,
        gemeente,
        postcode,
        bus,
        land
      FROM BEDRIJF 
      ORDER BY naam
    `);
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Specifiek bedrijf ophalen
app.get('/api/bedrijven/:bedrijfsnummer', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM BEDRIJF WHERE bedrijfsnummer = ?',
      [req.params.bedrijfsnummer]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Bedrijf toevoegen
app.post('/api/bedrijven', async (req, res) => {
  const {
    TVA_nummer,
    naam,
    email,
    gsm_nummer,
    sector,
    huisnummer,
    straatnaam,
    gemeente,
    postcode,
    bus,
    land
  } = req.body;

  if (!naam || !email || !sector) {
    return res.status(400).json({ error: 'Missing required fields: naam, email, sector' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO BEDRIJF (
        TVA_nummer, naam, email, gsm_nummer, sector,
        huisnummer, straatnaam, gemeente, postcode, bus, land
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      TVA_nummer, naam, email, gsm_nummer, sector,
      huisnummer, straatnaam, gemeente, postcode, bus, land
    ]);
    
    res.status(201).json({ 
      message: 'Company created successfully',
      bedrijfsnummer: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Bedrijf bijwerken
app.put('/api/bedrijven/:bedrijfsnummer', async (req, res) => {
  const {
    TVA_nummer,
    naam,
    email,
    gsm_nummer,
    sector,
    huisnummer,
    straatnaam,
    gemeente,
    postcode,
    bus,
    land
  } = req.body;

  try {
    const [result] = await pool.query(`
      UPDATE BEDRIJF SET 
        TVA_nummer = ?, naam = ?, email = ?, gsm_nummer = ?,
        sector = ?, huisnummer = ?, straatnaam = ?, gemeente = ?,
        postcode = ?, bus = ?, land = ?
      WHERE bedrijfsnummer = ?
    `, [
      TVA_nummer, naam, email, gsm_nummer, sector,
      huisnummer, straatnaam, gemeente, postcode, bus, land,
      req.params.bedrijfsnummer
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Bedrijf verwijderen
app.delete('/api/bedrijven/:bedrijfsnummer', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM BEDRIJF WHERE bedrijfsnummer = ?',
      [req.params.bedrijfsnummer]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// ===== PROJECTEN APIs (vanuit STUDENT tabel) =====

// Alle projecten ophalen
app.get('/api/projecten', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        studentnummer,
        CONCAT(voornaam, ' ', achternaam) as studentNaam,
        email,
        projectTitel,
        projectBeschrijving,
        opleiding,
        opleidingsrichting
      FROM STUDENT 
      WHERE projectTitel IS NOT NULL AND projectTitel != ''
      ORDER BY projectTitel
    `);
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ===== AFSPRAKEN APIs =====

// Alle afspraken ophalen
app.get('/api/afspraken', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.afspraakId,
        a.studentnummer,
        a.bedrijfsnummer,
        a.startTijd,
        a.eindTijd,
        a.status,
        CONCAT(s.voornaam, ' ', s.achternaam) as studentNaam,
        b.naam as bedrijfNaam
      FROM AFSPRAAK a
      LEFT JOIN STUDENT s ON a.studentnummer = s.studentnummer
      LEFT JOIN BEDRIJF b ON a.bedrijfsnummer = b.bedrijfsnummer
      ORDER BY a.startTijd
    `);
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Afspraak toevoegen
app.post('/api/afspraken', async (req, res) => {
  const { studentnummer, bedrijfsnummer, startTijd, eindTijd, status = 'gepland' } = req.body;

  if (!studentnummer || !bedrijfsnummer || !startTijd || !eindTijd) {
>>>>>>> Stashed changes:src/Server/CONFIG/database.js
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO AFSPRAAK (studentnummer, bedrijfsnummer, startTijd, eindTijd, status)
      VALUES (?, ?, ?, ?, ?)
    `, [studentnummer, bedrijfsnummer, startTijd, eindTijd, status]);
    
    res.status(201).json({ 
      message: 'Appointment created successfully',
      afspraakId: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// ===== FACTUREN APIs =====

// Alle facturen ophalen
app.get('/api/facturen', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.factuurId,
        f.bedrijfsnummer,
        f.email,
        f.naam,
        f.datum,
        f.aanmaakdatum,
        b.naam as bedrijfNaam
      FROM FACTUUR f
      LEFT JOIN BEDRIJF b ON f.bedrijfsnummer = b.bedrijfsnummer
      ORDER BY f.aanmaakdatum DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Factuur toevoegen
app.post('/api/facturen', async (req, res) => {
  const { bedrijfsnummer, email, naam, datum } = req.body;

  if (!bedrijfsnummer || !email || !naam) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO FACTUUR (bedrijfsnummer, email, naam, datum, aanmaakdatum)
      VALUES (?, ?, ?, ?, NOW())
    `, [bedrijfsnummer, email, naam, datum || new Date()]);
    
    res.status(201).json({ 
      message: 'Invoice created successfully',
      factuurId: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// ===== ORGANISATOR APIs =====

// Alle organisatoren ophalen
app.get('/api/organisatoren', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        organisatorId,
        gebruikersId,
        voornaam,
        achternaam,
        email
      FROM ORGANISATOR 
      ORDER BY achternaam, voornaam
    `);
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch organizers' });
  }
});

// ===== TECHNOLOGIEËN APIs =====

// Alle technologieën ophalen
app.get('/api/technologieen', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM TECHNOLOGIE ORDER BY naam');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch technologies' });
  }
});

// ===== STATISTIEKEN APIs =====

// Dashboard statistieken
app.get('/api/statistieken', async (req, res) => {
  try {
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM STUDENT');
    const [bedrijfCount] = await pool.query('SELECT COUNT(*) as count FROM BEDRIJF');
    const [projectCount] = await pool.query(`
      SELECT COUNT(*) as count FROM STUDENT 
      WHERE projectTitel IS NOT NULL AND projectTitel != ''
    `);
    const [afspraakCount] = await pool.query('SELECT COUNT(*) as count FROM AFSPRAAK');

    res.json({
      studenten: studentCount[0].count,
      bedrijven: bedrijfCount[0].count,
      projecten: projectCount[0].count,
      afspraken: afspraakCount[0].count
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
<<<<<<< Updated upstream:src/Server/database.js
  console.log(`Server running on port ${port}`);
=======
  console.log(`CareerLaunch API Server running on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`- GET /api/studenten`);
  console.log(`- GET /api/bedrijven`);
  console.log(`- GET /api/projecten`);
  console.log(`- GET /api/afspraken`);
  console.log(`- GET /api/facturen`);
  console.log(`- GET /api/statistieken`);
>>>>>>> Stashed changes:src/Server/CONFIG/database.js
});