import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getServerSupabaseClient() {
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  // API routes use the publishable key so Supabase Row Level Security still applies.
  client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
