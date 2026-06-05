import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton for client components — stores session in cookies so the
// server can read it via createSupabaseServerClient().
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!client) client = createBrowserClient(url, key);
  return client;
}
