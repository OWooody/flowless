'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function APIKeysPage() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const copyToClipboard = async () => {
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const truncateToken = (token: string) => {
    if (token.length <= 20) return token;
    return `${token.slice(0, 10)}***${token.slice(-10)}`;
  };

  useEffect(() => {
    const fetchToken = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setError('Please sign in to view your API key');
        setLoading(false);
        return;
      }

      try {
        const sessionToken = await getToken();
        if (!sessionToken) {
          setError('No session token available. Please sign in.');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/jwt', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setToken(data.token);
        }
      } catch (err) {
        setError('Failed to fetch API key');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [isLoaded, isSignedIn, getToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your API Key</h1>
        <div className="bg-gray-100 p-4 rounded-lg relative">
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono">{token ? truncateToken(token) : ''}</code>
            <button
              onClick={copyToClipboard}
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>To use this API key in your requests:</p>
          <ol className="list-decimal list-inside mt-2">
            <li>Copy the API key above</li>
            <li>Add a header with key <code className="bg-gray-200 px-1 rounded">Authorization</code></li>
            <li>Set the value to <code className="bg-gray-200 px-1 rounded">Bearer YOUR_API_KEY</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
} 