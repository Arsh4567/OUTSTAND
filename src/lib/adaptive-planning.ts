export type AdaptiveStatus = "ahead" | "on_track" | "at_risk" | "recovery";

export type AdaptiveInput = {
  elapsedDays: number;
  totalDays: number;
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
  expectedCompletionPct: number;
  variancePct: number;
  remainingRequired: number;
  availableDays: number;
  confidence: "high" | "medium" | "low";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildAdaptiveRecommendation(input: AdaptiveInput): AdaptiveRecommendation {
  const totalRequired = Math.max(0, input.totalRequired);
  const totalCompleted = clamp(input.totalCompleted, 0, totalRequired);
  const elapsedDays = clamp(input.elapsedDays, 0, Math.max(1, input.totalDays));
  const totalDays = Math.max(1, input.totalDays);
  const remainingDays = Math.max(0, input.remainingDays);
  const completionPct = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 100;
  const expectedCompletionPct = Math.round((elapsedDays / totalDays) * 100);
  const variancePct = completionPct - expectedCompletionPct;
  const remainingRequired = Math.max(0, totalRequired - totalCompleted);
  const plannedMinutes = Math.max(1, input.plannedMinutesToday);
  const completedMinutes = Math.max(0, input.completedMinutesToday);
  const paceRatio = Number((completedMinutes / plannedMinutes).toFixed(3));
  const todayRatio = input.todayRequired > 0 ? clamp(input.todayCompleted / input.todayRequired, 0, 1) : 1;

  let confidence: AdaptiveRecommendation["confidence"] = "low";
  if (totalRequired >= 8 && elapsedDays >= 3) confidence = "high";
  else if (totalRequired >= 4 || elapsedDays >= 2) confidence = "medium";

  if (remainingRequired === 0) {
    return { status: "ahead", headline: "The roadmap is complete", explanation: "All required roadmap work is finished. Protect the result instead of manufacturing extra work.", action: "Close the loop and review what created the strongest progress", paceRatio, completionPct, expectedCompletionPct, variancePct, remainingRequired, availableDays: remainingDays, confidence };
  }

  if (remainingDays === 0) {
    return { status: "recovery", headline: "The deadline needs a recovery move", explanation: `${remainingRequired} required task${remainingRequired === 1 ? " remains" : "s remain"} with no planned days left. Preserve the highest-impact outcome first and explicitly drop low-value work.`, action: "Rebuild the remaining work around the highest-impact outcome", paceRatio, completionPct, expectedCompletionPct, variancePct, remainingRequired, availableDays: 0, confidence: confidence === "low" ? "medium" : confidence };
  }

  const requiredPerRemainingDay = remainingRequired / remainingDays;
  const healthyDailyLoad = totalRequired / totalDays;

  if (variancePct >= 8 && (paceRatio >= 0.9 || todayRatio >= 0.8)) {
    return { status: "ahead", headline: "You're ahead of the route", explanation: `Execution is ${Math.abs(variancePct)} points ahead of the pace implied by the roadmap timeline. Use that margin to reduce future pressure, not to add work automatically.`, action: requiredPerRemainingDay <= healthyDailyLoad ? "Protect the buffer and pull one high-value task forward" : "Protect the buffer and keep the next block focused", paceRatio, completionPct, expectedCompletionPct, variancePct, remainingRequired, availableDays: remainingDays, confidence };
  }

  if (variancePct <= -15 || paceRatio < 0.6 || (input.todayRequired > input.todayCompleted && todayRatio < 0.5)) {
    return { status: "at_risk", headline: "The route is drifting", explanation: `Current completion is ${Math.abs(variancePct)} points behind the roadmap's expected pace. The safest response is to narrow the workload before the backlog compounds.`, action: `Protect the next required block and cap today's load near ${Math.max(1, Math.ceil(requiredPerRemainingDay))} core task${Math.ceil(requiredPerRemainingDay) === 1 ? "" : "s"}`, paceRatio, completionPct, expectedCompletionPct, variancePct, remainingRequired, availableDays: remainingDays, confidence };
  }

  return { status: "on_track", headline: "You're on track", explanation: `Completion is within a healthy range of the roadmap's expected pace, with ${remainingRequired} required task${remainingRequired === 1 ? "" : "s"} left across ${remainingDays} day${remainingDays === 1 ? "" : "s"}.`, action: "Keep the current plan and protect the next required block", paceRatio, completionPct, expectedCompletionPct, variancePct, remainingRequired, availableDays: remainingDays, confidence };
}
