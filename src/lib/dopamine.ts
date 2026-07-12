export type PositiveKey =
  | "pomodoro"
  | "outstand"
  | "workout"
  | "read"
  | "all_habits"
  | "water"
  | "sleep_on_time"
  | "journal"
  | "meditation";

export type NegativeKey =
  | "scrolling"
  | "broke_focus"
  | "skipped_habits"
  | "slept_late"
  | "missed_reflection";

export const POSITIVES: { key: PositiveKey; label: string; emoji: string; points: number; description: string }[] = [
  { key: "pomodoro", label: "Completed Pomodoro", emoji: "🍅", points: 20, description: "A finished focus session" },
  { key: "outstand", label: "Outstand Challenge", emoji: "⚡", points: 15, description: "Ten minutes of intentional growth" },
  { key: "workout", label: "Workout", emoji: "🏋️", points: 15, description: "Move your body, wire your brain" },
  { key: "read", label: "Read a book", emoji: "📚", points: 10, description: "Any length counts" },
  { key: "all_habits", label: "All habits done", emoji: "✅", points: 10, description: "Completed every habit today" },
  { key: "water", label: "Enough water", emoji: "💧", points: 10, description: "At least 2L" },
  { key: "sleep_on_time", label: "Slept on time", emoji: "🌙", points: 20, description: "Before your target bedtime" },
  { key: "journal", label: "Journal entry", emoji: "📓", points: 10, description: "Even a few sentences" },
  { key: "meditation", label: "Meditation", emoji: "🧘", points: 10, description: "5+ minutes of stillness" },
];

export const NEGATIVES: { key: NegativeKey; label: string; emoji: string; points: number; description: string }[] = [
  { key: "scrolling", label: "Excessive scrolling", emoji: "📱", points: -25, description: "Doom-scroll spiral" },
  { key: "broke_focus", label: "Broke focus session", emoji: "💥", points: -20, description: "Abandoned a Pomodoro" },
  { key: "skipped_habits", label: "Skipped all habits", emoji: "🚫", points: -15, description: "None checked off" },
  { key: "slept_late", label: "Slept very late", emoji: "🌒", points: -15, description: "Past 2am" },
  { key: "missed_reflection", label: "Missed reflection", emoji: "🌫️", points: -10, description: "No end-of-day check-in" },
];

const BASE = 50;

export function computeScore(positives: string[], negatives: string[]): number {
  let s = BASE;
  for (const k of positives) s += POSITIVES.find((p) => p.key === k)?.points ?? 0;
  for (const k of negatives) s += NEGATIVES.find((n) => n.key === k)?.points ?? 0;
  return Math.max(0, Math.min(100, s));
}
export function scoreColor(score: number): { hex: string; label: string; tone: "danger" | "warn" | "good" } {
  // Clamp the score to 0-100 to prevent weird colors
  const s = Math.max(0, Math.min(100, score));
  
  if (s >= 70) return { hex: "oklch(0.74 0.17 155)", label: "Recovering well", tone: "good" };
  if (s >= 40) return { hex: "oklch(0.82 0.16 80)", label: "Rebuilding", tone: "warn" };
  return { hex: "oklch(0.65 0.22 25)", label: "Depleted", tone: "danger" };
}



export function generateInsights(
  positives: string[],
  negatives: string[],
  score: number,
): string[] {
  const out: string[] = [];
  const has = (k: string, arr: string[]) => arr.includes(k);

  if (has("pomodoro", positives)) out.push("You held your attention through a focus session — a real dopamine win.");
  if (has("outstand", positives)) out.push("You completed today's Outstand challenge. Small acts, big compound.");
  if (has("workout", positives)) out.push("Moving your body rewires your reward system in your favor.");
  if (has("meditation", positives)) out.push("Stillness trained your baseline back down. Keep it up.");
  if (has("sleep_on_time", positives)) out.push("Sleeping on time is the highest-leverage dopamine reset.");
  if (has("read", positives)) out.push("Deep reading is a slow-dopamine skill. You practiced it today.");

  if (has("scrolling", negatives)) out.push("Excessive scrolling burned dopamine. Try a 20-minute phone parking lot tomorrow.");
  if (has("broke_focus", negatives)) out.push("A broken focus session teaches your brain that focus is optional. Rebuild it with a short 15-minute sprint.");
  if (has("slept_late", negatives)) out.push("Late sleep tanks tomorrow's recovery. Set a wind-down alarm tonight.");
  if (has("skipped_habits", negatives)) out.push("Missed every habit — start tomorrow with just one. Momentum matters more than perfection.");
  if (has("missed_reflection", negatives)) out.push("Skip reflection and today blurs. Two minutes of journaling closes the loop.");

  if (score >= 85) out.push("You're in a strong recovery window. Protect tomorrow morning from your phone.");
  else if (score >= 70) out.push("Solid baseline. One more positive tomorrow pushes you into elite territory.");
  else if (score >= 40) out.push("Middle ground. Pick one action tomorrow: sleep on time, or a single Pomodoro.");
  else out.push("Depleted day. Tomorrow, try just one Outstand challenge — nothing else.");

  return out.slice(0, 5);
}
