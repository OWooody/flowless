'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WhatsAppProvider {
  id: string;
  providerName: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AvailableProvider {
  name: string;
  displayName: string;
  configFields: Record<string, any>;
}

export default function WhatsAppPage() {
  const [providers, setProviders] = useState<AvailableProvider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<WhatsAppProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showTestSection, setShowTestSection] = useState(false);
  const [testData, setTestData] = useState({
    fromPhone: '',
    toPhone: '',
    templateName: '',
    namespace: '',
    bodyVariable1: '',
    bodyVariable2: '',
    bodyVariable3: '',
    buttonVariable: '',
    language: 'ar', // default to Arabic
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/providers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }

      const data = await response.json();
      setProviders(data.availableProviders || []);
      setCurrentProvider(data.currentProvider);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError('Failed to load WhatsApp providers');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (providerName: string) => {
    setSelectedProvider(providerName);
    setFormData({});
    setShowSetupForm(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider) return;

    try {
      setSubmitting(true);
      
      const provider = providers.find(p => p.name === selectedProvider);
      if (!provider) return;

      // Validate required fields
      const requiredFields = Object.entries(provider.configFields)
        .filter(([_, config]) => config.required)
        .map(([field]) => field);

      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const response = await fetch('/api/whatsapp/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerName: selectedProvider,
          displayName: provider.displayName,
          credentials: formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create provider');
      }

      // Refresh providers and close form
      await fetchProviders();
      setShowSetupForm(false);
      setSelectedProvider('');
      setFormData({});
      setError(null);
    } catch (err) {
      console.error('Error creating provider:', err);
      setError(err instanceof Error ? err.message : 'Failed to create provider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProvider = async () => {
    if (!currentProvider || !confirm('Are you sure you want to delete this WhatsApp provider? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/providers/${currentProvider.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete provider');
      }

      await fetchProviders();
    } catch (err) {
      console.error('Error deleting provider:', err);
      setError('Failed to delete provider');
    }
  };

  const handleSyncTemplates = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync templates');
      }

      const data = await response.json();
      alert(data.message);
    } catch (err) {
      console.error('Error syncing templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync templates');
    }
  };

  const handleTestMessage = async () => {
    if (!testData.fromPhone || !testData.toPhone || !testData.templateName) {
      setError('Please fill in from phone, to phone, and template name');
      return;
    }

    if (!testData.fromPhone.startsWith('+') || !testData.toPhone.startsWith('+')) {
      setError('Phone numbers must be in international format (e.g., +1234567890)');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      setError(null);

      // Prepare variables object - only include non-empty values
      const variables: Record<string, string> = {};
      
      if (testData.bodyVariable1.trim()) {
        variables['1'] = testData.bodyVariable1;
      }
      if (testData.bodyVariable2.trim()) {
        variables['2'] = testData.bodyVariable2;
      }
      if (testData.bodyVariable3.trim()) {
        variables['3'] = testData.bodyVariable3;
      }
      if (testData.buttonVariable.trim()) {
        variables['button'] = testData.buttonVariable;
      }

      const requestBody = {
        fromPhone: testData.fromPhone,
        toPhone: testData.toPhone,
        templateName: testData.templateName,
        namespace: testData.namespace,
        variables: variables,
        language: testData.language,
      };

      console.log('🔍 Sending WhatsApp test request:', requestBody);

      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📄 Response data:', data);

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Test message sent successfully!',
          details: data
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to send test message',
          details: data
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

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);

      const response = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed');
      }

      setTestResult({
        success: true,
        message: 'Connection test successful!',
        details: data
      });
    } catch (err) {
      console.error('Error testing connection:', err);
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
        details: null
      });
    } finally {
      setTesting(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration</h1>
                <p className="text-gray-600 mt-1">Configure your WhatsApp provider and manage templates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Provider Status */}
        {currentProvider ? (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Current Provider</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSyncTemplates}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Templates
                </button>
                <button
                  onClick={handleDeleteProvider}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Provider
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Provider:</span>
                <span className="ml-2 text-sm text-gray-900">{currentProvider.displayName}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentProvider.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentProvider.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(currentProvider.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(currentProvider.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No WhatsApp provider configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by setting up a WhatsApp provider to send messages.
              </p>
            </div>
          </div>
        )}

        {/* Test Section */}
        {currentProvider && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Test Your Provider</h2>
              <button
                onClick={() => setShowTestSection(!showTestSection)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className={`w-4 h-4 mr-2 transition-transform ${showTestSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {showTestSection ? 'Hide Tests' : 'Show Tests'}
              </button>
            </div>

            {showTestSection && (
              <div className="space-y-6">
                {/* Connection Test */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Connection Test</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Test if your provider credentials are working correctly.
                  </p>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {/* Message Test */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Send Test Message</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Send a test WhatsApp message using your configured provider.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Phone (Business) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={testData.fromPhone}
                        onChange={(e) => setTestData(prev => ({ ...prev, fromPhone: e.target.value }))}
                        placeholder="+1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Your business WhatsApp number</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To Phone (Recipient) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={testData.toPhone}
                        onChange={(e) => setTestData(prev => ({ ...prev, toPhone: e.target.value }))}
                        placeholder="+1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Recipient's phone number</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={testData.templateName}
                          onChange={(e) => setTestData(prev => ({ ...prev, templateName: e.target.value }))}
                          placeholder="welcome_message"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Template name from your provider</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Namespace
                    </label>
                    <input
                      type="text"
                      value={testData.namespace}
                      onChange={(e) => setTestData(prev => ({ ...prev, namespace: e.target.value }))}
                      placeholder="fc3df069_22dc_4a5f_a669_2f7329af60d1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Template namespace (required for Freshchat)</p>
                  </div>

                  {/* Template Variables */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Template Variables</h3>
                    <div className="space-y-3">
                      {/* Body Variables */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Body Variable 1
                          </label>
                          <input
                            type="text"
                            value={testData.bodyVariable1}
                            onChange={(e) => setTestData(prev => ({ ...prev, bodyVariable1: e.target.value }))}
                            placeholder="Customer name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">Variable {'{1}'} in template</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Body Variable 2
                          </label>
                          <input
                            type="text"
                            value={testData.bodyVariable2}
                            onChange={(e) => setTestData(prev => ({ ...prev, bodyVariable2: e.target.value }))}
                            placeholder="Order number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">Variable {'{2}'} in template</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Body Variable 3
                          </label>
                          <input
                            type="text"
                            value={testData.bodyVariable3}
                            onChange={(e) => setTestData(prev => ({ ...prev, bodyVariable3: e.target.value }))}
                            placeholder="Company name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">Variable {'{3}'} in template</p>
                        </div>
                      </div>
                      
                      {/* Button Variable */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Button Variable
                        </label>
                        <input
                          type="text"
                          value={testData.buttonVariable}
                          onChange={(e) => setTestData(prev => ({ ...prev, buttonVariable: e.target.value }))}
                          placeholder="Button text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Button text variable (optional)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={testData.language}
                      onChange={e => setTestData(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ar">Arabic (ar)</option>
                      <option value="en">English (en)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Select the template language</p>
                  </div>

                  <button
                    onClick={handleTestMessage}
                    disabled={testing || !testData.fromPhone || !testData.toPhone || !testData.templateName}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
                      <div className="ml-3">
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
                        {testResult.details && (
                          <details className="mt-2">
                            <summary className="text-sm font-medium cursor-pointer">
                              View Details
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
            )}
          </div>
        )}

        {/* Available Providers */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Available Providers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.name}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">{provider.displayName}</h3>
                  {currentProvider?.providerName === provider.name && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Configure {provider.displayName} to send WhatsApp messages through your workflows.
                </p>
                
                <button
                  onClick={() => handleProviderSelect(provider.name)}
                  disabled={currentProvider?.providerName === provider.name}
                  className={`w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${
                    currentProvider?.providerName === provider.name
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'text-white bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {currentProvider?.providerName === provider.name ? 'Already Active' : 'Configure'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Form Modal */}
        {showSetupForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configure {providers.find(p => p.name === selectedProvider)?.displayName}
                </h3>
                
                <form onSubmit={handleSubmit}>
                  {selectedProvider && providers.find(p => p.name === selectedProvider)?.configFields && 
                    Object.entries(providers.find(p => p.name === selectedProvider)!.configFields).map(([field, config]) => (
                      <div key={field} className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {config.label}
                          {config.required && <span className="text-red-500">*</span>}
                        </label>
                        {config.type === 'select' ? (
                          <select
                            value={formData[field] || config.defaultValue || ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            required={config.required}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select {config.label}</option>
                            {config.options?.map((option: any) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={config.type === 'password' ? 'password' : config.type === 'url' ? 'url' : 'text'}
                            value={formData[field] || ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={config.placeholder}
                            required={config.required}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                        {config.help && (
                          <p className="mt-1 text-xs text-gray-500">{config.help}</p>
                        )}
                      </div>
                    ))
                  }
                  
                  <div className="flex items-center justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSetupForm(false);
                        setSelectedProvider('');
                        setFormData({});
                        setError(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Configuring...' : 'Configure Provider'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 