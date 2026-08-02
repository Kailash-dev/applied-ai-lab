import path from "node:path";
import { loadAndChunkDocs, type DocumentChunk } from "./chunk";
import { getEmbedding, cosineSimilarity } from "./embeddings";

export type EmbeddedChunk = DocumentChunk & {
  embedding: number[];
};

export type SearchResult = {
  chunk: DocumentChunk;
  score: number;
};

class VectorStore {
  private chunks: EmbeddedChunk[] = [];
  private initialized = false;

  async initialize(docsDir: string): Promise<number> {
    console.log(`[RAG VectorStore] Indexing documents in "${docsDir}"...`);
    const rawChunks = loadAndChunkDocs(docsDir);

    if (rawChunks.length === 0) {
      console.warn(`[RAG VectorStore] No document chunks found to index.`);
      this.initialized = true;
      return 0;
    }

    const embedded: EmbeddedChunk[] = [];
    for (const chunk of rawChunks) {
      try {
        const vec = await getEmbedding(chunk.content);
        embedded.push({ ...chunk, embedding: vec });
      } catch (err) {
        console.error(`[RAG VectorStore] Failed embedding chunk ${chunk.id}:`, err);
      }
    }

    this.chunks = embedded;
    this.initialized = true;
    console.log(`[RAG VectorStore] Successfully indexed ${embedded.length} chunks.`);
    return embedded.length;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async search(query: string, topK = 3, minScore = 0.45): Promise<SearchResult[]> {
    if (!this.initialized || this.chunks.length === 0) {
      return [];
    }

    const queryVec = await getEmbedding(query);

    const scored: SearchResult[] = this.chunks.map((item) => {
      const score = cosineSimilarity(queryVec, item.embedding);
      return {
        chunk: {
          id: item.id,
          filename: item.filename,
          title: item.title,
          content: item.content,
        },
        score,
      };
    });

    // Filter by similarity threshold & sort descending by score
    return scored
      .filter((res) => res.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

export const vectorStore = new VectorStore();
