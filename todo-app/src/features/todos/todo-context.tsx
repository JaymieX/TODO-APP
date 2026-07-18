import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadTodos, saveTodos } from "./todo-storage";
import { createStarterTodos, createTodo } from "./todo-utils";
import type { Todo } from "./types";

type TodoContextValue = {
  todos: Todo[];
  isReady: boolean;
  addTodo: (title: string, estimatedTime: number, dueDate: string | null) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<Pick<Todo, "title" | "estimatedTime" | "dueDate">>) => void;
  removeTodo: (id: string) => void;
  clearCompleted: () => void;
};

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load browser data after hydration so the server and first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only available after hydration.
    setTodos(loadTodos() ?? createStarterTodos());
    setIsReady(true);
  }, []);

  useEffect(() => {
    // Avoid replacing saved data with the empty pre-hydration state.
    if (isReady) {
      saveTodos(todos);
    }
  }, [isReady, todos]);

  const value = useMemo<TodoContextValue>(
    () => ({
      todos,
      isReady,
      addTodo(title, estimatedTime, dueDate) {
        setTodos((current) => [...current, createTodo(title, estimatedTime, dueDate)]);
      },
      toggleTodo(id) {
        setTodos((current) =>
          current.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo,
          ),
        );
      },
      updateTodo(id, updates) {
        setTodos((current) =>
          current.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)),
        );
      },
      removeTodo(id) {
        setTodos((current) => current.filter((todo) => todo.id !== id));
      },
      clearCompleted() {
        setTodos((current) => current.filter((todo) => !todo.completed));
      },
    }),
    [isReady, todos],
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
