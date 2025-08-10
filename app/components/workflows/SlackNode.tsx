'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

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

const SlackNode = memo(({ data, selected }: NodeProps<SlackNodeData>) => {
  const getIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  return (
    <div className={`bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-green-300' : 'border-green-400'} min-w-[160px] max-w-[200px]`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-white"
        style={{ top: '-25px' }}
      />
      
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          {getIcon()}
          <span className="font-semibold text-sm">Slack</span>
        </div>
        
        <div className="text-sm font-medium">
          {data.label || 'Slack Message'}
        </div>
        
        {data.description && (
          <p className="text-xs text-green-100 mt-1">{data.description}</p>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-white"
        style={{ bottom: '-25px' }}
      />
    </div>
  );
});

SlackNode.displayName = 'SlackNode';

export default SlackNode;
