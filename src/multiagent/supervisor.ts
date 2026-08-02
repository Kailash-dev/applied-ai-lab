import { callLLM, type ChatMessage } from "../chat";
import { runResearcherAgent } from "./subagents/researcher";
import { runCoderAgent } from "./subagents/coder";
import { runAuditorAgent } from "./subagents/auditor";
import type { MultiAgentRunResult, SubAgentExecutionTrace } from "./types";

export async function runMultiAgentSystem(goal: string): Promise<MultiAgentRunResult> {
  const started = Date.now();
  const traces: SubAgentExecutionTrace[] = [];

  // Step 1: Formulate sub-agent team plan
  const plan = [
    "Phase 1: Research & factual context gathering via Researcher Sub-Agent",
    "Phase 2: Code implementation & architecture design via Coder Sub-Agent",
    "Phase 3: Security vulnerability & edge-case review via Auditor Sub-Agent",
  ];

  // Step 2: Dispatch Researcher Agent
  const researchTrace = await runResearcherAgent(goal);
  traces.push(researchTrace);

  // Step 3: Dispatch Coder Agent
  const coderTrace = await runCoderAgent(goal, researchTrace.output);
  traces.push(coderTrace);

  // Step 4: Dispatch Auditor Agent
  const auditorTrace = await runAuditorAgent(goal, researchTrace.output, coderTrace.output);
  traces.push(auditorTrace);

  // Step 5: Synthesize final audited report
  const summaryPrompt = [
    "You are a Lead AI Architect summarizing a multi-agent team workflow.",
    `Original Goal: ${goal}`,
    `\nSub-Agent Execution Team:`,
    `1. Researcher output: ${researchTrace.output.slice(0, 300)}...`,
    `2. Coder output: ${coderTrace.output.slice(0, 300)}...`,
    `3. Auditor status: ${auditorTrace.output.slice(0, 300)}...`,
    "\nProduce a concise, professional executive summary of the team's final audited deliverable.",
  ].join("\n");

  const summaryMsgs: ChatMessage[] = [
    { role: "system", content: "Synthesize team deliverables cleanly." },
    { role: "user", content: summaryPrompt },
  ];

  const finalAuditedReport = await callLLM(summaryMsgs);

  return {
    goal,
    plan,
    subAgentTraces: traces,
    finalAuditedReport,
    model: process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b",
    latencyMs: Date.now() - started,
  };
}
