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
  onChange: (value: string) => void;
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
      { label: 'concat', type: 'method', info: 'Concatenate arrays' },
      { label: 'flat', type: 'method', info: 'Flatten nested arrays' },
      { label: 'flatMap', type: 'method', info: 'Map and flatten arrays' },
      { label: 'some', type: 'method', info: 'Test if any element satisfies condition' },
      { label: 'every', type: 'method', info: 'Test if all elements satisfy condition' },
      { label: 'fill', type: 'method', info: 'Fill array with value' },
      { label: 'copyWithin', type: 'method', info: 'Copy array elements within array' },
      { label: 'entries', type: 'method', info: 'Get array iterator of key-value pairs' },
      { label: 'keys', type: 'method', info: 'Get array iterator of keys' },
      { label: 'values', type: 'method', info: 'Get array iterator of values' },
      { label: 'from', type: 'method', info: 'Create array from array-like object' },
      { label: 'isArray', type: 'method', info: 'Check if value is array' },
      { label: 'of', type: 'method', info: 'Create array from arguments' },
      
      // String methods (when typing after string)
      { label: 'charAt', type: 'method', info: 'Get character at index' },
      { label: 'charCodeAt', type: 'method', info: 'Get character code at index' },
      { label: 'concat', type: 'method', info: 'Concatenate strings' },
      { label: 'endsWith', type: 'method', info: 'Check if string ends with substring' },
      { label: 'includes', type: 'method', info: 'Check if string includes substring' },
      { label: 'indexOf', type: 'method', info: 'Find index of substring' },
      { label: 'lastIndexOf', type: 'method', info: 'Find last index of substring' },
      { label: 'padStart', type: 'method', info: 'Pad string to start' },
      { label: 'padEnd', type: 'method', info: 'Pad string to end' },
      { label: 'repeat', type: 'method', info: 'Repeat string' },
      { label: 'replace', type: 'method', info: 'Replace substring' },
      { label: 'replaceAll', type: 'method', info: 'Replace all occurrences' },
      { label: 'search', type: 'method', info: 'Search for regex match' },
      { label: 'slice', type: 'method', info: 'Extract portion of string' },
      { label: 'split', type: 'method', info: 'Split string into array' },
      { label: 'startsWith', type: 'method', info: 'Check if string starts with substring' },
      { label: 'substring', type: 'method', info: 'Extract substring' },
      { label: 'toLowerCase', type: 'method', info: 'Convert to lowercase' },
      { label: 'toUpperCase', type: 'method', info: 'Convert to uppercase' },
      { label: 'trim', type: 'method', info: 'Remove whitespace from ends' },
      { label: 'trimStart', type: 'method', info: 'Remove whitespace from start' },
      { label: 'trimEnd', type: 'method', info: 'Remove whitespace from end' },
      { label: 'toLocaleLowerCase', type: 'method', info: 'Convert to lowercase with locale' },
      { label: 'toLocaleUpperCase', type: 'method', info: 'Convert to uppercase with locale' },
      { label: 'normalize', type: 'method', info: 'Normalize string unicode' },
      { label: 'match', type: 'method', info: 'Match string against regex' },
      { label: 'matchAll', type: 'method', info: 'Match all regex occurrences' },
      { label: 'localeCompare', type: 'method', info: 'Compare strings with locale' },
      { label: 'anchor', type: 'method', info: 'Create HTML anchor element' },
      { label: 'big', type: 'method', info: 'Wrap string in <big> tags' },
      { label: 'blink', type: 'method', info: 'Wrap string in <blink> tags' },
      { label: 'bold', type: 'method', info: 'Wrap string in <b> tags' },
      { label: 'fixed', type: 'method', info: 'Wrap string in <tt> tags' },
      { label: 'fontcolor', type: 'method', info: 'Wrap string in <font> with color' },
      { label: 'fontsize', type: 'method', info: 'Wrap string in <font> with size' },
      { label: 'italics', type: 'method', info: 'Wrap string in <i> tags' },
      { label: 'link', type: 'method', info: 'Wrap string in <a> tags' },
      { label: 'small', type: 'method', info: 'Wrap string in <small> tags' },
      { label: 'strike', type: 'method', info: 'Wrap string in <strike> tags' },
      { label: 'sub', type: 'method', info: 'Wrap string in <sub> tags' },
      { label: 'sup', type: 'method', info: 'Wrap string in <sup> tags' },
      
      // Object methods
      { label: 'keys', type: 'method', info: 'Get object keys' },
      { label: 'values', type: 'method', info: 'Get object values' },
      { label: 'entries', type: 'method', info: 'Get object entries' },
      { label: 'assign', type: 'method', info: 'Copy properties from source objects' },
      { label: 'create', type: 'method', info: 'Create new object with prototype' },
      { label: 'defineProperty', type: 'method', info: 'Define object property' },
      { label: 'defineProperties', type: 'method', info: 'Define multiple object properties' },
      { label: 'freeze', type: 'method', info: 'Freeze object' },
      { label: 'seal', type: 'method', info: 'Seal object' },
      { label: 'is', type: 'method', info: 'Check if values are same' },
      { label: 'isExtensible', type: 'method', info: 'Check if object is extensible' },
      { label: 'isFrozen', type: 'method', info: 'Check if object is frozen' },
      { label: 'isSealed', type: 'method', info: 'Check if object is sealed' },
      { label: 'getOwnPropertyDescriptor', type: 'method', info: 'Get property descriptor' },
      { label: 'getOwnPropertyNames', type: 'method', info: 'Get own property names' },
      { label: 'getOwnPropertySymbols', type: 'method', info: 'Get own symbol properties' },
      { label: 'getPrototypeOf', type: 'method', info: 'Get object prototype' },
      { label: 'setPrototypeOf', type: 'method', info: 'Set object prototype' },
      { label: 'preventExtensions', type: 'method', info: 'Prevent object extensions' },
      { label: 'hasOwnProperty', type: 'method', info: 'Check if object has own property' },
      { label: 'isPrototypeOf', type: 'method', info: 'Check if object is prototype of another' },
      { label: 'propertyIsEnumerable', type: 'method', info: 'Check if property is enumerable' },
      { label: 'toString', type: 'method', info: 'Convert object to string' },
      { label: 'valueOf', type: 'method', info: 'Get primitive value of object' },
      
      // Math methods
      { label: 'abs', type: 'method', info: 'Absolute value' },
      { label: 'acos', type: 'method', info: 'Arccosine' },
      { label: 'acosh', type: 'method', info: 'Hyperbolic arccosine' },
      { label: 'asin', type: 'method', info: 'Arcsine' },
      { label: 'asinh', type: 'method', info: 'Hyperbolic arcsine' },
      { label: 'atan', type: 'method', info: 'Arctangent' },
      { label: 'atan2', type: 'method', info: 'Arctangent of quotient' },
      { label: 'atanh', type: 'method', info: 'Hyperbolic arctangent' },
      { label: 'cbrt', type: 'method', info: 'Cube root' },
      { label: 'ceil', type: 'method', info: 'Round up to integer' },
      { label: 'clz32', type: 'method', info: 'Count leading zeros' },
      { label: 'cos', type: 'method', info: 'Cosine' },
      { label: 'cosh', type: 'method', info: 'Hyperbolic cosine' },
      { label: 'exp', type: 'method', info: 'Exponential' },
      { label: 'expm1', type: 'method', info: 'Exponential minus 1' },
      { label: 'floor', type: 'method', info: 'Round down to integer' },
      { label: 'fround', type: 'method', info: 'Round to nearest float32' },
      { label: 'hypot', type: 'method', info: 'Square root of sum of squares' },
      { label: 'imul', type: 'method', info: 'Integer multiplication' },
      { label: 'log', type: 'method', info: 'Natural logarithm' },
      { label: 'log1p', type: 'method', info: 'Natural logarithm of 1 + x' },
      { label: 'log2', type: 'method', info: 'Base 2 logarithm' },
      { label: 'log10', type: 'method', info: 'Base 10 logarithm' },
      { label: 'max', type: 'method', info: 'Maximum value' },
      { label: 'min', type: 'method', info: 'Minimum value' },
      { label: 'pow', type: 'method', info: 'Power' },
      { label: 'random', type: 'method', info: 'Random number between 0 and 1' },
      { label: 'round', type: 'method', info: 'Round to nearest integer' },
      { label: 'sign', type: 'method', info: 'Sign of number' },
      { label: 'sin', type: 'method', info: 'Sine' },
      { label: 'sinh', type: 'method', info: 'Hyperbolic sine' },
      { label: 'sqrt', type: 'method', info: 'Square root' },
      { label: 'tan', type: 'method', info: 'Tangent' },
      { label: 'tanh', type: 'method', info: 'Hyperbolic tangent' },
      { label: 'trunc', type: 'method', info: 'Truncate to integer' },
      
      // Date methods
      { label: 'getDate', type: 'method', info: 'Get day of month' },
      { label: 'getDay', type: 'method', info: 'Get day of week' },
      { label: 'getFullYear', type: 'method', info: 'Get full year' },
      { label: 'getHours', type: 'method', info: 'Get hours' },
      { label: 'getMilliseconds', type: 'method', info: 'Get milliseconds' },
      { label: 'getMinutes', type: 'method', info: 'Get minutes' },
      { label: 'getMonth', type: 'method', info: 'Get month' },
      { label: 'getSeconds', type: 'method', info: 'Get seconds' },
      { label: 'getTime', type: 'method', info: 'Get timestamp' },
      { label: 'getTimezoneOffset', type: 'method', info: 'Get timezone offset' },
      { label: 'getUTCDate', type: 'method', info: 'Get UTC day of month' },
      { label: 'getUTCDay', type: 'method', info: 'Get UTC day of week' },
      { label: 'getUTCFullYear', type: 'method', info: 'Get UTC full year' },
      { label: 'getUTCHours', type: 'method', info: 'Get UTC hours' },
      { label: 'getUTCMilliseconds', type: 'method', info: 'Get UTC milliseconds' },
      { label: 'getUTCMinutes', type: 'method', info: 'Get UTC minutes' },
      { label: 'getUTCMonth', type: 'method', info: 'Get UTC month' },
      { label: 'getUTCSeconds', type: 'method', info: 'Get UTC seconds' },
      { label: 'setDate', type: 'method', info: 'Set day of month' },
      { label: 'setFullYear', type: 'method', info: 'Set full year' },
      { label: 'setHours', type: 'method', info: 'Set hours' },
      { label: 'setMilliseconds', type: 'method', info: 'Set milliseconds' },
      { label: 'setMinutes', type: 'method', info: 'Set minutes' },
      { label: 'setMonth', type: 'method', info: 'Set month' },
      { label: 'setSeconds', type: 'method', info: 'Set seconds' },
      { label: 'setTime', type: 'method', info: 'Set timestamp' },
      { label: 'setUTCDate', type: 'method', info: 'Set UTC day of month' },
      { label: 'setUTCFullYear', type: 'method', info: 'Set UTC full year' },
      { label: 'setUTCHours', type: 'method', info: 'Set UTC hours' },
      { label: 'setUTCMilliseconds', type: 'method', info: 'Set UTC milliseconds' },
      { label: 'setUTCMinutes', type: 'method', info: 'Set UTC minutes' },
      { label: 'setUTCMonth', type: 'method', info: 'Set UTC month' },
      { label: 'setUTCSeconds', type: 'method', info: 'Set UTC seconds' },
      { label: 'toDateString', type: 'method', info: 'Convert to date string' },
      { label: 'toISOString', type: 'method', info: 'Convert to ISO string' },
      { label: 'toJSON', type: 'method', info: 'Convert to JSON string' },
      { label: 'toLocaleDateString', type: 'method', info: 'Convert to localized date string' },
      { label: 'toLocaleString', type: 'method', info: 'Convert to localized string' },
      { label: 'toLocaleTimeString', type: 'method', info: 'Convert to localized time string' },
      { label: 'toString', type: 'method', info: 'Convert to string' },
      { label: 'toTimeString', type: 'method', info: 'Convert to time string' },
      { label: 'toUTCString', type: 'method', info: 'Convert to UTC string' },
      { label: 'valueOf', type: 'method', info: 'Get timestamp value' },
      
      // Console methods
      { label: 'log', type: 'method', info: 'Log message to console' },
      { label: 'info', type: 'method', info: 'Log info message to console' },
      { label: 'warn', type: 'method', info: 'Log warning message to console' },
      { label: 'error', type: 'method', info: 'Log error message to console' },
      { label: 'debug', type: 'method', info: 'Log debug message to console' },
      { label: 'trace', type: 'method', info: 'Log stack trace to console' },
      { label: 'table', type: 'method', info: 'Display data in table format' },
      { label: 'group', type: 'method', info: 'Start console group' },
      { label: 'groupCollapsed', type: 'method', info: 'Start collapsed console group' },
      { label: 'groupEnd', type: 'method', info: 'End console group' },
      { label: 'time', type: 'method', info: 'Start timer' },
      { label: 'timeEnd', type: 'method', info: 'End timer and log duration' },
      { label: 'timeLog', type: 'method', info: 'Log current timer value' },
      { label: 'clear', type: 'method', info: 'Clear console' },
      { label: 'count', type: 'method', info: 'Count number of calls' },
      { label: 'countReset', type: 'method', info: 'Reset counter' },
      { label: 'dir', type: 'method', info: 'Display object properties' },
      { label: 'dirxml', type: 'method', info: 'Display XML/HTML tree' },
      { label: 'profile', type: 'method', info: 'Start profiling' },
      { label: 'profileEnd', type: 'method', info: 'End profiling' },
      
      // JSON methods
      { label: 'parse', type: 'method', info: 'Parse JSON string' },
      { label: 'stringify', type: 'method', info: 'Convert value to JSON string' },
      
      // Promise methods
      { label: 'resolve', type: 'method', info: 'Create resolved promise' },
      { label: 'reject', type: 'method', info: 'Create rejected promise' },
      { label: 'all', type: 'method', info: 'Wait for all promises to resolve' },
      { label: 'allSettled', type: 'method', info: 'Wait for all promises to settle' },
      { label: 'race', type: 'method', info: 'Wait for first promise to settle' },
      { label: 'any', type: 'method', info: 'Wait for first promise to resolve' },
      
      // Workflow-specific variables
      { label: 'input', type: 'variable', info: 'Input data from previous nodes' },
      { label: 'workflow', type: 'variable', info: 'Workflow context and variables' },
      { label: 'previous', type: 'variable', info: 'Output from previous node' }
    ];

    completions.push(...jsBuiltIns);

    // Add previous node outputs by node name (now stored with sanitized names)
    Object.entries(previousNodeOutputs).forEach(([nodeName, value]) => {
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
      options: completions
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

  // Create a stable reference to the onChange function
  const stableOnChange = useCallback((newValue: string) => {
    onChange(newValue);
  }, [onChange]);

  // Memoize the extensions to avoid recreating them unnecessarily
  const extensions = useMemo(() => [
    basicSetup,
    javascript(),
    oneDark,
    autocompletion({
      override: [createEnhancedCompletions(previousNodeOutputs)],
      defaultKeymap: true,
      activateOnTyping: true,
      maxRenderedOptions: 15, // Increased for more completions
      activateOnTypingDelay: 100 // Reduced delay for better responsiveness
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        stableOnChange(update.state.doc.toString());
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
  ], [previousNodeOutputs, stableOnChange]);

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
      <div 
        ref={editorRef} 
        className="bg-gray-900 rounded-b-md border border-gray-300 border-t-0 overflow-hidden shadow-lg"
      />
      <div className="bg-gray-50 border border-gray-300 border-t-0 px-3 py-2 text-xs text-gray-600">
        💡 <strong>Tip:</strong> Remember to use <code className="bg-gray-200 px-1 rounded">return</code> to output data for the next node
      </div>
    </div>
  );
};

export default CodeMirrorEditor;
