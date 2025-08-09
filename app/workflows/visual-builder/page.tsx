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
import { WorkflowProvider } from '../../components/workflows/WorkflowContext';

// Simple loader component for when nodes are being loaded
const WorkflowLoader = ({ isLoading }: { isLoading: boolean }) => (
  <div className="absolute inset-0 z-40 pointer-events-none">
    {/* Loading overlay */}
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
    
    {/* Loading content */}
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="flex items-center space-x-3 bg-white rounded-xl px-6 py-3 shadow-lg border border-gray-200">
        {/* Spinning loader */}
        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        
        {/* Loading text */}
        <div className="text-sm font-medium text-gray-700">
          {isLoading ? 'Loading workflow...' : 'Preparing canvas...'}
        </div>
      </div>
    </div>
  </div>
);

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  typescript: TypeScriptNode,
};

const VisualWorkflowBuilder = ({ editWorkflowId }: { editWorkflowId: string | null }) => {
  const router = useRouter();
  
  console.log('VisualWorkflowBuilder - editWorkflowId:', editWorkflowId);
  
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
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastExecutionResult, setLastExecutionResult] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const lastSaveTime = useRef<number>(0);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedWorkflow = useRef<boolean>(false);

  // onConnectStart and onConnectEnd - REMOVED (no longer needed without node palette)

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
      // setShowNodePalette(false); // REMOVED
      // setConnectionStart(null); // REMOVED
      // Auto-save disabled
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: any, node: Node) => {
    // Node click handling removed - properties will be edited directly in nodes
  }, []);

  const onPaneClick = useCallback(() => {
    // Pane click handling removed - no need to deselect nodes
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Auto-save functionality - DISABLED for now
  const triggerAutoSave = useCallback(() => {
    // Auto-save disabled - only manual saves
  }, []);

  // Keyboard shortcuts - REMOVED
  // useEffect(() => {
  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     // Ctrl+S or Cmd+S for manual save
  //     if ((event.ctrlKey || event.metaKey) && event.key === 's') {
  //       event.preventDefault();
  //       saveWorkflow();
  //     }
  //     
  //     // Escape to go back
  //     if (event.key === 'Escape') {
  //       router.push('/workflows');
  //     }
  //     
  //     // Ctrl+Z for undo (placeholder for future implementation)
  //     if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
  //       event.preventDefault();
  //       // TODO: Implement undo functionality
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [router]);

  // Auto-save disabled - only manual saves

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

  const loadWorkflow = useCallback(async (workflowId: string) => {
    console.log('loadWorkflow called with:', workflowId);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow');
      }
      const workflow = await response.json();
      
      console.log('Workflow data received:', workflow);
      
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
        // Use the original node ID from the saved data
        const actionId = action.id || `action-${index + 1}`;
        
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
        
        // Don't automatically create edges - let users connect nodes manually
        // This preserves the original workflow structure without assumptions
      });
      
      // Restore saved edges if they exist
      if (workflow.edges && Array.isArray(workflow.edges)) {
        workflow.edges.forEach((edge: any) => {
          workflowEdges.push({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type || 'smoothstep',
            style: edge.style || {
              strokeWidth: 3,
              stroke: '#3b82f6',
            },
            animated: edge.animated !== undefined ? edge.animated : true,
          });
        });
      }
      
      console.log('Loading workflow:', {
        name: workflow.name,
        nodes: workflowNodes.length,
        edges: workflowEdges.length,
        actions: workflow.actions.length,
        actionSequence: workflow.actions.map((action: any, index: number) => `${index}: ${action.type}`),
        savedEdges: workflow.edges?.length || 0,
        workflowData: workflow
      });
      
      console.log('WorkflowNodes to be set:', workflowNodes);
      console.log('WorkflowEdges to be set:', workflowEdges);
      
      // Set all nodes and edges at once when loading is complete
      setNodes(workflowNodes);
      setEdges(workflowEdges);
      setLastExecutionResult(null); // Clear any previous execution results
      
      console.log('Workflow loading completed');
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert('Failed to load workflow');
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  // Load existing workflow for editing or create new workflow
  useEffect(() => {
    // Reset the flag when editWorkflowId changes
    hasLoadedWorkflow.current = false;
    
    if (editWorkflowId && !hasLoadedWorkflow.current) {
      console.log('Loading workflow with ID:', editWorkflowId);
      hasLoadedWorkflow.current = true;
      setIsLoading(true);
      loadWorkflow(editWorkflowId);
    } else if (!editWorkflowId && !hasLoadedWorkflow.current) {
      // For new workflows, add the default trigger node
      console.log('Creating new workflow with default trigger');
      hasLoadedWorkflow.current = true;
      setIsLoading(true);
      setNodes([defaultTriggerNode]);
      setIsLoading(false);
    }
  }, [editWorkflowId, loadWorkflow]);

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

  const addNodeFromPalette = useCallback(
    (nodeType: string, nodeData: any, connectToNode?: Node) => {
      let position = { x: 400, y: 200 }; // Default position

      if (connectToNode) {
        // Position the new node near the connection start
        position = {
          x: connectToNode.position.x + 300,
          y: connectToNode.position.y,
        };
      } else if (nodes.length > 0) {
        // Find the rightmost node to position the new node next to it
        const rightmostNode = nodes.reduce((rightmost, current) => {
          return (current.position.x > rightmost.position.x) ? current : rightmost;
        });

        // Position the new node to the right of the rightmost node
        position = {
          x: rightmostNode.position.x + 350,
          y: rightmostNode.position.y
        };
      }

      // Generate unique label for the new node
      const baseLabel = nodeData.label || nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
      let uniqueLabel = baseLabel;
      let counter = 1;
      
      // Check if label already exists and append number if needed
      while (nodes.some(node => node.data.label === uniqueLabel)) {
        uniqueLabel = `${baseLabel}${counter}`;
        counter++;
      }

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { ...nodeData, label: uniqueLabel },
      };

      setNodes((nds) => nds.concat(newNode));

      // Create connection if we have a start node
      if (connectToNode) {
        const newEdge = {
          id: `edge-${connectToNode.id}-${newNode.id}`,
          source: connectToNode.id,
          target: newNode.id,
          type: 'smoothstep',
          style: {
            strokeWidth: 3,
            stroke: '#3b82f6',
          },
          animated: true,
        };

        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [nodes, setNodes, setEdges]
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

  const saveWorkflow = async () => {
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

      // Simply save all action nodes - don't worry about connections for now
      const actionSequence = allActionNodes;

      // Log information about what's being saved
      console.log('Saving workflow with:', {
        totalActionNodes: allActionNodes.length,
        actionNodeTypes: allActionNodes.map(node => node.type),
        actionNodeIds: allActionNodes.map(node => node.id),
        totalEdges: edges.length,
        edgeConnections: edges.map(edge => `${edge.source} -> ${edge.target}`)
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
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          style: edge.style,
          animated: edge.animated,
        })),
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
      
      // If this was a new workflow (no editWorkflowId), update the URL to include the workflow ID
      if (!editWorkflowId && workflow.id) {
        console.log('New workflow created, updating URL with ID:', workflow.id);
        router.replace(`/workflows/visual-builder?edit=${workflow.id}`);
      }
      
      // Don't redirect - stay on the canvas after saving
      // This allows users to continue working on their workflow
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert(error instanceof Error ? error.message : 'Failed to save workflow');
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
    }
  };



  const runWorkflow = async () => {
    if (!editWorkflowId) {
      alert('Please save the workflow first before running it.');
      return;
    }

    setIsRunning(true);
    setLastExecutionResult(null); // Clear previous execution result
    
    try {
      // Create a test event for the workflow
      const testEvent = {
        name: 'manual_test_event',
        category: 'engagement',
        itemName: 'test_item',
        itemCategory: 'test_category',
        value: 100,
        userId: 'test_user',
        organizationId: 'test_org',
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`/api/workflows/${editWorkflowId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEvent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run workflow');
      }

      const result = await response.json();
      
      // Store the execution result
      setLastExecutionResult(result.result);
      
      // Show success message with execution details
      const successMessage = `Workflow executed successfully!

Execution ID: ${result.result.executionId}
Duration: ${result.result.totalDurationMs || 'N/A'}ms
Actions executed: ${result.result.actionResults?.length || 0}

Check the execution history for detailed results.`;
      
      alert(successMessage);
      
    } catch (error) {
      console.error('Error running workflow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to run workflow';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas? This will remove all nodes and connections.')) {
      setNodes([defaultTriggerNode]);
      setEdges([]);
      setSaveStatus('unsaved'); // Clear save status when canvas is cleared
      setLastExecutionResult(null); // Clear execution result when canvas is cleared
    }
  };

  return (
    <div className="h-screen w-full flex">
      {/* Main Content */}
      <div className="flex-1 flex">
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

          {/* Floating Execution Status */}
          {isRunning && (
            <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm border border-green-200 rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-green-700 font-medium">Executing workflow...</span>
              </div>
            </div>
          )}

          {/* Floating Execution Result */}
          {lastExecutionResult && !isRunning && (
            <div className="absolute top-20 left-4 z-50 bg-white/90 backdrop-blur-sm border border-green-200 rounded-lg px-4 py-3 shadow-lg max-w-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Execution Complete</span>
                  <button
                    onClick={() => setLastExecutionResult(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>ID: {lastExecutionResult.executionId}</div>
                  <div>Duration: {lastExecutionResult.totalDurationMs || 'N/A'}ms</div>
                  <div>Actions: {lastExecutionResult.actionResults?.length || 0}</div>
                </div>
                <button
                  onClick={() => router.push(`/workflows/${editWorkflowId}/executions`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  View Execution History
                </button>
              </div>
            </div>
          )}

          {/* Floating Workflow Name Input with Back Button and Icon */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center space-x-3">
              {/* Back Button */}
              <button
                onClick={() => router.push('/workflows')}
                className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-sm hover:bg-white transition-all duration-200"
                title="Back to Workflows (Esc)"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Workflow Name Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Untitled Workflow"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-lg"
                />
                {/* Workflow Status Indicator */}
                {editWorkflowId && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                    Ready to Run
                  </div>
                )}
              </div>

              {/* Node Type Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => addNodeFromPalette('action', { label: 'Action', actionType: 'http_request' })}
                  className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-white transition-all duration-200 flex items-center space-x-2 shadow-sm"
                  title="Add Action Node"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Action</span>
                </button>
                
                <button
                  onClick={() => addNodeFromPalette('condition', { 
                    label: 'Condition',
                    condition: '// Write your condition here\n// Return true or false\nif (event.user.age >= 18) return true;\nreturn false;'
                  })}
                  className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-white transition-all duration-200 flex items-center space-x-2 shadow-sm"
                  title="Add Condition Node"
                >
                  <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Condition</span>
                </button>
                
                <button
                  onClick={() => addNodeFromPalette('typescript', { label: 'Code', code: '' })}
                  className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-white transition-all duration-200 flex items-center space-x-2 shadow-sm"
                  title="Add Code Node"
                >
                  <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute bottom-4 right-4 z-50">
            <div className="flex flex-col space-y-2">
              {/* Run Workflow Button */}
              <button
                onClick={() => runWorkflow()}
                disabled={isRunning || isLoading || !editWorkflowId}
                className={`rounded-full p-3 shadow-lg transition-all duration-200 ${
                  !editWorkflowId 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-xl'
                } text-white disabled:opacity-50`}
                title={!editWorkflowId ? "Save workflow first to run it" : "Run Workflow"}
              >
                {isRunning ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => saveWorkflow()}
                disabled={isSaving || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                title="Save Workflow"
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

              {/* Keyboard shortcuts button - REMOVED */}
            </div>
          </div>

          {/* Floating Node Palette */}
          {/* REMOVED */}

          {/* React Flow Canvas */}
          <div className="w-full h-full" ref={reactFlowWrapper}>
            {isLoading && <WorkflowLoader isLoading={isLoading} />}
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
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </div>


      </div>


    </div>
  );
};

// Component that uses useSearchParams (wrapped in Suspense)
const VisualWorkflowBuilderWithParams = () => {
  const searchParams = useSearchParams();
  const editWorkflowId = searchParams.get('edit');
  
  console.log('VisualWorkflowBuilderWithParams - editWorkflowId:', editWorkflowId);
  
  return <VisualWorkflowBuilder editWorkflowId={editWorkflowId} />;
};

// Wrap with ReactFlowProvider and Suspense
const VisualWorkflowBuilderWrapper = () => (
  <ReactFlowProvider>
    <WorkflowProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <VisualWorkflowBuilderWithParams />
      </Suspense>
    </WorkflowProvider>
  </ReactFlowProvider>
);

export default VisualWorkflowBuilderWrapper; 