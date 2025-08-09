'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import CodeMirrorEditor from './CodeMirrorEditor';
import { useWorkflowContext } from './WorkflowContext';

const TypeScriptNode = ({ data, selected, id }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Code');
  const [codeValue, setCodeValue] = useState(data.code || '');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const { setNodes, getNodes } = useReactFlow();
  const { previousNodeOutputs, addNodeOutput, validateNodeName, removeNodeOutput } = useWorkflowContext();

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
        <div className={`border-t border-gray-300 p-3 ${
          runResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
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
