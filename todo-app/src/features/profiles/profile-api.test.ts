import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const profileMocks = vi.hoisted(() => ({
  getTheme: vi.fn(),
  saveTheme: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({
  getAuthenticatedProfileDatabase: vi.fn(),
}));

vi.mock("@/features/profiles/profile-database", () => ({
  ProfileDatabaseError: class ProfileDatabaseError extends Error {},
}));

vi.mock("@/features/profiles/profile-database-session", () => ({
  getAuthenticatedProfileDatabase: sessionMocks.getAuthenticatedProfileDatabase,
}));

import handler from "@/pages/api/profile";

function createRequest(values: Partial<NextApiRequest>) {
  return {
    body: undefined,
    method: "GET",
    query: {},
    ...values,
  } as NextApiRequest;
}

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

describe("profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMocks.getAuthenticatedProfileDatabase.mockReturnValue(profileMocks);
  });

  it("returns the saved theme", async () => {
    profileMocks.getTheme.mockResolvedValue("jirai-kei");
    const { response, state } = createResponse();

    await handler(createRequest({ method: "GET" }), response);

    expect(state.status).toBe(200);
    expect(state.body).toEqual({ data: { theme: "jirai-kei" } });
  });

  it("validates and saves a theme", async () => {
    const { response, state } = createResponse();

    await handler(createRequest({ method: "PUT", body: { theme: "jirai-kei" } }), response);

    expect(profileMocks.saveTheme).toHaveBeenCalledWith("jirai-kei");
    expect(state.status).toBe(200);
  });

  it("rejects unauthenticated requests and unknown themes", async () => {
    sessionMocks.getAuthenticatedProfileDatabase.mockReturnValue(null);
    const unauthorized = createResponse();
    await handler(createRequest({ method: "GET" }), unauthorized.response);
    expect(unauthorized.state.status).toBe(401);

    sessionMocks.getAuthenticatedProfileDatabase.mockReturnValue(profileMocks);
    const invalid = createResponse();
    await handler(createRequest({ method: "PUT", body: { theme: "unknown" } }), invalid.response);
    expect(invalid.state.status).toBe(422);
    expect(profileMocks.saveTheme).not.toHaveBeenCalled();
  });
});
