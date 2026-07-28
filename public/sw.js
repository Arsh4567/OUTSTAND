// public/sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    let data = {};
    
    // Safely attempt to parse JSON, fallback to plain text if it fails
    try {
      data = event.data.json();
    } catch (e) {
      console.warn('Push payload was not JSON. Falling back to text.');
      data = { 
        title: 'New Alert', 
        body: event.data.text() 
      };
    }
    
    const options = {
      body: data.body || 'You have a new notification.', // Fallback body
      icon: '/icon-192x192.png', 
      badge: '/badge-72x72.png', 
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification', options) // Fallback title
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Check if any window is already open matching our base URL
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        
        // Use startsWith to handle absolute URLs (e.g., https://myapp.com/)
        if (client.url && client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
