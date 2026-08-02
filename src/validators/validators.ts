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