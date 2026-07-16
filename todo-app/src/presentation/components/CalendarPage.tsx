"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Todo } from "@/src/domain/todo";
import { loadTodos, saveTodos } from "./todoStorage";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthDays(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const leadingBlankDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingBlankDays + daysInMonth) / 7) * 7;

  const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayOffset = index - leadingBlankDays + 1;
    const date = new Date(year, month, dayOffset);
    cells.push({
      date,
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return cells;
}

function getTodoStatus(todo: Todo) {
  if (todo.completed) {
    return "done";
  }

  if (!todo.dueDate) {
    return "normal";
  }

  const dueDate = new Date(`${todo.dueDate}T23:59:59.999`);
  return dueDate < new Date() ? "overdue" : "active";
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const selectedDateLabel = currentDate.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  const calendarTodos = useMemo(() => {
    return todos.filter((todo) => todo.dueDate);
  }, [todos]);

  const toggleComplete = (id: string) => {
    const nextTodos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    setTodos(nextTodos);
    saveTodos(nextTodos);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-black/30 backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Calendar view</p>
            <h1 className="text-3xl font-semibold">Plan your week</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Todo view
            </Link>
            <Link
              href="/calendar"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Calendar
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{selectedDateLabel}</p>
                <p className="text-xl font-semibold">{currentDate.toLocaleDateString("en", { month: "long", day: "numeric" })}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date())}
                  className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {dayNames.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {monthDays.map(({ date, isCurrentMonth }) => {
                const dayTodos = calendarTodos.filter((todo) => todo.dueDate === date.toISOString().slice(0, 10));

                return (
                  <div
                    key={date.toISOString()}
                    className={`min-h-24 rounded-2xl border p-2 ${
                      isCurrentMonth ? "border-slate-800 bg-slate-950/70" : "border-slate-900 bg-slate-950/40 text-slate-500"
                    }`}
                  >
                    <div className="text-sm font-medium">{date.getDate()}</div>
                    <div className="mt-2 space-y-1">
                      {dayTodos.map((todo) => (
                        <div key={todo.id} className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-[11px] text-slate-300">
                          {todo.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Upcoming tasks</p>
                <p className="text-xl font-semibold">Due soon</p>
              </div>
            </div>
            <ul className="space-y-3">
              {todos.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  No tasks yet.
                </li>
              ) : (
                todos
                  .filter((todo) => todo.dueDate)
                  .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
                  .map((todo) => {
                    const status = getTodoStatus(todo);
                    return (
                      <li key={todo.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-200">{todo.title}</p>
                            <p className="mt-1 text-xs text-slate-400">Due {todo.dueDate}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleComplete(todo.id)}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              status === "done"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : status === "overdue"
                                  ? "bg-rose-500/15 text-rose-300"
                                  : "bg-cyan-500/15 text-cyan-300"
                            }`}
                          >
                            {status === "done" ? "Done" : status === "overdue" ? "Overdue" : "Active"}
                          </button>
                        </div>
                      </li>
                    );
                  })
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
