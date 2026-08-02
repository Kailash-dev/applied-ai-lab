const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b";

function buildSystemPrompt(model: string): string {
  return [
    "You are a concise, helpful assistant running locally via Ollama.",
    `Your model id is ${model}. You are not Claude, ChatGPT, or any cloud API.`,
    "If asked about your runtime, say you run on the user's machine through Ollama.",
    "Prefer short clear answers unless the user asks for detail.",
  ].join(" ");
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResult = {
  reply: string;
  model: string;
  latencyMs: number;
};

export async function chat(messages: ChatMessage[]): Promise<ChatResult> {
  const started = Date.now();

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [{ role: "system", content: buildSystemPrompt(MODEL) }, ...messages],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama error ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    message?: { content?: string };
  };

  return {
    reply: data.message?.content ?? "",
    model: MODEL,
    latencyMs: Date.now() - started,
  };
}
