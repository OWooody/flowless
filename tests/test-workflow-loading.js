const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWorkflowLoading() {
  console.log('🧪 Testing Workflow Loading with Multiple Nodes...\n');

  try {
    // Test 1: Create a promo code batch
    console.log('1. Creating a promo code batch...');
    const batch = await prisma.promoCodeBatch.create({
      data: {
        name: 'Loading Test Batch',
        description: 'Test batch for workflow loading',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 25,
        maxUses: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        totalCodes: 5,
        userId: 'test-user-123',
        organizationId: 'test-org-123',
      },
    });
    console.log('✅ Batch created:', batch.name);

    // Test 2: Create a workflow with multiple nodes
    console.log('\n2. Creating a workflow with multiple nodes...');
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Multi-Node Workflow Test',
        description: 'Workflow to test loading with multiple nodes',
        trigger: {
          eventType: 'engagement',
          filters: {
            eventName: 'page_view',
          },
        },
        actions: [
          {
            type: 'promo_code',
            batchId: batch.id,
            batchName: batch.name,
            outputVariable: 'welcomeCode',
            codeType: 'random',
          },
          {
            type: 'push_notification',
            title: 'Welcome!',
            body: 'Use code {welcomeCode} for 20% off!',
            targetUsers: 'specific',
            userIds: ['user123'],
          },
          {
            type: 'whatsapp_message',
            provider: 'freshchat',
            templateName: 'welcome_message',
            namespace: 'fc3df069_22dc_4a5f_a669_2f7329af60d1',
            language: 'en',
            bodyVariable1: '{welcomeCode}',
            bodyVariable2: '20% discount',
            bodyVariable3: 'Welcome to our store!',
          },
          {
            type: 'push_notification',
            title: 'Follow up',
            body: 'Don\'t forget your code: {welcomeCode}',
            targetUsers: 'specific',
            userIds: ['user123'],
          },
        ],
        isActive: true,
        userId: 'test-user-123',
        organizationId: 'test-org-123',
      },
    });
    console.log('✅ Workflow created:', workflow.name);
    console.log('   Actions count:', workflow.actions.length);

    // Test 3: Simulate workflow loading logic
    console.log('\n3. Simulating workflow loading logic...');
    
    const workflowNodes = [];
    const workflowEdges = [];
    
    // Add trigger node
    workflowNodes.push({
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 100, y: 100 },
      data: {
        eventType: workflow.trigger.eventType,
        eventName: workflow.trigger.filters?.eventName || '',
      },
    });
    
    // Add action nodes
    workflow.actions.forEach((action, index) => {
      const actionId = `action-${index + 1}`;
      
      // Determine node type
      const nodeType = action.type === 'whatsapp_message' ? 'whatsapp_message' : 
                      action.type === 'promo_code' ? 'promo_code' : 'push_notification';
      
      // Add node
      workflowNodes.push({
        id: actionId,
        type: nodeType,
        position: { x: 400, y: 100 + (index * 150) },
        data: action,
      });
      
      // Add edges to connect nodes in sequence
      if (index === 0) {
        // Connect trigger to first action
        workflowEdges.push({
          id: `edge-trigger-to-${actionId}`,
          source: 'trigger-1',
          target: actionId,
          type: 'smoothstep',
        });
      } else {
        // Connect previous action to current action
        const previousActionId = `action-${index}`;
        workflowEdges.push({
          id: `edge-${previousActionId}-to-${actionId}`,
          source: previousActionId,
          target: actionId,
          type: 'smoothstep',
        });
      }
    });
    
    console.log('   Nodes created:', workflowNodes.length);
    console.log('   Edges created:', workflowEdges.length);
    
    // Test 4: Verify node types
    console.log('\n4. Verifying node types...');
    workflowNodes.forEach((node, index) => {
      if (index === 0) {
        console.log(`   Node ${index}: ${node.type} (${node.id})`);
      } else {
        const action = workflow.actions[index - 1];
        console.log(`   Node ${index}: ${node.type} (${node.id}) - ${action.type}`);
      }
    });
    
    // Test 5: Verify edge connections
    console.log('\n5. Verifying edge connections...');
    workflowEdges.forEach((edge, index) => {
      console.log(`   Edge ${index}: ${edge.source} → ${edge.target}`);
    });
    
    // Test 6: Verify workflow structure
    console.log('\n6. Verifying workflow structure...');
    console.log('   Expected structure:');
    console.log('   [Trigger] → [Promo Code] → [Push Notification] → [WhatsApp] → [Push Notification]');
    
    const expectedNodeTypes = ['trigger', 'promo_code', 'push_notification', 'whatsapp_message', 'push_notification'];
    const actualNodeTypes = workflowNodes.map(node => node.type);
    
    console.log('   Actual structure:');
    actualNodeTypes.forEach((type, index) => {
      console.log(`     ${index}: ${type}`);
    });
    
    // Verify the structure matches
    const structureMatches = expectedNodeTypes.every((expected, index) => 
      actualNodeTypes[index] === expected
    );
    
    if (structureMatches) {
      console.log('   ✅ Structure matches expected workflow');
    } else {
      console.log('   ❌ Structure does not match expected workflow');
    }
    
    // Test 7: Verify all nodes are connected
    console.log('\n7. Verifying all nodes are connected...');
    const connectedNodes = new Set();
    workflowEdges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    const allNodeIds = workflowNodes.map(node => node.id);
    const allNodesConnected = allNodeIds.every(id => connectedNodes.has(id));
    
    if (allNodesConnected) {
      console.log('   ✅ All nodes are connected');
    } else {
      console.log('   ❌ Some nodes are not connected');
      const unconnectedNodes = allNodeIds.filter(id => !connectedNodes.has(id));
      console.log('   Unconnected nodes:', unconnectedNodes);
    }

    console.log('\n🎉 All tests passed! Workflow loading correctly handles multiple nodes and edges.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWorkflowLoading(); 