'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useWorkflowContext } from './WorkflowContext';

interface SlackNodeData {
  credentialId: string;
  channel: string;
  message: string;
  messageType: 'text' | 'blocks' | 'attachments';
  blocks?: any[];
  attachments?: any[];
  threadTs?: string;
  description?: string;
  label?: string;
}

const SlackNode = memo(({ data, selected, id }: NodeProps<SlackNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Slack Message');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState({
    credentialId: data.credentialId || '',
    channel: data.channel || '',
    message: data.message || '',
    messageType: data.messageType || 'text',
    threadTs: data.threadTs || '',
  });
  
  const { setNodes, getNodes } = useReactFlow();
  const { validateNodeName, removeNodeOutput } = useWorkflowContext();

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'Slack Message');
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      const existingNames = getNodes()
        .filter(node => node.id !== id)
        .map(node => node.data.label || '')
        .filter(Boolean);

      const validation = validateNodeName(editValue.trim(), existingNames);
      
      if (!validation.isValid) {
        setEditValue(data.label || 'Slack Message');
        alert(validation.error);
        return;
      }

      if (data.label && data.label !== editValue.trim()) {
        removeNodeOutput(id);
      }

      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() || 'Slack Message' } }
            : node
        )
      );
    }
  }, [editValue, data.label, id, setNodes, getNodes, validateNodeName, removeNodeOutput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(data.label || 'Slack Message');
    }
  }, [handleBlur, data.label]);

  const updateNodeData = useCallback((updates: Partial<SlackNodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [id, setNodes]);

  const handleConfigChange = useCallback((key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateNodeData(newConfig);
  }, [config, updateNodeData]);

  const getIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const getGradient = () => 'from-green-500 to-green-600';

  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-lg transition-all duration-200 ${
        selected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{ minWidth: '200px' }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className={`bg-gradient-to-r ${getGradient()} text-white p-3 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <span className="font-semibold text-sm">Slack</span>
          </div>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0"
            autoFocus
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className="text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            {data.label || 'Slack Message'}
          </div>
        )}

        {data.description && (
          <p className="text-xs text-gray-500 mt-1">{data.description}</p>
        )}

        {/* Quick Info */}
        <div className="mt-2 space-y-1">
          {config.credentialId && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Credential:</span> {config.credentialId.slice(0, 8)}...
            </div>
          )}
          {config.channel && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Channel:</span> {config.channel}
            </div>
          )}
          {config.message && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Message:</span> {config.message.slice(0, 30)}...
            </div>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {isConfigOpen && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Slack Configuration</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Credential ID
              </label>
              <input
                type="text"
                value={config.credentialId}
                onChange={(e) => handleConfigChange('credentialId', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter credential ID"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Channel
              </label>
              <input
                type="text"
                value={config.channel}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="#general or @username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Message Type
              </label>
              <select
                value={config.messageType}
                onChange={(e) => handleConfigChange('messageType', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="text">Text</option>
                <option value="blocks">Blocks</option>
                <option value="attachments">Attachments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={config.message}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
                placeholder="Enter your message..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Thread Timestamp (optional)
              </label>
              <input
                type="text"
                value={config.threadTs}
                onChange={(e) => handleConfigChange('threadTs', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="1234567890.123456"
              />
              <p className="text-xs text-gray-500 mt-1">
                Reply to a specific message thread
              </p>
            </div>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

SlackNode.displayName = 'SlackNode';

export default SlackNode;
