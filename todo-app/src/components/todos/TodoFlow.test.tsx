import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodoProvider } from "@/features/todos/todo-context";
import { STORAGE_KEY } from "@/features/todos/todo-storage";
import { TodoForm } from "./TodoForm";
import { TodoListSection } from "./TodoListSection";

describe("todo flow", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds, filters, completes, removes, and persists tasks", async () => {
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

    const checkbox = screen.getByRole("checkbox", { name: /Learn component tests/ });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(screen.getByRole("button", { name: /active/i }));
    expect(screen.queryByText("Learn component tests")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^completed$/i }));
    expect(screen.getByText("Learn component tests")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Learn component tests" }));
    expect(screen.queryByText("Learn component tests")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain("Plan your day");
      expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain("Learn component tests");
    });
  });
});
