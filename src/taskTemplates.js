export const TASK_TEMPLATES = {
  general: {
    objective: "Answer the user's request clearly and efficiently.",
    defaultTokenBudget: 4000
  },
  summarize: {
    objective: "Summarize the supplied context with minimal token usage.",
    defaultTokenBudget: 2000
  },
  extract: {
    objective: "Extract structured facts from the supplied context.",
    defaultTokenBudget: 2500
  },
  code: {
    objective: "Help with code using precise reasoning and relevant implementation context.",
    defaultTokenBudget: 6000
  },
  analysis: {
    objective: "Analyze tradeoffs, risks, and recommendations using retrieved context.",
    defaultTokenBudget: 6000
  }
};

export function resolveTaskTemplate(taskType = "general") {
  return TASK_TEMPLATES[taskType] || TASK_TEMPLATES.general;
}
