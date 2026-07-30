import type { NextApiRequest } from "next";
import { getAuthenticatedSupabaseSession } from "@/features/supabase/supabase-session";
import { ProfileDatabase } from "./profile-database";

export function getAuthenticatedProfileDatabase(request: NextApiRequest) {
  const session = getAuthenticatedSupabaseSession(request);

  if (!session) {
    return null;
  }

  return new ProfileDatabase(session.client, session.userId);
}
