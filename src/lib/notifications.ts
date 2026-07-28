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

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert("FRONTEND ERROR: This browser does not support desktop/push notifications.");
    console.error('This browser does not support desktop notification');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      await registerAndSubscribe();
      return true;
    } else {
      alert("FRONTEND ERROR: Notification permission was denied by the browser or user.");
      console.warn('Notification permission denied.');
      return false;
    }
  } catch (err: any) {
    alert("FRONTEND ERROR requesting permission: " + (err.message || JSON.stringify(err)));
    return false;
  }
}

async function registerAndSubscribe() {
  // 1. CRITICAL FIX: Verify the Supabase client has an active session FIRST
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    alert("FRONTEND ERROR: No active Supabase session found! Are you properly logged in?");
    console.error("Auth Error: No active Supabase session found. RLS will block this request.");
    return;
  }

  const authenticatedUserId = session.user.id;

  if ('serviceWorker' in navigator) {
    try {
      // 2. Register the Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready; 
      
      // 3. Your VAPID Public Key
      const vapidPublicKey = "BLBCg8c31mQtaOrO9XBGDqNBResAN4tlKQLuLP3wsKr7kVX0eNTWbIeZLlkWoHRluur-3jt5IoCbPknDFTpwLRI"; 
      
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // 4. Subscribe the browser to Push Notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // 5. Extract the required keys from the subscription object
      const subJson = subscription.toJSON();
      
      if (!subJson.endpoint || !subJson.keys?.auth || !subJson.keys?.p256dh) {
        throw new Error('Invalid subscription object generated');
      }

      // 6. Save to Supabase using the VERIFIED authenticatedUserId
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: authenticatedUserId, // Guaranteed to match auth.uid() in your RLS policy
          endpoint: subJson.endpoint,
          auth_key: subJson.keys.auth,
          p256dh_key: subJson.keys.p256dh
        }, {
          onConflict: 'user_id, endpoint' 
        });

      if (error) {
        alert("FRONTEND DB ERROR: " + error.message + " (Code: " + error.code + ")");
        console.error('Error saving subscription to DB:', error);
        if (error.code === '42501') {
           console.error("RLS 42501 Error: The user_id does not match the active session, or the policy is missing.");
        }
      } else {
        alert("SUCCESS! Push subscription was saved to Supabase.");
        console.log('Successfully saved push subscription to Supabase!');
      }
      
    } catch (error: any) {
      alert("FRONTEND CATCH ERROR: " + (error.message || JSON.stringify(error)));
      console.error('Push subscription failed:', error);
    }
  } else {
    alert("FRONTEND ERROR: Service Workers are not supported in this mobile browser.");
  }
}

// 7. HANDLE TEST PUSH (Sends authenticated user ID to your Vercel backend API)
export async function handleTestPush() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      alert("You must be logged in to test push notifications.");
      return;
    }

    const response = await fetch('/api/send-test-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: session.user.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert("Test Push Failed: " + (result.error || 'Unknown error'));
    } else {
      alert("Test push sent successfully! Check your notification tray.");
    }
  } catch (err: any) {
    alert("Error triggering test push: " + err.message);
  }
}
