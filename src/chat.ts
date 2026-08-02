const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const AI_PROVIDER = (process.env.AI_PROVIDER ?? "ollama").toLowerCase();

function getActiveModel(): string {
  if (AI_PROVIDER === "groq") return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  if (AI_PROVIDER === "gemini") return process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  return process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b";
}

function buildSystemPrompt(model: string): string {
  return [
    `You are a concise, helpful AI assistant running via ${AI_PROVIDER.toUpperCase()}.`,
    `Your active model id is ${model}.`,
    "Prefer short, clear, direct answers unless the user asks for depth.",
  ].join(" ");
}

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatResult = {
  reply: string;
  model: string;
  latencyMs: number;
};

export type ExtractedData = {
  title: string;
  summary: string;
  tags: string[];
};

export type ExtractResult = {
  data: ExtractedData;
  model: string;
  latencyMs: number;
};

/**
 * Unified multi-provider LLM call router supporting Ollama, Groq (Free), and Gemini (Free).
 */
export async function callLLM(messages: ChatMessage[], isJsonMode = false): Promise<string> {
  const model = getActiveModel();

  if (AI_PROVIDER === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY environment variable is missing.");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: isJsonMode ? { type: "json_object" } : undefined,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  }

  if (AI_PROVIDER === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is missing.");

    const formattedContents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: formattedContents }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  // Default: Ollama (100% Local)
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: isJsonMode ? "json" : undefined,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

export async function chat(messages: ChatMessage[]): Promise<ChatResult> {
  const started = Date.now();
  const activeModel = getActiveModel();
  const fullMessages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(activeModel) },
    ...messages,
  ];

  const reply = await callLLM(fullMessages, false);

  return {
    reply,
    model: `${AI_PROVIDER}:${activeModel}`,
    latencyMs: Date.now() - started,
  };
}

function parseAndValidateExtraction(rawContent: string): ExtractedData {
  let cleaned = rawContent.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Output is not a valid JSON object.");
  }

  const { title, summary, tags } = parsed;

  if (typeof title !== "string" || title.trim() === "") {
    throw new Error('Field "title" must be a non-empty string.');
  }

  if (typeof summary !== "string" || summary.trim() === "") {
    throw new Error('Field "summary" must be a non-empty string.');
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    throw new Error('Field "tags" must be a non-empty array of strings.');
  }

  const cleanedTags = tags.map((t) => {
    if (typeof t !== "string" || t.trim() === "") {
      throw new Error('All items in "tags" must be non-empty strings.');
    }
    return t.trim();
  });

  return {
    title: title.trim(),
    summary: summary.trim(),
    tags: cleanedTags,
  };
}

export async function extractJSON(text: string): Promise<ExtractResult> {
  const started = Date.now();
  const activeModel = getActiveModel();

  const systemPrompt = [
    "You are a structured data extraction engine.",
    "Extract key information from the user provided text.",
    'Output strictly valid JSON matching this schema: { "title": string, "summary": string, "tags": string[] }.',
    'The "title" should be a short heading (3-7 words).',
    'The "summary" should be a concise overview (1-2 sentences).',
    'The "tags" should be an array of 2-5 relevant keyword strings.',
    "Do not include any explanation or markdown formatting outside the JSON object.",
  ].join(" ");

  const initialMsgs: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ];

  let rawReply = await callLLM(initialMsgs, true);

  try {
    const validated = parseAndValidateExtraction(rawReply);
    return {
      data: validated,
      model: `${AI_PROVIDER}:${activeModel}`,
      latencyMs: Date.now() - started,
    };
  } catch (firstError) {
    const errorMsg = firstError instanceof Error ? firstError.message : String(firstError);
    const retryMsgs: ChatMessage[] = [
      ...initialMsgs,
      { role: "assistant", content: rawReply },
      {
        role: "user",
        content: `Your response was invalid: ${errorMsg}. Please respond ONLY with valid JSON strictly matching: { "title": string, "summary": string, "tags": string[] }.`,
      },
    ];

    rawReply = await callLLM(retryMsgs, true);

    try {
      const validated = parseAndValidateExtraction(rawReply);
      return {
        data: validated,
        model: `${AI_PROVIDER}:${activeModel}`,
        latencyMs: Date.now() - started,
      };
    } catch (secondError) {
      const finalErr = secondError instanceof Error ? secondError.message : String(secondError);
      throw new Error(`Schema validation failed after retry: ${finalErr}`);
    }
  }
}
