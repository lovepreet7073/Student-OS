import { createClient } from "@supabase/supabase-js";

import { publicEnv, requireServerEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. Bypasses RLS. Use ONLY in trusted server contexts
 * (e.g. webhook handlers, scheduled tasks). Never expose to the client.
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function getSupabaseAdmin() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
