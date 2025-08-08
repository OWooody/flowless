// Mock data resolution service for testing
class MockDataResolutionService {
  static resolveExpression(expression, context) {
    // Simple mock implementation
    if (expression.startsWith('{') && expression.endsWith('}')) {
      const path = expression.slice(1, -1);
      if (path.startsWith('event.')) {
        const field = path.substring(6);
        return context.event[field] || null;
      } else if (path.startsWith('workflow.')) {
        const field = path.substring(9);
        return context.workflowContext[field] || null;
      }
    }
    return expression;
  }
}

// Test condition evaluation
function testConditionEvaluation() {
  console.log('🧪 Testing Conditional Logic...\n');

  // Test case 1: Simple equals condition
  const test1 = {
    conditionType: 'equals',
    leftOperand: '{event.userId}',
    rightOperand: 'user123',
    event: { userId: 'user123' },
    workflowContext: {}
  };

  const result1 = evaluateCondition(test1);
  console.log('✅ Test 1 - Equals condition:', result1);

  // Test case 2: Dynamic variable comparison
  const test2 = {
    conditionType: 'greater_than',
    leftOperand: '{event.value}',
    rightOperand: '100',
    event: { value: 150 },
    workflowContext: {}
  };

  const result2 = evaluateCondition(test2);
  console.log('✅ Test 2 - Greater than with dynamic variable:', result2);

  // Test case 3: Workflow context variable
  const test3 = {
    conditionType: 'equals',
    leftOperand: '{workflow.promoCode}',
    rightOperand: 'SUMMER20',
    event: {},
    workflowContext: { promoCode: 'SUMMER20' }
  };

  const result3 = evaluateCondition(test3);
  console.log('✅ Test 3 - Workflow context variable:', result3);

  // Test case 4: Contains condition
  const test4 = {
    conditionType: 'contains',
    leftOperand: '{event.userEmail}',
    rightOperand: '@gmail.com',
    event: { userEmail: 'user@gmail.com' },
    workflowContext: {}
  };

  const result4 = evaluateCondition(test4);
  console.log('✅ Test 4 - Contains condition:', result4);

  // Test case 5: False condition
  const test5 = {
    conditionType: 'equals',
    leftOperand: '{event.userId}',
    rightOperand: 'user123',
    event: { userId: 'user456' },
    workflowContext: {}
  };

  const result5 = evaluateCondition(test5);
  console.log('✅ Test 5 - False condition:', result5);

  console.log('\n🎉 All conditional logic tests completed!');
}

function evaluateCondition(testCase) {
  // Resolve left operand
  const leftValue = MockDataResolutionService.resolveExpression(testCase.leftOperand, {
    event: testCase.event,
    workflowContext: testCase.workflowContext
  });
  
  // Resolve right operand
  const rightValue = MockDataResolutionService.resolveExpression(testCase.rightOperand, {
    event: testCase.event,
    workflowContext: testCase.workflowContext
  });

  // Evaluate condition
  let result = false;
  
  switch (testCase.conditionType) {
    case 'equals':
      result = leftValue === rightValue;
      break;
    case 'not_equals':
      result = leftValue !== rightValue;
      break;
    case 'greater_than':
      result = Number(leftValue) > Number(rightValue);
      break;
    case 'less_than':
      result = Number(leftValue) < Number(rightValue);
      break;
    case 'contains':
      result = String(leftValue).includes(String(rightValue));
      break;
    case 'not_contains':
      result = !String(leftValue).includes(String(rightValue));
      break;
    default:
      throw new Error(`Unknown condition type: ${testCase.conditionType}`);
  }

  return {
    conditionType: testCase.conditionType,
    leftOperand: testCase.leftOperand,
    rightOperand: testCase.rightOperand,
    leftValue,
    rightValue,
    result,
    description: `Test: ${leftValue} ${testCase.conditionType} ${rightValue} = ${result}`
  };
}

// Run the tests
testConditionEvaluation(); 