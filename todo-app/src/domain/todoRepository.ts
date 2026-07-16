import type { Todo } from "./todo";

export interface TodoRepository {
  list(): Todo[];
  getById(id: string): Todo | undefined;
  add(todo: Todo): Todo;
  update(todo: Todo): Todo;
  remove(id: string): void;
  clearCompleted(): Todo[];
}
