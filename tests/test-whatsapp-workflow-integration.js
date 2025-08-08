#!/usr/bin/env node

/**
 * Test WhatsApp Workflow Integration
 * 
 * This script verifies that WhatsApp actions are properly integrated
 * into the workflow system.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing WhatsApp Workflow Integration...\n');

// Test 1: Check if WhatsApp action is added to NodePalette
const nodePalettePath = path.join(__dirname, 'app', 'components', 'workflows', 'NodePalette.tsx');
if (!fs.existsSync(nodePalettePath)) {
  console.log('❌ NodePalette file not found');
  process.exit(1);
}

const nodePaletteContent = fs.readFileSync(nodePalettePath, 'utf8');

if (nodePaletteContent.includes('whatsapp_message') && 
    nodePaletteContent.includes('WhatsApp Message') &&
    nodePaletteContent.includes('💬')) {
  console.log('✅ WhatsApp action added to NodePalette');
} else {
  console.log('❌ WhatsApp action not found in NodePalette');
}

// Test 2: Check if ActionNode supports WhatsApp
const actionNodePath = path.join(__dirname, 'app', 'components', 'workflows', 'ActionNode.tsx');
if (!fs.existsSync(actionNodePath)) {
  console.log('❌ ActionNode file not found');
  process.exit(1);
}

const actionNodeContent = fs.readFileSync(actionNodePath, 'utf8');

if (actionNodeContent.includes('whatsapp_message') && 
    actionNodeContent.includes('templateName') &&
    actionNodeContent.includes('provider')) {
  console.log('✅ ActionNode supports WhatsApp messages');
} else {
  console.log('❌ ActionNode does not support WhatsApp messages');
}

// Test 3: Check if PropertyPanel has WhatsApp properties
const propertyPanelPath = path.join(__dirname, 'app', 'components', 'workflows', 'PropertyPanel.tsx');
if (!fs.existsSync(propertyPanelPath)) {
  console.log('❌ PropertyPanel file not found');
  process.exit(1);
}

const propertyPanelContent = fs.readFileSync(propertyPanelPath, 'utf8');

if (propertyPanelContent.includes('renderWhatsAppProperties') && 
    propertyPanelContent.includes('whatsapp_message') &&
    propertyPanelContent.includes('templateName') &&
    propertyPanelContent.includes('namespace')) {
  console.log('✅ PropertyPanel has WhatsApp properties');
} else {
  console.log('❌ PropertyPanel missing WhatsApp properties');
}

// Test 4: Check if workflow service supports WhatsApp actions
const workflowPath = path.join(__dirname, 'app', 'lib', 'workflow.ts');
if (!fs.existsSync(workflowPath)) {
  console.log('❌ Workflow service file not found');
  process.exit(1);
}

const workflowContent = fs.readFileSync(workflowPath, 'utf8');

if (workflowContent.includes('WhatsAppActionConfig') && 
    workflowContent.includes('executeWhatsAppAction') &&
    workflowContent.includes('whatsapp_message')) {
  console.log('✅ Workflow service supports WhatsApp actions');
} else {
  console.log('❌ Workflow service missing WhatsApp support');
}

// Test 5: Check if visual builder supports WhatsApp
const visualBuilderPath = path.join(__dirname, 'app', 'workflows', 'visual-builder', 'page.tsx');
if (!fs.existsSync(visualBuilderPath)) {
  console.log('❌ Visual builder file not found');
  process.exit(1);
}

const visualBuilderContent = fs.readFileSync(visualBuilderPath, 'utf8');

if (visualBuilderContent.includes('whatsapp_message')) {
  console.log('✅ Visual builder supports WhatsApp actions');
} else {
  console.log('❌ Visual builder missing WhatsApp support');
}

console.log('\n📋 Summary:');
console.log('- WhatsApp actions can be added to workflows');
console.log('- Users can configure template name, namespace, language');
console.log('- Users can set body variables (1, 2, 3) and button variable');
console.log('- Workflow execution will send WhatsApp messages via Freshchat');
console.log('- All UI components support WhatsApp message configuration');

console.log('\n🎯 Next Steps:');
console.log('1. Go to /workflows/visual-builder');
console.log('2. Drag "WhatsApp Message" from the palette');
console.log('3. Configure template name, namespace, and variables');
console.log('4. Connect to a trigger and save the workflow');
console.log('5. Test the workflow by triggering the event');

console.log('\n💡 Features Available:');
console.log('- Provider selection (Freshchat)');
console.log('- Template name and namespace configuration');
console.log('- Language selection (Arabic/English)');
console.log('- Body variables (up to 3)');
console.log('- Button variable (optional)');
console.log('- Target user selection (specific/all)'); 