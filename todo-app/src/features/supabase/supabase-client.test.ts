import { describe, expect, it } from "vitest";
import { SupabaseConnection } from "./supabase-client";

describe("SupabaseConnection", () => {
  it("creates one client from the supplied public configuration", () => {
    const connection = new SupabaseConnection({
      url: "https://example.supabase.co",
      publishableKey: "test-publishable-key",
    });

    expect(connection.getClient()).toBe(connection.getClient());
  });

  it("explains which environment variables are missing", () => {
    const connection = new SupabaseConnection({
      url: undefined,
      publishableKey: undefined,
    });

    expect(() => connection.getClient()).toThrow("Missing Supabase configuration");
  });
});
