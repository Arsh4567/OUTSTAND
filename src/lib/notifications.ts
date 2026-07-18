// src/lib/notifications.ts

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.error('This browser does not support desktop notification');
    return false;
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('Notification permission granted.');
    await registerServiceWorker();
    return true;
  } else {
    console.warn('Notification permission denied.');
    return false;
  }
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Later, you will use this registration object to subscribe to your backend
      // const subscription = await registration.pushManager.subscribe({ ... });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}
