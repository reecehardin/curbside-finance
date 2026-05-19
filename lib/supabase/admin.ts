import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security.
 *
 * SERVER-SIDE ONLY — used by the Tebex webhook route, which has no user
 * session. Never import this into client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
