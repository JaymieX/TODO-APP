import type { NextApiRequest, NextApiResponse } from "next";
import { ProfileDatabaseError } from "@/features/profiles/profile-database";
import { getAuthenticatedProfileDatabase } from "@/features/profiles/profile-database-session";
import { isThemeId } from "@/features/themes/themes";

type ProfileResponse =
  | { data: { theme: string | null } }
  | { error: { message: string } };

function sendError(response: NextApiResponse<ProfileResponse>, status: number, message: string) {
  response.status(status).json({ error: { message } });
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ProfileResponse>,
) {
  const profileDatabase = getAuthenticatedProfileDatabase(request);
  if (!profileDatabase) {
    sendError(response, 401, "Sign in to access profile settings.");
    return;
  }

  try {
    if (request.method === "GET") {
      response.status(200).json({ data: { theme: await profileDatabase.getTheme() } });
      return;
    }

    if (request.method === "PUT") {
      const theme = request.body?.theme;
      if (typeof theme !== "string" || !isThemeId(theme)) {
        sendError(response, 422, "Theme is invalid.");
        return;
      }

      await profileDatabase.saveTheme(theme);
      response.status(200).json({ data: { theme } });
      return;
    }
  } catch (error) {
    const message = error instanceof ProfileDatabaseError
      ? "Unable to save profile settings."
      : "Unable to complete the profile request.";
    sendError(response, 500, message);
    return;
  }

  response.setHeader("Allow", "GET, PUT");
  sendError(response, 405, "Method not allowed.");
}
