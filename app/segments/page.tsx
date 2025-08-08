'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreateSegmentDialog } from '../components/segments/CreateSegmentDialog';

interface Segment {
  id: string;
  name: string;
  description: string | null;
  userCount: number | null;
  createdAt: string;
  isActive: boolean;
  createdFromAiChat: boolean;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingSegment, setDeletingSegment] = useState<string | null>(null);
  const [refreshingSegment, setRefreshingSegment] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ai-created' | 'manual'>('all');

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments');
      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || []);
      } else {
        console.error('Failed to fetch segments');
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!confirm('Are you sure you want to delete this segment? This action cannot be undone.')) {
      return;
    }

    setDeletingSegment(segmentId);
    try {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSegments(prev => prev.filter(segment => segment.id !== segmentId));
      } else {
        alert('Failed to delete segment');
      }
    } catch (error) {
      console.error('Error deleting segment:', error);
      alert('Failed to delete segment');
    } finally {
      setDeletingSegment(null);
    }
  };

  const handleSegmentCreated = (newSegment: Segment) => {
    setSegments(prev => [newSegment, ...prev]);
    setIsCreateDialogOpen(false);
  };

  const handleRefreshUserCount = async (segmentId: string) => {
    setRefreshingSegment(segmentId);
    try {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh_user_count' }),
      });

      if (response.ok) {
        const data = await response.json();
        setSegments(prev => prev.map(segment => 
          segment.id === segmentId 
            ? { ...segment, userCount: data.segment.userCount }
            : segment
        ));
      } else {
        alert('Failed to refresh user count');
      }
    } catch (error) {
      console.error('Error refreshing user count:', error);
      alert('Failed to refresh user count');
    } finally {
      setRefreshingSegment(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredSegments = segments.filter(segment => {
    if (filter === 'all') return true;
    if (filter === 'ai-created') return segment.createdFromAiChat;
    if (filter === 'manual') return !segment.createdFromAiChat;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">User Segments</h1>
              <p className="mt-2 text-gray-600">
                Manage your user segments for targeted campaigns and analytics
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/analytics/chat"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Analytics Chat
              </Link>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Segment
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {segments.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{segments.length}</div>
              <div className="text-sm text-gray-600">Total Segments</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">
                {segments.filter(s => s.createdFromAiChat).length}
              </div>
              <div className="text-sm text-gray-600">AI Created</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">
                {segments.filter(s => !s.createdFromAiChat).length}
              </div>
              <div className="text-sm text-gray-600">Manually Created</div>
            </div>
          </div>
        )}

        {/* Filter */}
        {segments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({segments.length})
                </button>
                <button
                  onClick={() => setFilter('ai-created')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'ai-created'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  AI Created ({segments.filter(s => s.createdFromAiChat).length})
                </button>
                <button
                  onClick={() => setFilter('manual')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'manual'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Manual ({segments.filter(s => !s.createdFromAiChat).length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Segments List */}
        {filteredSegments.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No segments yet</h3>
            <p className="mt-2 text-gray-500">
              Create your first user segment to start targeting specific groups of users.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Your First Segment
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredSegments.map((segment) => (
                <li key={segment.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {segment.name}
                            </h3>
                            {segment.createdFromAiChat && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                AI Created
                              </span>
                            )}
                          </div>
                          {segment.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {segment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {segment.userCount?.toLocaleString() || 'N/A'} users
                            </div>
                            <div className="text-xs text-gray-500">
                              Created {formatDate(segment.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => handleRefreshUserCount(segment.id)}
                        disabled={refreshingSegment === segment.id}
                        className="text-green-600 hover:text-green-900 text-sm font-medium disabled:opacity-50"
                        title="Refresh user count"
                      >
                        {refreshingSegment === segment.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          '↻'
                        )}
                      </button>
                      <Link
                        href={`/segments/${segment.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        disabled={deletingSegment === segment.id}
                        className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                      >
                        {deletingSegment === segment.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create Segment Dialog */}
        <CreateSegmentDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSegmentCreated={handleSegmentCreated}
        />
      </div>
    </div>
  );
} 