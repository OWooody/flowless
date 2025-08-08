'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function TestDebugPage() {
  const { userId } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRequest = async () => {
    if (!userId) {
      alert('Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test_event',
          properties: { test: true, source: 'debug_test_page' },
          timestamp: new Date().toISOString(),
          category: 'test',
          userId: userId // This will be captured by the debug system
        })
      });

      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Request</h2>
          
          <div className="mb-4">
            <p><strong>Your User ID:</strong> {userId || 'Not signed in'}</p>
          </div>

          <button
            onClick={testRequest}
            disabled={loading || !userId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Making Request...' : 'Make Test Request'}
          </button>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-800">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Make sure you're signed in (you should see your user ID above)</li>
            <li>Open the debug page: <a href="/debug" className="underline">/debug</a></li>
            <li>Enter your user ID: <code className="bg-blue-100 px-2 py-1 rounded">{userId}</code></li>
            <li>Click "Start Listening"</li>
            <li>Come back to this page and click "Make Test Request"</li>
            <li>Go back to the debug page to see the captured request</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 