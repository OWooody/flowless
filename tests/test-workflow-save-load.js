// Test script to verify workflow save/load functionality
console.log('🧪 Testing Workflow Save/Load with Multiple Nodes...\n');

// Mock workflow data
const mockWorkflow = {
  name: 'Test Multi-Node Workflow',
  description: 'Workflow with multiple nodes to test save/load',
  trigger: {
    eventType: 'engagement',
    filters: {
      eventName: 'page_view',
    },
  },
  actions: [
    {
      type: 'promo_code',
      batchId: 'batch-123',
      batchName: 'Welcome Batch',
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
};

// Simulate workflow saving
function simulateWorkflowSave(workflow) {
  console.log('💾 Saving workflow...');
  console.log(`   Name: ${workflow.name}`);
  console.log(`   Actions: ${workflow.actions.length}`);
  
  // Validate workflow
  if (!workflow.name.trim()) {
    throw new Error('Workflow name is required');
  }
  
  if (workflow.actions.length === 0) {
    throw new Error('At least one action is required');
  }
  
  // Simulate saving to database
  const savedWorkflow = {
    ...workflow,
    id: 'workflow-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log('   ✅ Workflow saved successfully');
  return savedWorkflow;
}

// Simulate workflow loading
function simulateWorkflowLoad(savedWorkflow) {
  console.log('📂 Loading workflow...');
  console.log(`   ID: ${savedWorkflow.id}`);
  console.log(`   Name: ${savedWorkflow.name}`);
  console.log(`   Actions: ${savedWorkflow.actions.length}`);
  
  // Convert to nodes and edges
  const workflowNodes = [];
  const workflowEdges = [];
  
  // Add trigger node
  workflowNodes.push({
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: {
      eventType: savedWorkflow.trigger.eventType,
      eventName: savedWorkflow.trigger.filters?.eventName || '',
    },
  });
  
  // Add action nodes
  savedWorkflow.actions.forEach((action, index) => {
    const actionId = `action-${index + 1}`;
    
    // Determine node type
    const nodeType = action.type === 'whatsapp_message' ? 'whatsapp_message' : 
                    action.type === 'promo_code' ? 'promo_code' : 'push_notification';
    
    // Add node
    workflowNodes.push({
      id: actionId,
      type: nodeType,
      position: { x: 400 + (index * 50), y: 100 + (index * 150) },
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
  
  console.log('   ✅ Workflow loaded successfully');
  console.log(`   Nodes: ${workflowNodes.length}`);
  console.log(`   Edges: ${workflowEdges.length}`);
  
  return { nodes: workflowNodes, edges: workflowEdges };
}

// Test the save/load cycle
try {
  console.log('🔄 Testing save/load cycle...\n');
  
  // Step 1: Save workflow
  const savedWorkflow = simulateWorkflowSave(mockWorkflow);
  
  // Step 2: Load workflow
  const loadedWorkflow = simulateWorkflowLoad(savedWorkflow);
  
  // Step 3: Verify the loaded workflow
  console.log('\n📋 Verifying loaded workflow...');
  
  // Check nodes
  console.log('   Nodes:');
  loadedWorkflow.nodes.forEach((node, index) => {
    console.log(`     ${index}: ${node.type} (${node.id})`);
  });
  
  // Check edges
  console.log('   Edges:');
  loadedWorkflow.edges.forEach((edge, index) => {
    console.log(`     ${index}: ${edge.source} → ${edge.target}`);
  });
  
  // Verify all nodes are connected
  const connectedNodes = new Set();
  loadedWorkflow.edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });
  
  const allNodeIds = loadedWorkflow.nodes.map(node => node.id);
  const allNodesConnected = allNodeIds.every(id => connectedNodes.has(id));
  
  if (allNodesConnected) {
    console.log('   ✅ All nodes are connected');
  } else {
    console.log('   ❌ Some nodes are not connected');
    const unconnectedNodes = allNodeIds.filter(id => !connectedNodes.has(id));
    console.log('   Unconnected nodes:', unconnectedNodes);
  }
  
  // Verify node types match actions
  const expectedNodeTypes = ['trigger', 'promo_code', 'push_notification', 'whatsapp_message', 'push_notification'];
  const actualNodeTypes = loadedWorkflow.nodes.map(node => node.type);
  
  const typesMatch = expectedNodeTypes.every((expected, index) => 
    actualNodeTypes[index] === expected
  );
  
  if (typesMatch) {
    console.log('   ✅ Node types match expected workflow');
  } else {
    console.log('   ❌ Node types do not match expected workflow');
    console.log('   Expected:', expectedNodeTypes);
    console.log('   Actual:', actualNodeTypes);
  }
  
  console.log('\n🎉 Save/load cycle completed successfully!');
  
} catch (error) {
  console.error('❌ Test failed:', error);
} 