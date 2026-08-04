import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({ getUsage: vi.fn() }));
const sessionMocks = vi.hoisted(() => ({ getAuthenticatedRateLimitDatabase: vi.fn() }));

vi.mock("@/features/rate-limit/rate-limit-database-session", () => ({
  getAuthenticatedRateLimitDatabase: sessionMocks.getAuthenticatedRateLimitDatabase,
}));

import handler from "@/pages/api/usage";

function createResponse() {
  const state: { body: unknown; status: number } = { body: undefined, status: 200 };
  const response = {
    json: vi.fn((body: unknown) => {
      state.body = body;
      return response;
    }),
    setHeader: vi.fn(),
    status: vi.fn((status: number) => {
      state.status = status;
      return response;
    }),
  };
  return { response: response as unknown as NextApiResponse, state };
}

describe("usage API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMocks.getAuthenticatedRateLimitDatabase.mockReturnValue(databaseMocks);
  });

  it("returns the authenticated user's assistant usage", async () => {
    const usage = {
      used: 12,
      limit: 30,
      remaining: 18,
      resetAt: "2026-08-05T10:00:00.000Z",
      lastRequestAt: "2026-08-04T13:00:00.000Z",
    };
    databaseMocks.getUsage.mockResolvedValue(usage);
    const { response, state } = createResponse();

    await handler({ method: "GET" } as NextApiRequest, response);

    expect(state.status).toBe(200);
    expect(state.body).toEqual({ data: usage });
  });

  it("rejects unauthenticated and unsupported requests", async () => {
    sessionMocks.getAuthenticatedRateLimitDatabase.mockReturnValue(null);
    const unauthorized = createResponse();
    await handler({ method: "GET" } as NextApiRequest, unauthorized.response);
    expect(unauthorized.state.status).toBe(401);

    const unsupported = createResponse();
    await handler({ method: "POST" } as NextApiRequest, unsupported.response);
    expect(unsupported.state.status).toBe(405);
    expect(unsupported.response.setHeader).toHaveBeenCalledWith("Allow", "GET");
  });

  it("returns a safe error when usage cannot be loaded", async () => {
    databaseMocks.getUsage.mockRejectedValue(new Error("database down"));
    const { response, state } = createResponse();

    await handler({ method: "GET" } as NextApiRequest, response);

    expect(state.status).toBe(500);
    expect(state.body).toEqual({ error: { message: "Unable to load assistant usage." } });
  });
});
