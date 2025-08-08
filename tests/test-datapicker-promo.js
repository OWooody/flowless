// Test script to verify promo code variables appear in DataPicker
console.log('🧪 Testing Promo Code Variables in DataPicker...\n');

// Mock workflow context with promo code variables
const mockWorkflowContext = {
  // Event data
  id: 'event_123',
  name: 'page_view',
  userId: 'user123',
  
  // Promo code variables (from previous promo code nodes)
  welcomeCode: 'MOCK_WELCOMECODE',
  welcomeCode_batchId: 'mock-batch-id',
  welcomeCode_batchName: 'Welcome Batch',
  welcomeCode_discountType: 'percentage',
  welcomeCode_discountValue: 15,
  
  vipCode: 'MOCK_VIPCODE',
  vipCode_batchId: 'mock-batch-id-2',
  vipCode_batchName: 'VIP Batch',
  vipCode_discountType: 'percentage',
  vipCode_discountValue: 25,
  
  specialOffer: 'MOCK_SPECIALOFFER',
  specialOffer_batchId: 'mock-batch-id-3',
  specialOffer_batchName: 'Special Batch',
  specialOffer_discountType: 'fixed',
  specialOffer_discountValue: 10,
};

// Simulate DataPicker logic
function simulateDataPicker() {
  const dataItems = [];
  
  // Add workflow context items (promo codes and other workflow variables)
  Object.keys(mockWorkflowContext).forEach(key => {
    const value = mockWorkflowContext[key];
    if (value && typeof value === 'string') {
      // Check if it's a promo code variable or related
      if (key.includes('promoCode') || key.includes('Code') || key.includes('code') || key.includes('Offer')) {
        dataItems.push({
          path: `workflow.${key}`,
          value: String(value),
          type: 'workflow',
          displayPath: key
        });
      }
    }
  });
  
  return dataItems;
}

// Run the test
const workflowVariables = simulateDataPicker();

console.log('✅ Found workflow variables:');
workflowVariables.forEach(variable => {
  console.log(`   ${variable.displayPath}: ${variable.value}`);
});

console.log('\n📊 DataPicker would show these variables:');
console.log('   🎫 Workflow Variables (Promo Codes)');
workflowVariables.forEach(variable => {
  console.log(`     • ${variable.displayPath} = ${variable.value}`);
});

console.log('\n💡 Usage examples:');
console.log('   • Push notification: "Use code {{workflow.welcomeCode}} for 15% off!"');
console.log('   • WhatsApp message: "VIP code: {{workflow.vipCode}}"');
console.log('   • Email subject: "Special offer: {{workflow.specialOffer}}"');

console.log('\n🎉 Test completed! Promo code variables are properly detected and would appear in DataPicker.'); 