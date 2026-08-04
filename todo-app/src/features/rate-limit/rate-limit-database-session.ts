import type { NextApiRequest } from "next";
import { getAuthenticatedSupabaseSession } from "@/features/supabase/supabase-session";
import { RateLimitDatabase } from "./rate-limit-database";

export function getAuthenticatedRateLimitDatabase(request: NextApiRequest) {
  const session = getAuthenticatedSupabaseSession(request);
  return session ? new RateLimitDatabase(session.client, session.userId) : null;
}
