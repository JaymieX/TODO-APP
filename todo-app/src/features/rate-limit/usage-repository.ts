import type { RateLimitUsage } from "./rate-limit-database";

type UsageResponse = {
  data?: RateLimitUsage;
  error?: { message?: string };
};

export class UsageRepository {
  async getUsage() {
    const response = await fetch("/api/usage");
    const body = (await response.json().catch(() => null)) as UsageResponse | null;

    if (!response.ok || !body?.data) {
      throw new Error(body?.error?.message ?? `Usage request failed (${response.status}).`);
    }

    return body.data;
  }
}

export const usageRepository = new UsageRepository();
