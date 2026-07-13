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
  | "sunlight"; // Added a high-leverage morning habit

export type NegativeKey =
  | "scrolling"
  | "broke_focus"
  | "skipped_habits"
  | "slept_late"
  | "missed_reflection"
  | "snoozed"; // Added a critical morning friction point

// --- UPGRADED PREMIUM COPY ---
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

// --- LOGIC ENGINE ---
export function computeScore(positives: string[], negatives: string[]): number {
  let s = BASE;
  for (const k of positives) s += POSITIVES.find((p) => p.key === k)?.points ?? 0;
  for (const k of negatives) s += NEGATIVES.find((n) => n.key === k)?.points ?? 0;
  return Math.max(0, Math.min(100, s));
}

// --- OPTIMIZED FOR GLOWING UI ---
export function scoreColor(score: number): { hex: string; label: string; tone: "danger" | "warn" | "good" } {
  const s = Math.max(0, Math.min(100, score));
  
  // Using specific Tailwind hex codes that pair beautifully with the glowing UI we just built
  if (s >= 80) return { hex: "#34d399", label: "Peak State", tone: "good" }; // Emerald 400
  if (s >= 50) return { hex: "#818cf8", label: "Maintaining", tone: "warn" }; // Indigo 400
  return { hex: "#fb7185", label: "Depleted", tone: "danger" }; // Rose 400
}

// --- EXECUTIVE COACH INSIGHTS ---
export function generateInsights(
  positives: string[],
  negatives: string[],
  score: number,
): string[] {
  const out: string[] = [];
  const has = (k: string, arr: string[]) => arr.includes(k);

  // Positive Triggers
  if (has("pomodoro", positives)) out.push("You held your attention through deep work. This is a massive dopamine win.");
  if (has("outstand", positives)) out.push("You conquered an Outstand challenge today. Small intentional acts compound massively.");
  if (has("workout", positives)) out.push("Physical training rewires your reward system in your favor. Great momentum.");
  if (has("meditation", positives)) out.push("Stillness trained your baseline back down. You are in control of your attention.");
  if (has("sleep_on_time", positives)) out.push("Sleeping on time is the highest-leverage reset protocol. You protected tomorrow.");
  if (has("sunlight", positives)) out.push("Morning sunlight set your circadian clock. Expect sharper focus today.");

  // Friction Triggers
  if (has("scrolling", negatives)) out.push("The algorithm stole your momentum today. Try a 20-minute phone lockdown tomorrow morning.");
  if (has("broke_focus", negatives)) out.push("Fractured focus teaches your brain that quitting is an option. Rebuild with a strict 15-minute sprint.");
  if (has("snoozed", negatives)) out.push("Snoozing trains your brain to delay action. Tomorrow, put the alarm across the room.");
  if (has("slept_late", negatives)) out.push("Late sleep tanks tomorrow's recovery. Set a hard wind-down alarm tonight.");
  if (has("skipped_habits", negatives)) out.push("Zero momentum today. Don't aim for perfection tomorrow, just pick ONE habit and execute.");

  // Global State Insights
  if (score >= 85) out.push("🔥 You are in a rare flow state. Protect your momentum fiercely tomorrow morning.");
  else if (score >= 65) out.push("Solid baseline established. One more high-leverage habit tomorrow pushes you into the elite zone.");
  else if (score >= 40) out.push("You are in the middle ground. Pick just one vital action tomorrow: hit the bed on time, or do one deep work block.");
  else out.push("⚠️ System depleted. Tomorrow requires a hard reset. Focus on hydration, sleep, and just one Outstand challenge.");

  return out.slice(0, 5);
}
