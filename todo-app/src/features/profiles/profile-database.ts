import type { SupabaseClient } from "@supabase/supabase-js";
import type { ThemeId } from "@/features/themes/themes";

type ProfileRow = {
  theme: string;
};

export class ProfileDatabaseError extends Error {}

function throwDatabaseError(error: { message: string }) {
  throw new ProfileDatabaseError(error.message);
}

export class ProfileDatabase {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async getTheme() {
    const { data, error } = await this.client
      .from("profiles")
      .select("theme")
      .eq("user_id", this.userId)
      .maybeSingle();

    if (error) throwDatabaseError(error);
    return (data as ProfileRow | null)?.theme ?? null;
  }

  async saveTheme(theme: ThemeId) {
    const { error } = await this.client
      .from("profiles")
      .upsert(
        { user_id: this.userId, theme },
        { onConflict: "user_id" },
      );

    if (error) throwDatabaseError(error);
  }
}
