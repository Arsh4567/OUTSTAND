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

const sendError = (res: VercelResponse, status: number, error: string, code: string) =>
  res.status(status).setHeader('Cache-Control', 'no-store').json({ error, code });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
    if (!supabaseUrl || !supabaseAnonKey) return sendError(res, 503, 'Supabase server configuration is incomplete.', 'SERVER_CONFIG_MISSING');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return sendError(res, 401, 'Unauthorized.', 'UNAUTHORIZED');
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token || token.length > 4096) return sendError(res, 401, 'Unauthorized.', 'UNAUTHORIZED');

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) return sendError(res, 401, 'Unauthorized.', 'UNAUTHORIZED');

    const parsed = SyncSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      console.warn('Invalid productivity state payload', parsed.error.flatten().fieldErrors);
      return sendError(res, 400, 'Invalid productivity state payload.', 'INVALID_PAYLOAD');
    }

    const { error } = await authClient.rpc('upsert_user_productivity_state', {
      p_habits: parsed.data.habits,
      p_sessions: parsed.data.sessions,
      p_outstand: parsed.data.outstand,
    });
    if (error) {
      console.error('Productivity state sync failed:', { code: error.code, message: error.message });
      return sendError(res, 500, 'Could not sync productivity state.', error.code ?? 'SYNC_FAILED');
    }

    return res.status(200).setHeader('Cache-Control', 'no-store').json({ success: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Productivity state sync request failed:', error);
    return sendError(res, 500, 'Unexpected server error.', 'INTERNAL_SERVER_ERROR');
  }
}
