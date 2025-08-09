'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useWorkflowContext } from './WorkflowContext';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface ConditionBranch {
  id: string;
  type: 'if' | 'elseIf' | 'else';
  condition?: string;
  label: string;
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
  const [isRunning, setIsRunning] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const { setNodes, getNodes } = useReactFlow();
  const { validateNodeName, removeNodeOutput } = useWorkflowContext();

  // Initialize default branches if none exist
  const branches = data.branches || [
    { id: 'if-1', type: 'if', condition: '', label: 'If' },
    { id: 'else-1', type: 'else', condition: undefined, label: 'Else' }
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
      condition: '',
      label: 'Else If'
    };

    // Find the index of the else branch to insert above it
    const elseIndex = branches.findIndex(branch => branch.type === 'else');
    const insertIndex = elseIndex !== -1 ? elseIndex : branches.length;

    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                branches: [
                  ...branches.slice(0, insertIndex),
                  newBranch,
                  ...branches.slice(insertIndex)
                ]
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

  const getBranchIcon = (type: string) => {
    switch (type) {
      case 'if': return 'If';
      case 'elseIf': return 'Else If';
      case 'else': return 'Else';
      default: return '';
    }
  };

  const handleRunCondition = useCallback(async () => {
    setIsRunning(true);
    setActiveBranchId(null);
    
    try {
      // Evaluate conditions in order: if, elseIf, else
      let trueBranchId: string | null = null;
      
      for (const branch of branches) {
        if (branch.type === 'else') {
          // Else branch is only true if no previous conditions were true
          if (trueBranchId === null) {
            trueBranchId = branch.id;
          }
          break;
        }
        
        if (branch.condition?.trim()) {
          try {
            // Evaluate the condition expression
            // Create a safe evaluation context with previous node outputs
            const conditionResult = evaluateCondition(branch.condition);
            
            if (conditionResult === true) {
              trueBranchId = branch.id;
              break; // Stop at first true condition
            }
          } catch (error) {
            console.error(`Error evaluating condition in ${branch.type} branch:`, error);
            // Continue to next branch if this one fails
          }
        }
      }
      
      // Highlight the true branch
      setActiveBranchId(trueBranchId);
      
    } catch (error) {
      console.error('Failed to evaluate conditions:', error);
    } finally {
      setIsRunning(false);
    }
  }, [branches]);

  // Helper function to safely evaluate condition expressions
  const evaluateCondition = (condition: string): boolean => {
    // Remove any dangerous functions and create a safe evaluation context
    const safeEval = new Function('return ' + condition);
    
    try {
      const result = safeEval();
      // Convert result to boolean
      return Boolean(result);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  };

  const getBranchStyle = (branchId: string) => {
    if (activeBranchId === branchId) {
      return 'bg-green-100 border-green-400 shadow-md';
    }
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className={`bg-white border-2 rounded-lg shadow-lg ${selected ? 'border-blue-500' : 'border-gray-300'} min-w-[350px]`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400"
        style={{ left: '-25px' }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-300 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0 18 0z" />
            </svg>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0"
              autoFocus
              placeholder="Condition"
            />
          ) : (
            <span
              className="text-sm font-medium text-gray-700 cursor-pointer"
              onDoubleClick={handleDoubleClick}
            >
              {data.label || 'Condition'}
            </span>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRunCondition();
          }}
          disabled={isRunning}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
          title="Run condition"
        >
          {isRunning ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Condition Branches */}
      <div className="p-4 space-y-3">
        {branches.map((branch, index) => (
          <div key={branch.id} className="relative">
            {/* Branch Content */}
            <div className={`rounded-lg p-3 border transition-all duration-200 ${getBranchStyle(branch.id)}`}>
              {activeBranchId === branch.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {branch.type !== 'else' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-600 font-medium">{getBranchIcon(branch.type)}:</div>
                    {branch.type !== 'if' && branches.length > 2 && (
                      <button
                        onClick={() => removeBranch(branch.id)}
                        className="text-red-400 hover:text-red-600 transition-colors text-sm"
                        title="Remove branch"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-900 rounded border border-gray-700">
                    <CodeMirror
                      value={branch.condition || ''}
                      onChange={(value: string) => updateBranchCondition(branch.id, value)}
                      extensions={[javascript()]}
                      theme={oneDark}
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
                <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded border border-gray-200">
                  Else
                </div>
              )}
              
              {/* Output Handle for this branch */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${branch.id}-output`}
                className="w-3 h-3 bg-gray-400"
                style={{ 
                  right: '-25px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
            </div>
          </div>
        ))}
        
        {/* Add Condition Button */}
        <button
          onClick={addBranch}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2 border border-gray-300"
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