import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { TodoDatabaseError, type TodoRecord } from "@/features/todos/todo-database";
import { getAuthenticatedTodoDatabase } from "@/features/todos/todo-database-session";
import { validateTodoCreateInput, type TodoCreateInput } from "@/features/todos/todo-validation";
import type { Todo } from "@/features/todos/types";

const TASK_ADDED_MESSAGE = "Task was added.";

type AssistantResponse =
  | { data: { message: string; structuredTask: TodoRecord; todo: Todo } }
  | { error: { message: string } };

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

type GroqTask = {
  task_name: string;
  task_complete: boolean;
  estimated_time: number;
  due_date: string;
};

const taskResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "todo_task",
    strict: true,
    schema: {
      type: "object",
      properties: {
        task_name: { type: "string", description: "Short, actionable task name." },
        task_complete: { type: "boolean", enum: [false] },
        estimated_time: { type: "integer", minimum: 1, description: "Estimated duration in minutes." },
        due_date: { type: "string", description: "Due date and time in ISO 8601 format." },
      },
      required: [
        "task_name",
        "task_complete",
        "estimated_time",
        "due_date",
      ],
      additionalProperties: false,
    },
  },
};

function getGroqConfig() {
  const chatUrl = process.env.GROQ_CHAT_URL?.trim();
  const model = process.env.GROQ_MODEL?.trim();
  const systemPrompt = process.env.GROQ_SYSTEM_PROMPT?.trim();
  const apiKey = process.env.GROQ_SECRET_KEY;
  const maxMessageLength = Number(process.env.GROQ_MAX_MESSAGE_LENGTH);

  if (
    !chatUrl
    || !model
    || !systemPrompt
    || !apiKey
    || !Number.isSafeInteger(maxMessageLength)
    || maxMessageLength < 1
  ) {
    return null;
  }

  return { apiKey, chatUrl, maxMessageLength, model, systemPrompt };
}

function sendError(
  response: NextApiResponse<AssistantResponse>,
  status: number,
  message: string,
) {
  response.status(status).json({ error: { message } });
}

function parseGroqTask(content: string): TodoCreateInput | null {
  try {
    const task = JSON.parse(content) as GroqTask;
    const dueDate = new Date(task.due_date);

    if (
      task.task_complete !== false
      || Number.isNaN(dueDate.getTime())
    ) {
      return null;
    }

    const validation = validateTodoCreateInput({
      title: task.task_name,
      estimatedTime: task.estimated_time,
      dueDate: dueDate.toISOString().slice(0, 10),
    });
    return validation.data;
  } catch {
    return null;
  }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<AssistantResponse>,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendError(response, 405, "Method not allowed.");
    return;
  }

  const auth = getAuth(request);
  const todoDatabase = getAuthenticatedTodoDatabase(request);
  if (!auth.isAuthenticated || !todoDatabase) {
    sendError(response, 401, "Sign in to use the assistant.");
    return;
  }

  const config = getGroqConfig();
  if (!config) {
    sendError(response, 503, "The assistant configuration is missing or invalid.");
    return;
  }

  const message = typeof request.body?.message === "string"
    ? request.body.message.trim()
    : "";

  if (!message || message.length > config.maxMessageLength) {
    sendError(response, 422, `Message must be between 1 and ${config.maxMessageLength} characters.`);
    return;
  }

  let taskInput: TodoCreateInput | null = null;
  try {
    const now = new Date().toISOString();
    const groqResponse = await fetch(config.chatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: config.systemPrompt },
          {
            role: "system",
            content: `Current UTC timestamp: ${now}`,
          },
          { role: "user", content: message },
        ],
        response_format: taskResponseFormat,
      }),
    });
    const result = await groqResponse.json() as GroqResponse;

    if (!groqResponse.ok) {
      sendError(response, 502, "Groq could not create the task.");
      return;
    }

    const content = result.choices?.[0]?.message?.content;
    taskInput = content ? parseGroqTask(content) : null;
    if (!taskInput) {
      sendError(response, 502, "Groq returned invalid task data.");
      return;
    }
  } catch {
    sendError(response, 502, "Unable to reach Groq right now.");
    return;
  }

  try {
    const { record, todo } = await todoDatabase.createTodoWithRecord(taskInput);
    response.status(201).json({
      data: { message: TASK_ADDED_MESSAGE, structuredTask: record, todo },
    });
  } catch (error) {
    const status = error instanceof TodoDatabaseError && error.code === "23505" ? 409 : 500;
    sendError(response, status, "Unable to add the generated task.");
  }
}
