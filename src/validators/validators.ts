import "dotenv/config";
import { ChatMessage } from "../chat";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 4000;

export const     parseMessages = (body: unknown): ChatMessage[] | { error: string } => {
  if (!body || typeof body !== "object") {
    return { error: 'Body must be JSON with "message" or "messages".' };
  }

  const record = body as { message?: unknown; messages?: unknown };

  if (Array.isArray(record.messages)) {
    if (record.messages.length === 0) {
      return { error: '"messages" must be a non-empty array.' };
    }
    if (record.messages.length > MAX_MESSAGES) {
      return { error: `"messages" must have at most ${MAX_MESSAGES} items.` };
    }

    const messages: ChatMessage[] = [];
    for (const item of record.messages) {
      if (!item || typeof item !== "object") {
        return { error: 'Each message must be an object with "role" and "content".' };
      }
      const { role, content } = item as { role?: unknown; content?: unknown };
      if (role !== "user" && role !== "assistant") {
        return { error: 'Each message role must be "user" or "assistant".' };
      }
      if (typeof content !== "string" || content.trim() === "") {
        return { error: "Each message content must be a non-empty string." };
      }
      if (content.length > MAX_MESSAGE_LENGTH) {
        return {
          error: `Each message must be at most ${MAX_MESSAGE_LENGTH} characters.`,
        };
      }
      messages.push({ role, content: content.trim() });
    }

    if (messages[messages.length - 1]?.role !== "user") {
      return { error: 'The last message must be from "user".' };
    }

    return messages;
  }

  const message = record.message;
  if (typeof message !== "string" || message.trim() === "") {
    return { error: 'Body must include a non-empty string "message".' };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      error: `message must be at most ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  return [{ role: "user", content: message.trim() }];
}

export const     parseExtractInput = (body: unknown): string | { error: string } => {
  if (!body || typeof body !== "object") {
    return { error: 'Body must be JSON with a "text" string.' };
  }

  const record = body as { text?: unknown };
  if (typeof record.text !== "string" || record.text.trim() === "") {
    return { error: 'Body must include a non-empty string "text".' };
  }

  if (record.text.length > MAX_MESSAGE_LENGTH) {
    return {
      error: `"text" must be at most ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  return record.text.trim();
}

export const parseAskDocsInput = (body: unknown): string | { error: string } => {
  if (!body || typeof body !== "object") {
    return { error: 'Body must be JSON with a "question" string.' };
  }

  const record = body as { question?: unknown };
  if (typeof record.question !== "string" || record.question.trim() === "") {
    return { error: 'Body must include a non-empty string "question".' };
  }

  if (record.question.length > MAX_MESSAGE_LENGTH) {
    return {
      error: `"question" must be at most ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  return record.question.trim();
}

export type ParsedAgentInput = {
  prompt: string;
  maxSteps?: number;
};

export const parseAgentInput = (body: unknown): ParsedAgentInput | { error: string } => {
  if (!body || typeof body !== "object") {
    return { error: 'Body must be JSON with a "prompt" string.' };
  }

  const record = body as { prompt?: unknown; maxSteps?: unknown };
  if (typeof record.prompt !== "string" || record.prompt.trim() === "") {
    return { error: 'Body must include a non-empty string "prompt".' };
  }

  if (record.prompt.length > MAX_MESSAGE_LENGTH) {
    return {
      error: `"prompt" must be at most ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  let maxSteps: number | undefined;
  if (record.maxSteps !== undefined) {
    if (typeof record.maxSteps !== "number" || record.maxSteps < 1 || record.maxSteps > 10) {
      return { error: '"maxSteps" must be a number between 1 and 10.' };
    }
    maxSteps = record.maxSteps;
  }

  return {
    prompt: record.prompt.trim(),
    maxSteps,
  };
};