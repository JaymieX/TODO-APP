import { describe, expect, it } from "vitest";
import { validateTodoCreateInput, validateTodoUpdateInput } from "./todo-validation";

describe("todo validation", () => {
  it("accepts and normalizes complete task data", () => {
    expect(
      validateTodoCreateInput({
        title: "  Write project notes  ",
        estimatedTime: 45,
        dueDate: "2026-08-15",
      }),
    ).toEqual({
      data: { title: "Write project notes", estimatedTime: 45, dueDate: "2026-08-15" },
      errors: null,
    });
  });

  it("reports every missing or invalid create field", () => {
    expect(validateTodoCreateInput({ title: " ", estimatedTime: 0, dueDate: "2026-02-31" })).toEqual({
      data: null,
      errors: {
        title: "Enter a task name.",
        estimatedTime: "Enter an estimate of at least 1 minute.",
        dueDate: "Choose a due date.",
      },
    });
  });

  it("accepts a due-date removal but rejects malformed updates", () => {
    expect(validateTodoUpdateInput({ dueDate: null })).toEqual({ data: { dueDate: null }, errors: null });
    expect(validateTodoUpdateInput({ unexpected: true })).toEqual({
      data: null,
      errors: { form: "Task data contains an unsupported field." },
    });
  });
});
