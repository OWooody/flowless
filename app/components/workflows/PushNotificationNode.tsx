'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface PushNotificationNodeData {
  title: string;
  body: string;
  targetUsers: string;
  data: string;
  description?: string;
  label?: string;
}

const PushNotificationNode = memo(({ data, selected }: NodeProps<PushNotificationNodeData>) => {
  const getIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM14 5h6V1h-6v4zM4 19h6v-6H4v6zM14 19h6v-6h-6v6z" />
    </svg>
  );

  return (
    <div className={`bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-purple-300' : 'border-purple-400'} min-w-[160px] max-w-[200px]`}>
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
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {data.label || 'Push Notification'}
            </div>
            <div className="text-xs text-purple-100 truncate">
              Notification
            </div>
          </div>
        </div>
        
        {/* Preview content */}
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs text-purple-100 truncate">
            {data.title ? `"${data.title}"` : 'Click to configure'}
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

PushNotificationNode.displayName = 'PushNotificationNode';

export default PushNotificationNode;
