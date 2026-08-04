import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { RateLimitDatabase } from "./rate-limit-database";

const USER_ID = "user_clerk123";
const NOW = new Date("2026-08-04T13:30:00.000Z");

function createReadQuery(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  return { eq, select };
}

describe("RateLimitDatabase", () => {
  it("returns usage for the current user without changing the window", async () => {
    const read = createReadQuery({
      request_count: 12,
      first_request: "2026-08-04T10:00:00.000Z",
      last_request: "2026-08-04T13:00:00.000Z",
    });
    const from = vi.fn().mockReturnValue({ select: read.select });
    const database = new RateLimitDatabase(
      { from } as unknown as SupabaseClient,
      USER_ID,
    );

    const result = await database.getUsage(NOW);

    expect(read.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(result).toEqual({
      used: 12,
      limit: 30,
      remaining: 18,
      resetAt: "2026-08-05T10:00:00.000Z",
      lastRequestAt: "2026-08-04T13:00:00.000Z",
    });
  });

  it("reports a fresh allowance when the stored window has expired", async () => {
    const read = createReadQuery({
      request_count: 30,
      first_request: "2026-08-03T13:30:00.000Z",
      last_request: "2026-08-03T18:00:00.000Z",
    });
    const from = vi.fn().mockReturnValue({ select: read.select });
    const database = new RateLimitDatabase(
      { from } as unknown as SupabaseClient,
      USER_ID,
    );

    await expect(database.getUsage(NOW)).resolves.toEqual({
      used: 0,
      limit: 30,
      remaining: 30,
      resetAt: null,
      lastRequestAt: null,
    });
  });

  it("creates a user window with the first request already consumed", async () => {
    const read = createReadQuery(null);
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn()
      .mockReturnValueOnce({ select: read.select })
      .mockReturnValueOnce({ insert });
    const database = new RateLimitDatabase(
      { from } as unknown as SupabaseClient,
      USER_ID,
    );

    const result = await database.consumeRequest(NOW);

    expect(read.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      request_count: 1,
      first_request: NOW.toISOString(),
      last_request: NOW.toISOString(),
    });
    expect(result).toEqual({
      allowed: true,
      remaining: 29,
      resetAt: "2026-08-05T13:30:00.000Z",
    });
  });

  it("increments the count and preserves the start of an active window", async () => {
    const read = createReadQuery({
      request_count: 8,
      first_request: "2026-08-04T10:00:00.000Z",
      last_request: "2026-08-04T12:00:00.000Z",
    });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const from = vi.fn()
      .mockReturnValueOnce({ select: read.select })
      .mockReturnValueOnce({ update });
    const database = new RateLimitDatabase(
      { from } as unknown as SupabaseClient,
      USER_ID,
    );

    const result = await database.consumeRequest(NOW);

    expect(update).toHaveBeenCalledWith({
      request_count: 9,
      last_request: NOW.toISOString(),
    });
    expect(updateEq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(result).toEqual({
      allowed: true,
      remaining: 21,
      resetAt: "2026-08-05T10:00:00.000Z",
    });
  });

  it("rejects request 31 without changing the stored window", async () => {
    const read = createReadQuery({
      request_count: 30,
      first_request: "2026-08-04T10:00:00.000Z",
      last_request: "2026-08-04T13:00:00.000Z",
    });
    const from = vi.fn().mockReturnValue({ select: read.select });
    const database = new RateLimitDatabase(
      { from } as unknown as SupabaseClient,
      USER_ID,
    );

    const result = await database.consumeRequest(NOW);

    expect(from).toHaveBeenCalledOnce();
    expect(result).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: "2026-08-05T10:00:00.000Z",
    });
  });

  it("starts a new window at one request after 24 hours", async () => {
    const read = createReadQuery({
      request_count: 30,
      first_request: "2026-08-03T13:30:00.000Z",
      last_request: "2026-08-03T18:00:00.000Z",
    });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const from = vi.fn()
      .mockReturnValueOnce({ select: read.select })
      .mockReturnValueOnce({ update });
    const database = new RateLimitDatabase(
      { from } as unknown as SupabaseClient,
      USER_ID,
    );

    const result = await database.consumeRequest(NOW);

    expect(update).toHaveBeenCalledWith({
      request_count: 1,
      first_request: NOW.toISOString(),
      last_request: NOW.toISOString(),
    });
    expect(result).toEqual({
      allowed: true,
      remaining: 29,
      resetAt: "2026-08-05T13:30:00.000Z",
    });
  });
});
