const { pool } = require('./src/Server/CONFIG/database');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');

    // Test 1: Check if STUDENT table exists and has data
    const [students] = await pool.query(`
      SELECT studentnummer, voornaam, achternaam, opleiding, opleidingsrichting, leerjaar
      FROM STUDENT 
      LIMIT 5
    `);
    
    console.log('📊 Students found:', students.length);
    console.log('Sample students:', students);

    // Test 2: Check distinct opleidingen
    const [opleidingen] = await pool.query(`
      SELECT DISTINCT opleiding 
      FROM STUDENT 
      WHERE opleiding IS NOT NULL AND opleiding != ''
    `);
    
    console.log('🎓 Opleidingen found:', opleidingen.map(r => r.opleiding));

    // Test 3: Check distinct opleidingsrichtingen
    const [richtingen] = await pool.query(`
      SELECT DISTINCT opleidingsrichting 
      FROM STUDENT 
      WHERE opleidingsrichting IS NOT NULL AND opleidingsrichting != ''
    `);
    
    console.log('📚 Opleidingsrichtingen found:', richtingen.map(r => r.opleidingsrichting));

    // Test 4: Check distinct jaren
    const [jaren] = await pool.query(`
      SELECT DISTINCT leerjaar 
      FROM STUDENT 
      WHERE leerjaar IS NOT NULL AND leerjaar > 0
      ORDER BY leerjaar
    `);
    
    console.log('📅 Jaren found:', jaren.map(r => r.leerjaar));

    // Test 5: Check if TAAL and TECHNOLOGIE tables exist
    try {
      const [talen] = await pool.query('SELECT COUNT(*) as count FROM TAAL');
      console.log('🗣️ TAAL table exists, count:', talen[0].count);
    } catch (e) {
      console.log('❌ TAAL table does not exist or is empty');
    }

    try {
      const [tech] = await pool.query('SELECT COUNT(*) as count FROM TECHNOLOGIE');
      console.log('💻 TECHNOLOGIE table exists, count:', tech[0].count);
    } catch (e) {
      console.log('❌ TECHNOLOGIE table does not exist or is empty');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDatabase(); 