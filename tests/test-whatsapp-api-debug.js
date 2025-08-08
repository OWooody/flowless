#!/usr/bin/env node

/**
 * Debug WhatsApp API Test
 * 
 * This script helps debug the WhatsApp test API endpoint
 */

const fetch = require('node-fetch');

async function testWhatsAppAPI() {
  console.log('🧪 Testing WhatsApp API endpoint...\n');

  const testData = {
    fromPhone: '+1234567890',
    toPhone: '+0987654321',
    templateName: 'welcome_message',
    variables: {
      '1': 'John Doe',
      '2': '12345'
    }
  };

  console.log('📨 Sending test data:', testData);

  try {
    const response = await fetch('http://localhost:3000/api/whatsapp/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📄 Response data:', data);

    if (response.ok) {
      console.log('✅ API call successful');
    } else {
      console.log('❌ API call failed');
      console.log('Error:', data.error);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/whatsapp/providers');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testWhatsAppAPI();
  }
}

main().catch(console.error); 