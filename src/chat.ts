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

  const systemPrompt = [
    "You are a structured data extraction engine.",
    "Extract key information from the user provided text.",
    'Output strictly valid JSON matching this schema: { "title": string, "summary": string, "tags": string[] }.',
    'The "title" should be a short heading (3-7 words).',
    'The "summary" should be a concise overview (1-2 sentences).',
    'The "tags" should be an array of 2-5 relevant keyword strings.',
    "Do not include any explanation or markdown formatting outside the JSON object.",
  ].join(" ");

  const makeCall = async (msgs: { role: string; content: string }[]) => {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: "json",
        messages: msgs,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Ollama error ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = (await res.json()) as { message?: { content?: string } };
    return data.message?.content ?? "";
  };

  const initialMsgs = [
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ];

  let rawReply = await makeCall(initialMsgs);

  try {
    const validated = parseAndValidateExtraction(rawReply);
    return {
      data: validated,
      model: MODEL,
      latencyMs: Date.now() - started,
    };
  } catch (firstError) {
    const errorMsg = firstError instanceof Error ? firstError.message : String(firstError);
    // Auto-retry once with feedback
    const retryMsgs = [
      ...initialMsgs,
      { role: "assistant", content: rawReply },
      {
        role: "user",
        content: `Your response was invalid: ${errorMsg}. Please respond ONLY with valid JSON strictly matching: { "title": string, "summary": string, "tags": string[] }.`,
      },
    ];

    rawReply = await makeCall(retryMsgs);

    try {
      const validated = parseAndValidateExtraction(rawReply);
      return {
        data: validated,
        model: MODEL,
        latencyMs: Date.now() - started,
      };
    } catch (secondError) {
      const finalErr = secondError instanceof Error ? secondError.message : String(secondError);
      throw new Error(`Schema validation failed after retry: ${finalErr}`);
    }
  }
}
