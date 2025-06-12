// src/Server/CONFIG/database.js
// Database configuratie en connectie management

const mysql = require('mysql2/promise');
const config = require('./config');

// Database configuration - kan vanuit config.js of environment variables
const dbConfig = {
  host: config?.database?.host || process.env.DB_HOST || 'localhost',
  user: config?.database?.user || process.env.DB_USER || 'root',
  password: config?.database?.password || process.env.DB_PASSWORD || '',
  database: config?.database?.database || process.env.DB_NAME || 'careerlaunch',
  port: config?.database?.port || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
  // Removed invalid options: acquireTimeout, timeout, reconnect
};

// Connection pool voor betere performance
const pool = mysql.createPool(dbConfig);

// Test database connectie
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database verbinding succesvol');
    console.log(`📊 Connected to: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    
    // Test een simpele query om zeker te zijn dat alles werkt
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('🔍 Database query test:', rows[0].test === 1 ? 'OK' : 'FAILED');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('⚠️  Database verbinding mislukt:', error.message);
    console.error('🔧 Check your database configuration:');
    console.error(`   Host: ${dbConfig.host}`);
    console.error(`   Database: ${dbConfig.database}`);
    console.error(`   User: ${dbConfig.user}`);
    console.error(`   Port: ${dbConfig.port}`);
    console.error('💡 Make sure your MySQL server is running and accessible');
    return false;
  }
}

// Helper function voor query execution met error handling
async function executeQuery(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Graceful shutdown - sluit database connecties netjes af
process.on('SIGINT', async () => {
  console.log('🔌 Closing database connections...');
  try {
    await pool.end();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Closing database connections...');
  try {
    await pool.end();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
  process.exit(0);
});

module.exports = { 
  pool, 
  testConnection,
  executeQuery,
  dbConfig 
};