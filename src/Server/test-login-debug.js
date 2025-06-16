// test-login-debug.js - Place this in your project root
// Run with: node test-login-debug.js

// ✅ FIXED: Use node-fetch v2 or dynamic import for v3
// Install: npm install node-fetch@2
let fetch;
try {
    fetch = require('node-fetch');
} catch (error) {
    // If v3 is installed, use dynamic import
    console.log('Using dynamic import for node-fetch v3...');
    fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

const API_BASE_URL = 'http://localhost:3301';
const FRONTEND_URL = 'http://localhost:8383';

// Test accounts based on your database
const TEST_ACCOUNTS = [
    {
        name: 'Sarah De Vries (Organisator)',
        email: 'sarah.devries@ehb.be',
        password: 'adminwachtwoord456',
        expectedUserType: 'organisator'
    },
    {
        name: 'BilalAICorp (Bedrijf)',
        email: 'info@bilalaicorp.be',
        password: 'bedrijfswachtwoord123',
        expectedUserType: 'bedrijf'
    },
    {
        name: 'John Doe (Student)',
        email: 'john.doew@student.ehb.be',
        password: 'studentwoord123',
        expectedUserType: 'student'
    }
];

async function testEndpoint(url, options = {}) {
    try {
        console.log(`🔍 Testing: ${url}`);
        const response = await fetch(url, options);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }
        
        if (response.ok) {
            console.log(`   ✅ Success`);
            if (typeof responseData === 'object') {
                console.log(`   Response:`, JSON.stringify(responseData, null, 2));
            } else {
                console.log(`   Response length: ${responseData.length} characters`);
            }
        } else {
            console.log(`   ❌ Failed`);
            console.log(`   Error:`, responseData);
        }
        
        return { success: response.ok, data: responseData, status: response.status };
        
    } catch (error) {
        console.log(`   ❌ Network Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testBackendConnectivity() {
    console.log('🌐 Testing Backend Connectivity');
    console.log('===============================\n');
    
    // Test health endpoint
    await testEndpoint(`${API_BASE_URL}/api/health`);
    console.log('---\n');
    
    // Test stats endpoint  
    await testEndpoint(`${API_BASE_URL}/api/stats`);
    console.log('---\n');
}

async function testLogin(account) {
    console.log(`🔐 Testing Login: ${account.name}`);
    console.log('='.repeat(50));
    
    const loginData = {
        email: account.email,
        password: account.password,
        userType: account.expectedUserType
    };
    
    console.log('📤 Sending login data:', {
        email: account.email,
        userType: account.expectedUserType,
        hasPassword: !!account.password
    });
    
    const result = await testEndpoint(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    });
    
    if (result.success && result.data.token) {
        console.log('✅ Login successful!');
        console.log(`   Token received: ${result.data.token.substring(0, 20)}...`);
        
        // Test token with user-info endpoint
        console.log('\n🔍 Testing token with user-info...');
        const userInfoResult = await testEndpoint(`${FRONTEND_URL}/api/user-info`, {
            headers: {
                'Authorization': `Bearer ${result.data.token}`
            }
        });
        
        if (userInfoResult.success) {
            console.log('✅ Token verification successful');
        } else {
            console.log('❌ Token verification failed');
        }
        
        return result.data.token;
    } else {
        console.log('❌ Login failed');
        return null;
    }
}

async function runAllTests() {
    console.log('🚀 CareerLaunch Login Debug Tests');
    console.log('==================================\n');
    
    // Test backend connectivity first
    await testBackendConnectivity();
    
    // Test each account
    for (const account of TEST_ACCOUNTS) {
        await testLogin(account);
        console.log('\n' + '='.repeat(60) + '\n');
    }
    
    console.log('🏁 All tests completed');
    console.log('\n💡 If tests fail:');
    console.log('   1. Make sure both servers are running:');
    console.log(`      - Backend: ${API_BASE_URL}`);
    console.log(`      - Frontend: ${FRONTEND_URL}`);
    console.log('   2. Check database connection');
    console.log('   3. Verify test account credentials in database');
    console.log('   4. Check browser developer tools Network tab');
}

// Test specific login format that backend expects
async function testDirectBackendFormat() {
    console.log('🔧 Testing Direct Backend Format');
    console.log('================================\n');
    
    // Test with the exact format your backend might expect
    const formats = [
        {
            name: 'Email + UserType format',
            data: {
                email: 'sarah.devries@ehb.be',
                password: 'adminwachtwoord456',
                userType: 'organisator'
            }
        },
        {
            name: 'Identifier format',
            data: {
                userType: 'organisator',
                identifier: 'sarah.devries@ehb.be',
                password: 'adminwachtwoord456'
            }
        },
        {
            name: 'Username format',
            data: {
                username: 'sarah.devries@ehb.be',
                password: 'adminwachtwoord456'
            }
        }
    ];
    
    for (const format of formats) {
        console.log(`Testing: ${format.name}`);
        await testEndpoint(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(format.data)
        });
        console.log('---\n');
    }
}

// Main execution
if (require.main === module) {
    runAllTests()
        .then(() => {
            console.log('\n🔧 Running additional format tests...\n');
            return testDirectBackendFormat();
        })
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
}