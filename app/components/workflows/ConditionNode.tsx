'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useWorkflowContext } from './WorkflowContext';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, CompletionContext, Completion, CompletionResult } from '@codemirror/autocomplete';

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

// Enhanced autocompletion with previous node outputs for condition expressions
function createConditionCompletions(previousNodeOutputs: Record<string, any> = {}) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\w.]*$/);
    if (!word) return null;

    const completions: Completion[] = [];
    
    // JavaScript comparison operators and logical operators
    const operators = [
      { label: '===', type: 'operator', info: 'Strict equality' },
      { label: '!==', type: 'operator', info: 'Strict inequality' },
      { label: '==', type: 'operator', info: 'Loose equality' },
      { label: '!=', type: 'operator', info: 'Loose inequality' },
      { label: '>', type: 'operator', info: 'Greater than' },
      { label: '>=', type: 'operator', info: 'Greater than or equal' },
      { label: '<', type: 'operator', info: 'Less than' },
      { label: '<=', type: 'operator', info: 'Less than or equal' },
      { label: '&&', type: 'operator', info: 'Logical AND' },
      { label: '||', type: 'operator', info: 'Logical OR' },
      { label: '!', type: 'keyword', info: 'Logical NOT' },
    ];

    // JavaScript built-ins useful for conditions
    const jsBuiltIns = [
      { label: 'Array.isArray', type: 'function', info: 'Check if value is an array' },
      { label: 'typeof', type: 'keyword', info: 'Get type of value' },
      { label: 'instanceof', type: 'keyword', info: 'Check if object is instance of class' },
      { label: 'in', type: 'keyword', info: 'Check if property exists in object' },
      { label: 'hasOwnProperty', type: 'method', info: 'Check if object has own property' },
      { label: 'includes', type: 'method', info: 'Check if array/string contains value' },
      { label: 'startsWith', type: 'method', info: 'Check if string starts with value' },
      { label: 'endsWith', type: 'method', info: 'Check if string ends with value' },
      { label: 'length', type: 'property', info: 'Get length of array/string' },
      { label: 'toString', type: 'method', info: 'Convert value to string' },
      { label: 'Number', type: 'class', info: 'Number constructor and utilities' },
      { label: 'String', type: 'class', info: 'String constructor and utilities' },
      { label: 'Boolean', type: 'class', info: 'Boolean constructor and utilities' },
      { label: 'Date', type: 'class', info: 'Date constructor and utilities' },
      { label: 'RegExp', type: 'class', info: 'Regular expression constructor' },
      { label: 'JSON', type: 'class', info: 'JSON utility functions' },
    ];

    completions.push(...operators, ...jsBuiltIns);

    // Add trigger data specifically if available
    if (previousNodeOutputs.trigger) {
      const trigger = previousNodeOutputs.trigger;
      completions.push({
        label: 'trigger',
        type: 'variable',
        info: 'Trigger data from workflow execution'
      });
      
      // Add trigger properties
      if (trigger.data) {
        completions.push({
          label: 'trigger.data',
          type: 'property',
          info: 'Input data that triggered the workflow'
        });
      }
      
      if (trigger.type) {
        completions.push({
          label: 'trigger.type',
          type: 'property',
          info: `Type of trigger: ${trigger.type}`
        });
      }
      
      if (trigger.timestamp) {
        completions.push({
          label: 'trigger.timestamp',
          type: 'property',
          info: 'When the workflow was triggered'
        });
      }
      
      if (trigger.testData) {
        completions.push({
          label: 'trigger.testData',
          type: 'property',
          info: 'Test data used to trigger the workflow'
        });
      }
    }

    // Add previous node outputs by node name
    Object.entries(previousNodeOutputs).forEach(([nodeName, value]) => {
      // Skip trigger as it's already handled above
      if (nodeName === 'trigger') return;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // For nested objects, add the node name as a variable
        completions.push({
          label: nodeName,
          type: 'variable',
          info: `${nodeName} from previous node output`
        });
        
        // Add nested properties
        Object.keys(value).forEach(nestedKey => {
          completions.push({
            label: `${nodeName}.${nestedKey}`,
            type: 'property',
            info: `${nestedKey} from ${nodeName}`
          });
        });
      } else if (Array.isArray(value)) {
        // For arrays, add the node name as a variable
        completions.push({
          label: nodeName,
          type: 'variable',
          info: `${nodeName} (array) from previous node output`
        });
        
        // Add array methods
        completions.push(
          { label: `${nodeName}.length`, type: 'property', info: `Length of ${nodeName} array` },
          { label: `${nodeName}.includes()`, type: 'method', info: `Check if ${nodeName} contains value` },
          { label: `${nodeName}.indexOf()`, type: 'method', info: `Find index of value in ${nodeName}` }
        );
      } else {
        // For simple values, add them directly
        completions.push({
          label: nodeName,
          type: 'variable',
          info: `${nodeName}: ${String(value)}`
        });
      }
    });

    return {
      from: word.from,
      options: completions,
      validFor: /^[\w.]*$/
    };
  };
}

const ConditionNode = memo(({ data, selected, id }: NodeProps<ConditionNodeData>) => {
  const [branches, setBranches] = useState<ConditionBranch[]>(data.branches || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Condition');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const { setNodes, getNodes } = useReactFlow();
  const { validateNodeName, removeNodeOutput, previousNodeOutputs, addNodeOutput, clearPreviewData } = useWorkflowContext();



  // Initialize branches when component mounts
  useEffect(() => {
    if (!branches.length && data.branches?.length) {
      setBranches(data.branches);
    } else if (!branches.length) {
      setBranches([
        { id: 'if-1', type: 'if', condition: '', label: 'If' },
        { id: 'else-1', type: 'else', condition: undefined, label: 'Else' }
      ]);
    }
  }, [data.branches, branches.length]);

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

  // Helper function to safely evaluate condition expressions with previous node outputs
  const evaluateCondition = (condition: string): boolean => {
    if (!condition.trim()) return false;
    
    try {
      // Create a safe evaluation context with previous node outputs
      const context = {
        ...previousNodeOutputs,
        // Add utility functions and constructors
        Array, Object, String, Number, Boolean, Date, RegExp, JSON
      };
      
      // Create a function that evaluates the condition in the context
      const safeEval = new Function(
        ...Object.keys(context),
        `return ${condition}`
      );
      
      // Execute with the context as arguments
      const result = safeEval(...Object.values(context));
      
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
      
      {/* Available Variables Info */}
      {Object.keys(previousNodeOutputs).length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-700 font-medium mb-1">
            💡 Available variables from previous nodes:
          </div>
          <div className="text-xs text-blue-600 space-x-2">
            {Object.keys(previousNodeOutputs).map((nodeName, index) => (
              <span key={index} className="inline-block bg-blue-100 px-2 py-1 rounded">
                {nodeName}
              </span>
            ))}
          </div>
          {/* Show trigger data specifically */}
          {previousNodeOutputs.trigger && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1">
                🚀 Trigger data available:
              </div>
              <div className="text-xs text-blue-600 space-x-2">
                <span className="inline-block bg-green-100 px-2 py-1 rounded">
                  trigger.data
                </span>
                <span className="inline-block bg-green-100 px-2 py-1 rounded">
                  trigger.type
                </span>
                <span className="inline-block bg-green-100 px-2 py-1 rounded">
                  trigger.timestamp
                </span>
                <span className="inline-block bg-green-100 px-2 py-1 rounded">
                  trigger.testData
                </span>
              </div>
              <button
                onClick={() => removeNodeOutput(id)}
                className="mt-2 text-red-500 hover:text-red-700 text-xs"
                title="Clear trigger data"
              >
                Clear Trigger Data
              </button>
            </div>
          )}
        </div>
      )}
      
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
                      extensions={[
                        javascript(),
                        autocompletion({
                          override: [createConditionCompletions(previousNodeOutputs)],
                          defaultKeymap: true,
                          activateOnTyping: true,
                          maxRenderedOptions: 15,
                          activateOnTypingDelay: 100
                        })
                      ]}
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
        
        {/* Help Section */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          {/* Trigger Data Status */}
          {previousNodeOutputs.trigger && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <div className="text-xs text-blue-700 font-medium mb-1">
                🎯 Trigger Data Available {previousNodeOutputs.trigger.isPreview && '(Preview Mode)'}
              </div>
              <div className="text-xs text-blue-600 space-y-1">
                <div>• Type: {previousNodeOutputs.trigger.type}</div>
                <div>• Event: {previousNodeOutputs.trigger.eventType}</div>
                <div>• Data: {JSON.stringify(previousNodeOutputs.trigger.data).substring(0, 50)}...</div>
                {previousNodeOutputs.trigger.isPreview && (
                  <div className="text-blue-500 italic">💡 Use this data to test your conditions!</div>
                )}
                <button
                  onClick={clearPreviewData}
                  className="mt-2 text-red-500 hover:text-red-700 text-xs underline"
                  title="Clear trigger data"
                >
                  Clear Trigger Data
                </button>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-600 font-medium mb-2">
            💡 Condition Examples:
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Use JavaScript expressions to evaluate conditions</div>
            <div>• Access data from previous nodes using their output variables</div>
            <div>• Use standard JavaScript operators: ===, !==, {'>'} , {'<'} , &&, ||</div>
            <div>• Check array properties: Array.isArray(), .length, .includes()</div>
            <div>• Access trigger data: trigger.data, trigger.type, trigger.timestamp</div>
            <div>• Example: trigger.data.userId === "123" && trigger.type === "manual"</div>
          </div>
        </div>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode; 