export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime: number;
  dueDate: string | null;
  createdAt: string;
};

export type TodoFilter = "all" | "active" | "completed";

export type TodoProgress = {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
};

export type TaskHighlight = "overdue" | "estimate-exceeds-deadline" | null;
