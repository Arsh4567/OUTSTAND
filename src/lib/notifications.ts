// src/lib/notifications.ts
import { supabase } from '../integrations/supabase/client';

// Utility function to convert your VAPID public key for the browser
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(userId: string) {
  if (!('Notification' in window)) {
    console.error('This browser does not support desktop notification');
    return false;
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('Notification permission granted.');
    await registerAndSubscribe(userId);
    return true;
  } else {
    console.warn('Notification permission denied.');
    return false;
  }
}

async function registerAndSubscribe(userId: string) {
  if ('serviceWorker' in navigator) {
    try {
      // 1. Register the Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready; 
      
      // 2. Your VAPID Public Key
      const vapidPublicKey = "BLBCg8c31mQtaOrO9XBGDqNBResAN4tlKQLuLP3wsKr7kVX0eNTWbIeZLlkWoHRluur-3jt5IoCbPknDFTpwLRI"; 
      
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // 3. Subscribe the browser to Push Notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // 4. Extract the required keys from the subscription object
      const subJson = subscription.toJSON();
      
      if (!subJson.endpoint || !subJson.keys?.auth || !subJson.keys?.p256dh) {
        throw new Error('Invalid subscription object generated');
      }

      // 5. Save to Supabase (Using 'as any' to bypass strict type checking for the new table)
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subJson.endpoint,
          auth_key: subJson.keys.auth,
          p256dh_key: subJson.keys.p256dh
        }, {
          onConflict: 'user_id, endpoint' 
        });

      if (error) {
        console.error('Error saving subscription to DB:', error);
      } else {
        console.log('Successfully saved push subscription to Supabase!');
      }
      
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }
}
