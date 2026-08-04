import { describe, expect, it, vi } from "vitest";
import { createListTasksTool } from "./list-tasks-tool";

describe("list_tasks tool", () => {
  it("returns the current user's tasks as an array", async () => {
    const tasks = [
      {
        id: "task-1",
        title: "Buy groceries",
        completed: false,
        estimatedTime: 30,
        dueDate: "2026-08-05",
      },
    ];
    const listTodos = vi.fn().mockResolvedValue(tasks);
    const listTasks = createListTasksTool({ listTodos });

    const result = await listTasks.invoke({});

    expect(listTasks.name).toBe("list_tasks");
    expect(listTodos).toHaveBeenCalledOnce();
    expect(result).toEqual(tasks);
    expect(Array.isArray(result)).toBe(true);
  });
});
