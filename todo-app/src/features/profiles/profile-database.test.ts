import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { ProfileDatabase } from "./profile-database";

describe("ProfileDatabase", () => {
  it("upserts the theme using the Clerk user id", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    const database = new ProfileDatabase(
      { from } as unknown as SupabaseClient,
      "user_clerk123",
    );

    await database.saveTheme("jirai-kei");

    expect(from).toHaveBeenCalledWith("profiles");
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "user_clerk123", theme: "jirai-kei" },
      { onConflict: "user_id" },
    );
  });
});
