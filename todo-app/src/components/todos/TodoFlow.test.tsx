import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodoProvider } from "@/features/todos/todo-context";
import type { Todo } from "@/features/todos/types";
import { TodoForm } from "./TodoForm";
import { TodoListSection } from "./TodoListSection";

const mockTodos = vi.hoisted(() => ({ current: [] as Todo[] }));

vi.mock("@/features/todos/todo-repository", () => ({
  todoRepository: {
    listTodos: vi.fn(async () => [...mockTodos.current]),
    createTodo: vi.fn(async ({ title, estimatedTime, dueDate }: Pick<Todo, "title" | "estimatedTime" | "dueDate">) => {
      const todo = {
        id: `server-${title}`,
        title,
        completed: false,
        estimatedTime,
        dueDate,
      };
      mockTodos.current = [...mockTodos.current, todo];
      return todo;
    }),
    updateTodo: vi.fn(async (todo: Todo, updates: Partial<Todo>) => {
      const updatedTodo = { ...todo, ...updates };
      mockTodos.current = mockTodos.current.map((item) => (item.id === todo.id ? updatedTodo : item));
      return updatedTodo;
    }),
    removeTodo: vi.fn(async (id: string) => {
      mockTodos.current = mockTodos.current.filter((todo) => todo.id !== id);
    }),
    clearCompleted: vi.fn(async () => {
      mockTodos.current = mockTodos.current.filter((todo) => !todo.completed);
    }),
  },
}));

describe("todo flow", () => {
  beforeEach(() => {
    mockTodos.current = [
      {
        id: "server-plan",
        title: "Plan your day",
        completed: false,
        estimatedTime: 30,
        dueDate: "2026-08-01",
      },
    ];
  });

  it("loads, adds, filters, completes, and removes database tasks", async () => {
    const user = userEvent.setup();
    render(
      <TodoProvider>
        <TodoForm />
        <TodoListSection />
      </TodoProvider>,
    );

    await screen.findByText("Plan your day");
    await user.type(screen.getByLabelText("Task name"), "Learn component tests");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    const checkbox = await screen.findByRole("checkbox", { name: /Learn component tests/ });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());

    await user.click(screen.getByRole("button", { name: /active/i }));
    expect(screen.queryByText("Learn component tests")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^completed$/i }));
    expect(screen.getByText("Learn component tests")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Actions for Learn component tests" }));
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    await waitFor(() => expect(screen.queryByText("Learn component tests")).not.toBeInTheDocument());
  });

  it("edits a task from its actions menu", async () => {
    const user = userEvent.setup();
    render(
      <TodoProvider>
        <TodoListSection />
      </TodoProvider>,
    );

    await screen.findByText("Plan your day");
    await user.click(screen.getByRole("button", { name: "Actions for Plan your day" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));
    const renameDialog = screen.getByRole("dialog", { name: "Rename task" });
    await user.clear(within(renameDialog).getByLabelText("Task name"));
    await user.type(within(renameDialog).getByLabelText("Task name"), "Plan tomorrow");
    await user.click(within(renameDialog).getByRole("button", { name: "Save" }));

    await screen.findByText("Plan tomorrow");

    await user.click(screen.getByRole("button", { name: "Actions for Plan tomorrow" }));
    await user.click(screen.getByRole("menuitem", { name: "Change due date" }));
    const dueDateDialog = screen.getByRole("dialog", { name: "Change due date" });
    await user.clear(within(dueDateDialog).getByLabelText("Due date"));
    await user.type(within(dueDateDialog).getByLabelText("Due date"), "2026-08-15");
    await user.click(within(dueDateDialog).getByRole("button", { name: "Save" }));

    await screen.findByText("Due 2026-08-15");

    await user.click(screen.getByRole("button", { name: "Actions for Plan tomorrow" }));
    await user.click(screen.getByRole("menuitem", { name: "Change due date" }));
    const removeDueDateDialog = screen.getByRole("dialog", { name: "Change due date" });
    await user.click(within(removeDueDateDialog).getByRole("button", { name: "Remove due date" }));

    await waitFor(() => expect(screen.queryByText("Due 2026-08-15")).not.toBeInTheDocument());
  });

  it("always offers a way to remove a due date", async () => {
    const user = userEvent.setup();
    render(
      <TodoProvider>
        <TodoListSection />
      </TodoProvider>,
    );

    await screen.findByText("Plan your day");
    await user.click(screen.getByRole("button", { name: "Actions for Plan your day" }));
    await user.click(screen.getByRole("menuitem", { name: "Change due date" }));

    expect(screen.getByRole("button", { name: "Remove due date" })).toBeInTheDocument();
  });

  it("accepts one-minute estimates", async () => {
    const user = userEvent.setup();
    render(
      <TodoProvider>
        <TodoForm />
        <TodoListSection />
      </TodoProvider>,
    );

    await screen.findByText("Plan your day");
    await user.type(screen.getByLabelText("Task name"), "Quick task");
    await user.clear(screen.getByLabelText("Estimated minutes"));
    await user.type(screen.getByLabelText("Estimated minutes"), "1");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await screen.findByText("Quick task");
    expect(screen.getByText("Est. 1 min")).toBeInTheDocument();
  });
});
