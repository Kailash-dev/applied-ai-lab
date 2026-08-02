# Applied AI Lab — Setup Guide

## Overview
Applied AI Lab is a local-only LLM application built with TypeScript, Express, and Ollama. It does not require any cloud API keys from OpenAI, Anthropic, or Gemini.

## Prerequisites
- Node.js (v18 or higher recommended)
- Ollama installed on your machine (`https://ollama.com`)
- Pulled local models: `qwen2.5-coder:7b` (for chat/extraction) and `nomic-embed-text` (for vector embeddings)

## Installation & Configuration
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Default `.env` settings:
   - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
   - `OLLAMA_MODEL=qwen2.5-coder:7b`
   - `PORT=3000`

## Running the Application
Start the development server:
```bash
npm run dev
```
The server will start and listen on `http://localhost:3000`. You can open this URL in your web browser to access the web chat UI.
