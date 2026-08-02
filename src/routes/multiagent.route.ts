import { Router } from "express";
import { runMultiAgentSystem } from "../multiagent/supervisor";
import { createSession, getSession, saveAgentRun } from "../db/database";

const route = Router();

route.post("/run", async (req, res) => {
  const { goal, sessionId } = req.body || {};

  if (typeof goal !== "string" || goal.trim() === "") {
    res.status(400).json({ error: 'Body must include a non-empty string "goal".' });
    return;
  }

  const reqSessionId = typeof sessionId === "string" ? sessionId : undefined;
  const session = (reqSessionId && getSession(reqSessionId)) || createSession("multiagent", goal.trim().slice(0, 30));

  try {
    const result = await runMultiAgentSystem(goal.trim());

    // Format sub-agent execution traces into steps format for DB persistence
    const stepsForDb = result.subAgentTraces.map((t, idx) => ({
      step: idx + 1,
      thought: `Sub-agent '${t.title}' executed input: '${t.input.slice(0, 100)}...'`,
      toolCall: { name: t.role, args: { goal } },
      toolResult: t.output,
    }));

    saveAgentRun(session.id, goal.trim(), result.finalAuditedReport, stepsForDb, result.latencyMs);

    res.json({
      goal: result.goal,
      plan: result.plan,
      subAgentTraces: result.subAgentTraces,
      finalAuditedReport: result.finalAuditedReport,
      meta: {
        model: result.model,
        latencyMs: result.latencyMs,
        sessionId: session.id,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    res.status(502).json({
      error: "Failed to execute multi-agent workflow.",
      detail,
    });
  }
});

export default route;
