'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReactFlow, Node } from 'reactflow';
import { useWorkflowContext } from './WorkflowContext';

interface PropertyPanelProps {
  selectedNode: Node | null;
}

export default function PropertyPanel({ selectedNode }: PropertyPanelProps) {
  const { getNode, setNodes, getNodes } = useReactFlow();
  const [localNodeData, setLocalNodeData] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { previousNodeOutputs, addNodeOutput, clearNodeOutputs } = useWorkflowContext();

  // Sync local state when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setLocalNodeData(selectedNode.data || {});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="p-4 bg-white border-l border-gray-200 w-80 overflow-y-auto">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>Select a node to edit its properties</p>
        </div>
      </div>
    );
  }

  const nodeData = localNodeData;

  // Update function that updates both local state and actual nodes
  const updateNodeData = (key: string, value: any) => {
    console.log(`🔄 updateNodeData called: ${key} = ${value}`);
    
    // Update local state immediately for UI responsiveness
    setLocalNodeData((prev: any) => ({ ...prev, [key]: value }));
    
    // Update the actual nodes state
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, [key]: value } }
          : node
      )
    );
  };

  // Debounced update for form inputs
  const debouncedUpdateNodeData = (key: string, value: any) => {
    // Use a small delay to batch updates
    setTimeout(() => {
      updateNodeData(key, value);
    }, 1);
  };

  const handleInputBlur = (key: string, value: string) => {
    updateNodeData(key, value);
  };

  const testNode = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/workflows/test-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId: selectedNode?.id,
          nodeType: selectedNode?.type,
          nodeData: localNodeData,
          previousOutputs: previousNodeOutputs,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Store this node's output using the node name
        const nodeName = selectedNode?.data?.label || selectedNode?.type || 'Node';
        addNodeOutput(selectedNode?.id || '', nodeName, result.output);
      }
      
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: 'Failed to test node' });
    } finally {
      setIsTesting(false);
    }
  };

  const clearTestData = () => {
    clearNodeOutputs();
    setTestResult(null);
  };

  const renderTriggerProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trigger Type
        </label>
        <select
          value={nodeData.triggerType || 'webhook'}
          onChange={(e) => updateNodeData('triggerType', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="webhook">Webhook</option>
          <option value="manual">Manual</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {nodeData.triggerType === 'webhook' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Webhook URL
          </label>
          <input
            type="text"
            defaultValue={nodeData.webhookUrl || ''}
            onBlur={(e) => handleInputBlur('webhookUrl', e.target.value)}
            placeholder="https://your-domain.com/api/webhook"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            The webhook URL that will trigger this workflow
          </p>
        </div>
      )}

      {nodeData.triggerType === 'scheduled' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schedule (Cron Expression)
          </label>
          <input
            type="text"
            defaultValue={nodeData.schedule || ''}
            onBlur={(e) => handleInputBlur('schedule', e.target.value)}
            placeholder="0 0 * * * (daily at midnight)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Cron expression for scheduling (e.g., 0 0 * * * for daily at midnight)
          </p>
        </div>
      )}

      <div>
        <button
          onClick={testNode}
          disabled={isTesting}
          className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Node'}
        </button>
      </div>
    </div>
  );

  const renderActionProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Action Type
        </label>
        <select
          value={nodeData.actionType || 'http_request'}
          onChange={(e) => updateNodeData('actionType', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="http_request">HTTP Request</option>
          <option value="data_processing">Data Processing</option>
          <option value="webhook_call">Webhook Call</option>
        </select>
      </div>

      {nodeData.actionType === 'http_request' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method
            </label>
            <select
              value={nodeData.httpMethod || 'POST'}
              onChange={(e) => updateNodeData('httpMethod', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request URL
            </label>
            <input
              type="text"
              value={nodeData.url || ''}
              onChange={(e) => debouncedUpdateNodeData('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Headers (JSON)
            </label>
            <textarea
              value={nodeData.headers || ''}
              onChange={(e) => debouncedUpdateNodeData('headers', e.target.value)}
              placeholder='{"Content-Type": "application/json"}'
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Body (JSON)
            </label>
            <textarea
              value={nodeData.body || ''}
              onChange={(e) => debouncedUpdateNodeData('body', e.target.value)}
              placeholder='{"key": "value"}'
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </>
      )}

      {nodeData.actionType === 'data_processing' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Processing Script
            </label>
            <textarea
              value={nodeData.script || ''}
              onChange={(e) => debouncedUpdateNodeData('script', e.target.value)}
              placeholder="// JavaScript code to process data"
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </>
      )}

      {nodeData.actionType === 'webhook_call' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="text"
              value={nodeData.webhookUrl || ''}
              onChange={(e) => debouncedUpdateNodeData('webhookUrl', e.target.value)}
              placeholder="https://external-service.com/webhook"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payload (JSON)
            </label>
            <textarea
              value={nodeData.webhookPayload || ''}
              onChange={(e) => debouncedUpdateNodeData('webhookPayload', e.target.value)}
              placeholder='{"data": "value"}'
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          defaultValue={nodeData.description || ''}
          onBlur={(e) => handleInputBlur('description', e.target.value)}
          placeholder="What does this action do?"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <button
          onClick={testNode}
          disabled={isTesting}
          className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Node'}
        </button>
      </div>
    </div>
  );

  const renderCodeProperties = () => {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Code Node</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• Click on the node to expand and edit code</div>
            <div>• Double-click the node name to rename it</div>
            <div>• Code is saved automatically when you click outside</div>
          </div>
        </div>

        <div>
          <button
            onClick={testNode}
            disabled={isTesting}
            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Node'}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Available Variables</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div><code>input</code> - Generic input data (can be anything)</div>
            <div><code>workflow</code> - Workflow context and variables</div>
            <div><code>previous</code> - Output from previous node</div>
            <div><code>console.log()</code> - For debugging</div>
            <div><code>fetch()</code> - For API calls</div>
            <div><code>utils</code> - Utility functions (merge, get, set, transform, filter)</div>
          </div>
        </div>




      </div>
    );
  };

  const getConditionSymbol = (conditionType: string) => {
    switch (conditionType) {
      case 'equals': return '=';
      case 'not_equals': return '≠';
      case 'greater_than': return '>';
      case 'less_than': return '<';
      case 'contains': return '⊃';
      case 'not_contains': return '⊅';
      default: return '?';
    }
  };

  const renderConditionProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Condition Type
        </label>
        <select
          value={nodeData.conditionType || 'equals'}
          onChange={(e) => updateNodeData('conditionType', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="equals">Equals (=)</option>
          <option value="not_equals">Not Equals (≠)</option>
          <option value="greater_than">Greater Than (&gt;)</option>
          <option value="less_than">Less Than (&lt;)</option>
          <option value="contains">Contains (⊃)</option>
          <option value="not_contains">Not Contains (⊅)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Choose how to compare the values
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Left Operand (Variable or Value)
        </label>
        <input
          type="text"
          value={nodeData.leftOperand || ''}
          onChange={(e) => updateNodeData('leftOperand', e.target.value)}
          placeholder="e.g., {event.userId}, 100"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Use variables like {'{event.userId}'} or enter a value
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Right Operand (Variable or Value)
        </label>
        <input
          type="text"
          value={nodeData.rightOperand || ''}
          onChange={(e) => updateNodeData('rightOperand', e.target.value)}
          placeholder="e.g., {event.userId}, 100"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Use variables like {'{event.userId}'} or enter a value
        </p>
      </div>



      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Condition Preview</h4>
        <div className="text-xs text-blue-700">
          <div className="font-mono">
            {nodeData.leftOperand || 'Left operand'} {getConditionSymbol(nodeData.conditionType)} {nodeData.rightOperand || 'Right operand'}
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={testNode}
          disabled={isTesting}
          className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Node'}
        </button>
      </div>
    </div>
  );

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case 'condition':
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'action':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'typescript':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 text-sm font-bold">TS</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
        );
    }
  };

  const getNodeTitle = () => {
    const nodeName = nodeData?.label || selectedNode?.type || 'Node';
    return nodeName;
  };

  return (
    <div className="p-4 bg-white border-l border-gray-200 w-80 overflow-y-auto max-h-screen">
      <div className="mb-4">
        <div className="flex items-center mb-2">
          {getNodeIcon(selectedNode?.type || '')}
          <h3 className="text-lg font-semibold text-gray-900">
            {getNodeTitle()}
          </h3>
        </div>
      </div>

      {selectedNode.type === 'trigger' && renderTriggerProperties()}
      {selectedNode.type === 'condition' && renderConditionProperties()}
      {selectedNode.type === 'action' && renderActionProperties()}
      {selectedNode.type === 'typescript' && renderCodeProperties()}
      
      {/* Debug: Show if no properties are rendered */}
      {!['trigger', 'condition', 'action', 'typescript'].includes(selectedNode?.type || '') && (
        <div className="text-sm text-gray-500">
          No properties available for node type: {selectedNode?.type}
        </div>
      )}

      {/* Test Results - shown for all node types */}
      {testResult && (
        <div className={`border rounded-md p-3 mt-4 ${
          testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${
            testResult.success ? 'text-green-900' : 'text-red-900'
          }`}>
            Test Result
          </h4>
          <div className="text-xs space-y-1">
            {testResult.success ? (
              <div className="text-green-700">
                {testResult.output && (
                  <div><strong>Output:</strong> {JSON.stringify(testResult.output, null, 2)}</div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <div><strong>Status:</strong> Failed</div>
                <div><strong>Error:</strong> {testResult.error}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Node Outputs - shown for all node types */}
      {Object.keys(previousNodeOutputs).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-blue-900">Previous Node Outputs</h4>
            <button
              onClick={clearTestData}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear All
            </button>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            {Object.entries(previousNodeOutputs).map(([nodeId, output]) => (
              <div key={nodeId}>
                <strong>{nodeId}:</strong> {JSON.stringify(output, null, 2)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 