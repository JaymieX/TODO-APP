import type { NextApiRequest } from "next";
import { getAuthenticatedSupabaseSession } from "@/features/supabase/supabase-session";
import { TodoDatabase } from "./todo-database";

export function getAuthenticatedTodoDatabase(request: NextApiRequest) {
  const session = getAuthenticatedSupabaseSession(request);

  if (!session) {
    return null;
  }

  return new TodoDatabase(session.client, session.userId);
}
