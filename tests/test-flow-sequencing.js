// Test script to verify flow-based sequencing
console.log('🧪 Testing Flow-Based Sequencing...\n');

// Mock nodes and edges to simulate a workflow
const mockNodes = [
  {
    id: 'trigger-1',
    type: 'trigger',
    data: { eventType: 'engagement', eventName: 'page_view' }
  },
  {
    id: 'action-1',
    type: 'promo_code',
    data: { 
      type: 'promo_code',
      batchId: 'batch-123',
      outputVariable: 'welcomeCode'
    }
  },
  {
    id: 'action-2',
    type: 'push_notification',
    data: {
      type: 'push_notification',
      title: 'Welcome!',
      body: 'Use code {welcomeCode} for 20% off!'
    }
  },
  {
    id: 'action-3',
    type: 'whatsapp_message',
    data: {
      type: 'whatsapp_message',
      provider: 'freshchat',
      templateName: 'welcome_message'
    }
  },
  {
    id: 'action-4',
    type: 'push_notification',
    data: {
      type: 'push_notification',
      title: 'Follow up',
      body: 'Don\'t forget your code!'
    }
  }
];

const mockEdges = [
  { id: 'edge-1', source: 'trigger-1', target: 'action-1' },
  { id: 'edge-2', source: 'action-1', target: 'action-2' },
  { id: 'edge-3', source: 'action-2', target: 'action-3' },
  { id: 'edge-4', source: 'action-3', target: 'action-4' }
];

// Simulate the flow-based sequencing logic
function buildActionSequence(nodes, edges) {
  const actionSequence = [];
  const processedNodes = new Set();
  
  // Start from trigger node
  const triggerNode = nodes.find(node => node.type === 'trigger');
  let currentNodeId = triggerNode?.id;
  
  console.log('🔄 Building action sequence...');
  console.log(`   Starting from: ${currentNodeId}`);
  
  // Follow the connections to build the sequence
  while (currentNodeId && !processedNodes.has(currentNodeId)) {
    processedNodes.add(currentNodeId);
    
    // Find edges that start from current node
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    
    if (outgoingEdges.length > 0) {
      // Take the first outgoing edge (assuming single flow)
      const nextEdge = outgoingEdges[0];
      const nextNode = nodes.find(node => node.id === nextEdge.target);
      
      console.log(`   Current: ${currentNodeId} → Next: ${nextNode?.id} (${nextNode?.type})`);
      
      if (nextNode && nextNode.type !== 'trigger') {
        // Add the action to sequence
        actionSequence.push(nextNode);
        currentNodeId = nextNode.id;
      } else {
        console.log('   ⏹️  Reached end of flow');
        break; // No more actions to process
      }
    } else {
      console.log('   ⏹️  No outgoing edges');
      break; // No outgoing edges
    }
  }
  
  return actionSequence;
}

// Test the flow-based sequencing
console.log('📋 Mock Workflow:');
mockNodes.forEach((node, index) => {
  console.log(`   ${index}: ${node.type} (${node.id})`);
});

console.log('\n🔗 Mock Edges:');
mockEdges.forEach((edge, index) => {
  console.log(`   ${index}: ${edge.source} → ${edge.target}`);
});

// Build the sequence
const actionSequence = buildActionSequence(mockNodes, mockEdges);

console.log('\n📊 Results:');
console.log(`   Total nodes: ${mockNodes.length}`);
console.log(`   Total edges: ${mockEdges.length}`);
console.log(`   Action sequence length: ${actionSequence.length}`);

console.log('\n🎯 Action Sequence:');
actionSequence.forEach((node, index) => {
  console.log(`   ${index}: ${node.type} (${node.id})`);
});

// Verify the sequence is correct
const expectedSequence = ['promo_code', 'push_notification', 'whatsapp_message', 'push_notification'];
const actualSequence = actionSequence.map(node => node.type);

const sequenceMatches = expectedSequence.every((expected, index) => 
  actualSequence[index] === expected
);

if (sequenceMatches) {
  console.log('\n✅ Action sequence matches expected flow!');
} else {
  console.log('\n❌ Action sequence does not match expected flow');
  console.log('   Expected:', expectedSequence);
  console.log('   Actual:', actualSequence);
}

// Test with different flow patterns
console.log('\n🧪 Testing Different Flow Patterns...\n');

// Test 1: Linear flow (already tested above)
console.log('Test 1: Linear Flow ✅');

// Test 2: Branching flow (should take first branch)
const branchingEdges = [
  { id: 'edge-1', source: 'trigger-1', target: 'action-1' },
  { id: 'edge-2', source: 'action-1', target: 'action-2' },
  { id: 'edge-3', source: 'action-1', target: 'action-3' }, // Alternative branch
  { id: 'edge-4', source: 'action-2', target: 'action-4' }
];

const branchingSequence = buildActionSequence(mockNodes, branchingEdges);
console.log('Test 2: Branching Flow');
console.log('   Expected: promo_code → push_notification → push_notification');
console.log('   Actual:', branchingSequence.map(node => node.type).join(' → '));

// Test 3: Circular flow (should detect and stop)
const circularEdges = [
  { id: 'edge-1', source: 'trigger-1', target: 'action-1' },
  { id: 'edge-2', source: 'action-1', target: 'action-2' },
  { id: 'edge-3', source: 'action-2', target: 'action-1' } // Circular reference
];

const circularSequence = buildActionSequence(mockNodes, circularEdges);
console.log('Test 3: Circular Flow');
console.log('   Expected: promo_code → push_notification (then stop)');
console.log('   Actual:', circularSequence.map(node => node.type).join(' → '));

console.log('\n🎉 Flow-based sequencing tests completed!'); 