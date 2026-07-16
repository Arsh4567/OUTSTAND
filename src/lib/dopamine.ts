export type PositiveKey =
  | "pomodoro"
  | "outstand"
  | "workout"
  | "read"
  | "all_habits"
  | "water"
  | "sleep_on_time"
  | "journal"
  | "meditation"
  | "sunlight";

export type NegativeKey =
  | "scrolling"
  | "broke_focus"
  | "skipped_habits"
  | "slept_late"
  | "missed_reflection"
  | "snoozed";

export const POSITIVES: { key: PositiveKey; label: string; emoji: string; points: number; description: string }[] = [
  { key: "pomodoro", label: "Deep Work", emoji: "🎯", points: 20, description: "Unbroken, hyper-focused session" },
  { key: "outstand", label: "Outstand Challenge", emoji: "⚡", points: 15, description: "10 minutes of intentional growth" },
  { key: "workout", label: "Physical Training", emoji: "🏋️", points: 15, description: "Move your body, wire your brain" },
  { key: "read", label: "Deep Reading", emoji: "📚", points: 10, description: "Slow-dopamine skill practice" },
  { key: "meditation", label: "Mind Reset", emoji: "🧘", points: 10, description: "5+ minutes of pure stillness" },
  { key: "sunlight", label: "Morning Sun", emoji: "☀️", points: 10, description: "Circadian rhythm alignment" },
  { key: "sleep_on_time", label: "Optimized Sleep", emoji: "🌙", points: 20, description: "Hit your target wind-down time" },
  { key: "water", label: "Hydration Target", emoji: "💧", points: 10, description: "At least 2L of water today" },
  { key: "journal", label: "Daily Log", emoji: "📓", points: 10, description: "End-of-day mental offload" },
  { key: "all_habits", label: "Perfect Day", emoji: "🏆", points: 15, description: "Completed the entire routine" },
];

export const NEGATIVES: { key: NegativeKey; label: string; emoji: string; points: number; description: string }[] = [
  { key: "scrolling", label: "Doomscrolling", emoji: "📱", points: -25, description: "Caught in the algorithm spiral" },
  { key: "broke_focus", label: "Fractured Focus", emoji: "💥", points: -20, description: "Abandoned a deep work block" },
  { key: "snoozed", label: "Snoozed Alarm", emoji: "⏰", points: -15, description: "Started the day with hesitation" },
  { key: "slept_late", label: "Sleep Deficit", emoji: "🌒", points: -15, description: "Stayed up past target bedtime" },
  { key: "skipped_habits", label: "Zero Momentum", emoji: "🚫", points: -15, description: "Skipped all daily targets" },
  { key: "missed_reflection", label: "Unclosed Loop", emoji: "🌫️", points: -10, description: "Missed the evening check-in" },
];

const BASE = 50;

// --- CRASH-PROOFED LOGIC ENGINE ---
export function computeScore(positives?: string[], negatives?: string[]): number {
  // Defensive guard: Ensure we are always looping over an array
  const safePos = Array.isArray(positives) ? positives : [];
  const safeNeg = Array.isArray(negatives) ? negatives : [];
  
  let s = BASE;
  for (const k of safePos) s += POSITIVES.find((p) => p.key === k)?.points ?? 0;
  for (const k of safeNeg) s += NEGATIVES.find((n) => n.key === k)?.points ?? 0;
  
  return Math.max(0, Math.min(100, s));
}

// --- CRASH-PROOFED COLOR ENGINE ---
export function scoreColor(score?: number): { hex: string; label: string; tone: "danger" | "warn" | "good" } {
  // Defensive guard: Catch NaN, undefined, or broken numbers
  const safeScore = (typeof score === 'number' && !isNaN(score)) ? score : 50;
  const s = Math.max(0, Math.min(100, safeScore));
  
  if (s >= 80) return { hex: "#34d399", label: "Peak State", tone: "good" };
  if (s >= 50) return { hex: "#818cf8", label: "Maintaining", tone: "warn" };
  return { hex: "#fb7185", label: "Depleted", tone: "danger" };
}

// --- CRASH-PROOFED INSIGHTS ---
export function generateInsights(
  positives?: string[],
  negatives?: string[],
  score?: number,
): string[] {
  const out: string[] = [];
  
  // Defensive guard: Ensure arrays exist before running .includes()
  const safePos = Array.isArray(positives) ? positives : [];
  const safeNeg = Array.isArray(negatives) ? negatives : [];
  const safeScore = (typeof score === 'number' && !isNaN(score)) ? score : 50;
  
  const has = (k: string, arr: string[]) => arr.includes(k);

  // Positive Triggers
  if (has("pomodoro", safePos)) out.push("You held your attention through deep work. This is a massive dopamine win.");
  if (has("outstand", safePos)) out.push("You conquered an Outstand challenge today. Small intentional acts compound massively.");
  if (has("workout", safePos)) out.push("Physical training rewires your reward system in your favor. Great momentum.");
  if (has("meditation", safePos)) out.push("Stillness trained your baseline back down. You are in control of your attention.");
  if (has("sleep_on_time", safePos)) out.push("Sleeping on time is the highest-leverage reset protocol. You protected tomorrow.");
  if (has("sunlight", safePos)) out.push("Morning sunlight set your circadian clock. Expect sharper focus today.");

  // Friction Triggers
  if (has("scrolling", safeNeg)) out.push("The algorithm stole your momentum today. Try a 20-minute phone lockdown tomorrow morning.");
  if (has("broke_focus", safeNeg)) out.push("Fractured focus teaches your brain that quitting is an option. Rebuild with a strict 15-minute sprint.");
  if (has("snoozed", safeNeg)) out.push("Snoozing trains your brain to delay action. Tomorrow, put the alarm across the room.");
  if (has("slept_late", safeNeg)) out.push("Late sleep tanks tomorrow's recovery. Set a hard wind-down alarm tonight.");
  if (has("skipped_habits", safeNeg)) out.push("Zero momentum today. Don't aim for perfection tomorrow, just pick ONE habit and execute.");

  // Global State Insights
  if (safeScore >= 85) out.push("🔥 You are in a rare flow state. Protect your momentum fiercely tomorrow morning.");
  else if (safeScore >= 65) out.push("Solid baseline established. One more high-leverage habit tomorrow pushes you into the elite zone.");
  else if (safeScore >= 40) out.push("You are in the middle ground. Pick just one vital action tomorrow: hit the bed on time, or do one deep work block.");
  else out.push("⚠️ System depleted. Tomorrow requires a hard reset. Focus on hydration, sleep, and just one Outstand challenge.");

  return out.slice(0, 5);
}
