import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { TodoDatabase } from "./todo-database";

describe("TodoDatabase", () => {
  it("stores the authenticated Clerk user id on new tasks", async () => {
    const row = {
      id: "task-1",
      task_name: "Read",
      task_complete: false,
      estimated_time: 15,
      due_date: "2026-08-15T12:00:00.000Z",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const database = new TodoDatabase(
      { from } as unknown as SupabaseClient,
      "user_clerk123",
    );

    await database.createTodo({
      title: "Read",
      estimatedTime: 15,
      dueDate: "2026-08-15",
    });

    expect(insert).toHaveBeenCalledWith({
      task_name: "Read",
      task_complete: false,
      estimated_time: 15,
      due_date: "2026-08-15T12:00:00.000Z",
      user_id: "user_clerk123",
    });
  });
});
