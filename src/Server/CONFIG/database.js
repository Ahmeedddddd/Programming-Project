const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool(config.database);

// Test database connectie
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database verbinding succesvol');
    connection.release();
  } catch (error) {
    console.error('❌ Database verbinding mislukt:', error);
  }
}

module.exports = { pool, testConnection };