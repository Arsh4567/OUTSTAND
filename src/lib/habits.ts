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
  // Defensive guard: Ensure n is a valid positive number
  const safeN = (typeof n === 'number' && n > 0 && Number.isFinite(n)) ? n : 7;
  
  const arr: string[] = [];
  for (let i = safeN - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    arr.push(`${y}-${m}-${day}`);
  }
  return arr;
};

// CRASH-PROOFED
export function computeStreak(history?: string[]): number {
  // Defensive guard: If history is missing, null, or not an array, streak is 0
  if (!history || !Array.isArray(history) || history.length === 0) {
    return 0;
  }
  
  try {
    const set = new Set(history);
    let streak = 0;
    const d = new Date();
    
    // Safety break loop limit (prevents infinite loop if dates glitch)
    let safetyCounter = 0; 
    
    while (safetyCounter < 10000) {
      safetyCounter++;
      
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
  } catch (error) {
    console.error("Error computing streak:", error);
    return 0; // Fallback so app doesn't crash
  }
}

export const XP_PER_HABIT = 10;
export const XP_PER_FOCUS = 25;
export const XP_PER_OUTSTAND = 20;

// CRASH-PROOFED
export const levelFromXP = (xp?: number) => {
  // Defensive guard: Catch NaN, undefined, negative numbers, or non-numbers
  if (xp === undefined || xp === null || typeof xp !== "number" || isNaN(xp) || xp < 0) {
    return { level: 1, into: 0, need: 100 };
  }
  
  // Defensive guard: Prevent "Maximum Call Stack / Infinite Loop" tab freezes
  if (!Number.isFinite(xp)) {
    return { level: 99, into: 0, need: 100 }; 
  }

  let level = 1;
  let remain = xp;
  let need = 100;
  
  // Safety break loop limit (prevents infinite loop)
  let safetyCounter = 0;

  while (remain >= need && safetyCounter < 10000) {
    safetyCounter++;
    remain -= need;
    level += 1;
    need = 100 + (level - 1) * 50;
  }
  
  return { level, into: Math.max(0, remain), need };
};
  
