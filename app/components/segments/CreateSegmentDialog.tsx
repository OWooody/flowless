'use client';

import { useState } from 'react';

interface CreateSegmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSegmentCreated: (segment: any) => void;
}

interface SegmentForm {
  name: string;
  description: string;
  naturalLanguageQuery: string;
}

export function CreateSegmentDialog({ isOpen, onClose, onSegmentCreated }: CreateSegmentDialogProps) {
  const [form, setForm] = useState<SegmentForm>({
    name: '',
    description: '',
    naturalLanguageQuery: '',
  });
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (field: keyof SegmentForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getAISuggestions = async () => {
    if (!form.naturalLanguageQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Suggest 3 different ways to create a user segment for: "${form.naturalLanguageQuery}". Return only the suggestions as a JSON array of strings.`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.type === 'text_response' && data.content) {
          try {
            const suggestions = JSON.parse(data.content);
            setAiSuggestions(Array.isArray(suggestions) ? suggestions : []);
            setShowSuggestions(true);
          } catch (e) {
            console.error('Failed to parse AI suggestions:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.naturalLanguageQuery.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // First, get the SQL query from AI
      const aiResponse = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Convert this natural language query to a SQL query that selects distinct userId from the Event table: "${form.naturalLanguageQuery}". 
          Return ONLY the SQL query, nothing else. The query should be valid and safe.`,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to get SQL query from AI');
      }

      const aiData = await aiResponse.json();
      let sqlQuery = '';

      if (aiData.type === 'text_response' && aiData.content) {
        // Extract SQL query from AI response
        sqlQuery = aiData.content.trim();
        
        // Remove any markdown formatting if present
        if (sqlQuery.startsWith('```sql')) {
          sqlQuery = sqlQuery.replace(/```sql\n?/, '').replace(/```\n?/, '');
        }
        if (sqlQuery.startsWith('```')) {
          sqlQuery = sqlQuery.replace(/```\n?/, '').replace(/```\n?/, '');
        }
        
        sqlQuery = sqlQuery.trim();
      } else {
        throw new Error('Failed to get valid SQL query from AI');
      }

      // Now create the segment using the manual endpoint
      const segmentResponse = await fetch('/api/segments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          query: sqlQuery,
        }),
      });

      if (segmentResponse.ok) {
        const segmentData = await segmentResponse.json();
        if (segmentData.segment) {
          onSegmentCreated(segmentData.segment);
          setForm({ name: '', description: '', naturalLanguageQuery: '' });
          setAiSuggestions([]);
          setShowSuggestions(false);
        } else {
          throw new Error('Failed to create segment');
        }
      } else {
        const errorData = await segmentResponse.json();
        throw new Error(errorData.error || 'Failed to create segment');
      }
    } catch (error) {
      console.error('Error creating segment:', error);
      alert(`Failed to create segment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setForm(prev => ({ ...prev, naturalLanguageQuery: suggestion }));
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Create New User Segment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Segment Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Segment Name *
              </label>
              <input
                type="text"
                id="name"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 block w-full form-input"
                placeholder="e.g., High-Value Customers"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="mt-1 block w-full form-textarea"
                placeholder="Describe what this segment represents..."
              />
            </div>

            {/* Natural Language Query */}
            <div>
              <label htmlFor="naturalLanguageQuery" className="block text-sm font-medium text-gray-700">
                Describe the users you want to target *
              </label>
              <div className="mt-1 relative">
                <textarea
                  id="naturalLanguageQuery"
                  value={form.naturalLanguageQuery}
                  onChange={(e) => handleInputChange('naturalLanguageQuery', e.target.value)}
                  rows={4}
                  className="block w-full form-textarea"
                  placeholder="e.g., Users who made a purchase in the last 30 days but haven't returned, or users who visited the pricing page but didn't sign up..."
                  required
                />
                <div className="mt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={getAISuggestions}
                    disabled={loading || !form.naturalLanguageQuery.trim()}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Getting suggestions...' : 'Get AI suggestions'}
                  </button>
                  <span className="text-xs text-gray-500">
                    Be specific about user behavior, timeframes, and criteria
                  </span>
                </div>
              </div>

              {/* AI Suggestions */}
              {showSuggestions && aiSuggestions.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">AI Suggestions:</h4>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left p-2 text-sm text-blue-800 hover:bg-blue-100 rounded"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Examples */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Examples:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Users who signed up in the last 7 days"</li>
                <li>• "Users who visited the pricing page but didn't convert"</li>
                <li>• "Users who made a purchase over $100 in the last 30 days"</li>
                <li>• "Users who haven't logged in for 60+ days"</li>
                <li>• "Users who completed onboarding but haven't made a purchase"</li>
                <li>• "Users who clicked on email campaigns in the last 14 days"</li>
              </ul>
              <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Be specific about timeframes, event names, and user actions. 
                  The AI will convert your description into a proper SQL query that selects distinct user IDs.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name.trim() || !form.naturalLanguageQuery.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Segment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 