// Test script to verify knowledge base functionality with authentication simulation
const testKnowledgeBaseAuth = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔐 Testing Knowledge Base with Authentication...\n');

  // First, let's test the test endpoint which doesn't require auth
  console.log('📊 Test 1: Testing AI Analytics (No Auth Required)');
  try {
    const response = await fetch(`${baseUrl}/api/analytics/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Show me the first 3 events"
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI Analytics Test successful');
      console.log('Type:', data.type);
      if (data.sql_query) {
        console.log('SQL Query:', data.sql_query);
      }
    } else {
      console.log('❌ AI Analytics Test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ AI Analytics Test error:', error.message);
  }
  console.log('');

  // Test the knowledge base query endpoint (should work without auth in test mode)
  console.log('🔍 Test 2: Testing Knowledge Base Query');
  try {
    const response = await fetch(`${baseUrl}/api/knowledge/query`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Knowledge Base Query successful');
      console.log('Event Definitions:', data.eventDefinitions?.length || 0);
      console.log('Business Metrics:', data.businessMetrics?.length || 0);
      console.log('Knowledge Entries:', data.knowledgeEntries?.length || 0);
    } else {
      console.log('❌ Knowledge Base Query failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Knowledge Base Query error:', error.message);
  }
  console.log('');

  console.log('📋 Authentication Status Check:');
  console.log('1. The knowledge base requires authentication (Clerk)');
  console.log('2. You need to be signed in to create/edit knowledge base items');
  console.log('3. The AI analytics test endpoint works without auth');
  console.log('');
  console.log('🔧 To test the knowledge base:');
  console.log('1. Go to http://localhost:3000');
  console.log('2. Sign in with Clerk');
  console.log('3. Navigate to http://localhost:3000/knowledge');
  console.log('4. Try creating an event definition');
  console.log('');
  console.log('🐛 If you\'re still having issues:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Check network tab for failed requests');
  console.log('3. Verify Clerk authentication is working');
  console.log('4. Check if the database migration was applied correctly');
};

// Run the tests
testKnowledgeBaseAuth().catch(console.error); 