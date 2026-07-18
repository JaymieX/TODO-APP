import { useTodos } from "@/features/todos/todo-context";
import { getProgress } from "@/features/todos/todo-utils";

export function TodoProgress() {
  const { todos, isReady } = useTodos();
  const progress = getProgress(todos);

  return (
    <section aria-labelledby="progress-title" className="rounded-card border border-line bg-panel p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p id="progress-title" className="text-sm text-muted">Progress</p>
          <p className="text-xl font-semibold text-ink" aria-live="polite">
            {isReady ? `${progress.completed}/${progress.total} complete` : "Loading tasks…"}
          </p>
        </div>
        <div className="rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
          {progress.percentage}%
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Task completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percentage}
        className="mt-3 h-2 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </section>
  );
}
