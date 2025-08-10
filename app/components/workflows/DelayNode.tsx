'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface DelayNodeData {
  duration: number;
  unit: string;
  description?: string;
  label?: string;
}

const DelayNode = memo(({ data, selected }: NodeProps<DelayNodeData>) => {
  const getIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'seconds':
        return 'Seconds';
      case 'minutes':
        return 'Minutes';
      case 'hours':
        return 'Hours';
      case 'days':
        return 'Days';
      default:
        return unit;
    }
  };

  return (
    <div className={`bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-gray-300' : 'border-gray-400'} min-w-[160px] max-w-[200px]`}>
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
              {data.label || 'Delay'}
            </div>
            <div className="text-xs text-gray-100 truncate">
              Wait
            </div>
          </div>
        </div>
        
        {/* Preview content */}
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs text-gray-100 truncate">
            {data.duration ? `${data.duration} ${getUnitLabel(data.unit)}` : 'Click to configure'}
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

DelayNode.displayName = 'DelayNode';

export default DelayNode;
