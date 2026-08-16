import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase server configuration is incomplete.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized.' });

  const token = authHeader.slice('Bearer '.length);
  const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized.' });

  const body = req.body ?? {};
  const safeArray = (value: unknown) => Array.isArray(value) ? value.slice(0, 1000) : [];
  const state = {
    user_id: user.id,
    habits: safeArray(body.habits),
    sessions: safeArray(body.sessions),
    outstand: safeArray(body.outstand),
    updated_at: new Date().toISOString(),
  };

  const admin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  const { error } = await admin.from('user_productivity_state').upsert(state, { onConflict: 'user_id' });
  if (error) return res.status(500).json({ error: 'Could not sync productivity state.' });

  return res.status(200).json({ success: true, updatedAt: state.updated_at });
}
