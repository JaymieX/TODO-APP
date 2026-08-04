import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({ getAuth: vi.fn() }));
const databaseMocks = vi.hoisted(() => ({
  createTodoWithRecord: vi.fn(),
  listTodos: vi.fn(),
  removeTodoWithRecord: vi.fn(),
  updateTodoWithRecord: vi.fn(),
}));
const sessionMocks = vi.hoisted(() => ({ getAuthenticatedTodoDatabase: vi.fn() }));
const langchainMocks = vi.hoisted(() => ({
  createModel: vi.fn(),
  invoke: vi.fn(),
  withStructuredOutput: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ getAuth: authMocks.getAuth }));
vi.mock("@langchain/groq", () => ({
  ChatGroq: class ChatGroq {
    constructor(config: unknown) {
      langchainMocks.createModel(config);
    }

    withStructuredOutput(schema: unknown, config: unknown) {
      langchainMocks.withStructuredOutput(schema, config);
      return { invoke: langchainMocks.invoke };
    }
  },
}));
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
    databaseMocks.listTodos.mockResolvedValue([]);
    vi.stubEnv("GROQ_SECRET_KEY", "test-secret");
    vi.stubEnv("GROQ_CHAT_URL", "https://groq.test/openai/v1/chat/completions");
    vi.stubEnv("GROQ_MODEL", "test-model");
    vi.stubEnv("GROQ_MAX_MESSAGE_LENGTH", "4000");
    vi.stubEnv("GROQ_SYSTEM_PROMPT", "First line.\nSecond line.");
    vi.stubEnv("SHOW_STRUCTURED_TASK_DEBUG_OUTPUT", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses structured Groq output to create and return a task", async () => {
    const groqTask = {
      operation: "add",
      task_id: null,
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
    langchainMocks.invoke.mockResolvedValue(groqTask);
    databaseMocks.createTodoWithRecord.mockResolvedValue({ record: structuredTask, todo });
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: " Help me plan " } }), response);

    expect(langchainMocks.createModel).toHaveBeenCalledWith({
      apiKey: "test-secret",
      baseUrl: "https://groq.test",
      model: "test-model",
      maxRetries: 2,
    });
    expect(langchainMocks.withStructuredOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.not.objectContaining({ created_at: expect.anything(), user_id: expect.anything() }),
      }),
      { name: "todo_task", method: "jsonSchema", strict: true },
    );
    const messages = langchainMocks.invoke.mock.calls[0][0];
    expect(messages[0]).toEqual({
      role: "system",
      content: "First line.\nSecond line.",
    });
    expect(messages[1].content).toMatch(/^Current UTC timestamp:/);
    expect(messages[1].content).not.toContain("user_test123");
    expect(messages[2]).toEqual({ role: "system", content: "Current tasks:\n[]" });
    expect(messages.at(-1)).toEqual({ role: "user", content: "Help me plan" });
    expect(databaseMocks.createTodoWithRecord).toHaveBeenCalledWith({
      title: "Buy groceries",
      estimatedTime: 30,
      dueDate: "2026-08-05",
    });
    expect(state.status).toBe(201);
    expect(state.body).toEqual({
      data: { message: "Task was added.", operation: "add", structuredTask, todo },
    });
  });

  it("uses an existing task id to modify the current user's task", async () => {
    const existingTodo = {
      id: "task-1",
      title: "Buy groceries",
      completed: false,
      estimatedTime: 30,
      dueDate: "2026-08-05",
    };
    const modifiedTodo = { ...existingTodo, completed: true };
    const structuredTask = {
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Buy groceries",
      task_complete: true,
      estimated_time: 30,
      due_date: "2026-08-05T12:00:00.000Z",
      user_id: "user_test123",
    };
    databaseMocks.listTodos.mockResolvedValue([existingTodo]);
    langchainMocks.invoke.mockResolvedValue({
      operation: "modify",
      task_id: "task-1",
      task_name: "Buy groceries",
      task_complete: true,
      estimated_time: 30,
      due_date: "2026-08-05T12:00:00.000Z",
    });
    databaseMocks.updateTodoWithRecord.mockResolvedValue({
      record: structuredTask,
      todo: modifiedTodo,
    });
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: "Mark groceries complete" } }), response);

    expect(databaseMocks.listTodos).toHaveBeenCalledOnce();
    expect(langchainMocks.invoke.mock.calls[0][0][2].content).toContain('"id":"task-1"');
    expect(databaseMocks.updateTodoWithRecord).toHaveBeenCalledWith("task-1", {
      title: "Buy groceries",
      completed: true,
      estimatedTime: 30,
      dueDate: "2026-08-05",
    });
    expect(databaseMocks.createTodoWithRecord).not.toHaveBeenCalled();
    expect(state.status).toBe(200);
    expect(state.body).toEqual({
      data: {
        message: "Task was modified.",
        operation: "modify",
        structuredTask,
        todo: modifiedTodo,
      },
    });
  });

  it("uses an existing task id to delete the current user's task", async () => {
    vi.stubEnv("SHOW_STRUCTURED_TASK_DEBUG_OUTPUT", "false");
    const existingTodo = {
      id: "task-1",
      title: "Buy groceries",
      completed: false,
      estimatedTime: 30,
      dueDate: "2026-08-05",
    };
    const structuredTask = {
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Buy groceries",
      task_complete: false,
      estimated_time: 30,
      due_date: "2026-08-05T12:00:00.000Z",
      user_id: "user_test123",
    };
    databaseMocks.listTodos.mockResolvedValue([existingTodo]);
    langchainMocks.invoke.mockResolvedValue({
      operation: "delete",
      task_id: "task-1",
      task_name: "Buy groceries",
      task_complete: false,
      estimated_time: 30,
      due_date: "2026-08-05T12:00:00.000Z",
    });
    databaseMocks.removeTodoWithRecord.mockResolvedValue({
      record: structuredTask,
      todo: existingTodo,
    });
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: "Delete groceries" } }), response);

    expect(databaseMocks.removeTodoWithRecord).toHaveBeenCalledWith("task-1");
    expect(databaseMocks.createTodoWithRecord).not.toHaveBeenCalled();
    expect(databaseMocks.updateTodoWithRecord).not.toHaveBeenCalled();
    expect(state.status).toBe(200);
    expect(state.body).toEqual({
      data: {
        message: "Task was deleted.",
        operation: "delete",
        todo: existingTodo,
      },
    });
  });

  it("returns a fixed refusal without changing tasks for an unrelated prompt", async () => {
    langchainMocks.invoke.mockResolvedValue({
      operation: "refusal",
      task_id: null,
      task_name: null,
      task_complete: null,
      estimated_time: null,
      due_date: null,
    });
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: "What is the capital of France?" } }), response);

    expect(state.status).toBe(200);
    expect(state.body).toEqual({
      data: { message: "I can't help with that.", operation: "refusal" },
    });
    expect(databaseMocks.createTodoWithRecord).not.toHaveBeenCalled();
    expect(databaseMocks.updateTodoWithRecord).not.toHaveBeenCalled();
    expect(databaseMocks.removeTodoWithRecord).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated and invalid requests before calling Groq", async () => {
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
    expect(langchainMocks.createModel).not.toHaveBeenCalled();
  });

  it("returns a safe error when Groq is unavailable", async () => {
    langchainMocks.invoke.mockRejectedValue(new Error("network down"));
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: "Help" } }), response);

    expect(state.status).toBe(502);
    expect(state.body).toEqual({ error: { message: "Unable to reach Groq right now." } });
  });

  it("rejects missing or invalid server configuration", async () => {
    vi.stubEnv("GROQ_MAX_MESSAGE_LENGTH", "not-a-number");
    const { response, state } = createResponse();

    await handler(createRequest({ body: { message: "Help" } }), response);

    expect(state.status).toBe(503);
    expect(state.body).toEqual({
      error: { message: "The assistant configuration is missing or invalid." },
    });
    expect(langchainMocks.createModel).not.toHaveBeenCalled();
  });
});
