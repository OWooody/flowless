'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

interface TriggerNodeData {
  triggerType: string;
  webhookUrl?: string;
  schedule?: string;
  description?: string;
  label?: string;
  testData?: string;
}

interface TriggerNodeProps extends NodeProps<TriggerNodeData> {
  onWorkflowExecuted?: (result: any) => void;
  onWorkflowStarted?: () => void;
}

const TriggerNode = memo(({ data, selected, id, onWorkflowExecuted, onWorkflowStarted }: TriggerNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Trigger');
  const [testData, setTestData] = useState(data.testData || '');
  const [isRunning, setIsRunning] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { setNodes } = useReactFlow();

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'Trigger');
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() || 'Trigger' } }
            : node
        )
      );
    }
  }, [editValue, data.label, id, setNodes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(data.label || 'Trigger');
    }
  }, [handleBlur, data.label]);

  const handleTestDataChange = useCallback((value: string) => {
    setTestData(value);
    setJsonError('');
    
    // Update the node data
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, testData: value } }
          : node
      )
    );
  }, [id, setNodes]);

  const validateAndRunWorkflow = useCallback(async () => {
    if (!testData.trim()) {
      // Use empty object as default
      await runWorkflow({});
      return;
    }

    try {
      const parsedData = JSON.parse(testData);
      setJsonError('');
      await runWorkflow(parsedData);
    } catch (error) {
      // Try to handle as simple string/number
      if (testData.trim().startsWith('"') && testData.trim().endsWith('"')) {
        await runWorkflow(testData.trim());
      } else if (testData.trim().startsWith('{') || testData.trim().startsWith('[')) {
        setJsonError('Invalid JSON format. Check brackets, quotes, and commas.');
      } else {
        // Treat as simple string/number
        await runWorkflow(testData);
      }
    }
  }, [testData]);

  const runWorkflow = async (data: any) => {
    setIsRunning(true);
    onWorkflowStarted?.(); // Notify parent that workflow started
    try {
      // Get the workflow ID from the URL or context
      const urlParams = new URLSearchParams(window.location.search);
      const workflowId = urlParams.get('edit');
      
      if (!workflowId) {
        alert('Please save the workflow first before running it.');
        return;
      }

      const response = await fetch(`/api/workflows/${workflowId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testData: data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run workflow');
      }

      const result = await response.json();
      
      // Workflow executed successfully - show success message
      console.log('Workflow executed successfully:', result);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
      onWorkflowExecuted?.(result); // Call the callback
      
    } catch (error) {
      console.error('Error running workflow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to run workflow';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-green-300' : 'border-green-400'} min-w-[280px]`}>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-white"
        style={{ right: '-25px' }}
      />
      
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="text-sm font-semibold bg-transparent border-none outline-none focus:ring-0 w-full text-white placeholder-white"
                autoFocus
                placeholder="Trigger"
              />
            ) : (
              <div 
                className="text-sm font-semibold cursor-pointer hover:bg-white hover:bg-opacity-10 px-1 py-0.5 rounded"
                onDoubleClick={handleDoubleClick}
                title="Double-click to edit"
              >
                {data.label || 'Trigger'}
              </div>
            )}
            <p className="text-xs text-green-100">Start workflow with input data</p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2 mb-3">
          <div className="text-xs space-y-1">
            <div className="font-medium">Type: {data.triggerType}</div>
            {data.webhookUrl && (
              <div className="text-green-100">Webhook: {data.webhookUrl}</div>
            )}
            {data.schedule && (
              <div className="text-green-100">Schedule: {data.schedule}</div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-400 bg-opacity-20 border border-green-300 rounded p-2 mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-green-200 font-medium">Workflow executed successfully!</span>
            </div>
          </div>
        )}

        {/* Test Data Section - Always Visible */}
        <div className="bg-white bg-opacity-10 rounded p-3 space-y-3">
          <div className="text-xs font-medium">Test Data</div>
          
          <div>
            <textarea
              value={testData}
              onChange={(e) => handleTestDataChange(e.target.value)}
              placeholder='{"userId": "123", "action": "login"}'
              className="w-full h-20 p-2 text-xs text-gray-800 bg-white rounded border-0 focus:ring-2 focus:ring-green-300 resize-none"
            />
            {jsonError && (
              <p className="text-red-200 text-xs mt-1">{jsonError}</p>
            )}
            <p className="text-xs text-green-100 mt-1">
              Examples: {"{}"} (empty), "hello" (string), 42 (number)
            </p>
          </div>
          
          <button
            onClick={validateAndRunWorkflow}
            disabled={isRunning}
            className={`w-full py-2 px-3 text-xs font-medium rounded transition-colors ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-white text-green-600 hover:bg-green-50'
            }`}
          >
            {isRunning ? (
              <div className="flex items-center justify-center">
                <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Running...
              </div>
            ) : (
              '▶ Run Workflow'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode; 