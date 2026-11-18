/**
 * Supabase client configuration.
 *
 * Two clients are initialized:
 * - supabase (anon): For user-scoped, RLS-respecting queries.
 *   Used when forwarding a user's JWT to respect row-level security.
 * - supabaseAdmin (service-role): For privileged server-side operations.
 *   NEVER expose the service-role key to the frontend.
 */

import { createClient } from '@supabase/supabase-js';
import env from './env.js';

// --- Anon Client (RLS-respecting) ---
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// --- Service-Role Client (bypasses RLS — server-side only) ---
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export { supabase, supabaseAdmin };
