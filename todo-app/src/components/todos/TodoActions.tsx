import { useState, type FormEvent } from "react";
import type { Todo } from "@/features/todos/types";

type EditMode = "rename" | "estimate" | "due-date" | null;

type TodoActionsProps = {
  todo: Todo;
  onUpdate: (updates: Partial<Pick<Todo, "title" | "estimatedTime" | "dueDate">>) => void;
  onRemove: () => void;
};

const inputClass =
  "w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function TodoActions({ todo, onUpdate, onRemove }: TodoActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [title, setTitle] = useState(todo.title);
  const [estimatedDays, setEstimatedDays] = useState(Math.floor(todo.estimatedTime / 1440));
  const [estimatedMinutes, setEstimatedMinutes] = useState(todo.estimatedTime % 1440);
  const [dueDate, setDueDate] = useState(todo.dueDate ?? "");

  const openEditor = (mode: Exclude<EditMode, null>) => {
    setIsMenuOpen(false);
    setEditMode(mode);
  };

  const closeEditor = () => setEditMode(null);

  const removeDueDate = () => {
    onUpdate({ dueDate: null });
    closeEditor();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editMode === "rename") {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;
      onUpdate({ title: cleanTitle });
    }

    if (editMode === "estimate") {
      const estimatedTime = estimatedDays * 1440 + estimatedMinutes;
      if (estimatedTime < 1) return;
      onUpdate({ estimatedTime });
    }

    if (editMode === "due-date") {
      onUpdate({ dueDate: dueDate || null });
    }

    closeEditor();
  };

  const editLabels = {
    rename: "Rename task",
    estimate: "Change estimated time",
    "due-date": "Change due date",
  } as const;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={`Actions for ${todo.title}`}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={() => setIsMenuOpen((open) => !open)}
        className="grid size-9 place-items-center rounded-lg text-lg font-bold leading-none text-muted transition hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span aria-hidden="true">•••</span>
      </button>

      {isMenuOpen ? (
        <div role="menu" aria-label={`Actions for ${todo.title}`} className="absolute right-0 z-10 mt-1 w-52 rounded-xl border border-line bg-surface p-1 shadow-card">
          <button type="button" role="menuitem" onClick={() => openEditor("rename")} className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-panel">
            Rename
          </button>
          <button type="button" role="menuitem" onClick={() => openEditor("estimate")} className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-panel">
            Change estimated time
          </button>
          <button type="button" role="menuitem" onClick={() => openEditor("due-date")} className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-panel">
            Change due date
          </button>
          <button type="button" role="menuitem" onClick={onRemove} className="w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10">
            Remove
          </button>
        </div>
      ) : null}

      {editMode ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-app/70 p-4">
          <form role="dialog" aria-modal="true" aria-label={editLabels[editMode]} onSubmit={handleSubmit} className="w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-card">
            <h3 className="text-lg font-semibold text-ink">{editLabels[editMode]}</h3>
            <div className="mt-4">
              {editMode === "rename" ? (
                <label className="grid gap-1.5 text-sm font-medium text-muted">
                  Task name
                  <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
                </label>
              ) : null}
              {editMode === "estimate" ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-sm font-medium text-muted">
                    Days
                    <input type="number" min="0" max="365" value={estimatedDays} onChange={(event) => setEstimatedDays(Number(event.target.value))} className={inputClass} />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-muted">
                    Minutes
                    <input type="number" min="0" max="1439" step="1" value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(Number(event.target.value))} className={inputClass} />
                  </label>
                </div>
              ) : null}
              {editMode === "due-date" ? (
                <label className="grid gap-1.5 text-sm font-medium text-muted">
                  Due date
                  <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} />
                </label>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              {editMode === "due-date" ? (
                <button type="button" onClick={removeDueDate} className="mr-auto rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10">
                  Remove due date
                </button>
              ) : null}
              <button type="button" onClick={closeEditor} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink">Cancel</button>
              <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-surface hover:bg-primary-hover">Save</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
