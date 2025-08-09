'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useWorkflowContext } from './WorkflowContext';

interface ConditionNodeData {
  conditionType: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  leftOperand: string;
  rightOperand: string;
  description?: string;
  label?: string;
}

const ConditionNode = memo(({ data, selected, id }: NodeProps<ConditionNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Condition');
  const { setNodes, getNodes } = useReactFlow();
  const { validateNodeName, removeNodeOutput } = useWorkflowContext();

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'Condition');
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      // Validate the node name before updating
      const existingNames = getNodes()
        .filter(node => node.id !== id)
        .map(node => node.data.label || '')
        .filter(Boolean);

      const validation = validateNodeName(editValue.trim(), existingNames);
      
      if (!validation.isValid) {
        // If validation fails, revert to the original name
        setEditValue(data.label || 'Condition');
        alert(validation.error);
        return;
      }

      // Remove the old node output if the name is changing
      if (data.label && data.label !== editValue.trim()) {
        removeNodeOutput(id);
      }

      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() || 'Condition' } }
            : node
        )
      );
    }
  }, [editValue, data.label, id, setNodes, getNodes, validateNodeName, removeNodeOutput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(data.label || 'Condition');
    }
  }, [handleBlur, data.label]);

  const getConditionSymbol = (type: string) => {
    switch (type) {
      case 'equals': return '=';
      case 'not_equals': return '≠';
      case 'greater_than': return '>';
      case 'less_than': return '<';
      case 'contains': return '⊃';
      case 'not_contains': return '⊅';
      default: return '?';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-yellow-300' : 'border-yellow-400'} min-w-[200px]`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-white border-2 border-yellow-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-crosshair"
        style={{ left: '-10px' }}
      />
      
      {/* True branch handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-5 h-5 bg-green-500 border-2 border-green-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-crosshair"
        style={{ right: '-10px', top: '30%' }}
      />
      
      {/* False branch handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-5 h-5 bg-red-500 border-2 border-red-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-crosshair"
        style={{ right: '-10px', top: '70%' }}
      />
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                placeholder="Condition"
              />
            ) : (
              <div 
                className="text-sm font-semibold cursor-pointer hover:bg-white hover:bg-opacity-10 px-1 py-0.5 rounded"
                onDoubleClick={handleDoubleClick}
                title="Double-click to edit"
              >
                {data.label || 'Condition'}
              </div>
            )}
            <p className="text-xs text-yellow-100">
              {(data.conditionType || 'equals').replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2 space-y-1">
          <div className="text-xs">
            <div className="font-medium truncate">
              {data.leftOperand || 'Left operand'}
            </div>
            <div className="text-yellow-100 text-center text-sm font-bold">
              {getConditionSymbol(data.conditionType || 'equals')}
            </div>
            <div className="font-medium truncate">
              {data.rightOperand || 'Right operand'}
            </div>
          </div>
        </div>
        
        {/* Branch labels */}
        <div className="mt-2 flex justify-between text-xs">
          <div className="text-green-200">True</div>
          <div className="text-red-200">False</div>
        </div>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode; 