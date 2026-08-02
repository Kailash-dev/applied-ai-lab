import { callLLM, type ChatMessage } from "../../chat";
import type { SubAgentExecutionTrace } from "../types";

export async function runAuditorAgent(
  goal: string,
  researchOutput: string,
  coderOutput: string
): Promise<SubAgentExecutionTrace> {
  const started = Date.now();

  const systemPrompt = [
    "You are a Principal Security & Quality Auditor Sub-Agent in a multi-agent AI engineering team.",
    "Your duty is to review the code and research outputs produced by your team.",
    "Check for: (1) Security vulnerabilities, (2) Edge cases & input validation, (3) Correctness against original goal.",
    "Produce a structured Audit Report with Status (APPROVED or NEEDS REVISION), Key Findings, and Security Verification.",
  ].join("\n");

  const promptContent = [
    `Original Goal: ${goal}`,
    `\nResearch Findings:\n${researchOutput}`,
    `\nGenerated Code:\n${coderOutput}`,
    "\nProvide a comprehensive audit review.",
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: promptContent },
  ];

  const output = await callLLM(messages);

  return {
    role: "auditor",
    title: "🛡️ Quality & Security Auditor Sub-Agent",
    input: `Audit review of goal: '${goal}'`,
    output,
    latencyMs: Date.now() - started,
  };
}
