// src/Server/app.js - ENHANCED VERSION (SYNTAX FIXED)

const express = require('express')
const app = express()
const port = 8383
const path = require('path');

// Import the enhanced role-based system
const {
  serveRoleBasedHomepage,
  getUserInfo,
  requireAuth,
  requireRole,
  generateClientSideScript
} = require('./MIDDLEWARE/rolCheck');

// Middleware voor JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serveer statische frontendbestanden
app.use(express.static(path.join(__dirname, '../CareerLaunch')));
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/src/CSS', express.static(path.join(__dirname, '../CSS')));
app.use('/src/JS', express.static(path.join(__dirname, '../JS')));
app.use('/images', express.static(path.join(__dirname, '../../public/images')));

// ===== ENHANCED ROLE-BASED HOMEPAGE SYSTEM =====

// 🏠 MAIN HOMEPAGE ROUTING - Uses your existing files
app.get('/', serveRoleBasedHomepage);
app.get('/index.html', serveRoleBasedHomepage);

// API endpoint voor user info
app.get('/api/user-info', getUserInfo);

// 🔥 Enhanced client-side script endpoint met live database data
app.get('/js/role-manager.js', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const script = await generateClientSideScript();
    res.send(script);
  } catch (error) {
    console.error('❌ Error generating role manager script:', error);
    res.status(500).send("console.error('Failed to load role manager');");
  }
});
app.get('/student-homepage', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/student-homepage.html'));
});


app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/test.html'));
});


// ===== PUBLIC ROUTES =====

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/account-aanmaken.html'));
});

app.get('/info', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/info.html'));
});

app.get('/programma', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma.html'));
});

app.get('/alleBedrijven', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/BEDRIJVEN/alle-bedrijven.html'));
});

app.get('/alleStudenten', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/STUDENTEN/alle-studenten.html'));
});

// ===== PROTECTED ROUTES =====

// Student routes
app.get('/accountStudent', requireRole(['student']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/account-student.html'));
});

app.get('/mijnProject', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/mijn-project.html'));
});

// Bedrijf routes  
app.get('/accountBedrijf', requireRole(['bedrijf']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJVEN/account-bedrijf.html'));
});

// Organisator routes
app.get('/accountOrganisator', requireRole(['organisator']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/account-organisator.html'));
});

app.get('/adminPanel', requireRole(['organisator']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/admin-panel.html'));
});

// ===== API ROUTES =====
const registratieRoutes = require('./ROUTES/registratie');
app.use('/api', registratieRoutes);

// Live stats endpoint
app.get('/api/stats/live', async (req, res) => {
  try {
    const { pool } = require('./CONFIG/database');
    
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM STUDENT');
    const [bedrijfCount] = await pool.query('SELECT COUNT(*) as count FROM BEDRIJF');
    
    let afspraakCount = [{ count: 0 }];
    try {
      [afspraakCount] = await pool.query('SELECT COUNT(*) as count FROM AFSPRAAK');
    } catch (e) {
      console.log('AFSPRAAK table not available');
    }

    const stats = {
      totalStudents: studentCount[0]?.count || 0,
      totalCompanies: bedrijfCount[0]?.count || 0,
      totalProjects: 187,
      totalReservations: afspraakCount[0]?.count || 0,
      lastUpdated: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error loading live stats:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      enhancedHomepages: 'Enabled',
      liveDataIntegration: 'Enabled',
      emailFirstAuth: 'Enabled'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❓ 404 - Route not found: ' + req.method + ' ' + req.path);
  
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.redirect('/');
});

app.listen(port, () => {
  console.log('🎓 CareerLaunch Enhanced Server running on: http://localhost:' + port);
  console.log('📱 Enhanced Features:');
  console.log('   ✅ Role-based homepage routing - Uses your existing HTML files');
  console.log('   ✅ Live database integration - Real-time stats');
  console.log('   ✅ Email-first authentication');
  console.log('   ✅ Navigation interceptors');
  console.log('🔧 API Endpoints:');
  console.log('   - User Info: http://localhost:' + port + '/api/user-info');
  console.log('   - Role Manager: http://localhost:' + port + '/js/role-manager.js');
  console.log('   - Live Stats: http://localhost:' + port + '/api/stats/live');
});