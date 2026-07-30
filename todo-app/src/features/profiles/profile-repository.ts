import { isThemeId, type ThemeId } from "@/features/themes/themes";

type ProfileResponse = {
  data?: {
    theme?: unknown;
  };
  error?: {
    message?: string;
  };
};

async function readResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as ProfileResponse | null;

  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Profile request failed (${response.status}).`);
  }

  return body;
}

export class ProfileRepository {
  async getTheme() {
    const response = await fetch("/api/profile");
    const body = await readResponse(response);
    const theme = body?.data?.theme;
    return typeof theme === "string" && isThemeId(theme) ? theme : null;
  }

  async saveTheme(theme: ThemeId) {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });
    await readResponse(response);
  }
}

export const profileRepository = new ProfileRepository();
