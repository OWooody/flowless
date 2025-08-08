'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface ActionNodeData {
  type: string;
  title: string;
  body: string;
  targetUsers: string;
  icon?: string;
  // WhatsApp specific fields
  templateName?: string;
  provider?: string;
  namespace?: string;
  language?: string;
  bodyVariable1?: string;
  bodyVariable2?: string;
  bodyVariable3?: string;
  buttonVariable?: string;
  fromPhone?: string;
  toPhone?: string;
}

const ActionNode = memo(({ data }: NodeProps<ActionNodeData>) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'push_notification':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.47A.998.998 0 004 5v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1H5c-.28 0-.53.11-.71.29L4.19 4.47zM12 7c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
          </svg>
        );
      case 'whatsapp_message':
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
      case 'push_notification':
        return 'from-green-500 to-green-600';
      case 'whatsapp_message':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getGradient(data.type)} text-white rounded-lg shadow-lg border-2 border-green-400 min-w-[200px]`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            {getIcon(data.type)}
          </div>
          <div>
            <h3 className="font-semibold text-sm">Action</h3>
            <p className="text-xs text-green-100">
              {data.type === 'push_notification' ? 'Send notification' : data.type}
            </p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2 space-y-1">
          <div className="text-xs">
            <div className="font-medium truncate">
              {data.type === 'whatsapp_message' ? `WhatsApp: ${data.templateName || 'Template'}` : data.title}
            </div>
            <div className="text-green-100 truncate">
              {data.type === 'whatsapp_message' ? 
                `${data.provider}${data.fromPhone ? ` • ${data.fromPhone}` : ''}${data.toPhone ? ` → ${data.toPhone}` : ''}` : 
                data.body
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode; 