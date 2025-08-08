'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface EventDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  properties?: any;
  examples?: any;
  isActive: boolean;
  createdAt: string;
}

interface BusinessMetric {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: string;
  unit?: string;
  examples?: any;
  isActive: boolean;
  createdAt: string;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function KnowledgeBasePage() {
  const { isSignedIn, userId } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'metrics' | 'entries'>('events');
  const [eventDefinitions, setEventDefinitions] = useState<EventDefinition[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    category: '',
    properties: '',
    examples: ''
  });

  const [metricForm, setMetricForm] = useState({
    name: '',
    description: '',
    formula: '',
    category: '',
    unit: '',
    examples: ''
  });

  const [entryForm, setEntryForm] = useState({
    title: '',
    content: '',
    tags: '',
    category: ''
  });

  useEffect(() => {
    if (isSignedIn) {
      fetchKnowledgeBase();
    }
  }, [isSignedIn, activeTab]);

  const fetchKnowledgeBase = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/knowledge/query?category=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Knowledge base data received:', data);
        setEventDefinitions(data.eventDefinitions || []);
        setBusinessMetrics(data.businessMetrics || []);
        setKnowledgeEntries(data.knowledgeEntries || []);
      } else {
        console.error('Failed to fetch knowledge base:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = {
        ...eventForm,
        properties: eventForm.properties ? JSON.parse(eventForm.properties) : null,
        examples: eventForm.examples ? JSON.parse(eventForm.examples) : null
      };
      
      console.log('Submitting event definition:', eventData);
      
      const response = await fetch('/api/knowledge/event-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Event definition created successfully:', result);
        setEventForm({ name: '', description: '', category: '', properties: '', examples: '' });
        setShowForm(false);
        await fetchKnowledgeBase(); // Wait for the fetch to complete
      } else {
        const errorData = await response.json();
        console.error('Failed to create event definition:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error creating event definition:', error);
    }
  };

  const handleMetricSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/knowledge/business-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metricForm,
          examples: metricForm.examples ? JSON.parse(metricForm.examples) : null
        })
      });

      if (response.ok) {
        setMetricForm({ name: '', description: '', formula: '', category: '', unit: '', examples: '' });
        setShowForm(false);
        fetchKnowledgeBase();
      }
    } catch (error) {
      console.error('Error creating business metric:', error);
    }
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/knowledge/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entryForm,
          tags: entryForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
      });

      if (response.ok) {
        setEntryForm({ title: '', content: '', tags: '', category: '' });
        setShowForm(false);
        fetchKnowledgeBase();
      }
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access the Knowledge Base</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="mt-2 text-gray-600">
            Define your events, business metrics, and business knowledge to enhance AI analytics.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'events', name: 'Event Definitions', count: eventDefinitions.length },
              { id: 'metrics', name: 'Business Metrics', count: businessMetrics.length },
              { id: 'entries', name: 'Knowledge Entries', count: knowledgeEntries.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {activeTab === 'events' && 'Event Definitions'}
                {activeTab === 'metrics' && 'Business Metrics'}
                {activeTab === 'entries' && 'Knowledge Entries'}
              </h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {showForm ? 'Cancel' : 'Add New'}
              </button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="px-6 py-4 border-b border-gray-200">
              {activeTab === 'events' && (
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Event Name</label>
                      <input
                        type="text"
                        value={eventForm.name}
                        onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                        className="mt-1 block w-full form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        value={eventForm.category}
                        onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                        className="mt-1 block w-full form-input"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      className="mt-1 block w-full form-textarea"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Properties (JSON)</label>
                      <textarea
                        value={eventForm.properties}
                        onChange={(e) => setEventForm({ ...eventForm, properties: e.target.value })}
                        className="mt-1 block w-full form-textarea"
                        rows={3}
                        placeholder='{"amount": "number", "currency": "string"}'
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Examples (JSON)</label>
                      <textarea
                        value={eventForm.examples}
                        onChange={(e) => setEventForm({ ...eventForm, examples: e.target.value })}
                        className="mt-1 block w-full form-textarea"
                        rows={3}
                        placeholder='{"amount": 99.99, "currency": "USD"}'
                      />
                    </div>
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Create Event Definition
                  </button>
                </form>
              )}

              {activeTab === 'metrics' && (
                <form onSubmit={handleMetricSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Metric Name</label>
                      <input
                        type="text"
                        value={metricForm.name}
                        onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        value={metricForm.category}
                        onChange={(e) => setMetricForm({ ...metricForm, category: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={metricForm.description}
                      onChange={(e) => setMetricForm({ ...metricForm, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SQL Formula</label>
                    <textarea
                      value={metricForm.formula}
                      onChange={(e) => setMetricForm({ ...metricForm, formula: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                      rows={3}
                      required
                                             placeholder='SELECT COUNT(*) FROM "Event" WHERE name = "purchase"'
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        value={metricForm.unit}
                        onChange={(e) => setMetricForm({ ...metricForm, unit: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="percentage, dollars, count"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Examples (JSON)</label>
                      <textarea
                        value={metricForm.examples}
                        onChange={(e) => setMetricForm({ ...metricForm, examples: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={3}
                        placeholder='{"result": 15.5, "period": "last_30_days"}'
                      />
                    </div>
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Create Business Metric
                  </button>
                </form>
              )}

              {activeTab === 'entries' && (
                <form onSubmit={handleEntrySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={entryForm.title}
                        onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        value={entryForm.category}
                        onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content (Markdown)</label>
                    <textarea
                      value={entryForm.content}
                      onChange={(e) => setEntryForm({ ...entryForm, content: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={entryForm.tags}
                      onChange={(e) => setEntryForm({ ...entryForm, tags: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="retention, revenue, user-segments"
                    />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Create Knowledge Entry
                  </button>
                </form>
              )}
            </div>
          )}

          {/* List */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTab === 'events' && eventDefinitions.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                          {event.category}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        event.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {event.properties && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700">Properties:</h4>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(event.properties, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}

                {activeTab === 'metrics' && businessMetrics.map((metric) => (
                  <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{metric.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{metric.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {metric.category}
                          </span>
                          {metric.unit && (
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              {metric.unit}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        metric.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {metric.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700">Formula:</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto font-mono">
                        {metric.formula}
                      </pre>
                    </div>
                  </div>
                ))}

                {activeTab === 'entries' && knowledgeEntries.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{entry.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{entry.content}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {entry.category}
                          </span>
                          {entry.tags.map((tag, index) => (
                            <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        entry.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}

                {activeTab === 'events' && eventDefinitions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No event definitions found. Create your first one!
                  </div>
                )}

                {activeTab === 'metrics' && businessMetrics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No business metrics found. Create your first one!
                  </div>
                )}

                {activeTab === 'entries' && knowledgeEntries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No knowledge entries found. Create your first one!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 