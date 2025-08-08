'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CampaignNotificationSetup } from '../../components/CampaignNotificationSetup';

interface Campaign {
  id: string;
  name: string;
  message: string;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  targetSegment: string;
  estimatedUsers: number;
  sentCount: number;
  createdAt: string;
  scheduledAt?: string;
  offerCode?: string;
  userId: string;
  organizationId?: string;
}

interface CampaignAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaignDetails();
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const [campaignResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`),
        fetch(`/api/campaigns/${campaignId}/analytics`)
      ]);

      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();
        setCampaign(campaignData.campaign);
      } else {
        setError('Campaign not found');
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      setError('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchCampaignDetails(); // Refresh data
      } else {
        alert('Failed to update campaign status');
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
      alert('Failed to update campaign status');
    }
  };

  const handleSendCampaign = async () => {
    if (!campaign) return;
    
    if (!confirm(`Are you sure you want to send this campaign to ${campaign.estimatedUsers} users?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Campaign sent successfully! Sent to ${result.deliverySummary.sentCount} users.`);
        fetchCampaignDetails(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Failed to send campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign');
    }
  };

  const handleTestCampaign = async () => {
    if (!campaign) return;
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Test notification sent! You should receive a notification with: "${campaign.message}"`);
      } else {
        const error = await response.json();
        alert(`Failed to send test notification: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The campaign you are looking for does not exist.'}</p>
          <Link
            href="/campaigns"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Campaigns
          </Link>
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
              <div className="flex items-center space-x-4">
                <Link
                  href="/campaigns"
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  ← Back to Campaigns
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <p className="mt-2 text-gray-600">
                Created on {formatDate(campaign.createdAt)}
                {campaign.scheduledAt && ` • Scheduled for ${formatDate(campaign.scheduledAt)}`}
              </p>
            </div>
            <div className="flex space-x-3">
              {campaign.status === 'draft' && (
                <>
                  <button
                    onClick={handleTestCampaign}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Test Campaign
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('scheduled')}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={handleSendCampaign}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Send Now
                  </button>
                </>
              )}
              {campaign.status === 'scheduled' && (
                <button
                  onClick={() => handleStatusUpdate('draft')}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Unschedule
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Setup */}
            <CampaignNotificationSetup />
            {/* Campaign Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {campaign.message}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Segment</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.targetSegment}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Users</label>
                    <p className="mt-1 text-sm text-gray-900">{campaign.estimatedUsers.toLocaleString()}</p>
                  </div>
                  {campaign.offerCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Offer Code</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono bg-yellow-50 px-2 py-1 rounded">
                        {campaign.offerCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics */}
            {analytics && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Analytics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.totalSent.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.totalDelivered.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.totalOpened.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.totalClicked.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Clicked</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{analytics.openRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Open Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{analytics.clickRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Click Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{analytics.conversionRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Conversion Rate</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Duplicate Campaign
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Export Data
                </button>
                {campaign.status === 'draft' && (
                  <button className="w-full px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                    Delete Campaign
                  </button>
                )}
              </div>
            </div>

            {/* Campaign Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Campaign Created</p>
                    <p className="text-xs text-gray-500">{formatDate(campaign.createdAt)}</p>
                  </div>
                </div>
                {campaign.scheduledAt && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Scheduled</p>
                      <p className="text-xs text-gray-500">{formatDate(campaign.scheduledAt)}</p>
                    </div>
                  </div>
                )}
                {campaign.status === 'sent' || campaign.status === 'completed' ? (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Campaign Sent</p>
                      <p className="text-xs text-gray-500">
                        {campaign.sentCount.toLocaleString()} messages delivered
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 