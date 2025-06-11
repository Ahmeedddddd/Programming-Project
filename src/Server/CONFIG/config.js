require('dotenv').config();

module.exports = {
  // Database configuratie
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || '2425PROGPROJG5',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  // Server configuratie
  server: {
    mainPort: process.env.MAIN_PORT || 8383,
    apiPort: process.env.API_PORT || 3301,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  // JWT configuratie
  jwt: {
    secret: process.env.JWT_SECRET || 'careerlaunch_secret_key',
    expiresIn: '7d'
  },
  
  // Email configuratie
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  }
};