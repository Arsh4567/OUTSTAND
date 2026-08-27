export type AdaptiveStatus = "ahead" | "on_track" | "at_risk" | "recovery";

export type AdaptiveInput = {
  todayRequired: number;
  todayCompleted: number;
  totalRequired: number;
  totalCompleted: number;
  remainingDays: number;
  plannedMinutesToday: number;
  completedMinutesToday: number;
};

export type AdaptiveRecommendation = {
  status: AdaptiveStatus;
  headline: string;
  explanation: string;
  action: string;
  paceRatio: number;
  completionPct: number;
  remainingRequired: number;
  availableDays: number;
};

export function buildAdaptiveRecommendation(input: AdaptiveInput): AdaptiveRecommendation {
  const completionPct = input.totalRequired > 0
    ? Math.round((input.totalCompleted / input.totalRequired) * 100)
    : 0;
  const remainingRequired = Math.max(0, input.totalRequired - input.totalCompleted);
  const planned = Math.max(1, input.plannedMinutesToday);
  const paceRatio = Number((input.completedMinutesToday / planned).toFixed(3));
  const dayCompletion = input.todayRequired > 0 ? input.todayCompleted / input.todayRequired : 1;
  const hasBacklog = input.todayRequired > input.todayCompleted;

  if (input.remainingDays <= 0 && remainingRequired > 0) {
    return {
      status: "recovery",
      headline: "Your plan needs a reset",
      explanation: `${remainingRequired} required task${remainingRequired === 1 ? " remains" : "s remain"} with no planned days left. Protect the highest-value work instead of trying to catch everything at once.`,
      action: "Prioritize the highest-impact remaining work",
      paceRatio,
      completionPct,
      remainingRequired,
      availableDays: 0,
    };
  }

  if (paceRatio >= 1.15 || dayCompletion >= 0.9) {
    return {
      status: "ahead",
      headline: "You're ahead of the route",
      explanation: "Recent execution is stronger than the current plan. Keep the extra capacity rather than automatically filling it with more work.",
      action: "Protect the surplus and pull one high-value task forward",
      paceRatio,
      completionPct,
      remainingRequired,
      availableDays: input.remainingDays,
    };
  }

  if (paceRatio < 0.55 || (hasBacklog && dayCompletion < 0.5)) {
    return {
      status: "at_risk",
      headline: "The route is drifting",
      explanation: "Today's execution is materially below the planned pace. A smaller, focused schedule is more likely to recover momentum than adding more pressure.",
      action: "Reduce low-priority load and protect the next required task",
      paceRatio,
      completionPct,
      remainingRequired,
      availableDays: input.remainingDays,
    };
  }

  return {
    status: "on_track",
    headline: "You're on track",
    explanation: "Your recent execution is close to the pace the roadmap expects. Keep the next required block protected and review again after today's work.",
    action: "Keep the current plan and protect the next block",
    paceRatio,
    completionPct,
    remainingRequired,
    availableDays: input.remainingDays,
  };
}
