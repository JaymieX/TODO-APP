"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Todo, TodoFilter } from "@/src/domain/todo";
import { TodoService } from "@/src/application/todoService";
import { InMemoryTodoRepository } from "@/src/infrastructure/inMemoryTodoRepository";
import { initialTodos, loadTodos, saveTodos } from "./todoStorage";

const seedTodos: Todo[] = initialTodos;

function formatEstimatedTime(totalMinutes: number) {
  // Convert the stored total minutes into a human-friendly display of days and minutes.
  const days = Math.floor(totalMinutes / 1440);
  const minutes = totalMinutes % 1440;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} day${days === 1 ? "" : "s"}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }

  return parts.length > 0 ? parts.join(" ") : "0 min";
}

function getTaskHighlight(todo: Todo, serverNow: string) {
  // Use the server time as the authority for deadline and estimate comparisons.
  if (!todo.dueDate) {
    return null;
  }

  const now = new Date(serverNow);
  const dueDateAtEndOfDay = new Date(`${todo.dueDate}T23:59:59.999`);
  const isOverdue = dueDateAtEndOfDay.getTime() < now.getTime();

  if (isOverdue) {
    return "overdue";
  }

  const remainingMinutes = Math.max(0, Math.round((dueDateAtEndOfDay.getTime() - now.getTime()) / 60000));
  if (todo.estimatedTime > remainingMinutes) {
    return "estimate-exceeds-deadline";
  }

  return null;
}

type TodoAppProps = {
  serverNow: string;
};

export function TodoApp({ serverNow }: TodoAppProps) {
  const service = useMemo(() => new TodoService(new InMemoryTodoRepository(seedTodos)), []);
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [draft, setDraft] = useState("");
  const [estimatedDays, setEstimatedDays] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");

  const visibleTodos = useMemo(() => {
    // Filter the list based on the selected view so the UI only shows the relevant tasks.
    if (filter === "active") {
      return todos.filter((todo) => !todo.completed);
    }

    if (filter === "completed") {
      return todos.filter((todo) => todo.completed);
    }

    return todos;
  }, [filter, todos]);

  const progress = useMemo(() => {
    // Calculate the completion statistics for the progress card.
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;

    return {
      total,
      completed,
      remaining: total - completed,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }, [todos]);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) {
      return;
    }

    // Convert the separate day and minute inputs into one stored total in minutes.
    const totalEstimatedTime = estimatedDays * 1440 + estimatedMinutes;

    service.addTodo(title, totalEstimatedTime, dueDate || null);
    setTodos(service.getAll());
    setDraft("");
    setEstimatedDays(0);
    setEstimatedMinutes(30);
    setDueDate("");
  };

  const handleToggle = (id: string) => {
    // Toggle completion and refresh the local state from the service result.
    service.toggleTodo(id);
    setTodos(service.getAll());
  };

  const handleRemove = (id: string) => {
    service.removeTodo(id);
    setTodos(service.getAll());
  };

  const handleClearCompleted = () => {
    service.clearCompleted();
    setTodos(service.getAll());
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-todo shadow-black/30 backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Clean architecture</p>
            <h1 className="font-title text-fs-title font-semibold sm:text-fs-title">Todo Thingy</h1>
            <p className="text-sm text-slate-400 sm:text-base">
              Stay focused, keep tasks moving, and celebrate progress.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Todo view
            </Link>
            <Link
              href="/calendar"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Calendar
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Progress</p>
              <p className="text-xl font-semibold">
                {progress.completed}/{progress.total} complete
              </p>
            </div>
            <div className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-medium text-cyan-300">
              {progress.percentage}%
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-cyan-500 transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a new task"
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-0 transition focus:border-todo-accent"
            />
            <label className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              <span>Est. time</span>
              <input
                type="number"
                min="0"
                max="365"
                value={estimatedDays}
                onChange={(event) => setEstimatedDays(Number(event.target.value))}
                className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm outline-none"
              />
              <span>days</span>
              <input
                type="number"
                min="0"
                max="1439"
                step="5"
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
                className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm outline-none"
              />
              <span>min</span>
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              <span>Due date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm outline-none"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-todo-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-todo-accent/80"
          >
            Add task
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["all", "active", "completed"] as TodoFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  filter === item ? "bg-todo-accent text-slate-950" : "bg-slate-800 text-slate-300"
                }`}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleClearCompleted}
            className="text-sm font-medium text-slate-400 transition hover:text-cyan-300"
          >
            Clear completed
          </button>
        </div>

        <ul className="space-y-3">
          {visibleTodos.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
              No tasks here yet. Add one to get started.
            </li>
          ) : (
            visibleTodos.map((todo) => {
              const highlight = getTaskHighlight(todo, serverNow);
              const isOverdue = highlight === "overdue";
              const isEstimateTooHigh = highlight === "estimate-exceeds-deadline";

              return (
                <li
                  key={todo.id}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                    isOverdue
                      ? "border-todo-danger bg-todo-danger/10"
                      : isEstimateTooHigh
                        ? "border-todo-warning bg-todo-warning/10"
                        : "border-slate-800 bg-slate-950/70"
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo.id)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500"
                    />
                    <div className="flex flex-col">
                      <span
                        className={
                          todo.completed
                            ? "text-slate-500 line-through"
                            : isOverdue
                              ? "text-todo-danger"
                              : isEstimateTooHigh
                                ? "text-todo-warning"
                                : "text-slate-200"
                        }
                      >
                        {todo.title}
                      </span>
                      <span
                        className={`text-xs ${isOverdue ? "text-todo-danger" : isEstimateTooHigh ? "text-todo-warning" : "text-slate-500"}`}
                      >
                        Est. {formatEstimatedTime(todo.estimatedTime)}
                      </span>
                      {todo.dueDate ? (
                        <span
                          className={`text-xs ${isOverdue ? "text-todo-danger" : isEstimateTooHigh ? "text-todo-warning" : "text-cyan-400"}`}
                        >
                          Due {todo.dueDate}
                        </span>
                      ) : null}
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemove(todo.id)}
                    className="ml-3 text-sm font-medium text-slate-400 transition hover:text-rose-400"
                  >
                    Remove
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
