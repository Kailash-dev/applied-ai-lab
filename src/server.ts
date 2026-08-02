import "dotenv/config";
import express from "express";
import path from "node:path";
import { vectorStore } from "./rag/vectorStore";
import basicRoute from "./routes/basic.route";
import agentRoute from "./routes/agent.route";
import sessionRoute from "./routes/session.route";
import { initDatabase } from "./db/database";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

const publicDir = path.join(process.cwd(), "public");
const docsDir = path.join(process.cwd(), "docs");

app.use(express.json());
app.use(express.static(publicDir));
app.use("/api/basic", basicRoute);
app.use("/api/agent", agentRoute);
app.use("/api/sessions", sessionRoute);

// Backward compatibility routes for project 1 endpoints
app.use("/", basicRoute);

app.listen(PORT, async () => {
  console.log(`applied-ai-lab listening on http://localhost:${PORT}`);
  
  // Initialize SQLite Database
  initDatabase();

  // Index documentation vector embeddings on startup

  try {
    await vectorStore.initialize(docsDir);
  } catch (err) {
    console.error(`[RAG Initialization Error] Could not index docs:`, err);
  }

  console.log(`Open the chat UI in your browser, or:`);
  console.log(
    `curl -X POST http://localhost:${PORT}/chat -H 'Content-Type: application/json' -d '{"message":"Hello"}'`,
  );
  console.log(
    `curl -X POST http://localhost:${PORT}/extract -H 'Content-Type: application/json' -d '{"text":"Ollama is an open-source tool for running LLMs locally."}'`,
  );
  console.log(
    `curl -X POST http://localhost:${PORT}/ask-docs -H 'Content-Type: application/json' -d '{"question":"How do I run the app?"}'`,
  );
  console.log(
    `curl -X POST http://localhost:${PORT}/api/agent/run -H 'Content-Type: application/json' -d '{"prompt":"Find user Kai in the database and calculate total order sum"}'`,
  );
});

