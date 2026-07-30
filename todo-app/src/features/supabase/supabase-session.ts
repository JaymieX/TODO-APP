import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest } from "next";
import { createServerSupabaseClient } from "./supabase-server";

export function getAuthenticatedSupabaseSession(request: NextApiRequest) {
  const auth = getAuth(request);

  if (!auth.isAuthenticated) {
    return null;
  }

  return {
    client: createServerSupabaseClient(() => auth.getToken()),
    userId: auth.userId,
  };
}
