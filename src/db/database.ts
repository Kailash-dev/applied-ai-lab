import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";


const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

export type SessionRecord = {
  id: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
};

export type MessageRecord = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata_json: string | null;
  created_at: string;
};

export type AgentRunRecord = {
  id: string;
  session_id: string;
  prompt: string;
  final_answer: string;
  steps_json: string;
  latency_ms: number;
  created_at: string;
};

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      mode TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      final_answer TEXT NOT NULL,
      steps_json TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
  `);
  console.log(`[SQLite DB] Persistent storage initialized at "${dbPath}"`);
}

export function createSession(mode: string, title?: string): SessionRecord {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const defaultTitle = title || `${mode.toUpperCase()} Session (${new Date().toLocaleTimeString()})`;
  
  const stmt = db.prepare(`
    INSERT INTO sessions (id, title, mode)
    VALUES (?, ?, ?)
  `);
  stmt.run(id, defaultTitle, mode);

  return getSession(id)!;
}

export function listSessions(): SessionRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM sessions ORDER BY updated_at DESC
  `);
  return stmt.all() as SessionRecord[];
}

export function getSession(id: string): SessionRecord | undefined {
  const stmt = db.prepare(`SELECT * FROM sessions WHERE id = ?`);
  return (stmt.get(id) as SessionRecord) || undefined;
}

export function deleteSession(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM sessions WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

export function saveMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, any>
): MessageRecord {
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  // Touch session updated_at
  db.prepare(`UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(sessionId);

  const stmt = db.prepare(`
    INSERT INTO messages (id, session_id, role, content, metadata_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, sessionId, role, content, metadataJson);

  return {
    id,
    session_id: sessionId,
    role,
    content,
    metadata_json: metadataJson,
    created_at: new Date().toISOString(),
  };
}

export function getSessionMessages(sessionId: string): MessageRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC
  `);
  return stmt.all(sessionId) as MessageRecord[];
}

export function saveAgentRun(
  sessionId: string,
  prompt: string,
  finalAnswer: string,
  steps: any[],
  latencyMs: number
): AgentRunRecord {
  const id = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const stepsJson = JSON.stringify(steps);

  db.prepare(`UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(sessionId);

  const stmt = db.prepare(`
    INSERT INTO agent_runs (id, session_id, prompt, final_answer, steps_json, latency_ms)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, sessionId, prompt, finalAnswer, stepsJson, latencyMs);

  return {
    id,
    session_id: sessionId,
    prompt,
    final_answer: finalAnswer,
    steps_json: stepsJson,
    latency_ms: latencyMs,
    created_at: new Date().toISOString(),
  };
}

export function getSessionAgentRuns(sessionId: string): AgentRunRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM agent_runs WHERE session_id = ? ORDER BY created_at ASC
  `);
  return stmt.all(sessionId) as AgentRunRecord[];
}
