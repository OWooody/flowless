const fetch = require('node-fetch');

// Test script to demonstrate the debug system
async function testDebugSystem() {
  console.log('🚀 Testing Debug System...\n');

  // You'll need to replace these with actual values from your system
  const BASE_URL = 'http://localhost:3000';
  const USER_ID = 'user_test123'; // Replace with actual user ID
  const API_KEY = 'your_api_key_here'; // Replace with actual API key if needed

  const testRequests = [
    {
      name: 'Test Event 1',
      method: 'POST',
      url: '/api/events',
      body: {
        name: 'page_view',
        properties: { page: '/test', source: 'debug_test' },
        timestamp: new Date().toISOString(),
        category: 'engagement',
        path: '/test',
        pageTitle: 'Debug Test Page'
      }
    },
    {
      name: 'Test Event 2',
      method: 'POST',
      url: '/api/events',
      body: {
        name: 'button_click',
        properties: { button: 'test_button', location: 'debug_page' },
        timestamp: new Date().toISOString(),
        category: 'interaction',
        action: 'click',
        itemName: 'Test Button'
      }
    },
    {
      name: 'Get Events',
      method: 'GET',
      url: '/api/events?limit=5',
      body: null
    }
  ];

  console.log('📋 Making test requests...\n');

  for (let i = 0; i < testRequests.length; i++) {
    const request = testRequests[i];
    console.log(`${i + 1}. ${request.name}`);
    console.log(`   Method: ${request.method}`);
    console.log(`   URL: ${request.url}`);
    
    try {
      const response = await fetch(`${BASE_URL}${request.url}`, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          // Add any other required headers
        },
        body: request.body ? JSON.stringify(request.body) : undefined
      });

      const data = await response.json();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ Test requests completed!');
  console.log('\n📱 Now open the debug page at: http://localhost:3000/debug');
  console.log('🔍 Enter the user ID and start listening to see the captured requests');
}

// Instructions for using the debug system
console.log(`
🔧 Debug System Instructions:

1. Start your Next.js development server:
   npm run dev

2. Open the debug page in your browser:
   http://localhost:3000/debug

3. Enter a user ID to monitor (e.g., "user_test123")

4. Click "Start Listening"

5. Run this test script to generate requests:
   node test-debug-system.js

6. Watch the requests appear in real-time on the debug page!

📝 Note: You may need to:
- Replace USER_ID with an actual user ID from your system
- Add proper authentication headers if required
- Adjust the BASE_URL if your server runs on a different port
`);

// Run the test if this script is executed directly
if (require.main === module) {
  testDebugSystem().catch(console.error);
}

module.exports = { testDebugSystem }; 