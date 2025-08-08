'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

interface TriggerNodeData {
  triggerType: string;
  webhookUrl?: string;
  schedule?: string;
  description?: string;
  label?: string;
}

const TriggerNode = memo(({ data, selected, id }: NodeProps<TriggerNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Trigger');
  const { setNodes } = useReactFlow();

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'Trigger');
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() || 'Trigger' } }
            : node
        )
      );
    }
  }, [editValue, data.label, id, setNodes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(data.label || 'Trigger');
    }
  }, [handleBlur, data.label]);

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-blue-300' : 'border-blue-400'} min-w-[200px]`}>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="text-sm font-semibold bg-transparent border-none outline-none focus:ring-0 w-full text-white placeholder-white"
                autoFocus
                placeholder="Trigger"
              />
            ) : (
              <div 
                className="text-sm font-semibold cursor-pointer hover:bg-white hover:bg-opacity-10 px-1 py-0.5 rounded"
                onDoubleClick={handleDoubleClick}
                title="Double-click to edit"
              >
                {data.label || 'Trigger'}
              </div>
            )}
            <p className="text-xs text-blue-100">Start workflow with input data</p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs space-y-1">
            <div className="font-medium">Type: {data.triggerType}</div>
            {data.webhookUrl && (
              <div className="text-blue-100">Webhook: {data.webhookUrl}</div>
            )}
            {data.schedule && (
              <div className="text-blue-100">Schedule: {data.schedule}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode; 