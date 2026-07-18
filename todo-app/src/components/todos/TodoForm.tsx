import { useState, type FormEvent } from "react";
import { useTodos } from "@/features/todos/todo-context";

const fieldClass =
  "rounded-xl border border-line bg-app px-3 py-2 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20";

export function TodoForm() {
  const { addTodo, isReady } = useTodos();
  const [title, setTitle] = useState("");
  const [estimatedDays, setEstimatedDays] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    // Store one minute total even though the form uses friendlier day and minute fields.
    addTodo(cleanTitle, estimatedDays * 1440 + estimatedMinutes, dueDate || null);
    setTitle("");
    setEstimatedDays(0);
    setEstimatedMinutes(30);
    setDueDate("");
  };

  return (
    <section aria-labelledby="add-task-title" className="rounded-card border border-line bg-surface/90 p-5">
      <h2 id="add-task-title" className="mb-4 text-lg font-semibold text-ink">Add a task</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-muted">
          Task name
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            className={fieldClass}
            disabled={!isReady}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium text-muted">
            Estimated days
            <input
              type="number"
              min="0"
              max="365"
              value={estimatedDays}
              onChange={(event) => setEstimatedDays(Number(event.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-muted">
            Estimated minutes
            <input
              type="number"
              min="0"
              max="1439"
              step="5"
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-muted">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!isReady || !title.trim()}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-app transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add task
        </button>
      </form>
    </section>
  );
}
