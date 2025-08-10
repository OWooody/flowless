'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface DatabaseNodeData {
  operation: string;
  table: string;
  query: string;
  data?: string;
  description?: string;
  label?: string;
}

const DatabaseNode = memo(({ data, selected }: NodeProps<DatabaseNodeData>) => {
  const getIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'select':
        return 'SELECT';
      case 'insert':
        return 'INSERT';
      case 'update':
        return 'UPDATE';
      case 'delete':
        return 'DELETE';
      default:
        return operation.toUpperCase();
    }
  };

  return (
    <div className={`bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-red-300' : 'border-red-400'} min-w-[160px] max-w-[200px]`}>
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
              {data.label || 'Database'}
            </div>
            <div className="text-xs text-red-100 truncate">
              {getOperationLabel(data.operation)}
            </div>
          </div>
        </div>
        
        {/* Preview content */}
        <div className="bg-white bg-opacity-10 rounded p-2">
          <div className="text-xs text-red-100 truncate">
            {data.table ? `Table: ${data.table}` : 'Click to configure'}
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

DatabaseNode.displayName = 'DatabaseNode';

export default DatabaseNode;
