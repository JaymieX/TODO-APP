import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TodoAssistant } from "./TodoAssistant";

const todoMocks = vi.hoisted(() => ({ removeSyncedTodo: vi.fn(), syncTodo: vi.fn() }));

vi.mock("@/features/todos/todo-context", () => ({
  useTodos: () => ({
    removeSyncedTodo: todoMocks.removeSyncedTodo,
    syncTodo: todoMocks.syncTodo,
  }),
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
      json: async () => ({ data: { message: "Task was added.", operation: "add", structuredTask, todo } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<TodoAssistant />);
    await user.type(screen.getByLabelText("Message the todo assistant"), "Help me start");
    await user.click(screen.getByRole("button", { name: "Apply task change" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/assistant", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ message: "Help me start" }),
    }));
    expect(await screen.findByText("Task was added.")).toBeInTheDocument();
    expect(screen.getByText(/"task_name": "Buy groceries"/)).toBeInTheDocument();
    expect(todoMocks.syncTodo).toHaveBeenCalledWith(todo);
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
    await user.click(screen.getByRole("button", { name: "Apply task change" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Groq is unavailable.");
    expect(input).toHaveValue("Help me plan");
  });

  it("removes a deleted task from local state", async () => {
    const user = userEvent.setup();
    const todo = {
      id: "task-1",
      title: "Buy groceries",
      completed: false,
      estimatedTime: 30,
      dueDate: "2026-08-05",
    };
    const structuredTask = {
      created_at: "2026-08-04T13:30:00.000Z",
      task_name: "Buy groceries",
      task_complete: false,
      estimated_time: 30,
      due_date: "2026-08-05T12:00:00.000Z",
      user_id: "user_test123",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: "Task was deleted.", operation: "delete", structuredTask, todo },
      }),
    }));

    render(<TodoAssistant />);
    await user.type(screen.getByLabelText("Message the todo assistant"), "Delete groceries");
    await user.click(screen.getByRole("button", { name: "Apply task change" }));

    expect(await screen.findByText("Task was deleted.")).toBeInTheDocument();
    expect(todoMocks.removeSyncedTodo).toHaveBeenCalledWith("task-1");
    expect(todoMocks.syncTodo).not.toHaveBeenCalled();
  });

  it("hides debug output when the API omits structured task data", async () => {
    const user = userEvent.setup();
    const todo = {
      id: "task-1",
      title: "Buy groceries",
      completed: false,
      estimatedTime: 30,
      dueDate: "2026-08-05",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: "Task was added.", operation: "add", todo },
      }),
    }));

    render(<TodoAssistant />);
    await user.type(screen.getByLabelText("Message the todo assistant"), "Add groceries");
    await user.click(screen.getByRole("button", { name: "Apply task change" }));

    expect(await screen.findByText("Task was added.")).toBeInTheDocument();
    expect(screen.queryByText("Structured task debug output")).not.toBeInTheDocument();
  });

  it("shows the fixed refusal without changing local task state", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { message: "I can't help with that.", operation: "refusal" },
      }),
    }));

    render(<TodoAssistant />);
    await user.type(screen.getByLabelText("Message the todo assistant"), "What is the capital of France?");
    await user.click(screen.getByRole("button", { name: "Apply task change" }));

    expect(await screen.findByText("I can't help with that.")).toBeInTheDocument();
    expect(todoMocks.syncTodo).not.toHaveBeenCalled();
    expect(todoMocks.removeSyncedTodo).not.toHaveBeenCalled();
  });
});
