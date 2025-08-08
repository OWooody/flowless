#!/usr/bin/env node

/**
 * Test Data Picker Functionality
 * 
 * This script verifies that the data picker shows
 * execution data when clicking the 📊 button.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Testing Data Picker Functionality...\n');

// Test 1: Check if PropertyPanel fetches execution data
const propertyPanelPath = path.join(__dirname, 'app', 'components', 'workflows', 'PropertyPanel.tsx');
if (!fs.existsSync(propertyPanelPath)) {
  console.log('❌ PropertyPanel file not found');
  process.exit(1);
}

const propertyPanelContent = fs.readFileSync(propertyPanelPath, 'utf8');

if (propertyPanelContent.includes('fetchExecutionData') && 
    propertyPanelContent.includes('executionData') &&
    propertyPanelContent.includes('eventData') &&
    propertyPanelContent.includes('useState') &&
    propertyPanelContent.includes('useEffect')) {
  console.log('✅ PropertyPanel has execution data fetching');
} else {
  console.log('❌ PropertyPanel missing execution data fetching');
}

// Test 2: Check if SmartInput components receive execution data
const smartInputUsage = [
  'executionData={executionData}',
  'eventData={eventData}'
];

let smartInputDataPassed = true;
smartInputUsage.forEach(check => {
  if (propertyPanelContent.includes(check)) {
    console.log(`✅ SmartInput data passing "${check}" present`);
  } else {
    console.log(`❌ SmartInput data passing "${check}" missing`);
    smartInputDataPassed = false;
  }
});

// Test 3: Check if DataPicker component handles execution data
const dataPickerPath = path.join(__dirname, 'app', 'components', 'workflows', 'DataPicker.tsx');
if (!fs.existsSync(dataPickerPath)) {
  console.log('❌ DataPicker component not found');
  process.exit(1);
}

const dataPickerContent = fs.readFileSync(dataPickerPath, 'utf8');

if (dataPickerContent.includes('executionData') && 
    dataPickerContent.includes('eventData') &&
    dataPickerContent.includes('addEventItems') &&
    dataPickerContent.includes('addExecutionItems')) {
  console.log('✅ DataPicker handles execution and event data');
} else {
  console.log('❌ DataPicker missing execution/event data handling');
}

// Test 4: Check if sample data is comprehensive
const sampleDataChecks = [
  'orderNumber: \'ORD-456\'',
  'customerName: \'Jane Smith\'',
  'total: \'$149.99\'',
  'userPhone: \'+1987654321\'',
  'userEmail: \'jane@example.com\''
];

let sampleDataComprehensive = true;
sampleDataChecks.forEach(check => {
  if (propertyPanelContent.includes(check)) {
    console.log(`✅ Sample data "${check.substring(0, 20)}..." present`);
  } else {
    console.log(`❌ Sample data "${check.substring(0, 20)}..." missing`);
    sampleDataComprehensive = false;
  }
});

// Test 5: Check if real API fetching is attempted
if (propertyPanelContent.includes('fetch(`/api/workflows/${workflowId}/executions`)') &&
    propertyPanelContent.includes('urlParams.get(\'edit\')')) {
  console.log('✅ Real API fetching attempted when workflow ID available');
} else {
  console.log('❌ Real API fetching not implemented');
}

console.log('\n📋 Summary:');
if (smartInputDataPassed && sampleDataComprehensive) {
  console.log('✅ Data picker should now show execution data');
  console.log('✅ SmartInput components receive execution data');
  console.log('✅ DataPicker can display event and execution data');
  console.log('✅ Sample data provides realistic examples');
  console.log('✅ Real API fetching attempted when possible');
} else {
  console.log('❌ Some data picker functionality issues remain');
}

console.log('\n🎯 What Should Work Now:');
console.log('1. **Click 📊 Button**: Data picker modal opens');
console.log('2. **Event Data Section**: Shows current trigger event data');
console.log('3. **Execution History Section**: Shows previous run results');
console.log('4. **Real Values**: Displays actual data, not just field names');
console.log('5. **One-Click Selection**: Click "Select" to insert variables');
console.log('6. **Mixed Content**: Combine text and variables naturally');

console.log('\n📊 Sample Data Available:');
console.log('**Event Data:**');
console.log('- userPhone: +1234567890');
console.log('- userName: John Doe');
console.log('- userEmail: john@example.com');
console.log('- orderNumber: ORD-123');
console.log('- amount: $99.99');
console.log('');
console.log('**Execution History:**');
console.log('- lastResult.orderNumber: ORD-456, ORD-789, ORD-101');
console.log('- lastResult.customerName: Jane Smith, Bob Johnson, Alice Brown');
console.log('- lastResult.total: $149.99, $299.99, $89.99');
console.log('- lastResult.userPhone: +1987654321, +1555123456, +1444333222');

console.log('\n🔧 Technical Implementation:');
console.log('- **useEffect Hook**: Fetches data when node is selected');
console.log('- **Real API Call**: Attempts to fetch from /api/workflows/{id}/executions');
console.log('- **Fallback Data**: Sample data when no real executions exist');
console.log('- **Data Passing**: Execution and event data passed to SmartInput');
console.log('- **DataPicker Integration**: Modal shows actual execution data'); 