import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TodoAssistant } from "./TodoAssistant";

const todoMocks = vi.hoisted(() => ({ addCreatedTodo: vi.fn() }));

vi.mock("@/features/todos/todo-context", () => ({
  useTodos: () => ({ addCreatedTodo: todoMocks.addCreatedTodo }),
}));

describe("TodoAssistant", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("adds the task to local state and displays the database record", async () => {
    const user = userEvent.setup();
    const structuredTask = {
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Buy groceries",
      task_complete: false,
      estimated_time: 30,
      due_date: "2026-08-05T12:00:00.000Z",
      user_id: "user_test123",
    };
    const todo = {
      id: "task-1",
      title: "Buy groceries",
      completed: false,
      estimatedTime: 30,
      dueDate: "2026-08-05",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { message: "Task was added.", structuredTask, todo } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<TodoAssistant />);
    await user.type(screen.getByLabelText("Message the todo assistant"), "Help me start");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/assistant", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ message: "Help me start" }),
    }));
    expect(await screen.findByText("Task was added.")).toBeInTheDocument();
    expect(screen.getByText(/"task_name": "Buy groceries"/)).toBeInTheDocument();
    expect(todoMocks.addCreatedTodo).toHaveBeenCalledWith(todo);
    expect(screen.getByLabelText("Message the todo assistant")).toHaveValue("");
  });

  it("displays an API error and keeps the user's message", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Groq is unavailable." } }),
    }));

    render(<TodoAssistant />);
    const input = screen.getByLabelText("Message the todo assistant");
    await user.type(input, "Help me plan");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Groq is unavailable.");
    expect(input).toHaveValue("Help me plan");
  });
});
