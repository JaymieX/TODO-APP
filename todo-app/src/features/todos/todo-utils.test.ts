import { describe, expect, it } from "vitest";
import {
  filterTodos,
  formatEstimatedTime,
  getProgress,
  getTaskHighlight,
  toLocalDateKey,
} from "./todo-utils";
import type { Todo } from "./types";

const todos: Todo[] = [
  {
    id: "1",
    title: "Active task",
    completed: false,
    estimatedTime: 30,
    dueDate: null,
  },
  {
    id: "2",
    title: "Finished task",
    completed: true,
    estimatedTime: 1445,
    dueDate: "2026-07-18",
  },
];

describe("todo helpers", () => {
  it("filters tasks and calculates progress", () => {
    expect(filterTodos(todos, "active")).toEqual([todos[0]]);
    expect(filterTodos(todos, "completed")).toEqual([todos[1]]);
    expect(getProgress(todos)).toEqual({ total: 2, completed: 1, remaining: 1, percentage: 50 });
  });

  it("formats estimates using days and minutes", () => {
    expect(formatEstimatedTime(0)).toBe("0 min");
    expect(formatEstimatedTime(30)).toBe("30 min");
    expect(formatEstimatedTime(1445)).toBe("1 day 5 min");
  });

  it("uses local calendar fields for date keys", () => {
    expect(toLocalDateKey(new Date(2026, 0, 2, 23, 30))).toBe("2026-01-02");
  });

  it("identifies overdue and over-estimated tasks", () => {
    const task = { ...todos[0], dueDate: "2026-07-18" };

    expect(getTaskHighlight(task, new Date("2026-07-19T00:00:00"))).toBe("overdue");
    expect(
      getTaskHighlight(
        { ...task, estimatedTime: 120 },
        new Date("2026-07-18T23:00:00"),
      ),
    ).toBe("estimate-exceeds-deadline");
    expect(getTaskHighlight({ ...task, completed: true }, new Date("2026-07-19T00:00:00"))).toBeNull();
  });
});
