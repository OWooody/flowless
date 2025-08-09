'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useWorkflowContext } from './WorkflowContext';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { monokai } from '@uiw/codemirror-theme-monokai';

interface ConditionBranch {
  id: string;
  type: 'if' | 'elseIf' | 'else';
  condition?: string;
  label: string;
  isActive: boolean;
}

interface ConditionNodeData {
  branches: ConditionBranch[];
  description?: string;
  label?: string;
}

const ConditionNode = memo(({ data, selected, id }: NodeProps<ConditionNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Condition');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const { setNodes, getNodes } = useReactFlow();
  const { validateNodeName, removeNodeOutput } = useWorkflowContext();

  // Initialize default branches if none exist
  const branches = data.branches || [
    { id: 'if-1', type: 'if', condition: 'return true;', label: 'If', isActive: true },
    { id: 'else-1', type: 'else', condition: undefined, label: 'Else', isActive: false }
  ];

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'Condition');
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      const existingNames = getNodes()
        .filter(node => node.id !== id)
        .map(node => node.data.label || '')
        .filter(Boolean);

      const validation = validateNodeName(editValue.trim(), existingNames);
      
      if (!validation.isValid) {
        setEditValue(data.label || 'Condition');
        alert(validation.error);
        return;
      }

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

  const updateBranchCondition = useCallback((branchId: string, condition: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                branches: branches.map(branch =>
                  branch.id === branchId
                    ? { ...branch, condition }
                    : branch
                )
              }
            }
          : node
      )
    );
  }, [id, setNodes, branches]);

  const addBranch = useCallback(() => {
    const newBranch: ConditionBranch = {
      id: `elseIf-${Date.now()}`,
      type: 'elseIf',
      condition: 'return false;',
      label: 'Else If',
      isActive: false
    };

    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                branches: [...branches, newBranch]
              }
            }
          : node
      )
    );
  }, [id, setNodes, branches]);

  const removeBranch = useCallback((branchId: string) => {
    if (branches.length <= 2) return; // Keep at least if and else
    
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                branches: branches.filter(branch => branch.id !== branchId)
              }
            }
          : node
      )
    );
  }, [id, setNodes, branches]);

  const toggleBranchActive = useCallback((branchId: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                branches: branches.map(branch =>
                  branch.id === branchId
                    ? { ...branch, isActive: !branch.isActive }
                    : branch
                )
              }
            }
          : node
      )
    );
  }, [id, setNodes, branches]);

  const moveBranch = useCallback((branchId: string, direction: 'up' | 'down') => {
    const currentIndex = branches.findIndex((b: any) => b.id === branchId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < branches.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return;
    }
    
    const newBranches = [...branches];
    [newBranches[currentIndex], newBranches[newIndex]] = [newBranches[newIndex], newBranches[currentIndex]];
    
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                branches: newBranches
              }
            }
          : node
      )
    );
  }, [id, setNodes, branches]);

  const getBranchIcon = (type: string) => {
    switch (type) {
      case 'if': return '🔵';
      case 'elseIf': return '🟡';
      case 'else': return '🔴';
      default: return '⚪';
    }
  };

  const getBranchColor = (type: string) => {
    switch (type) {
      case 'if': return 'from-blue-500 to-blue-600';
      case 'elseIf': return 'from-yellow-500 to-yellow-600';
      case 'else': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getBranchStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-400 border-green-300' : 'bg-transparent border-gray-300';
  };

  return (
    <div className={`bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg border-2 ${selected ? 'border-yellow-300' : 'border-yellow-400'} min-w-[350px]`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-white"
        style={{ left: '-25px' }}
      />
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0 18 0z" />
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
              Multiple conditional branches
            </p>
          </div>
        </div>
        
        {/* Condition Branches */}
        <div className="space-y-3 mb-4">
          {branches.map((branch, index) => (
            <div key={branch.id} className="relative">
              {/* Branch Header */}
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">{getBranchIcon(branch.type)}</span>
                <span className="text-sm font-medium">
                  {branch.type === 'elseIf' ? 'Else If' : branch.type === 'if' ? 'If' : 'Else'}
                </span>
                <span className="text-xs text-white text-opacity-70 ml-2">
                  #{index + 1}
                </span>
                <div className="ml-auto flex items-center space-x-2">
                  {/* Move Up/Down Buttons */}
                  {branches.length > 1 && (
                    <>
                      <button
                        onClick={() => moveBranch(branch.id, 'up')}
                        disabled={index === 0}
                        className="text-white text-opacity-70 hover:text-opacity-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => moveBranch(branch.id, 'down')}
                        disabled={index === branches.length - 1}
                        className="text-white text-opacity-70 hover:text-opacity-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        ⬇️
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => toggleBranchActive(branch.id)}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${getBranchStatusColor(branch.isActive)}`}
                    title={branch.isActive ? 'Active' : 'Inactive'}
                  />
                  {branch.type !== 'if' && branches.length > 2 && (
                    <button
                      onClick={() => removeBranch(branch.id)}
                      className="text-red-200 hover:text-red-100 transition-colors"
                      title="Remove branch"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              {/* Branch Content */}
              <div className={`bg-gradient-to-r ${getBranchColor(branch.type)} rounded-lg p-3 border border-white border-opacity-20`}>
                {branch.type !== 'else' ? (
                  <div>
                    <div className="text-xs text-white text-opacity-80 mb-2">Condition:</div>
                    <div className="bg-gray-900 rounded border border-gray-700">
                      <CodeMirror
                        value={branch.condition || 'return true;'}
                        onChange={(value: string) => updateBranchCondition(branch.id, value)}
                        extensions={[javascript()]}
                        theme={monokai}
                        basicSetup={{
                          lineNumbers: false,
                          foldGutter: false,
                          highlightActiveLine: false,
                          dropCursor: false,
                          allowMultipleSelections: false,
                          indentOnInput: false,
                          syntaxHighlighting: true,
                          bracketMatching: true,
                          closeBrackets: true,
                          autocompletion: true,
                          rectangularSelection: false,
                          crosshairCursor: false,
                          highlightActiveLineGutter: false,

                          searchKeymap: false,
                          foldKeymap: false,
                          completionKeymap: false,
                          lintKeymap: false,
                          tabSize: 2,
                        }}
                        height="80px"
                        className="text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white text-opacity-80">
                    Default path (no condition)
                  </div>
                )}
                
                {/* Output Handle for this branch */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${branch.id}-output`}
                  className="w-3 h-3 bg-white"
                  style={{ 
                    right: '-25px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Condition Button */}
        <button
          onClick={addBranch}
          className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <span>➕</span>
          <span>Add Condition</span>
        </button>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode; 