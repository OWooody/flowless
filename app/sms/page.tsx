'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface SMSProvider {
  id: string;
  organizationId: string;
  providerName: string;
  displayName: string;
  isActive: boolean;
  credentials: any;
  config?: any;
  webhookUrl?: string;
  webhookSecret?: string;
  createdAt: string;
  updatedAt: string;
}

interface SMSTemplate {
  id: string;
  providerId: string;
  organizationId: string;
  templateName: string;
  displayName: string;
  category: string;
  language: string;
  variables?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SMSPage() {
  const { userId } = useAuth();
  const [providers, setProviders] = useState<SMSProvider[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'providers' | 'templates' | 'test'>('providers');
  const [showCreateProvider, setShowCreateProvider] = useState(false);
  const [showTestConnection, setShowTestConnection] = useState<string | null>(null);
  
  // Test section state
  const [testData, setTestData] = useState({
    fromPhone: '',
    toPhone: '',
    message: '',
    templateName: '',
    variables: {},
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    requestDetails?: any;
  } | null>(null);

  useEffect(() => {
    if (userId) {
      fetchProviders();
      fetchTemplates();
    }
  }, [userId]);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/sms/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching SMS providers:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/sms/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async (providerData: any) => {
    try {
      const response = await fetch('/api/sms/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerData),
      });

      if (response.ok) {
        await fetchProviders();
        setShowCreateProvider(false);
      } else {
        const error = await response.json();
        alert(`Error creating provider: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating SMS provider:', error);
      alert('Error creating SMS provider');
    }
  };

  const handleTestConnection = async (providerId: string) => {
    try {
      const response = await fetch(`/api/sms/providers/${providerId}/test-connection`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.success ? 'Connection successful!' : 'Connection failed');
      } else {
        alert('Error testing connection');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Error testing connection');
    } finally {
      setShowTestConnection(null);
    }
  };

  const handleSyncTemplates = async (providerId: string) => {
    try {
      const response = await fetch(`/api/sms/providers/${providerId}/sync-templates`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchTemplates();
        alert('Templates synced successfully!');
      } else {
        alert('Error syncing templates');
      }
    } catch (error) {
      console.error('Error syncing templates:', error);
      alert('Error syncing templates');
    }
  };

  const handleTestMessage = async () => {
    if (!testData.toPhone || (!testData.message && !testData.templateName)) {
      alert('Please fill in to phone and either message or template name');
      return;
    }

    if (!testData.toPhone.startsWith('+')) {
      alert('To phone number must be in international format (e.g., +1234567890)');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const requestBody = {
        fromPhone: testData.fromPhone,
        toPhone: testData.toPhone,
        message: testData.message,
        templateName: testData.templateName,
        variables: testData.variables,
      };

      console.log('🔍 Sending SMS test request:', requestBody);

      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📄 Response data:', data);

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Test message sent successfully!',
          details: data,
          requestDetails: data.requestDetails || requestBody
        });
      } else {
        // Handle both API errors and SMS service errors
        const errorMessage = data.message || data.error || 'Failed to send test message';
        setTestResult({
          success: false,
          message: errorMessage,
          details: data,
          requestDetails: data.requestDetails || requestBody
        });
      }
    } catch (err) {
      console.error('Error sending test message:', err);
      setTestResult({
        success: false,
        message: `Failed to send test message: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: err
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SMS Management</h1>
          <p className="mt-2 text-gray-600">
            Configure SMS providers and manage message templates
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'providers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Providers
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test Messages
            </button>
          </nav>
        </div>

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">SMS Providers</h2>
              <button
                onClick={() => setShowCreateProvider(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Provider
              </button>
            </div>

            {providers.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No SMS providers</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first SMS provider.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateProvider(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Provider
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <li key={provider.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900">{provider.displayName}</p>
                                {provider.isActive && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{provider.providerName}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setShowTestConnection(provider.id)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Test Connection
                            </button>
                            <button
                              onClick={() => handleSyncTemplates(provider.id)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Sync Templates
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">SMS Templates</h2>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No SMS templates</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Templates will appear here after syncing with your SMS provider.
                </p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <li key={template.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{template.displayName}</p>
                            <p className="text-sm text-gray-500">{template.templateName}</p>
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {template.category}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {template.language}
                              </span>
                              {template.isActive && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Test Messages Tab */}
        {activeTab === 'test' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Test SMS Messages</h2>
              <p className="mt-1 text-sm text-gray-600">
                Send test SMS messages to verify your provider configuration.
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sender ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={testData.fromPhone}
                      onChange={(e) => setTestData({ ...testData, fromPhone: e.target.value })}
                      placeholder="YourSenderName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to use default sender ID from provider
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Phone Number
                    </label>
                    <input
                      type="text"
                      value={testData.toPhone}
                      onChange={(e) => setTestData({ ...testData, toPhone: e.target.value })}
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must be in international format
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (or leave empty to use template)
                  </label>
                  <textarea
                    value={testData.message}
                    onChange={(e) => setTestData({ ...testData, message: e.target.value })}
                    placeholder="Enter your message here..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name (optional)
                  </label>
                  <input
                    type="text"
                    value={testData.templateName}
                    onChange={(e) => setTestData({ ...testData, templateName: e.target.value })}
                    placeholder="template_name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    If using a template, leave message empty
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleTestMessage}
                    disabled={testing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {testing ? 'Sending...' : 'Send Test Message'}
                  </button>
                </div>

                {/* Test Results */}
                {testResult && (
                  <div className={`border rounded-lg p-4 ${
                    testResult.success 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {testResult.success ? (
                          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className={`text-sm font-medium ${
                          testResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {testResult.success ? 'Test Successful' : 'Test Failed'}
                        </h3>
                        <p className={`mt-1 text-sm ${
                          testResult.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {testResult.message}
                        </p>
                        
                        {/* Request Details */}
                        {testResult.requestDetails && (
                          <details className="mt-3">
                            <summary className="text-sm font-medium cursor-pointer text-blue-600 hover:text-blue-800">
                              📡 Request Details
                            </summary>
                            <div className="mt-2 space-y-2">
                              <div className="bg-white p-3 rounded border text-xs">
                                <div className="font-medium mb-1">API Endpoint:</div>
                                <code className="text-blue-600">{testResult.requestDetails.apiEndpoint}</code>
                              </div>
                              <div className="bg-white p-3 rounded border text-xs">
                                <div className="font-medium mb-1">Request Body:</div>
                                <pre className="text-green-600 overflow-auto">
                                  {JSON.stringify(testResult.requestDetails.requestBody, null, 2)}
                                </pre>
                              </div>
                              <div className="bg-white p-3 rounded border text-xs">
                                <div className="font-medium mb-1">Provider:</div>
                                <code className="text-purple-600">{testResult.requestDetails.provider}</code>
                              </div>
                            </div>
                          </details>
                        )}
                        
                        {/* Response Details */}
                        {testResult.details && (
                          <details className="mt-2">
                            <summary className="text-sm font-medium cursor-pointer">
                              📄 Response Details
                            </summary>
                            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                              {JSON.stringify(testResult.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Provider Modal */}
        {showCreateProvider && (
          <CreateProviderModal
            onClose={() => setShowCreateProvider(false)}
            onSubmit={handleCreateProvider}
          />
        )}

        {/* Test Connection Modal */}
        {showTestConnection && (
          <TestConnectionModal
            providerId={showTestConnection}
            onClose={() => setShowTestConnection(null)}
            onTest={handleTestConnection}
          />
        )}
      </div>
    </div>
  );
}

// Create Provider Modal Component
function CreateProviderModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    providerName: 'twilio',
    displayName: '',
    accountSid: '',
    authToken: '',
    fromNumber: '',
    apiKey: '',
    senderId: '',
    skipConnectionTest: true, // Default to true for development
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let credentials = {};
    
    if (formData.providerName === 'twilio') {
      credentials = {
        accountSid: formData.accountSid,
        authToken: formData.authToken,
        fromNumber: formData.fromNumber,
        skipConnectionTest: formData.skipConnectionTest,
      };
    } else if (formData.providerName === 'unifonic') {
      credentials = {
        apiKey: formData.apiKey,
        senderId: formData.senderId,
        skipConnectionTest: formData.skipConnectionTest,
      };
    }
    
    onSubmit({
      providerName: formData.providerName,
      displayName: formData.displayName,
      credentials,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add SMS Provider</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select
                value={formData.providerName}
                onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="twilio">Twilio SMS</option>
                <option value="unifonic">Unifonic SMS</option>
                <option value="nexmo">Vonage (Nexmo)</option>
                <option value="aws_sns">AWS SNS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="My Twilio SMS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account SID</label>
              <input
                type="text"
                value={formData.accountSid}
                onChange={(e) => setFormData({ ...formData, accountSid: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="AC1234567890abcdef"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Auth Token</label>
              <input
                type="password"
                value={formData.authToken}
                onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="auth_token_here"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">From Number</label>
              <input
                type="text"
                value={formData.fromNumber}
                onChange={(e) => setFormData({ ...formData, fromNumber: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890"
              />
            </div>
            
            {/* Unifonic-specific fields */}
            {formData.providerName === 'unifonic' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">API Key (AppSid)</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your_app_sid_here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sender ID</label>
                  <input
                    type="text"
                    value={formData.senderId}
                    onChange={(e) => setFormData({ ...formData, senderId: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="YourSenderName"
                  />
                </div>
              </>
            )}
            
            {/* Development mode checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="skipConnectionTest"
                checked={formData.skipConnectionTest}
                onChange={(e) => setFormData({ ...formData, skipConnectionTest: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="skipConnectionTest" className="ml-2 block text-sm text-gray-700">
                Skip connection test (development mode)
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create Provider
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Test Connection Modal Component
function TestConnectionModal({ providerId, onClose, onTest }: { providerId: string; onClose: () => void; onTest: (id: string) => void }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Connection</h3>
          <p className="text-sm text-gray-600 mb-4">
            This will test the connection to your SMS provider to verify your credentials are working correctly.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onTest(providerId)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 