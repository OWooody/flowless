import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text_response' | 'query_results' | 'error' | 'segment_created';
  data?: any;
  sql_query?: string;
  description?: string;
  suggested_actions?: string[];
  can_create_segment?: boolean;
  segment?: any;
}

export default function AnalyticsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creatingSegment, setCreatingSegment] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [pendingSegmentData, setPendingSegmentData] = useState<{
    sqlQuery: string;
    description: string;
    resultCount: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateSegmentName = (sqlQuery: string, description: string, resultCount: number): string => {
    // Extract key information from the SQL query
    const upperQuery = sqlQuery.toUpperCase();
    
    // Try to extract event name
    let eventName = '';
    const eventMatch = sqlQuery.match(/name\s*=\s*['"`]([^'"`]+)['"`]/i);
    if (eventMatch) {
      eventName = eventMatch[1];
    }
    
    // Try to extract time period
    let timePeriod = '';
    if (upperQuery.includes('INTERVAL')) {
      const intervalMatch = sqlQuery.match(/INTERVAL\s+['"`]?(\d+)\s+(\w+)['"`]?/i);
      if (intervalMatch) {
        const number = intervalMatch[1];
        const unit = intervalMatch[2].toLowerCase();
        timePeriod = `Last ${number} ${unit}`;
      }
    } else if (upperQuery.includes('NOW()')) {
      timePeriod = 'Recent';
    }
    
    // Try to extract date conditions
    if (upperQuery.includes('TODAY') || upperQuery.includes('CURRENT_DATE')) {
      timePeriod = 'Today';
    } else if (upperQuery.includes('YESTERDAY')) {
      timePeriod = 'Yesterday';
    } else if (upperQuery.includes('THIS WEEK')) {
      timePeriod = 'This Week';
    } else if (upperQuery.includes('LAST WEEK')) {
      timePeriod = 'Last Week';
    } else if (upperQuery.includes('THIS MONTH')) {
      timePeriod = 'This Month';
    } else if (upperQuery.includes('LAST MONTH')) {
      timePeriod = 'Last Month';
    }
    
    // Try to extract value conditions
    let valueCondition = '';
    if (upperQuery.includes('VALUE >')) {
      valueCondition = 'High Value';
    } else if (upperQuery.includes('VALUE <')) {
      valueCondition = 'Low Value';
    } else if (upperQuery.includes('VALUE =')) {
      valueCondition = 'Specific Value';
    }
    
    // Try to extract category conditions
    let category = '';
    const categoryMatch = sqlQuery.match(/category\s*=\s*['"`]([^'"`]+)['"`]/i);
    if (categoryMatch) {
      category = categoryMatch[1];
    }
    
    // Try to extract action conditions
    let action = '';
    const actionMatch = sqlQuery.match(/action\s*=\s*['"`]([^'"`]+)['"`]/i);
    if (actionMatch) {
      action = actionMatch[1];
    }
    
    // Build the segment name
    let nameParts: string[] = [];
    
    // Add user count if available
    if (resultCount > 0) {
      nameParts.push(`${resultCount} Users`);
    }
    
    // Add event name
    if (eventName) {
      nameParts.push(eventName);
    }
    
    // Add action
    if (action) {
      nameParts.push(action);
    }
    
    // Add category
    if (category) {
      nameParts.push(category);
    }
    
    // Add value condition
    if (valueCondition) {
      nameParts.push(valueCondition);
    }
    
    // Add time period
    if (timePeriod) {
      nameParts.push(timePeriod);
    }
    
    // If we have good parts, use them
    if (nameParts.length > 0) {
      return nameParts.join(' - ');
    }
    
    // Fallback: use description with smart truncation
    const cleanDescription = description
      .replace(/^Show me /i, '')
      .replace(/^Find /i, '')
      .replace(/^Get /i, '')
      .replace(/^List /i, '')
      .replace(/^Display /i, '')
      .replace(/^users? /i, '')
      .replace(/^who /i, '')
      .replace(/^that /i, '')
      .replace(/^with /i, '')
      .replace(/^have /i, '')
      .replace(/^had /i, '')
      .replace(/^use /i, '')
      .replace(/^column/i, '')
      .replace(/^userId/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Capitalize first letter and limit length
    const capitalized = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);
    return capitalized.length > 50 ? capitalized.substring(0, 47) + '...' : capitalized;
  };

  const createSegmentFromQuery = async (sqlQuery: string, description: string, resultCount: number) => {
    // Generate an intelligent segment name based on the query and description
    const suggestedName = generateSegmentName(sqlQuery, description, resultCount);
    
    // Show modal for user to confirm/edit the segment name
    setSegmentName(suggestedName);
    setPendingSegmentData({ sqlQuery, description, resultCount });
    setShowSegmentModal(true);
  };

  const confirmCreateSegment = async () => {
    if (!pendingSegmentData || !segmentName.trim()) return;
    
    setCreatingSegment(true);
    setShowSegmentModal(false);
    
    try {
      const response = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Create a segment with the name "${segmentName}" using this query: ${pendingSegmentData.sqlQuery}`,
          function_call: 'create_segment_from_query',
          function_args: {
            segment_name: segmentName,
            description: pendingSegmentData.description,
            sql_query: pendingSegmentData.sqlQuery,
            estimated_count: pendingSegmentData.resultCount
          }
        }),
      });

      const data = await response.json();
      
      if (data.type === 'segment_created') {
        const segmentMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Successfully created segment: "${data.segment.name}" with ${data.segment.userCount || pendingSegmentData.resultCount} users`,
          type: 'segment_created',
          segment: data.segment,
        };
        setMessages(prev => [...prev, segmentMessage]);
      } else {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Failed to create segment: ${data.message || 'Unknown error'}`,
          type: 'error',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error creating segment:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Failed to create segment. Please try again.',
        type: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setCreatingSegment(false);
      setPendingSegmentData(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      let assistantMessage: Message;

      if (data.type === 'query_results') {
        console.log('Query results debug:', {
          can_create_segment: data.can_create_segment,
          resultCount: data.results?.length,
          sql_query: data.sql_query,
          suggested_actions: data.suggested_actions
        });
        
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.description || 'Query executed successfully',
          type: 'query_results',
          data: data.results,
          sql_query: data.sql_query,
          description: data.description,
          suggested_actions: data.suggested_actions,
          can_create_segment: data.can_create_segment,
        };
      } else if (data.type === 'segment_created') {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.description || 'Segment created successfully',
          type: 'segment_created',
          segment: data.segment,
        };
      } else if (data.type === 'text_response') {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          type: 'text_response',
        };
      } else if (data.type === 'error') {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message || 'An error occurred',
          type: 'error',
          sql_query: data.sql_query,
        };
      } else {
        // Fallback for old format
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.analysis || 'No response received',
          type: 'text_response',
        };
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.',
        type: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-4 ${
            isUser
              ? 'bg-blue-500 text-white'
              : message.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {/* Message Content */}
          <p className="whitespace-pre-wrap mb-3">{message.content}</p>
          
          {/* SQL Query Section */}
          {message.sql_query && (
            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Generated SQL Query:</h4>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                {message.sql_query}
              </pre>
            </div>
          )}
          
          {/* Query Results */}
          {message.type === 'query_results' && message.data && (
            <div className="mt-4">
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  View Results ({message.data.length} records)
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(message.data[0] || {}).map(key => (
                          <th key={key} className="px-2 py-1 border text-left font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {message.data.slice(0, 10).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.values(row).map((value: any, j: number) => (
                            <td key={j} className="px-2 py-1 border text-sm">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {message.data.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing first 10 of {message.data.length} results
                    </p>
                  )}
                </div>
              </details>
            </div>
          )}
          
          {/* Create Segment Button */}
          {(() => {
            console.log('Render debug for message:', {
              can_create_segment: message.can_create_segment,
              has_sql_query: !!message.sql_query,
              message_type: message.type,
              result_count: message.data?.length
            });
            return message.can_create_segment && message.sql_query;
          })() && (
            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Create User Segment</h4>
                  <p className="text-sm text-green-700">
                    This query returns user IDs. Would you like to create a segment from these results?
                  </p>
                </div>
                <button
                  onClick={() => createSegmentFromQuery(
                    message.sql_query!, 
                    message.description || 'Query results', 
                    message.data?.length || 0
                  )}
                  disabled={creatingSegment}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSegment ? 'Creating...' : 'Create Segment'}
                </button>
              </div>
            </div>
          )}
          
          {/* Suggested Actions */}
          {message.suggested_actions && message.suggested_actions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Suggested Actions:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {message.suggested_actions.map((action, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Segment Created Success Message */}
          {message.type === 'segment_created' && message.segment && (
            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-green-800">Segment Created Successfully!</h4>
                  <p className="text-sm text-green-700">
                    Name: {message.segment.name} | Users: {message.segment.userCount || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <h3 className="text-lg font-semibold mb-2">Welcome to Analytics Chat</h3>
            <p className="mb-4">Ask questions about your analytics data to get AI-powered insights.</p>
            <div className="text-left max-w-md mx-auto">
              <p className="font-medium mb-2">Example questions:</p>
              <ul className="space-y-2">
                <li>• Show me the top 10 users by event count</li>
                <li>• How many events do we have in total?</li>
                <li>• What's the distribution of events by category?</li>
                <li>• Show me users who haven't had events in 30 days</li>
                <li>• Create a segment of high-value users</li>
              </ul>
            </div>
          </div>
        )}
        
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                <span className="text-gray-500">Analyzing your data...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Segment Creation Modal */}
      {showSegmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create User Segment</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segment Name
              </label>
              <input
                type="text"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter segment name..."
                maxLength={100}
              />
            </div>
            
            {pendingSegmentData && (
              <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                <p className="text-gray-600 mb-2">
                  <strong>Query:</strong> {pendingSegmentData.sqlQuery}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>Description:</strong> {pendingSegmentData.description}
                </p>
                <p className="text-gray-600">
                  <strong>Estimated Users:</strong> {pendingSegmentData.resultCount}
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSegmentModal(false);
                  setPendingSegmentData(null);
                  setSegmentName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={creatingSegment}
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateSegment}
                disabled={creatingSegment || !segmentName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingSegment ? 'Creating...' : 'Create Segment'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your analytics data..."
            className="flex-1 form-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 