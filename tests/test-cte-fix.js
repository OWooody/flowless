// Test script to verify CTE (Common Table Expressions) fix
const testCTEFix = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔧 Testing CTE Query Fix...\n');

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

  // Test 1: Test the problematic query that was failing
  console.log('📊 Test 1: CTE Query with EXCEPT Operation');
  const cteQueryTest = await makeRequest('/api/analytics/test', {
    message: 'Find users who booked last week but not this week'
  });
  
  if (cteQueryTest) {
    console.log('  Response received successfully');
    if (cteQueryTest.sql_query) {
      console.log('  SQL Query generated:', cteQueryTest.sql_query.substring(0, 100) + '...');
    }
    if (cteQueryTest.error) {
      console.log('  Error:', cteQueryTest.error);
    }
  }
  console.log('');

  // Test 2: Test a simpler CTE query
  console.log('🔍 Test 2: Simple CTE Query');
  const simpleCTETest = await makeRequest('/api/analytics/test', {
    message: 'Show me the count of events by name using a CTE'
  });
  
  if (simpleCTETest) {
    console.log('  Response received successfully');
    if (simpleCTETest.sql_query) {
      console.log('  SQL Query generated:', simpleCTETest.sql_query.substring(0, 100) + '...');
    }
    if (simpleCTETest.error) {
      console.log('  Error:', simpleCTETest.error);
    }
  }
  console.log('');

  // Test 3: Test UNION operation
  console.log('🔗 Test 3: UNION Operation Query');
  const unionTest = await makeRequest('/api/analytics/test', {
    message: 'Show me unique user IDs from both booking and signup events'
  });
  
  if (unionTest) {
    console.log('  Response received successfully');
    if (unionTest.sql_query) {
      console.log('  SQL Query generated:', unionTest.sql_query.substring(0, 100) + '...');
    }
    if (unionTest.error) {
      console.log('  Error:', unionTest.error);
    }
  }
  console.log('');

  console.log('🎉 CTE Fix Testing completed!');
  console.log('\n📋 What to check:');
  console.log('1. Go to http://localhost:3000/analytics/chat');
  console.log('2. Ask: "Find users who booked last week but not this week"');
  console.log('3. Check if the query executes successfully');
  console.log('4. Verify the SQL query uses CTEs and EXCEPT operations');
  console.log('');
  console.log('🔧 Expected behavior:');
  console.log('- CTE queries should execute without security errors');
  console.log('- EXCEPT, INTERSECT, UNION operations should work');
  console.log('- Complex analytical queries should be supported');
};

// Run the tests
testCTEFix().catch(console.error); 