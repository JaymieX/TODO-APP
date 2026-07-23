import { createClient, type SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js";

type SupabaseConfig = {
  url: string | undefined;
  publishableKey: string | undefined;
};

function getSupabaseConfig(): SupabaseConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export class SupabaseConnection {
  private client: SupabaseJsClient | null = null;

  constructor(private readonly config: SupabaseConfig = getSupabaseConfig()) {}

  getClient(): SupabaseJsClient {
    if (this.client) {
      return this.client;
    }

    const { url, publishableKey } = this.config;

    if (!url || !publishableKey) {
      throw new Error(
        "Missing Supabase configuration. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
      );
    }

    // Create the browser client only when the app first needs Supabase.
    this.client = createClient(url, publishableKey);
    return this.client;
  }
}

export const supabase = new SupabaseConnection();
