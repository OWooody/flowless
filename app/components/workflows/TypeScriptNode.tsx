'use client';

import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

const TypeScriptNode = ({ data, selected, id }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'TypeScript Code');
  const { setNodes } = useReactFlow();

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'TypeScript Code');
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() || 'TypeScript Code' } }
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
      setEditValue(data.label || 'TypeScript Code');
    }
  }, [handleBlur, data.label]);

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-blue-500' : 'border-gray-200'}`}>
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 text-sm font-bold">
          TS
        </div>
        <div className="ml-2 flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="text-sm font-bold bg-transparent border-none outline-none focus:ring-0 w-full"
              autoFocus
            />
          ) : (
            <div 
              className="text-sm font-bold cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
              onDoubleClick={handleDoubleClick}
              title="Double-click to edit"
            >
              {data.label || 'TypeScript Code'}
            </div>
          )}
          <div className="text-xs text-gray-500">Execute TypeScript code</div>
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
