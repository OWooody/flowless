'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface PersonalizationNodeData {
  type: 'personalization';
  ruleName: string;
  trigger: string;
  message: string;
  messageType: string;
  variableMappings?: {
    ruleName?: string;
    trigger?: string;
    message?: string;
  };
}

const PersonalizationNode = memo(({ data }: NodeProps<PersonalizationNodeData>) => {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg border-2 border-purple-400 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-5 h-5 bg-white border-2 border-purple-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-crosshair" style={{ left: '-10px' }} />
      <Handle type="source" position={Position.Right} className="w-5 h-5 bg-white border-2 border-purple-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-crosshair" style={{ right: '-10px' }} />
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Smart Campaign</h3>
            <p className="text-xs text-purple-100">
              {data.ruleName || 'Select Campaign'}
            </p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2 space-y-1">
          <div className="text-xs">
            <div className="font-medium truncate">
              Trigger: {data.trigger || 'Select trigger'}
            </div>
            <div className="text-purple-100 truncate">
              Type: {data.messageType || 'email'}
            </div>
            <div className="text-purple-100 truncate">
              Message: {data.message ? data.message.substring(0, 30) + '...' : 'Enter message'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PersonalizationNode.displayName = 'PersonalizationNode';
export default PersonalizationNode; 