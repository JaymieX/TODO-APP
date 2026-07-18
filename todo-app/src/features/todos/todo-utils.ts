import type { TaskHighlight, Todo, TodoFilter, TodoProgress } from "./types";

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function createTodo(
  title: string,
  estimatedTime = 30,
  dueDate: string | null = null,
): Todo {
  return {
    id: createId(),
    title: title.trim(),
    completed: false,
    estimatedTime,
    dueDate,
    createdAt: new Date().toISOString(),
  };
}

export function createStarterTodos(now = new Date()): Todo[] {
  // Relative dates keep the learning examples useful whenever the app is opened.
  return [
    {
      id: "starter-plan",
      title: "Plan your day",
      completed: false,
      estimatedTime: 30,
      dueDate: toLocalDateKey(addDays(now, 1)),
      createdAt: now.toISOString(),
    },
    {
      id: "starter-review",
      title: "Review your notes",
      completed: true,
      estimatedTime: 45,
      dueDate: toLocalDateKey(now),
      createdAt: now.toISOString(),
    },
  ];
}

export function filterTodos(todos: Todo[], filter: TodoFilter) {
  if (filter === "active") {
    return todos.filter((todo) => !todo.completed);
  }

  if (filter === "completed") {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

export function getProgress(todos: Todo[]): TodoProgress {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;

  return {
    total,
    completed,
    remaining: total - completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function formatEstimatedTime(totalMinutes: number) {
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

export function getTaskHighlight(todo: Todo, now = new Date()): TaskHighlight {
  if (!todo.dueDate || todo.completed) {
    return null;
  }

  const dueDateAtEndOfDay = new Date(`${todo.dueDate}T23:59:59.999`);
  const remainingMinutes = Math.max(
    0,
    Math.round((dueDateAtEndOfDay.getTime() - now.getTime()) / 60_000),
  );

  if (dueDateAtEndOfDay.getTime() < now.getTime()) {
    return "overdue";
  }

  return todo.estimatedTime > remainingMinutes ? "estimate-exceeds-deadline" : null;
}
