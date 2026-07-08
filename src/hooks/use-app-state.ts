import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  computeStreak,
  todayISO,
  XP_PER_FOCUS,
  XP_PER_HABIT,
  XP_PER_OUTSTAND,
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
  const [habits, setHabits] = useLocalStorage<Habit[]>("ht.habits.v1", seedHabits);
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>("ht.sessions.v1", []);
  const [outstand, setOutstand] = useLocalStorage<OutstandCompletion[]>("ht.outstand.v1", []);

  const xp = useMemo(() => {
    const habitCompletions = habits.reduce((sum, h) => sum + h.history.length, 0);
    const focus = sessions.filter((s) => s.completed).length;
    return habitCompletions * XP_PER_HABIT + focus * XP_PER_FOCUS + outstand.length * XP_PER_OUTSTAND;
  }, [habits, sessions, outstand]);

  const toggleToday = (id: string) => {
    const today = todayISO();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const has = h.history.includes(today);
        return {
          ...h,
          history: has ? h.history.filter((d) => d !== today) : [...h.history, today],
        };
      }),
    );
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
    setHabits((prev) => [...prev, habit]);
  };

  const updateHabit = (id: string, data: Partial<Pick<Habit, "name" | "emoji" | "color">>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...data } : h)));
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const recordSession = (durationMin: number, completed: boolean) => {
    const s: FocusSession = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      durationMin,
      completed,
    };
    setSessions((prev) => [s, ...prev].slice(0, 500));
  };

  const recordOutstand = (title: string) => {
    setOutstand((prev) => [
      { id: crypto.randomUUID(), title, completedAt: new Date().toISOString() },
      ...prev,
    ].slice(0, 200));
  };

  const streaks = useMemo(() => habits.map((h) => ({ id: h.id, streak: computeStreak(h.history) })), [habits]);
  const bestStreak = streaks.reduce((a, b) => (b.streak > a ? b.streak : a), 0);

  return {
    habits,
    sessions,
    outstand,
    xp,
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
