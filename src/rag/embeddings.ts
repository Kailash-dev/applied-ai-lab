const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

/**
 * Generate a vector embedding for a text string using Ollama.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama embedding error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await response.json()) as { embeddings?: number[][] };
  const vector = data.embeddings?.[0];

  if (!vector || !Array.isArray(vector)) {
    throw new Error("Ollama returned an invalid or empty embedding vector.");
  }

  return vector;
}

/**
 * Calculates Cosine Similarity between two numerical vectors.
 * Returns a float score between -1.0 and 1.0 (1.0 = identical semantic direction).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector length mismatch: ${vecA.length} vs ${vecB.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
