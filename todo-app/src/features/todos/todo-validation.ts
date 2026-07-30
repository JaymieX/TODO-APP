import type { Todo } from "./types";

export type TodoCreateInput = Pick<Todo, "title" | "estimatedTime" | "dueDate"> & {
  dueDate: string;
};

export type TodoUpdateInput = Partial<Pick<Todo, "title" | "completed" | "estimatedTime" | "dueDate">>;

export type TodoValidationErrors = {
  title?: string;
  estimatedTime?: string;
  dueDate?: string;
  form?: string;
};

type ValidationResult<T> =
  | { data: T; errors: null }
  | { data: null; errors: TodoValidationErrors };

const maximumEstimatedTime = 365 * 1440 + 1439;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function validateTitle(value: unknown) {
  return typeof value === "string" && value.trim() ? null : "Enter a task name.";
}

function validateEstimatedTime(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= maximumEstimatedTime
    ? null
    : "Enter an estimate of at least 1 minute.";
}

function validateDueDate(value: unknown, isRequired: boolean) {
  if (value === null && !isRequired) {
    return null;
  }

  if (typeof value !== "string" || !isDateKey(value)) {
    return isRequired ? "Choose a due date." : "Choose a valid due date.";
  }

  return null;
}

export function validateTodoCreateInput(value: unknown): ValidationResult<TodoCreateInput> {
  if (!isRecord(value)) {
    return { data: null, errors: { form: "Task data must be an object." } };
  }

  const allowedKeys = ["title", "estimatedTime", "dueDate"];
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    return { data: null, errors: { form: "Task data contains an unsupported field." } };
  }

  const errors: TodoValidationErrors = {
    title: validateTitle(value.title) ?? undefined,
    estimatedTime: validateEstimatedTime(value.estimatedTime) ?? undefined,
    dueDate: validateDueDate(value.dueDate, true) ?? undefined,
  };

  if (Object.values(errors).some(Boolean)) {
    return { data: null, errors };
  }

  return {
    data: {
      title: (value.title as string).trim(),
      estimatedTime: value.estimatedTime as number,
      dueDate: value.dueDate as string,
    },
    errors: null,
  };
}

export function validateTodoUpdateInput(value: unknown): ValidationResult<TodoUpdateInput> {
  if (!isRecord(value)) {
    return { data: null, errors: { form: "Task data must be an object." } };
  }

  const allowedKeys = ["title", "completed", "estimatedTime", "dueDate"];
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    return { data: null, errors: { form: "Task data contains an unsupported field." } };
  }

  if (Object.keys(value).length === 0) {
    return { data: null, errors: { form: "Provide at least one task change." } };
  }

  const errors: TodoValidationErrors = {};
  const data: TodoUpdateInput = {};

  if ("title" in value) {
    errors.title = validateTitle(value.title) ?? undefined;
    if (!errors.title) data.title = (value.title as string).trim();
  }

  if ("estimatedTime" in value) {
    errors.estimatedTime = validateEstimatedTime(value.estimatedTime) ?? undefined;
    if (!errors.estimatedTime) data.estimatedTime = value.estimatedTime as number;
  }

  if ("dueDate" in value) {
    errors.dueDate = validateDueDate(value.dueDate, false) ?? undefined;
    if (!errors.dueDate) data.dueDate = value.dueDate as string | null;
  }

  if ("completed" in value) {
    if (typeof value.completed !== "boolean") {
      errors.form = "Completion status must be true or false.";
    } else {
      data.completed = value.completed;
    }
  }

  return Object.values(errors).some(Boolean)
    ? { data: null, errors }
    : { data, errors: null };
}
