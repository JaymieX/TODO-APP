import type { Todo } from "../domain/todo";
import type { TodoRepository } from "../domain/todoRepository";

export class InMemoryTodoRepository implements TodoRepository {
  private items: Todo[];

  constructor(initialItems: Todo[] = []) {
    this.items = [...initialItems];
  }

  list(): Todo[] {
    return [...this.items];
  }

  getById(id: string): Todo | undefined {
    return this.items.find((item) => item.id === id);
  }

  add(todo: Todo): Todo {
    this.items.push(todo);
    return todo;
  }

  update(todo: Todo): Todo {
    const index = this.items.findIndex((item) => item.id === todo.id);
    if (index === -1) {
      throw new Error("Todo not found");
    }

    this.items[index] = todo;
    return todo;
  }

  remove(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
  }

  clearCompleted(): Todo[] {
    const remaining = this.items.filter((item) => !item.completed);
    this.items = remaining;
    return remaining;
  }
}
