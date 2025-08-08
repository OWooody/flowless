'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CampaignForm {
  name: string;
  message: string;
  targetSegment: string;
  segmentId: string;
  estimatedUsers: number;
  offerCode: string;
  scheduledAt: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  userCount: number | null;
  createdAt: string;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [refreshingUserCount, setRefreshingUserCount] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    name: '',
    message: '',
    targetSegment: '',
    segmentId: '',
    estimatedUsers: 0,
    offerCode: '',
    scheduledAt: '',
  });

  const steps = [
    { id: 1, name: 'Campaign Details', description: 'Basic campaign information' },
    { id: 2, name: 'Target Audience', description: 'Define your target segment' },
    { id: 3, name: 'Message & Offer', description: 'Craft your message and offer' },
    { id: 4, name: 'Schedule', description: 'Set campaign timing' },
  ];

  // Fetch segments on component mount
  useEffect(() => {
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
        setSegmentsLoading(false);
      }
    };

    fetchSegments();
  }, []);

  const handleInputChange = (field: keyof CampaignForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSegmentChange = (segmentId: string) => {
    const selectedSegment = segments.find(segment => segment.id === segmentId);
    setForm(prev => ({ 
      ...prev, 
      segmentId,
      targetSegment: selectedSegment?.name || '',
      estimatedUsers: selectedSegment?.userCount || 0
    }));
  };

  const handleRefreshUserCount = async () => {
    if (!form.segmentId) return;
    
    setRefreshingUserCount(true);
    try {
      const response = await fetch(`/api/segments/${form.segmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh_user_count' }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Refresh response:', data); // Debug log
        
        // Check if we have the expected data structure
        if (data.segment && typeof data.segment.userCount === 'number') {
          setForm(prev => ({ ...prev, estimatedUsers: data.segment.userCount }));
        } else {
          console.error('Unexpected response structure:', data);
          alert('Failed to get user count from response');
        }
      } else {
        const errorData = await response.json();
        console.error('Refresh failed:', errorData);
        alert(`Failed to refresh user count: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error refreshing user count:', error);
      alert('Failed to refresh user count');
    } finally {
      setRefreshingUserCount(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const campaignData = {
        name: form.name,
        message: form.message,
        targetSegment: form.targetSegment,
        segmentId: form.segmentId || null,
        estimatedUsers: form.estimatedUsers,
        offerCode: form.offerCode,
        scheduledAt: form.scheduledAt,
      };

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (response.ok) {
        const { campaign } = await response.json();
        router.push(`/campaigns/${campaign.id}`);
      } else {
        const error = await response.json();
        alert(`Error creating campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Campaign Name
              </label>
              <input
                type="text"
                id="name"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 block w-full form-input"
                placeholder="e.g., Summer Sale Campaign"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="targetSegment" className="block text-sm font-medium text-gray-700">
                Target Segment
              </label>
              {segmentsLoading ? (
                <div className="mt-1 flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading segments...</span>
                </div>
              ) : segments.length === 0 ? (
                <div className="mt-1 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <p className="text-sm text-gray-600">
                    No segments found. You can create segments in the Segments section.
                  </p>
                  <Link
                    href="/segments"
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                  >
                    Go to Segments →
                  </Link>
                </div>
              ) : (
                              <select
                id="targetSegment"
                value={form.segmentId}
                onChange={(e) => handleSegmentChange(e.target.value)}
                className="mt-1 block w-full form-select"
                required
              >
                  <option value="">Select a segment</option>
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name} {segment.userCount ? `(${segment.userCount} users)` : ''}
                    </option>
                  ))}
                </select>
              )}
              {form.targetSegment && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {form.targetSegment}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="estimatedUsers" className="block text-sm font-medium text-gray-700">
                Campaign Target Size
              </label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    id="estimatedUsers"
                    value={form.estimatedUsers}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const segment = segments.find(s => s.id === form.segmentId);
                      const maxUsers = segment?.userCount || 0;
                      
                      // Only allow setting a value up to the segment size
                      if (value <= maxUsers) {
                        handleInputChange('estimatedUsers', value);
                      }
                    }}
                    className="block w-full form-input"
                    placeholder="1000"
                    min="0"
                    max={segments.find(s => s.id === form.segmentId)?.userCount || 0}
                  />
                  {form.segmentId && (
                    <>
                      <button
                        type="button"
                        onClick={handleRefreshUserCount}
                        disabled={refreshingUserCount}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        title="Refresh user count from segment"
                      >
                        {refreshingUserCount ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          '↻'
                        )}
                      </button>
                      {form.estimatedUsers < (segments.find(s => s.id === form.segmentId)?.userCount || 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            const segment = segments.find(s => s.id === form.segmentId);
                            handleInputChange('estimatedUsers', segment?.userCount || 0);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                          title="Use full segment size"
                        >
                          Use Full
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Segment size info */}
                {form.segmentId && (
                  <div className="text-xs text-gray-500">
                    Segment contains {segments.find(s => s.id === form.segmentId)?.userCount?.toLocaleString() || 0} users
                    {form.estimatedUsers < (segments.find(s => s.id === form.segmentId)?.userCount || 0) && (
                      <span className="text-blue-600 ml-1">
                        (targeting {Math.round((form.estimatedUsers / (segments.find(s => s.id === form.segmentId)?.userCount || 1)) * 100)}% of segment)
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                You can set a lower target size for budget control or testing. Cannot exceed segment size.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                className="mt-1 block w-full form-textarea"
                placeholder="Enter your campaign message..."
                required
              />
            </div>
            <div>
              <label htmlFor="offerCode" className="block text-sm font-medium text-gray-700">
                Offer Code (Optional)
              </label>
              <input
                type="text"
                id="offerCode"
                value={form.offerCode}
                onChange={(e) => handleInputChange('offerCode', e.target.value)}
                className="mt-1 block w-full form-input"
                placeholder="e.g., SUMMER20"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700">
                Schedule Campaign
              </label>
              <input
                type="datetime-local"
                id="scheduledAt"
                value={form.scheduledAt}
                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                className="mt-1 block w-full form-input"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to save as draft
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
              <p className="mt-2 text-gray-600">
                Set up a new notification campaign for your users
              </p>
            </div>
            <Link
              href="/campaigns"
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              ← Back to Campaigns
            </Link>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                  <div className="flex items-center">
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        step.id <= currentStep
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-500'
                      }`}
                    >
                      <span className="text-sm font-medium">{step.id}</span>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div
                        className={`absolute left-4 top-4 w-full h-0.5 -z-10 ${
                          step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-3">
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 