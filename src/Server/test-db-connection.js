const { pool } = require('./CONFIG/database');

async function testDatabaseConnection() {
    try {
        console.log('🔍 Testing database connection...');
        
        // Test basic connection
        const connection = await pool.getConnection();
        console.log('✅ Database connection successful');
        
        // Test simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Basic query test:', rows[0].test === 1 ? 'PASSED' : 'FAILED');
        
        // Test STUDENT table
        const [studentRows] = await connection.execute('SELECT COUNT(*) as count FROM STUDENT');
        console.log(`✅ STUDENT table accessible: ${studentRows[0].count} students found`);
        
        // Test specific student query
        const [specificStudent] = await connection.execute(
            'SELECT studentnummer, voornaam, achternaam, projectTitel FROM STUDENT WHERE studentnummer = ?',
            ['242']
        );
        console.log(`✅ Student 242 query: ${specificStudent.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
        if (specificStudent.length > 0) {
            console.log('   Student details:', specificStudent[0]);
        }
        
        // Test TECHNOLOGIE table
        const [techRows] = await connection.execute('SELECT COUNT(*) as count FROM TECHNOLOGIE');
        console.log(`✅ TECHNOLOGIE table accessible: ${techRows[0].count} technologies found`);
        
        // Test STUDENT_TECHNOLOGIE table
        const [studentTechRows] = await connection.execute('SELECT COUNT(*) as count FROM STUDENT_TECHNOLOGIE');
        console.log(`✅ STUDENT_TECHNOLOGIE table accessible: ${studentTechRows[0].count} relationships found`);
        
        connection.release();
        console.log('✅ All database tests passed');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        await pool.end();
        console.log('🔌 Database connection closed');
    }
}

testDatabaseConnection(); 