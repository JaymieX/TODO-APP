import { useMemo, useState } from "react";
import { useTodos } from "@/features/todos/todo-context";
import { toLocalDateKey } from "@/features/todos/todo-utils";
import { getMonthDays } from "@/features/calendar/calendar-utils";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const controlClass =
  "rounded-full border border-line px-3 py-2 text-sm text-muted transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function CalendarBrowser() {
  const { todos, isReady } = useTodos();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const todosByDate = useMemo(() => {
    return todos.reduce<Record<string, typeof todos>>((groups, todo) => {
      if (todo.dueDate) {
        groups[todo.dueDate] = [...(groups[todo.dueDate] ?? []), todo];
      }
      return groups;
    }, {});
  }, [todos]);

  const monthLabel = currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });
  const todayKey = toLocalDateKey(new Date());

  return (
    <section aria-labelledby="calendar-title" className="min-w-0 rounded-card border border-line bg-surface/90 p-4 shadow-card sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Month view</p>
          <h2 id="calendar-title" className="text-xl font-semibold text-ink">{monthLabel}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className={controlClass}
          >
            Previous
          </button>
          <button type="button" onClick={() => setCurrentDate(new Date())} className={controlClass}>
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className={controlClass}
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-160">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-subtle">
            {dayNames.map((day) => <div key={day}>{day}</div>)}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2" aria-busy={!isReady}>
            {monthDays.map(({ date, dateKey, isCurrentMonth }) => {
              const dayTodos = todosByDate[dateKey] ?? [];
              const isToday = dateKey === todayKey;

              return (
                <div
                  key={dateKey}
                  className={`min-h-24 rounded-xl border p-2 ${
                    isCurrentMonth ? "border-line bg-panel" : "border-line/50 bg-app/40 text-subtle"
                  } ${isToday ? "ring-1 ring-primary" : ""}`}
                >
                  <time dateTime={dateKey} className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                    {date.getDate()}
                  </time>
                  <div className="mt-2 space-y-1">
                    {dayTodos.map((todo) => (
                      <div key={todo.id} title={todo.title} className="truncate rounded-lg bg-surface px-2 py-1 text-xs text-muted">
                        {todo.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
