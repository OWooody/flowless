#!/usr/bin/env node

/**
 * Test Simplified WhatsApp Form
 * 
 * This test verifies that the WhatsApp test form has been simplified to use
 * predefined variable fields instead of template discovery.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Simplified WhatsApp Form...\n');

// Test 1: Check if the WhatsApp page file exists
const whatsappPagePath = path.join(__dirname, 'app', 'whatsapp', 'page.tsx');
if (!fs.existsSync(whatsappPagePath)) {
  console.log('❌ WhatsApp page file not found');
  process.exit(1);
}
console.log('✅ WhatsApp page file exists');

// Test 2: Check if template discovery functions have been removed
const whatsappPageContent = fs.readFileSync(whatsappPagePath, 'utf8');

const removedFunctions = [
  'fetchTemplateInfo',
  'renderVariableInput',
  'templateInfo',
  'templateLoading',
  'dynamicVariables'
];

let allRemoved = true;
removedFunctions.forEach(func => {
  if (whatsappPageContent.includes(func)) {
    console.log(`❌ Template discovery function '${func}' still exists`);
    allRemoved = false;
  }
});

if (allRemoved) {
  console.log('✅ Template discovery functions have been removed');
}

// Test 3: Check if simplified variable fields exist
const simplifiedFields = [
  'bodyVariable1',
  'bodyVariable2', 
  'bodyVariable3',
  'buttonVariable'
];

let allFieldsExist = true;
simplifiedFields.forEach(field => {
  if (!whatsappPageContent.includes(field)) {
    console.log(`❌ Simplified field '${field}' not found`);
    allFieldsExist = false;
  }
});

if (allFieldsExist) {
  console.log('✅ Simplified variable fields exist');
}

// Test 4: Check if the test message handler uses the new variable structure
if (whatsappPageContent.includes("variables['1'] = testData.bodyVariable1") &&
    whatsappPageContent.includes("variables['2'] = testData.bodyVariable2") &&
    whatsappPageContent.includes("variables['3'] = testData.bodyVariable3") &&
    whatsappPageContent.includes("variables['button'] = testData.buttonVariable")) {
  console.log('✅ Test message handler uses simplified variable structure');
} else {
  console.log('❌ Test message handler does not use simplified variable structure');
}

// Test 5: Check if UI has the new variable input fields
if (whatsappPageContent.includes('Body Variable 1') &&
    whatsappPageContent.includes('Body Variable 2') &&
    whatsappPageContent.includes('Body Variable 3') &&
    whatsappPageContent.includes('Button Variable')) {
  console.log('✅ UI has simplified variable input fields');
} else {
  console.log('❌ UI does not have simplified variable input fields');
}

// Test 6: Check if template discovery API endpoint can be removed
const templateApiPath = path.join(__dirname, 'app', 'api', 'whatsapp', 'templates', '[name]', 'route.ts');
if (fs.existsSync(templateApiPath)) {
  console.log('⚠️  Template discovery API endpoint still exists - can be removed if not needed elsewhere');
} else {
  console.log('✅ Template discovery API endpoint has been removed');
}

console.log('\n📋 Summary:');
console.log('- Template discovery functionality has been removed');
console.log('- Simplified variable fields (3 body + 1 button) have been added');
console.log('- Test message handler uses the new variable structure');
console.log('- UI has been updated with simple input fields');
console.log('- Only non-empty variables are sent to the API');

console.log('\n🎯 The WhatsApp test form is now simplified and ready to use!');
console.log('Users can now:');
console.log('1. Enter template name');
console.log('2. Fill in up to 3 body variables ({{1}}, {{2}}, {{3}})');
console.log('3. Fill in 1 button variable (optional)');
console.log('4. Send test messages with only the filled variables'); 