import { callLLM, type ChatMessage } from "../../chat";
import { tools } from "../../agent/tools";
import type { SubAgentExecutionTrace } from "../types";

export async function runResearcherAgent(task: string): Promise<SubAgentExecutionTrace> {
  const started = Date.now();

  // Perform quick doc search or DB lookup if relevant
  let retrievedContext = "";
  if (task.toLowerCase().includes("doc") || task.toLowerCase().includes("port") || task.toLowerCase().includes("server")) {
    const docRes = await tools.doc_search.execute({ query: task });
    retrievedContext += `\n[Doc Search Context]: ${JSON.stringify(docRes)}`;
  }
  if (task.toLowerCase().includes("user") || task.toLowerCase().includes("order") || task.toLowerCase().includes("kai")) {
    const dbRes = await tools.sql_query.execute({ query: task });
    retrievedContext += `\n[Database Context]: ${JSON.stringify(dbRes)}`;
  }

  const systemPrompt = [
    "You are a Senior Researcher Sub-Agent in a multi-agent AI engineering team.",
    "Your duty is to gather factual knowledge, technical specs, requirements, and background data.",
    "Be precise, organized, and factual.",
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Research Task: ${task}${retrievedContext ? `\n\nRetrieved Data:\n${retrievedContext}` : ""}` },
  ];

  const output = await callLLM(messages);

  return {
    role: "researcher",
    title: "🕵️ Researcher Sub-Agent",
    input: task,
    output,
    latencyMs: Date.now() - started,
  };
}
