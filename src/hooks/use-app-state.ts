// src/hooks/use-app-state.ts
import { useEffect, useMemo, useRef } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  calculateLocalXp,
  computeStreak,
  levelFromXP,
  todayISO,
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
  const outstand = Array.isArray(rawOutstand)
    ? rawOutstand.map((item) => ({ ...item, xp: Number.isFinite(item?.xp) ? Math.max(0, item.xp) : 0 }))
    : [];

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSyncedOnce = useRef(false);

  useEffect(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const response = await fetch("/api/sync-productivity-state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ habits, sessions, outstand }),
        });
        if (response.ok) hasSyncedOnce.current = true;
      } catch (error) {
        console.warn("Outstand cloud sync unavailable:", error);
      }
    }, hasSyncedOnce.current ? 1200 : 250);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [habits, sessions, outstand]);

  const xp = useMemo(() => calculateLocalXp(habits, sessions, outstand), [habits, sessions, outstand]);
  const levelState = useMemo(() => levelFromXP(xp), [xp]);

  const recordOutstand = (title: string, xpReward: number) => {
    const safeXp = Number.isFinite(xpReward) ? Math.max(0, Math.round(xpReward)) : 0;
    setOutstand((prev) => [
      { id: safeUuid(), title: title.trim(), xp: safeXp, completedAt: new Date().toISOString() },
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
    const name = data.name.trim();
    if (!name) return;
    const habit: Habit = {
      id: safeUuid(),
      name,
      emoji: data.emoji || "✨",
      color: data.color || "primary",
      createdAt: new Date().toISOString(),
      history: [],
    };
    setHabits((prev) => [...(Array.isArray(prev) ? prev : []), habit]);
  };

  const setInitialHabits = (chosenHabits: Array<{ name: string; emoji: string; color: string }>) => {
    const formattedHabits: Habit[] = chosenHabits
      .map((item) => ({
        id: safeUuid(),
        name: item.name.trim(),
        emoji: item.emoji || "✨",
        color: item.color || "primary",
        createdAt: new Date().toISOString(),
        history: [],
      }))
      .filter((item) => item.name.length > 0);
    setHabits(formattedHabits);
  };

  const updateHabit = (id: string, data: Partial<Pick<Habit, "name" | "emoji" | "color">>) => {
    setHabits((prev) => (Array.isArray(prev) ? prev : []).map((habit) => (
      habit.id === id
        ? { ...habit, ...data, name: typeof data.name === "string" ? data.name.trim() : habit.name }
        : habit
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
    level: levelState.level,
    progressToNextLevel: levelState.progressPct,
    streaks,
    bestStreak,
    toggleToday,
    addHabit,
    setInitialHabits,
    updateHabit,
    deleteHabit,
    recordSession,
    recordOutstand,
  };
}
