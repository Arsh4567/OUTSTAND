export type ReasoningInput = {
  name: string;
  xp: number;
  streak: number;
  dopamineScore: number | null;
  habits: { id: string; name: string }[];
  completedToday: string[];
  focusSessions: number;
};

export type ReasoningResult = {
  state: string;
  observations: string[];
  priorities: string[];
  guardrails: string[];
};

export function buildReasoning(input: ReasoningInput): ReasoningResult {
  const total = input.habits.length;
  const completed = input.habits.filter((h) => input.completedToday.includes(h.id)).length;
  const completion = total ? Math.round((completed / total) * 100) : 0;
  const observations: string[] = [];
  const priorities: string[] = [];

  if (total && completion < 40) observations.push(`Only ${completed}/${total} habits are complete today; avoid adding complexity and recover one small win first.`);
  else if (total && completion >= 80) observations.push(`Habit completion is strong at ${completion}%; preserve momentum instead of overloading the day.`);

  if (input.focusSessions === 0) {
    observations.push("No focus session is logged yet today.");
    priorities.push("Protect one distraction-free focus block before adding more tasks.");
  }

  if (input.dopamineScore !== null) {
    if (input.dopamineScore < 40) observations.push("Today's dopamine score is low; favor a low-friction reset and one concrete action.");
    else if (input.dopamineScore >= 80) observations.push("Today's dopamine score is high; use the current momentum for deliberate execution.");
  }

  if (input.streak === 0) priorities.push("Choose the smallest repeatable action that can restart consistency today.");
  else priorities.push(`Protect the existing ${input.streak}-day streak with one realistic completion.`);

  if (input.xp === 0) observations.push("No XP is recorded in the supplied context; do not assume prior progress.");

  return {
    state: completion >= 70 && input.focusSessions > 0 ? "momentum" : completion < 40 ? "recovery" : "building",
    observations: observations.slice(0, 4),
    priorities: [...new Set(priorities)].slice(0, 3),
    guardrails: [
      "Never invent habits, scores, streaks, deadlines, or personal history.",
      "Do not confuse an observation with a diagnosis.",
      "Recommend one immediate action before a long plan unless the user explicitly asks for planning.",
      "If evidence is insufficient, say what is unknown instead of guessing.",
    ],
  };
}
