// Test script for AI Analytics functionality
const testAIAnalytics = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing AI Analytics System...\n');

  // Helper function to make API calls
  const makeRequest = async (endpoint, data) => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
      return null;
    }
  };

  // Test 1: Basic analytics query
  console.log('📊 Test 1: Basic Analytics Query');
  console.log('Query: "Show me the top 5 users by event count"');
  
  const result1 = await makeRequest('/api/analytics/chat', {
    message: "Show me the top 5 users by event count"
  });
  
  if (result1) {
    console.log('✅ Response received');
    console.log('Type:', result1.type);
    if (result1.type === 'query_results') {
      console.log('Results count:', result1.results?.length || 0);
      console.log('Description:', result1.description);
      console.log('Suggested actions:', result1.suggested_actions);
    } else if (result1.type === 'text_response') {
      console.log('Content:', result1.content);
    }
  }
  console.log('');

  // Test 2: User segment creation
  console.log('👥 Test 2: User Segment Creation');
  console.log('Query: "Create a segment of users who had events in the last 7 days"');
  
  const result2 = await makeRequest('/api/analytics/chat', {
    message: "Create a segment of users who had events in the last 7 days"
  });
  
  if (result2) {
    console.log('✅ Response received');
    console.log('Type:', result2.type);
    if (result2.type === 'segment_created') {
      console.log('Segment ID:', result2.segment?.id);
      console.log('Segment Name:', result2.segment?.name);
      console.log('Description:', result2.description);
    }
  }
  console.log('');

  // Test 3: Campaign creation
  console.log('📧 Test 3: Campaign Creation');
  console.log('Query: "Create a campaign to re-engage users with a special offer"');
  
  const result3 = await makeRequest('/api/analytics/chat', {
    message: "Create a campaign to re-engage users with a special offer"
  });
  
  if (result3) {
    console.log('✅ Response received');
    console.log('Type:', result3.type);
    if (result3.type === 'campaign_created') {
      console.log('Campaign ID:', result3.campaign?.id);
      console.log('Campaign Name:', result3.campaign?.name);
      console.log('Status:', result3.campaign?.status);
      console.log('Description:', result3.description);
    }
  }
  console.log('');

  // Test 4: Complex analytics query
  console.log('📈 Test 4: Complex Analytics Query');
  console.log('Query: "Show me event trends over the last 30 days by category"');
  
  const result4 = await makeRequest('/api/analytics/chat', {
    message: "Show me event trends over the last 30 days by category"
  });
  
  if (result4) {
    console.log('✅ Response received');
    console.log('Type:', result4.type);
    if (result4.type === 'query_results') {
      console.log('Results count:', result4.results?.length || 0);
      console.log('Description:', result4.description);
    }
  }
  console.log('');

  // Test 5: Error handling (malicious query)
  console.log('🛡️ Test 5: Security Test');
  console.log('Query: "DROP TABLE Event" (should be blocked)');
  
  const result5 = await makeRequest('/api/analytics/chat', {
    message: "DROP TABLE Event"
  });
  
  if (result5) {
    console.log('✅ Response received');
    console.log('Type:', result5.type);
    if (result5.type === 'error') {
      console.log('✅ Security test passed - malicious query blocked');
    } else {
      console.log('⚠️ Security concern - malicious query was not blocked');
    }
  }
  console.log('');

  console.log('🎉 Testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check Prisma Studio at http://localhost:5555');
  console.log('2. Verify data was saved to the database');
  console.log('3. Review conversation history and campaign data');
};

// Run the tests
testAIAnalytics().catch(console.error); 