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
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [localNodeData, setLocalNodeData] = useState<any>({});

  // Fetch execution data when a node is selected
  useEffect(() => {
    if (selectedNode) {
      fetchExecutionData();
      // Set sample event data for demonstration (using actual event schema fields)
      setEventData({
        id: 'event_123',
        name: 'book',
        category: 'engagement',
        action: 'purchase',
        value: 299,
        itemName: 'Muvi Package',
        itemId: '10',
        itemCategory: 'Package',
        userId: 'user123',
        userPhone: '+966533595154',
        organizationId: 'org_2y3sRhCtQr3GmYs8k9Dluk5v2ws',
        path: '/checkout',
        pageTitle: 'Checkout Page',
        ipAddress: '::1',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString()
      });
    }
  }, [selectedNode]);

  // Fetch batches when promo code node is selected
  useEffect(() => {
    if (selectedNode?.type === 'promo_code') {
      fetchBatches();
    }
  }, [selectedNode]);

  // Create mock workflow context for design phase
  useEffect(() => {
    if (selectedNode) {
      // Get all nodes from the workflow to find promo code nodes
      const allNodes = getNodes();
      
      // Find promo code nodes that come before the current node
      const promoCodeNodes = allNodes.filter(node => 
        node.type === 'promo_code' && 
        node.id !== selectedNode.id
      );
      
      // Create mock workflow context with promo code variables
      const mockContext: any = {};
      
      // Add promo code variables
      promoCodeNodes.forEach(node => {
        const outputVar = node.data.outputVariable || 'promoCode';
        mockContext[outputVar] = `MOCK_${outputVar.toUpperCase()}`;
        mockContext[`${outputVar}_batchId`] = 'mock-batch-id';
        mockContext[`${outputVar}_batchName`] = node.data.batchName || 'Mock Batch';
        mockContext[`${outputVar}_discountType`] = 'percentage';
        mockContext[`${outputVar}_discountValue`] = 15;
      });
      
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
    try {
      // Try to get workflow ID from URL or context
      const urlParams = new URLSearchParams(window.location.search);
      const workflowId = urlParams.get('edit');
      
      if (workflowId) {
        // Try to fetch real execution data
        const response = await fetch(`/api/workflows/${workflowId}/executions`);
        if (response.ok) {
          const data = await response.json();
          setExecutionData(data || []);
          return;
        }
      }
      
      // Fallback to sample data for demonstration
      const sampleExecutionData = [
        {
          id: 'exec1',
          status: 'completed',
          completedAt: new Date().toISOString(),
          results: {
            orderNumber: 'ORD-456',
            customerName: 'Jane Smith',
            total: '$149.99',
            items: ['Product A', 'Product B'],
            shippingAddress: '123 Main St, City, State',
            userPhone: '+1987654321',
            userEmail: 'jane@example.com'
          }
        },
        {
          id: 'exec2', 
          status: 'completed',
          completedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          results: {
            orderNumber: 'ORD-789',
            customerName: 'Bob Johnson',
            total: '$299.99',
            items: ['Product C'],
            shippingAddress: '456 Oak Ave, Town, State',
            userPhone: '+1555123456',
            userEmail: 'bob@example.com'
          }
        },
        {
          id: 'exec3',
          status: 'completed', 
          completedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          results: {
            orderNumber: 'ORD-101',
            customerName: 'Alice Brown',
            total: '$89.99',
            items: ['Product D', 'Product E'],
            shippingAddress: '789 Pine St, Village, State',
            userPhone: '+1444333222',
            userEmail: 'alice@example.com'
          }
        }
      ];
      
      setExecutionData(sampleExecutionData);
    } catch (error) {
      console.error('Error fetching execution data:', error);
      setExecutionData([]);
    }
  };

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/promocodes');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
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
          Event Name
        </label>
        <input
          type="text"
          defaultValue={nodeData.eventName || ''}
          onBlur={(e) => handleInputBlur('eventName', e.target.value)}
          placeholder="e.g., page_view, user_signup"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter an event name to track specific events, or leave empty to track all events
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Type
        </label>
        <select
          value={nodeData.eventType || 'engagement'}
          onChange={(e) => updateNodeData('eventType', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="engagement">Engagement</option>
          <option value="conversion">Conversion</option>
          <option value="purchase">Purchase</option>
          <option value="signup">Sign Up</option>
          <option value="login">Login</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Item Name Filter (Optional)
        </label>
        <input
          type="text"
          defaultValue={nodeData.filterItemName || ''}
          onBlur={(e) => handleInputBlur('filterItemName', e.target.value)}
          placeholder="Only trigger for events with this item name"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Only trigger this workflow for events with a specific item name
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Item Category Filter (Optional)
        </label>
        <input
          type="text"
          defaultValue={nodeData.filterItemCategory || ''}
          onBlur={(e) => handleInputBlur('filterItemCategory', e.target.value)}
          placeholder="Only trigger for events with this item category"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Only trigger this workflow for events with a specific item category
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Item ID Filter (Optional)
        </label>
        <input
          type="text"
          defaultValue={nodeData.filterItemId || ''}
          onBlur={(e) => handleInputBlur('filterItemId', e.target.value)}
          placeholder="Only trigger for events with this item ID"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Only trigger this workflow for events with a specific item ID
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Value Filter (Optional)
        </label>
        <input
          type="number"
          step="0.01"
          defaultValue={nodeData.filterValue || ''}
          onBlur={(e) => handleInputBlur('filterValue', e.target.value ? e.target.value : '')}
          placeholder="Only trigger for events with this exact value"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Only trigger this workflow for events with a specific value
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter Fields (JSON)
        </label>
        <textarea
          defaultValue={nodeData.filterFields || ''}
          onBlur={(e) => handleInputBlur('filterFields', e.target.value)}
          placeholder="Enter filter conditions (JSON format)"
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Advanced: Enter custom filter conditions in JSON format
        </p>
      </div>
    </div>
  );

  const renderActionProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          defaultValue={nodeData.title || ''}
          onBlur={(e) => handleInputBlur('title', e.target.value)}
          placeholder="Notification title"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Body
        </label>
        <textarea
          defaultValue={nodeData.body || ''}
          onBlur={(e) => handleInputBlur('body', e.target.value)}
          placeholder="Notification body"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Users
        </label>
        <select
          value={nodeData.targetUsers || 'all'}
          onChange={(e) => updateNodeData('targetUsers', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All users</option>
          <option value="specific">Specific users</option>
        </select>
      </div>

      {nodeData.targetUsers === 'specific' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User IDs
          </label>
          <input
            type="text"
            defaultValue={nodeData.userIds || ''}
            onBlur={(e) => handleInputBlur('userIds', e.target.value)}
            placeholder="Comma-separated user IDs"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );

  const renderPromoCodeProperties = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Promo Code Batch
          </label>
          <select
            value={nodeData.batchId || ''}
            onChange={(e) => {
              const selectedBatch = batches.find(b => b.id === e.target.value);
              // Update both batchId and batchName in a single operation
              setLocalNodeData((prev: any) => ({ 
                ...prev, 
                batchId: e.target.value,
                batchName: selectedBatch?.name || ''
              }));
              
              // Update the actual nodes state
              setNodes((nodes) =>
                nodes.map((node) =>
                  node.id === selectedNode.id
                    ? { 
                        ...node, 
                        data: { 
                          ...node.data, 
                          batchId: e.target.value,
                          batchName: selectedBatch?.name || ''
                        } 
                      }
                    : node
                )
              );
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} ({batch.totalCodes - batch.usedCodes} codes available)
              </option>
            ))}
          </select>
          {loading && <p className="mt-1 text-xs text-gray-500">Loading batches...</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code Selection Type
          </label>
          <select
            value={nodeData.codeType || 'random'}
            onChange={(e) => updateNodeData('codeType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="random">Random (unused code)</option>
            <option value="sequential">Sequential (next available)</option>
            <option value="specific">Specific code</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            How to select a code from the batch
          </p>
        </div>

        {nodeData.codeType === 'specific' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specific Code
            </label>
            <input
              type="text"
              defaultValue={nodeData.specificCode || ''}
              onBlur={(e) => handleInputBlur('specificCode', e.target.value)}
              placeholder="e.g., SUMMER15"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the exact promo code to use
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Output Variable Name
          </label>
          <input
            type="text"
            defaultValue={nodeData.outputVariable || 'promoCode'}
            onBlur={(e) => handleInputBlur('outputVariable', e.target.value)}
            placeholder="e.g., promoCode, discountCode"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Variable name to use in subsequent actions (e.g., {'{promoCode}'})
          </p>
        </div>

        {nodeData.batchId && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Batch Information</h4>
            {(() => {
              const batch = batches.find(b => b.id === nodeData.batchId);
              if (!batch) return <p className="text-xs text-blue-700">Loading...</p>;
              
              return (
                <div className="text-xs text-blue-700 space-y-1">
                  <div>Discount: {batch.discountType === 'percentage' ? `${batch.discountValue}%` : 
                    batch.discountType === 'fixed' ? `$${batch.discountValue}` : 'Free Shipping'}</div>
                  {batch.minOrderValue && <div>Min Order: ${batch.minOrderValue}</div>}
                  <div>Available: {batch.totalCodes - batch.usedCodes} codes</div>
                  <div>Valid: {new Date(batch.validFrom).toLocaleDateString()} - 
                    {batch.validUntil ? new Date(batch.validUntil).toLocaleDateString() : 'No expiry'}</div>
                </div>
              );
            })()}
          </div>
        )}
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
          placeholder="e.g., {event.userId}, {workflow.promoCode}, 100"
          eventData={eventData}
          workflowContext={workflowContext}
        />
        <p className="mt-1 text-xs text-gray-500">
          Use variables like {'{event.userId}'} or {'{workflow.promoCode}'} or enter a value
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Right Operand (Variable or Value)
        </label>
        <SmartInput
          value={nodeData.rightOperand || ''}
          onChange={(value) => updateNodeData('rightOperand', value)}
          placeholder="e.g., {event.userId}, {workflow.promoCode}, 100"
          eventData={eventData}
          workflowContext={workflowContext}
        />
        <p className="mt-1 text-xs text-gray-500">
          Use variables like {'{event.userId}'} or {'{workflow.promoCode}'} or enter a value
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

  const renderWhatsAppProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provider
        </label>
        <select
          value={nodeData.provider || 'freshchat'}
          onChange={(e) => updateNodeData('provider', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="freshchat">Freshchat</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Name
        </label>
        <input
          type="text"
          defaultValue={nodeData.templateName || ''}
          onBlur={(e) => handleInputBlur('templateName', e.target.value)}
          placeholder="e.g., welcome_message"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Namespace
        </label>
        <input
          type="text"
          defaultValue={nodeData.namespace || ''}
          onBlur={(e) => handleInputBlur('namespace', e.target.value)}
          placeholder="e.g., fc3df069_22dc_4a5f_a669_2f7329af60d1"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Language
        </label>
        <select
          value={nodeData.language || 'ar'}
          onChange={(e) => updateNodeData('language', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ar">Arabic (ar)</option>
          <option value="en">English (en)</option>
        </select>
      </div>

      <SmartInput
        value={nodeData.fromPhone || ''}
        onChange={(value) => debouncedUpdateNodeData('fromPhone', value)}
        label="From Phone Number (Business)"
        placeholder="+1234567890"
        className="mb-4"
        executionData={executionData}
        eventData={eventData}
        workflowContext={workflowContext}
      />

      <SmartInput
        value={nodeData.toPhone || ''}
        onChange={(value) => debouncedUpdateNodeData('toPhone', value)}
        label="To Phone Number (Target)"
        placeholder="+0987654321"
        className="mb-4"
        executionData={executionData}
        eventData={eventData}
        workflowContext={workflowContext}
      />
      
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Template Variables</h4>
        
        <div className="space-y-3">
          <SmartInput
            value={nodeData.bodyVariable1 || ''}
            onChange={(value) => debouncedUpdateNodeData('bodyVariable1', value)}
            label="Body Variable 1"
            placeholder="Variable {'{1}'} in template"
            className="mb-3"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.bodyVariable2 || ''}
            onChange={(value) => debouncedUpdateNodeData('bodyVariable2', value)}
            label="Body Variable 2"
            placeholder="Variable {'{2}'} in template"
            className="mb-3"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.bodyVariable3 || ''}
            onChange={(value) => debouncedUpdateNodeData('bodyVariable3', value)}
            label="Body Variable 3"
            placeholder="Variable {'{3}'} in template"
            className="mb-3"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />

          <SmartInput
            value={nodeData.buttonVariable || ''}
            onChange={(value) => debouncedUpdateNodeData('buttonVariable', value)}
            label="Button Variable"
            placeholder="Button text (optional)"
            className="mb-3"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />
        </div>
      </div>
    </div>
  );

  const renderSMSProperties = () => {
    const nodeData = localNodeData;
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMS Provider
          </label>
          <select
            value={nodeData.provider || 'unifonic'}
            onChange={(e) => updateNodeData('provider', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="unifonic">Unifonic</option>
            <option value="twilio">Twilio</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Type
          </label>
          <select
            value={nodeData.messageType || 'direct'}
            onChange={(e) => updateNodeData('messageType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="direct">Direct Message</option>
            <option value="template">Template</option>
          </select>
        </div>

        {nodeData.messageType === 'template' && (
          <SmartInput
            value={nodeData.templateName || ''}
            onChange={(value) => debouncedUpdateNodeData('templateName', value)}
            label="Template Name"
            placeholder="Enter template name"
            className="mb-4"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />
        )}

        {nodeData.messageType === 'direct' && (
          <SmartInput
            value={nodeData.message || ''}
            onChange={(value) => debouncedUpdateNodeData('message', value)}
            label="Message Content"
            placeholder="Enter your SMS message"
            className="mb-4"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={nodeData.language || 'en'}
            onChange={(e) => updateNodeData('language', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">English (en)</option>
            <option value="ar">Arabic (ar)</option>
          </select>
        </div>

        <SmartInput
          value={nodeData.fromPhone || ''}
          onChange={(value) => debouncedUpdateNodeData('fromPhone', value)}
          label="From Phone Number (Business)"
          placeholder="+1234567890"
          className="mb-4"
          executionData={executionData}
          eventData={eventData}
          workflowContext={workflowContext}
        />

        <SmartInput
          value={nodeData.toPhone || ''}
          onChange={(value) => debouncedUpdateNodeData('toPhone', value)}
          label="To Phone Number (Target)"
          placeholder="+0987654321"
          className="mb-4"
          executionData={executionData}
          eventData={eventData}
          workflowContext={workflowContext}
        />
      </div>
    );
  };

  const renderPersonalizationProperties = () => {
    const nodeData = localNodeData;
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <SmartInput
            value={nodeData.ruleName || ''}
            onChange={(value) => debouncedUpdateNodeData('ruleName', value)}
            placeholder="e.g., Welcome New Customers"
            className="mb-4"
            executionData={executionData}
            eventData={eventData}
            workflowContext={workflowContext}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            When to Trigger
          </label>
          <select
            value={nodeData.trigger || 'first_visit'}
            onChange={(e) => updateNodeData('trigger', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="first_visit">First-time visitors</option>
            <option value="high_spender">High-value customers</option>
            <option value="cart_abandoner">Cart abandoners</option>
            <option value="inactive_user">Inactive users</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Type
          </label>
          <select
            value={nodeData.messageType || 'email'}
            onChange={(e) => updateNodeData('messageType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push Notification</option>
          </select>
        </div>

        <SmartInput
          value={nodeData.message || ''}
          onChange={(value) => debouncedUpdateNodeData('message', value)}
          label="Your Message"
          placeholder="Enter your personalized message..."
          className="mb-4"
          executionData={executionData}
          eventData={eventData}
          workflowContext={workflowContext}
        />
      </div>
    );
  };

  return (
    <div className="p-4 bg-white border-l border-gray-200 w-80 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {selectedNode.type === 'trigger' ? 'Trigger Properties' : 'Action Properties'}
        </h3>
        <div className="text-sm text-gray-500">
          {selectedNode.type === 'trigger' ? 'Configure when this workflow should trigger' : 'Configure the action to perform'}
        </div>
      </div>

      {selectedNode.type === 'trigger' && renderTriggerProperties()}
      {selectedNode.type === 'promo_code' && renderPromoCodeProperties()}
      {selectedNode.type === 'condition' && renderConditionProperties()}
      {selectedNode.type === 'push_notification' && renderActionProperties()}
      {selectedNode.type === 'whatsapp_message' && renderWhatsAppProperties()}
              {selectedNode.type === 'sms_message' && renderSMSProperties()}
        {selectedNode.type === 'personalization' && renderPersonalizationProperties()}
    </div>
  );
} 