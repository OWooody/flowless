'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './enhanced-ui.css';

import TriggerNode from '../../components/workflows/TriggerNode';
import ActionNode from '../../components/workflows/ActionNode';
import ConditionNode from '../../components/workflows/ConditionNode';
import TypeScriptNode from '../../components/workflows/TypeScriptNode';
import NodePalette from '../../components/workflows/NodePalette';
import PropertyPanel from '../../components/workflows/PropertyPanel';

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  typescript: TypeScriptNode,
};

const VisualWorkflowBuilder = ({ editWorkflowId }: { editWorkflowId: string | null }) => {
  const router = useRouter();
  
  // Default trigger node that's always present
  const defaultTriggerNode: Node = {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: {
      label: 'Trigger',
      triggerType: 'webhook',
      webhookUrl: '',
      schedule: '',
    },
    draggable: false, // Make it non-draggable
    deletable: false, // Make it non-deletable
  };
  
  const [nodes, setNodes, onNodesChange] = useNodesState([defaultTriggerNode]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const lastSaveTime = useRef<number>(0);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

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
      triggerAutoSave();
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

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    setSaveStatus('unsaved');
    setShowSaveIndicator(true);
    
    // Clear existing timeout
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    // Set new timeout for auto-save
    autoSaveTimeout.current = setTimeout(() => {
      saveWorkflow(true); // true = auto-save
    }, 2000); // 2 second delay
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for manual save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveWorkflow(false); // false = manual save
      }
      
      // Escape to go back
      if (event.key === 'Escape') {
        router.push('/workflows');
      }
      
      // Ctrl+Z for undo (placeholder for future implementation)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        // TODO: Implement undo functionality
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Auto-save on workflow name change
  useEffect(() => {
    if (workflowName && workflowName.trim()) {
      triggerAutoSave();
    }
  }, [workflowName, triggerAutoSave]);

  // Auto-save on nodes/edges change
  useEffect(() => {
    // Only auto-save if there are actual changes and we have a workflow name
    if ((nodes.length > 0 || edges.length > 0) && workflowName.trim()) {
      triggerAutoSave();
    }
  }, [nodes, edges, workflowName, triggerAutoSave]);

  // Hide save indicator after 3 seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setShowSaveIndicator(false);
        setSaveStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

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
      
      // Always add the default trigger node (non-deletable, non-draggable)
      const triggerNode: Node = {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: workflow.trigger?.data?.label || 'Trigger',
          triggerType: workflow.trigger?.data?.triggerType || 'webhook',
          webhookUrl: workflow.trigger?.data?.webhookUrl || '',
          schedule: workflow.trigger?.data?.schedule || '',
        },
        draggable: false,
        deletable: false,
      };
      workflowNodes.push(triggerNode);
      
      // Add action nodes
      workflow.actions.forEach((action: any, index: number) => {
        const actionId = `action-${index + 1}`;
        
        // Use the action data directly for generic workflow structure
        const nodeData = {
          ...action.data,
          label: action.label || action.type,
        };

        workflowNodes.push({
          id: actionId,
          type: action.type,
          position: action.position || { x: 400 + (index * 350), y: 100 },
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
        id: `${data.type}-${Date.now()}`,
        type: data.type,
        position,
        data: data.data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, nodes]
  );

  const validateWorkflow = () => {
    // Always allow saving if there's a name (we have a default now)
    if (!workflowName.trim()) {
      return false;
    }

    // Trigger is always present, so we only need to check for actions
    const actionNodes = nodes.filter(node => 
      node.type === 'action' || 
      node.type === 'typescript' ||
      node.type === 'condition'
    );

    // Allow saving workflows with or without actions
    return true;
  };

  const saveWorkflow = async (isAutoSave: boolean = false) => {
    if (!validateWorkflow()) return;

    setIsSaving(true);
    setSaveStatus('saving');
    setShowSaveIndicator(true);

    try {
      // Convert nodes and edges to workflow format
      const triggerNode = nodes.find(node => node.type === 'trigger');
      const allActionNodes = nodes.filter(node => 
        node.type === 'action' || 
        node.type === 'typescript' ||
        node.type === 'condition'
      );

      // Build the connected sequence first
      const connectedSequence: Node[] = [];
      const processedNodes = new Set<string>();
      
      // Start from trigger node (always present)
      let currentNodeId = triggerNode?.id;
      
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
          type: triggerNode?.type || 'trigger',
          data: triggerNode?.data || {},
          id: triggerNode?.id,
          position: triggerNode?.position,
          label: triggerNode?.data.label || 'Trigger',
        },
        actions: actionSequence.map(node => {
          // Generic action mapping for new workflow types
          return {
            type: node.type,
            data: node.data,
            id: node.id,
            position: node.position,
            label: node.data.label || node.type,
          };
        }),
      };

      // Debug: Log the workflow data being sent
      console.log('Sending workflow data:', JSON.stringify(workflowData, null, 2));

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
      setSaveStatus('saved');
      lastSaveTime.current = Date.now();
      
      // Only redirect for manual saves, not auto-saves
      if (!isAutoSave) {
        router.push('/workflows');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert(error instanceof Error ? error.message : 'Failed to save workflow');
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
      if (isAutoSave) {
        setShowSaveIndicator(false);
      }
    }
  };

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas? This will remove all nodes and connections.')) {
      setNodes([defaultTriggerNode]);
      setEdges([]);
      setSelectedNode(null);
      setSaveStatus('unsaved'); // Clear save status when canvas is cleared
    }
  };

  return (
    <div className="h-screen w-full flex">
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Palette */}
        <NodePalette />

        {/* Canvas Area with Floating Elements */}
        <div className="flex-1 relative">


          {/* Floating Save Status */}
          {showSaveIndicator && (
            <div className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center space-x-2">
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-700">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">Saved!</span>
                  </>
                )}
                {saveStatus === 'unsaved' && (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700">Unsaved changes</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Floating Workflow Name Input with Back Button */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="relative">
              <input
                type="text"
                placeholder="Untitled Workflow"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-lg"
              />
              <button
                onClick={() => router.push('/workflows')}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-1 shadow-sm hover:bg-white transition-all duration-200"
                title="Back to Workflows (Esc)"
              >
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute bottom-4 right-4 z-50">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => saveWorkflow(false)}
                disabled={isSaving || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                title="Save Workflow (Ctrl+S)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </button>
              
              <button
                onClick={clearCanvas}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
                title="Clear Canvas"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <button
                onClick={() => alert('Keyboard Shortcuts:\n\nCtrl+S: Save workflow\nEsc: Back to workflows\n\nAuto-save is enabled and will save your changes automatically.')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
                title="Keyboard Shortcuts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              </button>
            </div>
          </div>

          {/* React Flow Canvas */}
          <div className="w-full h-full" ref={reactFlowWrapper}>
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