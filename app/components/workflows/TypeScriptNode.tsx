'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import CodeMirrorEditor from './CodeMirrorEditor';
import { useWorkflowContext } from './WorkflowContext';

// JSON Tree Component
const JSONTree = ({ data, level = 0, expanded, setExpanded }: { 
  data: any; 
  level?: number;
  expanded: Record<string, boolean>;
  setExpanded: (expanded: Record<string, boolean>) => void;
}) => {
  if (data === null) return <span className="text-gray-500">null</span>;
  if (data === undefined) return <span className="text-gray-500">undefined</span>;
  
  if (typeof data === 'string') {
    return <span className="text-green-600">"{data}"</span>;
  }
  
  if (typeof data === 'number') {
    return <span className="text-blue-600">{data}</span>;
  }
  
  if (typeof data === 'boolean') {
    return <span className="text-purple-600">{data.toString()}</span>;
  }
  
  if (Array.isArray(data)) {
    return (
      <div>
        <span 
          className="cursor-pointer text-gray-700 hover:text-gray-900"
          onClick={() => setExpanded({ ...expanded, [level.toString()]: !expanded[level.toString()] })}
        >
          {expanded[level.toString()] ? '▼' : '►'} data [{data.length} items]
        </span>
        {expanded[level.toString()] && (
          <div className="ml-4 mt-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-start">
                <span className="text-gray-500 mr-2">{index}:</span>
                <div className="flex-1">
                  {typeof item === 'object' && item !== null ? (
                    <JSONTree data={item} level={level + 1} expanded={expanded} setExpanded={setExpanded} />
                  ) : (
                    <span className="text-gray-700">{JSON.stringify(item)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return (
      <div>
        <span 
          className="cursor-pointer text-gray-700 hover:text-gray-900"
          onClick={() => setExpanded({ ...expanded, [level.toString()]: !expanded[level.toString()] })}
        >
          {expanded[level.toString()] ? '▼' : '►'} {keys.length} keys
        </span>
        {expanded[level.toString()] && (
          <div className="ml-4 mt-1">
            {keys.map(key => (
              <div key={key} className="flex items-start">
                <span className="text-gray-600 mr-2">{key}:</span>
                <div className="flex-1">
                  {typeof data[key] === 'object' && data[key] !== null ? (
                    <JSONTree data={data[key]} level={level + 1} expanded={expanded} setExpanded={setExpanded} />
                  ) : (
                    <span className="text-gray-700">{JSON.stringify(data[key])}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return <span className="text-gray-700">{String(data)}</span>;
};

const TypeScriptNode = ({ data, selected, id }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Code');
  const [codeValue, setCodeValue] = useState(data.code || '');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'output' | 'json'>('output');
  const [jsonTreeExpanded, setJsonTreeExpanded] = useState<Record<string, boolean>>({});
  const { setNodes, getNodes } = useReactFlow();
  const { previousNodeOutputs, addNodeOutput, validateNodeName, removeNodeOutput } = useWorkflowContext();

  // Function to expand all nodes in JSON tree
  const expandAll = useCallback(() => {
    if (runResult?.output) {
      const expanded: Record<string, boolean> = {};
      const expandRecursive = (obj: any, level: number = 0) => {
        expanded[level.toString()] = true;
        if (Array.isArray(obj)) {
          obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              expandRecursive(item, level + 1);
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(value => {
            if (typeof value === 'object' && value !== null) {
              expandRecursive(value, level + 1);
            }
          });
        }
      };
      expandRecursive(runResult.output);
      setJsonTreeExpanded(expanded);
    }
  }, [runResult?.output]);

  // Function to collapse all nodes in JSON tree
  const collapseAll = useCallback(() => {
    setJsonTreeExpanded({});
  }, []);

  // Function to handle tab switching
  const handleTabSwitch = useCallback((tab: 'output' | 'json') => {
    setActiveTab(tab);
    if (tab === 'json') {
      // Reset JSON tree expansion when switching to JSON tab
      setJsonTreeExpanded({});
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'Code');
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
        setEditValue(data.label || 'Code');
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
            ? { ...node, data: { ...node.data, label: editValue.trim() || 'Code' } }
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
      setEditValue(data.label || 'Code');
    }
  }, [handleBlur, data.label]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCodeValue(newCode);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, code: newCode } }
          : node
      )
    );
  }, [id, setNodes]);

  const handleRunCode = useCallback(async () => {
    if (!codeValue.trim()) return;
    
    setIsRunning(true);
    setRunResult(null);
    
    try {
      const response = await fetch('/api/workflows/test-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId: id,
          nodeType: 'typescript',
          nodeData: { code: codeValue },
          previousOutputs: previousNodeOutputs,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Store this node's output using the node name
        const nodeName = data.label || 'Code';
        addNodeOutput(id, nodeName, result.output);
      }
      
      setRunResult(result);
    } catch (error) {
      setRunResult({ success: false, error: 'Failed to run code' });
    } finally {
      setIsRunning(false);
    }
  }, [codeValue, id, previousNodeOutputs, addNodeOutput, data.label]);

  return (
    <div className={`bg-white border-2 rounded-lg shadow-lg ${selected ? 'border-blue-500' : 'border-gray-300'} min-w-[300px]`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-300 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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
              placeholder="Code"
            />
          ) : (
            <span
              className="text-sm font-medium text-gray-700 cursor-pointer"
              onDoubleClick={handleDoubleClick}
            >
              {data.label || 'Code'}
            </span>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRunCode();
          }}
          disabled={isRunning || !codeValue.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
          title="Run code"
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
      
      {/* Code Editor */}
      <CodeMirrorEditor
        value={codeValue}
        onChange={handleCodeChange}
        previousNodeOutputs={previousNodeOutputs}
        placeholder="// Your code here..."
        className="min-h-[120px]"
      />

      {/* Run Results */}
      {runResult && (
        <div className={`border-t border-gray-300 ${
          runResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabSwitch('output')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'output'
                  ? 'text-green-700 border-b-2 border-green-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Output
            </button>
            <button
              onClick={() => handleTabSwitch('json')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'json'
                  ? 'text-green-700 border-b-2 border-green-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              JSON
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-3">
            {activeTab === 'output' ? (
              <div className="text-xs space-y-1">
                {runResult.success ? (
                  <div className="text-green-700">
                    {runResult.output && (
                      <pre className="bg-gray-100 p-2 rounded border border-gray-300 text-xs overflow-auto max-h-32">
                        {JSON.stringify(runResult.output, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="text-red-700">
                    <div><strong>Error:</strong> {runResult.error}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs">
                {runResult.success && runResult.output ? (
                  <div>
                    {/* JSON Tree Controls */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={expandAll}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded"
                          title="Expand all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={collapseAll}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded"
                          title="Collapse all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            // List view logic could be added here
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded"
                          title="List view"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(runResult.output, null, 2));
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded"
                          title="Copy JSON"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(runResult.output, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'output.json';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded"
                          title="Download JSON"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* JSON Tree */}
                    <div className="max-h-48 overflow-auto">
                      <JSONTree data={runResult.output} expanded={jsonTreeExpanded} setExpanded={setJsonTreeExpanded} />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No data to display</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400"
      />
    </div>
  );
};

export default TypeScriptNode;
