export type IntelligenceMemory = {
  id: string;
  content: string;
  category: "goal" | "preference" | "routine" | "decision" | "insight";
  createdAt: string;
  source: "user" | "assistant";
};

export function normalizeMemory(content: string, category: IntelligenceMemory["category"], source: IntelligenceMemory["source"]): IntelligenceMemory {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `memory-${Date.now()}`,
    content: content.trim().slice(0, 500),
    category,
    createdAt: new Date().toISOString(),
    source,
  };
}
