'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface SMSNodeData {
  type: string;
  provider: string;
  templateName: string;
  namespace?: string;
  language: string;
  fromPhone: string;
  toPhone: string;
  message?: string;
  variableMappings: {
    fromPhone: string;
    toPhone: string;
    message?: string;
  };
}

const SMSNode = memo(({ data }: NodeProps<SMSNodeData>) => {
  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg border-2 border-green-400 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-white border-2 border-green-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-crosshair"
        style={{ left: '-10px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-white border-2 border-green-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-crosshair"
        style={{ right: '-10px' }}
      />
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">SMS Message</h3>
            <p className="text-xs text-green-100">
              {data.provider || 'Select Provider'}
            </p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2 space-y-1">
          <div className="text-xs">
            <div className="font-medium truncate">
              {data.templateName || data.message || 'Select Template/Message'}
            </div>
            <div className="text-green-100 truncate">
              To: {data.toPhone || 'Select recipient'}
            </div>
            <div className="text-green-100 truncate">
              From: {data.fromPhone || 'Select sender'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SMSNode.displayName = 'SMSNode';

export default SMSNode; 