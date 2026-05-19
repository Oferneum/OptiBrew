import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

/** Create a Supabase client authenticated with a user JWT (for API routes). */
export function createAuthClient(token: string) {
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

/** Extract the Bearer token from a request and return an authenticated client. */
export function getRequestClient(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  return token ? createAuthClient(token) : supabase;
}

/**
 * Service-role client — bypasses RLS entirely.
 * Only use in server-only contexts (cron jobs, admin routes).
 * Never expose this client or its token to the browser.
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
