import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({
  clearCompleted: vi.fn(),
  createTodo: vi.fn(),
  listTodos: vi.fn(),
  removeTodo: vi.fn(),
  updateTodo: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getAuthenticatedTodoDatabase: vi.fn(),
}));

vi.mock("@/features/todos/todo-database", () => ({
  TodoDatabaseError: class TodoDatabaseError extends Error {},
}));

vi.mock("@/features/todos/todo-database-session", () => ({
  getAuthenticatedTodoDatabase: authMocks.getAuthenticatedTodoDatabase,
}));

import todoByIdHandler from "@/pages/api/todos/[id]";
import todoHandler from "@/pages/api/todos";

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
    end: vi.fn(),
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

describe("todo API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getAuthenticatedTodoDatabase.mockReturnValue(databaseMocks);
  });

  it("rejects requests without a Clerk session", async () => {
    authMocks.getAuthenticatedTodoDatabase.mockReturnValue(null);
    const { response, state } = createResponse();

    await todoHandler(createRequest({ method: "GET" }), response);

    expect(state.status).toBe(401);
    expect(state.body).toEqual({ error: { message: "Sign in to access tasks." } });
    expect(databaseMocks.listTodos).not.toHaveBeenCalled();
  });

  it("returns tasks with HTTP 200", async () => {
    databaseMocks.listTodos.mockResolvedValue([{ id: "1", title: "Read", completed: false, estimatedTime: 15, dueDate: "2026-08-15" }]);
    const { response, state } = createResponse();

    await todoHandler(createRequest({ method: "GET" }), response);

    expect(state.status).toBe(200);
    expect(state.body).toEqual({ data: [{ id: "1", title: "Read", completed: false, estimatedTime: 15, dueDate: "2026-08-15" }] });
  });

  it("validates creates before calling the database and returns HTTP 422", async () => {
    const { response, state } = createResponse();

    await todoHandler(createRequest({ method: "POST", body: { title: "", estimatedTime: 0, dueDate: "" } }), response);

    expect(state.status).toBe(422);
    expect(state.body).toEqual(expect.objectContaining({ error: expect.objectContaining({ message: "Task data is invalid." }) }));
    expect(databaseMocks.createTodo).not.toHaveBeenCalled();
  });

  it("creates a validated task with HTTP 201", async () => {
    const task = { id: "1", title: "Read", completed: false, estimatedTime: 15, dueDate: "2026-08-15" };
    databaseMocks.createTodo.mockResolvedValue(task);
    const { response, state } = createResponse();

    await todoHandler(createRequest({ method: "POST", body: { title: " Read ", estimatedTime: 15, dueDate: "2026-08-15" } }), response);

    expect(state.status).toBe(201);
    expect(databaseMocks.createTodo).toHaveBeenCalledWith({ title: "Read", estimatedTime: 15, dueDate: "2026-08-15" });
    expect(state.body).toEqual({ data: task });
  });

  it("uses HTTP 400 for an invalid id and 405 for an unsupported method", async () => {
    const invalidId = createResponse();
    await todoByIdHandler(createRequest({ method: "DELETE", query: { id: ["1", "2"] } }), invalidId.response);
    expect(invalidId.state.status).toBe(400);

    const method = createResponse();
    await todoHandler(createRequest({ method: "PUT" }), method.response);
    expect(method.state.status).toBe(405);
    expect(method.response.setHeader).toHaveBeenCalledWith("Allow", "GET, POST, DELETE");
  });
});
