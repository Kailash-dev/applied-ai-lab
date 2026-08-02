# Applied AI Lab — Troubleshooting Guide

## Common Issues & Solutions

### 1. 502 Bad Gateway Error
- **Symptom:** API returns `Failed to get a reply from the model` or `502 Bad Gateway`.
- **Cause:** Ollama service is not running locally on your machine.
- **Fix:** Ensure Ollama is running. Open the Ollama desktop app or run `ollama serve` in a terminal window.

### 2. Model Not Found (404 Error)
- **Symptom:** Ollama error message `model "qwen2.5-coder:7b" not found`.
- **Cause:** The required model has not been downloaded yet.
- **Fix:** Run `ollama pull qwen2.5-coder:7b` in your terminal. For RAG embeddings, ensure `ollama pull nomic-embed-text` has also been run.

### 3. Slow Initial Responses
- **Symptom:** The first request takes 5-10 seconds to respond.
- **Cause:** Cold start latency. Ollama loads the model parameters into GPU/RAM memory on the first request.
- **Fix:** Subsequent requests will be significantly faster once the model remains cached in memory.

### 4. 422 Unprocessable Entity on Structured JSON Extraction
- **Symptom:** `/extract` endpoint returns HTTP status 422.
- **Cause:** The LLM failed to output valid JSON matching the schema even after an automatic retry attempt.
- **Fix:** Re-run the request or provide cleaner input text.
