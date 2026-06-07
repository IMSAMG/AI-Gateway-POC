import { estimateTokens } from "./tokenizer.js";

export class CostAnalytics {
  constructor({ pricingUsdPer1kTokens = {} } = {}) {
    this.pricing = pricingUsdPer1kTokens;
    this.events = [];
  }

  record({ requestId, sessionId, route, inputMessages, outputText, optimizations }) {
    const inputTokens = estimateTokens(inputMessages);
    const outputTokens = estimateTokens(outputText);
    const price = this.pricing[route.model] || { input: 0, output: 0 };
    const estimatedCostUsd = roundMoney((inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output);

    const event = {
      requestId,
      sessionId,
      provider: route.provider,
      model: route.model,
      tier: route.tier,
      inputTokens,
      outputTokens,
      estimatedCostUsd,
      optimizations,
      createdAt: new Date().toISOString()
    };
    this.events.push(event);
    return event;
  }

  summary() {
    const total = this.events.reduce(
      (acc, event) => {
        acc.requests += 1;
        acc.inputTokens += event.inputTokens;
        acc.outputTokens += event.outputTokens;
        acc.estimatedCostUsd += event.estimatedCostUsd;
        acc.byModel[event.model] = (acc.byModel[event.model] || 0) + 1;
        return acc;
      },
      { requests: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, byModel: {} }
    );

    return {
      ...total,
      estimatedCostUsd: roundMoney(total.estimatedCostUsd),
      recentEvents: this.events.slice(-20).reverse()
    };
  }
}

function roundMoney(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
