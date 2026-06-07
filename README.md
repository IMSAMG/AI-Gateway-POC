# AI Gateway POC

An AI Gateway / Prompt Optimization Platform that sits between applications and LLM providers. Developers send normal chat requests to the gateway; the gateway optimizes context, retrieves relevant knowledge, manages token budgets, routes to an appropriate model tier, and records cost analytics before forwarding the request.

```text
Application
  |
  v
AI Gateway / SDK
  |-- Context Optimizer
  |-- Prompt Compressor
  |-- RAG Retriever
  |-- Conversation Memory
  |-- Token Budget Manager
  |-- Model Router
  |-- Cost Analytics
  v
OpenAI / Claude / Gemini / Local LLM
```

## What is automated

| Framework step | Automated? | Gateway implementation |
| --- | --- | --- |
| Define objective | Partially | `objective` and `taskType` request fields steer prompts and routing |
| Remove redundant context | Yes | `promptCompressor` deduplicates and trims low-value text |
| Chunk information | Yes | `chunker` splits documents for retrieval |
| Summarize history | Yes | `ConversationMemory` keeps recent turns and rolls older turns into a summary |
| Use RAG | Yes | `RagStore` retrieves relevant chunks with lexical vector scoring |
| Model selection | Yes | `modelRouter` routes simple, balanced, and complex tasks |
| Monitor token usage | Yes | `CostAnalytics` records usage, route, and estimated cost |

## Run

Requires Node 20 or newer.

```bash
npm test
npm start
```

The server starts on `http://127.0.0.1:3000` by default. Override with `HOST` and `PORT`.

## API

### Health

```bash
curl http://localhost:3000/health
```

### Add RAG knowledge

```bash
curl -X POST http://localhost:3000/v1/documents \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "routing-guide",
    "title": "Routing Guide",
    "text": "Route simple summarization tasks to smaller models. Use deeper models for architecture, code, and multi-step reasoning."
  }'
```

### Optimized chat

```bash
curl -X POST http://localhost:3000/v1/gateway/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId": "demo",
    "taskType": "analysis",
    "objective": "Help developers choose the lowest-cost capable model",
    "tokenBudget": 2000,
    "prompt": "How should we route a request that asks for architecture tradeoffs?"
  }'
```

### Analytics

```bash
curl http://localhost:3000/v1/analytics
```

### Task templates

```bash
curl http://localhost:3000/v1/task-types
```

### SDK-style usage

```js
import { GatewayClient } from "./src/sdk.js";

const gateway = new GatewayClient();

await gateway.addDocument({
  id: "routing-guide",
  title: "Routing Guide",
  text: "Route simple tasks to smaller models and complex tasks to deeper models."
});

const result = await gateway.chat({
  sessionId: "demo",
  taskType: "analysis",
  prompt: "Which model should handle architecture tradeoffs?"
});
```

## Provider integration

The POC defaults to a `mock` provider, which makes local tests and demos deterministic. The provider boundary is in `src/providers.js`; replace or extend `callProvider` with OpenAI, Claude, Gemini, or local LLM clients.

Model tiers are configured through environment variables:

```bash
SIMPLE_PROVIDER=mock SIMPLE_MODEL=local-fast
BALANCED_PROVIDER=mock BALANCED_MODEL=local-balanced
COMPLEX_PROVIDER=mock COMPLEX_MODEL=local-deep
```

## Project layout

```text
src/
  gateway.js              Pipeline orchestration
  server.js               HTTP API
  contextOptimizer.js     Objective, memory, and RAG context assembly
  promptCompressor.js     Redundancy and low-value text removal
  chunker.js              Document chunking
  rag.js                  In-memory retrieval store
  memory.js               Rolling conversation memory
  tokenBudgetManager.js   Input budget enforcement
  modelRouter.js          Model tier selection
  costAnalytics.js        Usage and cost reporting
  providers.js            Provider abstraction and mock provider
  sdk.js                  Lightweight client for applications
  taskTemplates.js        Objective and budget templates
test/
  gateway.test.js
```
