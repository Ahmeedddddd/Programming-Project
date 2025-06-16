// migrate-passwords.js
// Script om bestaande plain text wachtwoorden te hashen
// Gebruikt de nieuwe password hasher en database setup


const { pool } = require('../CONFIG/database');
const { hashPassword, hashExistingPasswords } = require('./CONFIG/passwordhasher');
// Configuratie
const CONFIG = {
  hashExistingPasswords: true,  //true om bestaande passwords te hashen
  addNewUsers: false,            //true om nieuwe users toe te voegen
  testAuthentication: true     //true om login te testen
};

// Data voor nieuwe gebruikers
const NEW_USERS_DATA = {
  organisatoren: [
    { email: 'jan.devos@ehb.be', password: 'AdminPass123!' },
    { email: 'sarah.devries@ehb.be', password: 'AdminPass456!' },
    { email: 'arthur.geslaagd@ehb.be', password: 'AdminPass789!' }
  ],
  
  bedrijven: [
    { bedrijfsnummer: 84, password: 'BedrijfPass123!' },
    { bedrijfsnummer: 85, password: 'BedrijfPass456!' },
    { bedrijfsnummer: 86, password: 'BedrijfPass789!' }
    // Voeg meer bedrijven toe als nodig
  ],
  
  studenten: [
    { studentnummer: 232, password: 'StudentPass123!' },
    { studentnummer: 233, password: 'StudentPass456!' },
    { studentnummer: 234, password: 'StudentPass789!' }
    // Voeg meer studenten toe als nodig
  ]
};


// NIEUWE GEBRUIKERS TOEVOEGEN
async function addOrganisatoren(organisatoren) {
  console.log('\n👥 === ORGANISATOREN TOEVOEGEN ===');
  let success = 0, errors = 0;
  
  for (const org of organisatoren) {
    try {
      console.log(`Verwerken organisator: ${org.email}...`);
      
      // Check of organisator bestaat in ORGANISATOR tabel
      const [orgCheck] = await pool.execute(
        'SELECT organisatorId FROM ORGANISATOR WHERE email = ?',
        [org.email]
      );
      
      if (orgCheck.length === 0) {
        console.log(`⚠️  Organisator ${org.email} niet gevonden in ORGANISATOR tabel`);
        errors++;
        continue;
      }
      
      // Check of al login credentials heeft
      const [loginCheck] = await pool.execute(
        'SELECT l.gebruikersId FROM LOGINBEHEER l INNER JOIN ORGANISATOR o ON l.gebruikersId = o.gebruikersId WHERE o.email = ?',
        [org.email]
      );
      
      if (loginCheck.length > 0) {
        console.log(`⏭️  Organisator ${org.email} heeft al login credentials`);
        continue;
      }
      
      // Hash wachtwoord en voeg toe
      const hashedPassword = await hashPassword(org.password);
      
      // Insert in LOGINBEHEER
      const [result] = await pool.execute(
        'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (NULL, NULL, ?)',
        [hashedPassword]
      );
      
      // Update ORGANISATOR met gebruikersId
      await pool.execute(
        'UPDATE ORGANISATOR SET gebruikersId = ? WHERE email = ?',
        [result.insertId, org.email]
      );
      
      console.log(`✅ ${org.email} toegevoegd (Login ID: ${result.insertId})`);
      success++;
      
    } catch (error) {
      console.error(`❌ Fout bij ${org.email}:`, error.message);
      errors++;
    }
  }
  
  return { success, errors };
}

async function addBedrijven(bedrijven) {
  console.log('\n🏢 === BEDRIJVEN TOEVOEGEN ===');
  let success = 0, errors = 0;
  
  for (const bedrijf of bedrijven) {
    try {
      console.log(`Verwerken bedrijf ${bedrijf.bedrijfsnummer}...`);
      
      // Check of bedrijf bestaat
      const [bedrijfCheck] = await pool.execute(
        'SELECT bedrijfsnummer FROM BEDRIJF WHERE bedrijfsnummer = ?',
        [bedrijf.bedrijfsnummer]
      );
      
      if (bedrijfCheck.length === 0) {
        console.log(`⚠️  Bedrijf ${bedrijf.bedrijfsnummer} niet gevonden in BEDRIJF tabel`);
        errors++;
        continue;
      }
      
      // Check of al login credentials heeft
      const [loginCheck] = await pool.execute(
        'SELECT gebruikersId FROM LOGINBEHEER WHERE bedrijfsnummer = ?',
        [bedrijf.bedrijfsnummer]
      );
      
      if (loginCheck.length > 0) {
        console.log(`⏭️  Bedrijf ${bedrijf.bedrijfsnummer} heeft al login credentials`);
        continue;
      }
      
      // Hash wachtwoord en voeg toe
      const hashedPassword = await hashPassword(bedrijf.password);
      
      const [result] = await pool.execute(
        'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (?, NULL, ?)',
        [bedrijf.bedrijfsnummer, hashedPassword]
      );
      
      console.log(`✅ Bedrijf ${bedrijf.bedrijfsnummer} toegevoegd (Login ID: ${result.insertId})`);
      success++;
      
    } catch (error) {
      console.error(`❌ Fout bij bedrijf ${bedrijf.bedrijfsnummer}:`, error.message);
      errors++;
    }
  }
  
  return { success, errors };
}

async function addStudenten(studenten) {
  console.log('\n🎓 === STUDENTEN TOEVOEGEN ===');
  let success = 0, errors = 0;
  
  for (const student of studenten) {
    try {
      console.log(`Verwerken student ${student.studentnummer}...`);
      
      // Check of student bestaat
      const [studentCheck] = await pool.execute(
        'SELECT studentnummer FROM STUDENT WHERE studentnummer = ?',
        [student.studentnummer]
      );
      
      if (studentCheck.length === 0) {
        console.log(`⚠️  Student ${student.studentnummer} niet gevonden in STUDENT tabel`);
        errors++;
        continue;
      }
      
      // Check of al login credentials heeft
      const [loginCheck] = await pool.execute(
        'SELECT gebruikersId FROM LOGINBEHEER WHERE studentnummer = ?',
        [student.studentnummer]
      );
      
      if (loginCheck.length > 0) {
        console.log(`⏭️  Student ${student.studentnummer} heeft al login credentials`);
        continue;
      }
      
      // Hash wachtwoord en voeg toe
      const hashedPassword = await hashPassword(student.password);
      
      const [result] = await pool.execute(
        'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (NULL, ?, ?)',
        [student.studentnummer, hashedPassword]
      );
      
      console.log(`✅ Student ${student.studentnummer} toegevoegd (Login ID: ${result.insertId})`);
      success++;
      
    } catch (error) {
      console.error(`❌ Fout bij student ${student.studentnummer}:`, error.message);
      errors++;
    }
  }
  
  return { success, errors };
}


// AUTHENTICATIE TESTEN
async function testUserAuthentication() {
  console.log('\n🔐 === AUTHENTICATIE TESTEN ===');
  
  const { authenticateUser } = require('./CONFIG/passwordhasher');
  
  // Test cases
  const testCases = [
    { type: 'organisator', id: 'jan.devos@ehb.be', password: 'AdminPass123!' },
    { type: 'bedrijf', id: 84, password: 'BedrijfPass123!' },
    { type: 'student', id: 232, password: 'StudentPass123!' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing ${testCase.type}: ${testCase.id}...`);
      
      const result = await authenticateUser(testCase.type, testCase.id, testCase.password);
      
      if (result.success) {
        console.log(`✅ ${testCase.type} ${testCase.id}: Login succesvol`);
        console.log(`   User data:`, {
          id: result.user.gebruikersId,
          type: result.userType,
          name: result.user.naam || `${result.user.voornaam} ${result.user.achternaam}` || 'N/A'
        });
      } else {
        console.log(`❌ ${testCase.type} ${testCase.id}: ${result.message}`);
      }
      
    } catch (error) {
      console.error(`💥 Error testing ${testCase.type} ${testCase.id}:`, error.message);
    }
  }
}


// DATABASE STATUS CHECK
async function checkDatabaseStatus() {
  try {
    console.log('📊 === DATABASE STATUS ===');
    
    // Count records in each table
    const [organisatoren] = await pool.execute('SELECT COUNT(*) as count FROM ORGANISATOR');
    const [bedrijven] = await pool.execute('SELECT COUNT(*) as count FROM BEDRIJF');
    const [studenten] = await pool.execute('SELECT COUNT(*) as count FROM STUDENT');
    const [loginRecords] = await pool.execute('SELECT COUNT(*) as count FROM LOGINBEHEER');
    
    console.log(`👥 Organisatoren: ${organisatoren[0].count}`);
    console.log(`🏢 Bedrijven: ${bedrijven[0].count}`);
    console.log(`🎓 Studenten: ${studenten[0].count}`);
    console.log(`🔐 Login records: ${loginRecords[0].count}`);
    
    // Check voor plain text passwords
    const [plainPasswords] = await pool.execute(
      'SELECT COUNT(*) as count FROM LOGINBEHEER WHERE LENGTH(passwoord_hash) < 50'
    );
    
    if (plainPasswords[0].count > 0) {
      console.log(`⚠️  Gevonden ${plainPasswords[0].count} plain text wachtwoorden`);
    } else {
      console.log(`✅ Alle wachtwoorden zijn gehashed`);
    }
    
  } catch (error) {
    console.error('Error checking database status:', error.message);
  }
}


// MAIN FUNCTIE
async function runMigration() {
  try {
    console.log('🚀 Starting password migration...\n');
    
    // Check database status
    await checkDatabaseStatus();
    
    let totalSuccess = 0;
    let totalErrors = 0;
    
    // Hash bestaande plain text passwords
    if (CONFIG.hashExistingPasswords) {
      console.log('\n🔒 Hashing existing plain text passwords...');
      const result = await hashExistingPasswords();
      totalSuccess += result.success;
      totalErrors += result.errors;
    }
    
    // Voeg nieuwe gebruikers toe
    if (CONFIG.addNewUsers) {
      const orgResult = await addOrganisatoren(NEW_USERS_DATA.organisatoren);
      const bedResult = await addBedrijven(NEW_USERS_DATA.bedrijven);
      const studResult = await addStudenten(NEW_USERS_DATA.studenten);
      
      totalSuccess += orgResult.success + bedResult.success + studResult.success;
      totalErrors += orgResult.errors + bedResult.errors + studResult.errors;
    }
    
    // Test authenticatie
    if (CONFIG.testAuthentication) {
      await testUserAuthentication();
    }
    
    // Final status
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SAMENVATTING:');
    console.log(`✅ Succesvol verwerkt: ${totalSuccess}`);
    console.log(`❌ Fouten: ${totalErrors}`);
    console.log('='.repeat(50));
    
    await checkDatabaseStatus();
    
  } catch (error) {
    console.error('💥 Migration error:', error.message);
  } finally {
    // Sluit database connectie
    await pool.end();
    console.log('🔌 Database connectie gesloten.');
  }
}


// UTILITY FUNCTIES
// Genereer random wachtwoorden voor bulk import
function generateBulkPasswords(userType, startId, count) {
  const { generateStrongPassword } = require('./CONFIG/passwordhasher');
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const id = startId + i;
    users.push({
      [userType === 'organisator' ? 'email' : userType === 'bedrijf' ? 'bedrijfsnummer' : 'studentnummer']: 
        userType === 'organisator' ? `user${id}@ehb.be` : id,
      password: generateStrongPassword(12)
    });
  }
  
  return users;
}

// Export voor gebruik in andere scripts
module.exports = {
  runMigration,
  addOrganisatoren,
  addBedrijven,
  addStudenten,
  testUserAuthentication,
  checkDatabaseStatus,
  generateBulkPasswords
};

// Run script als het direct uitgevoerd wordt
if (require.main === module) {
  runMigration();
}