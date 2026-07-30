import type { Todo } from "./types";
import type { TodoCreateInput, TodoUpdateInput } from "./todo-validation";

type ApiError = {
  error?: {
    message?: string;
  };
};

type ApiSuccess<T> = {
  data: T;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Unable to reach the task service. Check your connection and try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;
  if (!response.ok) {
    throw new Error(body && "error" in body && body.error?.message
      ? body.error.message
      : `Task request failed (${response.status}).`);
  }

  if (!body || !("data" in body)) {
    throw new Error("The task service returned an invalid response.");
  }

  return body.data;
}

export class TodoRepository {
  listTodos() {
    return request<Todo[]>("/api/todos");
  }

  createTodo(todo: TodoCreateInput) {
    return request<Todo>("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(todo),
    });
  }

  updateTodo(id: string, updates: TodoUpdateInput) {
    return request<Todo>(`/api/todos/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  removeTodo(id: string) {
    return request<void>(`/api/todos/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  clearCompleted() {
    return request<void>("/api/todos?completed=true", { method: "DELETE" });
  }
}

export const todoRepository = new TodoRepository();
