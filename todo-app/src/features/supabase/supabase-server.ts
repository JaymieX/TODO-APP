import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AccessTokenProvider = () => Promise<string | null>;

export function createServerSupabaseClient(accessToken: AccessTokenProvider): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  // A client must be scoped to the request so it always uses the current Clerk session.
  return createClient(url, publishableKey, {
    accessToken,
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
