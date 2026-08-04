import { useState, type FormEvent } from "react";
import type { TodoRecord } from "@/features/todos/todo-database";
import { useTodos } from "@/features/todos/todo-context";
import type { Todo } from "@/features/todos/types";

type AssistantApiResponse =
  | { data: { message: string; operation: "add" | "modify" | "delete"; structuredTask?: TodoRecord; todo: Todo } }
  | { data: { message: string; operation: "refusal" } }
  | { error: { message: string } };

export function TodoAssistant() {
  const { removeSyncedTodo, syncTodo } = useTodos();
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [structuredTask, setStructuredTask] = useState<TodoRecord | null>(null);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    setAnswer("");
    setStructuredTask(null);
    setError("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
      });
      const result = await response.json() as AssistantApiResponse;

      if (!response.ok || !("data" in result)) {
        throw new Error("error" in result ? result.error.message : "The assistant could not respond.");
      }

      if (result.data.operation === "refusal") {
        setStructuredTask(null);
      } else if (result.data.operation === "delete") {
        removeSyncedTodo(result.data.todo.id);
      } else {
        syncTodo(result.data.todo);
      }
      if (result.data.operation !== "refusal") {
        setStructuredTask(result.data.structuredTask ?? null);
      }
      setAnswer(result.data.message);
      setMessage("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The assistant could not respond.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section aria-labelledby="assistant-title" className="rounded-card border border-line bg-surface/90 p-5">
      <div>
        <h2 id="assistant-title" className="mt-2 text-lg font-semibold text-ink">Quick Task Manager</h2>
        <p className="mt-1 text-sm text-muted">Describe a task to add, modify, or delete.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="assistant-message" className="sr-only">Message the todo assistant</label>
        <input
          id="assistant-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Add groceries, mark them complete, or delete the task"
          className="min-w-0 flex-1 rounded-xl border border-line bg-app px-3 py-3 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !message.trim()}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? "Working…" : "Apply task change"}
        </button>
      </form>

      <div aria-live="polite">
        {answer ? (
          <div className="mt-4 rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-success">Success</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">{answer}</p>
          </div>
        ) : null}
        {structuredTask ? (
          <div className="mt-4 rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Structured task debug output</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-ink">
              {JSON.stringify(structuredTask, null, 2)}
            </pre>
          </div>
        ) : null}
        {error ? <p role="alert" className="mt-4 rounded-xl border border-danger bg-danger/10 p-4 text-sm text-danger">{error}</p> : null}
      </div>
    </section>
  );
}
