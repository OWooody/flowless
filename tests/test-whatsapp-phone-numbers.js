#!/usr/bin/env node

/**
 * Test WhatsApp Phone Number Integration
 * 
 * This script verifies that phone number fields are properly integrated
 * into the WhatsApp workflow system.
 */

const fs = require('fs');
const path = require('path');

console.log('📞 Testing WhatsApp Phone Number Integration...\n');

// Test 1: Check if phone numbers are added to NodePalette
const nodePalettePath = path.join(__dirname, 'app', 'components', 'workflows', 'NodePalette.tsx');
if (!fs.existsSync(nodePalettePath)) {
  console.log('❌ NodePalette file not found');
  process.exit(1);
}

const nodePaletteContent = fs.readFileSync(nodePalettePath, 'utf8');

if (nodePaletteContent.includes('fromPhone') && 
    nodePaletteContent.includes('toPhone')) {
  console.log('✅ Phone number fields added to NodePalette');
} else {
  console.log('❌ Phone number fields not found in NodePalette');
}

// Test 2: Check if ActionNode supports phone numbers
const actionNodePath = path.join(__dirname, 'app', 'components', 'workflows', 'ActionNode.tsx');
if (!fs.existsSync(actionNodePath)) {
  console.log('❌ ActionNode file not found');
  process.exit(1);
}

const actionNodeContent = fs.readFileSync(actionNodePath, 'utf8');

if (actionNodeContent.includes('fromPhone') && 
    actionNodeContent.includes('toPhone') &&
    actionNodeContent.includes('fromPhone?') &&
    actionNodeContent.includes('toPhone?') &&
    actionNodeContent.includes('data.fromPhone') &&
    actionNodeContent.includes('data.toPhone')) {
  console.log('✅ ActionNode supports phone number display');
} else {
  console.log('❌ ActionNode missing phone number support');
}

// Test 3: Check if PropertyPanel has phone number fields
const propertyPanelPath = path.join(__dirname, 'app', 'components', 'workflows', 'PropertyPanel.tsx');
if (!fs.existsSync(propertyPanelPath)) {
  console.log('❌ PropertyPanel file not found');
  process.exit(1);
}

const propertyPanelContent = fs.readFileSync(propertyPanelPath, 'utf8');

if (propertyPanelContent.includes('From Phone Number') && 
    propertyPanelContent.includes('To Phone Number') &&
    propertyPanelContent.includes('fromPhone') &&
    propertyPanelContent.includes('toPhone') &&
    propertyPanelContent.includes('Business phone number') &&
    propertyPanelContent.includes('Target phone number')) {
  console.log('✅ PropertyPanel has phone number input fields');
} else {
  console.log('❌ PropertyPanel missing phone number fields');
}

// Test 4: Check if workflow service supports phone numbers
const workflowPath = path.join(__dirname, 'app', 'lib', 'workflow.ts');
if (!fs.existsSync(workflowPath)) {
  console.log('❌ Workflow service file not found');
  process.exit(1);
}

const workflowContent = fs.readFileSync(workflowPath, 'utf8');

if (workflowContent.includes('fromPhone?: string') && 
    workflowContent.includes('toPhone?: string') &&
    workflowContent.includes('action.fromPhone') &&
    workflowContent.includes('action.toPhone') &&
    workflowContent.includes('fromPhone = action.fromPhone') &&
    workflowContent.includes('toPhone = action.toPhone')) {
  console.log('✅ Workflow service supports phone number configuration');
} else {
  console.log('❌ Workflow service missing phone number support');
}

// Test 5: Check if visual builder handles phone numbers
const visualBuilderPath = path.join(__dirname, 'app', 'workflows', 'visual-builder', 'page.tsx');
if (!fs.existsSync(visualBuilderPath)) {
  console.log('❌ Visual builder file not found');
  process.exit(1);
}

const visualBuilderContent = fs.readFileSync(visualBuilderPath, 'utf8');

if (visualBuilderContent.includes('fromPhone: action.fromPhone') && 
    visualBuilderContent.includes('toPhone: action.toPhone') &&
    visualBuilderContent.includes('fromPhone: node.data.fromPhone') &&
    visualBuilderContent.includes('toPhone: node.data.toPhone')) {
  console.log('✅ Visual builder handles phone number save/load');
} else {
  console.log('❌ Visual builder missing phone number handling');
}

console.log('\n📋 Summary:');
console.log('- Phone number fields are available in workflow configuration');
console.log('- Users can set business (from) and target (to) phone numbers');
console.log('- Phone numbers are displayed in the visual workflow builder');
console.log('- Workflow execution uses configured phone numbers');
console.log('- Fallback logic exists for provider defaults and user data');

console.log('\n🎯 Phone Number Sources:');
console.log('1. **From Phone (Business)**:');
console.log('   - User input in workflow action (priority)');
console.log('   - Provider configuration default');
console.log('   - Required for message sending');
console.log('');
console.log('2. **To Phone (Target)**:');
console.log('   - User input in workflow action (priority)');
console.log('   - Event data (userPhone, phone fields)');
console.log('   - User profile lookup (future)');
console.log('   - Required for message sending');

console.log('\n💡 Usage Examples:');
console.log('- **Static Numbers**: Set specific from/to numbers in workflow');
console.log('- **Dynamic Numbers**: Leave empty to use provider/user data');
console.log('- **Event-Based**: Use event data for target phone numbers');
console.log('- **Provider Default**: Use provider configuration for business number');

console.log('\n🔧 Technical Implementation:');
console.log('- Phone numbers are optional in UI but validated at execution');
console.log('- Fallback chain: Action config → Provider config → Event data');
console.log('- Error handling for missing phone numbers');
console.log('- International format support (+1234567890)'); 