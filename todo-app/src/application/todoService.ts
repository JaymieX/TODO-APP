import { createTodo, filterTodos, getProgress, toggleTodo } from "../domain/todo";
import type { Todo, TodoFilter } from "../domain/todo";
import type { TodoRepository } from "../domain/todoRepository";

export class TodoService {
  constructor(private readonly repository: TodoRepository) {}

  getAll(): Todo[] {
    return this.repository.list();
  }

  getFilteredTodos(filter: TodoFilter): Todo[] {
    return filterTodos(this.getAll(), filter);
  }

  getProgress() {
    return getProgress(this.getAll());
  }

  addTodo(title: string, estimatedTime = 30, dueDate: string | null = null): Todo {
    const todo = createTodo(title, estimatedTime, dueDate);
    this.repository.add(todo);
    return todo;
  }

  toggleTodo(id: string): Todo | undefined {
    const current = this.repository.getById(id);
    if (!current) {
      return undefined;
    }

    const updated = toggleTodo(current);
    this.repository.update(updated);
    return updated;
  }

  removeTodo(id: string): void {
    this.repository.remove(id);
  }

  clearCompleted(): Todo[] {
    return this.repository.clearCompleted();
  }
}
