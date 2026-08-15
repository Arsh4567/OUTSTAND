import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  computeStreak,
  todayISO,
  XP_PER_FOCUS,
  XP_PER_HABIT,
  type FocusSession,
  type Habit,
  type OutstandCompletion,
} from "@/lib/habits";

const seedHabits: Habit[] = [
  {
    id: "h1",
    name: "Read 20 minutes",
    emoji: "📚",
    color: "primary",
    createdAt: new Date().toISOString(),
    history: [],
  },
  {
    id: "h2",
    name: "Deep work session",
    emoji: "🧠",
    color: "accent",
    createdAt: new Date().toISOString(),
    history: [],
  },
  {
    id: "h3",
    name: "Exercise / stretch",
    emoji: "🏃",
    color: "success",
    createdAt: new Date().toISOString(),
    history: [],
  },
  {
    id: "h4",
    name: "No phone before class",
    emoji: "📵",
    color: "warning",
    createdAt: new Date().toISOString(),
    history: [],
  },
];

export function useAppState() {
  // 1. Fetch raw data from local storage
  const [rawHabits, setHabits] = useLocalStorage<Habit[]>("ht.habits.v1", seedHabits);
  const [rawSessions, setSessions] = useLocalStorage<FocusSession[]>("ht.sessions.v1", []);
  const [rawOutstand, setOutstand] = useLocalStorage<OutstandCompletion[]>("ht.outstand.v1", []);

  // 2. SANITIZATION: Guarantee these are ALWAYS arrays to prevent .reduce() and .filter() crashes
  const habits = Array.isArray(rawHabits) ? rawHabits : seedHabits;
  const sessions = Array.isArray(rawSessions) ? rawSessions : [];
  const outstand = Array.isArray(rawOutstand) ? rawOutstand : [];

  const xp = useMemo(() => {
    // 3. SAFE MATH: Use optional chaining (?.) and fallbacks (|| 0)
    const habitCompletions = habits.reduce((sum, h) => sum + (h?.history?.length || 0), 0);
    const focus = sessions.filter((s) => s?.completed).length;
    const outstandXp = outstand.reduce((sum, o) => sum + ((o as any)?.xp || 0), 0);
    
    return (habitCompletions * XP_PER_HABIT) + (focus * XP_PER_FOCUS) + outstandXp;
  }, [habits, sessions, outstand]);

  const level = Math.floor(xp / 500) + 1;
  const progressToNextLevel = (xp % 500) / 5; 

  const recordOutstand = (title: string, xp: number) => {
    setOutstand((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [
        { id: crypto.randomUUID(), title, xp, completedAt: new Date().toISOString() },
        ...safePrev,
      ].slice(0, 200);
    });
  };

  const toggleToday = (id: string) => {
    const today = todayISO();
    setHabits((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map((h) => {
        if (h.id !== id) return h;
        const history = Array.isArray(h.history) ? h.history : [];
        const has = history.includes(today);
        return {
          ...h,
          history: has ? history.filter((d) => d !== today) : [...history, today],
        };
      });
    });
  };

  const addHabit = (data: { name: string; emoji: string; color: string }) => {
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      createdAt: new Date().toISOString(),
      history: [],
    };
    setHabits((prev) => [...(Array.isArray(prev) ? prev : []), habit]);
  };

  const updateHabit = (id: string, data: Partial<Pick<Habit, "name" | "emoji" | "color">>) => {
    setHabits((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map((h) => (h.id === id ? { ...h, ...data } : h));
    });
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter((h) => h.id !== id);
    });
  };

  const recordSession = (durationMin: number, completed: boolean) => {
    const s: FocusSession = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      durationMin,
      completed,
    };
    setSessions((prev) => [s, ...(Array.isArray(prev) ? prev : [])].slice(0, 500));
  };

  // 4. SAFE STREAK CALCULATION: Ensure computeStreak always receives an array
  const streaks = useMemo(() => {
    return habits.map((h) => ({ 
      id: h?.id, 
      streak: computeStreak(Array.isArray(h?.history) ? h.history : []) 
    }));
  }, [habits]);

  const bestStreak = streaks.reduce((a, b) => ((b?.streak || 0) > a ? (b?.streak || 0) : a), 0);

  return {
    habits,
    sessions,
    outstand,
    xp,
    level,
    progressToNextLevel,
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
