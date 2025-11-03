/**
 * Test Script for Auth Signup Implementation
 * Run with: node test-auth-signup.js
 */

const BASE_URL = 'http://localhost:3000';

async function testValidateAccessCode() {
  console.log('\n🧪 Testing Access Code Validation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/validate-access-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@snmaccounts.com',
        accessCode: 'ADMIN123'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Access code validation successful');
      console.log('   Name:', data.name);
      console.log('   Level:', data.level);
      console.log('   Organization ID:', data.organizationId);
      return true;
    } else {
      console.log('❌ Access code validation failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testInvalidAccessCode() {
  console.log('\n🧪 Testing Invalid Access Code...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/validate-access-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@snmaccounts.com',
        accessCode: 'INVALID1'
      })
    });

    const data = await response.json();

    if (!response.ok && data.error) {
      console.log('✅ Invalid code correctly rejected');
      console.log('   Error message:', data.error);
      return true;
    } else {
      console.log('❌ Invalid code was not rejected');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Auth Signup Tests');
  console.log('================================');
  console.log('Base URL:', BASE_URL);
  console.log('Make sure your dev server is running!');
  
  const results = [];
  
  results.push(await testValidateAccessCode());
  results.push(await testInvalidAccessCode());
  
  console.log('\n================================');
  console.log('📊 Test Results');
  console.log('================================');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Open http://localhost:3000/signup');
  console.log('2. Enter email: admin@snmaccounts.com');
  console.log('3. Enter code: ADMIN123');
  console.log('4. Create a password');
  console.log('5. Login and access /admin/users');
}

// Run tests
runTests().catch(console.error);
