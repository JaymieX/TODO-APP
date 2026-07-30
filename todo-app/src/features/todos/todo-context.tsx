import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { todoRepository } from "./todo-repository";
import type { Todo } from "./types";

type TodoContextValue = {
  todos: Todo[];
  isReady: boolean;
  error: string | null;
  addTodo: (title: string, estimatedTime: number, dueDate: string) => Promise<boolean>;
  toggleTodo: (id: string) => Promise<boolean>;
  updateTodo: (id: string, updates: Partial<Pick<Todo, "title" | "estimatedTime" | "dueDate">>) => Promise<boolean>;
  removeTodo: (id: string) => Promise<boolean>;
  clearCompleted: () => Promise<boolean>;
};

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadTodos() {
      try {
        const savedTodos = await todoRepository.listTodos();
        if (isCurrent) setTodos(savedTodos);
      } catch (caughtError) {
        if (isCurrent) setError(caughtError instanceof Error ? caughtError.message : "Unable to load tasks.");
      } finally {
        if (isCurrent) setIsReady(true);
      }
    }

    void loadTodos();

    return () => {
      isCurrent = false;
    };
  }, []);

  const value = useMemo<TodoContextValue>(
    () => ({
      todos,
      isReady,
      error,
      async addTodo(title, estimatedTime, dueDate) {
        try {
          const todo = await todoRepository.createTodo({ title, estimatedTime, dueDate });
          setTodos((current) => [...current, todo]);
          setError(null);
          return true;
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to create the task.");
          return false;
        }
      },
      async toggleTodo(id) {
        const todo = todos.find((current) => current.id === id);
        if (!todo) return false;

        try {
          const updatedTodo = await todoRepository.updateTodo(id, { completed: !todo.completed });
          setTodos((current) => current.map((item) => (item.id === id ? updatedTodo : item)));
          setError(null);
          return true;
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to update the task.");
          return false;
        }
      },
      async updateTodo(id, updates) {
        const todo = todos.find((current) => current.id === id);
        if (!todo) return false;

        try {
          const updatedTodo = await todoRepository.updateTodo(id, updates);
          setTodos((current) => current.map((item) => (item.id === id ? updatedTodo : item)));
          setError(null);
          return true;
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to update the task.");
          return false;
        }
      },
      async removeTodo(id) {
        try {
          await todoRepository.removeTodo(id);
          setTodos((current) => current.filter((todo) => todo.id !== id));
          setError(null);
          return true;
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to remove the task.");
          return false;
        }
      },
      async clearCompleted() {
        try {
          await todoRepository.clearCompleted();
          setTodos((current) => current.filter((todo) => !todo.completed));
          setError(null);
          return true;
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to remove completed tasks.");
          return false;
        }
      },
    }),
    [error, isReady, todos],
  );

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodos() {
  const context = useContext(TodoContext);

  if (!context) {
    throw new Error("useTodos must be used inside TodoProvider");
  }

  return context;
}
