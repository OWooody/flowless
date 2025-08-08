import React, { useState, useEffect } from 'react';

interface DataPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (expression: string) => void;
  executionData?: any;
  eventData?: any;
  workflowContext?: any;
}

interface DataItem {
  path: string;
  value: any;
  type: 'event' | 'execution' | 'workflow';
  displayPath: string;
}

export default function DataPicker({ isOpen, onClose, onSelect, executionData, eventData, workflowContext }: DataPickerProps) {
  const [dataItems, setDataItems] = useState<DataItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const items: DataItem[] = [];

    // Add event data items (only actual event schema fields)
    if (eventData) {
      // Define the actual event schema fields we want to show
      const eventSchemaFields = [
        'id', 'name', 'category', 'action', 'value', 'path', 'pageTitle',
        'itemName', 'itemId', 'itemCategory', 'userId', 'userPhone',
        'organizationId', 'ipAddress', 'referrer', 'userAgent', 'timestamp'
      ];
      
      eventSchemaFields.forEach(field => {
        const value = eventData[field];
        if (value !== null && value !== undefined && value !== '') {
          let displayValue = String(value);
          
          // Handle special cases
          if (field === 'timestamp' && typeof value === 'string') {
            displayValue = new Date(value).toLocaleString();
          }
          
          items.push({
            path: `event.${field}`,
            value: displayValue,
            type: 'event',
            displayPath: field
          });
        }
      });
    }

    // Add execution history items (simplified)
    if (executionData && executionData.length > 0) {
      const lastExecution = executionData[0]; // Most recent
      
      // Only show key execution results
      if (lastExecution.results) {
        // Show success status
        if (lastExecution.results.success !== undefined) {
          items.push({
            path: 'execution.lastResult.success',
            value: String(lastExecution.results.success),
            type: 'execution',
            displayPath: 'lastResult.success'
          });
        }
        
        // Show execution ID
        if (lastExecution.results.executionId) {
          items.push({
            path: 'execution.lastResult.executionId',
            value: lastExecution.results.executionId,
            type: 'execution',
            displayPath: 'lastResult.executionId'
          });
        }
        
        // Show action results (simplified)
        if (lastExecution.results.actionResults && lastExecution.results.actionResults.length > 0) {
          lastExecution.results.actionResults.forEach((actionResult: any, index: number) => {
            if (actionResult.actionType) {
              items.push({
                path: `execution.lastResult.actionResults.${index}.actionType`,
                value: actionResult.actionType,
                type: 'execution',
                displayPath: `lastResult.actionResults.${index}.actionType`
              });
            }
            
            if (actionResult.result && actionResult.result.status) {
              items.push({
                path: `execution.lastResult.actionResults.${index}.status`,
                value: actionResult.result.status,
                type: 'execution',
                displayPath: `lastResult.actionResults.${index}.status`
              });
            }
          });
        }
      }
    }

    // Add workflow context items (promo codes and other workflow variables)
    if (workflowContext) {
      // Look for promo code variables and other workflow variables
      Object.keys(workflowContext).forEach(key => {
        const value = workflowContext[key];
        if (value && typeof value === 'string') {
          // Check if it's a promo code variable or related
          if (key.includes('promoCode') || key.includes('Code') || key.includes('code')) {
            items.push({
              path: `workflow.${key}`,
              value: String(value),
              type: 'workflow',
              displayPath: key
            });
          }
        }
      });

      // Add event data from workflowContext if it exists
      if (workflowContext.event) {
        const eventSchemaFields = [
          'id', 'name', 'category', 'action', 'value', 'path', 'pageTitle',
          'itemName', 'itemId', 'itemCategory', 'userId', 'userPhone',
          'organizationId', 'ipAddress', 'referrer', 'userAgent', 'timestamp'
        ];
        
        eventSchemaFields.forEach(field => {
          const value = workflowContext.event[field];
          if (value !== null && value !== undefined && value !== '') {
            let displayValue = String(value);
            
            // Handle special cases
            if (field === 'timestamp' && typeof value === 'string') {
              displayValue = new Date(value).toLocaleString();
            }
            
            items.push({
              path: `event.${field}`,
              value: displayValue,
              type: 'event',
              displayPath: field
            });
          }
        });
      }

      // Add direct event fields (for easier access)
      const directEventFields = ['userId', 'value', 'category', 'userEmail', 'userPhone', 'itemName', 'itemId', 'itemCategory'];
      directEventFields.forEach(field => {
        const value = workflowContext[field];
        if (value !== null && value !== undefined && value !== '') {
          items.push({
            path: `event.${field}`,
            value: String(value),
            type: 'event',
            displayPath: field
          });
        }
      });
    }

    setDataItems(items);
  }, [isOpen, eventData, executionData, workflowContext]);

  const handleSelect = (item: DataItem) => {
    onSelect(`{{${item.path}}}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            📊 Select from Previous Execution Data
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {dataItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>No execution data available</p>
              <p className="text-sm">Run the workflow first to see available data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Event Data Section */}
              {dataItems.filter(item => item.type === 'event').length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <span className="text-blue-500 mr-2">📋</span>
                    Event Data
                  </h4>
                  <div className="space-y-2">
                    {dataItems
                      .filter(item => item.type === 'event')
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-mono text-sm text-gray-600">
                              {item.displayPath}
                            </div>
                            <div className="text-sm text-gray-900 truncate">
                              {item.value}
                            </div>
                          </div>
                          <button
                            onClick={() => handleSelect(item)}
                            className="ml-3 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Execution History Section */}
              {dataItems.filter(item => item.type === 'execution').length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <span className="text-green-500 mr-2">📈</span>
                    Execution History
                  </h4>
                  <div className="space-y-2">
                    {dataItems
                      .filter(item => item.type === 'execution')
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-mono text-sm text-gray-600">
                              {item.displayPath}
                            </div>
                            <div className="text-sm text-gray-900 truncate">
                              {item.value}
                            </div>
                          </div>
                          <button
                            onClick={() => handleSelect(item)}
                            className="ml-3 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Workflow Variables Section */}
              {dataItems.filter(item => item.type === 'workflow').length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <span className="text-purple-500 mr-2">🎫</span>
                    Workflow Variables (Promo Codes)
                  </h4>
                  <div className="mb-3 text-sm text-gray-600">
                    Variables from previous promo code nodes in this workflow
                  </div>
                  <div className="space-y-2">
                    {dataItems
                      .filter(item => item.type === 'workflow')
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-mono text-sm text-gray-600">
                              {item.displayPath}
                            </div>
                            <div className="text-sm text-gray-900 truncate">
                              {item.value}
                            </div>
                          </div>
                          <button
                            onClick={() => handleSelect(item)}
                            className="ml-3 px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <p className="mb-2"><strong>How it works:</strong></p>
            <ul className="space-y-1 text-xs">
              <li>• Click "Select" to add the variable to your input</li>
              <li>• Variables are wrapped in <code className="bg-gray-200 px-1 rounded">{'{{}}'}</code></li>
              <li>• You can mix variables with normal text</li>
              <li>• Promo code variables: <code className="bg-gray-200 px-1 rounded">{'{{workflow.welcomeCode}}'}</code></li>
              <li>• Example: <code className="bg-gray-200 px-1 rounded">Use code {'{{workflow.welcomeCode}}'} for 20% off!</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 