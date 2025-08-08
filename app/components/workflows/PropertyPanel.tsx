'use client';

import React, { useState, useEffect } from 'react';
import { useReactFlow, Node } from 'reactflow';
import SmartInput from './SmartInput';

interface PropertyPanelProps {
  selectedNode: Node | null;
}

export default function PropertyPanel({ selectedNode }: PropertyPanelProps) {
  const { getNode, setNodes, getNodes } = useReactFlow();
  const [eventData, setEventData] = useState<any>(null);
  const [workflowContext, setWorkflowContext] = useState<any>(null);
  const [localNodeData, setLocalNodeData] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Set sample event data when a node is selected
  useEffect(() => {
    if (selectedNode) {
      // Set sample event data for demonstration
      setEventData({
        id: 'event_123',
        name: 'webhook_received',
        category: 'integration',
        action: 'data_processed',
        value: 100,
        itemName: 'API Call',
        itemId: 'api_001',
        itemCategory: 'Integration',
        userId: 'user123',
        userPhone: '+966533595154',
        organizationId: 'org_2y3sRhCtQr3GmYs8k9Dluk5v2ws',
        path: '/api/webhook',
        pageTitle: 'Webhook Endpoint',
        ipAddress: '::1',
        referrer: 'https://external-service.com',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString()
      });
    }
  }, [selectedNode]);

  // Create mock workflow context for design phase
  useEffect(() => {
    if (selectedNode) {
      // Get all nodes from the workflow
      const allNodes = getNodes();
      
      // Create mock workflow context
      const mockContext: any = {};
      
      // Add event data variables for condition nodes
      if (eventData) {
        mockContext.event = eventData;
        // Also add common event fields directly for easier access
        mockContext.userId = eventData.userId;
        mockContext.value = eventData.value;
        mockContext.category = eventData.category;
        mockContext.userEmail = eventData.userEmail;
        mockContext.userPhone = eventData.userPhone;
        mockContext.itemName = eventData.itemName;
        mockContext.itemId = eventData.itemId;
        mockContext.itemCategory = eventData.itemCategory;
      }
      
      setWorkflowContext(mockContext);
    }
  }, [selectedNode, getNodes, eventData]);

  // Sync local state when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setLocalNodeData(selectedNode.data || {});
    }
  }, [selectedNode]);



  if (!selectedNode) {
    return (
      <div className="p-4 bg-white border-l border-gray-200 w-80">
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

  // Debounced update for SmartInput components
  const debouncedUpdateNodeData = (key: string, value: any) => {
    // Use a small delay to batch updates
    setTimeout(() => {
      updateNodeData(key, value);
    }, 1);
  };

  const handleInputBlur = (key: string, value: string) => {
    updateNodeData(key, value);
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

          <SmartInput
            value={nodeData.url || ''}
            onChange={(value) => debouncedUpdateNodeData('url', value)}
            label="Request URL"
            placeholder="https://api.example.com/endpoint"
            className="mb-4"
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.headers || ''}
            onChange={(value) => debouncedUpdateNodeData('headers', value)}
            label="Headers (JSON)"
            placeholder='{"Content-Type": "application/json"}'
            className="mb-4"
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.body || ''}
            onChange={(value) => debouncedUpdateNodeData('body', value)}
            label="Request Body (JSON)"
            placeholder='{"key": "value"}'
            className="mb-4"
            eventData={eventData}
            workflowContext={workflowContext}
          />
        </>
      )}

      {nodeData.actionType === 'data_processing' && (
        <>
          <SmartInput
            value={nodeData.script || ''}
            onChange={(value) => debouncedUpdateNodeData('script', value)}
            label="Processing Script"
            placeholder="// JavaScript code to process data"
            className="mb-4"
            eventData={eventData}
            workflowContext={workflowContext}
          />
        </>
      )}

      {nodeData.actionType === 'webhook_call' && (
        <>
          <SmartInput
            value={nodeData.webhookUrl || ''}
            onChange={(value) => debouncedUpdateNodeData('webhookUrl', value)}
            label="Webhook URL"
            placeholder="https://external-service.com/webhook"
            className="mb-4"
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.webhookPayload || ''}
            onChange={(value) => debouncedUpdateNodeData('webhookPayload', value)}
            label="Payload (JSON)"
            placeholder='{"data": "value"}'
            className="mb-4"
            eventData={eventData}
            workflowContext={workflowContext}
          />
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
    </div>
  );

  const renderTypeScriptProperties = () => {
    const testCode = async () => {
      setIsTesting(true);
      setTestResult(null);
      
      try {
        const response = await fetch('/api/workflows/test-typescript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: nodeData.code || '',
            context: {
              event: eventData,
              workflow: workflowContext,
              previous: null,
            },
          }),
        });

        const result = await response.json();
        setTestResult(result);
      } catch (error) {
        setTestResult({ success: false, error: 'Failed to test code' });
      } finally {
        setIsTesting(false);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            TypeScript Code
          </label>
                              <textarea
                      defaultValue={nodeData.code || '// Generic data processing example\nconsole.log("Input data:", input);\nconsole.log("Previous node output:", previous);\n\n// Process any type of data\nconst result = {\n  processed: true,\n  timestamp: new Date().toISOString(),\n  inputData: input,\n  previousData: previous || {},\n  // Add your custom processing logic here\n};\n\nconsole.log("Processing result:", result);\nreturn result;'}
                      onBlur={(e) => handleInputBlur('code', e.target.value)}
                      placeholder="// Your TypeScript code here"
                      rows={12}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
          <p className="mt-1 text-xs text-gray-500">
            Write your TypeScript code here. Use 'return' to pass data to the next node.
          </p>
        </div>

        <div>
          <button
            onClick={testCode}
            disabled={isTesting}
            className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Code'}
          </button>
        </div>

        {testResult && (
          <div className={`border rounded-md p-3 ${
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
                  <div><strong>Status:</strong> Success</div>
                  {testResult.output && (
                    <div><strong>Output:</strong> {JSON.stringify(testResult.output, null, 2)}</div>
                  )}
                  {testResult.logs && testResult.logs.length > 0 && (
                    <div>
                      <strong>Logs:</strong>
                      <pre className="mt-1 bg-white p-2 rounded text-xs overflow-auto max-h-20">
                        {testResult.logs.join('\n')}
                      </pre>
                    </div>
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

        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-green-900 mb-2">Generic Data Flow Examples</h4>
          <div className="text-xs text-green-700 space-y-2">
            <div>
              <strong>Node 1 - Process Input Data:</strong>
              <pre className="mt-1 bg-white p-2 rounded text-xs">
{`// Process any input data
const { items } = input.data;
const processed = items.map(item => ({
  ...item,
  processed: true,
  timestamp: new Date().toISOString()
}));
return { processedItems: processed, count: processed.length };`}
              </pre>
            </div>
            <div>
              <strong>Node 2 - Transform Data:</strong>
              <pre className="mt-1 bg-white p-2 rounded text-xs">
{`// Transform previous node output
const { processedItems } = previous;
const transformed = utils.transform(processedItems, item => ({
  ...item,
  value: item.value * 1.1, // Add 10% markup
  category: item.value > 150 ? 'premium' : 'standard'
}));
return { transformedItems: transformed };`}
              </pre>
            </div>
            <div>
              <strong>Node 3 - Filter and Aggregate:</strong>
              <pre className="mt-1 bg-white p-2 rounded text-xs">
{`// Filter and aggregate data
const { transformedItems } = previous;
const premium = utils.filter(transformedItems, item => item.category === 'premium');
const total = transformedItems.reduce((sum, item) => sum + item.value, 0);
return { 
  premiumCount: premium.length,
  totalValue: total,
  summary: { items: transformedItems.length, premium: premium.length }
};`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Code Execution</h4>
          <div className="text-xs text-yellow-700">
            <p>• Code runs in a sandboxed environment</p>
            <p>• Return an object to pass data to next nodes</p>
            <p>• Use try/catch for error handling</p>
            <p>• Access previous node output via <code>previous</code> variable</p>
            <p>• Use <code>utils.merge()</code> to combine objects</p>
            <p>• Use <code>utils.get()</code> to safely access nested properties</p>
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
        <SmartInput
          value={nodeData.leftOperand || ''}
          onChange={(value) => updateNodeData('leftOperand', value)}
          placeholder="e.g., {event.userId}, 100"
          eventData={eventData}
          workflowContext={workflowContext}
        />
        <p className="mt-1 text-xs text-gray-500">
          Use variables like {'{event.userId}'} or enter a value
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Right Operand (Variable or Value)
        </label>
        <SmartInput
          value={nodeData.rightOperand || ''}
          onChange={(value) => updateNodeData('rightOperand', value)}
          placeholder="e.g., {event.userId}, 100"
          eventData={eventData}
          workflowContext={workflowContext}
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
    <div className="p-4 bg-white border-l border-gray-200 w-80 overflow-y-auto">
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
      {selectedNode.type === 'typescript' && renderTypeScriptProperties()}
      
      {/* Debug: Show if no properties are rendered */}
      {!['trigger', 'condition', 'action', 'typescript'].includes(selectedNode?.type || '') && (
        <div className="text-sm text-gray-500">
          No properties available for node type: {selectedNode?.type}
        </div>
      )}
    </div>
  );
} 