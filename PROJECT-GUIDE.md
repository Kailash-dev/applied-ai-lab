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
| `README.md` | Quick start (local Ollama setup) |
| `PROJECT-GUIDE.md` | This file — learning + completion roadmap |
| `HANDOFF.md` | Session handoff for continuing in Antigravity / another agent |

---

## Progress tracker

| Step | Topic | Status | Job-relevant outcome |
|------|--------|--------|----------------------|
| **1** | Hello LLM — `POST /chat` | ✅ Done | You can call an LLM from code |
| **2** | Ollama + system prompt + validation + latency | ✅ Done | Production basics: guardrails + observability |
| **3** | Chat UI + multi-turn messages | ✅ Done | Real product shape; conversation memory |
| **4** | Structured JSON output | ✅ Done | Machine-readable outputs for downstream code |
| **5** | RAG — docs Q&A with citations | ✅ Done | Reduce hallucinations; cite sources |
| **6** | Evals — golden questions + scoring | ✅ Done | Measure quality, not vibes |
| **7** | Polish + deploy + portfolio packaging | ⬜ Todo | Demo-ready GitHub + resume bullets |

**You are here:** Step 6 complete. Step 7 finishes the project for your resume.

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

### Step 4 — Structured JSON output (✅ Done)

**Goal:** Added `POST /extract` endpoint that forces the model to return **valid JSON** matching a schema — extracting `{ title, summary, tags }` from input text.

**Why employers care:** Apps don't just chat — they feed LLM output into databases, UIs, and workflows. Free-form text breaks parsers.

**Build checklist:**

- [x] Define a TypeScript type + JSON schema (`{ title: string; summary: string; tags: string[] }`)
- [x] Prompt: "Output strictly valid JSON matching schema..."
- [x] Parse response with `JSON.parse`; auto-retry with parse error feedback or return `422` on invalid JSON
- [x] Use Ollama native `format: "json"` mode
- [x] Add curl example in `README.md` and server startup logs

**Try it:**

```bash
curl -X POST http://localhost:3000/extract \
  -H 'Content-Type: application/json' \
  -d '{"text":"TypeScript is a typed superset of JavaScript that compiles to plain JavaScript."}'
```

**Learn:**

- Structured outputs vs prompt-only JSON
- Validation + repair loops (re-ask on parse failure)
- Why schemas beat "please format as JSON" in the prompt alone

**Resume bullet:**  
*Implemented structured JSON extraction with schema validation and parse-error handling for downstream automation.*

**Interview Q:** *"How do you get reliable JSON from an LLM?"*  
**A:** Schema in prompt, server-side parse + validate, retry with error feedback, optionally native JSON mode; never trust without validation.

---

### Step 5 — RAG (Retrieval-Augmented Generation) (✅ Done)

**Goal:** Added `POST /ask-docs` — user asks a question; system retrieves relevant chunks from **`docs/*.md` files** via vector embeddings (`nomic-embed-text`) and answers **with citations**.

**Why employers care:** RAG is on most GenAI job descriptions. It grounds answers in private data and reduces hallucination.

**Build checklist:**

- [x] Add `docs/` folder with 3 markdown files (`setup.md`, `architecture.md`, `troubleshooting.md`)
- [x] Paragraph chunking function in `src/rag/chunk.ts`
- [x] Vector embedding + cosine similarity in `src/rag/embeddings.ts` and `src/rag/vectorStore.ts`
- [x] `POST /ask-docs` route in `server.ts` & `src/rag/askDocs.ts`
- [x] UI tab for **Docs Q&A (RAG)** with collapsible source citation cards
- [x] Explicit abstention fallback ("I don't have enough information...") when relevance score is below threshold (0.45)

**Try it:**

```bash
curl -X POST http://localhost:3000/ask-docs \
  -H 'Content-Type: application/json' \
  -d '{"question":"What port does the application run on?"}'
```

**Learn:**

- Chunk size / overlap tradeoffs
- Vector embeddings vs keyword search
- Citation formatting and context prompt injection
- Hallucination prevention through similarity score thresholds and abstention

**Resume bullet:**  
*Built a RAG pipeline over markdown docs with embedding retrieval, source citations, and abstention when confidence is low.*

**Interview Q:** *"Walk me through your RAG pipeline."*  
**A:** Ingest → chunk → embed → store → query embed → top-k retrieve → stuff context into prompt → generate → cite sources; mention evals (step 6).

---

### Step 6 — Evals (quality measurement) (✅ Done)

**Goal:** Created `npm run eval` test suite that runs golden evaluation test cases against chat, structured extraction, and RAG endpoints, calculating pass rate (%) and average latency ($ms$).

**Why employers care:** Senior AI engineers measure quality programmatically over time. "It feels better" doesn't ship to production.

**Build checklist:**

- [x] Create `evals/dataset.json` with 11 golden test cases covering Chat, Extraction, RAG Q&A, and RAG Abstention
- [x] Create automated evaluation runner in `src/eval/run.ts`
- [x] Add `"eval": "tsx src/eval/run.ts"` script to `package.json`
- [x] Calculate pass rate (%), average latency ($ms$), and assertion details
- [x] Validate 100.0% pass rate across test suite

**Try it:**

```bash
npm run eval
```

**Learn:**

- Golden datasets vs manual ad-hoc testing
- Substring assertions, JSON schema checks, and citation source count validations
- Latency benchmarking and abstention verification

**Resume bullet:**  
*Built an automated evaluation framework for LLM and RAG pipelines with assertions for schema accuracy, source citations, and abstention behavior.*

**Interview Q:** *"How do you test LLM applications?"*  
**A:** Programmatic evals using a golden dataset, strict schema and citation assertions, regression checks on prompt edits, and latency tracking.

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
