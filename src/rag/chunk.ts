import fs from "node:fs";
import path from "node:path";

export type DocumentChunk = {
  id: string;
  filename: string;
  title: string;
  content: string;
};

/**
 * Reads all .md files from a directory and splits them into clean paragraph chunks.
 */
export function loadAndChunkDocs(docsDir: string): DocumentChunk[] {
  if (!fs.existsSync(docsDir)) {
    console.warn(`[RAG Chunking] Warning: Docs directory "${docsDir}" does not exist.`);
    return [];
  }

  const files = fs.readdirSync(docsDir).filter((file) => file.endsWith(".md"));
  const chunks: DocumentChunk[] = [];

  for (const file of files) {
    const filePath = path.join(docsDir, file);
    const rawText = fs.readFileSync(filePath, "utf-8");

    // Extract title (first h1 or filename)
    const titleMatch = rawText.match(/^#\s+(.+)$/m);
    const docTitle = titleMatch ? titleMatch[1].trim() : file;

    // Split text by markdown headings or double newlines (paragraphs)
    const rawParagraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20); // ignore tiny snippets/lines

    let index = 0;
    for (const paragraph of rawParagraphs) {
      index++;
      chunks.push({
        id: `${file}-chunk-${index}`,
        filename: file,
        title: docTitle,
        content: paragraph,
      });
    }
  }

  return chunks;
}
