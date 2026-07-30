import { afterEach, describe, expect, it, vi } from "vitest";
import { TodoRepository } from "./todo-repository";

describe("TodoRepository", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows the API's error message for a rejected request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Task data is invalid." } }), { status: 422 }),
    ));

    await expect(new TodoRepository().createTodo({ title: "", estimatedTime: 0, dueDate: "2026-08-15" }))
      .rejects.toThrow("Task data is invalid.");
  });

  it("accepts a no-content response after deletion", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(new TodoRepository().removeTodo("task-1")).resolves.toBeUndefined();
  });
});
