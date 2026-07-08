export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string; // token name: primary | accent | success | warning
  createdAt: string; // ISO
  history: string[]; // ISO date strings (YYYY-MM-DD) of completions
};

export type FocusSession = {
  id: string;
  startedAt: string;
  durationMin: number;
  completed: boolean;
};

export type OutstandCompletion = {
  id: string;
  title: string;
  completedAt: string;
};

export const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const lastNDays = (n: number) => {
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    arr.push(`${y}-${m}-${day}`);
  }
  return arr;
};

export function computeStreak(history: string[]): number {
  if (history.length === 0) return 0;
  const set = new Set(history);
  let streak = 0;
  const d = new Date();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    if (set.has(key)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      // allow today to be missing without breaking streak
      if (streak === 0 && key === todayISO()) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

export const XP_PER_HABIT = 10;
export const XP_PER_FOCUS = 25;
export const XP_PER_OUTSTAND = 20;

export const levelFromXP = (xp: number) => {
  // Level n requires 100 * n xp accumulated to reach n+1
  let level = 1;
  let remain = xp;
  let need = 100;
  while (remain >= need) {
    remain -= need;
    level += 1;
    need = 100 + (level - 1) * 50;
  }
  return { level, into: remain, need };
};
