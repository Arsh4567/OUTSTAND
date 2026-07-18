// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Vercel and Vite use import.meta.env to access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
