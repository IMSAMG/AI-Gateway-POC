import { getConfig } from "./config.js";
import { CostAnalytics } from "./costAnalytics.js";
import { optimizeContext } from "./contextOptimizer.js";
import { ConversationMemory } from "./memory.js";
import { RagStore } from "./rag.js";
import { routeModel } from "./modelRouter.js";
import { enforceTokenBudget } from "./tokenBudgetManager.js";
import { callProvider } from "./providers.js";
import { resolveTaskTemplate } from "./taskTemplates.js";

export class AiGateway {
  constructor({ config = getConfig(), ragStore, memory, analytics } = {}) {
    this.config = config;
    this.rag = ragStore || new RagStore(config.optimization);
    this.memory = memory || new ConversationMemory(config.optimization);
    this.analytics = analytics || new CostAnalytics(config);
  }

  addDocument(document) {
    return this.rag.addDocument(document);
  }

  listDocuments() {
    return this.rag.listDocuments();
  }

  analyticsSummary() {
    return this.analytics.summary();
  }

  async chat(request) {
    const requestId = request.requestId || `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const sessionId = request.sessionId || "default";
    const messages = normalizeMessages(request.messages, request.prompt);
    const taskTemplate = resolveTaskTemplate(request.taskType);
    const query = request.query || messages.at(-1)?.content || "";
    const retrievedContext = request.useRag === false
      ? []
      : this.rag.retrieve(query, { topK: request.ragTopK || this.config.optimization.ragTopK });
    const memoryState = this.memory.get(sessionId);

    const optimizedMessages = optimizeContext({
      messages,
      memory: memoryState,
      retrievedContext,
      objective: request.objective || taskTemplate.objective,
      config: this.config
    });

    const route = routeModel({
      messages: optimizedMessages,
      taskType: request.taskType,
      requestedModel: request.model,
      config: this.config
    });

    const budgeted = enforceTokenBudget(optimizedMessages, {
      tokenBudget: request.tokenBudget || taskTemplate.defaultTokenBudget || this.config.optimization.defaultTokenBudget,
      reserveOutputTokens: request.reserveOutputTokens || this.config.optimization.reserveOutputTokens
    });

    const response = await callProvider({
      route,
      messages: budgeted.messages
    });

    this.memory.append(sessionId, [
      ...messages,
      { role: "assistant", content: response.content }
    ]);

    const analyticsEvent = this.analytics.record({
      requestId,
      sessionId,
      route,
      inputMessages: budgeted.messages,
      outputText: response.content,
      optimizations: {
        retrievedChunks: retrievedContext.length,
        originalMessages: messages.length,
        optimizedMessages: optimizedMessages.length,
        budgetedMessages: budgeted.messages.length,
        tokenBudget: budgeted.usage
      }
    });

    return {
      id: requestId,
      route,
      response,
      optimizations: {
        retrievedContext,
        tokenBudget: budgeted.usage,
        analytics: analyticsEvent
      }
    };
  }
}

function normalizeMessages(messages, prompt) {
  if (Array.isArray(messages) && messages.length) {
    return messages.map((message) => ({
      role: message.role || "user",
      content: String(message.content || "")
    }));
  }

  if (prompt) return [{ role: "user", content: String(prompt) }];
  throw new Error("Request must include either messages[] or prompt.");
}
