export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  history: string[];
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
  xp: number;
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
  const safeN = Number.isInteger(n) && n > 0 && n <= 366 ? n : 7;
  const arr: string[] = [];
  for (let i = safeN - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    arr.push(`${y}-${m}-${day}`);
  }
  return arr;
};

export function computeStreak(history?: string[]): number {
  if (!Array.isArray(history) || history.length === 0) return 0;
  const set = new Set(history);
  const today = todayISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;
  let cursor = set.has(today) ? new Date() : set.has(yesterday) ? yesterdayDate : null;
  if (!cursor) return 0;
  let streak = 0;
  while (cursor && streak <= set.size) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!set.has(key)) break;
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const XP_PER_HABIT = 10;
export const XP_PER_FOCUS_MINUTE = 2;

/**
 * Level math used for display only. XP totals are authoritative in Supabase.
 */
export function levelFromXP(xp = 0) {
  const safeXp = Number.isFinite(xp) && xp >= 0 ? xp : 0;
  const a = 25;
  const b = 75;
  const c = -safeXp;
  const discriminant = b * b - 4 * a * c;
  const root = (-b + Math.sqrt(discriminant)) / (2 * a);
  const levelsCompleted = Math.max(0, Math.floor(root));
  const cumulativeXp = (n: number) => 100 * n + 25 * n * (n - 1);
  let completed = levelsCompleted;
  while (cumulativeXp(completed + 1) <= safeXp) completed += 1;
  while (completed > 0 && cumulativeXp(completed) > safeXp) completed -= 1;
  const level = completed + 1;
  const into = safeXp - cumulativeXp(completed);
  const need = 100 + (level - 1) * 50;
  return {
    level,
    into,
    need,
    progressPct: need > 0 ? Math.min(100, (into / need) * 100) : 0,
  };
}
