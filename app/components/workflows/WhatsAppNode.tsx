'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface WhatsAppNodeData {
  provider: string;
  templateName: string;
  namespace: string;
  language: string;
  fromPhone: string;
  toPhone: string;
  templateVariables: string;
  description?: string;
  label?: string;
}

const WhatsAppNode = memo(({ data, selected }: NodeProps<WhatsAppNodeData>) => {
  const getIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'unifonic':
        return 'Unifonic';
      case 'freshchat':
        return 'Freshchat';
      default:
        return provider;
    }
  };

  return (
    <div className={`bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-green-300' : 'border-green-400'} min-w-[160px] max-w-[200px]`}>
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
              {data.label || 'WhatsApp'}
            </div>
            <div className="text-xs text-green-100 truncate">
              {getProviderLabel(data.provider)}
            </div>
          </div>
        </div>
        
        {/* Preview content */}
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs text-green-100 truncate">
            {data.templateName ? `Template: ${data.templateName}` : 'Click to configure'}
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

WhatsAppNode.displayName = 'WhatsAppNode';

export default WhatsAppNode;
