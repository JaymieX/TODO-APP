import { getAuth } from "@clerk/nextjs/server";
import { ChatGroq } from "@langchain/groq";
import type { NextApiRequest, NextApiResponse } from "next";
import { createListTasksTool } from "@/features/assistant/list-tasks-tool";
import { TodoDatabaseError, type TodoRecord } from "@/features/todos/todo-database";
import { getAuthenticatedTodoDatabase } from "@/features/todos/todo-database-session";
import {
  validateTodoCreateInput,
  validateTodoUpdateInput,
  type TodoCreateInput,
  type TodoUpdateInput,
} from "@/features/todos/todo-validation";
import type { Todo } from "@/features/todos/types";

const TASK_ADDED_MESSAGE = "Task was added.";
const TASK_MODIFIED_MESSAGE = "Task was modified.";
const TASK_DELETED_MESSAGE = "Task was deleted.";
const REFUSAL_MESSAGE = "I can't help with that.";

type TaskOperation = "add" | "modify" | "delete" | "refusal";

type AssistantResponse =
  | { data: { message: string; operation: Exclude<TaskOperation, "refusal">; structuredTask?: TodoRecord; todo: Todo } }
  | { data: { message: string; operation: "refusal" } }
  | { error: { message: string } };

type GroqTask = {
  operation: TaskOperation;
  task_id: string | null;
  task_name: string | null;
  task_complete: boolean | null;
  estimated_time: number | null;
  due_date: string | null;
};

const taskSchema = {
  type: "object",
  properties: {
    operation: { type: "string", enum: ["add", "modify", "delete", "refusal"] },
    task_id: {
      type: ["string", "null"],
      description: "Existing task id for modify; null for add.",
    },
    task_name: { type: ["string", "null"], description: "Short, actionable task name; null for refusal." },
    task_complete: { type: ["boolean", "null"] },
    estimated_time: { type: ["integer", "null"], minimum: 1, description: "Estimated duration in minutes; null for refusal." },
    due_date: { type: ["string", "null"], description: "Due date and time in ISO 8601 format; null for refusal." },
  },
  required: [
    "operation",
    "task_id",
    "task_name",
    "task_complete",
    "estimated_time",
    "due_date",
  ],
  additionalProperties: false,
};

type TaskInstruction =
  | { operation: "add"; input: TodoCreateInput }
  | { operation: "modify"; id: string; input: TodoUpdateInput }
  | { operation: "delete"; id: string }
  | { operation: "refusal" };

function getGroqBaseUrl(chatUrl: string) {
  try {
    const url = new URL(chatUrl);
    // The Groq SDK appends this API path itself, so LangChain needs only its prefix.
    const suffix = "/openai/v1/chat/completions";
    if (!url.pathname.endsWith(suffix)) return null;

    url.pathname = url.pathname.slice(0, -suffix.length);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function validateGroqTask(task: GroqTask): TaskInstruction | null {
  if (
    task.operation === "refusal"
    && task.task_id === null
    && task.task_name === null
    && task.task_complete === null
    && task.estimated_time === null
    && task.due_date === null
  ) {
    return { operation: "refusal" };
  }

  if (task.operation === "delete" && typeof task.task_id === "string" && task.task_id) {
    return { operation: "delete", id: task.task_id };
  }

  if (
    typeof task.task_name !== "string"
    || typeof task.task_complete !== "boolean"
    || typeof task.estimated_time !== "number"
    || typeof task.due_date !== "string"
  ) {
    return null;
  }

  const dueDate = new Date(task.due_date);
  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  const taskValues = {
    title: task.task_name,
    estimatedTime: task.estimated_time,
    dueDate: dueDate.toISOString().slice(0, 10),
  };

  if (task.operation === "add" && task.task_id === null && task.task_complete === false) {
    const validation = validateTodoCreateInput(taskValues);
    return validation.data ? { operation: "add", input: validation.data } : null;
  }

  if (task.operation === "modify" && typeof task.task_id === "string" && task.task_id) {
    const validation = validateTodoUpdateInput({
      ...taskValues,
      completed: task.task_complete,
    });
    return validation.data
      ? { operation: "modify", id: task.task_id, input: validation.data }
      : null;
  }

  return null;
}

function createTaskModel(config: NonNullable<ReturnType<typeof getGroqConfig>>) {
  const model = new ChatGroq({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    maxRetries: 2,
  });

  return model.withStructuredOutput<GroqTask>(taskSchema, {
    name: "todo_task",
    method: "jsonSchema",
    strict: true,
  });
}

function getGroqConfig() {
  const chatUrl = process.env.GROQ_CHAT_URL?.trim();
  const model = process.env.GROQ_MODEL?.trim();
  const systemPrompt = process.env.GROQ_SYSTEM_PROMPT?.trim();
  const apiKey = process.env.GROQ_SECRET_KEY;
  const maxMessageLength = Number(process.env.GROQ_MAX_MESSAGE_LENGTH);
  const baseUrl = chatUrl ? getGroqBaseUrl(chatUrl) : null;

  if (
    !baseUrl
    || !model
    || !systemPrompt
    || !apiKey
    || !Number.isSafeInteger(maxMessageLength)
    || maxMessageLength < 1
  ) {
    return null;
  }

  return { apiKey, baseUrl, maxMessageLength, model, systemPrompt };
}

function sendError(
  response: NextApiResponse<AssistantResponse>,
  status: number,
  message: string,
) {
  response.status(status).json({ error: { message } });
}

function getDebugOutput(record: TodoRecord) {
  return process.env.SHOW_STRUCTURED_TASK_DEBUG_OUTPUT === "true"
    ? { structuredTask: record }
    : {};
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

  let currentTasks: Todo[];
  try {
    currentTasks = await createListTasksTool(todoDatabase).invoke({});
  } catch {
    sendError(response, 500, "Unable to read current tasks.");
    return;
  }

  let instruction: TaskInstruction | null = null;
  try {
    const now = new Date().toISOString();
    const task = await createTaskModel(config).invoke([
      { role: "system", content: config.systemPrompt },
      { role: "system", content: `Current UTC timestamp: ${now}` },
      { role: "system", content: `Current tasks:\n${JSON.stringify(currentTasks)}` },
      { role: "user", content: message },
    ]);
    instruction = validateGroqTask(task);
    if (!instruction) {
      sendError(response, 502, "Groq returned invalid task data.");
      return;
    }
  } catch {
    sendError(response, 502, "Unable to reach Groq right now.");
    return;
  }

  try {
    if (instruction.operation === "refusal") {
      response.status(200).json({
        data: { message: REFUSAL_MESSAGE, operation: "refusal" },
      });
      return;
    }

    if (instruction.operation === "add") {
      const { record, todo } = await todoDatabase.createTodoWithRecord(instruction.input);
      response.status(201).json({
        data: {
          message: TASK_ADDED_MESSAGE,
          operation: "add",
          todo,
          ...getDebugOutput(record),
        },
      });
      return;
    }

    if (instruction.operation === "delete") {
      const result = await todoDatabase.removeTodoWithRecord(instruction.id);
      if (!result) {
        sendError(response, 404, "The task to delete was not found.");
        return;
      }

      response.status(200).json({
        data: {
          message: TASK_DELETED_MESSAGE,
          operation: "delete",
          todo: result.todo,
          ...getDebugOutput(result.record),
        },
      });
      return;
    }

    const result = await todoDatabase.updateTodoWithRecord(instruction.id, instruction.input);
    if (!result) {
      sendError(response, 404, "The task to modify was not found.");
      return;
    }

    response.status(200).json({
      data: {
        message: TASK_MODIFIED_MESSAGE,
        operation: "modify",
        todo: result.todo,
        ...getDebugOutput(result.record),
      },
    });
  } catch (error) {
    const status = error instanceof TodoDatabaseError && error.code === "23505" ? 409 : 500;
    sendError(response, status, "Unable to save the generated task change.");
  }
}
