// test-db.js - Database connection test
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    console.log('Host:', process.env.DB_HOST || 'dt5.ehb.be');
    console.log('Database:', process.env.DB_NAME || 'CareerLaunch Database');
    console.log('User:', process.env.DB_USER || '2425PROGPROJG5');
    console.log('Port:', process.env.DB_PORT || 3306);
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'dt5.ehb.be',
            user: process.env.DB_USER || '2425PROGPROJG5',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'CareerLaunch Database',
            port: process.env.DB_PORT || 3306,
            connectTimeout: 10000, // 10 seconds
            timeout: 10000
        });
        
        console.log('✅ Database connected successfully!');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Query test successful:', rows);
        
        await connection.end();
        console.log('✅ Connection closed');
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
    }
}

testDatabaseConnection();