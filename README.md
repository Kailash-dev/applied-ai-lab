# Applied AI Lab 🤖⚡

> A production-minded **Local GenAI Application** built with **TypeScript**, **Express**, **Ollama**, **Vector Search**, and **Automated Evals**. Zero cloud API keys required.

---

## 💡 Overview & Engineering Objectives

**Applied AI Lab** is a full-stack, local-only AI application built to showcase enterprise-grade AI software engineering patterns:
* **No Cloud API Keys / 100% Local:** Runs models (`qwen2.5-coder:7b` & `nomic-embed-text`) locally via [Ollama](https://ollama.com).
* **Defensive Guardrails & Validation:** Input validation (character & thread limits) executed *before* passing tokens to model inference.
* **Structured JSON Extraction with Auto-Repair:** Enforces machine-readable JSON matching strict TypeScript schemas with 1-turn auto-retry error correction.
* **Retrieval-Augmented Generation (RAG):** Document chunking, vector embedding search via **Cosine Similarity**, source citations (`[Doc 1]`), and 70ms fast abstention when confidence is low.
* **Programmatic Quality Benchmarking (Evals):** Automated test runner (`npm run eval`) asserting schema accuracy, citation correctness, abstention behavior, and latency metrics across a 11-case golden dataset.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│               Browser UI (public/index.html)           │
│           (Chat / JSON Extractor / RAG Docs Q&A)       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST (/api/basic/*)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Express Backend (src/server.ts)            │
│  - Input Validation & Limits (src/validators/)         │
│  - Modular API Router (src/routes/basic.route.ts)      │
└───────────────┬─────────────────────────┬──────────────┘
                │                         │
                ▼                         ▼
┌───────────────────────────────┐ ┌───────────────────────────────────┐
│     Chat & JSON Extraction    │ │       RAG & Vector Search         │
│         (src/chat.ts)         │ │         (src/rag/*)               │
│ - System Identity Grounding   │ │ - Document Paragraph Chunker      │
│ - Ollama format: "json"       │ │ - nomic-embed-text Vector Store   │
│ - 1-Turn Auto-Retry Loop      │ │ - Cosine Similarity (Threshold 0.5)│
└───────────────┬───────────────┘ └─────────────────┬─────────────────┘
                │                                   │
                └─────────────────┬─────────────────┘
                                  │ HTTP API (127.0.0.1:11434)
                                  ▼
┌────────────────────────────────────────────────────────┐
│                 Local Ollama Engine                    │
│      (qwen2.5-coder:7b  &  nomic-embed-text)           │
└────────────────────────────────────────────────────────┘
```

---

## ⚙️ Tech Stack

| Component | Technology | Role |
|-----------|------------|------|
| **Backend Framework** | Express 5, TypeScript | Server routing, middleware, input validation |
| **Local LLM Engine** | Ollama (`qwen2.5-coder:7b`) | Text generation & structured JSON extraction |
| **Vector Embeddings** | Ollama (`nomic-embed-text`) | 768-dimensional semantic text embeddings |
| **Vector Database** | Custom In-Memory VectorStore | Chunk indexing & Cosine Similarity search ($\ge 0.50$) |
| **Frontend UI** | Vanilla HTML5 / CSS3 / JS | Single-page tabbed UI with source citation rendering |
| **Automated Testing** | Custom TS Eval Framework | Golden dataset benchmarks (`npm run eval`) |

---

## 🚀 Quick Start

### 1. Prerequisites (Install Ollama)
Download and install from [ollama.com](https://ollama.com). Pull the required models:

```bash
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text
```

### 2. Configure & Install
```bash
cd applied-ai-lab
npm install
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
# Server running at http://localhost:3000
```
Open **`http://localhost:3000`** in your browser to access the interactive web interface.

---

## 🧪 API Specifications & Examples

### 1. Multi-turn Chat (`POST /api/basic/chat`)
```bash
curl -X POST http://localhost:3000/api/basic/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"My name is Kai"},{"role":"assistant","content":"Hi Kai!"},{"role":"user","content":"What is my name?"}]}'
```

### 2. Structured JSON Extraction (`POST /api/basic/extract`)
```bash
curl -X POST http://localhost:3000/api/basic/extract \
  -H 'Content-Type: application/json' \
  -d '{"text":"TypeScript is a typed superset of JavaScript that compiles to plain JavaScript."}'
```
*Returns strict JSON matching schema `{ title, summary, tags }`.*

### 3. Docs Q&A with Citations (`POST /api/basic/ask-docs`)
```bash
curl -X POST http://localhost:3000/api/basic/ask-docs \
  -H 'Content-Type: application/json' \
  -d '{"question":"What port does the server run on?"}'
```
*Returns answer grounded in `docs/*.md` with source citations `[Doc 1]`.*

---

## 📊 Evaluation & Quality Benchmarks

Run the automated evaluation suite against a 11-case golden dataset:

```bash
npm run eval
```

**Benchmark Output (100.0% Pass Rate):**

```text
=================================================
 🧪 Applied AI Lab — Evaluation & Benchmark Suite
 Target Server: http://localhost:3000
=================================================

✅ PASS [CHAT] Chat Identity & Grounding (937ms)
✅ PASS [CHAT] Chat Multi-turn History Context (774ms)
✅ PASS [CHAT] Chat Input Validation (Empty Message) (4ms)
✅ PASS [EXTRACT] Valid JSON Extraction (TypeScript Overview) (2636ms)
✅ PASS [EXTRACT] Valid JSON Extraction (Ollama AI Tool) (3243ms)
✅ PASS [EXTRACT] Extract Input Validation (Missing Text) (3ms)
✅ PASS [RAG] RAG Grounded Query (Port Number) (1641ms)
✅ PASS [RAG] RAG Grounded Query (502 Error Fix) (2248ms)
✅ PASS [RAG] RAG Grounded Query (Architecture Endpoints) (2380ms)
✅ PASS [RAG] RAG Out-of-Scope Abstention Test (Pancake Recipe) (45ms)
✅ PASS [RAG] RAG Out-of-Scope Abstention Test (Weather) (31ms)

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

## 🧠 Key Engineering Decisions & Interview Talking Points

1. **Model Self-Reporting vs. Server Truth:**
   * *Problem:* LLMs frequently hallucinate their own identity (e.g. claiming to be Claude or ChatGPT).
   * *Solution:* Never trust LLM self-reports. Attach authoritative server metadata (`meta.model`) and ground runtime identity in system prompts.

2. **Parsing & Auto-Repair Loops:**
   * *Problem:* Probabilistic models occasionally produce minor JSON syntax errors.
   * *Solution:* Validate responses server-side against a TypeScript schema. If validation fails, execute 1 automatic retry passing the parse error feedback to the model.

3. **Hallucination Prevention & Fast Abstention:**
   * *Problem:* RAG systems can hallucinate if forced to answer questions outside document scope.
   * *Solution:* Compute Cosine Similarity against vector embeddings. If no document chunk exceeds the `0.50` relevance threshold, immediately abstain in ~70ms without an LLM call.

---

## 📜 Roadmap & Completion Status

See **[PROJECT-GUIDE.md](./PROJECT-GUIDE.md)** for full roadmap details.

- [x] **Step 1:** Hello LLM — `POST /chat`
- [x] **Step 2:** Ollama + system prompt + validation + latency meta
- [x] **Step 3:** Chat UI + multi-turn messages
- [x] **Step 4:** Structured JSON extraction (`POST /extract`)
- [x] **Step 5:** RAG Docs Q&A with citations (`POST /ask-docs`)
- [x] **Step 6:** Automated Evals & Benchmarks (`npm run eval`)
- [x] **Step 7:** Portfolio packaging & documentation polish
