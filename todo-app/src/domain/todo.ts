export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime: number;
  dueDate: string | null;
  createdAt: string;
};

export type TodoFilter = "all" | "active" | "completed";

export function createTodo(title: string, estimatedTime = 30, dueDate: string | null = null): Todo {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    completed: false,
    estimatedTime,
    dueDate,
    createdAt: new Date().toISOString(),
  };
}

export function toggleTodo(todo: Todo): Todo {
  return {
    ...todo,
    completed: !todo.completed,
  };
}

export function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  switch (filter) {
    case "active":
      return todos.filter((todo) => !todo.completed);
    case "completed":
      return todos.filter((todo) => todo.completed);
    default:
      return todos;
  }
}

export function getProgress(todos: Todo[]) {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;

  return {
    total,
    completed,
    remaining: total - completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
