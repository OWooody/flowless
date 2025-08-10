'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const TypeScriptNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-green-300' : 'border-green-400'} min-w-[160px] max-w-[200px]`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-white"
        style={{ left: '-25px' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-white"
        style={{ right: '-25px' }}
      />
      
      <div className="p-3">
        <div className="flex items-center mb-2">
          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {data.label || 'Code'}
            </div>
            <div className="text-xs text-green-100 truncate">
              TypeScript
            </div>
          </div>
        </div>
        
        {/* Simplified preview */}
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs text-green-100 truncate">
            {data.code ? 
              `${data.code.substring(0, 30)}${data.code.length > 30 ? '...' : ''}` : 
              'Click to write code'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypeScriptNode;
