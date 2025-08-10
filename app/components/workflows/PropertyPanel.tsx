'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import SmartInput from './SmartInput';
import CodeMirrorEditor from './CodeMirrorEditor';

interface PropertyPanelProps {
  selectedNode: any;
  onClose: () => void;
}

interface NodeData {
  [key: string]: any;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode, onClose }) => {
  const { setNodes, getNodes } = useReactFlow();
  const [nodeData, setNodeData] = useState<NodeData>({});
  const [executionData, setExecutionData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [previousNodeOutputs, setPreviousNodeOutputs] = useState<Record<string, any>>({});

  // Fetch execution data when node changes
  useEffect(() => {
    if (selectedNode && selectedNode.id) {
      fetchExecutionData();
    }
  }, [selectedNode]);

  // Update local node data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setNodeData(selectedNode.data || {});
    }
  }, [selectedNode]);

  // Populate sample previous node outputs for demonstration
  useEffect(() => {
    if (selectedNode?.type === 'typescript') {
      setPreviousNodeOutputs({
        trigger: {
          data: { message: "Sample trigger data" },
          type: "webhook",
          timestamp: new Date().toISOString(),
          testData: true
        },
        'action_1': { result: "Sample action result" },
        'condition_1': { passed: true }
      });
    }
  }, [selectedNode]);

  const fetchExecutionData = async () => {
    try {
      // Fetch execution data for the selected node
      const response = await fetch(`/api/workflows/executions/latest`);
      if (response.ok) {
        const data = await response.json();
        setExecutionData(data.executionData || {});
        setEventData(data.eventData || {});
      }
    } catch (error) {
      console.error('Failed to fetch execution data:', error);
    }
  };

  const updateNodeData = useCallback((field: string, value: any) => {
    if (!selectedNode) return;

    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, [field]: value } }
          : node
      )
    );

    // Update local state
    setNodeData(prev => ({ ...prev, [field]: value }));
  }, [selectedNode, setNodes]);

  const handleInputBlur = useCallback((field: string, value: string) => {
    updateNodeData(field, value);
  }, [updateNodeData]);

  const handleRunTypeScript = useCallback(async () => {
    if (!nodeData.code?.trim()) return;
    
    setIsRunning(true);
    setRunResult(null);
    
    try {
      const response = await fetch('/api/workflows/test-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId: selectedNode.id,
          nodeType: 'typescript',
          nodeData: { code: nodeData.code },
          previousOutputs: previousNodeOutputs,
        }),
      });

      const result = await response.json();
      setRunResult(result);
    } catch (error) {
      setRunResult({ success: false, error: 'Failed to run code' });
    } finally {
      setIsRunning(false);
    }
  }, [nodeData.code, selectedNode.id, previousNodeOutputs]);

  // Don't render for trigger or condition nodes
  if (!selectedNode || selectedNode.type === 'trigger' || selectedNode.type === 'condition') {
    return null;
  }

  const renderActionProperties = () => {
    if (selectedNode.type !== 'action') return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Action Properties</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Type
          </label>
          <select
            value={nodeData.actionType || 'http_request'}
            onChange={(e) => updateNodeData('actionType', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="http_request">HTTP Request</option>
            <option value="webhook_call">Webhook Call</option>
            <option value="script">Script</option>
          </select>
        </div>

        {nodeData.actionType === 'http_request' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTTP Method
              </label>
              <select
                value={nodeData.httpMethod || 'GET'}
                onChange={(e) => updateNodeData('httpMethod', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <SmartInput
                value={nodeData.url || ''}
                onChange={(value) => updateNodeData('url', value)}
                placeholder="https://api.example.com/endpoint"
                executionData={executionData}
                eventData={eventData}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headers (JSON)
              </label>
              <textarea
                value={nodeData.headers || ''}
                onChange={(e) => updateNodeData('headers', e.target.value)}
                placeholder='{"Content-Type": "application/json"}'
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body
              </label>
              <SmartInput
                value={nodeData.body || ''}
                onChange={(value) => updateNodeData('body', value)}
                placeholder="Request body content"
                executionData={executionData}
                eventData={eventData}
              />
            </div>
          </>
        )}

        {nodeData.actionType === 'webhook_call' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <SmartInput
                value={nodeData.webhookUrl || ''}
                onChange={(value) => updateNodeData('webhookUrl', value)}
                placeholder="https://webhook.example.com/endpoint"
                executionData={executionData}
                eventData={eventData}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payload
              </label>
              <SmartInput
                value={nodeData.webhookPayload || ''}
                onChange={(value) => updateNodeData('webhookPayload', value)}
                placeholder="Webhook payload content"
                executionData={executionData}
                eventData={eventData}
              />
            </div>
          </>
        )}

        {nodeData.actionType === 'script' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Script
            </label>
            <textarea
              value={nodeData.script || ''}
              onChange={(e) => updateNodeData('script', e.target.value)}
              placeholder="// Write your script here"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none font-mono text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={nodeData.description || ''}
            onChange={(e) => handleInputBlur('description', e.target.value)}
            placeholder="Describe what this action does"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>
      </div>
    );
  };

  const renderTypeScriptProperties = () => {
    if (selectedNode.type !== 'typescript') return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">TypeScript Code</h3>
        
        {/* Available Variables Display */}
        {Object.keys(previousNodeOutputs).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs">
            <div className="text-blue-700 font-medium mb-1">
              💡 Available variables:
            </div>
            <div className="text-blue-600 space-x-2">
              {Object.keys(previousNodeOutputs).map((nodeName, index) => (
                <span key={index} className="inline-block bg-blue-100 px-2 py-1 rounded">
                  {nodeName}
                </span>
              ))}
            </div>
            {/* Show trigger data specifically */}
            {previousNodeOutputs.trigger && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="text-blue-700 font-medium mb-1">
                  🚀 Trigger data:
                </div>
                <div className="text-blue-600 space-x-2">
                  <span className="inline-block bg-green-100 px-2 py-1 rounded">
                    trigger.data
                  </span>
                  <span className="inline-block bg-green-100 px-2 py-1 rounded">
                    trigger.type
                  </span>
                  <span className="inline-block bg-green-100 px-2 py-1 rounded">
                    trigger.timestamp
                  </span>
                  <span className="inline-block bg-green-100 px-2 py-1 rounded">
                    trigger.testData
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Code Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code
          </label>
          <CodeMirrorEditor
            value={nodeData.code || ''}
            onChange={(value) => updateNodeData('code', value)}
            previousNodeOutputs={previousNodeOutputs}
            placeholder="// Write your TypeScript code here"
            className="min-h-[200px]"
          />
        </div>

        {/* Run Button */}
        <div className="flex justify-center">
          <button
            onClick={handleRunTypeScript}
            disabled={isRunning || !nodeData.code?.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors text-white font-medium"
          >
            {isRunning ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Running...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                </svg>
                <span>Run Code</span>
              </div>
            )}
          </button>
        </div>

        {/* Run Results */}
        {runResult && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">Execution Results</h4>
            </div>
            <div className="p-3">
              <div className="text-xs space-y-1">
                {runResult.success ? (
                  <div className="text-green-700">
                    {runResult.output !== undefined ? (
                      <pre className="bg-gray-100 p-2 rounded border border-gray-300 text-xs overflow-auto max-h-32">
                        {JSON.stringify(runResult.output, null, 2)}
                      </pre>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="flex items-center space-x-2 text-yellow-800">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <div className="font-medium">No output returned</div>
                            <div className="text-xs text-yellow-700 mt-1">
                              Your code executed successfully but didn't return a value. Check your return statement.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-700">
                    <div><strong>Error:</strong> {runResult.error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={nodeData.description || ''}
            onChange={(e) => handleInputBlur('description', e.target.value)}
            placeholder="Describe what this code does"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>
      </div>
    );
  };

  const renderSlackProperties = () => {
    if (selectedNode.type !== 'slack') return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Slack Message</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credential ID
          </label>
          <input
            type="text"
            value={nodeData.credentialId || ''}
            onChange={(e) => updateNodeData('credentialId', e.target.value)}
            placeholder="Enter credential ID"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel
          </label>
          <input
            type="text"
            value={nodeData.channel || ''}
            onChange={(e) => updateNodeData('channel', e.target.value)}
            placeholder="#general"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Type
          </label>
          <select
            value={nodeData.messageType || 'text'}
            onChange={(e) => updateNodeData('messageType', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="text">Text</option>
            <option value="blocks">Blocks</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <SmartInput
            value={nodeData.message || ''}
            onChange={(value) => updateNodeData('message', value)}
            placeholder="Enter your message"
            executionData={executionData}
            eventData={eventData}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thread Timestamp (optional)
          </label>
          <input
            type="text"
            value={nodeData.threadTs || ''}
            onChange={(e) => updateNodeData('threadTs', e.target.value)}
            placeholder="Thread timestamp for replies"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={nodeData.description || ''}
            onChange={(e) => handleInputBlur('description', e.target.value)}
            placeholder="Describe what this Slack message does"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>
      </div>
    );
  };

  const renderWhatsAppProperties = () => {
    if (selectedNode.type !== 'whatsapp_message') return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">WhatsApp Message</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider
          </label>
          <select
            value={nodeData.provider || 'unifonic'}
            onChange={(e) => updateNodeData('provider', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="unifonic">Unifonic</option>
            <option value="freshchat">Freshchat</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name
          </label>
          <input
            type="text"
            value={nodeData.templateName || ''}
            onChange={(e) => updateNodeData('templateName', e.target.value)}
            placeholder="Enter template name"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Namespace
          </label>
          <input
            type="text"
            value={nodeData.namespace || ''}
            onChange={(e) => updateNodeData('namespace', e.target.value)}
            placeholder="Enter namespace"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <input
            type="text"
            value={nodeData.language || 'en'}
            onChange={(e) => updateNodeData('language', e.target.value)}
            placeholder="en"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Phone Number (Business)
          </label>
          <SmartInput
            value={nodeData.fromPhone || ''}
            onChange={(value) => updateNodeData('fromPhone', value)}
            placeholder="Business phone number"
            executionData={executionData}
            eventData={eventData}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Phone Number (Target)
          </label>
          <SmartInput
            value={nodeData.toPhone || ''}
            onChange={(value) => updateNodeData('toPhone', value)}
            placeholder="Target phone number"
            executionData={executionData}
            eventData={eventData}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Variables
          </label>
          <textarea
            value={nodeData.templateVariables || ''}
            onChange={(e) => updateNodeData('templateVariables', e.target.value)}
            placeholder="Enter template variables as JSON"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={nodeData.description || ''}
            onChange={(e) => handleInputBlur('description', e.target.value)}
            placeholder="Describe what this WhatsApp message does"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>
      </div>
    );
  };

  const renderPushNotificationProperties = () => {
    if (selectedNode.type !== 'push_notification') return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Push Notification</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <SmartInput
            value={nodeData.title || ''}
            onChange={(value) => updateNodeData('title', value)}
            placeholder="Notification title"
            executionData={executionData}
            eventData={eventData}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Body
          </label>
          <SmartInput
            value={nodeData.body || ''}
            onChange={(value) => updateNodeData('body', value)}
            placeholder="Notification body"
            executionData={executionData}
            eventData={eventData}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Users
          </label>
          <SmartInput
            value={nodeData.targetUsers || ''}
            onChange={(value) => updateNodeData('targetUsers', value)}
            placeholder="User IDs or expressions"
            executionData={executionData}
            eventData={eventData}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data (JSON)
          </label>
          <textarea
            value={nodeData.data || ''}
            onChange={(e) => updateNodeData('data', e.target.value)}
            placeholder='{"key": "value"}'
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={nodeData.body || ''}
            onChange={(e) => handleInputBlur('description', e.target.value)}
            placeholder="Describe what this push notification does"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>
      </div>
    );
  };

  const renderPromoCodeProperties = () => {
    if (selectedNode.type !== 'promo_code') return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Promo Code</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Name
          </label>
          <input
            type="text"
            value={nodeData.batchName || ''}
            onChange={(e) => updateNodeData('batchName', e.target.value)}
            placeholder="Enter batch name"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code Type
          </label>
          <select
            value={nodeData.codeType || 'percentage'}
            onChange={(e) => updateNodeData('codeType', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <input
            type="text"
            value={nodeData.value || ''}
            onChange={(e) => updateNodeData('value', e.target.value)}
            placeholder="Enter discount value"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User IDs
          </label>
          <SmartInput
            value={nodeData.userIds || ''}
            onChange={(value) => updateNodeData('userIds', value)}
            placeholder="Enter user IDs or expressions"
            executionData={executionData}
            eventData={eventData}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Variable
          </label>
          <input
            type="text"
            value={nodeData.outputVariable || ''}
            onChange={(e) => updateNodeData('outputVariable', e.target.value)}
            placeholder="Variable name to store promo code"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={nodeData.description || ''}
            onChange={(e) => handleInputBlur('description', e.target.value)}
            placeholder="Describe what this promo code action does"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-40">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedNode.data?.label || 'Node Properties'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {selectedNode.type} node
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Node Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Node Label
          </label>
          <input
            type="text"
            value={nodeData.label || ''}
            onChange={(e) => handleInputBlur('label', e.target.value)}
            placeholder="Enter node label"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Node-specific properties */}
        {renderActionProperties()}
        {renderTypeScriptProperties()}
        {renderSlackProperties()}
        {renderWhatsAppProperties()}
        {renderPushNotificationProperties()}
        {renderPromoCodeProperties()}
      </div>
    </div>
  );
};

export default PropertyPanel;
