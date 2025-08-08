console.log('🔧 Freshchat Connection Debug Test');
console.log('===================================');

// Test different Freshchat API endpoints
const testEndpoints = async (baseUrl, bearerToken) => {
  const endpoints = [
    '/account',
    '/me',
    '/user',
    '/health',
    '/status',
    '/whatsapp/templates',
    '/v2/account',
    '/v2/me',
    '/v2/user',
    '/v2/health',
    '/v2/status',
    '/v2/whatsapp/templates'
  ];

  console.log(`\n🔍 Testing Freshchat endpoints with base URL: ${baseUrl}`);
  console.log(`Bearer Token: ${bearerToken ? 'Present' : 'Missing'}`);

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS: ${endpoint} works!`);
        try {
          const data = await response.json();
          console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
        } catch (parseError) {
          console.log(`   Response: [Could not parse JSON]`);
        }
        return endpoint;
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test base URL only
  try {
    console.log(`\n📡 Testing base URL only: ${baseUrl}`);
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`   ✅ SUCCESS: Base URL works!`);
      return '/';
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  return null;
};

// Test with sample data
const testSampleData = async () => {
  console.log('\n🧪 Testing with sample Freshchat data:');
  
  // Sample Freshchat configuration
  const sampleConfig = {
    baseUrl: 'https://api.freshchat.com/v2',
    bearerToken: 'test_token_here'
  };

  const workingEndpoint = await testEndpoints(sampleConfig.baseUrl, sampleConfig.bearerToken);
  
  if (workingEndpoint) {
    console.log(`\n✅ Found working endpoint: ${workingEndpoint}`);
    console.log('💡 Update the Freshchat provider to use this endpoint for connection testing.');
  } else {
    console.log('\n❌ No working endpoints found.');
    console.log('💡 This might be because:');
    console.log('   - The API base URL is incorrect');
    console.log('   - The bearer token is invalid');
    console.log('   - The API endpoints are different');
    console.log('   - Network connectivity issues');
  }
};

// Test with actual environment variables if available
const testWithEnvVars = async () => {
  console.log('\n🔐 Testing with environment variables (if available):');
  
  // Check if we have any Freshchat environment variables
  const envVars = process.env;
  const freshchatVars = Object.keys(envVars).filter(key => 
    key.toLowerCase().includes('freshchat') || 
    key.toLowerCase().includes('whatsapp')
  );

  if (freshchatVars.length > 0) {
    console.log('Found Freshchat-related environment variables:');
    freshchatVars.forEach(key => {
      console.log(`   ${key}: ${envVars[key] ? '[SET]' : '[NOT SET]'}`);
    });
  } else {
    console.log('No Freshchat environment variables found.');
  }
};

// Run tests
const runTests = async () => {
  try {
    await testSampleData();
    await testWithEnvVars();
    
    console.log('\n🎯 Recommendations:');
    console.log('1. Check the Freshchat API documentation for the correct base URL');
    console.log('2. Verify your bearer token is valid and has the right permissions');
    console.log('3. Test the API endpoints manually using curl or Postman');
    console.log('4. Consider adding a "skip connection test" option for development');
    console.log('5. Update the testConnection() method to use the working endpoint');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

runTests(); 