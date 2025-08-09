'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

const TypeScriptNode = ({ data, selected, id }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Code');
  const [codeValue, setCodeValue] = useState(data.code || '');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const { setNodes } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data.label || 'Code');
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== data.label) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() || 'Code' } }
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
      setEditValue(data.label || 'Code');
    }
  }, [handleBlur, data.label]);

  const handleNodeClick = useCallback(() => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  }, [isEditing, isExpanded]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCodeValue(newCode);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, code: newCode } }
          : node
      )
    );
  }, [id, setNodes]);

  const handleCodeBlur = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, code: codeValue } }
          : node
      )
    );
  }, [codeValue, id, setNodes]);

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
          previousOutputs: {},
        }),
      });

      const result = await response.json();
      setRunResult(result);
    } catch (error) {
      setRunResult({ success: false, error: 'Failed to run code' });
    } finally {
      setIsRunning(false);
    }
  }, [codeValue, id]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [codeValue, isExpanded]);

  return (
    <div 
      className={`shadow-md rounded-md bg-gradient-to-r from-purple-500 to-purple-600 text-white border-2 transition-all duration-200 ${
        selected ? 'border-purple-300' : 'border-purple-400'
      } ${isExpanded ? 'min-w-[400px]' : 'w-auto'}`}
      onClick={handleNodeClick}
    >
      <div className="px-4 py-2">
        <div className="flex items-center">
          <div className="rounded-full w-8 h-8 flex items-center justify-center bg-purple-500">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div className="ml-2 flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="text-sm font-bold bg-transparent border-none outline-none focus:ring-0 w-full text-white"
                autoFocus
              />
            ) : (
              <div 
                className="text-sm font-bold cursor-pointer hover:bg-white hover:bg-opacity-10 px-1 py-0.5 rounded"
                onDoubleClick={handleDoubleClick}
                title="Double-click to edit name"
              >
                {data.label || 'Code'}
              </div>
            )}
            <div className="text-xs text-purple-100">Execute custom code</div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-gray-900 rounded-md border border-gray-700 overflow-hidden shadow-lg">
            <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex items-center justify-between">
              <div className="text-xs text-gray-400 font-mono">JavaScript</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRunCode();
                }}
                disabled={isRunning || !codeValue.trim()}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors"
                title="Run code"
              >
                {isRunning ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={codeValue}
                onChange={handleCodeChange}
                onBlur={handleCodeBlur}
                placeholder="// Your code here..."
                className="w-full bg-gray-900 text-gray-100 p-3 text-sm font-mono resize-none border-none outline-none focus:ring-0 pr-12"
                style={{
                  fontFamily: 'monospace',
                  lineHeight: '1.5',
                  minHeight: '120px',
                  maxHeight: '300px'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Run Results */}
      {runResult && (
        <div className="px-4 pb-4">
          <div className="bg-gray-100 rounded-md border border-gray-300 overflow-hidden">
            <div className="bg-gray-200 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Results</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRunResult(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3">
              {runResult.success ? (
                <div className="text-sm">
                  <div className="font-medium text-green-700 mb-2">✅ Success</div>
                  {runResult.output && (
                    <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-32">
                      {JSON.stringify(runResult.output, null, 2)}
                    </pre>
                  )}
                  {runResult.logs && runResult.logs.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium text-gray-700 mb-1">Logs:</div>
                      <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-20">
                        {runResult.logs.join('\n')}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <div className="font-medium text-red-700 mb-2">❌ Error</div>
                  <div className="text-red-600">{runResult.error}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
