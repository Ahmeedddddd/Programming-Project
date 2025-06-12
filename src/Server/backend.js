// src/Server/backend.js
// Complete working backend based on successful debug version

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database and config
const { pool, testConnection } = require('./CONFIG/database');
const config = require('./CONFIG/config');

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
console.log('🔍 Testing database connection...');

// ===== HEALTH & TEST ENDPOINTS =====

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'CareerLaunch Backend API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
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

// ===== LOAD ROUTES (same order as debug version that worked) =====

console.log('🔍 Loading routes...');

// 1. Load auth routes
try {
  console.log('Loading auth routes...');
  const authRoutes = require('./ROUTES/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.log('❌ Auth routes failed:', error.message);
}

// 2. Load student routes
try {
  console.log('Loading student routes...');
  const studentRoutes = require('./ROUTES/student');
  app.use('/api/student', studentRoutes);
  app.use('/api/studenten', studentRoutes);
  console.log('✅ Student routes loaded successfully');
} catch (error) {
  console.log('❌ Student routes failed:', error.message);
}

// 3. Load bedrijf routes
try {
  console.log('Loading bedrijf routes...');
  const bedrijfRoutes = require('./ROUTES/bedrijf');
  app.use('/api/bedrijf', bedrijfRoutes);
  app.use('/api/bedrijven', bedrijfRoutes);
  console.log('✅ Bedrijf routes loaded successfully');
} catch (error) {
  console.log('❌ Bedrijf routes failed:', error.message);
}

// 4. Load organisator routes
try {
  console.log('Loading organisator routes...');
  const organisatorRoutes = require('./ROUTES/organisator');
  app.use('/api/organisator', organisatorRoutes);
  console.log('✅ Organisator routes loaded successfully');
} catch (error) {
  console.log('❌ Organisator routes failed:', error.message);
}

// 5. Load reservaties routes
try {
  console.log('Loading reservaties routes...');
  const reservatieRoutes = require('./ROUTES/reservaties');
  app.use('/api/reservaties', reservatieRoutes);
  console.log('✅ Reservatie routes loaded successfully');
} catch (error) {
  console.log('❌ Reservatie routes failed:', error.message);
}

console.log('✅ All routes loaded');

// ===== ADDITIONAL ENDPOINTS =====

// Quick stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM STUDENT');
    const [bedrijfCount] = await pool.query('SELECT COUNT(*) as count FROM BEDRIJF');
    
    // Try to get reservation count, fallback to 0 if table doesn't exist
    let afspraakCount = [{ count: 0 }];
    try {
      [afspraakCount] = await pool.query('SELECT COUNT(*) as count FROM AFSPRAAK');
    } catch (e) {
      console.log('AFSPRAAK table not available:', e.message);
    }

    res.json({
      studenten: studentCount[0].count,
      bedrijven: bedrijfCount[0].count,
      afspraken: afspraakCount[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      studenten: 0,
      bedrijven: 0,
      afspraken: 0
    });
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
        'POST /api/auth/register',
        'GET /api/auth/me'
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
        'GET /api/stats'
      ]
    }
  });
});

// Global error handler - must be last
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

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
      console.log(`   Test: http://localhost:${port}/api/test`);
      console.log(`   Stats: http://localhost:${port}/api/stats`);
      console.log(`   Login: POST http://localhost:${port}/api/auth/login`);
      console.log(`   Companies: GET http://localhost:${port}/api/bedrijven`);
      console.log(`   Students: GET http://localhost:${port}/api/studenten`);
      console.log(`   Company Profile: GET http://localhost:${port}/api/bedrijf/profile`);
      console.log('\n🏗️  Architecture: MVC with Controllers, Routes, Models, Services');
      console.log(`🎓 Frontend Server: http://localhost:8383\n`);
      
      console.log('🎯 Key Feature: Bedrijven kunnen nu hun eigen gegevens bekijken!');
      console.log('   Usage: GET /api/bedrijf/profile (with JWT token)');
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