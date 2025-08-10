'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import SmartInput from './SmartInput';
import CodeMirrorEditor from './CodeMirrorEditor';

// JSON Tree Component for displaying structured data
const JSONTree = ({ data, level = 0, expanded, setExpanded }: { 
  data: any; 
  level?: number;
  expanded: Record<string, boolean>;
  setExpanded: (expanded: Record<string, boolean>) => void;
}) => {
  if (data === null) return <span className="text-gray-500">null</span>;
  if (data === undefined) return <span className="text-gray-500">undefined</span>;
  
  if (typeof data === 'string') {
    return <span className="text-green-600">"{data}"</span>;
  }
  
  if (typeof data === 'number') {
    return <span className="text-blue-600">{data}</span>;
  }
  
  if (typeof data === 'boolean') {
    return <span className="text-purple-600">{data.toString()}</span>;
  }
  
  if (Array.isArray(data)) {
    return (
      <div>
        <span 
          className="cursor-pointer text-gray-700 hover:text-gray-900"
          onClick={() => setExpanded({ ...expanded, [level.toString()]: !expanded[level.toString()] })}
        >
          {expanded[level.toString()] ? '▼' : '►'} data [{data.length} items]
        </span>
        {expanded[level.toString()] && (
          <div className="ml-4 mt-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-start">
                <span className="text-gray-500 mr-2">{index}:</span>
                <div className="flex-1">
                  {typeof item === 'object' && item !== null ? (
                    <JSONTree data={item} level={level + 1} expanded={expanded} setExpanded={setExpanded} />
                  ) : (
                    <span className="text-gray-700">{JSON.stringify(item)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return (
      <div>
        <span 
          className="cursor-pointer text-gray-700 hover:text-gray-900"
          onClick={() => setExpanded({ ...expanded, [level.toString()]: !expanded[level.toString()] })}
        >
          {expanded[level.toString()] ? '▼' : '►'} {keys.length} keys
        </span>
        {expanded[level.toString()] && (
          <div className="ml-4 mt-1">
            {keys.map(key => (
              <div key={key} className="flex items-start">
                <span className="text-gray-600 mr-2">{key}:</span>
                <div className="flex-1">
                  {typeof data[key] === 'object' && data[key] !== null ? (
                    <JSONTree data={data[key]} level={level + 1} expanded={expanded} setExpanded={setExpanded} />
                  ) : (
                    <span className="text-gray-700">{JSON.stringify(data[key])}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return <span className="text-gray-700">{String(data)}</span>;
};

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
  const [activeTab, setActiveTab] = useState<'output' | 'json'>('output');
  const [jsonTreeExpanded, setJsonTreeExpanded] = useState<Record<string, boolean>>({});

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

  // Function to expand all nodes in JSON tree
  const expandAll = useCallback(() => {
    if (runResult?.output) {
      const expanded: Record<string, boolean> = {};
      const expandRecursive = (obj: any, level: number = 0) => {
        expanded[level.toString()] = true;
        if (Array.isArray(obj)) {
          obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              expandRecursive(item, level + 1);
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(value => {
            if (typeof value === 'object' && value !== null) {
              expandRecursive(value, level + 1);
            }
          });
        }
      };
      expandRecursive(runResult.output);
      setJsonTreeExpanded(expanded);
    }
  }, [runResult?.output]);

  // Function to collapse all nodes in JSON tree
  const collapseAll = useCallback(() => {
    setJsonTreeExpanded({});
  }, []);

  // Function to handle tab switching
  const handleTabSwitch = useCallback((tab: 'output' | 'json') => {
    setActiveTab(tab);
    if (tab === 'json') {
      // Reset JSON tree expansion when switching to JSON tab
      setJsonTreeExpanded({});
    }
  }, []);

  const handleRunNode = useCallback(async () => {
    if (selectedNode.type === 'trigger') {
      alert('Trigger nodes cannot be run individually.');
      return;
    }

    setIsRunning(true);
    setRunResult(null);

    try {
      const response = await fetch('/api/workflows/run-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId: selectedNode.id,
          nodeType: selectedNode.type,
          nodeData: nodeData,
          previousOutputs: previousNodeOutputs,
        }),
      });

      const result = await response.json();
      setRunResult(result);
    } catch (error) {
      setRunResult({ success: false, error: 'Failed to run node' });
    } finally {
      setIsRunning(false);
    }
  }, [selectedNode.id, selectedNode.type, nodeData, previousNodeOutputs]);

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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={nodeData.description || ''}
            onChange={(e) => handleInputBlur('description', e.target.value)}
            placeholder="Describe what this code node does"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
          />
        </div>
      </div>
    );
  };

  const renderSlackProperties = () => {
    if (selectedNode.type !== 'slack') return null;

    const [slackCredentials, setSlackCredentials] = useState<any[]>([]);
    const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

    // Fetch Slack credentials when component mounts
    useEffect(() => {
      const fetchSlackCredentials = async () => {
        setIsLoadingCredentials(true);
        try {
          // Mock user ID - in real app, get from auth context
          const userId = 'user-123';
          const response = await fetch(`/api/credentials?userId=${userId}&provider=slack`);
          const data = await response.json();
          if (data.credentials) {
            setSlackCredentials(data.credentials);
          }
        } catch (error) {
          console.error('Error fetching Slack credentials:', error);
        } finally {
          setIsLoadingCredentials(false);
        }
      };

      fetchSlackCredentials();
    }, []);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Slack Message</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slack Integration
          </label>
          <select
            value={nodeData.credentialId || ''}
            onChange={(e) => updateNodeData('credentialId', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoadingCredentials}
          >
            <option value="">Select a Slack integration</option>
            {slackCredentials.map((credential) => (
              <option key={credential.id} value={credential.id}>
                {credential.name} ({credential.config?.team || 'Unknown team'})
              </option>
            ))}
          </select>
          {isLoadingCredentials && (
            <p className="text-sm text-gray-500 mt-1">Loading integrations...</p>
          )}
          {!isLoadingCredentials && slackCredentials.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No Slack integrations found. Create one in the Credentials section.</p>
          )}
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
          <div className="flex-1 mr-3">
            <input
              type="text"
              value={nodeData.label || ''}
              onChange={(e) => handleInputBlur('label', e.target.value)}
              placeholder="Enter node label"
              className="w-full text-lg font-semibold text-gray-800 bg-transparent border-none outline-none focus:ring-0 focus:border-none p-0"
            />
          </div>
          
          {/* Run Node Button */}
          <button
            onClick={() => handleRunNode()}
            disabled={selectedNode.type === 'trigger' || isRunning}
            className={`mr-2 p-2 rounded-lg transition-all duration-200 ${
              selectedNode.type === 'trigger'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isRunning
                ? 'bg-green-500 text-white cursor-wait'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
            }`}
            title={selectedNode.type === 'trigger' ? 'Trigger nodes cannot be run individually' : isRunning ? 'Running...' : 'Run this node'}
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
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

      {/* Run Results Section */}
      {runResult && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Run Results</h3>
            <button
              onClick={() => setRunResult(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {runResult.success ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTabSwitch('output')}
                  className={`px-2 py-1 text-xs rounded ${
                    activeTab === 'output' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Output
                </button>
                <button
                  onClick={() => handleTabSwitch('json')}
                  className={`px-2 py-1 text-xs rounded ${
                    activeTab === 'json' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  JSON
                </button>
              </div>
              
              {activeTab === 'output' && (
                <div className="bg-white border border-gray-200 rounded p-2 text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
                  {JSON.stringify(runResult.output || runResult, null, 2)}
                </div>
              )}
              
              {activeTab === 'json' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={expandAll}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span>Expand all</span>
                    </button>
                    <button
                      onClick={collapseAll}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      <span>Collapse all</span>
                    </button>
                  </div>
                  <div className="bg-white border border-gray-200 rounded p-2 max-h-48 overflow-y-auto">
                    <JSONTree
                      data={runResult.output || runResult}
                      expanded={jsonTreeExpanded}
                      setExpanded={setJsonTreeExpanded}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{runResult.error || 'An error occurred while running the node'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-6">
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
