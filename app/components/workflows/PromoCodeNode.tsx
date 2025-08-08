'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface PromoCodeNodeData {
  type: string;
  batchId: string;
  batchName: string;
  outputVariable: string;
  codeType: 'random' | 'sequential' | 'specific';
  specificCode?: string;
}

const PromoCodeNode = memo(({ data }: NodeProps<PromoCodeNodeData>) => {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg border-2 border-purple-400 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Get Promo Code</h3>
            <p className="text-xs text-purple-100">
              {data.codeType === 'random' ? 'Random code' : 
               data.codeType === 'sequential' ? 'Sequential code' : 'Specific code'}
            </p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded p-2 space-y-1">
          <div className="text-xs">
            <div className="font-medium truncate">
              {data.batchName || 'Select Batch'}
            </div>
            <div className="text-purple-100 truncate">
              Output: {data.outputVariable || 'promoCode'}
            </div>
            {data.codeType === 'specific' && data.specificCode && (
              <div className="text-purple-100 truncate">
                Code: {data.specificCode}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

PromoCodeNode.displayName = 'PromoCodeNode';

export default PromoCodeNode; 