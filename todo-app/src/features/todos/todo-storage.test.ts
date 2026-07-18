import { beforeEach, describe, expect, it } from "vitest";
import { loadTodos, saveTodos, STORAGE_KEY } from "./todo-storage";
import type { Todo } from "./types";

const todo: Todo = {
  id: "saved-1",
  title: "Saved task",
  completed: false,
  estimatedTime: 25,
  dueDate: null,
  createdAt: "2026-07-18T12:00:00.000Z",
};

describe("todo storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("returns null when storage is empty or malformed", () => {
    expect(loadTodos()).toBeNull();

    window.localStorage.setItem(STORAGE_KEY, "not-json");
    expect(loadTodos()).toBeNull();

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ title: "Incomplete" }]));
    expect(loadTodos()).toBeNull();
  });

  it("round-trips valid todos using the existing storage key", () => {
    saveTodos([todo]);

    expect(loadTodos()).toEqual([todo]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain("Saved task");
  });
});
