# HANDOFF — Continue in Antigravity

**For:** next AI coding session (Antigravity)  
**Project:** `applied-ai-lab`  
**Owner goal:** finish Project 1 as a resume-ready GenAI portfolio piece (AI software engineer path)  
**Date:** 2026-08-02

---

## TL;DR for the next agent

1. This is a **local-only** Ollama app (no cloud LLM APIs required).
2. **Project 1, Project 2, and Project 3A are 100% COMPLETE!**
   - Project 1: Multi-turn chat, structured JSON extraction (`/extract`), RAG with citations (`/ask-docs`), automated evals.
   - Project 2: Autonomous ReAct AI Agent with tool suite (`sql_query`, `doc_search`, `calculator`, `get_system_time`), trace UI, and evals (`/api/agent/run`).
   - Project 3A: Real-time token streaming using Server-Sent Events (SSE) on `POST /api/basic/chat/stream`.
3. Stack: TypeScript + Express 5 + Ollama (`qwen2.5-coder:7b` & `nomic-embed-text`) + custom ReAct Agent + custom RAG + SSE Token Streaming + custom Evals.

---

## Repo & git

| Item | Value |
|------|--------|
| Path | `/Users/kailash/Code/personal/learning/Ai-engineering/applied-ai-lab` |
| GitHub | https://github.com/Kailash-dev/applied-ai-lab |
| Branch | `main` |

---


## Progress tracker

| Project | Feature / Endpoint | Status | Description |
|---------|-------------------|--------|-------------|
| **Project 1** | `POST /chat` | ✅ Done | Multi-turn chat & latency observability |
| **Project 1** | `POST /extract` | ✅ Done | Structured JSON extraction with schema repair |
| **Project 1** | `POST /ask-docs` | ✅ Done | RAG over `docs/*.md` with citations & abstention |
| **Project 1** | `npm run eval` | ✅ Done | Automated golden evaluation benchmark suite |
| **Project 2** | `POST /api/agent/run` | ✅ Done | Autonomous ReAct Agent with dynamic tool execution loop |
| **Project 2** | `GET /api/agent/tools` | ✅ Done | Tool registry schema endpoint |
| **Project 3A** | `POST /api/basic/chat/stream` | ✅ Done | Real-time token streaming via Server-Sent Events (SSE) |

---

## Quick verify commands

```bash
# Server
npm run dev

# Real-Time SSE Token Stream
curl -N -s -X POST http://localhost:3000/api/basic/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"message":"Say Hello in 3 words"}'

# Autonomous Agent
curl -X POST http://localhost:3000/api/agent/run \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Find user Kai in database and calculate total order sum."}'

# Evals Benchmark
npm run eval
```

---

*Last updated: Project 1, Project 2 & Project 3A complete.*


