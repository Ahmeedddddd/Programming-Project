// src/Server/backend-debug.js
// Debug version to test routes one by one

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.API_PORT || 3001;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:8383', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Debug backend working',
    timestamp: new Date().toISOString()
  });
});

// Test routes one by one - uncomment one at a time to find the problematic route

console.log('🔍 Testing routes one by one...');

// 1. Test auth routes
try {
  console.log('Loading auth routes...');
  const authRoutes = require('./ROUTES/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.log('❌ Auth routes failed:', error.message);
}

// 2. Test student routes
try {
  console.log('Loading student routes...');
  const studentRoutes = require('./ROUTES/student');
  app.use('/api/student', studentRoutes);
  app.use('/api/studenten', studentRoutes);
  console.log('✅ Student routes loaded successfully');
} catch (error) {
  console.log('❌ Student routes failed:', error.message);
}

// 3. Test bedrijf routes
try {
  console.log('Loading bedrijf routes...');
  const bedrijfRoutes = require('./ROUTES/bedrijf');
  app.use('/api/bedrijf', bedrijfRoutes);
  app.use('/api/bedrijven', bedrijfRoutes);
  console.log('✅ Bedrijf routes loaded successfully');
} catch (error) {
  console.log('❌ Bedrijf routes failed:', error.message);
}

// 4. Test organisator routes
try {
  console.log('Loading organisator routes...');
  const organisatorRoutes = require('./ROUTES/organisator');
  app.use('/api/organisator', organisatorRoutes);
  console.log('✅ Organisator routes loaded successfully');
} catch (error) {
  console.log('❌ Organisator routes failed:', error.message);
}

// 5. Test reservaties routes
try {
  console.log('Loading reservaties routes...');
  const reservatieRoutes = require('./ROUTES/reservaties');
  app.use('/api/reservaties', reservatieRoutes);
  console.log('✅ Reservatie routes loaded successfully');
} catch (error) {
  console.log('❌ Reservatie routes failed:', error.message);
}

console.log('✅ All routes tested');

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Debug Backend running on: http://localhost:${port}`);
  console.log(`Test: http://localhost:${port}/api/health`);
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Route error:', error);
  res.status(500).json({ error: error.message });
});