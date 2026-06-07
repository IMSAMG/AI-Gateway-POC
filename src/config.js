export const DEFAULT_CONFIG = {
  server: {
    host: process.env.HOST || "127.0.0.1",
    port: Number(process.env.PORT || 3000)
  },
  optimization: {
    maxContextChars: Number(process.env.MAX_CONTEXT_CHARS || 12000),
    maxHistoryMessages: Number(process.env.MAX_HISTORY_MESSAGES || 12),
    chunkSize: Number(process.env.CHUNK_SIZE || 900),
    chunkOverlap: Number(process.env.CHUNK_OVERLAP || 120),
    ragTopK: Number(process.env.RAG_TOP_K || 4),
    defaultTokenBudget: Number(process.env.DEFAULT_TOKEN_BUDGET || 4000),
    reserveOutputTokens: Number(process.env.RESERVE_OUTPUT_TOKENS || 700)
  },
  models: {
    simple: {
      provider: process.env.SIMPLE_PROVIDER || "mock",
      model: process.env.SIMPLE_MODEL || "local-fast"
    },
    balanced: {
      provider: process.env.BALANCED_PROVIDER || "mock",
      model: process.env.BALANCED_MODEL || "local-balanced"
    },
    complex: {
      provider: process.env.COMPLEX_PROVIDER || "mock",
      model: process.env.COMPLEX_MODEL || "local-deep"
    }
  },
  pricingUsdPer1kTokens: {
    "local-fast": { input: 0, output: 0 },
    "local-balanced": { input: 0, output: 0 },
    "local-deep": { input: 0, output: 0 },
    "gpt-4.1-mini": { input: 0.0004, output: 0.0016 },
    "gpt-4.1": { input: 0.002, output: 0.008 },
    "claude-3-5-haiku": { input: 0.0008, output: 0.004 },
    "gemini-1.5-flash": { input: 0.00035, output: 0.00105 }
  }
};

export function getConfig(overrides = {}) {
  return merge(DEFAULT_CONFIG, overrides);
}

function merge(base, overrides) {
  const out = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = merge(base[key] || {}, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
