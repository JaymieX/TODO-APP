import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({ getAuth: vi.fn() }));
const databaseMocks = vi.hoisted(() => ({ createTodoWithRecord: vi.fn() }));
const sessionMocks = vi.hoisted(() => ({ getAuthenticatedTodoDatabase: vi.fn() }));

vi.mock("@clerk/nextjs/server", () => ({ getAuth: authMocks.getAuth }));
vi.mock("@/features/todos/todo-database-session", () => ({
  getAuthenticatedTodoDatabase: sessionMocks.getAuthenticatedTodoDatabase,
}));

import handler from "@/pages/api/assistant";

function createRequest(values: Partial<NextApiRequest>) {
  return { body: undefined, method: "POST", query: {}, ...values } as NextApiRequest;
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

describe("assistant API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test123" });
    sessionMocks.getAuthenticatedTodoDatabase.mockReturnValue(databaseMocks);
    vi.stubEnv("GROQ_SECRET_KEY", "test-secret");
    vi.stubEnv("GROQ_CHAT_URL", "https://groq.test/chat/completions");
    vi.stubEnv("GROQ_MODEL", "test-model");
    vi.stubEnv("GROQ_MAX_MESSAGE_LENGTH", "4000");
    vi.stubEnv("GROQ_SYSTEM_PROMPT", "First line.\nSecond line.");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses structured Groq output to create and return a task", async () => {
    const groqTask = {
      task_name: "Buy groceries",
      task_complete: false,
      estimated_time: 30,
      due_date: "2026-08-05T12:00:00.000Z",
    };
    const structuredTask = {
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Buy groceries",
      task_complete: false,
      estimated_time: 30,
      due_date: "2026-08-05T12:00:00.000Z",
      user_id: "user_test123",
    };
    const todo = {
      id: "task-1",
      title: "Buy groceries",
      completed: false,
      estimatedTime: 30,
      dueDate: "2026-08-05",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(groqTask) } }] }),
    });
    databaseMocks.createTodoWithRecord.mockResolvedValue({ record: structuredTask, todo });
    vi.stubGlobal("fetch", fetchMock);
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: " Help me plan " } }), response);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://groq.test/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-secret" }),
      }),
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.model).toBe("test-model");
    expect(requestBody.messages[0]).toEqual({
      role: "system",
      content: "First line.\nSecond line.",
    });
    expect(requestBody.messages[1].content).toMatch(/^Current UTC timestamp:/);
    expect(requestBody.messages[1].content).not.toContain("user_test123");
    expect(requestBody.messages.at(-1)).toEqual({ role: "user", content: "Help me plan" });
    expect(requestBody.response_format).toEqual(expect.objectContaining({
      type: "json_schema",
      json_schema: expect.objectContaining({ strict: true }),
    }));
    const properties = requestBody.response_format.json_schema.schema.properties;
    expect(properties).not.toHaveProperty("created_at");
    expect(properties).not.toHaveProperty("user_id");
    expect(databaseMocks.createTodoWithRecord).toHaveBeenCalledWith({
      title: "Buy groceries",
      estimatedTime: 30,
      dueDate: "2026-08-05",
    });
    expect(state.status).toBe(201);
    expect(state.body).toEqual({
      data: { message: "Task was added.", structuredTask, todo },
    });
  });

  it("rejects unauthenticated and invalid requests before calling Groq", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    authMocks.getAuth.mockReturnValue({ isAuthenticated: false, userId: null });
    sessionMocks.getAuthenticatedTodoDatabase.mockReturnValue(null);
    const unauthorized = createResponse();
    await handler(createRequest({ body: { message: "Hello" } }), unauthorized.response);
    expect(unauthorized.state.status).toBe(401);

    authMocks.getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test123" });
    sessionMocks.getAuthenticatedTodoDatabase.mockReturnValue(databaseMocks);
    const invalid = createResponse();
    await handler(createRequest({ body: { message: "   " } }), invalid.response);
    expect(invalid.state.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a safe error when Groq is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: "Help" } }), response);

    expect(state.status).toBe(502);
    expect(state.body).toEqual({ error: { message: "Unable to reach Groq right now." } });
  });

  it("rejects missing or invalid server configuration", async () => {
    vi.stubEnv("GROQ_MAX_MESSAGE_LENGTH", "not-a-number");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: "Help" } }), response);

    expect(state.status).toBe(503);
    expect(state.body).toEqual({
      error: { message: "The assistant configuration is missing or invalid." },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
