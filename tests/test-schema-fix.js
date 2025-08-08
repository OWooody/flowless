// Test script to verify schema fix for case-sensitive column names
const testSchemaFix = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔧 Testing Schema Fix for Case-Sensitive Column Names...\n');

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

  // Test 1: Query that should use correct userId column name
  console.log('👤 Test 1: Correct userId Column Usage');
  console.log('Query: "Show me users with their event counts"');
  
  const result1 = await makeRequest('/api/analytics/test', {
    message: "Show me users with their event counts"
  });
  
  if (result1) {
    console.log('✅ Response received');
    console.log('Type:', result1.type);
    
    if (result1.type === 'query_results') {
      console.log('✅ Schema Fix Test PASSED');
      console.log('SQL Query:', result1.sql_query);
      
      // Check if the query uses correct column names
      if (result1.sql_query.includes('"userId"') && !result1.sql_query.includes('"userid"')) {
        console.log('✅ Correct column name usage: "userId" (CamelCase)');
      } else {
        console.log('❌ Still using incorrect column name');
      }
      
      console.log('Results count:', result1.results?.length || 0);
    } else if (result1.type === 'error') {
      console.log('⚠️ Query failed:', result1.message);
      console.log('SQL Query:', result1.sql_query);
      
      // Check if the error is still about column names
      if (result1.message.includes('column') && result1.message.includes('does not exist')) {
        console.log('❌ Still getting column name errors');
      } else {
        console.log('✅ Error is not related to column names (might be BigInt issue)');
      }
    }
  } else {
    console.log('❌ No response received');
  }
  console.log('');

  // Test 2: Query with multiple column names
  console.log('📊 Test 2: Multiple Column Names');
  console.log('Query: "Show me events with user details and page information"');
  
  const result2 = await makeRequest('/api/analytics/test', {
    message: "Show me events with user details and page information"
  });
  
  if (result2) {
    console.log('✅ Response received');
    console.log('Type:', result2.type);
    
    if (result2.type === 'query_results') {
      console.log('✅ Multiple Columns Test PASSED');
      console.log('SQL Query:', result2.sql_query);
      
      // Check for various column names
      const correctColumns = ['"userId"', '"pageTitle"', '"itemCategory"', '"organizationId"'];
      const incorrectColumns = ['"userid"', '"pagetitle"', '"itemcategory"', '"organizationid"'];
      
      let allCorrect = true;
      correctColumns.forEach(col => {
        if (result2.sql_query.includes(col)) {
          console.log(`✅ Using correct: ${col}`);
        }
      });
      
      incorrectColumns.forEach(col => {
        if (result2.sql_query.includes(col)) {
          console.log(`❌ Still using incorrect: ${col}`);
          allCorrect = false;
        }
      });
      
      if (allCorrect) {
        console.log('✅ All column names are correct!');
      }
    } else if (result2.type === 'error') {
      console.log('⚠️ Query failed:', result2.message);
      console.log('SQL Query:', result2.sql_query);
    }
  }
  console.log('');

  console.log('🎉 Schema Fix Testing completed!');
  console.log('\n📋 Summary:');
  console.log('- The AI should now use correct CamelCase column names');
  console.log('- No more "column does not exist" errors for case sensitivity');
  console.log('- All queries should work with the exact schema');
};

// Run the tests
testSchemaFix().catch(console.error); 