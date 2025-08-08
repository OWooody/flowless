// Test script to verify web interface with schema fixes
const testWebInterface = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🌐 Testing Web Interface with Schema Fixes...\n');

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

  // Test 1: Complex query that should work now
  console.log('🔍 Test 1: Complex User Analysis Query');
  console.log('Query: "Find users who have more than 10 events and show their activity patterns"');
  
  const result1 = await makeRequest('/api/analytics/test', {
    message: "Find users who have more than 10 events and show their activity patterns"
  });
  
  if (result1) {
    console.log('✅ Response received');
    console.log('Type:', result1.type);
    
    if (result1.type === 'query_results') {
      console.log('✅ Complex Query Test PASSED');
      console.log('SQL Query:', result1.sql_query);
      console.log('Description:', result1.description);
      console.log('Results count:', result1.results?.length || 0);
      console.log('Suggested actions:', result1.suggested_actions);
      
      // Check if the query uses correct column names
      const hasCorrectColumns = result1.sql_query.includes('"userId"') && 
                               result1.sql_query.includes('"Event"') &&
                               !result1.sql_query.includes('"userid"');
      
      if (hasCorrectColumns) {
        console.log('✅ All column names are correct!');
      } else {
        console.log('❌ Column name issues detected');
      }
    } else if (result1.type === 'error') {
      console.log('⚠️ Query failed:', result1.message);
      console.log('SQL Query:', result1.sql_query);
    }
  }
  console.log('');

  // Test 2: Query with date filtering
  console.log('📅 Test 2: Date-Based Query');
  console.log('Query: "Show me events from the last 7 days with user information"');
  
  const result2 = await makeRequest('/api/analytics/test', {
    message: "Show me events from the last 7 days with user information"
  });
  
  if (result2) {
    console.log('✅ Response received');
    console.log('Type:', result2.type);
    
    if (result2.type === 'query_results') {
      console.log('✅ Date Query Test PASSED');
      console.log('SQL Query:', result2.sql_query);
      console.log('Results count:', result2.results?.length || 0);
      
      // Check for proper date handling
      if (result2.sql_query.includes('timestamp') && result2.sql_query.includes('NOW()')) {
        console.log('✅ Date filtering is working correctly');
      }
    } else if (result2.type === 'error') {
      console.log('⚠️ Query failed:', result2.message);
      console.log('SQL Query:', result2.sql_query);
    }
  }
  console.log('');

  // Test 3: Aggregation query
  console.log('📊 Test 3: Aggregation Query');
  console.log('Query: "What are the top 5 event categories by count?"');
  
  const result3 = await makeRequest('/api/analytics/test', {
    message: "What are the top 5 event categories by count?"
  });
  
  if (result3) {
    console.log('✅ Response received');
    console.log('Type:', result3.type);
    
    if (result3.type === 'query_results') {
      console.log('✅ Aggregation Test PASSED');
      console.log('SQL Query:', result3.sql_query);
      console.log('Results count:', result3.results?.length || 0);
      
      // Check for proper aggregation
      if (result3.sql_query.includes('COUNT') && result3.sql_query.includes('GROUP BY')) {
        console.log('✅ Aggregation is working correctly');
      }
    } else if (result3.type === 'error') {
      console.log('⚠️ Query failed:', result3.message);
      console.log('SQL Query:', result3.sql_query);
    }
  }
  console.log('');

  console.log('🎉 Web Interface Testing completed!');
  console.log('\n📋 What to test in the browser:');
  console.log('1. Go to http://localhost:3000/analytics/chat');
  console.log('2. Try these queries:');
  console.log('   - "Show me users with their event counts"');
  console.log('   - "What are the most common event categories?"');
  console.log('   - "Find users who haven\'t had events in 30 days"');
  console.log('3. Verify SQL queries are displayed correctly');
  console.log('4. Check that results appear in tables');
  console.log('5. Confirm no more "column does not exist" errors');
};

// Run the tests
testWebInterface().catch(console.error); 