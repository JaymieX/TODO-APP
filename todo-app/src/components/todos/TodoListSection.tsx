import { useMemo, useState } from "react";
import { useTodos } from "@/features/todos/todo-context";
import { filterTodos, formatEstimatedTime, getTaskHighlight } from "@/features/todos/todo-utils";
import type { TodoFilter } from "@/features/todos/types";
import { TodoActions } from "./TodoActions";

const filters: TodoFilter[] = ["all", "active", "completed"];

export function TodoListSection() {
  const { todos, isReady, toggleTodo, updateTodo, removeTodo, clearCompleted } = useTodos();
  const [filter, setFilter] = useState<TodoFilter>("all");
  const visibleTodos = useMemo(() => filterTodos(todos, filter), [filter, todos]);

  return (
    <section aria-labelledby="task-list-title" className="rounded-card border border-line bg-surface/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="task-list-title" className="text-lg font-semibold text-ink">Your tasks</h2>
          <div aria-label="Filter tasks" className="mt-3 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-2 text-sm font-medium capitalize transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  filter === item ? "bg-primary text-surface" : "bg-panel text-muted hover:text-ink"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={clearCompleted}
          disabled={!todos.some((todo) => todo.completed)}
          className="text-sm font-medium text-muted transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear completed
        </button>
      </div>

      {!isReady ? (
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Loading tasks…</p>
      ) : visibleTodos.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          No {filter === "all" ? "" : `${filter} `}tasks here yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {visibleTodos.map((todo) => {
            const highlight = getTaskHighlight(todo);
            const isOverdue = highlight === "overdue";
            const isEstimateTooHigh = highlight === "estimate-exceeds-deadline";

            return (
              <li
                key={todo.id}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                  isOverdue
                    ? "border-danger bg-danger/10"
                    : isEstimateTooHigh
                      ? "border-warning bg-warning/10"
                      : "border-line bg-panel"
                }`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className={`block break-words ${todo.completed ? "text-subtle line-through" : "text-ink"}`}>
                      {todo.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted">Est. {formatEstimatedTime(todo.estimatedTime)}</span>
                    {todo.dueDate ? (
                      <span className={`block text-xs ${isOverdue ? "text-danger" : isEstimateTooHigh ? "text-warning" : "text-primary"}`}>
                        Due {todo.dueDate}
                      </span>
                    ) : null}
                  </span>
                </label>
                <TodoActions
                  todo={todo}
                  onUpdate={(updates) => updateTodo(todo.id, updates)}
                  onRemove={() => removeTodo(todo.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
