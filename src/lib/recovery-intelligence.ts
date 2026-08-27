export type RecoverySignal = "underestimated" | "overloaded" | "low_consistency" | "late_day_slippage" | "difficulty_spike" | "insufficient_data";

export type RecoveryInput = {
  plannedTasks: number;
  completedTasks: number;
  plannedMinutes: number;
  completedMinutes: number;
  daysObserved: number;
  missedDays: number;
  averageDifficulty: number;
  recentDifficulty: number;
};

export type RecoveryInsight = {
  signal: RecoverySignal;
  title: string;
  explanation: string;
  action: string;
  confidence: "low" | "medium" | "high";
};

export type RecoveryPlan = {
  shouldRecover: boolean;
  summary: string;
  focusTasks: number;
  maxMinutes: number;
  steps: string[];
  primaryInsight: RecoveryInsight;
  insights: RecoveryInsight[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function confidence(daysObserved: number, strength: number): RecoveryInsight["confidence"] {
  if (daysObserved >= 7 && strength >= 0.75) return "high";
  if (daysObserved >= 3 && strength >= 0.45) return "medium";
  return "low";
}

export function buildRecoveryPlan(input: RecoveryInput): RecoveryPlan {
  const plannedTasks = Math.max(0, input.plannedTasks);
  const completedTasks = clamp(input.completedTasks, 0, plannedTasks);
  const plannedMinutes = Math.max(0, input.plannedMinutes);
  const completedMinutes = Math.max(0, input.completedMinutes);
  const daysObserved = Math.max(0, input.daysObserved);
  const missedDays = Math.max(0, input.missedDays);
  const completionRate = plannedTasks ? completedTasks / plannedTasks : 1;
  const minuteRate = plannedMinutes ? completedMinutes / plannedMinutes : 1;
  const difficultyDelta = input.recentDifficulty - input.averageDifficulty;
  const insights: RecoveryInsight[] = [];

  if (daysObserved < 3 || plannedTasks < 3) {
    insights.push({
      signal: "insufficient_data",
      title: "The pattern is still forming",
      explanation: "There is not enough recent execution history to make a strong diagnosis without overfitting to a bad day.",
      action: "Keep the next schedule small and collect a few more clean execution days",
      confidence: "low",
    });
  }

  if (plannedMinutes > 0 && completedMinutes / plannedMinutes < 0.7 && plannedTasks > 0 && completionRate >= 0.7) {
    insights.push({
      signal: "underestimated",
      title: "Time estimates look optimistic",
      explanation: "Task completion is relatively strong, but delivered minutes are lagging the amount of time planned. The workload is likely taking longer than the estimate suggests.",
      action: "Increase future estimates before increasing workload",
      confidence: confidence(daysObserved, 0.78),
    });
  }

  if (plannedTasks >= 4 && completionRate < 0.55) {
    insights.push({
      signal: "overloaded",
      title: "The daily load is too aggressive",
      explanation: "Less than half of planned work is being completed. Adding more tasks would compound the backlog instead of fixing the execution problem.",
      action: "Cut non-essential tasks and protect the top two outcomes",
      confidence: confidence(daysObserved, 0.9),
    });
  }

  if (daysObserved >= 3 && missedDays / daysObserved >= 0.3) {
    insights.push({
      signal: "low_consistency",
      title: "Consistency is the constraint",
      explanation: "A meaningful share of recent days contains little or no completed work, so the schedule needs a lower activation cost before it needs more ambition.",
      action: "Use a minimum viable day with one required outcome",
      confidence: confidence(daysObserved, Math.min(1, missedDays / Math.max(1, daysObserved))),
    });
  }

  if (difficultyDelta >= 1) {
    insights.push({
      signal: "difficulty_spike",
      title: "Recent work is harder than the baseline",
      explanation: "Recent difficulty is materially higher than the observed baseline, which can make otherwise reasonable workloads fail.",
      action: "Sequence one easier warm-up before the hardest required block",
      confidence: confidence(daysObserved, Math.min(1, difficultyDelta / 2)),
    });
  }

  if (!insights.length) {
    insights.push({
      signal: "late_day_slippage",
      title: "No dominant failure pattern yet",
      explanation: "Recent execution does not show a strong single bottleneck. Preserve the current structure and keep collecting signal.",
      action: "Keep the plan stable and review after the next execution cycle",
      confidence: confidence(daysObserved, 0.35),
    });
  }

  const ranked = [...insights].sort((a, b) => {
    const score = (item: RecoveryInsight) => ({ overloaded: 5, low_consistency: 4, underestimated: 3, difficulty_spike: 2, insufficient_data: 1, late_day_slippage: 0 }[item.signal]);
    return score(b) - score(a);
  });
  const primaryInsight = ranked[0];
  const shouldRecover = completionRate < 0.75 || minuteRate < 0.7 || primaryInsight.signal === "low_consistency";
  const focusTasks = shouldRecover ? Math.max(1, Math.min(2, plannedTasks || 1)) : Math.max(1, Math.min(3, plannedTasks || 1));
  const maxMinutes = shouldRecover
    ? Math.max(25, Math.min(120, Math.round((completedMinutes || plannedMinutes || 60) * 0.75 / 5) * 5))
    : Math.max(30, Math.min(150, Math.round((plannedMinutes || 60) * 0.9 / 5) * 5));

  return {
    shouldRecover,
    summary: shouldRecover ? `Recovery mode is recommended: ${primaryInsight.title.toLowerCase()}.` : "Execution is stable enough to keep the current workload.",
    focusTasks,
    maxMinutes,
    steps: shouldRecover
      ? ["Keep only the highest-impact required outcome", `Cap the recovery block at about ${maxMinutes} minutes`, "Defer low-value work instead of carrying it forward unchanged"]
      : ["Keep the current workload", "Protect the next required block", "Re-evaluate after another completed cycle"],
    primaryInsight,
    insights: ranked,
  };
}
