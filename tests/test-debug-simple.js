const fetch = require('node-fetch');

async function testDebug() {
  console.log('🧪 Testing Debug System...\n');

  const BASE_URL = 'http://localhost:3000';
  const TEST_USER_ID = 'test_user_123';

  console.log('📝 Making test request...');
  console.log('User ID:', TEST_USER_ID);
  console.log('URL:', `${BASE_URL}/api/events`);
  console.log('');

  try {
    const response = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any auth headers if needed
      },
      body: JSON.stringify({
        name: 'test_event',
        properties: { test: true },
        timestamp: new Date().toISOString(),
        category: 'test',
        userId: TEST_USER_ID  // This is the user ID to monitor
      })
    });

    const data = await response.json();
    console.log('✅ Request successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
    console.log('🔍 Now check the debug page with user ID:', TEST_USER_ID);
    console.log('🌐 Open: http://localhost:3000/debug');
    console.log('📝 Enter user ID:', TEST_USER_ID);
    console.log('▶️  Click "Start Listening"');
    console.log('🔄 Make another request to see it in real-time');

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testDebug(); 