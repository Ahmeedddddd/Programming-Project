// src/Server/app.js
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
// Deze server is verantwoordelijk voor het bedienen van de frontend bestanden
=======
>>>>>>> Stashed changes

>>>>>>> Stashed changes
const express = require('express')
const app = express()
const port = 8383
const path = require('path');

<<<<<<< Updated upstream
<<<<<<< Updated upstream
//Import the enhanced role-based system with requireRole
const {
  serveRoleBasedHomepage,
  serveRoleBasedAccountPage,
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
=======
// Import the enhanced role-based system
const {
  serveRoleBasedHomepage,
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  getUserInfo,
  requireAuth,
  requireRole,
  generateClientSideScript
} = require('./MIDDLEWARE/rolCheck');

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
// Middleware voor JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serveer statische frontendbestanden
app.use(express.static(path.join(__dirname, '../CareerLaunch')));
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/src/CSS', express.static(path.join(__dirname, '../CSS')));
app.use('/src/JS', express.static(path.join(__dirname, '../JS')));
app.use('/images', express.static(path.join(__dirname, '../../public/images')));

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// ===== ENHANCED ROLE-BASED ROUTES =====

// API endpoint voor user info (gebruikt door client-side script)
app.get('/api/user-info', getUserInfo);

// 🔥 Enhanced client-side script endpoint met caching
app.get('/js/role-manager.js', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const script = await generateClientSideScript();
    res.send(script);
  } catch (error) {
    console.error('❌ Error generating role manager script:', error);
    res.status(500).send(`
      console.error('Failed to load role manager:', '${error.message}');
      // Emergency fallback
      window.roleManager = {
        getCurrentUser: () => ({ isLoggedIn: false, userType: 'guest' }),
        isLoggedIn: () => false,
        getUserType: () => 'guest'
      };
    `);
  }
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
>>>>>>> Stashed changes
});

// 🔥 NEW: API endpoints voor enhanced features
app.get('/api/stats/public', async (req, res) => {
  try {
    const stats = {
      projectCount: 187,
      eventDate: '2025-03-13',
      location: 'Erasmus Hogeschool Brussels'
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error loading public stats:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

<<<<<<< Updated upstream
// ✅ FIXED: Admin dashboard stats (organisator only)
app.get('/api/admin/dashboard-stats', requireRole(['organisator']), async (req, res) => {
  try {
    const stats = {
      students: 267,
      companies: 91,
      meetings: 1247,
      projects: 187,
      totalUsers: 358,
      studentGrowth: 15,
      companyGrowth: 3,
      todayMeetings: 156,
      projectStatus: 'Alle goedgekeurd'
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error loading admin stats:', error);
    res.status(500).json({ error: 'Failed to load admin statistics' });
  }
});

// ✅ FIXED: Recent activity voor admin (organisator only)
app.get('/api/admin/recent-activity', requireRole(['organisator']), async (req, res) => {
  try {
    const activities = [
      {
        type: 'registration',
        title: 'Nieuwe Registratie',
        description: '<strong>TechCorp Solutions</strong> heeft zich geregistreerd',
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      },
      {
        type: 'meeting',
        title: 'Gesprek Gepland',
        description: '<strong>John Doe</strong> ↔ <strong>InnovateTech</strong>',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        type: 'project',
        title: 'Project Geüpdatet',
        description: '<strong>Elina V.</strong> heeft "SecureCloudGuard" bijgewerkt',
        timestamp: new Date(Date.now() - 12 * 60 * 1000)
      },
      {
        type: 'approval',
        title: 'Account Goedgekeurd',
        description: '<strong>CloudExperts</strong> bedrijfaccount geactiveerd',
        timestamp: new Date(Date.now() - 18 * 60 * 1000)
      }
    ];
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error loading recent activity:', error);
    res.status(500).json({ error: 'Failed to load recent activity' });
  }
});

// ===== HOMEPAGE ROUTING =====
app.get('/', serveRoleBasedHomepage);
app.get('/index.html', serveRoleBasedHomepage);

// ===== ACCOUNT ROUTING =====
app.get('/account', serveRoleBasedAccountPage);

// ===== REST OF YOUR ROUTES =====
=======
//ACCOUNT
=======
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

// ===== PUBLIC ROUTES =====

>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/account-aanmaken.html'));
});

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// ✅ FIXED: Bedrijf routes with correct role checking
app.get('/accountBedrijf', requireRole(['bedrijf']), (req, res) => {
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
//BEDRIJVEN
app.get('/accountBedrijf', (req, res) => {
>>>>>>> Stashed changes
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJVEN/account-bedrijf.html'));
});

// ✅ FIXED: Student routes with correct role checking  
app.get('/accountStudent', requireRole(['student']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/account-student.html'));
});

<<<<<<< Updated upstream
app.get('/mijnProject', requireRole(['student']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/mijn-project.html'));
});

// ✅ FIXED: Organisator routes with correct role checking
app.get('/accountOrganisator', requireRole(['organisator']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/account-organisator.html'));
});

app.get('/adminPanel', requireRole(['organisator']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/admin-panel.html'));
});

app.get('/overzichtOrganisator', requireRole(['organisator']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/overzicht-organisator.html'));
});

// Public routes (unchanged)
=======
//INFO
=======
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// ===== API ROUTES =====
=======
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
app.get('/zoekbalkStudenten', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/STUDENTEN/zoekbalk-studenten.html'));
});

//STUDENTEN
app.get('/accountStudent', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/account-student.html'));
});

app.get('/gegevensStudent', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/gegevens-student.html'));
});

app.get('/mijnProject', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/mijn-project.html'));
});

app.get('/change-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/ACCOUNT/change-password.html'));
});

>>>>>>> Stashed changes
const registratieRoutes = require('./ROUTES/registratie');
app.use('/api', registratieRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❓ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
<<<<<<< Updated upstream
  console.log(`🎓 CareerLaunch Enhanced Server running on: http://localhost:${port}`);
  console.log(`📱 Enhanced Features:`);
  console.log(`   ✅ Role-based homepage routing with live data`);
  console.log(`   ✅ Dynamic navigation based on user type`);
  console.log(`   ✅ Protected routes with role-based authentication`);
  console.log(`   ✅ Client-side role management with backend integration`);
  console.log(`🔧 API Endpoints:`);
  console.log(`   - User Info: http://localhost:${port}/api/user-info`);
  console.log(`   - Role Manager: http://localhost:${port}/js/role-manager.js`);
  console.log(`   - Health Check: http://localhost:${port}/api/health`);
=======
  console.log(`🎓 CareerLaunch Frontend Server running on: http://localhost:${port}`);
  console.log(`📱 Available pages:`);
  console.log(`   - Home: http://localhost:${port}/`);
  console.log(`   - Login: http://localhost:${port}/login`);
  console.log(`   - Admin Panel: http://localhost:${port}/adminPanel`);
  console.log(`   - All Students: http://localhost:${port}/alleStudenten`);
  console.log(`   - All Companies: http://localhost:${port}/alleBedrijven`);
=======
// ===== PROTECTED ROUTES =====

// Student routes
app.get('/accountStudent', requireRole(['student']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/account-student.html'));
});

app.get('/mijnProject', requireRole(['student']), (req, res) => {
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
>>>>>>> Stashed changes
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
});