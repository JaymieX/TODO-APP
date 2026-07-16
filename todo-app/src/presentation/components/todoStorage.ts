import type { Todo } from "@/src/domain/todo";

export const STORAGE_KEY = "todo-app-items";

export const initialTodos: Todo[] = [
  {
    id: "1",
    title: "Plan your day",
    completed: false,
    estimatedTime: 30,
    dueDate: "2026-07-18",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Review your notes",
    completed: true,
    estimatedTime: 45,
    dueDate: "2026-07-16",
    createdAt: new Date().toISOString(),
  },
];

export function loadTodos(): Todo[] {
  if (typeof window === "undefined") {
    return initialTodos;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return initialTodos;
    }

    const parsed = JSON.parse(saved) as Todo[];
    return Array.isArray(parsed) ? parsed : initialTodos;
  } catch {
    return initialTodos;
  }
}

export function saveTodos(todos: Todo[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
