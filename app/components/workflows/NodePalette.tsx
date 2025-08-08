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
      eventType: 'engagement',
      eventName: 'page_view',
      filterItemName: '',
      filterItemCategory: '',
      filterItemId: '',
      filterValue: undefined,
    },
  },
  {
    type: 'promo_code',
    label: 'Get Promo Code',
    description: 'Get a promo code from a batch',
    icon: '🎫',
    data: {
      type: 'promo_code',
      batchId: '',
      batchName: '',
      outputVariable: 'promoCode',
      codeType: 'random',
      specificCode: '',
    },
  },
  {
    type: 'push_notification',
    label: 'Push Notification',
    description: 'Send a push notification',
    icon: '🔔',
    data: {
      type: 'push_notification',
      title: 'New notification',
      body: 'Notification message',
      targetUsers: 'specific',
    },
  },
  {
    type: 'whatsapp_message',
    label: 'WhatsApp Message',
    description: 'Send a WhatsApp message',
    icon: '💬',
    data: {
      type: 'whatsapp_message',
      provider: 'freshchat',
      templateName: '',
      namespace: '',
      language: 'ar',
      fromPhone: '',
      toPhone: '',
      bodyVariable1: '',
      bodyVariable2: '',
      bodyVariable3: '',
      buttonVariable: '',
      variableMappings: {
        fromPhone: '',
        toPhone: '',
        bodyVariable1: '',
        bodyVariable2: '',
        bodyVariable3: '',
        buttonVariable: '',
      },
    },
  },
  {
    type: 'sms_message',
    label: 'SMS Message',
    description: 'Send an SMS message',
    icon: '📱',
    data: {
      type: 'sms_message',
      provider: 'unifonic',
      messageType: 'direct',
      templateName: '',
      language: 'en',
      fromPhone: '',
      toPhone: '',
      message: '',
      variableMappings: {
        fromPhone: '',
        toPhone: '',
        message: '',
      },
    },
  },
  {
    type: 'personalization',
    label: 'Smart Campaign',
    description: 'Send personalized messages based on customer behavior',
    icon: '🎯',
    data: {
      type: 'personalization',
      ruleName: '',
      trigger: 'first_visit',
      message: '',
      messageType: 'email',
      variableMappings: {
        ruleName: '',
        trigger: '',
        message: '',
      },
    },
  },
];

const NodePalette = () => {
  const { addNodes, getNodes } = useReactFlow();

  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: string, data: any) => {
      event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, data }));
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const calculateNewNodePosition = useCallback(() => {
    const nodes = getNodes();
    let position = { x: 400, y: 100 }; // Default position

    if (nodes.length > 0) {
      // Find the rightmost node to position the new node next to it
      const rightmostNode = nodes.reduce((rightmost, current) => {
        return (current.position.x > rightmost.position.x) ? current : rightmost;
      });

      // Position the new node to the right of the rightmost node
      position = {
        x: rightmostNode.position.x + 350, // 350px spacing
        y: rightmostNode.position.y
      };
    }

    return position;
  }, [getNodes]);

  const handleAddNode = useCallback(
    (template: NodeTemplate) => {
      const position = calculateNewNodePosition();
      const newNode = {
        id: `${template.type}-${Date.now()}`,
        type: template.type,
        position,
        data: template.data,
      };
      addNodes(newNode);
    },
    [addNodes, calculateNewNodePosition]
  );

  return (
    <div className="bg-white border-r border-gray-200 w-64 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Nodes</h3>
      
      <div className="space-y-3">
        {nodeTemplates.map((template) => (
          <div
            key={template.type}
            className="group cursor-pointer"
            draggable
            onDragStart={(e) => onDragStart(e, template.type, template.data)}
            onClick={() => handleAddNode(template)}
          >
            <div className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {template.label}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
        <div className="space-y-2">
          <button
            onClick={() => {
              // Add a complete workflow template
              const triggerPosition = { x: 100, y: 100 };
              const actionPosition = { x: 450, y: 100 };
              
              const triggerNode = {
                id: `trigger-${Date.now()}`,
                type: 'trigger',
                position: triggerPosition,
                data: { 
                  eventType: 'engagement', 
                  eventName: 'page_view',
                  filterItemName: '',
                  filterItemCategory: '',
                  filterItemId: '',
                  filterValue: undefined,
                },
              };
              const actionNode = {
                id: `action-${Date.now()}`,
                type: 'push_notification',
                position: actionPosition,
                data: {
                  type: 'push_notification',
                  title: 'Welcome!',
                  body: 'Thanks for visiting our app!',
                  targetUsers: 'specific',
                },
              };
              addNodes([triggerNode, actionNode]);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            + Add Welcome Workflow
          </button>
          <button
            onClick={() => {
              // Add a simple trigger-action pair
              const triggerPosition = { x: 100, y: 200 };
              const actionPosition = { x: 450, y: 200 };
              
              const triggerNode = {
                id: `trigger-${Date.now()}`,
                type: 'trigger',
                position: triggerPosition,
                data: { 
                  eventType: 'conversion', 
                  eventName: 'purchase',
                  filterItemName: '',
                  filterItemCategory: '',
                  filterItemId: '',
                  filterValue: undefined,
                },
              };
              const actionNode = {
                id: `action-${Date.now()}`,
                type: 'push_notification',
                position: actionPosition,
                data: {
                  type: 'push_notification',
                  title: 'Purchase Complete!',
                  body: 'Thank you for your purchase!',
                  targetUsers: 'specific',
                },
              };
              addNodes([triggerNode, actionNode]);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            + Add Purchase Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodePalette; 