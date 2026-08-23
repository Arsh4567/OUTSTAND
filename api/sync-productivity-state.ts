import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');
const isoTimestamp = z.string().datetime({ offset: true });
const notificationTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid notification time').nullable().optional();

const HabitSchema = z.object({ id: z.string().min(1).max(100), name: z.string().trim().min(1).max(120), emoji: z.string().max(16), color: z.string().min(1).max(40), createdAt: isoTimestamp, history: z.array(isoDate).max(3660), notificationTime }).strict();
const FocusSessionSchema = z.object({ id: z.string().min(1).max(100), startedAt: isoTimestamp, durationMin: z.number().finite().min(0).max(1440), completed: z.boolean() }).strict();
const OutstandSchema = z.object({ id: z.string().min(1).max(100), title: z.string().trim().min(1).max(200), xp: z.number().finite().min(0).max(10000).default(0), completedAt: isoTimestamp }).strict();
const SyncSchema = z.object({ habits: z.array(HabitSchema).max(7), sessions: z.array(FocusSessionSchema).max(500), outstand: z.array(OutstandSchema).max(200) }).strict();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Supabase server configuration is incomplete.' });
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized.' });
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token.length > 4096) return res.status(401).json({ error: 'Unauthorized.' });
  const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized.' });
  const parsed = SyncSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Invalid productivity state payload.' });
  const { error } = await authClient.rpc('upsert_user_productivity_state', { p_habits: parsed.data.habits, p_sessions: parsed.data.sessions, p_outstand: parsed.data.outstand });
  if (error) { console.error('Productivity state sync failed:', error.code, error.message); return res.status(500).json({ error: 'Could not sync productivity state.', code: error.code ?? 'SYNC_FAILED' }); }
  return res.status(200).json({ success: true, updatedAt: new Date().toISOString() });
}
