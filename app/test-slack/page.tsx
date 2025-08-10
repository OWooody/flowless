'use client';

import { useState } from 'react';

export default function TestSlackPage() {
  const [credentialId, setCredentialId] = useState('');
  const [channel, setChannel] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [isTestingAuth, setIsTestingAuth] = useState(false);

  const testSlackAuth = async () => {
    if (!credentialId) {
      alert('Please enter a credential ID');
      return;
    }

    setIsTestingAuth(true);
    setAuthResult(null);

    try {
      const response = await fetch(`/api/test-slack?credentialId=${encodeURIComponent(credentialId)}`);
      const data = await response.json();
      setAuthResult(data);
    } catch (error) {
      setAuthResult({ error: 'Failed to test auth' });
    } finally {
      setIsTestingAuth(false);
    }
  };

  const testSlackMessage = async () => {
    if (!credentialId || !channel || !message) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId,
          channel,
          message,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to send message' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Slack Integration</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Auth Test Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔐 Test Authentication</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credential ID
                </label>
                <input
                  type="text"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Slack credential ID"
                />
              </div>

              <button
                onClick={testSlackAuth}
                disabled={isTestingAuth || !credentialId}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isTestingAuth ? 'Testing...' : 'Test Authentication'}
              </button>
            </div>

            {authResult && (
              <div className="mt-4 p-4 rounded-lg border">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Auth Test Result</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
                  {JSON.stringify(authResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Message Test Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💬 Test Message Sending</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel
                </label>
                <input
                  type="text"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="general (without #) or @username"
                />
                <p className="text-xs text-gray-500 mt-1">Enter channel name without # symbol</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Enter your message..."
                />
              </div>

              <button
                onClick={testSlackMessage}
                disabled={isLoading || !credentialId || !channel || !message}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Test Message'}
              </button>
            </div>

            {result && (
              <div className="mt-4 p-4 rounded-lg border">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Message Result</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔧 Troubleshooting Tips</h3>
          <ul className="text-sm text-yellow-700 space-y-2 list-disc list-inside">
            <li><strong>Channel Format:</strong> Use "general" instead of "#general"</li>
            <li><strong>Bot Invitation:</strong> Make sure the bot is invited to the channel</li>
            <li><strong>Permissions:</strong> Check that your bot has "chat:write" and "chat:write.public" scopes</li>
            <li><strong>Token:</strong> Verify your bot token starts with "xoxb-"</li>
            <li><strong>Workspace:</strong> Ensure the bot is installed in the correct workspace</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
