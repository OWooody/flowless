// Service Worker for Push Notifications
console.log('Service Worker loaded and ready');

self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  console.log('Event data:', event.data);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data parsed:', data);
      
      const options = {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        tag: data.tag,
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: false,
        silent: false,
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (error) {
      console.error('Error parsing push data:', error);
      // Fallback: show a simple notification
      event.waitUntil(
        self.registration.showNotification('Campaign Notification', {
          body: 'You have a new campaign notification',
          icon: '/favicon.ico',
        })
      );
    }
  } else {
    console.log('No data in push event, showing fallback notification');
    event.waitUntil(
      self.registration.showNotification('Campaign Notification', {
        body: 'You have a new campaign notification',
        icon: '/favicon.ico',
      })
    );
  }
});
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle notification click
  if (event.action) {
    // Handle specific action clicks
    console.log('Action clicked:', event.action);
  } else {
    // Default click behavior
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
  
  // Track the click
  if (event.notification.data?.campaignId) {
    fetch('/api/campaigns/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId: event.notification.data.campaignId,
        action: event.action || 'click',
      }),
    }).catch(error => {
      console.error('Failed to track notification click:', error);
    });
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  
  // Track notification close
  if (event.notification.data?.campaignId) {
    fetch('/api/campaigns/track-close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId: event.notification.data.campaignId,
      }),
    }).catch(error => {
      console.error('Failed to track notification close:', error);
    });
  }
});

// Handle background sync for offline notifications
self.addEventListener('sync', function(event) {
  console.log('Background sync event:', event);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Handle offline notification sync
      console.log('Syncing offline notifications...')
    );
  }
});

// Install event
self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
}); 