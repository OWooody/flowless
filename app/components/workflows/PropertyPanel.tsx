'use client';

import React, { useState, useEffect } from 'react';
import { useReactFlow, Node } from 'reactflow';
import SmartInput from './SmartInput';

interface PropertyPanelProps {
  selectedNode: Node | null;
}

export default function PropertyPanel({ selectedNode }: PropertyPanelProps) {
  const { getNode, setNodes, getNodes } = useReactFlow();
  const [executionData, setExecutionData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [workflowContext, setWorkflowContext] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [localNodeData, setLocalNodeData] = useState<any>({});

  // Fetch execution data when a node is selected
  useEffect(() => {
    if (selectedNode) {
      fetchExecutionData();
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

  const fetchExecutionData = async () => {
    if (!selectedNode) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/workflows/${selectedNode.id}/executions`);
      if (response.ok) {
        const data = await response.json();
        setExecutionData(data.executions || []);
      } else {
        console.error('Failed to fetch execution data');
        setExecutionData([]);
      }
    } catch (error) {
      console.error('Error fetching execution data:', error);
      setExecutionData([]);
    } finally {
      setLoading(false);
    }
  };

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          defaultValue={nodeData.description || ''}
          onBlur={(e) => handleInputBlur('description', e.target.value)}
          placeholder="What triggers this workflow?"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
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

          <SmartInput
            value={nodeData.url || ''}
            onChange={(value) => debouncedUpdateNodeData('url', value)}
            label="Request URL"
            placeholder="https://api.example.com/endpoint"
            className="mb-4"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.headers || ''}
            onChange={(value) => debouncedUpdateNodeData('headers', value)}
            label="Headers (JSON)"
            placeholder='{"Content-Type": "application/json"}'
            className="mb-4"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.body || ''}
            onChange={(value) => debouncedUpdateNodeData('body', value)}
            label="Request Body (JSON)"
            placeholder='{"key": "value"}'
            className="mb-4"
            executionData={executionData}
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
            executionData={executionData}
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
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.webhookPayload || ''}
            onChange={(value) => debouncedUpdateNodeData('webhookPayload', value)}
            label="Payload (JSON)"
            placeholder='{"data": "value"}'
            className="mb-4"
            executionData={executionData}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <input
          type="text"
          defaultValue={nodeData.description || ''}
          onBlur={(e) => handleInputBlur('description', e.target.value)}
          placeholder="e.g., Check if user is VIP"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional description for this condition
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Condition Preview</h4>
        <div className="text-xs text-blue-700">
          <div className="font-mono">
            {nodeData.leftOperand || 'Left operand'} {getConditionSymbol(nodeData.conditionType)} {nodeData.rightOperand || 'Right operand'}
          </div>
          {nodeData.description && (
            <div className="mt-1 text-blue-600 italic">
              "{nodeData.description}"
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white border-l border-gray-200 w-80 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {selectedNode.type === 'trigger' ? 'Trigger Properties' : 'Node Properties'}
        </h3>
        <div className="text-sm text-gray-500">
          {selectedNode.type === 'trigger' ? 'Configure when this workflow should trigger' : 'Configure the node behavior'}
        </div>
      </div>

      {selectedNode.type === 'trigger' && renderTriggerProperties()}
      {selectedNode.type === 'condition' && renderConditionProperties()}
      {selectedNode.type === 'action' && renderActionProperties()}
    </div>
  );
} 