import type { Todo } from "./types";

export const STORAGE_KEY = "todo-app-items";

function isTodo(value: unknown): value is Todo {
  if (!value || typeof value !== "object") {
    return false;
  }

  const todo = value as Record<string, unknown>;

  return (
    typeof todo.id === "string" &&
    typeof todo.title === "string" &&
    typeof todo.completed === "boolean" &&
    typeof todo.estimatedTime === "number" &&
    (typeof todo.dueDate === "string" || todo.dueDate === null) &&
    typeof todo.createdAt === "string"
  );
}

export function loadTodos(): Todo[] | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.every(isTodo) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveTodos(todos: Todo[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
