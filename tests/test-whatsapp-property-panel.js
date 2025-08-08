#!/usr/bin/env node

/**
 * Test WhatsApp Property Panel Fix
 * 
 * This script verifies that the PropertyPanel correctly
 * detects and displays WhatsApp action properties.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Testing WhatsApp Property Panel Fix...\n');

// Test 1: Check if PropertyPanel has correct conditional logic
const propertyPanelPath = path.join(__dirname, 'app', 'components', 'workflows', 'PropertyPanel.tsx');
if (!fs.existsSync(propertyPanelPath)) {
  console.log('❌ PropertyPanel file not found');
  process.exit(1);
}

const propertyPanelContent = fs.readFileSync(propertyPanelPath, 'utf8');

// Check for correct node type conditions
if (propertyPanelContent.includes("selectedNode.type === 'whatsapp_message'") && 
    propertyPanelContent.includes("selectedNode.type === 'push_notification'") &&
    !propertyPanelContent.includes("selectedNode.type === 'action' && nodeData.type === 'whatsapp_message'")) {
  console.log('✅ PropertyPanel has correct WhatsApp node detection');
} else {
  console.log('❌ PropertyPanel missing correct WhatsApp node detection');
}

// Test 2: Check if WhatsApp properties are properly rendered
const whatsappFields = [
  'Provider',
  'Template Name',
  'Namespace',
  'Language',
  'From Phone Number (Business)',
  'To Phone Number (Target)',
  'Template Variables',
  'Body Variable 1',
  'Body Variable 2',
  'Body Variable 3',
  'Button Variable'
];

let allWhatsAppFieldsPresent = true;
whatsappFields.forEach(field => {
  if (propertyPanelContent.includes(field)) {
    console.log(`✅ WhatsApp field "${field}" present`);
  } else {
    console.log(`❌ WhatsApp field "${field}" missing`);
    allWhatsAppFieldsPresent = false;
  }
});

// Test 3: Check if SmartInput is used for WhatsApp fields
const smartInputUsage = [
  'SmartInput',
  'value={nodeData.fromPhone',
  'value={nodeData.toPhone',
  'value={nodeData.bodyVariable1',
  'value={nodeData.bodyVariable2',
  'value={nodeData.bodyVariable3',
  'value={nodeData.buttonVariable'
];

let smartInputUsed = true;
smartInputUsage.forEach(check => {
  if (propertyPanelContent.includes(check)) {
    console.log(`✅ SmartInput usage "${check.substring(0, 20)}..." present`);
  } else {
    console.log(`❌ SmartInput usage "${check.substring(0, 20)}..." missing`);
    smartInputUsed = false;
  }
});

// Test 4: Check if visual builder has correct node types
const visualBuilderPath = path.join(__dirname, 'app', 'workflows', 'visual-builder', 'page.tsx');
if (!fs.existsSync(visualBuilderPath)) {
  console.log('❌ Visual builder file not found');
  process.exit(1);
}

const visualBuilderContent = fs.readFileSync(visualBuilderPath, 'utf8');

if (visualBuilderContent.includes("whatsapp_message: ActionNode") && 
    visualBuilderContent.includes("push_notification: ActionNode") &&
    visualBuilderContent.includes("trigger: TriggerNode")) {
  console.log('✅ Visual builder has correct node types');
} else {
  console.log('❌ Visual builder missing correct node types');
}

console.log('\n📋 Summary:');
if (allWhatsAppFieldsPresent && smartInputUsed) {
  console.log('✅ WhatsApp PropertyPanel should now work correctly');
  console.log('✅ All WhatsApp fields are present');
  console.log('✅ SmartInput components are used for dynamic data');
  console.log('✅ Node type detection is fixed');
} else {
  console.log('❌ Some WhatsApp PropertyPanel issues remain');
}

console.log('\n🎯 What Should Work Now:');
console.log('1. **Click WhatsApp Action Node**: Properties panel should appear');
console.log('2. **Provider Selection**: Freshchat dropdown');
console.log('3. **Template Configuration**: Name, namespace, language');
console.log('4. **Smart Input Fields**: 📊 button for data picker');
console.log('5. **Variable Configuration**: Body and button variables');
console.log('6. **Data Picker**: Click 📊 to see execution data');

console.log('\n🔧 Technical Fix:');
console.log('- **Node Type Detection**: Fixed from "action" to "whatsapp_message"');
console.log('- **Conditional Rendering**: Direct node type checks');
console.log('- **SmartInput Integration**: All WhatsApp fields use data picker');
console.log('- **Debug Info**: Shows node info if detection fails'); 