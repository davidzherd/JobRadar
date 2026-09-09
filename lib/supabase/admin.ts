import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — SERVER ONLY. Bypasses RLS, so it must never
 * be imported into a Client Component or shipped to the browser.
 *
 * Used by trusted server routes for the few things that write gated columns:
 * the onboarding submit handler, admin approval/rejection (writing
 * `search_prefs` / `rejected`), and the tracked email apply-link endpoint.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
