// src/hooks/use-app-state.ts
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

const seedHabits: Habit[] = [];

function safeUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function useAppState() {
  const [rawHabits, setHabits] = useLocalStorage<Habit[]>("ht.habits.v1", seedHabits);
  const [rawSessions, setSessions] = useLocalStorage<FocusSession[]>("ht.sessions.v1", []);
  const [rawOutstand, setOutstand] = useLocalStorage<OutstandCompletion[]>("ht.outstand.v1", []);

  const habits = Array.isArray(rawHabits) ? rawHabits : [];
  const sessions = Array.isArray(rawSessions) ? rawSessions : [];
  const outstand = Array.isArray(rawOutstand) ? rawOutstand : [];

  const xp = useMemo(() => {
    const habitCompletions = habits.reduce((sum, habit) => sum + (Array.isArray(habit?.history) ? habit.history.length : 0), 0);
    const completedFocusSessions = sessions.filter((session) => Boolean(session?.completed)).length;
    const outstandXp = outstand.reduce((sum, completion) => sum + (typeof completion?.xp === "number" ? completion.xp : 0), 0);
    return habitCompletions * XP_PER_HABIT + completedFocusSessions * XP_PER_FOCUS + outstandXp;
  }, [habits, sessions, outstand]);

  const level = Math.floor(xp / 500) + 1;
  const progressToNextLevel = (xp % 500) / 5;

  const recordOutstand = (title: string, xpReward: number) => {
    setOutstand((prev) => [
      { id: safeUuid(), title, xp: xpReward, completedAt: new Date().toISOString() },
      ...(Array.isArray(prev) ? prev : []),
    ].slice(0, 200));
  };

  const toggleToday = (id: string) => {
    const today = todayISO();
    setHabits((prev) => (Array.isArray(prev) ? prev : []).map((habit) => {
      if (habit.id !== id) return habit;
      const history = Array.isArray(habit.history) ? habit.history : [];
      return {
        ...habit,
        history: history.includes(today) ? history.filter((day) => day !== today) : [...history, today],
      };
    }));
  };

  const addHabit = (data: { name: string; emoji: string; color: string }) => {
    const habit: Habit = {
      id: safeUuid(),
      name: data.name.trim(),
      emoji: data.emoji,
      color: data.color,
      createdAt: new Date().toISOString(),
      history: [],
    };
    setHabits((prev) => [...(Array.isArray(prev) ? prev : []), habit]);
  };

  const setInitialHabits = (chosenHabits: Array<{ name: string; emoji: string; color: string }>) => {
    const formattedHabits: Habit[] = chosenHabits.map((item) => ({
      id: safeUuid(),
      name: item.name.trim(),
      emoji: item.emoji,
      color: item.color,
      createdAt: new Date().toISOString(),
      history: [],
    }));
    setHabits(formattedHabits);
  };

  const updateHabit = (id: string, data: Partial<Pick<Habit, "name" | "emoji" | "color">>) => {
    setHabits((prev) => (Array.isArray(prev) ? prev : []).map((habit) => (
      habit.id === id ? { ...habit, ...data, name: typeof data.name === "string" ? data.name.trim() : habit.name } : habit
    )));
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => (Array.isArray(prev) ? prev : []).filter((habit) => habit.id !== id));
  };

  const recordSession = (durationMin: number, completed: boolean) => {
    const safeDuration = Math.max(0, Math.round(durationMin));
    const session: FocusSession = {
      id: safeUuid(),
      startedAt: new Date().toISOString(),
      durationMin: safeDuration,
      completed,
    };
    setSessions((prev) => [session, ...(Array.isArray(prev) ? prev : [])].slice(0, 500));
  };

  const streaks = useMemo(() => habits.map((habit) => ({
    id: habit.id,
    streak: computeStreak(Array.isArray(habit.history) ? habit.history : []),
  })), [habits]);

  const bestStreak = streaks.reduce((best, current) => Math.max(best, current.streak || 0), 0);

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
    setInitialHabits,
    updateHabit,
    deleteHabit,
    recordSession,
    recordOutstand,
  };
}
