# applied-ai-lab

Step-by-step Applied AI learning lab.

**Current:** Step 3 — chat UI + multi-turn messages. See **[PROJECT-GUIDE.md](./PROJECT-GUIDE.md)** for the full learning roadmap, job-ready checklist, and steps 4–7.

## Prerequisites

- [Ollama](https://ollama.com) running
- A pulled model, e.g. `ollama pull qwen2.5-coder:7b`

## Setup

```bash
cd applied-ai-lab
npm install
cp .env.example .env   # optional — defaults work for local Ollama
```

## Run

```bash
npm run dev
```

## Try it

1. Open **http://localhost:3000** for the chat UI.
2. Or call the API:

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

## Step map

| Step | Focus |
|------|--------|
| 1 | Hello LLM — `POST /chat` |
| 2 | Ollama + system prompt + validation + latency meta |
| 3 | Chat UI + multi-turn messages |
| 4+ | Structured JSON, grounding, RAG, evals — see [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) |
