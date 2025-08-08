// Test script to verify the knowledge base fix
const testKnowledgeFix = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔧 Testing Knowledge Base Fix...\n');

  const makeRequest = async (endpoint, data = null, method = 'GET') => {
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

  // Test 1: Check if the query endpoint returns all data
  console.log('📊 Test 1: Knowledge Base Query (No Category Filter)');
  const queryResult = await makeRequest('/api/knowledge/query');
  if (queryResult) {
    console.log('  Event Definitions:', queryResult.eventDefinitions?.length || 0);
    console.log('  Business Metrics:', queryResult.businessMetrics?.length || 0);
    console.log('  Knowledge Entries:', queryResult.knowledgeEntries?.length || 0);
    
    if (queryResult.eventDefinitions?.length > 0) {
      console.log('  Sample Event Definition:', {
        name: queryResult.eventDefinitions[0].name,
        category: queryResult.eventDefinitions[0].category
      });
    }
  }
  console.log('');

  // Test 2: Check if the query endpoint works with category parameter
  console.log('🔍 Test 2: Knowledge Base Query (With Category Parameter)');
  const queryWithCategoryResult = await makeRequest('/api/knowledge/query?category=events');
  if (queryWithCategoryResult) {
    console.log('  Event Definitions (with category filter):', queryWithCategoryResult.eventDefinitions?.length || 0);
    console.log('  Business Metrics (with category filter):', queryWithCategoryResult.businessMetrics?.length || 0);
    console.log('  Knowledge Entries (with category filter):', queryWithCategoryResult.knowledgeEntries?.length || 0);
  }
  console.log('');

  console.log('🎉 Knowledge Base Fix Testing completed!');
  console.log('\n📋 What to check:');
  console.log('1. Go to http://localhost:3000/knowledge');
  console.log('2. Create a new event definition');
  console.log('3. Check if it appears in the list immediately');
  console.log('4. Check browser console for debugging information');
  console.log('');
  console.log('🔧 Expected behavior:');
  console.log('- Event definitions should appear in the list after creation');
  console.log('- No more "category" filtering issues');
  console.log('- Console should show debugging information');
};

// Run the tests
testKnowledgeFix().catch(console.error); 