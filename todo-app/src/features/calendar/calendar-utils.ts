import type { Todo } from "@/features/todos/types";
import { toLocalDateKey } from "@/features/todos/todo-utils";

export type CalendarDay = {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
};

export type TodoStatus = "done" | "overdue" | "active";

export function getMonthDays(referenceDate: Date): CalendarDay[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlankDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingBlankDays + lastDay.getDate()) / 7) * 7;

  // Include neighboring dates so every rendered week contains seven cells.
  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(year, month, index - leadingBlankDays + 1);

    return {
      date,
      dateKey: toLocalDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

export function getTodoStatus(todo: Todo, now = new Date()): TodoStatus {
  if (todo.completed) {
    return "done";
  }

  const dueDateAtEndOfDay = new Date(`${todo.dueDate}T23:59:59.999`);
  return dueDateAtEndOfDay.getTime() < now.getTime() ? "overdue" : "active";
}
