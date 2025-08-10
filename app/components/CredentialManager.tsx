'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Credential {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  config: any;
}

interface CredentialFormData {
  name: string;
  provider: string;
  config: any;
}

const PROVIDERS = [
  { id: 'slack', name: 'Slack', icon: '💬', description: 'Send messages to Slack channels' },
  { id: 'google_sheets', name: 'Google Sheets', icon: '📊', description: 'Read/write to Google Sheets' },
  { id: 'email', name: 'Email', icon: '📧', description: 'Send emails via SMTP or services' },
];

const CredentialManager: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [editingCredential, setEditingCredential] = useState<string | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>({
    name: '',
    provider: '',
    config: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock user ID - in real app, get from auth context
  const userId = 'user-123';

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch(`/api/credentials?userId=${userId}`);
      const data = await response.json();
      if (data.credentials) {
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      setError('Failed to fetch credentials');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editingCredential 
        ? `/api/credentials/${editingCredential}`
        : '/api/credentials';
      
      const method = editingCredential ? 'PUT' : 'POST';
      const body = editingCredential 
        ? { name: formData.name, config: formData.config }
        : { userId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save credential');
      }

      setSuccess(editingCredential ? 'Credential updated successfully!' : 'Credential created successfully!');
      setIsAddingCredential(false);
      setEditingCredential(null);
      setFormData({ name: '', provider: '', config: {} });
      fetchCredentials();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    try {
      const response = await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete credential');
      
      setSuccess('Credential deleted successfully!');
      fetchCredentials();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete credential');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const response = await fetch(`/api/credentials/${id}/test`, { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setSuccess('Credential test successful!');
      } else {
        setError(`Test failed: ${result.error}`);
      }
    } catch (error) {
      setError('Failed to test credential');
    }
  };

  const handleEdit = (credential: Credential) => {
    setEditingCredential(credential.id);
    setFormData({
      name: credential.name,
      provider: credential.provider,
      config: credential.config,
    });
    setIsAddingCredential(true);
  };

  const cancelEdit = () => {
    setIsAddingCredential(false);
    setEditingCredential(null);
    setFormData({ name: '', provider: '', config: {} });
    setError(null);
    setSuccess(null);
  };

  const updateConfig = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };

  const renderConfigFields = () => {
    switch (formData.provider) {
      case 'slack':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                type="password"
                value={formData.config.botToken || ''}
                onChange={(e) => updateConfig('botToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="xoxb-your-bot-token"
              />
              <p className="text-sm text-gray-500 mt-1">
                Get this from your Slack app settings
              </p>
            </div>
          </div>
        );
      
      case 'google_sheets':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email
              </label>
              <input
                type="email"
                value={formData.config.clientEmail || ''}
                onChange={(e) => updateConfig('clientEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-service@project.iam.gserviceaccount.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Private Key
              </label>
              <textarea
                value={formData.config.privateKey || ''}
                onChange={(e) => updateConfig('privateKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="-----BEGIN PRIVATE KEY-----..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project ID
              </label>
              <input
                type="text"
                value={formData.config.projectId || ''}
                onChange={(e) => updateConfig('projectId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-project-id"
              />
            </div>
          </div>
        );
      
      case 'email':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={formData.config.host || ''}
                  onChange={(e) => updateConfig('host', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.config.port || ''}
                  onChange={(e) => updateConfig('port', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="587"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="email"
                value={formData.config.username || ''}
                onChange={(e) => updateConfig('username', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-email@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.config.password || ''}
                onChange={(e) => updateConfig('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-app-password"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integration Credentials</h1>
        <button
          onClick={() => setIsAddingCredential(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Credential
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <XMarkIcon className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Credential Form */}
      {isAddingCredential && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCredential ? 'Edit Credential' : 'Add New Credential'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credential Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Slack Bot"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Integration Provider
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value, config: {} }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingCredential}
                >
                  <option value="">Select a provider</option>
                  {PROVIDERS.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.icon} {provider.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.provider && (
              <div className="border-t pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  {PROVIDERS.find(p => p.id === formData.provider)?.name} Configuration
                </h3>
                {renderConfigFields()}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (editingCredential ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Credentials List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Credentials</h3>
        </div>
        
        {credentials.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔐</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No credentials yet</h3>
            <p className="text-gray-500">Add your first integration credential to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {credentials.map((credential) => (
              <div key={credential.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {PROVIDERS.find(p => p.id === credential.provider)?.icon || '🔧'}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{credential.name}</h4>
                      <p className="text-sm text-gray-500">
                        {PROVIDERS.find(p => p.id === credential.provider)?.name} • 
                        Created {new Date(credential.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      credential.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {credential.isActive ? 'Active' : 'Inactive'}
                    </span>
                    
                    <button
                      onClick={() => handleTest(credential.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Test
                    </button>
                    
                    <button
                      onClick={() => handleEdit(credential)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(credential.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialManager;
