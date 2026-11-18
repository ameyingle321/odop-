/**
 * Supabase client initialization for the frontend.
 *
 * Uses the public anon key only — safe for browser usage.
 * The anon key works with Row Level Security (RLS).
 *
 * NEVER place the service-role key in frontend code or VITE_* variables.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
