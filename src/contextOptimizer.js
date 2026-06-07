import { compressPrompt } from "./promptCompressor.js";

export function optimizeContext({ messages, memory, retrievedContext, objective, config }) {
  const systemParts = [
    "You are responding through an AI Gateway that optimizes context, cost, and model choice.",
    objective ? `Task objective: ${objective}` : "",
    memory?.summary ? `Conversation summary: ${memory.summary}` : "",
    retrievedContext?.length ? formatRetrievedContext(retrievedContext) : ""
  ].filter(Boolean);

  const optimizedMessages = [
    { role: "system", content: systemParts.join("\n\n") },
    ...(memory?.messages || []),
    ...messages
  ];

  return compressPrompt(optimizedMessages, {
    maxContextChars: config.optimization.maxContextChars
  });
}

function formatRetrievedContext(chunks) {
  return [
    "Retrieved context:",
    ...chunks.map((chunk, index) => `[${index + 1}] ${chunk.title} (${chunk.id}, score ${chunk.score.toFixed(3)}): ${chunk.content}`)
  ].join("\n");
}
