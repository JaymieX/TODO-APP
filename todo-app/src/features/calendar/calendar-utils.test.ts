import { describe, expect, it } from "vitest";
import type { Todo } from "@/features/todos/types";
import { getMonthDays, getTodoStatus } from "./calendar-utils";

const todo: Todo = {
  id: "1",
  title: "Calendar task",
  completed: false,
  estimatedTime: 30,
  dueDate: "2026-07-18",
};

describe("calendar helpers", () => {
  it("builds complete local-time weeks around a month", () => {
    const days = getMonthDays(new Date(2026, 6, 18));

    expect(days).toHaveLength(35);
    expect(days[0].dateKey).toBe("2026-06-28");
    expect(days.at(-1)?.dateKey).toBe("2026-08-01");
    expect(days.filter((day) => day.isCurrentMonth)).toHaveLength(31);
  });

  it("prioritizes completion and otherwise compares the deadline", () => {
    expect(getTodoStatus({ ...todo, completed: true }, new Date("2026-07-19T12:00:00"))).toBe("done");
    expect(getTodoStatus(todo, new Date("2026-07-19T12:00:00"))).toBe("overdue");
    expect(getTodoStatus(todo, new Date("2026-07-18T12:00:00"))).toBe("active");
  });
});
