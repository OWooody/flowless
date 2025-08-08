'use client';

import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';

interface NodeTemplate {
  type: string;
  label: string;
  description: string;
  icon: string;
  data: any;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'trigger',
    label: 'Trigger',
    description: 'Start workflow when event occurs',
    icon: '⚡',
    data: {
      triggerType: 'webhook',
      webhookUrl: '',
      schedule: '',
      description: '',
    },
  },
  {
    type: 'condition',
    label: 'Condition',
    description: 'Check if condition is met',
    icon: '🔍',
    data: {
      conditionType: 'equals',
      leftOperand: '',
      rightOperand: '',
      description: '',
    },
  },
  {
    type: 'action',
    label: 'Action',
    description: 'Perform an action',
    icon: '⚙️',
    data: {
      actionType: 'http_request',
      httpMethod: 'POST',
      url: '',
      headers: '',
      body: '',
      script: '',
      webhookUrl: '',
      webhookPayload: '',
      description: '',
    },
  },
  {
    type: 'typescript',
    label: 'TypeScript',
    description: 'Execute TypeScript code',
    icon: '📝',
    data: {
      code: '// Your TypeScript code here\nconsole.log("Hello from workflow!");\nreturn { success: true };',
      description: '',
    },
  },
];

const NodePalette = () => {
  const { addNodes } = useReactFlow();

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, data: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, data }));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="bg-white border-r border-gray-200 w-64 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Nodes</h3>
      <div className="space-y-3">
        {nodeTemplates.map((template) => (
          <div
            key={template.type}
            className="border border-gray-200 rounded-lg p-3 cursor-grab hover:border-blue-300 hover:shadow-sm transition-all"
            draggable
            onDragStart={(event) => onDragStart(event, template.type, template.data)}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{template.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{template.label}</h4>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette; 