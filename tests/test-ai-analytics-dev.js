// Development test script for AI Analytics (bypasses authentication)
const testAIAnalyticsDev = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing AI Analytics System (Development Mode)...\n');

  // Helper function to make API calls with mock auth
  const makeRequest = async (endpoint, data) => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Mock authentication headers for development
          'Authorization': 'Bearer mock-token',
          'X-User-ID': 'test-user-123',
          'X-Org-ID': 'test-org-456'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
      return null;
    }
  };

  // Test 1: Check if the API is accessible
  console.log('🔍 Test 1: API Accessibility');
  console.log('Testing basic endpoint access...');
  
  const result1 = await makeRequest('/api/analytics/test', {
    message: "Hello, can you help me with analytics?"
  });
  
  if (result1) {
    console.log('✅ API is accessible');
    console.log('Response type:', result1.type);
    console.log('Response:', JSON.stringify(result1, null, 2));
  } else {
    console.log('❌ API is not accessible');
  }
  console.log('');

  // Test 2: Test database connection
  console.log('🗄️ Test 2: Database Connection');
  console.log('Testing if we can query the database...');
  
  const result2 = await makeRequest('/api/analytics/test', {
    message: "How many events do we have in total?"
  });
  
  if (result2) {
    console.log('✅ Database connection working');
    console.log('Response:', JSON.stringify(result2, null, 2));
  } else {
    console.log('❌ Database connection failed');
  }
  console.log('');

  // Test 3: Test function calling
  console.log('🤖 Test 3: AI Function Calling');
  console.log('Testing if AI can generate and execute queries...');
  
  const result3 = await makeRequest('/api/analytics/test', {
    message: "Show me the first 3 events from the database"
  });
  
  if (result3) {
    console.log('✅ AI function calling working');
    console.log('Response type:', result3.type);
    if (result3.type === 'query_results') {
      console.log('Query executed successfully');
      console.log('Results count:', result3.results?.length || 0);
      console.log('First result:', result3.results?.[0]);
    }
  } else {
    console.log('❌ AI function calling failed');
  }
  console.log('');

  console.log('🎉 Development testing completed!');
  console.log('\n📋 What to check:');
  console.log('1. Prisma Studio: http://localhost:5555');
  console.log('2. Web interface: http://localhost:3000/analytics/chat');
  console.log('3. Check if new tables are visible in Prisma Studio');
  console.log('4. Verify conversation data is being saved');
};

// Run the tests
testAIAnalyticsDev().catch(console.error); 