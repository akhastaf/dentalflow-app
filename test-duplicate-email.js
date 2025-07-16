const axios = require('axios');

async function testDuplicateEmail() {
  const baseURL = 'http://localhost:3000/api/v1/auth';
  
  const testData = {
    email: 'test@example.com',
    password: 'TestPassword123',
    first_name: 'Test',
    last_name: 'User',
    tenantName: 'Test Cabinet',
    tenantSlug: 'test-cabinet',
    tenantPhone: '+1234567890',
    tenantAddress: '123 Test St',
    tenantCity: 'Test City'
  };

  try {
    console.log('Testing registration with duplicate email...');
    
    // First registration (should succeed)
    console.log('1. First registration attempt...');
    const response1 = await axios.post(`${baseURL}/register`, testData);
    console.log('✅ First registration successful');
    
    // Second registration with same email (should fail)
    console.log('2. Second registration attempt with same email...');
    const response2 = await axios.post(`${baseURL}/register`, testData);
    console.log('❌ This should not happen - second registration succeeded');
    
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected error caught:');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      
      if (error.response.data.message.includes('Email already exists')) {
        console.log('✅ Correct error message for duplicate email');
      } else {
        console.log('❌ Unexpected error message');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Run the test
testDuplicateEmail().catch(console.error); 