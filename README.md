# applied-ai-lab

Step-by-step Applied AI learning lab.

**This is a local AI setup only.** There is no OpenAI / Gemini / Anthropic cloud API. Everything runs on your machine via [Ollama](https://ollama.com). No API keys required.

**Current:** Step 4 — structured JSON extraction. See **[PROJECT-GUIDE.md](./PROJECT-GUIDE.md)** for the full learning roadmap, job-ready checklist, and steps 5–7.

**Continuing in another session?** Start with **[HANDOFF.md](./HANDOFF.md)** (status, next task, Antigravity paste prompt).

---

## Before you run anything

Do these steps **in order**. The Node server will fail if Ollama or the model is missing.

### 1. Install Ollama

Download and install from [https://ollama.com](https://ollama.com).

Confirm it works:

```bash
ollama --version
```

### 2. Start Ollama

On macOS, opening the Ollama app is usually enough. Or from a terminal:

```bash
ollama serve
```

It should listen on `http://127.0.0.1:11434`.

### 3. Pull the model we use

This project defaults to **`qwen2.5-coder:7b`**:

```bash
ollama pull qwen2.5-coder:7b
```

Confirm it is available:

```bash
ollama list
```

You should see `qwen2.5-coder:7b` in the list.

### 4. Configure the project

```bash
cd applied-ai-lab
npm install
cp .env.example .env
```

`.env` defaults (edit only if you need to):

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:7b
PORT=3000
```

| Variable | Meaning |
|----------|---------|
| `OLLAMA_BASE_URL` | Local Ollama server URL |
| `OLLAMA_MODEL` | Model id you pulled with `ollama pull` |
| `PORT` | Where this app listens (browser + API) |

To use a different local model, pull it first (`ollama pull <name>`), then set `OLLAMA_MODEL` in `.env`.

### 5. Run the app

```bash
npm run dev
```

You should see:

```text
applied-ai-lab listening on http://localhost:3000
```

---

## Try it

### 1. Multi-turn Chat UI & API
- Open **http://localhost:3000** for the chat UI.
- Or call the chat API:

```bash
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Explain what an LLM API is in one sentence."}'
```

Example response:

```json
{
  "reply": "...",
  "meta": { "model": "qwen2.5-coder:7b", "latencyMs": 1234 }
}
```

The UI also sends multi-turn history as `{ "messages": [{ "role": "user"|"assistant", "content": "..." }] }`.

### 2. Structured JSON Extraction (`POST /extract`)
Pass raw text and extract structured `{ title, summary, tags }` with server-side validation:

```bash
curl -X POST http://localhost:3000/extract \
  -H 'Content-Type: application/json' \
  -d '{"text":"TypeScript is a typed superset of JavaScript that compiles to plain JavaScript."}'
```

Example response:

```json
{
  "data": {
    "title": "TypeScript Overview",
    "summary": "TypeScript is a statically typed language that compiles into standard JavaScript.",
    "tags": ["TypeScript", "JavaScript", "programming"]
  },
  "meta": {
    "model": "qwen2.5-coder:7b",
    "latencyMs": 2450
  }
}
```

### 3. Docs Q&A with Citations (`POST /ask-docs`)
Ask questions grounded strictly in local `docs/*.md` files using vector embeddings (`nomic-embed-text`):

```bash
curl -X POST http://localhost:3000/ask-docs \
  -H 'Content-Type: application/json' \
  -d '{"question":"What port does the application run on?"}'
```

Example response:

```json
{
  "reply": "The application runs on port 3000, as stated in [Doc 1].",
  "sources": [
    {
      "label": "Doc 1",
      "filename": "setup.md",
      "title": "Applied AI Lab — Setup Guide",
      "scorePercent": 60,
      "excerpt": "The server will start and listen on http://localhost:3000..."
    }
  ],
  "meta": {
    "model": "qwen2.5-coder:7b",
    "latencyMs": 3073
  }
### 4. Automated Evaluation Suite (`npm run eval`)
Run the golden evaluation benchmark suite against all API endpoints:

```bash
npm run eval
```

Example report output:

```text
=================================================
 🧪 Applied AI Lab — Evaluation & Benchmark Suite
 Target Server: http://localhost:3000
=================================================

✅ PASS [CHAT] Chat Identity & Grounding (937ms)
✅ PASS [CHAT] Chat Multi-turn History Context (774ms)
✅ PASS [EXTRACT] Valid JSON Extraction (TypeScript Overview) (2636ms)
✅ PASS [RAG] RAG Grounded Query (Port Number) (1641ms)
✅ PASS [RAG] RAG Out-of-Scope Abstention Test (Pancake Recipe) (45ms)

=================================================
 📊 Evaluation Benchmark Results Summary
=================================================
 Total Test Cases: 11
 Passed:           11 ✅
 Failed:           0 ❌
 Pass Rate:        100.0%
 Average Latency:  1267 ms
 Suite Duration:   13948 ms
=================================================
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Failed to get a reply from the model` | Is Ollama running? Try `ollama serve` or open the Ollama app. |
| Model not found / Ollama 404 | Run `ollama pull qwen2.5-coder:7b` (or `ollama pull nomic-embed-text`). |
| `Cannot GET /` on wrong port | Use **http://localhost:3000**, not bare `localhost`. |
| Slow first reply | First request after pull/load can be slow while the model loads into memory. |

---

## Step map

| Step | Focus | Status |
|------|-------|--------|
| 1 | Hello LLM — `POST /chat` | ✅ Done |
| 2 | Ollama + system prompt + validation + latency meta | ✅ Done |
| 3 | Chat UI + multi-turn messages | ✅ Done |
| 4 | Structured JSON extraction (`POST /extract`) | ✅ Done |
| 5 | RAG Docs Q&A with citations (`POST /ask-docs`) | ✅ Done |
| 6 | Automated Evals & Benchmarks (`npm run eval`) | ✅ Done |
| 7+ | Portfolio packaging & deploy — see [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) | ⬜ Todo |
