'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  ReactFlowProvider,
  OnConnectStartParams,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './enhanced-ui.css';

import TriggerNode from '../../components/workflows/TriggerNode';
import ActionNode from '../../components/workflows/ActionNode';
import PromoCodeNode from '../../components/workflows/PromoCodeNode';
import ConditionNode from '../../components/workflows/ConditionNode';
import SMSNode from '../../components/workflows/SMSNode';
import PersonalizationNode from '../../components/workflows/PersonalizationNode';
import NodePalette from '../../components/workflows/NodePalette';
import PropertyPanel from '../../components/workflows/PropertyPanel';

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  promo_code: PromoCodeNode,
  push_notification: ActionNode,
  whatsapp_message: ActionNode,
  sms_message: SMSNode,
  personalization: PersonalizationNode,
};

const VisualWorkflowBuilder = ({ editWorkflowId }: { editWorkflowId: string | null }) => {
  const router = useRouter();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        style: {
          strokeWidth: 3,
          stroke: '#3b82f6',
        },
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Load existing workflow for editing
  useEffect(() => {
    if (editWorkflowId) {
      loadWorkflow(editWorkflowId);
    }
  }, [editWorkflowId]);

  const loadWorkflow = async (workflowId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow');
      }
      const workflow = await response.json();
      
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      
      // Convert workflow to nodes and edges
      const workflowNodes: Node[] = [];
      const workflowEdges: Edge[] = [];
      
      // Add trigger node
      if (workflow.trigger) {
        workflowNodes.push({
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            eventType: workflow.trigger.eventType,
            eventName: workflow.trigger.filters?.eventName || '',
            filterItemName: workflow.trigger.filters?.itemName || '',
            filterItemCategory: workflow.trigger.filters?.itemCategory || '',
            filterItemId: workflow.trigger.filters?.itemId || '',
            filterValue: workflow.trigger.filters?.value || undefined,
          },
        });
      }
      
      // Add action nodes
      workflow.actions.forEach((action: any, index: number) => {
        const actionId = `action-${index + 1}`;
        
        // Determine node type based on action type
        const nodeType = action.type === 'whatsapp_message' ? 'whatsapp_message' : 
                        action.type === 'promo_code' ? 'promo_code' : 'push_notification';
        
        // Prepare node data based on action type
        let nodeData: any = {
          type: action.type || 'push_notification',
        };

        if (action.type === 'whatsapp_message') {
          // WhatsApp action data
          nodeData = {
            ...nodeData,
            provider: action.provider || 'freshchat',
            templateName: action.templateName || '',
            namespace: action.namespace || '',
            language: action.language || 'ar',
            fromPhone: action.fromPhone || '',
            toPhone: action.toPhone || '',
            bodyVariable1: action.bodyVariable1 || '',
            bodyVariable2: action.bodyVariable2 || '',
            bodyVariable3: action.bodyVariable3 || '',
            buttonVariable: action.buttonVariable || '',
            variableMappings: action.variableMappings || {
              fromPhone: '',
              toPhone: '',
              bodyVariable1: '',
              bodyVariable2: '',
              bodyVariable3: '',
              buttonVariable: '',
            },
          };
        } else if (action.type === 'promo_code') {
          // Promo code action data
          nodeData = {
            ...nodeData,
            batchId: action.batchId || '',
            batchName: action.batchName || '',
            outputVariable: action.outputVariable || 'promoCode',
            codeType: action.codeType || 'random',
            specificCode: action.specificCode || '',
          };
        } else {
          // Push notification action data
          nodeData = {
            ...nodeData,
            title: action.title || '',
            body: action.body || '',
            targetUsers: action.targetUsers || 'all',
            segmentId: action.segmentId || '',
            userIds: Array.isArray(action.userIds) ? action.userIds.join(', ') : action.userIds || '',
          };
        }

        workflowNodes.push({
          id: actionId,
          type: nodeType,
          position: { x: 400 + (index * 350), y: 100 },
          data: nodeData,
        });
        
        // Add edges to connect nodes in sequence
        if (index === 0) {
          // Connect trigger to first action
          workflowEdges.push({
            id: `edge-trigger-to-${actionId}`,
            source: 'trigger-1',
            target: actionId,
            type: 'smoothstep',
            style: {
              strokeWidth: 3,
              stroke: '#3b82f6',
            },
            animated: true,
          });
        } else {
          // Connect previous action to current action
          const previousActionId = `action-${index}`;
          workflowEdges.push({
            id: `edge-${previousActionId}-to-${actionId}`,
            source: previousActionId,
            target: actionId,
            type: 'smoothstep',
            style: {
              strokeWidth: 3,
              stroke: '#3b82f6',
            },
            animated: true,
          });
        }
      });
      
      console.log('Loading workflow:', {
        name: workflow.name,
        nodes: workflowNodes.length,
        edges: workflowEdges.length,
        actions: workflow.actions.length,
        actionSequence: workflow.actions.map((action: any, index: number) => `${index}: ${action.type}`)
      });
      
      setNodes(workflowNodes);
      setEdges(workflowEdges);
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert('Failed to load workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const data = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      // Calculate position based on existing nodes
      let position = { x: 400, y: 100 }; // Default position

      if (nodes.length > 0) {
        // Find the rightmost node to position the new node next to it
        const rightmostNode = nodes.reduce((rightmost, current) => {
          return (current.position.x > rightmost.position.x) ? current : rightmost;
        });

        // Position the new node to the right of the rightmost node
        position = {
          x: rightmostNode.position.x + 350, // 350px spacing (same as loadWorkflow)
          y: rightmostNode.position.y
        };
      }

      const newNode: Node = {
        id: `${data.nodeType}-${Date.now()}`,
        type: data.nodeType,
        position,
        data: data.data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, nodes]
  );

  const validateWorkflow = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return false;
    }

    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    const actionNodes = nodes.filter(node => 
      node.type === 'push_notification' || 
      node.type === 'whatsapp_message' || 
      node.type === 'promo_code' ||
      node.type === 'condition'
    );

    if (triggerNodes.length === 0) {
      alert('Please add at least one trigger node');
      return false;
    }

    if (actionNodes.length === 0) {
      alert('Please add at least one action node');
      return false;
    }

    // Check if nodes are connected
    if (edges.length === 0) {
      alert('Please connect the trigger to at least one action');
      return false;
    }

    return true;
  };

  const saveWorkflow = async () => {
    if (!validateWorkflow()) return;

    setIsSaving(true);

    try {
      // Convert nodes and edges to workflow format
      const triggerNodes = nodes.filter(node => node.type === 'trigger');
      const allActionNodes = nodes.filter(node => 
        node.type === 'push_notification' || 
        node.type === 'whatsapp_message' || 
        node.type === 'promo_code' ||
        node.type === 'condition'
      );

      // Build the connected sequence first
      const connectedSequence: Node[] = [];
      const processedNodes = new Set<string>();
      
      // Start from trigger node
      let currentNodeId = triggerNodes[0]?.id;
      
      // Follow the connections to build the connected sequence
      while (currentNodeId && !processedNodes.has(currentNodeId)) {
        processedNodes.add(currentNodeId);
        
        // Find edges that start from current node
        const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
        
        if (outgoingEdges.length > 0) {
          // Take the first outgoing edge (assuming single flow)
          const nextEdge = outgoingEdges[0];
          const nextNode = nodes.find(node => node.id === nextEdge.target);
          
          if (nextNode && nextNode.type !== 'trigger') {
            // Add the action to connected sequence
            connectedSequence.push(nextNode);
            currentNodeId = nextNode.id;
          } else {
            break; // No more actions to process
          }
        } else {
          break; // No outgoing edges
        }
      }

      // Find disconnected nodes (nodes not in the connected sequence)
      const disconnectedNodes = allActionNodes.filter(node => 
        !connectedSequence.find(connected => connected.id === node.id)
      );

      // Combine connected and disconnected nodes
      const actionSequence = [...connectedSequence, ...disconnectedNodes];

      // Log information about what's being saved
      console.log('Saving workflow with:', {
        connectedNodes: connectedSequence.length,
        disconnectedNodes: disconnectedNodes.length,
        totalNodes: actionSequence.length,
        disconnectedNodeTypes: disconnectedNodes.map(node => node.type)
      });

      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        trigger: {
          eventType: triggerNodes[0]?.data.eventType || 'engagement',
          filters: {
            eventName: triggerNodes[0]?.data.eventName || undefined,
            itemName: triggerNodes[0]?.data.filterItemName || undefined,
            itemCategory: triggerNodes[0]?.data.filterItemCategory || undefined,
            itemId: triggerNodes[0]?.data.filterItemId || undefined,
            value: triggerNodes[0]?.data.filterValue || undefined,
          },
        },
        actions: actionSequence.map(node => {
          if (node.data.type === 'whatsapp_message') {
            // WhatsApp action
            return {
              type: node.data.type,
              provider: node.data.provider,
              templateName: node.data.templateName,
              namespace: node.data.namespace,
              language: node.data.language,
              fromPhone: node.data.fromPhone,
              toPhone: node.data.toPhone,
              bodyVariable1: node.data.bodyVariable1,
              bodyVariable2: node.data.bodyVariable2,
              bodyVariable3: node.data.bodyVariable3,
              buttonVariable: node.data.buttonVariable,
              variableMappings: node.data.variableMappings,
            };
          } else if (node.data.type === 'promo_code') {
            // Promo code action
            return {
              type: node.data.type,
              batchId: node.data.batchId,
              batchName: node.data.batchName,
              outputVariable: node.data.outputVariable,
              codeType: node.data.codeType,
              specificCode: node.data.specificCode,
            };
          } else if (node.data.type === 'condition') {
            // Condition action
            return {
              type: node.data.type,
              conditionType: node.data.conditionType,
              leftOperand: node.data.leftOperand,
              rightOperand: node.data.rightOperand,
              description: node.data.description,
            };
          } else {
            // Push notification action
            return {
              type: node.data.type,
              title: node.data.title,
              body: node.data.body,
              targetUsers: node.data.targetUsers,
              userIds: (() => {
                const userIds = node.data.userIds;
                if (!userIds) return undefined;
                if (Array.isArray(userIds)) return userIds.filter(id => id && id.trim());
                if (typeof userIds === 'string' && userIds.trim()) {
                  return userIds.split(',').map((id: string) => id.trim()).filter(Boolean);
                }
                return undefined;
              })(),
            };
          }
        }),
      };

      const url = editWorkflowId ? `/api/workflows/${editWorkflowId}` : '/api/workflows';
      const method = editWorkflowId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editWorkflowId ? 'update' : 'create'} workflow`);
      }

      const workflow = await response.json();
      router.push('/workflows');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert(error instanceof Error ? error.message : 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas? This will remove all nodes and connections.')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/workflows')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {editWorkflowId ? 'Edit Workflow' : 'Visual Workflow Builder'}
              </h1>
              <p className="text-sm text-gray-600">
                {editWorkflowId ? 'Modify your existing workflow' : 'Drag and drop to create your workflow'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Workflow name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={clearCanvas}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear
            </button>
            <button
              onClick={saveWorkflow}
              disabled={isSaving || isLoading}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isLoading ? 'Loading...' : editWorkflowId ? 'Update Workflow' : 'Save Workflow'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Palette */}
        <NodePalette />

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        {/* Property Panel */}
        <PropertyPanel selectedNode={selectedNode} />
      </div>
    </div>
  );
};

// Component that uses useSearchParams (wrapped in Suspense)
const VisualWorkflowBuilderWithParams = () => {
  const searchParams = useSearchParams();
  const editWorkflowId = searchParams.get('edit');
  
  return <VisualWorkflowBuilder editWorkflowId={editWorkflowId} />;
};

// Wrap with ReactFlowProvider and Suspense
const VisualWorkflowBuilderWrapper = () => (
  <ReactFlowProvider>
    <Suspense fallback={<div>Loading...</div>}>
      <VisualWorkflowBuilderWithParams />
    </Suspense>
  </ReactFlowProvider>
);

export default VisualWorkflowBuilderWrapper; 