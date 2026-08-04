import type { NextApiRequest, NextApiResponse } from "next";
import type { RateLimitUsage } from "@/features/rate-limit/rate-limit-database";
import { getAuthenticatedRateLimitDatabase } from "@/features/rate-limit/rate-limit-database-session";

type UsageResponse =
  | { data: RateLimitUsage }
  | { error: { message: string } };

function sendError(response: NextApiResponse<UsageResponse>, status: number, message: string) {
  response.status(status).json({ error: { message } });
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<UsageResponse>,
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendError(response, 405, "Method not allowed.");
    return;
  }

  const rateLimitDatabase = getAuthenticatedRateLimitDatabase(request);
  if (!rateLimitDatabase) {
    sendError(response, 401, "Sign in to view assistant usage.");
    return;
  }

  try {
    response.status(200).json({ data: await rateLimitDatabase.getUsage() });
  } catch {
    sendError(response, 500, "Unable to load assistant usage.");
  }
}
