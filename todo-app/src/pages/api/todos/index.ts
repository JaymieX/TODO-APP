import type { NextApiRequest, NextApiResponse } from "next";
import { TodoDatabaseError } from "@/features/todos/todo-database";
import { getAuthenticatedTodoDatabase } from "@/features/todos/todo-database-session";
import { validateTodoCreateInput } from "@/features/todos/todo-validation";

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

function methodNotAllowed(response: NextApiResponse<ErrorResponse | { data: unknown }>) {
  response.setHeader("Allow", "GET, POST, DELETE");
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

  if (request.method === "GET") {
    try {
      response.status(200).json({ data: await todoDatabase.listTodos() });
    } catch (error) {
      handleDatabaseError(error, response);
    }
    return;
  }

  if (request.method === "POST") {
    const validation = validateTodoCreateInput(request.body);
    if (!validation.data) {
      sendError(response, 422, "Task data is invalid.", validation.errors);
      return;
    }

    try {
      response.status(201).json({ data: await todoDatabase.createTodo(validation.data) });
    } catch (error) {
      handleDatabaseError(error, response);
    }
    return;
  }

  if (request.method === "DELETE" && request.query.completed === "true") {
    try {
      await todoDatabase.clearCompleted();
      response.status(204).end();
    } catch (error) {
      handleDatabaseError(error, response);
    }
    return;
  }

  methodNotAllowed(response);
}
