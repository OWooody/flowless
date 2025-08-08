// Simple test script for the enhanced AI chat API
const testAI = async () => {
  try {
    console.log('🧪 Testing Enhanced AI Chat API...\n');

    // Test 1: Basic query
    console.log('📊 Test 1: Basic analytics query');
    const response1 = await fetch('http://localhost:3000/api/analytics/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real testing, you'd need proper authentication
      },
      body: JSON.stringify({
        message: "Show me the top 10 users by event count"
      })
    });

    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));
    console.log('✅ Test 1 completed\n');

    // Test 2: User segment creation
    console.log('👥 Test 2: User segment creation');
    const response2 = await fetch('http://localhost:3000/api/analytics/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Create a segment of users who haven't had any events in the last 30 days"
      })
    });

    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));
    console.log('✅ Test 2 completed\n');

    // Test 3: Campaign creation
    console.log('📧 Test 3: Campaign creation');
    const response3 = await fetch('http://localhost:3000/api/analytics/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Create a campaign to re-engage inactive users with a 20% discount offer"
      })
    });

    const result3 = await response3.json();
    console.log('Response:', JSON.stringify(result3, null, 2));
    console.log('✅ Test 3 completed\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testAI(); 