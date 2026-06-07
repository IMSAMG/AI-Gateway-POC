import { estimateTokens } from "./tokenizer.js";

export function routeModel({ messages, taskType = "general", requestedModel, config }) {
  if (requestedModel) {
    return {
      tier: "requested",
      provider: requestedModel.provider || "mock",
      model: requestedModel.model || requestedModel
    };
  }

  const text = messages.map((message) => message.content).join("\n");
  const estimatedTokens = estimateTokens(messages);
  const complexityScore = scoreComplexity(text, taskType, estimatedTokens);

  if (complexityScore >= 8) return { tier: "complex", ...config.models.complex };
  if (complexityScore >= 4) return { tier: "balanced", ...config.models.balanced };
  return { tier: "simple", ...config.models.simple };
}

function scoreComplexity(text, taskType, estimatedTokens) {
  let score = estimatedTokens > 2500 ? 5 : estimatedTokens > 1000 ? 3 : 1;
  if (["code", "analysis", "legal", "medical", "finance"].includes(taskType)) score += 3;
  if (/\b(plan|architecture|debug|reason|compare|tradeoff|derive|prove)\b/i.test(text)) score += 2;
  if (/\b(summarize|classify|rewrite|extract)\b/i.test(text)) score -= 1;
  return score;
}
