'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Segment {
  id: string;
  name: string;
  description: string | null;
  query: string;
  userCount: number | null;
  criteria: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  sentCount: number;
  createdAt: string;
}

export default function SegmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [segment, setSegment] = useState<Segment | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingQuery, setEditingQuery] = useState(false);
  const [queryEditValue, setQueryEditValue] = useState('');
  const [savingQuery, setSavingQuery] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSegment();
      fetchSegmentCampaigns();
    }
  }, [params.id]);

  const fetchSegment = async () => {
    try {
      const response = await fetch(`/api/segments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSegment(data.segment);
      } else {
        setError('Segment not found');
      }
    } catch (error) {
      console.error('Error fetching segment:', error);
      setError('Failed to load segment');
    } finally {
      setLoading(false);
    }
  };

  const fetchSegmentCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaigns?segmentId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefreshUserCount = async () => {
    if (!segment) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/segments/${segment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh_user_count' }),
      });

      if (response.ok) {
        const data = await response.json();
        setSegment(prev => prev ? { ...prev, userCount: data.segment.userCount } : null);
      } else {
        alert('Failed to refresh user count');
      }
    } catch (error) {
      console.error('Error refreshing user count:', error);
      alert('Failed to refresh user count');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartEditQuery = () => {
    if (!segment) return;
    setQueryEditValue(segment.query);
    setEditingQuery(true);
  };

  const handleCancelEditQuery = () => {
    setEditingQuery(false);
    setQueryEditValue('');
  };

  const handleSaveQuery = async () => {
    if (!segment) return;
    
    setSavingQuery(true);
    try {
      const response = await fetch(`/api/segments/${segment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'update_query',
          query: queryEditValue 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSegment(prev => prev ? { 
          ...prev, 
          query: data.segment.query,
          userCount: data.segment.userCount 
        } : null);
        setEditingQuery(false);
        setQueryEditValue('');
      } else {
        const errorData = await response.json();
        alert(`Failed to update query: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating query:', error);
      alert('Failed to update query');
    } finally {
      setSavingQuery(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading segment...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !segment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Segment Not Found</h3>
            <p className="text-gray-500 mb-6">{error || 'The segment you are looking for does not exist.'}</p>
            <Link
              href="/segments"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Segments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/segments"
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  ← Back to Segments
                </Link>
              </div>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{segment.name}</h1>
              {segment.description && (
                <p className="mt-2 text-gray-600">{segment.description}</p>
              )}
            </div>
            <div className="flex space-x-3">
              <Link
                href="/campaigns/create"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Campaign
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Segment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Segment Information</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">User Count</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center space-x-2">
                    <span>{segment.userCount?.toLocaleString() || 'N/A'} users</span>
                    <button
                      onClick={handleRefreshUserCount}
                      disabled={refreshing}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      title="Refresh user count"
                    >
                      {refreshing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        '↻'
                      )}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      segment.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {segment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(segment.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(segment.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Query Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Segment Query</h2>
                {!editingQuery && (
                  <button
                    onClick={handleStartEditQuery}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Edit Query
                  </button>
                )}
              </div>
              
              {editingQuery ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-md p-4">
                    <textarea
                      value={queryEditValue}
                      onChange={(e) => setQueryEditValue(e.target.value)}
                      rows={8}
                      className="w-full bg-transparent text-sm text-gray-800 font-mono border-none outline-none resize-none"
                      placeholder="Enter SQL query..."
                    />
                  </div>
                  
                  {/* Query Guidelines */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Query Guidelines:</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Must start with SELECT</li>
                      <li>• Must select userId from the Event table</li>
                      <li>• Use quoted table names: "Event" not Event</li>
                      <li>• Use proper column names: userId (CamelCase)</li>
                      <li>• Example: SELECT DISTINCT userId FROM "Event" WHERE name = 'purchase'</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancelEditQuery}
                      disabled={savingQuery}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveQuery}
                      disabled={savingQuery || !queryEditValue.trim()}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {savingQuery ? 'Saving...' : 'Save Query'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-md p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                    {segment.query}
                  </pre>
                </div>
              )}
            </div>

            {/* Campaigns Using This Segment */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Campaigns Using This Segment</h2>
              {campaigns.length === 0 ? (
                <p className="text-gray-500">No campaigns are using this segment yet.</p>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-500">
                          Created {formatDate(campaign.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/campaigns/create"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Campaign
                </Link>
                <Link
                  href="/analytics/chat"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Analyze Segment
                </Link>
              </div>
            </div>

            {/* Segment Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Segment Statistics</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {segment.userCount?.toLocaleString() || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Active Campaigns</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {campaigns.filter(c => c.status === 'scheduled' || c.status === 'sent').length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Sent</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {campaigns.reduce((total, c) => total + c.sentCount, 0).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 