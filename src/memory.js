export class ConversationMemory {
  constructor({ maxHistoryMessages = 12 } = {}) {
    this.maxHistoryMessages = maxHistoryMessages;
    this.sessions = new Map();
  }

  get(sessionId = "default") {
    return this.sessions.get(sessionId) || { summary: "", messages: [] };
  }

  append(sessionId = "default", messages = []) {
    const current = this.get(sessionId);
    const nextMessages = current.messages.concat(messages);
    const overflow = Math.max(0, nextMessages.length - this.maxHistoryMessages);
    let summary = current.summary;

    if (overflow > 0) {
      const compacted = nextMessages.splice(0, overflow);
      summary = summarizeMessages(summary, compacted);
    }

    const next = { summary, messages: nextMessages };
    this.sessions.set(sessionId, next);
    return next;
  }
}

export function summarizeMessages(existingSummary, messages) {
  const facts = messages
    .map((message) => `${message.role || "user"}: ${String(message.content || "").replace(/\s+/g, " ").slice(0, 220)}`)
    .join(" | ");

  return [existingSummary, facts].filter(Boolean).join(" | ").slice(-3000);
}
