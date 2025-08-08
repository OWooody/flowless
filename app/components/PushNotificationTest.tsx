'use client';

import { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export function PushNotificationTest() {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    try {
      await subscribe();
      setMessage('Successfully subscribed to push notifications!');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
      setMessage('Successfully unsubscribed from push notifications!');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestNotification = async () => {
    try {
      // First, test if browser notifications work at all
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          // Test direct browser notification
          new Notification('Direct Browser Test', {
            body: 'This is a direct browser notification test',
            icon: '/favicon.ico',
          });
          setMessage('Direct browser notification sent! Check if you received it.');
        } else {
          setMessage('Notification permission not granted. Please allow notifications.');
          return;
        }
      }

      // Now test the API
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test push notification!',
        }),
      });

      if (response.ok) {
        setMessage('API test notification sent! Check browser console for details.');
      } else {
        setMessage('Failed to send test notification');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Checking push notification support...</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">Check browser console for debug info</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800">Push Notifications Not Supported</h3>
        <p className="mt-1 text-sm text-yellow-700">
          Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notification Test</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
          </span>
        </div>

        <div className="flex space-x-2">
          {!isSubscribed ? (
            <button
              onClick={handleSubscribe}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Subscribe to Push Notifications
            </button>
          ) : (
            <>
              <button
                onClick={handleTestNotification}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Send Test Notification
              </button>
              <button
                onClick={handleUnsubscribe}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Unsubscribe
              </button>
            </>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.startsWith('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 