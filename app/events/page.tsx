'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

interface Event {
  id: string;
  name: string;
  properties: any;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  path?: string;
  referrer?: string;
  userAgent?: string;
  action?: string;
  category: string;
  itemCategory?: string;
  itemId?: string;
  itemName?: string;
  pageTitle?: string;
  value?: number;
  planId?: string;
  userId?: string;
  userPhone?: string;
  organizationId?: string;
}

interface DetailedEvent extends Event {
  itemName?: string;
  itemId?: string;
  itemCategory?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<DetailedEvent | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    startDate: '',
    endDate: '',
  });
  const { getToken } = useAuth();

  const fetchEvents = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.name && { name: filters.name }),
        ...(filters.category && { category: filters.category }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      console.log('Fetching events with params:', queryParams.toString());
      const response = await fetch(`/api/events?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const data = await response.json();
      console.log('Received events data:', data);
      setEvents(data.events);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (eventId: string) => {
    try {
      setLoadingDetails(true);
      setSelectedEventId(eventId);
      setSelectedEvent(null); // Clear previous event data
      
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      console.log('Fetching details for event:', eventId);
      const response = await fetch(`/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch event details');
      }

      const eventDetails = await response.json();
      console.log('Received event details:', eventDetails);
      setSelectedEvent(eventDetails);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedEventId(null);
    setSelectedEvent(null);
    setLoadingDetails(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [page, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filters change
  };

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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Tracked Events</h1>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Filter by name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Filter by category"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No events found. Try adjusting your filters or tracking some events.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      {event.action && (
                        <div className="text-sm text-gray-500">Action: {event.action}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.userId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.pageTitle || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{event.path || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.userAgent || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => fetchEventDetails(event.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="View details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {events.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEventId && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                    <p className="text-gray-600">Loading event details...</p>
                  </div>
                ) : selectedEvent ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Event Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Category</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.category}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                          <dd className="mt-1 text-sm text-gray-900">{new Date(selectedEvent.timestamp).toLocaleString()}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Action</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.action || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">User ID</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.userId || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.organizationId || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Page Information</h3>
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Page Title</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.pageTitle || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Page URL</dt>
                          <dd className="mt-1 text-sm text-gray-900 break-all">{selectedEvent.path || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Item Details</h3>
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Item Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.itemName || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Item ID</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.itemId || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Item Category</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.itemCategory || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Value</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedEvent.value || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>

                    {selectedEvent.properties && Object.keys(selectedEvent.properties).length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Additional Properties</h3>
                        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2">
                          {Object.entries(selectedEvent.properties).map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-sm font-medium text-gray-500">{key}</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-red-600">Failed to load event details</p>
                    <button
                      onClick={() => fetchEventDetails(selectedEventId)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 