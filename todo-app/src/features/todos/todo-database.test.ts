import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { TodoDatabase } from "./todo-database";

describe("TodoDatabase", () => {
  it("lists only tasks belonging to the authenticated Clerk user", async () => {
    const row = {
      id: "task-1",
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Read",
      task_complete: false,
      estimated_time: 15,
      due_date: "2026-08-15T12:00:00.000Z",
      user_id: "user_clerk123",
    };
    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const database = new TodoDatabase(
      { from } as unknown as SupabaseClient,
      "user_clerk123",
    );

    const tasks = await database.listTodos();

    expect(eq).toHaveBeenCalledWith("user_id", "user_clerk123");
    expect(tasks).toEqual([{
      id: "task-1",
      title: "Read",
      completed: false,
      estimatedTime: 15,
      dueDate: "2026-08-15",
    }]);
  });

  it("stores the authenticated Clerk user id on new tasks", async () => {
    const row = {
      id: "task-1",
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Read",
      task_complete: false,
      estimated_time: 15,
      due_date: "2026-08-15T12:00:00.000Z",
      user_id: "user_clerk123",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const database = new TodoDatabase(
      { from } as unknown as SupabaseClient,
      "user_clerk123",
    );

    const created = await database.createTodoWithRecord({
      title: "Read",
      estimatedTime: 15,
      dueDate: "2026-08-15",
    });

    expect(insert).toHaveBeenCalledWith({
      created_at: expect.any(String),
      task_name: "Read",
      task_complete: false,
      estimated_time: 15,
      due_date: "2026-08-15T12:00:00.000Z",
      user_id: "user_clerk123",
    });
    expect(select).toHaveBeenCalledWith(
      "id, task_name, task_complete, estimated_time, due_date, created_at, user_id",
    );
    expect(created.record).toEqual({
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Read",
      task_complete: false,
      estimated_time: 15,
      due_date: "2026-08-15T12:00:00.000Z",
      user_id: "user_clerk123",
    });
  });

  it("updates a task only when it belongs to the authenticated Clerk user", async () => {
    const row = {
      id: "task-1",
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Read the docs",
      task_complete: true,
      estimated_time: 15,
      due_date: "2026-08-15T12:00:00.000Z",
      user_id: "user_clerk123",
    };
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn();
    eq.mockReturnValueOnce({ eq }).mockReturnValueOnce({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const database = new TodoDatabase(
      { from } as unknown as SupabaseClient,
      "user_clerk123",
    );

    await database.updateTodoWithRecord("task-1", { completed: true });

    expect(eq).toHaveBeenNthCalledWith(1, "id", "task-1");
    expect(eq).toHaveBeenNthCalledWith(2, "user_id", "user_clerk123");
  });

  it("deletes a task only when it belongs to the authenticated Clerk user", async () => {
    const row = {
      id: "task-1",
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Read",
      task_complete: false,
      estimated_time: 15,
      due_date: "2026-08-15T12:00:00.000Z",
      user_id: "user_clerk123",
    };
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn();
    eq.mockReturnValueOnce({ eq }).mockReturnValueOnce({ select });
    const remove = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: remove });
    const database = new TodoDatabase(
      { from } as unknown as SupabaseClient,
      "user_clerk123",
    );

    await database.removeTodoWithRecord("task-1");

    expect(eq).toHaveBeenNthCalledWith(1, "id", "task-1");
    expect(eq).toHaveBeenNthCalledWith(2, "user_id", "user_clerk123");
  });
});
