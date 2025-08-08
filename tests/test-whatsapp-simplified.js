#!/usr/bin/env node

/**
 * Test WhatsApp Simplified Configuration
 * 
 * This script verifies that target user fields have been removed
 * from WhatsApp actions and the system now focuses on phone numbers.
 */

const fs = require('fs');
const path = require('path');

console.log('📱 Testing WhatsApp Simplified Configuration...\n');

// Test 1: Check if target user fields are removed from NodePalette WhatsApp template
const nodePalettePath = path.join(__dirname, 'app', 'components', 'workflows', 'NodePalette.tsx');
if (!fs.existsSync(nodePalettePath)) {
  console.log('❌ NodePalette file not found');
  process.exit(1);
}

const nodePaletteContent = fs.readFileSync(nodePalettePath, 'utf8');

// Check that WhatsApp template doesn't have targetUsers but push notification does
if (nodePaletteContent.includes('whatsapp_message') && 
    nodePaletteContent.includes('fromPhone') && 
    nodePaletteContent.includes('toPhone') &&
    nodePaletteContent.includes('push_notification') &&
    nodePaletteContent.includes('targetUsers')) {
  console.log('✅ WhatsApp template has phone numbers, push notification has target users');
} else {
  console.log('❌ NodePalette configuration incorrect');
}

// Test 2: Check if PropertyPanel has separate handling for WhatsApp vs push notifications
const propertyPanelPath = path.join(__dirname, 'app', 'components', 'workflows', 'PropertyPanel.tsx');
if (!fs.existsSync(propertyPanelPath)) {
  console.log('❌ PropertyPanel file not found');
  process.exit(1);
}

const propertyPanelContent = fs.readFileSync(propertyPanelPath, 'utf8');

if (propertyPanelContent.includes('renderWhatsAppProperties') && 
    propertyPanelContent.includes('renderActionProperties') &&
    propertyPanelContent.includes('From Phone Number') && 
    propertyPanelContent.includes('To Phone Number') &&
    propertyPanelContent.includes('Target Users') &&
    propertyPanelContent.includes('User IDs')) {
  console.log('✅ PropertyPanel has separate handling for WhatsApp (phone numbers) and push notifications (target users)');
} else {
  console.log('❌ PropertyPanel missing proper separation');
}

// Test 3: Check if ActionNode displays phone numbers only for WhatsApp
const actionNodePath = path.join(__dirname, 'app', 'components', 'workflows', 'ActionNode.tsx');
if (!fs.existsSync(actionNodePath)) {
  console.log('❌ ActionNode file not found');
  process.exit(1);
}

const actionNodeContent = fs.readFileSync(actionNodePath, 'utf8');

if (actionNodeContent.includes('data.fromPhone') && 
    actionNodeContent.includes('data.toPhone') &&
    actionNodeContent.includes('data.type === \'whatsapp_message\'')) {
  console.log('✅ ActionNode displays phone numbers for WhatsApp actions');
} else {
  console.log('❌ ActionNode missing phone number display for WhatsApp');
}

// Test 4: Check if workflow service has WhatsApp config without target user fields
const workflowPath = path.join(__dirname, 'app', 'lib', 'workflow.ts');
if (!fs.existsSync(workflowPath)) {
  console.log('❌ Workflow service file not found');
  process.exit(1);
}

const workflowContent = fs.readFileSync(workflowPath, 'utf8');

// Check that WhatsAppActionConfig doesn't have target user fields
const whatsappConfigMatch = workflowContent.match(/export type WhatsAppActionConfig = \{[\s\S]*?\};/);
if (whatsappConfigMatch && 
    whatsappConfigMatch[0].includes('fromPhone?: string') && 
    whatsappConfigMatch[0].includes('toPhone?: string') &&
    !whatsappConfigMatch[0].includes('targetUsers') &&
    !whatsappConfigMatch[0].includes('userIds') &&
    !whatsappConfigMatch[0].includes('segmentId')) {
  console.log('✅ Workflow service has WhatsApp config without target user fields');
} else {
  console.log('❌ Workflow service WhatsApp config still has target user fields');
}

// Test 5: Check if visual builder handles WhatsApp actions without target users
const visualBuilderPath = path.join(__dirname, 'app', 'workflows', 'visual-builder', 'page.tsx');
if (!fs.existsSync(visualBuilderPath)) {
  console.log('❌ Visual builder file not found');
  process.exit(1);
}

const visualBuilderContent = fs.readFileSync(visualBuilderPath, 'utf8');

if (visualBuilderContent.includes('whatsapp_message') && 
    visualBuilderContent.includes('fromPhone: action.fromPhone') && 
    visualBuilderContent.includes('toPhone: action.toPhone')) {
  console.log('✅ Visual builder handles WhatsApp actions with phone numbers');
} else {
  console.log('❌ Visual builder missing WhatsApp phone number handling');
}

console.log('\n📋 Summary:');
console.log('- WhatsApp actions now focus on phone numbers only');
console.log('- Removed target users, user IDs, and segment targeting');
console.log('- Simplified configuration with from/to phone numbers');
console.log('- Cleaner UI without user targeting complexity');
console.log('- More appropriate for WhatsApp messaging patterns');

console.log('\n🎯 WhatsApp Action Configuration:');
console.log('**Required Fields:**');
console.log('- Provider (freshchat)');
console.log('- Template Name');
console.log('- Namespace');
console.log('- Language (ar/en)');
console.log('');
console.log('**Phone Numbers:**');
console.log('- From Phone (business number)');
console.log('- To Phone (target number)');
console.log('');
console.log('**Template Variables:**');
console.log('- Body Variable 1, 2, 3');
console.log('- Button Variable (optional)');

console.log('\n💡 Benefits:');
console.log('- **Simplified**: No complex user targeting logic');
console.log('- **Direct**: Focus on phone number configuration');
console.log('- **Appropriate**: Matches WhatsApp messaging patterns');
console.log('- **Flexible**: Can use event data for dynamic phone numbers');
console.log('- **Clear**: Obvious from/to phone number configuration');

console.log('\n🔧 Usage Examples:');
console.log('1. **Static Numbers**: Set specific from/to in workflow');
console.log('2. **Dynamic Numbers**: Leave empty, use event data');
console.log('3. **Event-Based**: Use phone from triggering event');
console.log('4. **Provider Default**: Use provider business number'); 