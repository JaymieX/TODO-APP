import { tool } from "@langchain/core/tools";
import type { TodoDatabase } from "@/features/todos/todo-database";

const noArgumentsSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export function createListTasksTool(
  todoDatabase: Pick<TodoDatabase, "listTodos">,
) {
  return tool(
    async () => todoDatabase.listTodos(),
    {
      name: "list_tasks",
      description: "Read and return all todo tasks belonging to the current authenticated user.",
      schema: noArgumentsSchema,
    },
  );
}
