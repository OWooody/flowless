// Test script to verify knowledge base functionality
const testKnowledgeBase = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧠 Testing Knowledge Base System...\n');

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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
      return null;
    }
  };

  // Test 1: Create Event Definition
  console.log('📝 Test 1: Creating Event Definition');
  const eventDefinition = {
    name: 'purchase',
    description: 'User completes a purchase transaction',
    category: 'conversion',
    properties: {
      amount: 'number',
      currency: 'string',
      product_id: 'string',
      payment_method: 'string'
    },
    examples: {
      amount: 99.99,
      currency: 'USD',
      product_id: 'prod_123',
      payment_method: 'credit_card'
    }
  };
  
  const eventResult = await makeRequest('/api/knowledge/event-definitions', eventDefinition, 'POST');
  if (eventResult) {
    console.log('✅ Event Definition created successfully');
    console.log('ID:', eventResult.id);
  }
  console.log('');

  // Test 2: Create Business Metric
  console.log('📊 Test 2: Creating Business Metric');
  const businessMetric = {
    name: 'purchase_conversion_rate',
    description: 'Percentage of users who complete a purchase',
    formula: 'SELECT (COUNT(DISTINCT CASE WHEN name = \'purchase\' THEN "userId" END) * 100.0 / COUNT(DISTINCT "userId")) as conversion_rate FROM "Event"',
    category: 'conversion',
    unit: 'percentage',
    examples: {
      result: 15.5,
      period: 'last_30_days'
    }
  };
  
  const metricResult = await makeRequest('/api/knowledge/business-metrics', businessMetric, 'POST');
  if (metricResult) {
    console.log('✅ Business Metric created successfully');
    console.log('ID:', metricResult.id);
  }
  console.log('');

  // Test 3: Create Knowledge Entry
  console.log('📚 Test 3: Creating Knowledge Entry');
  const knowledgeEntry = {
    title: 'Retention Calculation',
    content: 'User retention is calculated as the percentage of users who return within a specific time period. For 30-day retention, we look at users who had events in the current month and also had events in the previous month.',
    tags: ['retention', 'calculation', 'user-behavior'],
    category: 'business_logic'
  };
  
  const entryResult = await makeRequest('/api/knowledge/entries', knowledgeEntry, 'POST');
  if (entryResult) {
    console.log('✅ Knowledge Entry created successfully');
    console.log('ID:', entryResult.id);
  }
  console.log('');

  // Test 4: Query Knowledge Base
  console.log('🔍 Test 4: Querying Knowledge Base');
  const knowledgeQuery = await makeRequest('/api/knowledge/query');
  if (knowledgeQuery) {
    console.log('✅ Knowledge Base query successful');
    console.log('Event Definitions:', knowledgeQuery.eventDefinitions?.length || 0);
    console.log('Business Metrics:', knowledgeQuery.businessMetrics?.length || 0);
    console.log('Knowledge Entries:', knowledgeQuery.knowledgeEntries?.length || 0);
    
    if (knowledgeQuery.eventDefinitions?.length > 0) {
      console.log('Sample Event Definition:', knowledgeQuery.eventDefinitions[0].name);
    }
    if (knowledgeQuery.businessMetrics?.length > 0) {
      console.log('Sample Business Metric:', knowledgeQuery.businessMetrics[0].name);
    }
  }
  console.log('');

  // Test 5: Test AI with Knowledge Base Context
  console.log('🤖 Test 5: Testing AI with Knowledge Base Context');
  const aiQuery = await makeRequest('/api/analytics/test', {
    message: "Calculate the purchase conversion rate using our defined business metric"
  });
  
  if (aiQuery) {
    console.log('✅ AI Query with Knowledge Base successful');
    console.log('Type:', aiQuery.type);
    if (aiQuery.type === 'query_results') {
      console.log('SQL Query:', aiQuery.sql_query);
      console.log('Description:', aiQuery.description);
    }
  }
  console.log('');

  console.log('🎉 Knowledge Base Testing completed!');
  console.log('\n📋 What to check in the browser:');
  console.log('1. Go to http://localhost:3000/knowledge');
  console.log('2. Verify the created event definitions, business metrics, and knowledge entries');
  console.log('3. Go to http://localhost:3000/analytics/chat');
  console.log('4. Ask: "Calculate the purchase conversion rate"');
  console.log('5. Verify the AI uses the knowledge base context');
};

// Run the tests
testKnowledgeBase().catch(console.error); 