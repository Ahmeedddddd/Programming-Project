const mysql = require('mysql2/promise');

// Test verschillende database configuraties
const testConfigs = [
  {
    name: 'Config 1 - Huidige setup',
    config: {
      host: 'localhost',
      user: '2425PROGPROJG5',
      password: 'jouw_wachtwoord_hier', // Vul je echte wachtwoord in
      database: 'Dummydata'
    }
  },
  {
    name: 'Config 2 - Zonder specifieke database',
    config: {
      host: 'localhost', 
      user: '2425PROGPROJG5',
      password: 'jouw_wachtwoord_hier', // Vul je echte wachtwoord in
      // Geen database opgegeven
    }
  }
];

async function testDatabaseConnection() {
  for (const testConfig of testConfigs) {
    console.log(`\n🧪 Testen: ${testConfig.name}`);
    console.log(`Host: ${testConfig.config.host}`);
    console.log(`User: ${testConfig.config.user}`);
    console.log(`Database: ${testConfig.config.database || 'GEEN DATABASE OPGEGEVEN'}`);
    
    try {
      const connection = await mysql.createConnection(testConfig.config);
      console.log('✅ Verbinding succesvol!');
      
      // Test welke databases beschikbaar zijn
      if (!testConfig.config.database) {
        console.log('\n📋 Beschikbare databases:');
        const [databases] = await connection.execute('SHOW DATABASES');
        databases.forEach(db => {
          console.log(`  - ${db.Database}`);
        });
      } else {
        // Test welke tabellen beschikbaar zijn
        console.log('\n📋 Beschikbare tabellen:');
        const [tables] = await connection.execute('SHOW TABLES');
        if (tables.length === 0) {
          console.log('  Geen tabellen gevonden');
        } else {
          tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
          });
        }
      }
      
      await connection.end();
      
    } catch (error) {
      console.error('❌ Verbinding mislukt:', error.message);
      
      // Specifieke foutmeldingen
      if (error.message.includes('Access denied')) {
        console.log('💡 Mogelijke oplossingen:');
        console.log('   - Controleer username en wachtwoord');
        console.log('   - Vraag je docent/admin om database toegang');
        console.log('   - Misschien heb je een andere database naam?');
      }
    }
  }
}

testDatabaseConnection();