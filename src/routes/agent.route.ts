import { Router } from "express";
import { parseAgentInput } from "../validators/validators";
import { runAgent } from "../agent/agent";
import { tools } from "../agent/tools";

const route = Router();

route.get("/tools", (req, res) => {
  const toolList = Object.values(tools).map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
  res.json({ tools: toolList });
});

import { createSession, getSession, saveAgentRun } from "../db/database";

route.post("/run", async (req, res) => {
  const parsed = parseAgentInput(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const reqSessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : undefined;
  const session = (reqSessionId && getSession(reqSessionId)) || createSession("agent", parsed.prompt.slice(0, 30));

  try {
    const result = await runAgent(parsed.prompt, parsed.maxSteps ?? 5);
    saveAgentRun(session.id, parsed.prompt, result.finalAnswer, result.steps, result.latencyMs);

    res.json({
      finalAnswer: result.finalAnswer,
      steps: result.steps,
      meta: {
        model: result.model,
        latencyMs: result.latencyMs,
        sessionId: session.id,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({
      error: "Failed to execute agent loop.",
      detail,
    });
  }
});


export default route;
