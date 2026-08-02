# Applied AI Lab — Project Guide

Your first **resume-ready GenAI project**. This doc is the single source of truth: what you built, what each piece teaches, what's left, and how to talk about it in interviews.

---

## Project goal (one sentence)

Build a **local LLM chat application** that goes from "hello API" to **production-minded patterns**: validation, multi-turn chat, structured outputs, RAG with citations, and evals — the same skills AI software engineer job posts ask for.

---

## What you're proving to employers

| Skill | Where it shows up in this repo |
|-------|--------------------------------|
| LLM integration | Ollama HTTP API in `src/chat.ts` |
| Prompt engineering | System prompt + identity grounding |
| API design | `POST /chat` with validation |
| Full-stack delivery | Express backend + chat UI |
| Conversation state | Multi-turn `messages` array |
| Reliability | Input limits, error handling, metadata |
| Grounding (planned) | RAG over your own docs |
| Quality (planned) | Eval set + regression checks |
| Observability | `latencyMs`, `model` in every response |

---

## Architecture (today)

```mermaid
flowchart LR
  Browser["Browser\npublic/index.html"] -->|POST /chat\nmessages[]| Server["Express\nsrc/server.ts"]
  Server -->|validate| Parse["parseMessages()"]
  Parse --> Chat["chat()\nsrc/chat.ts"]
  Chat -->|POST /api/chat| Ollama["Ollama\n127.0.0.1:11434"]
  Ollama -->|reply| Chat
  Chat -->|reply + meta| Server
  Server --> Browser
```

**Stack:** TypeScript, Express 5, Ollama, vanilla HTML/JS (no React — keeps the focus on AI patterns, not framework churn).

**Model:** `qwen2.5-coder:7b` (configurable via `.env`). Runs **locally** — no cloud API key required.

---

## Repo map

| File | Responsibility |
|------|----------------|
| `src/server.ts` | HTTP server, static UI, request validation, `/chat` route |
| `src/chat.ts` | Ollama call, system prompt, latency measurement |
| `public/index.html` | Chat UI, client-side history, calls `/chat` |
| `.env` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `PORT` |
| `README.md` | Quick start |
| `PROJECT-GUIDE.md` | This file — learning + completion roadmap |

---

## Progress tracker

| Step | Topic | Status | Job-relevant outcome |
|------|--------|--------|----------------------|
| **1** | Hello LLM — `POST /chat` | ✅ Done | You can call an LLM from code |
| **2** | Ollama + system prompt + validation + latency | ✅ Done | Production basics: guardrails + observability |
| **3** | Chat UI + multi-turn messages | ✅ Done | Real product shape; conversation memory |
| **4** | Structured JSON output | ⬜ Todo | Machine-readable outputs for downstream code |
| **5** | RAG — docs Q&A with citations | ⬜ Todo | Reduce hallucinations; cite sources |
| **6** | Evals — golden questions + scoring | ⬜ Todo | Measure quality, not vibes |
| **7** | Polish + deploy + portfolio packaging | ⬜ Todo | Demo-ready GitHub + resume bullets |

**You are here:** Step 3 complete. Steps 4–7 finish the project for your resume.

---

## Step-by-step — what you built & what to learn

### Step 1 — Hello LLM (`POST /chat`)

**What exists:** A single endpoint that accepts `{ "message": "..." }` and returns `{ "reply", "meta" }`.

**Concepts to internalize:**

- An LLM is **not magic** — it's an HTTP API you call with messages.
- Your app owns **orchestration**; the model owns **text generation**.
- Always return **structured JSON** from your API, not raw model streams (at first).

**Interview one-liner:**  
*"I wrapped Ollama in a thin Express API so the frontend never talks to the model directly."*

**Try it:**

```bash
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is an LLM API?"}'
```

---

### Step 2 — Ollama, system prompt, validation, latency

**What exists:**

- `buildSystemPrompt()` — shapes assistant behavior and identity
- `parseMessages()` — rejects empty, oversized, or malformed input
- `meta.latencyMs` and `meta.model` on every success response
- `502` with `detail` when Ollama fails

**Concepts to internalize:**

| Concept | Why it matters |
|---------|----------------|
| **System prompt** | Sets rules, tone, and facts the model should follow |
| **Validation before model call** | Saves latency/cost; never trust client input |
| **Latency metadata** | First step toward SLAs and performance tuning |
| **Error boundaries** | User sees friendly error; logs keep technical detail |

**Important lesson (you hit this in chat):**  
The model **lies about its identity** ("I'm Claude"). Trust **server config + `meta.model`**, not model self-reporting.

**Interview one-liner:**  
*"I validate input server-side and attach observability metadata so we can debug slow or failed model calls."*

**Key code:**

```typescript
// src/chat.ts — system prompt + Ollama call
messages: [{ role: "system", content: buildSystemPrompt(MODEL) }, ...messages]

// src/server.ts — validation before any model work
if (message.length > MAX_MESSAGE_LENGTH) { ... }
```

---

### Step 3 — Chat UI + multi-turn messages

**What exists:**

- `public/index.html` served at `http://localhost:3000`
- UI keeps `history[]` and sends `{ messages: [...] }` on each turn
- API accepts **either** `{ message }` (single) **or** `{ messages }` (multi-turn)
- Last message must be `role: "user"`; max 40 turns; 4000 chars per message

**Concepts to internalize:**

| Concept | Why it matters |
|---------|----------------|
| **Multi-turn context** | Chat apps resend history; the model has no memory of its own |
| **Roles** | `system` / `user` / `assistant` — different privileges |
| **Thin client** | UI only collects input; business logic stays on server |
| **Context window limits** | Long chats need truncation or summarization (future enhancement) |

**Interview one-liner:**  
*"The frontend sends the full conversation thread; the server prepends a system prompt and forwards to Ollama."*

**Demo flow for interviews:**

1. Open `http://localhost:3000`
2. Ask a follow-up that requires prior context ("What did I just ask?")
3. Point at `meta.model` and latency badge — server truth, not model claims

---

## Remaining steps — build these to finish Project 1

Complete steps 4–7 in order. Each step adds a **resume bullet** and an **interview story**.

---

### Step 4 — Structured JSON output

**Goal:** Add `POST /extract` (or a `mode` on `/chat`) that forces the model to return **valid JSON** matching a schema — e.g. extract `{ title, summary, tags }` from a paragraph.

**Why employers care:** Apps don't just chat — they feed LLM output into databases, UIs, and workflows. Free-form text breaks parsers.

**Build checklist:**

- [ ] Define a TypeScript type + JSON schema (e.g. `{ title: string; summary: string; tags: string[] }`)
- [ ] Prompt: "Respond with JSON only, no markdown fences"
- [ ] Parse response with `JSON.parse`; retry or return `422` on invalid JSON
- [ ] Optional: use Ollama `format: "json"` if supported for your model
- [ ] Add a small UI section or curl example in README

**Learn:**

- Structured outputs vs prompt-only JSON
- Validation + repair loops (re-ask on parse failure)
- Why schemas beat "please format as JSON" in the prompt alone

**Resume bullet:**  
*Implemented structured JSON extraction with schema validation and parse-error handling for downstream automation.*

**Interview Q:** *"How do you get reliable JSON from an LLM?"*  
**A:** Schema in prompt, server-side parse + validate, retry with error feedback, optionally native JSON mode; never trust without validation.

---

### Step 5 — RAG (Retrieval-Augmented Generation)

**Goal:** Add `POST /ask-docs` — user asks a question; system retrieves relevant chunks from **your markdown files** and answers **with citations**.

**Why employers care:** RAG is on most GenAI job descriptions. It grounds answers in private data and reduces hallucination.

**Suggested design:**

```
docs/*.md  →  chunk (500 tokens, overlap 50)
           →  embed via Ollama embeddings (e.g. nomic-embed-text)
           →  store in memory or simple JSON index
User question  →  embed  →  top-k similar chunks
           →  prompt: "Answer using ONLY these sources. Cite [1], [2]."
           →  return { answer, sources: [{ id, excerpt, file }] }
```

**Build checklist:**

- [ ] Add `docs/` folder with 3–5 markdown files (e.g. your notes, a fake product FAQ)
- [ ] Chunking function in `src/rag/chunk.ts`
- [ ] Embedding + similarity in `src/rag/retrieve.ts`
- [ ] `POST /ask-docs` route in `server.ts`
- [ ] UI tab or separate page: question → answer + clickable sources
- [ ] Explicit "I don't know" when retrieval score is below threshold

**Learn:**

- Chunk size / overlap tradeoffs
- Embeddings vs keyword search
- Citation formatting
- When RAG fails (wrong chunks, stale docs)

**Resume bullet:**  
*Built a RAG pipeline over markdown docs with embedding retrieval, source citations, and abstention when confidence is low.*

**Interview Q:** *"Walk me through your RAG pipeline."*  
**A:** Ingest → chunk → embed → store → query embed → top-k retrieve → stuff context into prompt → generate → cite sources; mention evals (step 6).

---

### Step 6 — Evals (quality measurement)

**Goal:** A script `npm run eval` that runs **20 golden questions** against your chat or RAG endpoint and reports pass rate / latency.

**Why employers care:** Senior AI engineers measure quality over time. "It feels better" doesn't ship.

**Build checklist:**

- [ ] `evals/questions.json` — `{ id, question, expectedContains?: string[], category }`
- [ ] `src/eval/run.ts` — loop questions, call API, score (keyword match, optional LLM-as-judge)
- [ ] Output: `{ passed: 17, total: 20, avgLatencyMs, failures: [...] }`
- [ ] Run evals **before and after** a prompt change to show regression prevention
- [ ] Document results in this file or `evals/RESULTS.md`

**Learn:**

- Golden datasets
- Deterministic checks vs LLM-as-judge
- Regression testing for prompts
- CI hook (optional): fail if pass rate drops

**Resume bullet:**  
*Created a 20-question eval suite with automated scoring to track RAG/chat quality across prompt iterations.*

**Interview Q:** *"How do you know your RAG answer got better?"*  
**A:** Fixed eval set, track pass rate and latency per run, compare diffs when changing chunk size or prompts.

---

### Step 7 — Polish, deploy, portfolio packaging

**Goal:** Make the repo something you'd **link on a resume** and **demo in 5 minutes**.

**Build checklist:**

- [ ] README: architecture diagram, features list, eval results snippet
- [ ] `.env.example` documented (already exists)
- [ ] Architecture section in README linking to this guide
- [ ] Record a 2–3 min Loom: chat → RAG with citation → show eval output
- [ ] Deploy backend (Railway / Fly.io / Render) **or** clear "local demo" instructions
- [ ] GitHub topics: `llm`, `rag`, `ollama`, `typescript`, `genai`
- [ ] Pin repo on GitHub profile

**Learn:**

- How to demo AI projects (show metadata, show failure cases, show evals)
- Deployment constraints (Ollama is local — for cloud you'd swap to OpenAI/Together or run Ollama on a GPU box)

**Resume entry (full example):**

> **Applied AI Lab** — Local LLM application (TypeScript, Express, Ollama)  
> Built a full-stack chat app with multi-turn memory, input validation, and response observability. Added RAG over markdown docs with source citations and a 20-question eval suite to measure answer quality. Reduced identity hallucinations via system prompt grounding and server-side model metadata.

---

## Core concepts glossary (study these)

| Term | Plain English |
|------|----------------|
| **LLM** | Model that predicts next text; exposed as an API |
| **Token** | Chunk of text the model reads/writes; affects cost and context limits |
| **System prompt** | Hidden instructions that shape every reply |
| **Context window** | Max tokens the model can see in one request |
| **Hallucination** | Confident wrong answer — treat as normal failure mode |
| **RAG** | Retrieve relevant docs, then generate answer from them |
| **Embedding** | Vector representation of text for similarity search |
| **Structured output** | JSON (or schema) the app can parse reliably |
| **Eval** | Automated test set for LLM quality |
| **Latency** | Time from request to response — critical for UX |

---

## Interview prep — questions you'll get

### "Tell me about this project."

**30-second pitch:**  
"I built Applied AI Lab to learn GenAI engineering end-to-end. It's a TypeScript app that talks to Ollama locally — chat with multi-turn memory, server-side validation, and latency tracking. I'm extending it with structured JSON extraction, RAG with citations, and an eval suite so I can measure quality when I change prompts or retrieval settings."

### "Why Ollama instead of OpenAI?"

"No API cost while learning; same integration patterns (messages array, system prompt, HTTP API). Swapping to OpenAI is mostly changing the client in `chat.ts`."

### "How do you handle hallucinations?"

"Three layers: (1) system prompt with grounded identity, (2) RAG so answers cite docs, (3) evals to catch regressions. I never trust the model for infrastructure facts — metadata comes from the server."

### "What would you add for production?"

"Rate limiting, auth, streaming responses, conversation persistence, token budgeting/truncation, structured logging, cost tracking, prompt versioning, and running evals in CI."

---

## Hands-on exercises (do these yourself)

Do each exercise **before** moving to the next step. Writing code yourself matters more than reading.

1. **Step 1 review:** Change the system prompt tone to "explain like I'm 10" — observe behavior shift.
2. **Step 2 review:** Send a 5000-char message — confirm `400` before Ollama is called.
3. **Step 3 review:** Ask "what was my first message?" — confirm multi-turn works.
4. **Step 4 prep:** Manually prompt Ollama for JSON in curl; notice when it adds markdown fences.
5. **Step 5 prep:** Read one RAG tutorial; sketch chunk → embed → retrieve on paper.
6. **Step 6 prep:** Write 5 questions you expect your RAG to answer correctly from your docs.

---

## Completion checklist (Project 1 = done)

Use this before moving to Project 2 (agent or separate doc Q&A):

- [ ] Steps 1–3 working locally (`npm run dev` + browser chat)
- [ ] Step 4: structured JSON endpoint with validation
- [ ] Step 5: RAG with at least 3 docs and citations in UI
- [ ] Step 6: `npm run eval` with ≥15 questions and documented pass rate
- [ ] Step 7: README polished, demo recorded, resume bullet written
- [ ] You can explain architecture without opening the code
- [ ] You can demo one failure case (bad JSON, low retrieval score) confidently

---

## Suggested timeline

| Week | Focus |
|------|--------|
| 1 | Review steps 1–3; read this guide; exercise above |
| 2 | Step 4 — structured JSON |
| 3 | Step 5 — RAG pipeline |
| 4 | Step 6 — evals + Step 7 polish |

---

## After Project 1 — what's next

Project 1 = **LLM app fundamentals**. For a full AI engineer portfolio, add later:

| Project 2 | Agent with tools (SQL, search, API calls) |
| Project 3 | Deployed micro-tool with auth + rate limits |

Don't start those until Project 1 checklist is ✅.

---

## Quick commands

```bash
# Setup
npm install
cp .env.example .env
ollama pull qwen2.5-coder:7b

# Run
npm run dev
# → http://localhost:3000

# Single-turn API
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Hello"}'

# Multi-turn API
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"My name is Kai"},{"role":"assistant","content":"Hi Kai!"},{"role":"user","content":"What is my name?"}]}'
```

---

## How to use this doc

1. **While building:** Check off items in each step's checklist.
2. **While learning:** Read "Concepts to internalize" after each step you complete.
3. **While job hunting:** Copy resume bullets; practice "Interview one-liners."
4. **When stuck:** Re-read the architecture diagram and trace the request path in code.

---

*Last updated: Step 3 complete. Next action: implement Step 4 (structured JSON).*
