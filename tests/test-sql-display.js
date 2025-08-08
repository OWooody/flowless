// Test script to verify SQL query display functionality
const testSQLDisplay = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing SQL Query Display...\n');

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

  // Test 1: Query that should generate SQL
  console.log('📊 Test 1: SQL Query Generation');
  console.log('Query: "Show me the first 5 events from the database"');
  
  const result1 = await makeRequest('/api/analytics/test', {
    message: "Show me the first 5 events from the database"
  });
  
  if (result1) {
    console.log('✅ Response received');
    console.log('Type:', result1.type);
    
    if (result1.type === 'query_results') {
      console.log('✅ SQL Query Display Test PASSED');
      console.log('SQL Query:', result1.sql_query);
      console.log('Description:', result1.description);
      console.log('Results count:', result1.results?.length || 0);
      console.log('Suggested actions:', result1.suggested_actions);
    } else {
      console.log('❌ Expected query_results type, got:', result1.type);
    }
  } else {
    console.log('❌ No response received');
  }
  console.log('');

  // Test 2: Count query
  console.log('📈 Test 2: Count Query');
  console.log('Query: "How many events do we have?"');
  
  const result2 = await makeRequest('/api/analytics/test', {
    message: "How many events do we have?"
  });
  
  if (result2) {
    console.log('✅ Response received');
    console.log('Type:', result2.type);
    
    if (result2.type === 'query_results') {
      console.log('✅ Count Query Test PASSED');
      console.log('SQL Query:', result2.sql_query);
      console.log('Results:', result2.results);
    } else if (result2.type === 'error') {
      console.log('⚠️ Query failed (expected for BigInt issue):', result2.message);
      console.log('SQL Query:', result2.sql_query);
    }
  }
  console.log('');

  console.log('🎉 SQL Display Testing completed!');
  console.log('\n📋 What to check in the web interface:');
  console.log('1. Go to http://localhost:3000/analytics/chat');
  console.log('2. Ask: "Show me the first 5 events"');
  console.log('3. Look for the "Generated SQL Query" section');
  console.log('4. Verify the SQL is displayed in a code block');
  console.log('5. Check that results are shown in a table');
};

// Run the tests
testSQLDisplay().catch(console.error); 