// test-backend.js - Test je backend auth endpoints
const { authenticateUser, findUser } = require('./src/Server/PASSWOORD/CONFIG/passwordhasher');

// Test accounts uit je database
const TEST_ACCOUNTS = [
  {
    userType: 'organisator',
    identifier: 'jan.devos@ehb.be',
    password: 'adminwachtwoord123',
    name: 'Jan Devos'
  },
  {
    userType: 'bedrijf', 
    identifier: 84, // bedrijfsnummer
    password: 'bedrijfswachtwoord123',
    name: 'BilalAICorp'
  },
  {
    userType: 'student',
    identifier: 232, // studentnummer  
    password: 'studentwoord123',
    name: 'John Doe'
  }
];

async function testAuthentication() {
  console.log('🔐 Testing Backend Authentication');
  console.log('=================================\n');
  
  for (const account of TEST_ACCOUNTS) {
    try {
      console.log(`Testing ${account.userType}: ${account.name}`);
      console.log(`Identifier: ${account.identifier}`);
      console.log(`Password: ${account.password}`);
      
      // Test find user first
      const user = await findUser(account.userType, account.identifier);
      if (!user) {
        console.error(`❌ User not found in database`);
        continue;
      }
      console.log(`✅ User found: ${user.email || user.naam || user.voornaam}`);
      
      // Test authentication
      const authResult = await authenticateUser(
        account.userType, 
        account.identifier, 
        account.password
      );
      
      if (authResult.success) {
        console.log(`✅ Authentication successful`);
        console.log(`   User Type: ${authResult.userType}`);
        console.log(`   User Data:`, authResult.user);
      } else {
        console.error(`❌ Authentication failed: ${authResult.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${account.userType}:`, error.message);
    }
    
    console.log('---\n');
  }
}

// Run tests
testAuthentication().then(() => {
  console.log('🏁 Backend authentication tests completed');
  process.exit(0);
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});