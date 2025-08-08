'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface TriggerNodeData {
  eventType: string;
  eventName?: string;
  filterItemName?: string;
  filterItemCategory?: string;
  filterItemId?: string;
  filterValue?: number;
}

const TriggerNode = memo(({ data }: NodeProps<TriggerNodeData>) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg border-2 border-blue-400 min-w-[200px]">
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Trigger</h3>
            <p className="text-xs text-blue-100">When event occurs</p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs space-y-1">
            {data.eventName && data.eventName.trim() ? (
              <div className="font-medium">Event: {data.eventName}</div>
            ) : (
              <div className="font-medium">Event Type: {data.eventType}</div>
            )}
            {data.eventName && data.eventName.trim() && data.eventType && (
              <div className="text-blue-100">Type: {data.eventType}</div>
            )}
            {data.filterItemName && (
              <div className="text-blue-100">Item: {data.filterItemName}</div>
            )}
            {data.filterItemCategory && (
              <div className="text-blue-100">Category: {data.filterItemCategory}</div>
            )}
            {data.filterItemId && (
              <div className="text-blue-100">ID: {data.filterItemId}</div>
            )}
            {data.filterValue !== undefined && data.filterValue !== null && (
              <div className="text-blue-100">Value: {data.filterValue}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode; 