import type { SupabaseClient } from "@supabase/supabase-js";

export const DAILY_REQUEST_LIMIT = 30;
const WINDOW_LENGTH_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_COLUMNS = "request_count, last_request, first_request";

type RateLimitRow = {
  request_count: number | string;
  last_request: string;
  first_request: string;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
};

export type RateLimitUsage = {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string | null;
  lastRequestAt: string | null;
};

export class RateLimitDatabaseError extends Error {}

function throwDatabaseError(error: { message: string }) {
  throw new RateLimitDatabaseError(error.message);
}

function getResetAt(firstRequest: Date) {
  return new Date(firstRequest.getTime() + WINDOW_LENGTH_MS).toISOString();
}

export class RateLimitDatabase {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async getUsage(now = new Date()): Promise<RateLimitUsage> {
    const { data, error } = await this.client
      .from("rate_limit")
      .select(RATE_LIMIT_COLUMNS)
      .eq("user_id", this.userId)
      .maybeSingle();

    if (error) throwDatabaseError(error);
    if (!data) return this.emptyUsage();

    const row = data as RateLimitRow;
    const firstRequest = new Date(row.first_request);
    const lastRequest = new Date(row.last_request);
    const requestCount = Number(row.request_count);
    if (
      Number.isNaN(firstRequest.getTime())
      || Number.isNaN(lastRequest.getTime())
      || !Number.isSafeInteger(requestCount)
      || requestCount < 0
    ) {
      throw new RateLimitDatabaseError("The stored rate limit is invalid.");
    }

    if (now.getTime() - firstRequest.getTime() >= WINDOW_LENGTH_MS) {
      return this.emptyUsage();
    }

    const used = Math.min(requestCount, DAILY_REQUEST_LIMIT);
    return {
      used,
      limit: DAILY_REQUEST_LIMIT,
      remaining: DAILY_REQUEST_LIMIT - used,
      resetAt: getResetAt(firstRequest),
      lastRequestAt: lastRequest.toISOString(),
    };
  }

  async consumeRequest(now = new Date()): Promise<RateLimitResult> {
    const nowIso = now.toISOString();
    const { data, error } = await this.client
      .from("rate_limit")
      .select(RATE_LIMIT_COLUMNS)
      .eq("user_id", this.userId)
      .maybeSingle();

    if (error) throwDatabaseError(error);

    if (!data) {
      const { error: insertError } = await this.client.from("rate_limit").insert({
        user_id: this.userId,
        request_count: 1,
        first_request: nowIso,
        last_request: nowIso,
      });

      if (insertError) throwDatabaseError(insertError);
      return {
        allowed: true,
        remaining: DAILY_REQUEST_LIMIT - 1,
        resetAt: getResetAt(now),
      };
    }

    const row = data as RateLimitRow;
    const firstRequest = new Date(row.first_request);
    const requestCount = Number(row.request_count);
    if (
      Number.isNaN(firstRequest.getTime())
      || !Number.isSafeInteger(requestCount)
      || requestCount < 0
    ) {
      throw new RateLimitDatabaseError("The stored rate limit is invalid.");
    }

    // A request at or after the 24-hour boundary starts a fresh window.
    if (now.getTime() - firstRequest.getTime() >= WINDOW_LENGTH_MS) {
      await this.updateWindow({
        request_count: 1,
        first_request: nowIso,
        last_request: nowIso,
      });
      return {
        allowed: true,
        remaining: DAILY_REQUEST_LIMIT - 1,
        resetAt: getResetAt(now),
      };
    }

    if (requestCount >= DAILY_REQUEST_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: getResetAt(firstRequest),
      };
    }

    await this.updateWindow({
      request_count: requestCount + 1,
      last_request: nowIso,
    });
    return {
      allowed: true,
      remaining: DAILY_REQUEST_LIMIT - requestCount - 1,
      resetAt: getResetAt(firstRequest),
    };
  }

  private async updateWindow(changes: Partial<RateLimitRow>) {
    const { error } = await this.client
      .from("rate_limit")
      .update(changes)
      .eq("user_id", this.userId);

    if (error) throwDatabaseError(error);
  }

  private emptyUsage(): RateLimitUsage {
    return {
      used: 0,
      limit: DAILY_REQUEST_LIMIT,
      remaining: DAILY_REQUEST_LIMIT,
      resetAt: null,
      lastRequestAt: null,
    };
  }
}
