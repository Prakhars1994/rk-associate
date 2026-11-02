import { createClient } from '@supabase/supabase-js';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

/** Client acting as the signed-in user (RLS applies). */
export function userClient(env, accessToken) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...opts,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Anonymous client (RLS applies, public data only). */
export function anonClient(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, opts);
}

/** Service-role client: bypasses RLS. Server-side only, for webhooks and admin jobs. */
export function serviceClient(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts);
}
