'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface TransformNodeData {
  transformType: string;
  expression: string;
  outputField: string;
  description?: string;
  label?: string;
}

const TransformNode = memo(({ data, selected }: NodeProps<TransformNodeData>) => {
  const getIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );

  const getTransformLabel = (type: string) => {
    switch (type) {
      case 'map':
        return 'Map';
      case 'filter':
        return 'Filter';
      case 'reduce':
        return 'Reduce';
      case 'sort':
        return 'Sort';
      default:
        return type;
    }
  };

  return (
    <div className={`bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-teal-300' : 'border-teal-400'} min-w-[160px] max-w-[200px]`}>
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
              {data.label || 'Transform'}
            </div>
            <div className="text-xs text-teal-100 truncate">
              {getTransformLabel(data.transformType)}
            </div>
          </div>
        </div>
        
        {/* Preview content */}
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs text-teal-100 truncate">
            {data.outputField ? `→ ${data.outputField}` : 'Click to configure'}
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

TransformNode.displayName = 'TransformNode';

export default TransformNode;
