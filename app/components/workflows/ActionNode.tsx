'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

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

const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeData>) => {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'http_request':
        return 'HTTP Request';
      case 'webhook_call':
        return 'Webhook Call';
      default:
        return type;
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getGradient(data.actionType)} text-white rounded-lg shadow-lg border-2 ${selected ? 'border-blue-300' : 'border-blue-400'} min-w-[160px] max-w-[200px]`}>
      {/* Input Handle - Left side */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-white"
        style={{ left: '-25px' }}
      />
      
      {/* Node Content */}
      <div className="p-3">
        <div className="flex items-center mb-2">
          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
            {getIcon(data.actionType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {data.label || 'Action'}
            </div>
            <div className="text-xs text-blue-100 truncate">
              {getActionLabel(data.actionType)}
            </div>
          </div>
        </div>
      </div>

      {/* Output Handle - Right side */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-white"
        style={{ right: '-25px' }}
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode; 