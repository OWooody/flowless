'use client';

import { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export function CampaignNotificationSetup() {
  const { isSupported, isSubscribed, loading, subscribe } = usePushNotifications();
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    try {
      await subscribe();
      setMessage('Successfully subscribed! You can now test campaigns.');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestDirectNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Direct Test', {
        body: 'This is a direct browser notification test',
        icon: '/favicon.ico',
      });
      setMessage('Direct notification sent! Did you receive it?');
    } else {
      setMessage('Notification permission not granted or not supported');
    }
  };

  if (loading) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-blue-700">Checking notification support...</span>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          Push notifications are not supported in your browser. Please use Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800 font-medium">Enable Notifications</p>
            <p className="text-xs text-blue-600">Subscribe to test campaign notifications</p>
          </div>
          <button
            onClick={handleSubscribe}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
          >
            Subscribe
          </button>
        </div>
        {message && (
          <p className={`mt-2 text-xs ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-green-800">Notifications enabled! You can test campaigns.</span>
        </div>
        <button
          onClick={handleTestDirectNotification}
          className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
        >
          Test Direct
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
} 