import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { getAIProvider, modelFor } from './ai-provider.js';

const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const publicKey = (process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '').trim();
const privateKey = process.env.VAPID_PRIVATE_KEY as string;

function clockInZone(date: Date, timeZone: string) { const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date); return { hour: Number(parts.find((p) => p.type === 'hour')?.value ?? 0), minute: Number(parts.find((p) => p.type === 'minute')?.value ?? 0) }; }
function localDate(date: Date, timeZone: string) { return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
function weekday(date: Date, timeZone: string) { return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(date); }
function quietHours(date: Date, pref: any, timeZone: string) { if (!pref.quiet_hours_enabled) return false; const { hour, minute } = clockInZone(date, timeZone); const current = hour * 60 + minute; const [sh, sm] = String(pref.quiet_start || '22:00').split(':').map(Number); const [eh, em] = String(pref.quiet_end || '07:00').split(':').map(Number); const start = sh * 60 + sm; const end = eh * 60 + em; return start > end ? current >= start || current < end : current >= start && current < end; }

function findPattern(sessions: any[], now: Date, timeZone: string) {
  const cutoff = now.getTime() - 56 * 86400000;
  const rows = (Array.isArray(sessions) ? sessions : []).filter((s) => s?.completed && Number(s?.durationMin) > 0 && typeof s?.startedAt === 'string' && new Date(s.startedAt).getTime() >= cutoff);
  const day = weekday(now, timeZone); const same = rows.filter((s) => weekday(new Date(s.startedAt), timeZone) === day); const other = rows.filter((s) => weekday(new Date(s.startedAt), timeZone) !== day);
  if (same.length < 3 || other.length < 5) return null;
  const avg = (items: any[]) => items.reduce((sum, s) => sum + Number(s.durationMin), 0) / items.length;
  const sameAverage = avg(same); const otherAverage = avg(other);
  if (sameAverage < 20 || otherAverage < 30 || sameAverage > otherAverage * 0.82) return null;
  return { day, sameAverage: Math.round(sameAverage), otherAverage: Math.round(otherAverage), suggested: Math.max(20, Math.min(45, Math.round((sameAverage * 0.85) / 5) * 5)) };
}

async function buildMessage(name: string, pattern: { day: string; sameAverage: number; otherAverage: number; suggested: number }) {
  const fallback = `${name ? `${name}, ` : ''}your ${pattern.day} focus sessions usually wrap up around ${pattern.sameAverage} minutes, compared with ${pattern.otherAverage} minutes on other days. Want to try a ${pattern.suggested}-minute session today?`;
  try {
    const provider = await getAIProvider();
    const result = await generateText({ model: modelFor(provider.name, provider.provider, 'chat'), temperature: 0.2, maxRetries: 0, system: 'You are OUTSTAND Contextual Coach. Write one short actionable productivity notification from the supplied statistics. Never diagnose, shame, or claim the user is distracted. Say sessions usually wrap up around the observed duration. End with a practical question. No headings or quotes.', prompt: `Name: ${name || 'there'}; day: ${pattern.day}; average ${pattern.day} session: ${pattern.sameAverage} minutes; average other-day session: ${pattern.otherAverage} minutes; suggested session today: ${pattern.suggested} minutes.` });
    return result.text.trim().replace(/^['"]|['"]$/g, '') || fallback;
  } catch { return fallback; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) return res.status(401).json({ error: 'Unauthorized.' });
  if (!url || !serviceKey || !publicKey || !privateKey) return res.status(500).json({ error: 'Coaching notification configuration is incomplete.' });
  webpush.setVapidDetails('mailto:notifications@outstand.app', publicKey, privateKey);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: preferences, error } = await admin.from('notification_preferences').select('*').eq('push_enabled', true).eq('coaching_enabled', true);
  if (error) return res.status(500).json({ error: 'Could not read coaching preferences.' });
  const now = new Date(); let considered = 0; let sent = 0;

  for (const pref of preferences ?? []) {
    considered += 1; const tz = pref.timezone || 'UTC'; const clock = clockInZone(now, tz);
    if (clock.hour !== 8 || clock.minute > 10 || quietHours(now, pref, tz)) continue;
    const date = localDate(now, tz); const dedupeKey = `coaching:${date}:8`;
    const { count } = await admin.from('notification_events').select('id', { count: 'exact', head: true }).eq('user_id', pref.user_id).gte('created_at', new Date(now.getTime() - 24 * 86400000).toISOString());
    if ((count ?? 0) >= Math.max(1, Number(pref.max_daily) || 3)) continue;
    const { data: existing } = await admin.from('notification_delivery_log').select('id').eq('user_id', pref.user_id).eq('dedupe_key', dedupeKey).maybeSingle(); if (existing) continue;
    const { data: state } = await admin.from('user_productivity_state').select('sessions').eq('user_id', pref.user_id).maybeSingle();
    const pattern = findPattern(state?.sessions, now, tz); if (!pattern) continue;
    const { data: profile } = await admin.from('profiles').select('display_name,full_name').eq('id', pref.user_id).maybeSingle();
    const name = profile?.display_name || profile?.full_name || '';
    const body = await buildMessage(name, pattern);
    const { data: subscriptions } = await admin.from('push_subscriptions').select('id,endpoint,auth_key,p256dh_key').eq('user_id', pref.user_id); if (!subscriptions?.length) continue;
    let delivered = false;
    for (const sub of subscriptions) {
      try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { auth: sub.auth_key, p256dh: sub.p256dh_key } }, JSON.stringify({ title: 'A pattern worth trying', body, icon: '/outstand-logo.png', badge: '/outstand-logo.png', url: '/focus', tag: dedupeKey, renotify: true })); delivered = true; }
      catch (pushError: any) { if (pushError?.statusCode === 404 || pushError?.statusCode === 410) await admin.from('push_subscriptions').delete().eq('id', sub.id); }
    }
    if (delivered) { await admin.from('notification_delivery_log').insert({ user_id: pref.user_id, dedupe_key: dedupeKey, category: 'coaching' }); await admin.from('notification_events').insert({ user_id: pref.user_id, category: 'coaching', title: 'A pattern worth trying', body, url: '/focus', dedupe_key: dedupeKey, delivered_at: new Date().toISOString() }); sent += 1; }
  }
  return res.status(200).json({ success: true, considered, sent });
}
