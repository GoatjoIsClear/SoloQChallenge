import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client.
 *
 * Uses the SERVICE ROLE key, so it must never be imported into client
 * components. All access happens inside /api routes. The service role bypasses
 * RLS, which is why the schema can keep RLS on with no public policies.
 *
 * Local dev and production both use the same single Supabase project — set the
 * two env vars in `.env.local` for dev and in the Netlify dashboard for prod.
 */
const url = process.env.SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabaseConfigured = Boolean(url && serviceRoleKey);

export const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Throw a clear error (instead of an opaque network failure) when env is missing. */
export function assertSupabaseConfigured() {
  if (!supabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
        'in .env.local (local development) and in your Netlify environment (production).',
    );
  }
}
