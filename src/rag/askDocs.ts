import { vectorStore } from "./vectorStore";
import { callLLM, type ChatMessage } from "../chat";

const AI_PROVIDER = (process.env.AI_PROVIDER ?? "ollama").toLowerCase();

function getActiveModel(): string {
  if (AI_PROVIDER === "groq") return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  if (AI_PROVIDER === "gemini") return process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  return process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b";
}

export type RAGSource = {
  label: string;
  filename: string;
  title: string;
  scorePercent: number;
  excerpt: string;
};

export type AskDocsResult = {
  reply: string;
  sources: RAGSource[];
  model: string;
  latencyMs: number;
};

export async function askDocs(question: string): Promise<AskDocsResult> {
  const started = Date.now();
  const activeModel = getActiveModel();

  // 1. Search vector store for top semantic matches
  const searchResults = await vectorStore.search(question, 3, 0.50);

  // 2. Abstention Check: If no relevant documentation was found above threshold
  if (searchResults.length === 0) {
    return {
      reply: "I don't have enough information in the provided documentation to answer this question.",
      sources: [],
      model: `${AI_PROVIDER}:${activeModel}`,
      latencyMs: Date.now() - started,
    };
  }

  // 3. Format retrieved context chunks for prompt injection
  const contextText = searchResults
    .map(
      (res, idx) =>
        `[Doc ${idx + 1}] (File: ${res.chunk.filename}, Title: ${res.chunk.title}):\n${res.chunk.content}`,
    )
    .join("\n\n");

  const systemPrompt = [
    "You are an assistant for Applied AI Lab.",
    "Answer the user's question using ONLY the provided document excerpts below.",
    "For every claim, cite the source number in brackets, e.g. [Doc 1] or [Doc 2].",
    'If the excerpts do not contain the answer, respond: "I don\'t have enough information in the provided documentation to answer this question."',
    "\nDocument Excerpts:\n" + contextText,
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ];

  const reply = await callLLM(messages, false);

  const sources: RAGSource[] = searchResults.map((res, idx) => ({
    label: `Doc ${idx + 1}`,
    filename: res.chunk.filename,
    title: res.chunk.title,
    scorePercent: Math.round(res.score * 100),
    excerpt: res.chunk.content,
  }));

  return {
    reply,
    sources,
    model: `${AI_PROVIDER}:${activeModel}`,
    latencyMs: Date.now() - started,
  };
}
