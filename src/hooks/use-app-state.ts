import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  computeStreak,
  todayISO,
  XP_PER_FOCUS,
  XP_PER_HABIT,
  type FocusSession,
  type Habit,
  type OutstandCompletion,
} from "@/lib/habits";

const LOCAL_KEYS = ["ht.habits.v1", "ht.sessions.v1", "ht.outstand.v1"] as const;
const EMPTY_HABITS: Habit[] = [];
const EMPTY_SESSIONS: FocusSession[] = [];
const EMPTY_OUTSTAND: OutstandCompletion[] = [];

type ProductivitySnapshot = {
  habits: Habit[];
  sessions: FocusSession[];
  outstand: OutstandCompletion[];
};

function safeUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function readLegacySnapshot(): ProductivitySnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const parse = <T,>(key: string, fallback: T): T => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return value ?? fallback;
    };
    const habits = parse<Habit[]>(LOCAL_KEYS[0], EMPTY_HABITS);
    const sessions = parse<FocusSession[]>(LOCAL_KEYS[1], EMPTY_SESSIONS);
    const outstand = parse<OutstandCompletion[]>(LOCAL_KEYS[2], EMPTY_OUTSTAND);
    if (!habits.length && !sessions.length && !outstand.length) return null;
    return {
      habits: Array.isArray(habits) ? habits : EMPTY_HABITS,
      sessions: Array.isArray(sessions) ? sessions : EMPTY_SESSIONS,
      outstand: Array.isArray(outstand) ? outstand : EMPTY_OUTSTAND,
    };
  } catch {
    return null;
  }
}

function clearLegacySnapshot() {
  if (typeof window === "undefined") return;
  for (const key of LOCAL_KEYS) window.localStorage.removeItem(key);
}

export function useAppState() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>(EMPTY_HABITS);
  const [sessions, setSessions] = useState<FocusSession[]>(EMPTY_SESSIONS);
  const [outstand, setOutstand] = useState<OutstandCompletion[]>(EMPTY_OUTSTAND);
  const [hydrated, setHydrated] = useState(false);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotRef = useRef<ProductivitySnapshot>({ habits: EMPTY_HABITS, sessions: EMPTY_SESSIONS, outstand: EMPTY_OUTSTAND });

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);

    const load = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setHabits(EMPTY_HABITS);
          setSessions(EMPTY_SESSIONS);
          setOutstand(EMPTY_OUTSTAND);
          setHydrated(true);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_productivity_state" as any)
          .select("habits, sessions, outstand")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        const cloud: ProductivitySnapshot = {
          habits: Array.isArray(data?.habits) ? (data.habits as Habit[]) : EMPTY_HABITS,
          sessions: Array.isArray(data?.sessions) ? (data.sessions as FocusSession[]) : EMPTY_SESSIONS,
          outstand: Array.isArray(data?.outstand) ? (data.outstand as OutstandCompletion[]) : EMPTY_OUTSTAND,
        };

        // One-time migration only: cloud wins if it already has data; otherwise
        // move the old browser snapshot to Supabase and immediately delete it.
        const legacy = readLegacySnapshot();
        const shouldMigrate = !data && legacy;
        const next = shouldMigrate ? legacy : cloud;

        if (shouldMigrate && next) {
          const { error: migrationError } = await supabase
            .from("user_productivity_state" as any)
            .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
          if (migrationError) throw migrationError;
          clearLegacySnapshot();
        } else if (data) {
          // A successful cloud read means the browser no longer needs the legacy copy.
          clearLegacySnapshot();
        }

        snapshotRef.current = next ?? { habits: EMPTY_HABITS, sessions: EMPTY_SESSIONS, outstand: EMPTY_OUTSTAND };
        setHabits(snapshotRef.current.habits);
        setSessions(snapshotRef.current.sessions);
        setOutstand(snapshotRef.current.outstand);
      } catch (error) {
        console.error("Failed to load productivity state from Supabase:", error);
        // Do not silently overwrite cloud data with an empty local state.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !hydrated) return;
    const snapshot = { habits, sessions, outstand };
    snapshotRef.current = snapshot;

    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("user_productivity_state" as any)
          .upsert({ user_id: user.id, ...snapshot }, { onConflict: "user_id" });
        if (error) throw error;
      } catch (error) {
        console.warn("Supabase productivity sync unavailable:", error);
      }
    }, 500);

    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [habits, sessions, outstand, hydrated, user?.id]);

  const xp = useMemo(() => {
    const habitCompletions = habits.reduce((sum, habit) => sum + (Array.isArray(habit?.history) ? habit.history.length : 0), 0);
    const completedFocusSessions = sessions.filter((session) => Boolean(session?.completed)).length;
    const outstandXp = outstand.reduce((sum, completion) => sum + (typeof completion?.xp === "number" ? completion.xp : 0), 0);
    return habitCompletions * XP_PER_HABIT + completedFocusSessions * XP_PER_FOCUS + outstandXp;
  }, [habits, sessions, outstand]);

  const level = Math.floor(xp / 500) + 1;
  const progressToNextLevel = (xp % 500) / 5;

  const recordOutstand = useCallback((title: string, xpReward: number) => {
    setOutstand((prev) => [
      { id: safeUuid(), title, xp: xpReward, completedAt: new Date().toISOString() },
      ...prev,
    ].slice(0, 200));
  }, []);

  const toggleToday = useCallback((id: string) => {
    const today = todayISO();
    setHabits((prev) => prev.map((habit) => {
      if (habit.id !== id) return habit;
      const history = Array.isArray(habit.history) ? habit.history : [];
      return { ...habit, history: history.includes(today) ? history.filter((day) => day !== today) : [...history, today] };
    }));
  }, []);

  const addHabit = useCallback((data: { name: string; emoji: string; color: string }) => {
    setHabits((prev) => [...prev, {
      id: safeUuid(), name: data.name.trim(), emoji: data.emoji, color: data.color,
      createdAt: new Date().toISOString(), history: [],
    }]);
  }, []);

  const setInitialHabits = useCallback((chosenHabits: Array<{ name: string; emoji: string; color: string }>) => {
    setHabits(chosenHabits.map((item) => ({
      id: safeUuid(), name: item.name.trim(), emoji: item.emoji, color: item.color,
      createdAt: new Date().toISOString(), history: [],
    })));
  }, []);

  const updateHabit = useCallback((id: string, data: Partial<Pick<Habit, "name" | "emoji" | "color">>) => {
    setHabits((prev) => prev.map((habit) => habit.id === id
      ? { ...habit, ...data, name: typeof data.name === "string" ? data.name.trim() : habit.name }
      : habit));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
  }, []);

  const recordSession = useCallback((durationMin: number, completed: boolean) => {
    const safeDuration = Math.max(0, Math.round(durationMin));
    setSessions((prev) => [{ id: safeUuid(), startedAt: new Date().toISOString(), durationMin: safeDuration, completed }, ...prev].slice(0, 500));
  }, []);

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
    hydrated,
    toggleToday,
    addHabit,
    setInitialHabits,
    updateHabit,
    deleteHabit,
    recordSession,
    recordOutstand,
  };
}
