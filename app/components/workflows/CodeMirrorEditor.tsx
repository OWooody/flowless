'use client';

import React, { useEffect, useRef, useState } from 'react';
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

// Custom autocomplete for previous node data
function createNodeDataCompletions(previousNodeOutputs: Record<string, any> = {}) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\{\{[\w.]*$/);
    if (!word) return null;

    const completions: Completion[] = [];
    
    // Add basic variables
    completions.push(
      { label: 'input', type: 'variable', info: 'Input data from previous nodes' },
      { label: 'workflow', type: 'variable', info: 'Workflow context and variables' },
      { label: 'previous', type: 'variable', info: 'Output from previous node' },
      { label: 'console', type: 'variable', info: 'Console object for logging' },
      { label: 'JSON', type: 'variable', info: 'JSON utility functions' },
      { label: 'Date', type: 'variable', info: 'Date constructor' },
      { label: 'Math', type: 'variable', info: 'Math utility functions' },
      { label: 'Array', type: 'variable', info: 'Array constructor' },
      { label: 'Object', type: 'variable', info: 'Object constructor' },
      { label: 'String', type: 'variable', info: 'String constructor' },
      { label: 'Number', type: 'variable', info: 'Number constructor' },
      { label: 'Boolean', type: 'variable', info: 'Boolean constructor' },
      { label: 'fetch', type: 'function', info: 'Fetch API for HTTP requests' }
    );

    // Add previous node outputs
    Object.entries(previousNodeOutputs).forEach(([nodeId, output]) => {
      if (typeof output === 'object' && output !== null) {
        // Add the node ID itself
        completions.push({
          label: `previous.${nodeId}`,
          type: 'variable',
          info: `Output from node ${nodeId}`
        });

        // Add nested properties
        Object.keys(output).forEach(key => {
          completions.push({
            label: `previous.${nodeId}.${key}`,
            type: 'property',
            info: `${key} from node ${nodeId}`
          });
        });
      } else {
        completions.push({
          label: `previous.${nodeId}`,
          type: 'variable',
          info: `Output from node ${nodeId}: ${String(output)}`
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

  useEffect(() => {
    if (!editorRef.current) return;

    // Create the editor state with custom autocomplete
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        autocompletion({
          override: [createNodeDataCompletions(previousNodeOutputs)]
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
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
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, []);

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

  // Update autocomplete when previousNodeOutputs changes
  useEffect(() => {
    if (editorView) {
      // Recreate the editor with updated completions
      const newState = EditorState.create({
        doc: editorView.state.doc,
        extensions: [
          basicSetup,
          javascript(),
          oneDark,
          autocompletion({
            override: [createNodeDataCompletions(previousNodeOutputs)]
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
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
            }
          })
        ]
      });
      
      editorView.setState(newState);
    }
  }, [previousNodeOutputs, editorView, onChange]);

  return (
    <div 
      ref={editorRef} 
      className={`bg-gray-900 rounded-b-md border border-gray-300 border-t-0 overflow-hidden shadow-lg ${className}`}
    />
  );
};

export default CodeMirrorEditor;
