'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, CompletionContext, Completion, CompletionResult } from '@codemirror/autocomplete';
import { basicSetup } from 'codemirror';

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  previousNodeOutputs?: Record<string, any>;
  placeholder?: string;
  className?: string;
}

// Enhanced autocompletion with comprehensive JavaScript built-ins
function createEnhancedCompletions(previousNodeOutputs: Record<string, any> = {}) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\w.]*$/);
    if (!word) return null;

    const completions: Completion[] = [];
    
    // JavaScript built-in globals and APIs
    const jsBuiltIns = [
      // Global objects
      { label: 'console', type: 'class', info: 'Console API for logging' },
      { label: 'JSON', type: 'class', info: 'JSON utility functions' },
      { label: 'Math', type: 'class', info: 'Math utility functions' },
      { label: 'Date', type: 'class', info: 'Date constructor and utilities' },
      { label: 'RegExp', type: 'class', info: 'Regular expression constructor' },
      { label: 'Error', type: 'class', info: 'Error constructor' },
      { label: 'Promise', type: 'class', info: 'Promise constructor' },
      { label: 'Map', type: 'class', info: 'Map data structure' },
      { label: 'Set', type: 'class', info: 'Set data structure' },
      { label: 'WeakMap', type: 'class', info: 'WeakMap data structure' },
      { label: 'WeakSet', type: 'class', info: 'WeakSet data structure' },
      { label: 'Symbol', type: 'class', info: 'Symbol constructor' },
      { label: 'Proxy', type: 'class', info: 'Proxy constructor' },
      { label: 'Reflect', type: 'class', info: 'Reflect utility object' },
      { label: 'Array', type: 'class', info: 'Array constructor' },
      { label: 'Object', type: 'class', info: 'Object constructor' },
      { label: 'String', type: 'class', info: 'String constructor' },
      { label: 'Number', type: 'class', info: 'Number constructor' },
      { label: 'Boolean', type: 'class', info: 'Boolean constructor' },
      { label: 'Function', type: 'class', info: 'Function constructor' },
      { label: 'ArrayBuffer', type: 'class', info: 'ArrayBuffer constructor' },
      { label: 'DataView', type: 'class', info: 'DataView constructor' },
      { label: 'Int8Array', type: 'class', info: 'Int8Array constructor' },
      { label: 'Uint8Array', type: 'class', info: 'Uint8Array constructor' },
      { label: 'Int16Array', type: 'class', info: 'Int16Array constructor' },
      { label: 'Uint16Array', type: 'class', info: 'Uint16Array constructor' },
      { label: 'Int32Array', type: 'class', info: 'Int32Array constructor' },
      { label: 'Uint32Array', type: 'class', info: 'Uint32Array constructor' },
      { label: 'Float32Array', type: 'class', info: 'Float32Array constructor' },
      { label: 'Float64Array', type: 'class', info: 'Float64Array constructor' },
      
      // Global functions
      { label: 'fetch', type: 'function', info: 'Fetch API for HTTP requests' },
      { label: 'setTimeout', type: 'function', info: 'Set timeout for delayed execution' },
      { label: 'setInterval', type: 'function', info: 'Set interval for repeated execution' },
      { label: 'clearTimeout', type: 'function', info: 'Clear timeout' },
      { label: 'clearInterval', type: 'function', info: 'Clear interval' },
      { label: 'parseInt', type: 'function', info: 'Parse string to integer' },
      { label: 'parseFloat', type: 'function', info: 'Parse string to float' },
      { label: 'isNaN', type: 'function', info: 'Check if value is NaN' },
      { label: 'isFinite', type: 'function', info: 'Check if value is finite' },
      { label: 'encodeURI', type: 'function', info: 'Encode URI' },
      { label: 'decodeURI', type: 'function', info: 'Decode URI' },
      { label: 'encodeURIComponent', type: 'function', info: 'Encode URI component' },
      { label: 'decodeURIComponent', type: 'function', info: 'Decode URI component' },
      { label: 'escape', type: 'function', info: 'Escape string (deprecated)' },
      { label: 'unescape', type: 'function', info: 'Unescape string (deprecated)' },
      { label: 'eval', type: 'function', info: 'Evaluate JavaScript code string' },
      { label: 'atob', type: 'function', info: 'Decode base64 string' },
      { label: 'btoa', type: 'function', info: 'Encode string to base64' },
      
      // Array methods (when typing after array)
      { label: 'push', type: 'method', info: 'Add element to end of array' },
      { label: 'pop', type: 'method', info: 'Remove last element from array' },
      { label: 'shift', type: 'method', info: 'Remove first element from array' },
      { label: 'unshift', type: 'method', info: 'Add element to beginning of array' },
      { label: 'slice', type: 'method', info: 'Extract portion of array' },
      { label: 'splice', type: 'method', info: 'Change contents of array' },
      { label: 'forEach', type: 'method', info: 'Execute function for each element' },
      { label: 'map', type: 'method', info: 'Create new array with results' },
      { label: 'filter', type: 'method', info: 'Create new array with filtered elements' },
      { label: 'reduce', type: 'method', info: 'Reduce array to single value' },
      { label: 'reduceRight', type: 'method', info: 'Reduce array from right to left' },
      { label: 'find', type: 'method', info: 'Find first element that satisfies condition' },
      { label: 'findIndex', type: 'method', info: 'Find index of first element that satisfies condition' },
      { label: 'includes', type: 'method', info: 'Check if array includes value' },
      { label: 'indexOf', type: 'method', info: 'Find index of value in array' },
      { label: 'lastIndexOf', type: 'method', info: 'Find last index of value in array' },
      { label: 'join', type: 'method', info: 'Join array elements into string' },
      { label: 'reverse', type: 'method', info: 'Reverse array order' },
      { label: 'sort', type: 'method', info: 'Sort array elements' },
      { label: 'length', type: 'property', info: 'Get array length' },
      
      // String methods (when typing after string)
      { label: 'charAt', type: 'method', info: 'Get character at index' },
      { label: 'charCodeAt', type: 'method', info: 'Get character code at index' },
      { label: 'concat', type: 'method', info: 'Concatenate strings' },
      { label: 'endsWith', type: 'method', info: 'Check if string ends with value' },
      { label: 'includes', type: 'method', info: 'Check if string contains value' },
      { label: 'indexOf', type: 'method', info: 'Find index of value in string' },
      { label: 'lastIndexOf', type: 'method', info: 'Find last index of value in string' },
      { label: 'padEnd', type: 'method', info: 'Pad string to end' },
      { label: 'padStart', type: 'method', info: 'Pad string to start' },
      { label: 'repeat', type: 'method', info: 'Repeat string' },
      { label: 'replace', type: 'method', info: 'Replace string content' },
      { label: 'replaceAll', type: 'method', info: 'Replace all occurrences' },
      { label: 'search', type: 'method', info: 'Search for regex match' },
      { label: 'slice', type: 'method', info: 'Extract portion of string' },
      { label: 'split', type: 'method', info: 'Split string into array' },
      { label: 'startsWith', type: 'method', info: 'Check if string starts with value' },
      { label: 'substring', type: 'method', info: 'Extract substring' },
      { label: 'toLowerCase', type: 'method', info: 'Convert to lowercase' },
      { label: 'toUpperCase', type: 'method', info: 'Convert to uppercase' },
      { label: 'trim', type: 'method', info: 'Remove whitespace from ends' },
      { label: 'trimEnd', type: 'method', info: 'Remove whitespace from end' },
      { label: 'trimStart', type: 'method', info: 'Remove whitespace from start' },
      { label: 'length', type: 'property', info: 'Get string length' }
    ];

    completions.push(...jsBuiltIns);

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

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  previousNodeOutputs = {},
  placeholder = '// Your code here...',
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [localValue, setLocalValue] = useState(value);

  // Memoize the extensions to avoid recreating them unnecessarily
  const extensions = useMemo(() => [
    basicSetup,
    javascript(),
    oneDark,
    autocompletion({
      override: [createEnhancedCompletions(previousNodeOutputs)],
      defaultKeymap: true,
      activateOnTyping: false, // Disable auto-activation to prevent freezing
      maxRenderedOptions: 10, // Reduced for better performance
      activateOnTypingDelay: 300 // Increased delay for better performance
    }),

    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Update local state only - no node updates while typing
        const newValue = update.state.doc.toString();
        setLocalValue(newValue);
        
        // Call onChange if provided, with debouncing to avoid too many updates
        if (onChange) {
          // Use a simple debounce to avoid excessive updates
          clearTimeout((window as any).codeChangeTimeout);
          (window as any).codeChangeTimeout = setTimeout(() => {
            onChange(newValue);
          }, 500); // 500ms debounce
        }
      }
    }),
    EditorView.theme({
      '&': {
        fontSize: '14px',
        fontFamily: 'monospace'
      },
      '.cm-content': {
        padding: '12px',
        minHeight: '120px'
      },
      '.cm-line': {
        lineHeight: '1.5'
      },
      '.cm-tooltip.cm-tooltip-autocomplete': {
        backgroundColor: '#2d3748',
        border: '1px solid #4a5568',
        borderRadius: '4px',
        color: '#e2e8f0'
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul': {
        maxHeight: '200px',
        overflow: 'auto'
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
        padding: '4px 8px',
        cursor: 'pointer'
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: '#4a5568'
      }
    })
  ], [previousNodeOutputs]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create the editor state with proper autocompletion
    const state = EditorState.create({
      doc: value,
      extensions
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, [extensions]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorView && editorView.state.doc.toString() !== value) {
      const transaction = editorView.state.update({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: value
        }
      });
      editorView.dispatch(transaction);
    }
  }, [value, editorView]);

  return (
    <div className={`${className}`}>
      {/* Available Variables Display */}
      {Object.keys(previousNodeOutputs).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-t-md px-3 py-2 text-xs">
          <div className="text-blue-700 font-medium mb-1">
            💡 Available variables:
          </div>
          <div className="text-blue-600 space-x-2">
            {Object.keys(previousNodeOutputs).map((nodeName, index) => (
              <span key={index} className="inline-block bg-blue-100 px-2 py-1 rounded">
                {nodeName}
              </span>
            ))}
          </div>

        </div>
      )}
      
      <div 
        ref={editorRef} 
        className={`bg-gray-900 rounded-b-md border border-gray-300 ${Object.keys(previousNodeOutputs).length > 0 ? 'border-t-0 rounded-t-none' : ''} overflow-hidden shadow-lg`}
      />
      <div className="bg-gray-50 border border-gray-300 border-t-0 px-3 py-2 text-xs text-gray-600">
        💡 <strong>Tip:</strong> Remember to use <code className="bg-gray-200 px-1 rounded">return</code> to output data for the next node. 
        Code changes are saved automatically as you type.
      </div>
    </div>
  );
};

export default CodeMirrorEditor;
