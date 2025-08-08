'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered: string | null;
  failureCount: number;
  eventName?: string;
  filterItemName?: string;
  filterItemCategory?: string;
  filterItemId?: string;
  filterValue?: number;
}

export default function WebhooksPage() {
  const { userId, orgId } = useAuth();
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    eventName: '',
    filterItemName: '',
    filterItemCategory: '',
    filterItemId: '',
    filterValue: '',
  });


  const availableEvents = ['event.created'];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks');
      if (!response.ok) throw new Error('Failed to fetch webhooks');
      const data = await response.json();
      setWebhooks(data.webhooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newWebhook,
          events: ['event.created'],
          eventName: newWebhook.eventName.trim(),
          filterItemName: newWebhook.filterItemName.trim() || undefined,
          filterItemCategory: newWebhook.filterItemCategory.trim() || undefined,
          filterItemId: newWebhook.filterItemId.trim() || undefined,
          filterValue: newWebhook.filterValue ? parseFloat(newWebhook.filterValue) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create webhook');
      
      await fetchWebhooks();
      setShowAddForm(false);
      setNewWebhook({ url: '', events: [], eventName: '', filterItemName: '', filterItemCategory: '', filterItemId: '', filterValue: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    }
  };

  const toggleWebhook = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update webhook');
      await fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook');
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete webhook');
      await fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showAddForm ? 'Cancel' : 'Add Webhook'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Webhook URL</label>
            <input
              type="url"
              value={newWebhook.url}
              onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Event Name</label>
            <input
              type="text"
              value={newWebhook.eventName}
              onChange={(e) => setNewWebhook({ ...newWebhook, eventName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Enter event name (e.g., user_signup, purchase_completed)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter an event name to track specific events, or leave empty to track all events
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Item Name Filter (Optional)</label>
            <input
              type="text"
              value={newWebhook.filterItemName}
              onChange={(e) => setNewWebhook({ ...newWebhook, filterItemName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Only trigger for events with this item name"
            />
            <p className="mt-1 text-sm text-gray-500">
              Only trigger this webhook for events with a specific item name
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Item Category Filter (Optional)</label>
            <input
              type="text"
              value={newWebhook.filterItemCategory}
              onChange={(e) => setNewWebhook({ ...newWebhook, filterItemCategory: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Only trigger for events with this item category"
            />
            <p className="mt-1 text-sm text-gray-500">
              Only trigger this webhook for events with a specific item category
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Item ID Filter (Optional)</label>
            <input
              type="text"
              value={newWebhook.filterItemId}
              onChange={(e) => setNewWebhook({ ...newWebhook, filterItemId: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Only trigger for events with this item ID"
            />
            <p className="mt-1 text-sm text-gray-500">
              Only trigger this webhook for events with a specific item ID
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Value Filter (Optional)</label>
            <input
              type="number"
              step="0.01"
              value={newWebhook.filterValue}
              onChange={(e) => setNewWebhook({ ...newWebhook, filterValue: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Only trigger for events with this exact value"
            />
            <p className="mt-1 text-sm text-gray-500">
              Only trigger this webhook for events with a specific value
            </p>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Webhook
          </button>
        </form>
      )}

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first webhook to receive real-time event notifications.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Webhook
            </button>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="p-6 bg-white rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{webhook.url}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      Event Name: {webhook.eventName || 'All events'}
                    </p>
                    {webhook.filterItemName && (
                      <p className="text-sm text-gray-600">
                        Item Name Filter: {webhook.filterItemName}
                      </p>
                    )}
                    {webhook.filterItemCategory && (
                      <p className="text-sm text-gray-600">
                        Item Category Filter: {webhook.filterItemCategory}
                      </p>
                    )}
                    {webhook.filterItemId && (
                      <p className="text-sm text-gray-600">
                        Item ID Filter: {webhook.filterItemId}
                      </p>
                    )}
                    {webhook.filterValue !== undefined && webhook.filterValue !== null && (
                      <p className="text-sm text-gray-600">
                        Value Filter: {webhook.filterValue}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Status: {webhook.isActive ? 'Active' : 'Inactive'}
                    </p>
                    {webhook.lastTriggered && (
                      <p className="text-sm text-gray-600">
                        Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                      </p>
                    )}
                    {webhook.failureCount > 0 && (
                      <p className="text-sm text-red-600">
                        Failed deliveries: {webhook.failureCount}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleWebhook(webhook.id, webhook.isActive)}
                    className={`px-3 py-1 rounded ${
                      webhook.isActive
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {webhook.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteWebhook(webhook.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 