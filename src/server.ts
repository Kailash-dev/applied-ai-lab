import "dotenv/config";
import express from "express";
import path from "node:path";
import { chat, type ChatMessage } from "./chat";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 40;

const publicDir = path.join(process.cwd(), "public");

app.use(express.json());
app.use(express.static(publicDir));

function parseMessages(body: unknown): ChatMessage[] | { error: string } {
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

app.post("/chat", async (req, res) => {
  const parsed = parseMessages(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const result = await chat(parsed);
    res.json({
      reply: result.reply,
      meta: {
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({
      error: "Failed to get a reply from the model.",
      detail,
    });
  }
});

app.listen(PORT, () => {
  console.log(`applied-ai-lab listening on http://localhost:${PORT}`);
  console.log(`Open the chat UI in your browser, or:`);
  console.log(
    `curl -X POST http://localhost:${PORT}/chat -H 'Content-Type: application/json' -d '{"message":"Hello"}'`,
  );
});
