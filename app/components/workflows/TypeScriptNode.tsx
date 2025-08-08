'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const TypeScriptNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-blue-500' : 'border-gray-200'}`}>
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 text-sm font-bold">
          TS
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label || 'TypeScript Code'}</div>
          <div className="text-xs text-gray-500">{data.description || 'Execute TypeScript code'}</div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
};

export default memo(TypeScriptNode);
