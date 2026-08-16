import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const publicKey = process.env.VITE_VAPID_PUBLIC_KEY as string;
const privateKey = process.env.VAPID_PRIVATE_KEY as string;

function minutesInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { hour, minute, total: hour * 60 + minute };
}

function localDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function quietHours(now: Date, start: string, end: string, enabled: boolean, timeZone: string) {
  if (!enabled) return false;
  const current = minutesInZone(now, timeZone).total;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s > e ? current >= s || current < e : current >= s && current < e;
}

function chooseHabit(habits: any[], today: string) {
  const pending = habits.filter((habit) => !Array.isArray(habit?.history) || !habit.history.includes(today));
  return pending[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) return res.status(401).json({ error: 'Unauthorized.' });
  if (!url || !serviceKey || !publicKey || !privateKey) return res.status(500).json({ error: 'Notification server configuration is incomplete.' });

  webpush.setVapidDetails('mailto:notifications@outstand.app', publicKey, privateKey);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: preferences, error: preferenceError } = await admin.from('notification_preferences').select('*').eq('push_enabled', true);
  if (preferenceError) return res.status(500).json({ error: 'Could not read notification preferences.' });

  let considered = 0;
  let sent = 0;

  for (const pref of preferences ?? []) {
    considered += 1;
    const tz = pref.timezone || 'UTC';
    const now = new Date();
    const clock = minutesInZone(now, tz);
    if (quietHours(now, pref.quiet_start, pref.quiet_end, pref.quiet_hours_enabled, tz)) continue;
    if (clock.minute > 10) continue; // cron runs hourly; send only once near the selected hour.

    const { data: state } = await admin.from('user_productivity_state').select('habits,sessions,outstand').eq('user_id', pref.user_id).maybeSingle();
    if (!state) continue;

    const date = localDate(now, tz);
    const { count } = await admin.from('notification_events').select('id', { count: 'exact', head: true }).eq('user_id', pref.user_id).gte('created_at', `${date}T00:00:00Z`);
    if ((count ?? 0) >= Math.max(1, Number(pref.max_daily) || 3)) continue;

    let category: 'habit' | 'motivation' | null = null;
    let title = '';
    let body = '';
    let path = '/outstand';

    // 19:00 local time: remind about the first unfinished habit.
    if (pref.habits_enabled && clock.hour === 19) {
      const habit = chooseHabit(Array.isArray(state.habits) ? state.habits : [], date);
      if (habit) {
        category = 'habit';
        title = `${habit.emoji || '🔵'} ${habit.name} is still waiting`;
        body = `A small step tonight keeps your momentum alive. Open OUTSTAND and get it done.`;
      }
    }

    // 08:00 local time: lightweight motivation, only if there was no habit reminder.
    if (!category && pref.motivational_enabled && clock.hour === 8) {
      const quotes = [
        'Small wins compound. Just take the next step. 🔵',
        'You do not need a perfect day. You need one good decision.',
        'Momentum starts with something small enough to do right now. ⚡',
        'Progress is still progress when nobody else sees it.',
        'Make today a little better than yesterday. 🎯',
      ];
      category = 'motivation';
      title = 'Good morning from OUTSTAND';
      body = quotes[new Date().getUTCDate() % quotes.length];
      path = '/';
    }

    if (!category) continue;

    const dedupeKey = `${category}:${date}:${clock.hour}`;
    const { data: existing } = await admin.from('notification_delivery_log').select('id').eq('user_id', pref.user_id).eq('dedupe_key', dedupeKey).maybeSingle();
    if (existing) continue;

    const { data: subscriptions } = await admin.from('push_subscriptions').select('endpoint,auth_key,p256dh_key').eq('user_id', pref.user_id);
    if (!subscriptions?.length) continue;

    const payload = JSON.stringify({ title, body, icon: '/icon-192x192.png', badge: '/badge-72x72.png', url: path, tag: dedupeKey });
    let delivered = false;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { auth: sub.auth_key, p256dh: sub.p256dh_key } }, payload);
        delivered = true;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    if (delivered) {
      await admin.from('notification_delivery_log').insert({ user_id: pref.user_id, dedupe_key: dedupeKey, category });
      await admin.from('notification_events').insert({ user_id: pref.user_id, category, title, body, url: path, delivered_at: new Date().toISOString() });
      sent += 1;
    }
  }

  return res.status(200).json({ success: true, considered, sent });
}
