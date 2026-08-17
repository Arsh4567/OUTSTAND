export type AppContext = {
  habits: { completed: boolean }[];
  xp: number;
  streak: number;
  dopamineScore?: number | null;
  focusSessions: number;
};

export type IntelligenceSignal = {
  id: string;
  label: string;
  detail: string;
  tone: "positive" | "attention" | "neutral";
};

export type IntelligenceSnapshot = {
  generatedAt: string;
  signals: IntelligenceSignal[];
  priorities: string[];
  summary: string;
};

export function buildIntelligenceSnapshot(context: AppContext): IntelligenceSnapshot {
  const completed = context.habits.filter((habit) => habit.completed).length;
  const total = context.habits.length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const signals: IntelligenceSignal[] = [];

  if (context.xp > 0) {
    signals.push({ id: "xp", label: "Momentum", detail: `${context.xp} XP earned so far.`, tone: "positive" });
  }
  if (context.streak > 0) {
    signals.push({ id: "streak", label: "Consistency", detail: `${context.streak}-day streak is active.`, tone: "positive" });
  }
  if (total > 0) {
    signals.push({ id: "habits", label: "Habits", detail: `${completed}/${total} habits completed today (${completionRate}%).`, tone: completionRate >= 70 ? "positive" : "attention" });
  }
  if (context.dopamineScore !== null && context.dopamineScore !== undefined) {
    signals.push({ id: "dopamine", label: "Dopamine", detail: `Today's score is ${context.dopamineScore}.`, tone: context.dopamineScore >= 70 ? "positive" : "attention" });
  }
  if (context.focusSessions > 0) {
    signals.push({ id: "focus", label: "Focus", detail: `${context.focusSessions} focus session${context.focusSessions === 1 ? "" : "s"} logged today.`, tone: "positive" });
  }

  const priorities = [
    ...(completionRate < 70 && total ? ["Complete one small unfinished habit before adding another goal."] : []),
    ...(context.focusSessions === 0 ? ["Protect one uninterrupted focus block today."] : []),
    ...(context.streak === 0 ? ["Establish a small repeatable action to start momentum."] : []),
  ].slice(0, 3);

  return {
    generatedAt: new Date().toISOString(),
    signals,
    priorities,
    summary: priorities[0] ?? "Momentum looks healthy. Keep the next action small and deliberate.",
  };
}
