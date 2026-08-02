import { Router } from "express";
import { parseAskDocsInput, parseExtractInput, parseMessages } from "../validators/validators";
import { askDocs } from "../rag/askDocs";
import { chat, chatStream, extractJSON } from "../chat";


const route = Router();

route.get("/health", (req, res) => {
    res.json({ status: "ok" })
})

route.get("/debug", (req, res) => {
    res.json({
        message: "API is working",
        time: new Date().toISOString(),
        model: "Unknown", // placeholder
    })
})


import { createSession, getSession, saveMessage } from "../db/database";

route.post("/chat", async (req, res) => {
  const parsed = parseMessages(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const reqSessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : undefined;
  const session = (reqSessionId && getSession(reqSessionId)) || createSession("chat");

  try {
    const lastUserMsg = parsed[parsed.length - 1]?.content ?? "";
    saveMessage(session.id, "user", lastUserMsg);

    const result = await chat(parsed);
    saveMessage(session.id, "assistant", result.reply);

    res.json({
      reply: result.reply,
      meta: {
        model: result.model,
        latencyMs: result.latencyMs,
        sessionId: session.id,
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


route.post("/chat/stream", async (req, res) => {
  const parsed = parseMessages(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const reqSessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : undefined;
  const session = (reqSessionId && getSession(reqSessionId)) || createSession("chat");

  const lastUserMsg = parsed[parsed.length - 1]?.content ?? "";
  saveMessage(session.id, "user", lastUserMsg);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullReply = "";

  try {
    const meta = await chatStream(parsed, (token) => {
      fullReply += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });

    saveMessage(session.id, "assistant", fullReply);

    res.write(`data: ${JSON.stringify({ done: true, meta: { ...meta, sessionId: session.id } })}\n\n`);
    res.end();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: "Streaming failed", detail })}\n\n`);
    res.end();
  }
});


route.post("/extract", async (req, res) => {
  const parsedText = parseExtractInput(req.body);
  if (typeof parsedText !== "string") {
    res.status(400).json({ error: parsedText.error });
    return;
  }

  try {
    const result = await extractJSON(parsedText);
    res.json({
      data: result.data,
      meta: {
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    if (detail.includes("Schema validation failed")) {
      res.status(422).json({
        error: "Failed to parse structured JSON from model.",
        detail,
      });
      return;
    }
    res.status(502).json({
      error: "Failed to perform extraction from model.",
      detail,
    });
  }
});

route.post("/ask-docs", async (req, res) => {
  const question = parseAskDocsInput(req.body);
  if (typeof question !== "string") {
    res.status(400).json({ error: question.error });
    return;
  }

  try {
    const result = await askDocs(question);
    res.json({
      reply: result.reply,
      sources: result.sources,
      meta: {
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({
      error: "Failed to process RAG query.",
      detail,
    });
  }
});

export default route;