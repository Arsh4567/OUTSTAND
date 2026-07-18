import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// 1. Configure Web Push with your keys
webpush.setVapidDetails(
  'mailto:your-email@example.com', 
  process.env.VITE_VAPID_PUBLIC_KEY as string, 
  process.env.VAPID_PRIVATE_KEY as string
);


// 2. Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  try {
    // 3. Find the user's device in Supabase
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subs || subs.length === 0) {
      return res.status(404).json({ error: 'No subscription found for this user' });
    }

    // 4. The Notification Content
    const payload = JSON.stringify({
      title: "Outstand",
      body: "This is your first test notification! 🎉",
      icon: "/icon-192x192.png", 
      badge: "/icon-192x192.png",
      url: "/" 
    });

    // 5. Send to all devices the user has allowed
    const sendPromises = subs.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { auth: sub.auth_key, p256dh: sub.p256dh_key },
      };
      return webpush.sendNotification(pushSubscription, payload);
    });

    await Promise.all(sendPromises);
    return res.status(200).json({ success: true, message: 'Push sent!' });

  } catch (error) {
    console.error('Error sending push:', error);
    return res.status(500).json({ error: 'Failed to send push notification' });
  }
}

