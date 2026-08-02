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

route.post("/run", async (req, res) => {
  const parsed = parseAgentInput(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const result = await runAgent(parsed.prompt, parsed.maxSteps ?? 5);
    res.json({
      finalAnswer: result.finalAnswer,
      steps: result.steps,
      meta: {
        model: result.model,
        latencyMs: result.latencyMs,
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
