# HANDOFF — Continue in Antigravity

**For:** next AI coding session (Antigravity)  
**Project:** `applied-ai-lab`  
**Owner goal:** finish Project 1 as a resume-ready GenAI portfolio piece (AI software engineer path)  
**Date:** 2026-08-02

---

## TL;DR for the next agent

1. This is a **local-only** Ollama app (no cloud LLM APIs).
2. Steps **1–6 are done**. Next work is **Step 7: Polish + Portfolio Packaging**.
3. Follow **`PROJECT-GUIDE.md`** for the full roadmap (step 7).
4. Keep the stack simple: TypeScript + Express + vanilla UI + Ollama. Do **not** add React/Next unless the user asks.
5. User is learning — explain concepts when implementing; keep code small and clear.

**Immediate next task:** implement Step 7 (README polish, final commit/PR, portfolio packaging & interview preparation).

---

## Repo & git

| Item | Value |
|------|--------|
| Path | `/Users/kailash/Code/personal/learning/Ai-engineering/applied-ai-lab` |
| GitHub | https://github.com/Kailash-dev/applied-ai-lab |
| Branch | `feat/json-extraction-and-rag` |

---

## Local AI setup (required)

**No OpenAI / Gemini / Anthropic.** Everything goes through Ollama on the machine.

```bash
# 1) Ollama installed + running (app or `ollama serve`)
# 2) Models pulled
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text

# 3) App
cd applied-ai-lab
npm install
cp .env.example .env   # if needed
npm run dev
# → http://localhost:3000

# 4) Evals
npm run eval
```

`.env` defaults:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_EMBED_MODEL=nomic-embed-text
PORT=3000
```

---

## What already works (Steps 1–6)

### Architecture

```
Browser (public/index.html)
  → POST /api/basic/chat { messages }
  → POST /api/basic/extract { text }
  → POST /api/basic/ask-docs { question }
  → Express (src/server.ts) mounts router & initializes RAG VectorStore
  → RAG Engine (src/rag/): chunk -> nomic-embed-text -> vectorStore -> cosineSimilarity -> askDocs()
  → Evaluation Benchmark (src/eval/run.ts): npm run eval
```

### Key files

| File | Role |
|------|------|
| `src/server.ts` | Express server, mounts `/api/basic` router, initializes vector store |
| `src/routes/basic.route.ts` | Modular API route controller |
| `src/validators/validators.ts` | Input validation functions |
| `src/chat.ts` | Ollama client, system prompt, JSON extraction with 1-turn retry |
| `src/rag/chunk.ts` | Document paragraph chunking for `docs/*.md` files |
| `src/rag/embeddings.ts` | `nomic-embed-text` vector embedding generator & cosine similarity calculator |
| `src/rag/vectorStore.ts` | In-memory vector database & threshold search engine (`minScore = 0.50`) |
| `src/rag/askDocs.ts` | RAG prompt orchestrator, citation formatter, and abstention engine |
| `evals/dataset.json` | Golden test dataset (11 cases) |
| `src/eval/run.ts` | Automated evaluation test runner (`npm run eval`) |
| `public/index.html` | Tabbed UI (Chat, JSON Extractor, RAG Docs Q&A with expandable citations) |
| `PROJECT-GUIDE.md` | Learning roadmap + interview/resume bullets |
| `README.md` | Local setup + run instructions + API curl & eval examples |
| `HANDOFF.md` | This file |

---

## Progress tracker

| Step | Topic | Status |
|------|--------|--------|
| 1 | Hello LLM — `POST /chat` | ✅ Done |
| 2 | Ollama + system prompt + validation + latency | ✅ Done |
| 3 | Chat UI + multi-turn messages | ✅ Done |
| 4 | Structured JSON output | ✅ Done |
| 5 | RAG — docs Q&A with citations | ✅ Done |
| 6 | Evals — golden questions + scoring | ✅ Done |
| **7** | **Polish + deploy + portfolio packaging** | ⬜ **NEXT** |

Full checklists, interview Qs, and resume bullets: **`PROJECT-GUIDE.md`** (sections Step 4–7).

---

## Step 4 — exact build brief (do this next)

**Goal:** Force reliable machine-readable JSON from the LLM for downstream use.

Suggested implementation (keep it simple):

1. Add `POST /extract` (or similar) that accepts text and returns structured data, e.g.:
   ```json
   { "title": "...", "summary": "...", "tags": ["..."] }
   ```
2. Define a TypeScript type + validate after `JSON.parse`.
3. Prompt: JSON only, no markdown fences. Prefer Ollama `format: "json"` if the model supports it.
4. On invalid JSON: return `422` (or retry once with parse error feedback).
5. Add a small UI section **or** curl examples in README — don’t overbuild.
6. Update `PROJECT-GUIDE.md` progress tracker (mark Step 4 done) and README step map.

**Out of scope for Step 4:** RAG, evals, React rewrite, auth, streaming (unless user asks).

**Resume bullet to unlock:**  
*Implemented structured JSON extraction with schema validation and parse-error handling.*

---

## Coding conventions for this repo

- Prefer small, readable TypeScript over frameworks.
- Match existing style in `src/server.ts` / `src/chat.ts`.
- Don’t commit `.env` or secrets.
- Don’t add Cursor attribution to commits.
- Only commit when the user asks (or when they explicitly want push).
- Update `PROJECT-GUIDE.md` when a step completes so learning docs stay accurate.

---

## How the user wants to use this project

- Become an **AI software engineer** (ship LLM apps, not train models).
- Project 1 = this lab through RAG + evals + portfolio polish.
- Later: agent project, then a small deployed tool.
- Prefer **learn while building** — short explanations of why each pattern matters.

---

## Suggested first message in Antigravity

Copy-paste:

> Read `HANDOFF.md` and `PROJECT-GUIDE.md`. We’re on Step 4 of applied-ai-lab (local Ollama only). Implement structured JSON extraction (`POST /extract`), validate the schema server-side, update the docs, then show me how to test it. Don’t start RAG yet.

---

## After Step 4 (don’t jump ahead unless asked)

1. Step 5 — RAG over `docs/*.md` with citations  
2. Step 6 — `npm run eval` golden set  
3. Step 7 — README polish, demo, resume packaging  

---

## Quick verify commands

```bash
# Server
npm run dev

# Chat still works
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Hello"}'

# Multi-turn
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"My name is Kai"},{"role":"assistant","content":"Hi Kai!"},{"role":"user","content":"What is my name?"}]}'
```

After Step 4, add a similar curl for `/extract`.

---

*End of handoff. Next agent: start Step 4.*
