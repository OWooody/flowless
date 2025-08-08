'use client';

import { useState, useEffect } from 'react';

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      console.log('Checking push notification support...');
      
      // Check if service workers and push notifications are supported
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service Worker and PushManager are supported');
        setIsSupported(true);
        
        try {
          // Check if user is already subscribed with timeout
          const registrationPromise = navigator.serviceWorker.ready;
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Service Worker timeout')), 5000)
          );
          
          const registration = await Promise.race([registrationPromise, timeoutPromise]) as ServiceWorkerRegistration;
          console.log('Service Worker ready:', registration);
          
          const existingSubscription = await registration.pushManager.getSubscription();
          console.log('Existing subscription:', existingSubscription);
          
          if (existingSubscription) {
            console.log('User is already subscribed');
            setIsSubscribed(true);
            setSubscription({
              endpoint: existingSubscription.endpoint,
              p256dh: btoa(String.fromCharCode.apply(null, 
                Array.from(new Uint8Array(existingSubscription.getKey('p256dh')!))
              )),
              auth: btoa(String.fromCharCode.apply(null, 
                Array.from(new Uint8Array(existingSubscription.getKey('auth')!))
              )),
            });
          } else {
            console.log('No existing subscription found');
          }
        } catch (swError) {
          console.error('Error checking existing subscription:', swError);
          // Don't fail completely, just mark as not subscribed
        }
      } else {
        console.log('Service Worker or PushManager not supported');
        setIsSupported(false);
      }
    } catch (error) {
      console.error('Error checking push notification support:', error);
      setIsSupported(false);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      setLoading(true);

      // Register service worker
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered:', registration);
      
      await navigator.serviceWorker.ready;
      console.log('Service worker ready');

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

             // Convert subscription to format needed by server
       const subscriptionData = {
         endpoint: pushSubscription.endpoint,
         p256dh: btoa(String.fromCharCode.apply(null, 
           Array.from(new Uint8Array(pushSubscription.getKey('p256dh')!))
         )),
         auth: btoa(String.fromCharCode.apply(null, 
           Array.from(new Uint8Array(pushSubscription.getKey('auth')!))
         )),
       };

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      setIsSubscribed(true);
      setSubscription(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported || !subscription) {
      throw new Error('No active subscription to unsubscribe from');
    }

    try {
      setLoading(true);

      // Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();

      if (pushSubscription) {
        // Unsubscribe from push manager
        await pushSubscription.unsubscribe();

        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setIsSubscribed(false);
      setSubscription(null);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    loading,
    subscribe,
    unsubscribe,
  };
} 