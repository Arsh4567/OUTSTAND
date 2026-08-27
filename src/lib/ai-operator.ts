export type OperatorIntent =
  | "status"
  | "next_action"
  | "focus_plan"
  | "lighter_day"
  | "deadline"
  | "recovery"
  | "roadmap_review";

export type OperatorContext = {
  name?: string;
  roadmap?: {
    title?: string;
    goal?: string;
    day?: number;
    totalDays?: number;
    daysLeft?: number;
    completionPct?: number;
    todayCompleted?: number;
    todayRequired?: number;
    nextTaskTitle?: string;
  } | null;
  adaptive?: {
    status?: string;
    paceRatio?: number;
    variancePct?: number;
    confidence?: string;
    recommendation?: string;
  } | null;
  recovery?: {
    shouldRecover?: boolean;
    signal?: string;
    confidence?: string;
    action?: string;
  } | null;
};

export type OperatorDecision = {
  intent: OperatorIntent;
  confidence: "low" | "medium" | "high";
  requiresConfirmation: boolean;
  title: string;
  summary: string;
  action?: string;
};

const rules: Array<[OperatorIntent, RegExp]> = [
  ["lighter_day", /\b(make|keep|plan|schedule).{0,20}\b(lighter|light)\b|\blighter\s+(day|schedule)\b/i],
  ["focus_plan", /\bfocus\s+plan\b|\bplan\s+(my|the)?\s*(next|today)\b/i],
  ["next_action", /\bwhat\s+should\s+i\s+do\s+next\b|\bnext\s+task\b|\bwhat's\s+next\b/i],
  ["deadline", /\bdeadline\b|\bdays?\s+left\b|\bon\s+track\b/i],
  ["recovery", /\brecover\b|\bfalling\s+behind\b|\bbehind\b|\breset\b/i],
  ["roadmap_review", /\broadmap\b|\bplan\b|\bprogress\b/i],
  ["status", /\bhow\s+(am|is)\s+i\b|\bstatus\b|\bprogress\b|\bdoing\b/i],
];

export function inferOperatorDecision(message: string, context: OperatorContext): OperatorDecision | null {
  const text = message.trim();
  if (!text) return null;
  const match = rules.find(([, pattern]) => pattern.test(text));
  if (!match) return null;

  const [intent] = match;
  const roadmap = context.roadmap;

  if (intent === "lighter_day") {
    return {
      intent,
      confidence: "high",
      requiresConfirmation: true,
      title: "Make tomorrow lighter",
      summary: "I can reduce tomorrow to the highest-value work and protect recovery time.",
      action: "rebalance_tomorrow",
    };
  }

  if (intent === "focus_plan") {
    return {
      intent,
      confidence: roadmap?.nextTaskTitle ? "high" : "medium",
      requiresConfirmation: false,
      title: "Focus plan",
      summary: roadmap?.nextTaskTitle ? `Start with ${roadmap.nextTaskTitle}. Protect one focused block before taking on anything else.` : "Choose one high-value task and protect a single uninterrupted block.",
    };
  }

  if (intent === "next_action") {
    return {
      intent,
      confidence: roadmap?.nextTaskTitle ? "high" : "medium",
      requiresConfirmation: false,
      title: "Next best action",
      summary: roadmap?.nextTaskTitle ? `Your next best move is ${roadmap.nextTaskTitle}.` : "Open the roadmap and choose the first unfinished required task.",
    };
  }

  if (intent === "deadline") {
    const days = typeof roadmap?.daysLeft === "number" ? roadmap.daysLeft : null;
    const completion = typeof roadmap?.completionPct === "number" ? roadmap.completionPct : null;
    return {
      intent,
      confidence: days !== null || completion !== null ? "high" : "medium",
      requiresConfirmation: false,
      title: "Roadmap status",
      summary: days !== null && completion !== null ? `${completion}% complete with ${days} days left.` : "Your roadmap timing is available from the roadmap view.",
    };
  }

  if (intent === "recovery") {
    const shouldRecover = context.recovery?.shouldRecover;
    return {
      intent,
      confidence: context.recovery?.confidence === "high" ? "high" : "medium",
      requiresConfirmation: Boolean(shouldRecover),
      title: shouldRecover ? "Recovery protocol" : "Recovery check",
      summary: context.recovery?.action || "Review missed work and protect the smallest useful next step.",
      action: shouldRecover ? "apply_recovery" : undefined,
    };
  }

  if (intent === "roadmap_review") {
    return {
      intent,
      confidence: "high",
      requiresConfirmation: false,
      title: "Roadmap review",
      summary: roadmap?.title ? `${roadmap.title} is your current route. Use the adaptive signals to decide whether to protect, rebalance, or recover.` : "Open the roadmap to review the current route and its adaptive signals.",
    };
  }

  return {
    intent: "status",
    confidence: "medium",
    requiresConfirmation: false,
    title: "Current state",
    summary: roadmap?.completionPct !== undefined ? `Your roadmap is ${roadmap.completionPct}% complete.` : "I can summarize your current execution state from the app context.",
  };
}
