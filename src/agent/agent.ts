import { callLLM, type ChatMessage } from "../chat";
import { tools, getToolDefinitionsText } from "./tools";

export type AgentStepTrace = {
  step: number;
  thought: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
  };
  toolResult?: any;
  finalAnswer?: string;
};

export type AgentRunResult = {
  finalAnswer: string;
  steps: AgentStepTrace[];
  model: string;
  latencyMs: number;
};

function parseAgentAction(rawResponse: string): {
  thought: string;
  tool?: string;
  args?: Record<string, any>;
  final_answer?: string;
} {
  let cleaned = rawResponse.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Find first JSON object if surrounded by extra text
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    cleaned = match[0];
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      thought: parsed.thought ?? "Analyzing user request...",
      tool: parsed.tool ?? parsed.action,
      args: parsed.args ?? parsed.action_input ?? {},
      final_answer: parsed.final_answer ?? parsed.finalAnswer,
    };
  } catch (err) {
    // Fallback if LLM output raw text instead of JSON
    return {
      thought: "Formulating final response.",
      final_answer: rawResponse,
    };
  }
}

export async function runAgent(prompt: string, maxSteps = 5): Promise<AgentRunResult> {
  const started = Date.now();
  const toolDefs = getToolDefinitionsText();

  const systemPrompt = [
    "You are an autonomous AI Agent equipped with tools to solve complex multi-step user tasks.",
    "Available Tools:\n" + toolDefs,
    "\nInstructions:",
    "1. Read the user prompt and decide step-by-step how to answer.",
    "2. On each step, respond with strictly valid JSON in one of two forms:",
    "   Form A (to execute a tool):",
    '   { "thought": "explain your reasoning", "tool": "tool_name", "args": { "param": "value" } }',
    "   Form B (when you have the final answer):",
    '   { "thought": "explain how you derived the final answer", "final_answer": "your complete answer here" }',
    "3. Never guess database records or calculation results — call the appropriate tool first.",
    "4. Output strictly JSON without extra text.",
  ].join("\n");

  const conversationHistory: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  const steps: AgentStepTrace[] = [];
  let currentStep = 1;
  let finalAnswer: string | null = null;

  while (currentStep <= maxSteps && !finalAnswer) {
    const rawReply = await callLLM(conversationHistory, true);
    const action = parseAgentAction(rawReply);

    if (action.final_answer) {
      finalAnswer = action.final_answer;
      steps.push({
        step: currentStep,
        thought: action.thought,
        finalAnswer: action.final_answer,
      });
      break;
    }

    if (action.tool && tools[action.tool]) {
      const toolInstance = tools[action.tool];
      let toolResult: any;

      try {
        toolResult = await toolInstance.execute(action.args ?? {});
      } catch (err) {
        toolResult = { error: `Tool execution error: ${err instanceof Error ? err.message : String(err)}` };
      }

      steps.push({
        step: currentStep,
        thought: action.thought,
        toolCall: {
          name: action.tool,
          args: action.args ?? {},
        },
        toolResult,
      });

      // Update conversation history with observation
      conversationHistory.push({
        role: "assistant",
        content: JSON.stringify({
          thought: action.thought,
          tool: action.tool,
          args: action.args,
        }),
      });

      conversationHistory.push({
        role: "user",
        content: `Observation from tool '${action.tool}': ${JSON.stringify(toolResult)}. Continue to next step or provide final_answer.`,
      });
    } else {
      // If no valid tool matched or model got confused, provide final answer or ask to proceed
      finalAnswer = action.thought || rawReply;
      steps.push({
        step: currentStep,
        thought: action.thought,
        finalAnswer,
      });
      break;
    }

    currentStep++;
  }

  if (!finalAnswer) {
    finalAnswer = `Agent reached maximum step limit (${maxSteps}) without completing the final answer.`;
  }

  return {
    finalAnswer,
    steps,
    model: process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b",
    latencyMs: Date.now() - started,
  };
}
