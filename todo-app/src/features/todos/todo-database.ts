import type { SupabaseClient } from "@supabase/supabase-js";
import type { Todo } from "./types";
import type { TodoCreateInput, TodoUpdateInput } from "./todo-validation";

const TODO_COLUMNS = "id, task_name, task_complete, estimated_time, due_date";
const CREATED_TODO_COLUMNS = `${TODO_COLUMNS}, created_at, user_id`;

export type TodoRecord = {
  created_at: string;
  task_name: string;
  task_complete: boolean;
  estimated_time: number | string;
  due_date: string | null;
  user_id: string;
};

type TodoRow = TodoRecord & {
  id: string;
};

export class TodoDatabaseError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.task_name,
    completed: row.task_complete,
    estimatedTime: Number(row.estimated_time),
    dueDate: row.due_date?.slice(0, 10) ?? null,
  };
}

function toDueDateValue(dueDate: string | null) {
  return dueDate ? `${dueDate}T12:00:00.000Z` : null;
}

function toTodoRecord(row: TodoRow): TodoRecord {
  return {
    created_at: row.created_at,
    task_name: row.task_name,
    task_complete: row.task_complete,
    estimated_time: row.estimated_time,
    due_date: row.due_date,
    user_id: row.user_id,
  };
}

function throwDatabaseError(error: { message: string; code?: string }) {
  throw new TodoDatabaseError(error.message, error.code);
}

export class TodoDatabase {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async listTodos() {
    const { data, error } = await this.client
      .from("todo")
      .select(TODO_COLUMNS)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) throwDatabaseError(error);
    return (data as TodoRow[]).map(toTodo);
  }

  async createTodo({ title, estimatedTime, dueDate }: TodoCreateInput) {
    const { todo } = await this.createTodoWithRecord({ title, estimatedTime, dueDate });
    return todo;
  }

  async createTodoWithRecord({ title, estimatedTime, dueDate }: TodoCreateInput) {
    const { data, error } = await this.client
      .from("todo")
      .insert({
        created_at: new Date().toISOString(),
        task_name: title,
        task_complete: false,
        estimated_time: estimatedTime,
        due_date: toDueDateValue(dueDate),
        user_id: this.userId,
      })
      .select(CREATED_TODO_COLUMNS)
      .single();

    if (error) throwDatabaseError(error);
    const row = data as TodoRow;
    return { todo: toTodo(row), record: toTodoRecord(row) };
  }

  async updateTodo(id: string, updates: TodoUpdateInput) {
    const changes: Partial<TodoRow> = {};
    if (updates.title !== undefined) changes.task_name = updates.title;
    if (updates.completed !== undefined) changes.task_complete = updates.completed;
    if (updates.estimatedTime !== undefined) changes.estimated_time = updates.estimatedTime;
    if (updates.dueDate !== undefined) changes.due_date = toDueDateValue(updates.dueDate);

    const { data, error } = await this.client
      .from("todo")
      .update(changes)
      .eq("id", id)
      .select(TODO_COLUMNS)
      .maybeSingle();

    if (error) throwDatabaseError(error);
    return data ? toTodo(data as TodoRow) : null;
  }

  async removeTodo(id: string) {
    const { data, error } = await this.client
      .from("todo")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throwDatabaseError(error);
    return Boolean(data);
  }

  async clearCompleted() {
    const { error } = await this.client
      .from("todo")
      .delete()
      .eq("task_complete", true);

    if (error) throwDatabaseError(error);
  }
}
