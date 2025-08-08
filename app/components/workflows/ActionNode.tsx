'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

interface ActionNodeData {
  actionType: string;
  httpMethod?: string;
  url?: string;
  headers?: string;
  body?: string;
  script?: string;
  webhookUrl?: string;
  webhookPayload?: string;
  description?: string;
  label?: string;
}

const ActionNode = memo(({ data, selected, id }: NodeProps<ActionNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Action');
  const { setNodes } = useReactFlow();

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'Action');
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() || 'Action' } }
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
      setEditValue(data.label || 'Action');
    }
  }, [handleBlur, data.label]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'http_request':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'webhook_call':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'http_request':
        return 'from-blue-500 to-blue-600';
      case 'webhook_call':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getGradient(data.actionType)} text-white rounded-lg shadow-lg border-2 ${selected ? 'border-blue-300' : 'border-blue-400'} min-w-[200px]`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            {getIcon(data.actionType)}
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
                placeholder="Action"
              />
            ) : (
              <div 
                className="text-sm font-semibold cursor-pointer hover:bg-white hover:bg-opacity-10 px-1 py-0.5 rounded"
                onDoubleClick={handleDoubleClick}
                title="Double-click to edit"
              >
                {data.label || 'Action'}
              </div>
            )}
            <p className="text-xs text-green-100">
              {data.actionType === 'http_request' ? 'HTTP Request' : 
               data.actionType === 'webhook_call' ? 'Webhook Call' : 
               data.actionType}
            </p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2 space-y-1">
          <div className="text-xs">
            <div className="font-medium truncate">
              {data.actionType === 'http_request' ? `${data.httpMethod || 'GET'} ${data.url || 'URL'}` : 
               data.actionType === 'webhook_call' ? `Webhook: ${data.webhookUrl || 'URL'}` : 
               data.actionType}
            </div>
            <div className="text-green-100 truncate">
              {data.actionType === 'http_request' ? data.body || 'No body' : 
               data.actionType === 'webhook_call' ? data.webhookPayload || 'No payload' : 
               'Action details'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode; 