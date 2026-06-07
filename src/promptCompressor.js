const LOW_VALUE_PATTERNS = [
  /\b(thanks|thank you|please|kindly)\b/gi,
  /\b(as mentioned earlier|like i said|for your information)\b/gi
];

export function compressPrompt(messages, { maxContextChars = 12000 } = {}) {
  const seen = new Set();
  const compressed = [];

  for (const message of messages) {
    const content = normalizeContent(message.content || "");
    const signature = `${message.role || "user"}:${content.toLowerCase()}`;
    if (!content || seen.has(signature)) continue;

    seen.add(signature);
    compressed.push({
      ...message,
      content
    });
  }

  return trimMessagesByCharacters(compressed, maxContextChars);
}

function normalizeContent(content) {
  let out = String(content).replace(/\s+/g, " ").trim();
  for (const pattern of LOW_VALUE_PATTERNS) {
    out = out.replace(pattern, "");
  }
  return out
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.,!?;:]){2,}/g, "$1")
    .trim();
}

function trimMessagesByCharacters(messages, maxChars) {
  let used = 0;
  const kept = [];

  for (const message of [...messages].reverse()) {
    const size = String(message.content || "").length;
    if (used + size <= maxChars) {
      kept.push(message);
      used += size;
    }
  }

  return kept.reverse();
}
