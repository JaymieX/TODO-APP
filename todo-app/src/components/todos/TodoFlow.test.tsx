import { render, screen, waitFor, within } from "@testing-library/react";
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

    await user.click(screen.getByRole("button", { name: "Actions for Learn component tests" }));
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    expect(screen.queryByText("Learn component tests")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain("Plan your day");
      expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain("Learn component tests");
    });
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

    expect(screen.getByText("Plan tomorrow")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Actions for Plan tomorrow" }));
    await user.click(screen.getByRole("menuitem", { name: "Change due date" }));
    const dueDateDialog = screen.getByRole("dialog", { name: "Change due date" });
    await user.clear(within(dueDateDialog).getByLabelText("Due date"));
    await user.type(within(dueDateDialog).getByLabelText("Due date"), "2026-08-15");
    await user.click(within(dueDateDialog).getByRole("button", { name: "Save" }));

    expect(screen.getByText("Due 2026-08-15")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Actions for Plan tomorrow" }));
    await user.click(screen.getByRole("menuitem", { name: "Change due date" }));
    const removeDueDateDialog = screen.getByRole("dialog", { name: "Change due date" });
    await user.click(within(removeDueDateDialog).getByRole("button", { name: "Remove due date" }));

    expect(screen.queryByText("Due 2026-08-15")).not.toBeInTheDocument();
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

    expect(screen.getByText("Quick task")).toBeInTheDocument();
    expect(screen.getByText("Est. 1 min")).toBeInTheDocument();
  });
});
