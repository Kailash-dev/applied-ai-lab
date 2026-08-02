# Applied AI Lab — System Architecture

## Architecture Overview
The application consists of a TypeScript Express server backend (`src/server.ts`) and a vanilla HTML/JS frontend (`public/index.html`).

```
Browser (UI) ---> Express Server ---> Ollama HTTP API (127.0.0.1:11434)
```

## API Endpoints
1. `POST /chat`: Multi-turn conversational chat. Accepts `{ messages: Array<{role, content}> }` or `{ message: string }`.
2. `POST /extract`: Structured JSON extraction. Accepts `{ text: string }` and returns `{ data: { title, summary, tags } }`.
3. `POST /ask-docs`: Retrieval-Augmented Generation (RAG). Accepts `{ question: string }` and returns answer grounded in documentation with citations.

## Request Guardrails & Limits
- Maximum message length: 4,000 characters per request.
- Maximum conversation turns: 40 messages per thread.
- Input validation: All endpoints validate input server-side before making LLM model calls.

## Observability & Metadata
Every successful API response includes metadata (`meta`):
- `meta.model`: The exact model ID used by the backend.
- `meta.latencyMs`: Total execution time in milliseconds.
