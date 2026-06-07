export function estimateTokens(value) {
  const text = Array.isArray(value)
    ? value.map((message) => `${message.role || "user"}: ${message.content || ""}`).join("\n")
    : String(value || "");

  if (!text.trim()) return 0;

  const words = text.trim().split(/\s+/).length;
  const chars = Math.ceil(text.length / 4);
  return Math.max(words, chars);
}

export function trimToTokenBudget(text, tokenBudget) {
  const maxChars = Math.max(0, tokenBudget * 4);
  if (String(text).length <= maxChars) return String(text);
  return `${String(text).slice(0, maxChars).trimEnd()}\n[trimmed to fit token budget]`;
}
