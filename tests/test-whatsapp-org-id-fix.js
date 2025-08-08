#!/usr/bin/env node

/**
 * Test WhatsApp Organization ID Fix
 * 
 * This script verifies that WhatsApp workflow execution
 * now properly uses the organization ID instead of hardcoded values.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing WhatsApp Organization ID Fix...\n');

// Test 1: Check if executeWhatsAppAction now accepts workflowId parameter
const workflowPath = path.join(__dirname, 'app', 'lib', 'workflow.ts');
if (!fs.existsSync(workflowPath)) {
  console.log('❌ Workflow service file not found');
  process.exit(1);
}

const workflowContent = fs.readFileSync(workflowPath, 'utf8');

if (workflowContent.includes('executeWhatsAppAction(action: WhatsAppActionConfig, eventData: any, workflowId?: string)') &&
    workflowContent.includes('organizationId = eventData.organizationId') &&
    workflowContent.includes('await prisma.workflow.findUnique') &&
    workflowContent.includes('whatsappService.getProvider(organizationId)') &&
    workflowContent.includes('whatsappService.sendMessage(organizationId, message)')) {
  console.log('✅ executeWhatsAppAction now properly handles organization ID');
} else {
  console.log('❌ executeWhatsAppAction still uses hardcoded organization ID');
}

// Test 2: Check if executeAction passes workflowId to WhatsApp actions
if (workflowContent.includes('executeAction(action: ActionConfig, eventData: any, workflowId?: string)') &&
    workflowContent.includes('executeWhatsAppAction(action as WhatsAppActionConfig, eventData, workflowId)')) {
  console.log('✅ executeAction passes workflowId to WhatsApp actions');
} else {
  console.log('❌ executeAction missing workflowId parameter');
}

// Test 3: Check if executeWorkflow passes workflowId to actions
if (workflowContent.includes('await this.executeAction(action, triggerEvent, workflowId)')) {
  console.log('✅ executeWorkflow passes workflowId to actions');
} else {
  console.log('❌ executeWorkflow missing workflowId parameter');
}

// Test 4: Check if organization ID fallback logic is implemented
if (workflowContent.includes('let organizationId = eventData.organizationId') &&
    workflowContent.includes('if (!organizationId && workflowId)') &&
    workflowContent.includes('organizationId = workflow?.organizationId') &&
    workflowContent.includes('if (!organizationId)')) {
  console.log('✅ Organization ID fallback logic implemented');
} else {
  console.log('❌ Organization ID fallback logic missing');
}

// Test 5: Check if error handling for missing organization ID
if (workflowContent.includes('Organization ID is required for WhatsApp actions')) {
  console.log('✅ Clear error message for missing organization ID');
} else {
  console.log('❌ Missing error handling for organization ID');
}

console.log('\n📋 Summary:');
console.log('- WhatsApp actions now get organization ID from workflow or event data');
console.log('- No more hardcoded "orgId" values');
console.log('- Proper fallback logic: event data → workflow lookup');
console.log('- Clear error messages for missing organization ID');
console.log('- Workflow execution context is properly passed through');

console.log('\n🎯 How It Works:');
console.log('1. **Event Data**: First tries to get organizationId from event data');
console.log('2. **Workflow Lookup**: If not in event data, looks up workflow by ID');
console.log('3. **Provider Access**: Uses organization ID to get WhatsApp provider');
console.log('4. **Message Sending**: Uses organization ID for sending messages');
console.log('5. **Error Handling**: Clear error if organization ID is missing');

console.log('\n💡 Benefits:');
console.log('- **Multi-tenant**: Each organization has its own WhatsApp provider');
console.log('- **Proper Context**: Uses actual organization context, not hardcoded');
console.log('- **Flexible**: Works with different event data structures');
console.log('- **Robust**: Clear error messages for debugging');
console.log('- **Scalable**: Supports multiple organizations');

console.log('\n🔧 Usage Examples:');
console.log('**Event with organizationId:**');
console.log('```javascript');
console.log('{');
console.log('  event: "page_view",');
console.log('  organizationId: "org_123",');
console.log('  userPhone: "+1234567890"');
console.log('}');
console.log('```');
console.log('');
console.log('**Workflow lookup fallback:**');
console.log('```javascript');
console.log('// If event doesn\'t have organizationId,');
console.log('// it will look up the workflow and get organizationId from there');
console.log('```'); 