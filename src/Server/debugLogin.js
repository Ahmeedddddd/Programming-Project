// debugLogin.js - Fixed paths for src/Server directory

const bcrypt = require('bcrypt');
const { pool } = require('./CONFIG/database'); // Fixed path

class LoginDebugger {

  async debugUser(email) {
    console.log(`🔍 DEBUGGING LOGIN FOR: ${email}`);
    console.log('='.repeat(60));

    try {
      // Check all possible user locations
      await this.checkStudentTable(email);
      await this.checkBedrijfTable(email);
      await this.checkOrganisatorTable(email);
      await this.checkLoginBeheer(email);
      
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  }

  async checkStudentTable(email) {
    console.log('\n📚 CHECKING STUDENT TABLE...');
    
    try {
      const [students] = await pool.query('SELECT * FROM STUDENT WHERE email = ?', [email]);
      
      if (students.length === 0) {
        console.log('   ❌ Not found in STUDENT table');
        return null;
      }

      const student = students[0];
      console.log('   ✅ Found in STUDENT table:');
      console.log(`      Student Number: ${student.studentnummer}`);
      console.log(`      Name: ${student.voornaam} ${student.achternaam}`);
      console.log(`      Email: ${student.email}`);

      // Check LOGINBEHEER connection
      const [loginData] = await pool.query(`
        SELECT * FROM LOGINBEHEER WHERE studentnummer = ?
      `, [student.studentnummer]);

      if (loginData.length > 0) {
        const login = loginData[0];
        console.log('   🔐 LOGINBEHEER data:');
        console.log(`      GebruikersId: ${login.gebruikersId}`);
        console.log(`      Password Hash: ${login.passwoord_hash}`);
        console.log(`      Hash Length: ${login.passwoord_hash.length}`);
        console.log(`      Hash Type: ${this.detectHashType(login.passwoord_hash)}`);
        
        return { student, login };
      } else {
        console.log('   ❌ No LOGINBEHEER record found for this student');
        return { student, login: null };
      }

    } catch (error) {
      console.log(`   ❌ Error checking student: ${error.message}`);
      return null;
    }
  }

  async checkBedrijfTable(email) {
    console.log('\n🏢 CHECKING BEDRIJF TABLE...');
    
    try {
      const [bedrijven] = await pool.query('SELECT * FROM BEDRIJF WHERE email = ?', [email]);
      
      if (bedrijven.length === 0) {
        console.log('   ❌ Not found in BEDRIJF table');
        return null;
      }

      const bedrijf = bedrijven[0];
      console.log('   ✅ Found in BEDRIJF table:');
      console.log(`      Bedrijf Number: ${bedrijf.bedrijfsnummer}`);
      console.log(`      Name: ${bedrijf.naam}`);
      console.log(`      Email: ${bedrijf.email}`);

      // Check LOGINBEHEER connection
      const [loginData] = await pool.query(`
        SELECT * FROM LOGINBEHEER WHERE bedrijfsnummer = ?
      `, [bedrijf.bedrijfsnummer]);

      if (loginData.length > 0) {
        const login = loginData[0];
        console.log('   🔐 LOGINBEHEER data:');
        console.log(`      GebruikersId: ${login.gebruikersId}`);
        console.log(`      Password Hash: ${login.passwoord_hash}`);
        console.log(`      Hash Length: ${login.passwoord_hash.length}`);
        console.log(`      Hash Type: ${this.detectHashType(login.passwoord_hash)}`);
        
        return { bedrijf, login };
      } else {
        console.log('   ❌ No LOGINBEHEER record found for this bedrijf');
        return { bedrijf, login: null };
      }

    } catch (error) {
      console.log(`   ❌ Error checking bedrijf: ${error.message}`);
      return null;
    }
  }

  async checkOrganisatorTable(email) {
    console.log('\n👔 CHECKING ORGANISATOR TABLE...');
    
    try {
      const [organisators] = await pool.query('SELECT * FROM ORGANISATOR WHERE email = ?', [email]);
      
      if (organisators.length === 0) {
        console.log('   ❌ Not found in ORGANISATOR table');
        return null;
      }

      const organisator = organisators[0];
      console.log('   ✅ Found in ORGANISATOR table:');
      console.log(`      Organisator ID: ${organisator.organisatorId}`);
      console.log(`      Name: ${organisator.voornaam} ${organisator.achternaam}`);
      console.log(`      Email: ${organisator.email}`);
      console.log(`      GebruikersId: ${organisator.gebruikersId}`);

      // Check LOGINBEHEER connection
      if (organisator.gebruikersId) {
        const [loginData] = await pool.query(`
          SELECT * FROM LOGINBEHEER WHERE gebruikersId = ?
        `, [organisator.gebruikersId]);

        if (loginData.length > 0) {
          const login = loginData[0];
          console.log('   🔐 LOGINBEHEER data:');
          console.log(`      GebruikersId: ${login.gebruikersId}`);
          console.log(`      Password Hash: ${login.passwoord_hash}`);
          console.log(`      Hash Length: ${login.passwoord_hash.length}`);
          console.log(`      Hash Type: ${this.detectHashType(login.passwoord_hash)}`);
          
          return { organisator, login };
        } else {
          console.log('   ❌ No LOGINBEHEER record found for this organisator');
          return { organisator, login: null };
        }
      } else {
        console.log('   ❌ Organisator has no gebruikersId');
        return { organisator, login: null };
      }

    } catch (error) {
      console.log(`   ❌ Error checking organisator: ${error.message}`);
      return null;
    }
  }

  async checkLoginBeheer(email) {
    console.log('\n🔐 CHECKING ALL LOGINBEHEER RECORDS...');
    
    try {
      const [allLogins] = await pool.query('SELECT * FROM LOGINBEHEER');
      
      console.log(`   📊 Total LOGINBEHEER records: ${allLogins.length}`);
      
      // Group by type
      const stats = {
        students: allLogins.filter(l => l.studentnummer && !l.bedrijfsnummer).length,
        bedrijven: allLogins.filter(l => l.bedrijfsnummer && !l.studentnummer).length,
        organisators: allLogins.filter(l => !l.studentnummer && !l.bedrijfsnummer).length
      };

      console.log(`   📚 Student logins: ${stats.students}`);
      console.log(`   🏢 Bedrijf logins: ${stats.bedrijven}`);
      console.log(`   👔 Organisator logins: ${stats.organisators}`);

      // Show password hash types
      const hashTypes = {
        bcrypt: allLogins.filter(l => l.passwoord_hash && l.passwoord_hash.startsWith('$2b$')).length,
        plainText: allLogins.filter(l => l.passwoord_hash && l.passwoord_hash.length < 50).length,
        unknown: allLogins.filter(l => l.passwoord_hash && !l.passwoord_hash.startsWith('$2b$') && l.passwoord_hash.length >= 50).length,
        empty: allLogins.filter(l => !l.passwoord_hash).length
      };

      console.log(`   🔒 Bcrypt hashes: ${hashTypes.bcrypt}`);
      console.log(`   📝 Plain text: ${hashTypes.plainText}`);
      console.log(`   ❓ Unknown format: ${hashTypes.unknown}`);
      console.log(`   ⚪ Empty/NULL: ${hashTypes.empty}`);

      // Show sample plain text passwords (if any)
      const plainTextSamples = allLogins.filter(l => l.passwoord_hash && l.passwoord_hash.length < 50).slice(0, 3);
      if (plainTextSamples.length > 0) {
        console.log('\n   📝 Plain text password samples:');
        plainTextSamples.forEach(login => {
          console.log(`      User ${login.gebruikersId}: "${login.passwoord_hash}"`);
        });
      }

    } catch (error) {
      console.log(`   ❌ Error checking LOGINBEHEER: ${error.message}`);
    }
  }

  detectHashType(hash) {
    if (!hash) return 'NULL';
    if (hash.startsWith('$2b$')) return 'bcrypt';
    if (hash.length < 50) return 'plain_text';
    if (hash.startsWith('$2a$')) return 'bcrypt_old';
    return 'unknown';
  }

  async testPassword(email, password) {
    console.log(`\n🧪 TESTING PASSWORD FOR: ${email}`);
    console.log('='.repeat(60));

    try {
      // Get all possible user records with passwords
      const queries = [
        // Student
        {
          type: 'student',
          query: `SELECT 'student' as userType, s.email, s.voornaam, s.achternaam, s.studentnummer as userId, lb.passwoord_hash, lb.gebruikersId
                  FROM STUDENT s 
                  JOIN LOGINBEHEER lb ON lb.studentnummer = s.studentnummer 
                  WHERE s.email = ?`
        },
        
        // Bedrijf
        {
          type: 'bedrijf',
          query: `SELECT 'bedrijf' as userType, b.email, b.naam as voornaam, '' as achternaam, b.bedrijfsnummer as userId, lb.passwoord_hash, lb.gebruikersId
                  FROM BEDRIJF b 
                  JOIN LOGINBEHEER lb ON lb.bedrijfsnummer = b.bedrijfsnummer 
                  WHERE b.email = ?`
        },
        
        // Organisator
        {
          type: 'organisator',
          query: `SELECT 'organisator' as userType, o.email, o.voornaam, o.achternaam, o.organisatorId as userId, lb.passwoord_hash, lb.gebruikersId
                  FROM ORGANISATOR o 
                  JOIN LOGINBEHEER lb ON lb.gebruikersId = o.gebruikersId 
                  WHERE o.email = ?`
        }
      ];

      let foundUser = false;

      for (const { type, query } of queries) {
        try {
          const [results] = await pool.query(query, [email]);
          
          if (results.length > 0) {
            foundUser = true;
            const user = results[0];
            console.log(`\n✅ Found ${user.userType.toUpperCase()} record:`);
            console.log(`   Name: ${user.voornaam} ${user.achternaam}`.trim());
            console.log(`   Email: ${user.email}`);
            console.log(`   User ID: ${user.userId}`);
            console.log(`   GebruikersId: ${user.gebruikersId}`);
            console.log(`   Hash: ${user.passwoord_hash.substring(0, 20)}... (${user.passwoord_hash.length} chars)`);
            console.log(`   Type: ${this.detectHashType(user.passwoord_hash)}`);

            // Test password
            const success = await this.testPasswordHash(password, user.passwoord_hash, user.userType);
            if (success) {
              console.log('\n🎉 THIS USER SHOULD BE ABLE TO LOGIN!');
              return true;
            }
          }
        } catch (queryError) {
          console.log(`   ⚠️ Query failed for ${type}: ${queryError.message}`);
        }
      }

      if (!foundUser) {
        console.log('\n❌ No user found with this email address');
      }

      return false;

    } catch (error) {
      console.error('❌ Password test error:', error);
      return false;
    }
  }

  async testPasswordHash(inputPassword, storedHash, userType) {
    console.log(`\n🔐 Testing password for ${userType}...`);

    try {
      // Test 1: Bcrypt comparison
      if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
        const bcryptResult = await bcrypt.compare(inputPassword, storedHash);
        console.log(`   🔒 Bcrypt test: ${bcryptResult ? '✅ PASS' : '❌ FAIL'}`);
        
        if (bcryptResult) {
          console.log('   🎉 LOGIN SHOULD WORK!');
          return true;
        }
      }

      // Test 2: Plain text comparison (for migration)
      if (storedHash.length < 50) {
        const plainResult = inputPassword === storedHash;
        console.log(`   📝 Plain text test: ${plainResult ? '✅ PASS' : '❌ FAIL'}`);
        
        if (plainResult) {
          console.log('   ⚠️ PLAIN TEXT PASSWORD - NEEDS MIGRATION');
          return true;
        }
      }

      // Test 3: Unknown format
      console.log('   ❓ Unknown password format - cannot verify');
      return false;

    } catch (error) {
      console.log(`   ❌ Password test error: ${error.message}`);
      return false;
    }
  }

  async showAllUsers() {
    console.log('\n👥 ALL USERS IN DATABASE:');
    console.log('='.repeat(60));

    try {
      // Get all students
      const [students] = await pool.query(`
        SELECT s.email, s.voornaam, s.achternaam, s.studentnummer, 'student' as type,
               lb.gebruikersId, lb.passwoord_hash
        FROM STUDENT s
        LEFT JOIN LOGINBEHEER lb ON lb.studentnummer = s.studentnummer
        ORDER BY s.email
      `);

      console.log('\n📚 STUDENTS:');
      students.forEach(s => {
        const loginStatus = s.passwoord_hash ? 
          `HAS LOGIN (${this.detectHashType(s.passwoord_hash)})` : 
          'NO LOGIN';
        console.log(`   ${s.email} | ${s.voornaam} ${s.achternaam} | ${loginStatus}`);
      });

      // Get all bedrijven  
      const [bedrijven] = await pool.query(`
        SELECT b.email, b.naam, b.bedrijfsnummer, 'bedrijf' as type,
               lb.gebruikersId, lb.passwoord_hash
        FROM BEDRIJF b
        LEFT JOIN LOGINBEHEER lb ON lb.bedrijfsnummer = b.bedrijfsnummer
        ORDER BY b.email
      `);

      console.log('\n🏢 BEDRIJVEN:');
      bedrijven.forEach(b => {
        const loginStatus = b.passwoord_hash ? 
          `HAS LOGIN (${this.detectHashType(b.passwoord_hash)})` : 
          'NO LOGIN';
        console.log(`   ${b.email} | ${b.naam} | ${loginStatus}`);
      });

      // Get all organisators
      const [organisators] = await pool.query(`
        SELECT o.email, o.voornaam, o.achternaam, o.organisatorId, 'organisator' as type,
               lb.gebruikersId, lb.passwoord_hash
        FROM ORGANISATOR o
        LEFT JOIN LOGINBEHEER lb ON lb.gebruikersId = o.gebruikersId
        ORDER BY o.email
      `);

      console.log('\n👔 ORGANISATORS:');
      organisators.forEach(o => {
        const loginStatus = o.passwoord_hash ? 
          `HAS LOGIN (${this.detectHashType(o.passwoord_hash)})` : 
          'NO LOGIN';
        console.log(`   ${o.email} | ${o.voornaam} ${o.achternaam} | ${loginStatus}`);
      });

      // Summary
      console.log('\n📊 SUMMARY:');
      console.log(`   Total Students: ${students.length} (${students.filter(s => s.passwoord_hash).length} with login)`);
      console.log(`   Total Bedrijven: ${bedrijven.length} (${bedrijven.filter(b => b.passwoord_hash).length} with login)`);
      console.log(`   Total Organisators: ${organisators.length} (${organisators.filter(o => o.passwoord_hash).length} with login)`);

    } catch (error) {
      console.error('❌ Error showing all users:', error);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const debug = new LoginDebugger();

  try {
    if (args[0] === 'user' && args[1]) {
      await debug.debugUser(args[1]);
    } else if (args[0] === 'test' && args[1] && args[2]) {
      await debug.testPassword(args[1], args[2]);
    } else if (args[0] === 'all') {
      await debug.showAllUsers();
    } else {
      console.log('🔍 LOGIN DEBUGGER');
      console.log('='.repeat(30));
      console.log('Usage:');
      console.log('  node debugLogin.js user <email>           - Debug specific user');
      console.log('  node debugLogin.js test <email> <password> - Test login');
      console.log('  node debugLogin.js all                     - Show all users');
      console.log('');
      console.log('Examples:');
      console.log('  node debugLogin.js user john.doe@student.ehb.be');
      console.log('  node debugLogin.js test john.doe@student.ehb.be password123');
      console.log('  node debugLogin.js all');
    }
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await pool.end();
  }
}

// Export for use in other scripts
module.exports = LoginDebugger;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}