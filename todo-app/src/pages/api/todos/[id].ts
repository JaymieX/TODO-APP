import type { NextApiRequest, NextApiResponse } from "next";
import { TodoDatabaseError } from "@/features/todos/todo-database";
import { getAuthenticatedTodoDatabase } from "@/features/todos/todo-database-session";
import { validateTodoUpdateInput } from "@/features/todos/todo-validation";

type ErrorResponse = {
  error: {
    message: string;
    fields?: Record<string, string | undefined>;
  };
};

function sendError(
  response: NextApiResponse<ErrorResponse>,
  status: number,
  message: string,
  fields?: Record<string, string | undefined>,
) {
  response.status(status).json({ error: { message, ...(fields ? { fields } : {}) } });
}

function getId(query: string | string[] | undefined) {
  return typeof query === "string" && query.trim() && query.length <= 128 ? query : null;
}

function methodNotAllowed(response: NextApiResponse<ErrorResponse | { data: unknown }>) {
  response.setHeader("Allow", "PATCH, DELETE");
  sendError(response, 405, "Method not allowed.");
}

function handleDatabaseError(error: unknown, response: NextApiResponse<ErrorResponse | { data: unknown }>) {
  if (error instanceof TodoDatabaseError && error.code === "23505") {
    sendError(response, 409, "A task with those details already exists.");
    return;
  }

  sendError(response, 500, "Unable to complete the database request.");
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ErrorResponse | { data: unknown }>,
) {
  const todoDatabase = getAuthenticatedTodoDatabase(request);
  if (!todoDatabase) {
    sendError(response, 401, "Sign in to access tasks.");
    return;
  }

  const id = getId(request.query.id);
  if (!id) {
    sendError(response, 400, "Task id is invalid.");
    return;
  }

  if (request.method === "PATCH") {
    const validation = validateTodoUpdateInput(request.body);
    if (!validation.data) {
      sendError(response, 422, "Task data is invalid.", validation.errors);
      return;
    }

    try {
      const todo = await todoDatabase.updateTodo(id, validation.data);
      if (!todo) {
        sendError(response, 404, "Task not found.");
        return;
      }

      response.status(200).json({ data: todo });
    } catch (error) {
      handleDatabaseError(error, response);
    }
    return;
  }

  if (request.method === "DELETE") {
    try {
      const wasRemoved = await todoDatabase.removeTodo(id);
      if (!wasRemoved) {
        sendError(response, 404, "Task not found.");
        return;
      }

      response.status(204).end();
    } catch (error) {
      handleDatabaseError(error, response);
    }
    return;
  }

  methodNotAllowed(response);
}
