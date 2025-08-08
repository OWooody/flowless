'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

interface RequestDetails {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function DebugPage() {
  const { isSignedIn, userId: authUserId, isLoaded } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [requests, setRequests] = useState<RequestDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startListening = () => {
    if (!targetUserId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    setError(null);
    setIsListening(true);
    setRequests([]);

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new SSE connection
    const eventSource = new EventSource(`/api/debug/live?userId=${encodeURIComponent(targetUserId)}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const requestData: RequestDetails = JSON.parse(event.data);
        setRequests(prev => [requestData, ...prev.slice(0, 99)]); // Keep last 100 requests
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setError('Connection lost. Please try again.');
      setIsListening(false);
    };

    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };
  };

  const stopListening = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsListening(false);
  };

  const clearRequests = () => {
    setRequests([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access the debug page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Request Debugger</h1>
          <p className="text-gray-600">Monitor live requests for a specific user ID in real-time</p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                Target User ID
              </label>
              <input
                id="userId"
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter user ID to monitor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isListening}
              />
            </div>
            <div className="flex space-x-2">
              {!isListening ? (
                <button
                  onClick={startListening}
                  disabled={!targetUserId.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Listening
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Stop Listening
                </button>
              )}
              <button
                onClick={clearRequests}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isListening ? 'Listening for requests...' : 'Not listening'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {requests.length} request{requests.length !== 1 ? 's' : ''} captured
            </span>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Requests Display */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Live Requests</h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time requests for user ID: <code className="bg-gray-100 px-2 py-1 rounded">{targetUserId || 'Not set'}</code>
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {isListening ? 'Waiting for requests...' : 'No requests captured yet'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-800">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Enter the user ID you want to monitor</li>
            <li>Click "Start Listening" to begin capturing requests</li>
            <li>Make requests from the target user's session</li>
            <li>Watch requests appear in real-time below</li>
            <li>Click "Stop Listening" to stop capturing</li>
            <li>Use "Clear" to remove all captured requests</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: RequestDetails }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            request.method === 'GET' ? 'bg-green-100 text-green-800' :
            request.method === 'POST' ? 'bg-blue-100 text-blue-800' :
            request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
            request.method === 'DELETE' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {request.method}
          </span>
          <span className="text-sm font-mono text-gray-600 truncate max-w-md">
            {request.url}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {new Date(request.timestamp).toLocaleTimeString()}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {expanded ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 mt-4">
          {/* Headers */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Headers</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(request.headers, null, 2)}
            </pre>
          </div>

          {/* Query Parameters */}
          {request.queryParams && Object.keys(request.queryParams).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Query Parameters</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(request.queryParams, null, 2)}
              </pre>
            </div>
          )}

          {/* Body */}
          {request.body && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Request Body</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(request.body, null, 2)}
              </pre>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {request.userId && (
              <div>
                <span className="font-medium text-gray-700">User ID:</span>
                <span className="ml-2 text-gray-600">{request.userId}</span>
              </div>
            )}
            {request.ipAddress && (
              <div>
                <span className="font-medium text-gray-700">IP Address:</span>
                <span className="ml-2 text-gray-600">{request.ipAddress}</span>
              </div>
            )}
            {request.userAgent && (
              <div className="col-span-2">
                <span className="font-medium text-gray-700">User Agent:</span>
                <span className="ml-2 text-gray-600 text-xs">{request.userAgent}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 