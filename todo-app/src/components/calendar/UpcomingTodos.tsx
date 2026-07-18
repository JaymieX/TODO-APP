import { useMemo } from "react";
import { useTodos } from "@/features/todos/todo-context";
import { getTodoStatus } from "@/features/calendar/calendar-utils";

export function UpcomingTodos() {
  const { todos, isReady, toggleTodo } = useTodos();
  const upcomingTodos = useMemo(
    () => todos.filter((todo) => todo.dueDate).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")),
    [todos],
  );

  return (
    <section aria-labelledby="upcoming-title" className="rounded-card border border-line bg-surface/90 p-5 shadow-card">
      <p className="text-sm text-muted">Upcoming tasks</p>
      <h2 id="upcoming-title" className="text-xl font-semibold text-ink">Due soon</h2>

      {!isReady ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-muted">Loading tasks…</p>
      ) : upcomingTodos.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-muted">No tasks have due dates yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {upcomingTodos.map((todo) => {
            const status = getTodoStatus(todo);
            const statusClass = status === "done" ? "bg-success/15 text-success" : status === "overdue" ? "bg-danger/15 text-danger" : "bg-primary/15 text-primary";

            return (
              <li key={todo.id} className="rounded-xl border border-line bg-panel p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`break-words text-sm font-medium ${todo.completed ? "text-subtle line-through" : "text-ink"}`}>{todo.title}</p>
                    <p className="mt-1 text-xs text-muted">Due {todo.dueDate}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    aria-label={`Mark ${todo.title} ${todo.completed ? "active" : "complete"}`}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${statusClass}`}
                  >
                    {status === "done" ? "Done" : status === "overdue" ? "Overdue" : "Active"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
