import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');
const isoTimestamp = z.string().datetime({ offset: true });

const HabitSchema = z.object({ id: z.string().min(1).max(100), name: z.string().trim().min(1).max(120), emoji: z.string().max(16), color: z.string().min(1).max(40), createdAt: isoTimestamp, history: z.array(isoDate).max(3660) }).strict();
const FocusSessionSchema = z.object({ id: z.string().min(1).max(100), startedAt: isoTimestamp, durationMin: z.number().finite().min(0).max(1440), completed: z.boolean() }).strict();
const OutstandSchema = z.object({ id: z.string().min(1).max(100), title: z.string().trim().min(1).max(200), xp: z.number().finite().min(0).max(10000).default(0), completedAt: isoTimestamp }).strict();
const SyncSchema = z.object({ habits: z.array(HabitSchema).max(100), sessions: z.array(FocusSessionSchema).max(500), outstand: z.array(OutstandSchema).max(200) }).strict();

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

  const state = { user_id: user.id, habits: parsed.data.habits, sessions: parsed.data.sessions, outstand: parsed.data.outstand, updated_at: new Date().toISOString() };

  // Prefer the service role when configured, but do not make an unrelated secret
  // mandatory: the authenticated user's client can safely write its own row when
  // the table's RLS policy permits it.
  const db = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : authClient;
  const { error } = await db.from('user_productivity_state').upsert(state, { onConflict: 'user_id' });
  if (error) {
    console.error('Productivity state sync failed:', error.code, error.message);
    return res.status(500).json({ error: 'Could not sync productivity state.', code: error.code ?? 'SYNC_FAILED' });
  }

  return res.status(200).json({ success: true, updatedAt: state.updated_at });
}
