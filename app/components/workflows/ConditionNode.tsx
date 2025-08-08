'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface ConditionNodeData {
  conditionType: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  leftOperand: string;
  rightOperand: string;
  description: string;
}

const ConditionNode = memo(({ data }: NodeProps<ConditionNodeData>) => {
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
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg border-2 border-orange-400 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-white border-2 border-orange-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-crosshair"
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
          <div>
            <h3 className="font-semibold text-sm">Condition</h3>
            <p className="text-xs text-orange-100">
              {data.conditionType.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2 space-y-1">
          <div className="text-xs">
            <div className="font-medium truncate">
              {data.leftOperand || 'Left operand'}
            </div>
            <div className="text-orange-100 text-center text-sm font-bold">
              {getConditionSymbol(data.conditionType)}
            </div>
            <div className="font-medium truncate">
              {data.rightOperand || 'Right operand'}
            </div>
          </div>
        </div>
        
        {data.description && (
          <div className="mt-2 text-xs text-orange-100 bg-white bg-opacity-10 rounded p-1">
            {data.description}
          </div>
        )}
        
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