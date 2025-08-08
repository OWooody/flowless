'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface DebugInfo {
  isSignedIn?: boolean;
  userId?: string | null;
  isLoaded?: boolean;
  timestamp?: string;
  apiTest?: {
    status: number;
    statusText: string;
    data: any;
  };
  createTest?: {
    status: number;
    statusText: string;
    data: any;
  };
}

export default function KnowledgeDebugPage() {
  const { isSignedIn, userId, isLoaded } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setDebugInfo({
        isSignedIn,
        userId,
        isLoaded,
        timestamp: new Date().toISOString()
      });
    }
  }, [isSignedIn, userId, isLoaded]);

  const testKnowledgeBaseAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/knowledge/query');
      const data = await response.json();
      
      setDebugInfo(prev => ({
        ...prev,
        apiTest: {
          status: response.status,
          statusText: response.statusText,
          data: data
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testEventDefinitionCreation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const testEvent = {
        name: 'test_event',
        description: 'Test event for debugging',
        category: 'test',
        properties: { test: 'string' },
        examples: { test: 'value' }
      };

      const response = await fetch('/api/knowledge/event-definitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEvent)
      });

      const data = await response.json();
      
      setDebugInfo(prev => ({
        ...prev,
        createTest: {
          status: response.status,
          statusText: response.statusText,
          data: data
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Knowledge Base Debug</h1>
        
        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Is Loaded:</strong> {isLoaded ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Signed In:</strong> {isSignedIn ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User ID:</strong> {userId || 'Not available'}</p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <div className="space-y-4">
            <button
              onClick={testKnowledgeBaseAPI}
              disabled={loading || !isSignedIn}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Knowledge Base Query
            </button>
            
            <button
              onClick={testEventDefinitionCreation}
              disabled={loading || !isSignedIn}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 ml-4"
            >
              Test Event Definition Creation
            </button>
          </div>
          
          {loading && (
            <p className="mt-4 text-blue-600">Testing...</p>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Make sure you're signed in to Clerk</li>
            <li>Check if the database migration was applied: <code>npx prisma migrate status</code></li>
            <li>Verify Prisma Client is generated: <code>npx prisma generate</code></li>
            <li>Check browser console for JavaScript errors</li>
            <li>Check network tab for failed API requests</li>
            <li>Verify environment variables are set correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 