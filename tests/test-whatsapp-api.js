console.log('🔧 WhatsApp API Test');
console.log('===================');

const https = require('https');
const http = require('http');

// Simple HTTP client
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testWhatsAppAPI() {
  console.log('\n🎯 Testing WhatsApp API endpoints:');
  
  try {
    // Test the providers endpoint
    console.log('\n1. Testing GET /api/whatsapp/providers...');
    const response = await makeRequest('http://localhost:3000/api/whatsapp/providers');
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ API is working (401 Unauthorized is expected without auth)');
    } else if (response.status === 200) {
      console.log('✅ API is working and returning data');
      
      // Check if providers array exists
      if (response.data.availableProviders) {
        console.log(`✅ Found ${response.data.availableProviders.length} available providers`);
        
        if (Array.isArray(response.data.availableProviders)) {
          console.log('✅ availableProviders is an array');
          
          response.data.availableProviders.forEach((provider, index) => {
            console.log(`   ${index + 1}. ${provider.name} (${provider.displayName})`);
            console.log(`      Config fields: ${Object.keys(provider.configFields).join(', ')}`);
          });
        } else {
          console.log('❌ availableProviders is not an array:', typeof response.data.availableProviders);
        }
      } else {
        console.log('❌ availableProviders not found in response');
      }
    } else {
      console.log(`❌ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    console.log('❌ Error testing API:', error.message);
  }
}

// Run the test
testWhatsAppAPI().then(() => {
  console.log('\n🚀 WhatsApp API Test - COMPLETED!');
}).catch((error) => {
  console.log('❌ Test failed:', error.message);
}); 