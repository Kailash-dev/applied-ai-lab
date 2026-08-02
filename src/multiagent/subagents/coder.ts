import { callLLM, type ChatMessage } from "../../chat";
import type { SubAgentExecutionTrace } from "../types";

export async function runCoderAgent(task: string, researchOutput?: string): Promise<SubAgentExecutionTrace> {
  const started = Date.now();

  const systemPrompt = [
    "You are a Staff Software Engineer Coder Sub-Agent in a multi-agent AI engineering team.",
    "Your duty is to write clean, idiomatic, fully functional TypeScript / Node.js code implementations based on requirements.",
    "Include clear comments, proper error handling, and modular structure.",
  ].join("\n");

  const promptContent = [
    `Coding Task: ${task}`,
    researchOutput ? `\nResearcher Context:\n${researchOutput}` : "",
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: promptContent },
  ];

  const output = await callLLM(messages);

  return {
    role: "coder",
    title: "💻 Coder Sub-Agent",
    input: task,
    output,
    latencyMs: Date.now() - started,
  };
}
