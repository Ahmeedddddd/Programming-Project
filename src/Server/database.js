// src/Server/backend.js
// Main backend server using MVC architecture

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database and config
const { pool, testConnection } = require('./CONFIG/database');
const config = require('./CONFIG/config');

// Import routes
const authRoutes = require('./ROUTES/auth');
const bedrijfRoutes = require('./ROUTES/bedrijf');
const studentRoutes = require('./ROUTES/student');
const organisatorRoutes = require('./ROUTES/organisator');
const reservatieRoutes = require('./ROUTES/reservaties');

// Import middleware  
const { authenticateToken, requireRole } = require('./MIDDLEWARE/auth');
const { errorHandler } = require('./MIDDLEWARE/errorHandler');

const app = express();
const port = config.server?.apiPort || process.env.API_PORT || 3001;

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
  next();
});

// Test database connection bij opstarten
testConnection();

// ===== HEALTH & TEST ENDPOINTS =====

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'CareerLaunch Backend API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
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
      structure: 'MVC Architecture',
      features: [
        'Authentication with JWT',
        'Role-based access control',
        'Database connection pooling',
        'Error handling middleware',
        'Input validation',
        'CORS enabled'
      ]
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// ===== API ROUTES REGISTRATION =====

// Authentication routes
app.use('/api/auth', authRoutes);

// Main entity routes
app.use('/api/bedrijf', bedrijfRoutes);
app.use('/api/bedrijven', bedrijfRoutes); // Alias for consistency
app.use('/api/student', studentRoutes);
app.use('/api/studenten', studentRoutes); // Alias for consistency
app.use('/api/organisator', organisatorRoutes);
app.use('/api/reservaties', reservatieRoutes);

// ===== QUICK DATA ENDPOINTS (for testing) =====

// Quick stats endpoint
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM STUDENT');
    const [bedrijfCount] = await pool.query('SELECT COUNT(*) as count FROM BEDRIJF');
    const [afspraakCount] = await pool.query('SELECT COUNT(*) as count FROM AFSPRAAK');

    res.json({
      studenten: studentCount[0].count,
      bedrijven: bedrijfCount[0].count,
      afspraken: afspraakCount[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

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
        'POST /api/auth/register'
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
        'GET /api/studenten/:id'
      ],
      'Reservations': [
        'GET /api/reservaties',
        'POST /api/reservaties (requires auth)',
        'PUT /api/reservaties/:id (requires auth)'
      ],
      'Utility': [
        'GET /api/health',
        'GET /api/test',
        'GET /api/stats (requires auth)'
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
      console.log(`   Test: http://localhost:${port}/api/test`);
      console.log(`   Login: POST http://localhost:${port}/api/auth/login`);
      console.log(`   Companies: GET http://localhost:${port}/api/bedrijven`);
      console.log(`   Students: GET http://localhost:${port}/api/studenten`);
      console.log(`   Company Profile: GET http://localhost:${port}/api/bedrijf/profile`);
      console.log('\n🏗️  Architecture: MVC with Controllers, Routes, Models, Services');
      console.log(`🎓 Frontend Server: http://localhost:8383\n`);
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