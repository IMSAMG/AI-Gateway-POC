import assert from "node:assert/strict";
import test from "node:test";
import { AiGateway } from "../src/gateway.js";
import { getConfig } from "../src/config.js";
import { chunkText } from "../src/chunker.js";
import { compressPrompt } from "../src/promptCompressor.js";
import { resolveTaskTemplate } from "../src/taskTemplates.js";

test("chunks documents with overlap-friendly ids", () => {
  const chunks = chunkText("First sentence. ".repeat(160), { chunkSize: 300, chunkOverlap: 50 });
  assert.ok(chunks.length > 1);
  assert.equal(chunks[0].id, "chunk_1");
});

test("compressor removes duplicate and low-value prompt text", () => {
  const compressed = compressPrompt([
    { role: "user", content: "Please summarize this context. Thank you." },
    { role: "user", content: "Please summarize this context. Thank you." }
  ]);

  assert.equal(compressed.length, 1);
  assert.equal(compressed[0].content, "summarize this context.");
});

test("gateway retrieves context, routes model, and records analytics", async () => {
  const gateway = new AiGateway({
    config: getConfig({
      optimization: {
        ragTopK: 2,
        defaultTokenBudget: 1200,
        reserveOutputTokens: 200
      }
    })
  });

  gateway.addDocument({
    id: "pricing",
    title: "Pricing Policy",
    text: "Route simple summarization tasks to cheaper models. Complex architecture tasks use deeper models."
  });

  const result = await gateway.chat({
    sessionId: "abc",
    taskType: "analysis",
    objective: "Choose the right model tier",
    prompt: "How should model routing work for architecture tradeoffs?"
  });

  assert.equal(result.response.model, result.route.model);
  assert.ok(result.optimizations.retrievedContext.length >= 1);
  assert.equal(gateway.analyticsSummary().requests, 1);
});

test("task templates provide objective defaults", () => {
  assert.match(resolveTaskTemplate("analysis").objective, /Analyze tradeoffs/);
  assert.equal(resolveTaskTemplate("unknown").defaultTokenBudget, 4000);
});
