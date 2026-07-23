import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Todo } from "./types";

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  getClient: vi.fn(),
}));

vi.mock("@/features/supabase/supabase-client", () => ({
  supabase: { getClient: supabaseMocks.getClient },
}));

import { TodoRepository } from "./todo-repository";

const databaseTodo = {
  id: "5c0a3c6d-1e16-4a05-8e2c-2746d312f8a9",
  task_name: "Write project notes",
  task_complete: false,
  estimated_time: "45",
  due_date: "2026-08-15T12:00:00+00:00",
};

const todo: Todo = {
  id: databaseTodo.id,
  title: databaseTodo.task_name,
  completed: false,
  estimatedTime: 45,
  dueDate: "2026-08-15",
};

describe("TodoRepository", () => {
  beforeEach(() => {
    supabaseMocks.from.mockReset();
    supabaseMocks.getClient.mockReset();
    supabaseMocks.getClient.mockReturnValue({ from: supabaseMocks.from });
  });

  it("loads and maps tasks from the todo table", async () => {
    const order = vi.fn().mockResolvedValue({ data: [databaseTodo], error: null });
    const select = vi.fn().mockReturnValue({ order });
    supabaseMocks.from.mockReturnValue({ select });

    await expect(new TodoRepository().listTodos()).resolves.toEqual([todo]);
    expect(supabaseMocks.from).toHaveBeenCalledWith("todo");
    expect(order).toHaveBeenCalledWith("due_date", { ascending: true, nullsFirst: false });
  });

  it("inserts a task and returns the generated database id", async () => {
    const single = vi.fn().mockResolvedValue({ data: databaseTodo, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    supabaseMocks.from.mockReturnValue({ insert });

    await expect(new TodoRepository().createTodo({ title: todo.title, estimatedTime: 45, dueDate: todo.dueDate })).resolves.toEqual(todo);
    expect(insert).toHaveBeenCalledWith({
      task_name: "Write project notes",
      task_complete: false,
      estimated_time: 45,
      due_date: "2026-08-15T12:00:00.000Z",
    });
  });

  it("updates and removes a task by its generated id", async () => {
    const single = vi.fn().mockResolvedValue({ data: { ...databaseTodo, task_complete: true }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const updateEquals = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq: updateEquals });
    const deleteEquals = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockReturnValue({ eq: deleteEquals });

    supabaseMocks.from
      .mockReturnValueOnce({ update })
      .mockReturnValueOnce({ delete: remove });

    await expect(new TodoRepository().updateTodo(todo, { completed: true })).resolves.toEqual({ ...todo, completed: true });
    await expect(new TodoRepository().removeTodo(todo.id)).resolves.toBeUndefined();
    expect(updateEquals).toHaveBeenCalledWith("id", todo.id);
    expect(deleteEquals).toHaveBeenCalledWith("id", todo.id);
  });

  it("removes all completed tasks", async () => {
    const equals = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockReturnValue({ eq: equals });
    supabaseMocks.from.mockReturnValue({ delete: remove });

    await expect(new TodoRepository().clearCompleted()).resolves.toBeUndefined();
    expect(equals).toHaveBeenCalledWith("task_complete", true);
  });
});
