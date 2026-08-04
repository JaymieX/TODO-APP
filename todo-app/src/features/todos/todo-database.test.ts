import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { TodoDatabase } from "./todo-database";

describe("TodoDatabase", () => {
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
});
