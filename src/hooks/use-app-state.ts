import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  computeStreak,
  todayISO,
  XP_PER_FOCUS,
  XP_PER_HABIT,
  // Removed XP_PER_OUTSTAND since we now use dynamic XP
  type FocusSession,
  type Habit,
  type OutstandCompletion,
} from "@/lib/habits";

// ... (Keep your seedHabits array as it is) ...

export function useAppState() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("ht.habits.v1", seedHabits);
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>("ht.sessions.v1", []);
  const [outstand, setOutstand] = useLocalStorage<OutstandCompletion[]>("ht.outstand.v1", []);

  // 1. DYNAMIC XP ENGINE
  const xp = useMemo(() => {
    const habitCompletions = habits.reduce((sum, h) => sum + h.history.length, 0);
    const focus = sessions.filter((s) => s.completed).length;
    // New logic: total up the xp stored in each outstand completion
    const outstandXp = outstand.reduce((sum, o) => sum + (o.xp || 0), 0);
    return habitCompletions * XP_PER_HABIT + focus * XP_PER_FOCUS + outstandXp;
  }, [habits, sessions, outstand]);

  // 2. LEVEL CALCULATOR (New Feature)
  // Level 1 = 0 XP, Level 2 = 500 XP, Level 3 = 1000 XP...
  const level = Math.floor(xp / 500) + 1;
  const progressToNextLevel = (xp % 500) / 5; // Percentage (0-100)

  // 3. ENHANCED RECORD OUTSTAND
  const recordOutstand = (title: string, xp: number) => {
    setOutstand((prev) => [
      { id: crypto.randomUUID(), title, xp, completedAt: new Date().toISOString() },
      ...prev,
    ].slice(0, 200));
  };

  // ... (Keep your existing toggleToday, addHabit, updateHabit, deleteHabit, recordSession) ...

  return {
    habits,
    sessions,
    outstand,
    xp,
    level, // New!
    progressToNextLevel, // New!
    bestStreak,
    streaks,
    toggleToday,
    addHabit,
    updateHabit,
    deleteHabit,
    recordSession,
    recordOutstand,
  };
}
