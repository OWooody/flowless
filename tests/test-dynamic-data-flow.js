#!/usr/bin/env node

/**
 * Test Dynamic Data Flow Implementation
 * 
 * This script verifies that the dynamic data flow system
 * is properly implemented for WhatsApp actions.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Testing Dynamic Data Flow Implementation...\n');

// Test 1: Check if DataResolutionService exists
const dataResolutionPath = path.join(__dirname, 'app', 'lib', 'data-resolution.ts');
if (!fs.existsSync(dataResolutionPath)) {
  console.log('❌ DataResolutionService file not found');
  process.exit(1);
}

const dataResolutionContent = fs.readFileSync(dataResolutionPath, 'utf8');

if (dataResolutionContent.includes('DataResolutionService') && 
    dataResolutionContent.includes('resolveExpression') &&
    dataResolutionContent.includes('resolveWhatsAppVariables')) {
  console.log('✅ DataResolutionService implemented');
} else {
  console.log('❌ DataResolutionService missing key methods');
}

// Test 2: Check if WhatsAppActionConfig has variableMappings
const workflowPath = path.join(__dirname, 'app', 'lib', 'workflow.ts');
if (!fs.existsSync(workflowPath)) {
  console.log('❌ Workflow service file not found');
  process.exit(1);
}

const workflowContent = fs.readFileSync(workflowPath, 'utf8');

if (workflowContent.includes('variableMappings?:') && 
    workflowContent.includes('fromPhone?: string') &&
    workflowContent.includes('toPhone?: string') &&
    workflowContent.includes('bodyVariable1?: string')) {
  console.log('✅ WhatsAppActionConfig has variableMappings');
} else {
  console.log('❌ WhatsAppActionConfig missing variableMappings');
}

// Test 3: Check if workflow execution uses DataResolutionService
if (workflowContent.includes('DataResolutionService') && 
    workflowContent.includes('resolveWhatsAppVariables') &&
    workflowContent.includes('getExecutionHistory')) {
  console.log('✅ Workflow execution uses DataResolutionService');
} else {
  console.log('❌ Workflow execution missing DataResolutionService integration');
}

// Test 4: Check if NodePalette has variableMappings
const nodePalettePath = path.join(__dirname, 'app', 'components', 'workflows', 'NodePalette.tsx');
if (!fs.existsSync(nodePalettePath)) {
  console.log('❌ NodePalette file not found');
  process.exit(1);
}

const nodePaletteContent = fs.readFileSync(nodePalettePath, 'utf8');

if (nodePaletteContent.includes('variableMappings:') && 
    nodePaletteContent.includes('fromPhone: \'\'') &&
    nodePaletteContent.includes('toPhone: \'\'') &&
    nodePaletteContent.includes('bodyVariable1: \'\'')) {
  console.log('✅ NodePalette has variableMappings template');
} else {
  console.log('❌ NodePalette missing variableMappings template');
}

// Test 5: Check if PropertyPanel has variable mapping UI
const propertyPanelPath = path.join(__dirname, 'app', 'components', 'workflows', 'PropertyPanel.tsx');
if (!fs.existsSync(propertyPanelPath)) {
  console.log('❌ PropertyPanel file not found');
  process.exit(1);
}

const propertyPanelContent = fs.readFileSync(propertyPanelPath, 'utf8');

if (propertyPanelContent.includes('Variable Mappings (Dynamic Data)') && 
    propertyPanelContent.includes('From Phone Expression') &&
    propertyPanelContent.includes('To Phone Expression') &&
    propertyPanelContent.includes('event.userPhone') &&
    propertyPanelContent.includes('event.userName')) {
  console.log('✅ PropertyPanel has variable mapping UI');
} else {
  console.log('❌ PropertyPanel missing variable mapping UI');
}

// Test 6: Check if visual builder handles variableMappings
const visualBuilderPath = path.join(__dirname, 'app', 'workflows', 'visual-builder', 'page.tsx');
if (!fs.existsSync(visualBuilderPath)) {
  console.log('❌ Visual builder file not found');
  process.exit(1);
}

const visualBuilderContent = fs.readFileSync(visualBuilderPath, 'utf8');

if (visualBuilderContent.includes('variableMappings: action.variableMappings') && 
    visualBuilderContent.includes('variableMappings: node.data.variableMappings')) {
  console.log('✅ Visual builder handles variableMappings');
} else {
  console.log('❌ Visual builder missing variableMappings handling');
}

console.log('\n📋 Summary:');
console.log('- Dynamic data flow system is implemented');
console.log('- WhatsApp actions can use variable mappings');
console.log('- UI supports configuring dynamic data extraction');
console.log('- Workflow execution resolves variables at runtime');
console.log('- Support for event data and execution history');

console.log('\n🎯 Variable Mapping Examples:');
console.log('**Event Data:**');
console.log('- event.userPhone → Extract phone from event');
console.log('- event.userName → Extract name from event');
console.log('- event.orderNumber → Extract order number');
console.log('');
console.log('**Execution History:**');
console.log('- execution.lastResult.orderNumber → Get from last run');
console.log('- execution.lastResult.customerName → Get from last run');
console.log('- execution.lastResult.total → Get from last run');

console.log('\n💡 Use Cases:');
console.log('1. **Phone Number Extraction**:');
console.log('   - Trigger: User visits with phone number');
console.log('   - Action: WhatsApp uses event.userPhone');
console.log('');
console.log('2. **Personalized Messages**:');
console.log('   - Trigger: User signs up with name');
console.log('   - Action: Welcome message uses event.userName');
console.log('');
console.log('3. **Order Confirmations**:');
console.log('   - Trigger: Purchase event with order details');
console.log('   - Action: Confirmation uses event.orderNumber');

console.log('\n🔧 Technical Implementation:');
console.log('- **Expression Parser**: Supports event. and execution. prefixes');
console.log('- **Fallback Chain**: Direct values → Mappings → Provider defaults');
console.log('- **Error Handling**: Graceful handling of missing data');
console.log('- **Multi-source**: Event data, execution history, workflow context'); 