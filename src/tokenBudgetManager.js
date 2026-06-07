import { estimateTokens, trimToTokenBudget } from "./tokenizer.js";

export function enforceTokenBudget(messages, { tokenBudget, reserveOutputTokens }) {
  const budget = Math.max(1, tokenBudget - reserveOutputTokens);
  let remaining = budget;
  const kept = [];

  for (const message of [...messages].reverse()) {
    const tokens = estimateTokens(message.content);
    if (tokens <= remaining) {
      kept.push(message);
      remaining -= tokens;
    } else if (remaining > 80 && message.role !== "system") {
      kept.push({
        ...message,
        content: trimToTokenBudget(message.content, remaining)
      });
      remaining = 0;
    }
    if (remaining <= 0) break;
  }

  const finalMessages = kept.reverse();
  return {
    messages: finalMessages,
    usage: {
      estimatedInputTokens: estimateTokens(finalMessages),
      budgetedInputTokens: budget,
      reserveOutputTokens
    }
  };
}
