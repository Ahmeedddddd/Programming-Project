// src/Server/backend.js - COMPLETE WORKING VERSION

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database and config
const { pool, testConnection } = require('./CONFIG/database');
const config = require('./CONFIG/config');
const errorHandler = require('./MIDDLEWARE/errorHandler');

const app = express();
const port = config.server?.apiPort || process.env.API_PORT || 3301;

// Middleware setup
app.use(cors({
  origin: [
    'http://localhost:8383',  // Frontend server
    'http://localhost:3000',  // React dev server (if used)
    'http://127.0.0.1:8383'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0 && process.env.NODE_ENV === 'development') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ===== HEALTH & TEST ENDPOINTS =====

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'CareerLaunch Backend API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.2.0',
    database: 'Connected'
  });
});

app.get('/api/test', async (req, res) => {
  try {
    // Test database connectivity
    const connection = await pool.getConnection();
    connection.release();
    
    res.json({ 
      message: 'Backend API Test successful!',
      timestamp: new Date().toISOString(),
      database: 'Connected ✅',
      structure: 'MVC Architecture with Authentication',
      features: [
        'User Registration (Student & Bedrijf)',
        'Authentication with JWT & Password Hashing',
        'Role-based access control',
        'Database connection pooling',
        'Error handling middleware',
        'Input validation',
        'CORS enabled',
        'Project management system',
        'Project detail pages',
        'Project search & filtering'
      ]
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// ===== MAIN DATA ENDPOINTS =====

// Stats endpoint with project count
app.get('/api/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    let studenten = 0;
    let bedrijven = 0;
    let afspraken = 0;
    let projecten = 0;
    let errors = [];

    // Count students
    try {
      const [studentResult] = await connection.query('SELECT COUNT(*) as count FROM STUDENT');
      studenten = studentResult[0].count;
    } catch (error) {
      console.error('Student count error:', error.message);
      errors.push(`Student count: ${error.message}`);
    }

    // Count companies
    try {
      const [bedrijfResult] = await connection.query('SELECT COUNT(*) as count FROM BEDRIJF');
      bedrijven = bedrijfResult[0].count;
    } catch (error) {
      console.error('Bedrijf count error:', error.message);
      errors.push(`Bedrijf count: ${error.message}`);
    }

    // Count appointments
    try {
      const [afspraakResult] = await connection.query('SELECT COUNT(*) as count FROM AFSPRAAK');
      afspraken = afspraakResult[0].count;
    } catch (error) {
      console.warn('AFSPRAAK table not available:', error.message);
    }

    // Count projects (students with projects)
    try {
      const [projectResult] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM STUDENT 
        WHERE projectTitel IS NOT NULL AND projectTitel != ''
      `);
      projecten = projectResult[0].count;
    } catch (error) {
      console.error('Project count error:', error.message);
      errors.push(`Project count: ${error.message}`);
    }

    connection.release();

    const response = {
      studenten,
      bedrijven,
      afspraken,
      projecten,
      timestamp: new Date().toISOString()
    };

    if (errors.length > 0 && process.env.NODE_ENV === 'development') {
      response.warnings = errors;
    }

    res.json(response);

  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message,
      studenten: 0,
      bedrijven: 0,
      afspraken: 0,
      projecten: 0
    });
  }
});

// Companies endpoint
app.get('/api/bedrijven', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT 
        bedrijfsnummer as id,
        bedrijfsnummer,
        naam,
        bechrijving as beschrijving,
        email,
        sector,
        gemeente,
        TVA_nummer
      FROM BEDRIJF 
      ORDER BY naam
    `);

    connection.release();
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Companies endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch companies',
      message: error.message,
      data: []
    });
  }
});

// Students endpoint - FIXED VERSION WITH TAFELNR
app.get('/api/studenten', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    console.log('🔍 [DEBUG] Fetching students with tafelNr...');

    const [rows] = await connection.query(`
      SELECT 
        studentnummer as id,
        studentnummer,
        voornaam,
        achternaam,
        email,
        opleiding,
        opleidingsrichting,
        projectTitel,
        projectBeschrijving,
        overMezelf as beschrijving,
        gemeente,
        tafelNr
      FROM STUDENT 
      ORDER BY achternaam, voornaam
    `);

    console.log(`🔍 [DEBUG] Students fetched: ${rows.length} records`);
    if (rows.length > 0) {
      console.log('🔍 [DEBUG] Sample student with tafelNr:', {
        naam: `${rows[0].voornaam} ${rows[0].achternaam}`,
        tafelNr: rows[0].tafelNr,
        projectTitel: rows[0].projectTitel
      });
    }

    connection.release();
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Students endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students',
      message: error.message,
      data: []
    });
  }
});

// Projects endpoint - FIXED VERSION WITH TAFELNR  
app.get('/api/projecten', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    console.log('🔍 [DEBUG] Fetching projects with tafelNr...');

    // Haal alle studenten met project op
    const [rows] = await connection.query(`
      SELECT 
        studentnummer as id,
        projectTitel as titel,
        projectTitel as naam,
        projectBeschrijving as beschrijving,
        voornaam,
        achternaam,
        email,
        opleiding,
        opleidingsrichting,
        tafelNr
      FROM STUDENT 
      WHERE projectTitel IS NOT NULL 
        AND projectTitel != ''
        AND projectBeschrijving IS NOT NULL 
        AND projectBeschrijving != ''
      ORDER BY projectTitel, achternaam, voornaam
    `);

    // Bundel per projectTitel
    const projectMap = new Map();
    rows.forEach(student => {
      const key = (student.titel || '').trim().toLowerCase();
      if (!projectMap.has(key)) {
        projectMap.set(key, {
          titel: student.titel,
          naam: student.naam,
          beschrijving: student.beschrijving,
          studenten: [],
          tafelNrs: new Set(),
        });
      }
      projectMap.get(key).studenten.push({
        voornaam: student.voornaam,
        achternaam: student.achternaam,
        email: student.email,
        studentnummer: student.id,
        opleiding: student.opleiding,
        opleidingsrichting: student.opleidingsrichting,
        tafelNr: student.tafelNr
      });
      if (student.tafelNr !== null && student.tafelNr !== undefined && student.tafelNr !== '' && student.tafelNr !== 'TBD') {
        projectMap.get(key).tafelNrs.add(student.tafelNr);
      }
    });

    // Maak array van projecten, bepaal tafelNr alleen als ALLE studenten hetzelfde nummer hebben
    const projects = Array.from(projectMap.values()).map(p => {
      const uniekeTafels = Array.from(p.tafelNrs);
      let tafelNr = '';
      if (uniekeTafels.length === 1 && p.studenten.every(s => s.tafelNr === uniekeTafels[0])) {
        tafelNr = uniekeTafels[0];
      }
      return {
        titel: p.titel,
        naam: p.naam,
        beschrijving: p.beschrijving,
        studenten: p.studenten,
        tafelNr: tafelNr,
        aantalStudenten: p.studenten.length
      };
    });

    console.log(`🔍 [DEBUG] Projects fetched: ${projects.length} grouped projects`);
    if (projects.length > 0) {
      console.log('🔍 [DEBUG] Sample project with tafelNr:', {
        titel: projects[0].titel,
        tafelNr: projects[0].tafelNr,
        aantalStudenten: projects[0].aantalStudenten,
        studenten: projects[0].studenten.map(s => s.voornaam + ' ' + s.achternaam).join(', ')
      });
    }

    connection.release();
    
    res.json({
      success: true,
      data: projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Projects endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      message: error.message,
      data: []
    });
  }
});

// Alternative endpoint for students with projects (individual records)
app.get('/api/studenten/projecten', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    console.log('🔍 [DEBUG] Fetching individual student-project records...');

    const [rows] = await connection.query(`
      SELECT 
        studentnummer as id,
        studentnummer,
        voornaam,
        achternaam,
        email,
        opleiding,
        opleidingsrichting,
        projectTitel,
        projectBeschrijving,
        overMezelf as beschrijving,
        gemeente,
        tafelNr
      FROM STUDENT 
      WHERE projectTitel IS NOT NULL 
        AND projectTitel != ''
      ORDER BY projectTitel, achternaam, voornaam
    `);

    console.log(`🔍 [DEBUG] Student-project records: ${rows.length}`);

    connection.release();
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Student-projects endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student projects',
      message: error.message,
      data: []
    });
  }
});

// Individual student endpoint - NEW ENDPOINT
app.get('/api/studenten/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const connection = await pool.getConnection();

    console.log(`🔍 [DEBUG] Fetching individual student: ${studentId}`);

    const [rows] = await connection.query(`
      SELECT 
        studentnummer as id,
        studentnummer,
        voornaam,
        achternaam,
        email,
        opleiding,
        opleidingsrichting,
        projectTitel,
        projectBeschrijving,
        overMezelf as beschrijving,
        gemeente,
        gsm_nummer,
        huisnummer,
        straatnaam,
        postcode,
        bus,
        cvUrl,
        githubUrl,
        linkedinUrl,
        leerjaar,
        tafelNr
      FROM STUDENT 
      WHERE studentnummer = ?
      LIMIT 1
    `, [studentId]);

    connection.release();

    if (rows.length === 0) {
      console.log(`⚠️ [DEBUG] Student ${studentId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        message: `Student met ID ${studentId} niet gevonden`
      });
    }

    const student = rows[0];
    console.log(`✅ [DEBUG] Student found: ${student.voornaam} ${student.achternaam} (tafel: ${student.tafelNr || 'N/A'})`);
    
    res.json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('Individual student endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student',
      message: error.message
    });
  }
});

// Debug endpoint to check tafel data
app.get('/api/debug/tafels', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT 
        studentnummer,
        CONCAT(voornaam, ' ', achternaam) as naam,
        projectTitel,
        tafelNr,
        CASE 
          WHEN tafelNr IS NULL THEN 'GEEN_TAFEL'
          ELSE CONCAT('TAFEL_', tafelNr)
        END as tafel_status
      FROM STUDENT 
      ORDER BY tafelNr, achternaam
    `);

    const stats = {
      total: rows.length,
      met_tafel: rows.filter(r => r.tafelNr !== null).length,
      zonder_tafel: rows.filter(r => r.tafelNr === null).length,
      unieke_tafels: [...new Set(rows.map(r => r.tafelNr).filter(t => t !== null))].length
    };

    console.log('🔍 [DEBUG] Tafel statistieken:', stats);

    connection.release();
    
    res.json({
      success: true,
      stats: stats,
      data: rows.slice(0, 10),
      message: `${stats.met_tafel}/${stats.total} studenten hebben een tafel toegewezen`
    });

  } catch (error) {
    console.error('Debug tafels endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tafel debug data',
      message: error.message
    });
  }
});

// ===== LOAD ROUTES =====

console.log('🔍 Loading application routes...');

// Load authentication routes
try {
  const authRoutes = require('./ROUTES/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Authentication routes loaded');
} catch (error) {
  console.log('❌ Authentication routes failed:', error.message);
}

// Load project routes
try {
  const projectRoutes = require('./ROUTES/project');
  app.use('/api/projecten', projectRoutes);
  console.log('✅ Project routes loaded');
} catch (error) {
  console.log('❌ Project routes failed:', error.message);
}

// Load student routes
try {
  const studentRoutes = require('./ROUTES/student');
  app.use('/api/student', studentRoutes);
  console.log('✅ Student routes loaded');
} catch (error) {
  console.log('❌ Student routes failed:', error.message);
}

// Load bedrijf routes
try {
  const bedrijfRoutes = require('./ROUTES/bedrijf');
  app.use('/api/bedrijf', bedrijfRoutes);
  console.log('✅ Bedrijf routes loaded');
} catch (error) {
  console.log('❌ Bedrijf routes failed:', error.message);
}

// Load organisator routes
try {
  const organisatorRoutes = require('./ROUTES/organisator');
  app.use('/api/organisator', organisatorRoutes);
  console.log('✅ Organisator routes loaded');
} catch (error) {
  console.log('❌ Organisator routes failed:', error.message);
}

// Load reservaties routes
try {
  const reservatieRoutes = require('./ROUTES/reservaties');
  app.use('/api/reservaties', reservatieRoutes);
  console.log('✅ Reservatie routes loaded');
} catch (error) {
  console.log('❌ Reservatie routes failed:', error.message);
}

console.log('✅ All routes loaded successfully');

// ===== ERROR HANDLING =====

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: {
      'Authentication': [
        'POST /api/auth/login',
        'POST /api/auth/register/student',
        'POST /api/auth/register/bedrijf',
        'GET /api/auth/me (requires auth)',
        'PUT /api/auth/change-password (requires auth)',
        'POST /api/auth/refresh (requires auth)'
      ],
      'Data': [
        'GET /api/stats',
        'GET /api/bedrijven',
        'GET /api/studenten', 
        'GET /api/projecten',
        'GET /api/studenten/projecten',
        'GET /api/studenten/:id',
        'GET /api/debug/tafels'
      ],
      'Projects': [
        'GET /api/projecten',
        'GET /api/projecten/:id',
        'GET /api/projecten/search/:searchTerm',
        'GET /api/projecten/category/:category',
        'GET /api/projecten/stats'
      ],
      'Companies': [
        'GET /api/bedrijven',
        'GET /api/bedrijf/profile (requires auth)',
        'PUT /api/bedrijf/profile (requires auth)',
        'GET /api/bedrijven/:id'
      ],
      'Students': [
        'GET /api/studenten', 
        'GET /api/student/profile (requires auth)',
        'PUT /api/student/profile (requires auth)',
        'GET /api/studenten/:id',
        'GET /api/studenten/projecten'
      ],
      'Reservations': [
        'GET /api/reservaties',
        'POST /api/reservaties (requires auth)',
        'PUT /api/reservaties/:id (requires auth)'
      ],
      'Utility': [
        'GET /api/health',
        'GET /api/test',
        'GET /api/stats',
        'GET /api/debug/tafels'
      ]
    }
  });
});

// Global error handler - must be last
app.use(errorHandler);

// ===== SERVER STARTUP =====

const startServer = async () => {
  try {
    // Test database connection first
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  Starting server without database connection');
    }

    app.listen(port, () => {
      console.log('\n🚀 CareerLaunch Backend API Server Started!');
      console.log(`🌐 Running on: http://localhost:${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n📡 Available API endpoints:');
      console.log(`   Health Check: http://localhost:${port}/api/health`);
      console.log(`   Database Test: http://localhost:${port}/api/test`);
      console.log(`   Stats: http://localhost:${port}/api/stats`);
      console.log(`   Debug Tafels: http://localhost:${port}/api/debug/tafels`);
      console.log('\n🔐 Authentication endpoints:');
      console.log(`   Login: POST http://localhost:${port}/api/auth/login`);
      console.log(`   Register Student: POST http://localhost:${port}/api/auth/register/student`);
      console.log(`   Register Bedrijf: POST http://localhost:${port}/api/auth/register/bedrijf`);
      console.log(`   Get Profile: GET http://localhost:${port}/api/auth/me`);
      console.log('\n📊 Data endpoints:');
      console.log(`   Companies: GET http://localhost:${port}/api/bedrijven`);
      console.log(`   Students: GET http://localhost:${port}/api/studenten`);
      console.log(`   Projects: GET http://localhost:${port}/api/projecten`);
      console.log(`   Individual Student: GET http://localhost:${port}/api/studenten/:id`);
      console.log(`   Student Projects: GET http://localhost:${port}/api/studenten/projecten`);
      console.log(`   Company Profile: GET http://localhost:${port}/api/bedrijf/profile`);
      console.log('\n🏗️  Architecture: MVC with Authentication, Password Hashing & JWT');
      console.log(`🎓 Frontend Server: http://localhost:8383\n`);
      
      console.log('🎯 Features:');
      console.log('   ✅ Student & Company Registration with Password Hashing');
      console.log('   ✅ JWT Authentication');
      console.log('   ✅ Protected Profile Endpoints');
      console.log('   ✅ Role-based Access Control');
      console.log('   ✅ Project Management System'); 
      console.log('   ✅ Project Detail Pages with Dynamic Routing'); 
      console.log('   ✅ Project Search & Filtering');
      console.log('   ✅ TafelNr Support in ALL API responses'); 
      console.log('   ✅ Individual Student Endpoint'); 
      console.log('   ✅ Debug Endpoints for Development'); 
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();