import { Router } from "express";
import { parseAskDocsInput, parseExtractInput, parseMessages } from "../validators/validators";
import { askDocs } from "../rag/askDocs";
import { chat, extractJSON } from "../chat";

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


route.post("/chat", async (req, res) => {
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