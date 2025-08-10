'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface TriggerNodeData {
  triggerType: string;
  webhookUrl?: string;
  schedule?: string;
  description?: string;
  label?: string;
  testData?: string;
}

const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'webhook':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'schedule':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'webhook':
        return 'from-orange-500 to-orange-600';
      case 'schedule':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-orange-500 to-orange-600';
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'webhook':
        return 'Webhook';
      case 'schedule':
        return 'Schedule';
      default:
        return type;
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getGradient(data.triggerType)} text-white rounded-lg shadow-lg border-2 ${selected ? 'border-orange-300' : 'border-orange-400'} min-w-[160px] max-w-[200px]`}>
      {/* Node Content */}
      <div className="p-3">
        <div className="flex items-center mb-2">
          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
            {getIcon(data.triggerType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {data.label || 'Trigger'}
            </div>
            <div className="text-xs text-orange-100 truncate">
              {getTriggerLabel(data.triggerType)}
            </div>
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

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode; 