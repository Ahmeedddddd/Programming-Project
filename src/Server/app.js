// src/Server/app.js - Updated with Enhanced Project Support
// Deze server is verantwoordelijk voor het bedienen van de frontend bestanden
// ENHANCED VERSION - Role-based system with PROJECT routes

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

//ACCOUNT
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ACCOUNT/account-aanmaken.html'));
});

app.get('/change-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/ACCOUNT/change-password.html'));
});

app.get('/tarieven', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJF/tarieven.html'));
});

//INFO
app.get('/info', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/info.html'));
});

app.get('/infoStudent', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/informatie-studenten.html'));
});

app.get('/infoBedrijf', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/informatie-bedrijven.html'));
});

app.get('/infoCareerLaunch', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/informatie-career-launch.html'));
});

app.get('/contacteer', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/contacteer.html'));
});

app.get('/tarieven-info', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/INFO/tarieven-info.html'));
});

//PROGRAMMA
app.get('/programma', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma.html'));
});

app.get('/programmaVoormidag', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma-voormidag.html'));
});

app.get('/programmaNamidag', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/PROGRAMMA/programma-namidag.html'));
});

//RESULTS
  //BEDRIJVEN
app.get('/alleBedrijven', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/BEDRIJVEN/alle-bedrijven.html'));
});

// Bedrijf detail route - accepts ID as query parameter
app.get('/resultaatBedrijf', (req, res) => {
  const bedrijfId = req.query.id;
  
  if (!bedrijfId) {
    console.log('❓ No bedrijf ID provided, redirecting to alle bedrijven');
    return res.redirect('/alleBedrijven');
  }
  
  console.log('🏢 Serving bedrijf detail page for ID:', bedrijfId);
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/BEDRIJVEN/resultaat-bedrijf.html'));
});

// Alternative route for backwards compatibility
app.get('/bedrijf/:id', (req, res) => {
  const bedrijfId = req.params.id;
  console.log('🔄 Redirecting legacy bedrijf route to new format:', bedrijfId);
  res.redirect(`/resultaatBedrijf?id=${bedrijfId}`);
});

  // 🆕 ENHANCED: PROJECTEN ROUTES
app.get('/alleProjecten', (req, res) => {
  console.log('📚 Serving alle projecten page');
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/PROJECTEN/alle-projecten.html'));
});

// Project detail route - accepts ID as query parameter
app.get('/zoekbalkProjecten', (req, res) => {
  const projectId = req.query.id;
  
  if (!projectId) {
    console.log('❓ No project ID provided, redirecting to alle projecten');
    return res.redirect('/alleProjecten');
  }
  
  console.log('🚀 Serving project detail page for ID:', projectId);
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/PROJECTEN/zoekbalk-projecten.html'));
});

// Alternative route for backwards compatibility
app.get('/project/:id', (req, res) => {
  const projectId = req.params.id;
  console.log('🔄 Redirecting legacy project route to new format:', projectId);
  res.redirect(`/zoekbalkProjecten?id=${projectId}`);
});

  //RESERVATIES
app.get('/reservatie', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/RESERVATIES/reservatie.html'));
});

app.get('/gesprekkenOverzicht', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/GESPREKKEN/gesprekken-overzicht-bedrijven.html'));
});

  //STUDENTEN
app.get('/alleStudenten', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/STUDENTEN/alle-studenten.html'));
});

// Student detail route - accepts ID as query parameter
app.get('/zoekbalkStudenten', (req, res) => {
  const studentId = req.query.id;
  
  if (!studentId) {
    console.log('❓ No student ID provided, redirecting to alle studenten');
    return res.redirect('/alleStudenten');
  }
  
  console.log('🎓 Serving student detail page for ID:', studentId);
  res.sendFile(path.join(__dirname, '../../src/HTML/RESULTS/STUDENTEN/zoekbalk-studenten.html'));
});

// Alternative route for backwards compatibility
app.get('/student/:id', (req, res) => {
  const studentId = req.params.id;
  console.log('🔄 Redirecting legacy student route to new format:', studentId);
  res.redirect(`/zoekbalkStudenten?id=${studentId}`);
});

// ===== PROTECTED ROUTES =====

// Student routes
app.get('/accountStudent', requireRole(['student']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/account-student.html'));
});

app.get('/gegevensStudent', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/gegevens-student.html'));
});

app.get('/mijnProject', requireRole(['student']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/STUDENTEN/mijn-project.html'));
});

// Bedrijf routes  
app.get('/accountBedrijf', requireRole(['bedrijf']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJVEN/account-bedrijf.html'));
});

app.get('/gegevensBedrijf', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/BEDRIJVEN/gegevens-bedrijf.html'));
});

// Organisator routes
app.get('/accountOrganisator', requireRole(['organisator']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/account-organisator.html'));
});

app.get('/gegevensOrganisator', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/gegevens-organisator.html'));
});

app.get('/overzichtOrganisator', (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/overzicht-organisator.html'));
});

app.get('/adminPanel', requireRole(['organisator']), (req, res) => {
  res.sendFile(path.join(__dirname, '../../src/HTML/ORGANISATOR/admin-panel.html'));
});

// ===== API ROUTES =====
const registratieRoutes = require('./ROUTES/registratie');
app.use('/api', registratieRoutes);

// Email service endpoint - Check if SERVICES folder exists
app.post('/api/send-invoice', async (req, res) => {
  try {
    // Try to load email service if it exists
    const { sendInvoice } = require('./SERVICES/emailServ');
    await sendInvoice(req.body);
    res.status(200).json({ message: '✅ Factuur verzonden!' });
  } catch (err) {
    console.error('❌ Email service niet gevonden of fout bij verzenden:', err);
    // Return success for now, but log the error
    res.status(200).json({ message: '📝 Factuur aangemaakt (email service niet actief)' });
  }
});

// Live stats endpoint (enhanced met project stats)
app.get('/api/stats/live', async (req, res) => {
  try {
    const { pool } = require('./CONFIG/database');
    
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM STUDENT');
    const [bedrijfCount] = await pool.query('SELECT COUNT(*) as count FROM BEDRIJF');
    
    // 🆕 ENHANCED: Project count
    const [projectCount] = await pool.query(`
      SELECT COUNT(*) as count FROM STUDENT 
      WHERE projectTitel IS NOT NULL AND projectTitel != ''
    `);
    
    let afspraakCount = [{ count: 0 }];
    try {
      [afspraakCount] = await pool.query('SELECT COUNT(*) as count FROM AFSPRAAK');
    } catch (e) {
      console.log('AFSPRAAK table not available');
    }

    const stats = {
      totalStudents: studentCount[0]?.count || 0,
      totalCompanies: bedrijfCount[0]?.count || 0,
      totalProjects: projectCount[0]?.count || 0, // 🆕 ENHANCED
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
    version: '2.2.0', // 🔄 VERSION BUMP voor project functionaliteit
    features: {
      enhancedHomepages: 'Enabled',
      liveDataIntegration: 'Enabled',
      emailFirstAuth: 'Enabled',
      bedrijfDetailPages: 'Enabled',
      projectManagement: 'Enabled', // 🆕 ENHANCED FEATURE
      projectDetailPages: 'Enabled', // 🆕 ENHANCED FEATURE
      projectSearch: 'Enabled', // 🆕 ENHANCED FEATURE
      studentDetailPages: 'Enabled' // 🆕 ENHANCED FEATURE
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  console.log('❓ 404 - Route not found: ' + req.method + ' ' + req.path);
  
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Check for detail routes without ID
  if (req.path === '/resultaatBedrijf') {
    return res.redirect('/alleBedrijven');
  }
  
  if (req.path === '/zoekbalkProjecten') { // 🆕 ENHANCED
    return res.redirect('/alleProjecten');
  }
  
  if (req.path === '/zoekbalkStudenten') { // 🆕 ENHANCED
    return res.redirect('/alleStudenten');
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
  console.log('   ✅ Bedrijf detail pages with dynamic routing');
  console.log('   ✅ Project detail pages with dynamic routing'); 
  console.log('   ✅ Project management system'); 
  console.log('   ✅Student detail pages with dynamic routing'); 
  console.log('🔧 API Endpoints:');
  console.log('   - User Info: http://localhost:' + port + '/api/user-info');
  console.log('   - Role Manager: http://localhost:' + port + '/js/role-manager.js');
  console.log('   - Live Stats: http://localhost:' + port + '/api/stats/live');
  console.log('🔗 All Routes:');
  console.log('   - Homepage: http://localhost:' + port + '/');
  console.log('   - All Students: http://localhost:' + port + '/alleStudenten');
  console.log('   - Student Detail: http://localhost:' + port + '/zoekbalkStudenten?id={studentId}');
  console.log('   - All Companies: http://localhost:' + port + '/alleBedrijven');
  console.log('   - Company Detail: http://localhost:' + port + '/resultaatBedrijf?id={bedrijfId}');
  console.log('   - All Projects: http://localhost:' + port + '/alleProjecten'); 
  console.log('   - Project Detail: http://localhost:' + port + '/zoekbalkProjecten?id={projectId}');
});