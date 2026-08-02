import { Router } from "express";
import {
  createSession,
  deleteSession,
  getSession,
  getSessionAgentRuns,
  getSessionMessages,
  listSessions,
} from "../db/database";

const route = Router();

route.get("/", (req, res) => {
  const sessions = listSessions();
  res.json({ sessions });
});

route.post("/", (req, res) => {
  const { mode, title } = req.body || {};
  const validMode = typeof mode === "string" ? mode : "chat";
  const session = createSession(validMode, typeof title === "string" ? title : undefined);
  res.json({ session });
});

route.get("/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: `Session '${req.params.id}' not found.` });
    return;
  }

  const messages = getSessionMessages(session.id).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    metadata: m.metadata_json ? JSON.parse(m.metadata_json) : null,
    createdAt: m.created_at,
  }));

  const agentRuns = getSessionAgentRuns(session.id).map((r) => ({
    id: r.id,
    prompt: r.prompt,
    finalAnswer: r.final_answer,
    steps: JSON.parse(r.steps_json),
    latencyMs: r.latency_ms,
    createdAt: r.created_at,
  }));

  res.json({
    session,
    messages,
    agentRuns,
  });
});

route.delete("/:id", (req, res) => {
  const deleted = deleteSession(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: `Session '${req.params.id}' not found.` });
    return;
  }
  res.json({ success: true, message: `Session '${req.params.id}' deleted.` });
});

export default route;
