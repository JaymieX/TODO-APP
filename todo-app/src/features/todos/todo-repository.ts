import { supabase } from "@/features/supabase/supabase-client";
import type { Todo } from "./types";

const TODO_COLUMNS = "id, task_name, task_complete, estimated_time, due_date";

type TodoRow = {
  id: string;
  task_name: string;
  task_complete: boolean;
  estimated_time: number | string;
  due_date: string | null;
};

type TodoInput = Pick<Todo, "title" | "estimatedTime" | "dueDate">;
type TodoUpdates = Partial<Pick<Todo, "title" | "completed" | "estimatedTime" | "dueDate">>;

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.task_name,
    completed: row.task_complete,
    estimatedTime: Number(row.estimated_time),
    // The UI uses date-only values, so preserve the calendar date from Supabase.
    dueDate: row.due_date?.slice(0, 10) ?? null,
  };
}

function toDueDateValue(dueDate: string | null) {
  return dueDate ? `${dueDate}T12:00:00.000Z` : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to update tasks in Supabase.";
}

export class TodoRepository {
  async listTodos() {
    const { data, error } = await supabase
      .getClient()
      .from("todo")
      .select(TODO_COLUMNS)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return (data as TodoRow[]).map(toTodo);
  }

  async createTodo({ title, estimatedTime, dueDate }: TodoInput) {
    const { data, error } = await supabase
      .getClient()
      .from("todo")
      .insert({
        task_name: title,
        task_complete: false,
        estimated_time: estimatedTime,
        due_date: toDueDateValue(dueDate),
      })
      .select(TODO_COLUMNS)
      .single();

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return toTodo(data as TodoRow);
  }

  async updateTodo(todo: Todo, updates: TodoUpdates) {
    const changes: Partial<TodoRow> = {};

    if (updates.title !== undefined) changes.task_name = updates.title;
    if (updates.completed !== undefined) changes.task_complete = updates.completed;
    if (updates.estimatedTime !== undefined) changes.estimated_time = updates.estimatedTime;
    if (updates.dueDate !== undefined) changes.due_date = toDueDateValue(updates.dueDate);

    const { data, error } = await supabase
      .getClient()
      .from("todo")
      .update(changes)
      .eq("id", todo.id)
      .select(TODO_COLUMNS)
      .single();

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return toTodo(data as TodoRow);
  }

  async removeTodo(id: string) {
    const { error } = await supabase.getClient().from("todo").delete().eq("id", id);

    if (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async clearCompleted() {
    const { error } = await supabase
      .getClient()
      .from("todo")
      .delete()
      .eq("task_complete", true);

    if (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const todoRepository = new TodoRepository();
