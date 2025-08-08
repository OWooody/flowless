// Test script to verify knowledge base usage by AI assistant
const testKnowledgeUsage = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Testing Knowledge Base Usage by AI Assistant...\n');

  const makeRequest = async (endpoint, data = null, method = 'POST') => {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ ${method} ${endpoint} - ${response.status}: ${errorText}`);
        return null;
      }
      
      const result = await response.json();
      console.log(`✅ ${method} ${endpoint} - Success`);
      return result;
    } catch (error) {
      console.error(`❌ ${method} ${endpoint} - Error: ${error.message}`);
      return null;
    }
  };

  // Test 1: Check what event definitions exist in the knowledge base
  console.log('📊 Test 1: Check Knowledge Base Event Definitions');
  const kbQuery = await makeRequest('/api/knowledge/query', null, 'GET');
  if (kbQuery) {
    console.log('  Event Definitions found:', kbQuery.eventDefinitions?.length || 0);
    if (kbQuery.eventDefinitions?.length > 0) {
      console.log('  Available event names:');
      kbQuery.eventDefinitions.forEach((ed, index) => {
        console.log(`    ${index + 1}. "${ed.name}" - ${ed.description} (Category: ${ed.category})`);
      });
    } else {
      console.log('  ⚠️  No event definitions found in knowledge base!');
    }
  }
  console.log('');

  // Test 2: Test AI with a specific event name from knowledge base
  if (kbQuery?.eventDefinitions?.length > 0) {
    const firstEvent = kbQuery.eventDefinitions[0];
    console.log(`🔍 Test 2: Test AI with Knowledge Base Event "${firstEvent.name}"`);
    
    const aiTest = await makeRequest('/api/analytics/test', {
      message: `Show me the count of "${firstEvent.name}" events in the last 7 days`
    });
    
    if (aiTest) {
      console.log('  AI Response received');
      if (aiTest.sql_query) {
        console.log('  Generated SQL:', aiTest.sql_query);
        // Check if the AI used the exact event name from knowledge base
        if (aiTest.sql_query.includes(`'${firstEvent.name}'`)) {
          console.log('  ✅ AI correctly used knowledge base event name!');
        } else {
          console.log('  ❌ AI did NOT use knowledge base event name');
          console.log('  Expected:', `'${firstEvent.name}'`);
          console.log('  Found in query:', aiTest.sql_query);
        }
      }
      if (aiTest.error) {
        console.log('  Error:', aiTest.error);
      }
    }
    console.log('');
  }

  // Test 3: Test AI with a generic booking question
  console.log('📋 Test 3: Test AI with Generic "Booking" Question');
  const bookingTest = await makeRequest('/api/analytics/test', {
    message: 'Show me users who made a booking in the last week'
  });
  
  if (bookingTest) {
    console.log('  AI Response received');
    if (bookingTest.sql_query) {
      console.log('  Generated SQL:', bookingTest.sql_query);
      // Check if the AI used "booking" or a knowledge base event name
      if (bookingTest.sql_query.includes("'booking'")) {
        console.log('  ⚠️  AI used generic "booking" instead of knowledge base event names');
      } else {
        console.log('  ✅ AI used a different approach (possibly knowledge base event name)');
      }
    }
    if (bookingTest.error) {
      console.log('  Error:', bookingTest.error);
    }
  }
  console.log('');

  // Test 4: Test AI with explicit knowledge base reference
  console.log('🎯 Test 4: Test AI with Explicit Knowledge Base Reference');
  const explicitTest = await makeRequest('/api/analytics/test', {
    message: 'Use the event definitions from the knowledge base to show me recent events'
  });
  
  if (explicitTest) {
    console.log('  AI Response received');
    if (explicitTest.sql_query) {
      console.log('  Generated SQL:', explicitTest.sql_query);
    }
    if (explicitTest.error) {
      console.log('  Error:', explicitTest.error);
    }
  }
  console.log('');

  console.log('🎉 Knowledge Base Usage Testing completed!');
  console.log('\n📋 Analysis:');
  console.log('1. Check if event definitions exist in knowledge base');
  console.log('2. Verify AI uses exact event names from knowledge base');
  console.log('3. Compare with generic event names like "booking"');
  console.log('4. Test explicit knowledge base references');
  console.log('');
  console.log('🔧 Expected behavior:');
  console.log('- AI should use exact event names from knowledge base');
  console.log('- AI should not use generic names like "booking" if knowledge base has specific names');
  console.log('- Knowledge base context should be properly injected into AI prompts');
};

// Run the tests
testKnowledgeUsage().catch(console.error); 