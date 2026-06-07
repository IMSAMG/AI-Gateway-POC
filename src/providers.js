import { estimateTokens } from "./tokenizer.js";

export async function callProvider({ route, messages }) {
  if (route.provider === "mock") {
    return mockProvider(route, messages);
  }

  return {
    id: `provider_${Date.now()}`,
    model: route.model,
    content: `Provider '${route.provider}' is configured as a pass-through hook. Add the provider client and credentials to call ${route.model}.`,
    usage: {
      inputTokens: estimateTokens(messages),
      outputTokens: 28
    }
  };
}

function mockProvider(route, messages) {
  const userMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  return {
    id: `mock_${Date.now()}`,
    model: route.model,
    content: [
      `[mock:${route.model}]`,
      "Optimized request received.",
      `User intent: ${userMessage.slice(0, 280) || "No user prompt provided."}`
    ].join("\n"),
    usage: {
      inputTokens: estimateTokens(messages),
      outputTokens: 40
    }
  };
}
