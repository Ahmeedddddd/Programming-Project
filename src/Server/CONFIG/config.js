//src/Server/CONFIG/config.js
require('dotenv').config();

module.exports = {
  // Database configuratie
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || '2425PROGPROJG5',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  // Server configuratie
  server: {
    mainPort: process.env.MAIN_PORT || 8383,
    apiPort: process.env.API_PORT || 3301,
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost'
  },
  
  // JWT configuratie - uitgebreid
  jwt: {
    secret: process.env.JWT_SECRET || 'careerlaunch_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'CareerLaunch-EHB',
    audience: 'CareerLaunch-Users'
  },
  
  // Email configuratie - uitgebreid
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'CareerLaunch EHB <noreply@ehb.be>'
  },

  // Security configuratie
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000 // 24 hours
  },

  // Application configuratie
  app: {
    name: 'CareerLaunch EHB',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8383',
    apiUrl: process.env.API_URL || 'http://localhost:3301'
  },

  // Event configuratie
  event: {
    name: 'Student Project Showcase 2025',
    date: '2025-06-25',
    location: 'Erasmushogeschool Brussel',
    maxParticipants: 500,
    maxCompanies: 50
  },

  // File upload configuratie (for future use)
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // External APIs configuratie
  apis: {
    viesApi: {
      keyId: process.env.VIES_KEY_ID || 'D4lpbv7LaT7e',
      key: process.env.VIES_KEY || 'ZpX7MQkepQYv',
      baseUrl: 'https://viesapi.eu/api'
    }
  },

  // Logging configuratie
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logPath: process.env.LOG_PATH || './logs'
  }
};