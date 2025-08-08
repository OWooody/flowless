// Test to verify event data is available in condition nodes

// Mock the workflow context creation (similar to PropertyPanel)
function createMockWorkflowContext(eventData) {
  const mockContext = {};
  
  // Add event data variables for condition nodes
  if (eventData) {
    mockContext.event = eventData;
    // Also add common event fields directly for easier access
    mockContext.userId = eventData.userId;
    mockContext.value = eventData.value;
    mockContext.category = eventData.category;
    mockContext.userEmail = eventData.userEmail;
    mockContext.userPhone = eventData.userPhone;
    mockContext.itemName = eventData.itemName;
    mockContext.itemId = eventData.itemId;
    mockContext.itemCategory = eventData.itemCategory;
  }
  
  return mockContext;
}

// Mock data resolution service
function resolveExpression(expression, context) {
  if (expression.startsWith('{') && expression.endsWith('}')) {
    const path = expression.slice(1, -1);
    if (path.startsWith('event.')) {
      const field = path.substring(6);
      return context.event[field] || null;
    } else if (path.startsWith('workflow.')) {
      const field = path.substring(9);
      return context[field] || null;
    }
  }
  return expression;
}

// Test the event data availability
function testEventDataInConditions() {
  console.log('🧪 Testing Event Data in Conditions...\n');

  // Sample event data (same as in PropertyPanel)
  const eventData = {
    id: 'event_123',
    name: 'book',
    category: 'engagement',
    action: 'purchase',
    value: 299,
    itemName: 'Muvi Package',
    itemId: '10',
    itemCategory: 'Package',
    userId: 'user123',
    userPhone: '+966533595154',
    organizationId: 'org_2y3sRhCtQr3GmYs8k9Dluk5v2ws',
    path: '/checkout',
    pageTitle: 'Checkout Page',
    ipAddress: '::1',
    referrer: 'https://google.com',
    userAgent: 'Mozilla/5.0...',
    timestamp: new Date().toISOString()
  };

  // Create mock workflow context
  const workflowContext = createMockWorkflowContext(eventData);

  console.log('📋 Mock Workflow Context:');
  console.log(JSON.stringify(workflowContext, null, 2));
  console.log('\n');

  // Test various event variable resolutions
  const testCases = [
    { expression: '{event.userId}', expected: 'user123', description: 'User ID' },
    { expression: '{event.value}', expected: 299, description: 'Event value' },
    { expression: '{event.category}', expected: 'engagement', description: 'Event category' },
    { expression: '{event.itemName}', expected: 'Muvi Package', description: 'Item name' },
    { expression: '{event.userPhone}', expected: '+966533595154', description: 'User phone' },
    { expression: '{event.userEmail}', expected: null, description: 'User email (not in data)' },
  ];

  console.log('🔍 Testing Event Variable Resolution:');
  testCases.forEach((testCase, index) => {
    const result = resolveExpression(testCase.expression, { event: eventData, workflowContext });
    const status = result === testCase.expected ? '✅' : '❌';
    console.log(`${status} Test ${index + 1} - ${testCase.description}:`);
    console.log(`   Expression: ${testCase.expression}`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Actual: ${result}`);
    console.log('');
  });

  // Test condition evaluation with event data
  console.log('🎯 Testing Condition Evaluation with Event Data:');
  
  const conditionTests = [
    {
      conditionType: 'equals',
      leftOperand: '{event.userId}',
      rightOperand: 'user123',
      description: 'Check if user is user123'
    },
    {
      conditionType: 'greater_than',
      leftOperand: '{event.value}',
      rightOperand: '100',
      description: 'Check if purchase value > 100'
    },
    {
      conditionType: 'contains',
      leftOperand: '{event.itemName}',
      rightOperand: 'Package',
      description: 'Check if item name contains Package'
    },
    {
      conditionType: 'equals',
      leftOperand: '{event.category}',
      rightOperand: 'engagement',
      description: 'Check if category is engagement'
    }
  ];

  conditionTests.forEach((testCase, index) => {
    // Resolve left operand
    const leftValue = resolveExpression(testCase.leftOperand, { event: eventData, workflowContext });
    
    // Resolve right operand
    const rightValue = resolveExpression(testCase.rightOperand, { event: eventData, workflowContext });

    // Evaluate condition
    let result = false;
    
    switch (testCase.conditionType) {
      case 'equals':
        result = leftValue === rightValue;
        break;
      case 'greater_than':
        result = Number(leftValue) > Number(rightValue);
        break;
      case 'contains':
        result = String(leftValue).includes(String(rightValue));
        break;
    }

    const status = result ? '✅' : '❌';
    console.log(`${status} Condition ${index + 1} - ${testCase.description}:`);
    console.log(`   ${leftValue} ${testCase.conditionType} ${rightValue} = ${result}`);
    console.log('');
  });

  console.log('🎉 Event data in conditions test completed!');
}

// Run the test
testEventDataInConditions(); 