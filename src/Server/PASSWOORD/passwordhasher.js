const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

// Database configuratie
const dbConfig = {
  host: 'dt5.ehb.be',   
  user: 'Dummydata',
  password: 'student1',
  database: '2425PROGPROJG5' 
};

const saltRounds = 10;

const CONFIG = {
  addOrganisatoren: true,    
  addBedrijven: true,        
  addStudenten: false
};

// ORGANISATOREN DATA (5 stuks)
const organisatorenData = [
  { naam: 'Jan Devos', password: 'adminwachtwoord123' },
  { naam: 'Sarah De Vries', password: 'adminwachtwoord456' },
  { naam: 'Arthur Geslaagd', password: 'adminwachtwoord789' }
];

// BEDRIJVEN DATA
const bedrijvenData = [
  { bedrijfsnummer: 84, password: 'bedrijfswachtwoord123' },
  { bedrijfsnummer: 85, password: 'bedrijfswachtwoord456' },
  { bedrijfsnummer: 86, password: 'bedrijfswachtwoord789' },
  { bedrijfsnummer: 87, password: 'bedrijfswachtwoord101' },
  { bedrijfsnummer: 88, password: 'bedrijfswachtwoord213' },
  { bedrijfsnummer: 89, password: 'bedrijfswachtwoord141' },
  { bedrijfsnummer: 90, password: 'bedrijfswachtwoord516' },
  { bedrijfsnummer: 91, password: 'bedrijfswachtwoord171' },
  { bedrijfsnummer: 92, password: 'bedrijfswachtwoord819' },
  { bedrijfsnummer: 93, password: 'bedrijfswachtwoord202' },
  { bedrijfsnummer: 94, password: 'bedrijfswachtwoord212' },
  { bedrijfsnummer: 95, password: 'bedrijfswachtwoord223' },
  { bedrijfsnummer: 96, password: 'bedrijfswachtwoord223' },
  { bedrijfsnummer: 97, password: 'bedrijfswachtwoord223' },
  { bedrijfsnummer: 98, password: 'bedrijfswachtwoord223' },
  { bedrijfsnummer: 99, password: 'bedrijfswachtwoord223' },
  { bedrijfsnummer: 100, password: 'bedrijfswachtwoord223' }
];

// STUDENTEN DATA (later aan te passen)
let studentenData = [
  // Voeg hier handmatig studenten toe als je ze hebt:

];

// Functie om automatisch studenten te genereren
function generateStudentData(aantal, startNummer = 1, prefix = 'S') {
  const studenten = [];
  for (let i = 0; i < aantal; i++) {
    const studentNr = `${prefix}${String(startNummer + i).padStart(3, '0')}`;
    studenten.push({
      studentnummer: studentNr,
      password: `student${studentNr.toLowerCase()}`
    });
  }
  return studenten;
}


// =========================
// HELPER FUNCTIES
// =========================
async function insertOrganisatoren(connection) {
  console.log('👥 === ORGANISATOREN TOEVOEGEN ===');
  let success = 0, errors = 0;
  
  for (const organisator of organisatorenData) {
    try {
      console.log(`Verwerken organisator: ${organisator.naam}...`);
      
      const hash = await bcrypt.hash(organisator.password, saltRounds);
      
      const [result] = await connection.execute(
        'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (NULL, NULL, ?)',
        [hash]
      );
      
      console.log(`✅ ${organisator.naam} toegevoegd (ID: ${result.insertId})`);
      success++;
      
    } catch (error) {
      console.error(`❌ Fout bij ${organisator.naam}:`, error.message);
      errors++;
    }
  }
  
  return { success, errors };
}

async function insertBedrijven(connection) {
  console.log('\n🏢 === BEDRIJVEN TOEVOEGEN ===');
  let success = 0, errors = 0;
  
  for (const bedrijf of bedrijvenData) {
    try {
      console.log(`Verwerken bedrijf ${bedrijf.bedrijfsnummer}...`);
      
      const hash = await bcrypt.hash(bedrijf.password, saltRounds);
      
      const [result] = await connection.execute(
        'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (?, NULL, ?)',
        [bedrijf.bedrijfsnummer, hash]
      );
      
      console.log(`✅ Bedrijf ${bedrijf.bedrijfsnummer} toegevoegd (ID: ${result.insertId})`);
      success++;
      
    } catch (error) {
      console.error(`❌ Fout bij bedrijf ${bedrijf.bedrijfsnummer}:`, error.message);
      errors++;
    }
  }
  
  return { success, errors };
}

async function insertStudenten(connection) {
  if (studentenData.length === 0) {
    console.log('\n🎓 === GEEN STUDENTEN OM TOE TE VOEGEN ===');
    return { success: 0, errors: 0 };
  }
  
  console.log('\n🎓 === STUDENTEN TOEVOEGEN ===');
  let success = 0, errors = 0;
  
  for (const student of studentenData) {
    try {
      console.log(`Verwerken student ${student.studentnummer}...`);
      
      const hash = await bcrypt.hash(student.password, saltRounds);
      
      const [result] = await connection.execute(
        'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (NULL, ?, ?)',
        [student.studentnummer, hash]
      );
      
      console.log(`✅ Student ${student.studentnummer} toegevoegd (ID: ${result.insertId})`);
      success++;
      
    } catch (error) {
      console.error(`❌ Fout bij student ${student.studentnummer}:`, error.message);
      errors++;
    }
  }
  
  return { success, errors };
}

// =========================
// MAIN FUNCTIE
// =========================
async function insertPasswords() {
  let connection;
  
  try {
    console.log('🔗 Verbinding maken met database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Verbonden met database!\n');
    
    // Alleen AUTO_INCREMENT instellen als we organisatoren toevoegen (eerste keer)
    if (CONFIG.addOrganisatoren) {
      await connection.execute('ALTER TABLE LOGINBEHEER AUTO_INCREMENT = 1');
      console.log('⚙️  AUTO_INCREMENT ingesteld op 1\n');
    }
    
    let totalSuccess = 0;
    let totalErrors = 0;
    
    // Organisatoren toevoegen
    if (CONFIG.addOrganisatoren) {
      const result = await insertOrganisatoren(connection);
      totalSuccess += result.success;
      totalErrors += result.errors;
    } else {
      console.log('⏭️  Organisatoren overgeslagen (CONFIG.addOrganisatoren = false)');
    }
    
    // Bedrijven toevoegen
    if (CONFIG.addBedrijven) {
      const result = await insertBedrijven(connection);
      totalSuccess += result.success;
      totalErrors += result.errors;
    } else {
      console.log('⏭️  Bedrijven overgeslagen (CONFIG.addBedrijven = false)');
    }
    
    // Studenten toevoegen
    if (CONFIG.addStudenten) {
      const result = await insertStudenten(connection);
      totalSuccess += result.success;
      totalErrors += result.errors;
    } else {
      console.log('⏭️  Studenten overgeslagen (CONFIG.addStudenten = false)');
    }
    
    // Samenvatting
    console.log('\n' + '='.repeat(50));
    console.log('📊 SAMENVATTING:');
    console.log(`✅ Succesvol toegevoegd: ${totalSuccess}`);
    console.log(`❌ Fouten: ${totalErrors}`);
    if (CONFIG.addOrganisatoren) console.log(`👥 Organisatoren: ${organisatorenData.length}`);
    if (CONFIG.addBedrijven) console.log(`🏢 Bedrijven: ${bedrijvenData.length}`);
    if (CONFIG.addStudenten) console.log(`🎓 Studenten: ${studentenData.length}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('💥 Database fout:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database verbinding gesloten.');
    }
  }
}

// =========================
// HANDIGE FUNCTIES VOOR LATER
// =========================

// Functie om alleen studenten toe te voegen (voor later gebruik)
async function addStudentsOnly(studenten) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log(`🎓 Toevoegen van ${studenten.length} studenten...`);
    
    for (const student of studenten) {
      const hash = await bcrypt.hash(student.password, saltRounds);
      
      const [result] = await connection.execute(
        'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (NULL, ?, ?)',
        [student.studentnummer, hash]
      );
      
      console.log(`✅ Student ${student.studentnummer} toegevoegd (ID: ${result.insertId})`);
    }
    
  } finally {
    await connection.end();
  }
}

// Voorbeelden voor later gebruik:
// addStudentsOnly([
//   { studentnummer: 'S001', password: 'wachtwoord001' },
//   { studentnummer: 'S002', password: 'wachtwoord002' }
// ]);

// addStudentsOnly(generateStudentData(25)); // 25 studenten toevoegen

// Script uitvoeren
insertPasswords();