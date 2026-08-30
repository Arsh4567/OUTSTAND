export type GoalSpec = {
  outcome: string;
  metric: string;
  target: string;
  baseline?: string;
  deadline?: string | null;
  constraints?: string[];
};

export type BackwardPlan = {
  outcome: GoalSpec;
  capabilities: Array<{
    name: string;
    reason: string;
    priority: "critical" | "important" | "supporting";
  }>;
  milestones: Array<{
    day: number;
    title: string;
    outcome: string;
    prerequisiteCapabilities: string[];
    taskFocus: string;
  }>;
};

const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export function validateBackwardPlan(plan: unknown, durationDays: number): BackwardPlan {
  if (!plan || typeof plan !== "object") throw new Error("A backward plan is required.");
  const source = plan as any;
  const outcome = source.outcome;
  if (!outcome || typeof outcome !== "object") throw new Error("The backward plan must include its measurable outcome.");
  const normalizedOutcome: GoalSpec = {
    outcome: clean(outcome.outcome, 500),
    metric: clean(outcome.metric, 160),
    target: clean(outcome.target, 160),
    baseline: clean(outcome.baseline || "unknown", 160) || "unknown",
    deadline: clean(outcome.deadline, 40) || null,
    constraints: Array.isArray(outcome.constraints) ? outcome.constraints.map((v: unknown) => clean(v, 200)).filter(Boolean).slice(0, 10) : [],
  };
  if (normalizedOutcome.outcome.length < 5 || normalizedOutcome.metric.length < 2 || !normalizedOutcome.target) {
    throw new Error("The backward plan contains an incomplete measurable outcome.");
  }

  const capabilities = Array.isArray(source.capabilities) ? source.capabilities : [];
  if (!capabilities.length) throw new Error("The backward plan must identify the capabilities required to reach the outcome.");
  const normalizedCapabilities = capabilities.slice(0, 20).map((capability: any) => ({
    name: clean(capability?.name, 120),
    reason: clean(capability?.reason, 400),
    priority: capability?.priority === "critical" || capability?.priority === "important" ? capability.priority : "supporting",
  })).filter((capability: any) => capability.name && capability.reason);
  if (!normalizedCapabilities.length) throw new Error("The backward plan contains no usable capabilities.");

  const milestones = Array.isArray(source.milestones) ? source.milestones : [];
  if (!milestones.length) throw new Error("The backward plan must contain milestones.");
  const normalizedMilestones = milestones.slice(0, durationDays).map((milestone: any, index: number) => ({
    day: Math.max(1, Math.min(durationDays, Number(milestone?.day) || index + 1)),
    title: clean(milestone?.title, 160),
    outcome: clean(milestone?.outcome, 500),
    prerequisiteCapabilities: Array.isArray(milestone?.prerequisiteCapabilities) ? milestone.prerequisiteCapabilities.map((v: unknown) => clean(v, 120)).filter(Boolean).slice(0, 10) : [],
    taskFocus: clean(milestone?.taskFocus, 500),
  })).filter((milestone: any) => milestone.title && milestone.outcome && milestone.taskFocus);
  if (!normalizedMilestones.length) throw new Error("The backward plan contains no usable milestones.");

  const capabilityNames = new Set(normalizedCapabilities.map((capability) => capability.name.toLowerCase()));
  for (const milestone of normalizedMilestones) {
    if (milestone.prerequisiteCapabilities.some((name) => !capabilityNames.has(name.toLowerCase()))) {
      throw new Error(`Milestone “${milestone.title}” references an unknown prerequisite capability.`);
    }
  }

  normalizedMilestones.sort((a, b) => a.day - b.day);
  return { outcome: normalizedOutcome, capabilities: normalizedCapabilities, milestones: normalizedMilestones };
}

export function buildBackwardPlanningInstructions(): string {
  return [
    "Plan backward from the measurable outcome, never forward from a list of generic activities.",
    "First identify the capabilities that must exist for the target outcome to be possible.",
    "Mark each capability critical, important, or supporting and explain why it matters.",
    "Order milestones by prerequisite dependency: foundations before advanced work, knowledge before application, practice before performance checks when appropriate.",
    "Every milestone must state the capability prerequisites it depends on and a concrete task focus.",
    "Do not invent prerequisites that are irrelevant to the domain. If the baseline already demonstrates a capability, do not spend the roadmap relearning it without a reason.",
    "Use the deadline and available time to decide how much capability can realistically be developed; flag an unrealistic target instead of pretending it is feasible.",
    "The final milestone must point directly at the measurable target and include a verification/performance check where appropriate.",
  ].join(" ");
}
