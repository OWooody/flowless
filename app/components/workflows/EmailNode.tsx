'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface EmailNodeData {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  variables?: string;
  description?: string;
  label?: string;
}

const EmailNode = memo(({ data, selected }: NodeProps<EmailNodeData>) => {
  const getIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className={`bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-indigo-300' : 'border-indigo-400'} min-w-[160px] max-w-[200px]`}>
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
              {data.label || 'Email'}
            </div>
            <div className="text-xs text-indigo-100 truncate">
              Send Email
            </div>
          </div>
        </div>
        
        {/* Preview content */}
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs text-indigo-100 truncate">
            {data.subject ? `"${data.subject}"` : 'Click to configure'}
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

EmailNode.displayName = 'EmailNode';

export default EmailNode;
