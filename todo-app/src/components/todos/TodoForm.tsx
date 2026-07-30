import { useState, type FormEvent } from "react";
import { useTodos } from "@/features/todos/todo-context";
import { validateTodoCreateInput, type TodoValidationErrors } from "@/features/todos/todo-validation";

const fieldClass =
  "rounded-xl border border-line bg-app px-3 py-2 text-sm text-surface outline-none transition placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20";
const invalidFieldClass = "border-danger focus:border-danger focus:ring-danger/20";

export function TodoForm() {
  const { addTodo, isReady } = useTodos();
  const [title, setTitle] = useState("");
  const [estimatedDays, setEstimatedDays] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<TodoValidationErrors>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const estimatedTime = estimatedDays * 1440 + estimatedMinutes;
    const validation = validateTodoCreateInput({ title, estimatedTime, dueDate });

    if (!validation.data) {
      setErrors(validation.errors);
      return;
    }

    const wasCreated = await addTodo(
      validation.data.title,
      validation.data.estimatedTime,
      validation.data.dueDate,
    );
    if (wasCreated) {
      setTitle("");
      setEstimatedDays(0);
      setEstimatedMinutes(30);
      setDueDate("");
      setErrors({});
    }
  };

  return (
    <section aria-labelledby="add-task-title" className="rounded-card border border-line bg-surface/90 p-5">
      <h2 id="add-task-title" className="mb-4 text-lg font-semibold text-ink">Add a task</h2>
      <form noValidate onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-muted">
          Task name
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setErrors((current) => ({ ...current, title: undefined }));
            }}
            placeholder="What needs to be done?"
            className={`${fieldClass} ${errors.title ? invalidFieldClass : ""}`}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "task-name-error" : undefined}
            disabled={!isReady}
          />
          {errors.title ? <span id="task-name-error" className="text-xs text-danger">{errors.title}</span> : null}
        </label>

        <div className="grid gap-4 sm:grid-cols-3" role="group" aria-label="Estimated time">
          <label className="grid gap-1.5 text-sm font-medium text-muted">
            Estimated days
            <input
              type="number"
              min="0"
              max="365"
              value={estimatedDays}
              onChange={(event) => {
                setEstimatedDays(Number(event.target.value));
                setErrors((current) => ({ ...current, estimatedTime: undefined }));
              }}
              className={`${fieldClass} ${errors.estimatedTime ? invalidFieldClass : ""}`}
              aria-invalid={Boolean(errors.estimatedTime)}
              aria-describedby={errors.estimatedTime ? "estimated-time-error" : undefined}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-muted">
            Estimated minutes
            <input
              type="number"
              min="0"
              max="1439"
              step="1"
              value={estimatedMinutes}
              onChange={(event) => {
                setEstimatedMinutes(Number(event.target.value));
                setErrors((current) => ({ ...current, estimatedTime: undefined }));
              }}
              className={`${fieldClass} ${errors.estimatedTime ? invalidFieldClass : ""}`}
              aria-invalid={Boolean(errors.estimatedTime)}
              aria-describedby={errors.estimatedTime ? "estimated-time-error" : undefined}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-muted">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => {
                setDueDate(event.target.value);
                setErrors((current) => ({ ...current, dueDate: undefined }));
              }}
              className={`${fieldClass} ${errors.dueDate ? invalidFieldClass : ""}`}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? "due-date-error" : undefined}
            />
            {errors.dueDate ? <span id="due-date-error" className="text-xs text-danger">{errors.dueDate}</span> : null}
          </label>
        </div>
        {errors.estimatedTime ? <p id="estimated-time-error" className="-mt-2 text-xs text-danger">{errors.estimatedTime}</p> : null}

        <button
          type="submit"
          disabled={!isReady}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add task
        </button>
      </form>
    </section>
  );
}
