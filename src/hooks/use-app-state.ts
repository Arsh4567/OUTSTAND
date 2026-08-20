import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { computeStreak, levelFromXP, todayISO, type FocusSession, type Habit, type OutstandCompletion } from "@/lib/habits";
import { supabase } from "@/integrations/supabase/client";

const seedHabits: Habit[] = [];
const MAX_SYNC_RETRIES = 3;
function safeUuid() { if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID(); return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`; }
function normalizeHabitName(name: string) { return name.trim().replace(/\s+/g, " ").toLocaleLowerCase(); }
function isAbortError(error: unknown) { return error instanceof DOMException && error.name === "AbortError"; }

export function useAppState() {
  const [rawHabits, setHabits] = useLocalStorage<Habit[]>("ht.habits.v1", seedHabits);
  const [rawSessions, setSessions] = useLocalStorage<FocusSession[]>("ht.sessions.v1", []);
  const [rawOutstand, setOutstand] = useLocalStorage<OutstandCompletion[]>("ht.outstand.v1", []);
  const [xp, setXp] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [cloudBestStreak, setCloudBestStreak] = useState(0);
  const [xpLoading, setXpLoading] = useState(true);
  const habits = Array.isArray(rawHabits) ? rawHabits : [];
  const sessions = Array.isArray(rawSessions) ? rawSessions : [];
  const outstand = Array.isArray(rawOutstand) ? rawOutstand.map(item => ({ ...item, xp: Number.isFinite(item?.xp) ? Math.max(0, item.xp) : 0 })) : [];
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSyncedOnce = useRef(false);
  const syncAbortRef = useRef<AbortController | null>(null);

  const refreshXp = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setXp(0); setXpLoading(false); return; }
    const { data, error } = await supabase.from("profiles").select("total_xp").eq("id", user.id).maybeSingle();
    if (!error) setXp(Math.max(0, Number(data?.total_xp) || 0));
    setXpLoading(false);
  }, []);

  const refreshCloudStreak = useCallback(async (recordToday = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCurrentStreak(0); setCloudBestStreak(0); return; }
      if (recordToday) {
        const { data, error } = await supabase.rpc("record_daily_streak", { p_user_id: user.id });
        if (!error && data?.[0]) { setCurrentStreak(Number(data[0].current_streak) || 0); setCloudBestStreak(Number(data[0].best_streak) || 0); return; }
      }
      const { data } = await supabase.from("profiles").select("current_streak,best_streak,last_streak_date").eq("id", user.id).maybeSingle();
      setCurrentStreak(Number(data?.current_streak) || 0); setCloudBestStreak(Number(data?.best_streak) || 0);
    } catch { setCurrentStreak(0); setCloudBestStreak(0); }
  }, []);

  useEffect(() => { void refreshXp(); void refreshCloudStreak(false); }, [refreshXp, refreshCloudStreak]);

  // Live XP: every successful server-side award updates profiles.total_xp and
  // Supabase Realtime immediately pushes the new total to every open OUTSTAND tab.
  useEffect(() => {
    let active = true;
    const channel = supabase.channel("live-xp").on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, payload => {
      if (!active) return;
      void supabase.auth.getUser().then(({ data: { user } }) => { if (user?.id === payload.new.id) setXp(Math.max(0, Number(payload.new.total_xp) || 0)); });
    }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current); syncAbortRef.current?.abort();
    const controller = new AbortController(); syncAbortRef.current = controller;
    const sync = async () => { try { const { data: { session } } = await supabase.auth.getSession(); if (!session || controller.signal.aborted) return; for (let attempt = 0; attempt < MAX_SYNC_RETRIES; attempt += 1) { try { const response = await fetch("/api/sync-productivity-state", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ habits, sessions, outstand }), signal: controller.signal }); if (response.ok) { hasSyncedOnce.current = true; return; } if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) return; } catch (error) { if (isAbortError(error)) return; if (attempt === MAX_SYNC_RETRIES - 1) return; } await new Promise<void>(resolve => setTimeout(resolve, 500 * 2 ** attempt)); if (controller.signal.aborted) return; } } catch (error) { if (!controller.signal.aborted && !isAbortError(error)) console.warn("Outstand cloud sync unavailable:", error); } };
    syncTimer.current = setTimeout(sync, hasSyncedOnce.current ? 1200 : 250);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); controller.abort(); if (syncAbortRef.current === controller) syncAbortRef.current = null; };
  }, [habits, sessions, outstand]);

  useEffect(() => { let active = true; const subscription = supabase.auth.onAuthStateChange((event, session) => { if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.access_token && active) { void refreshXp(); void refreshCloudStreak(false); } }); return () => { active = false; subscription.data.subscription.unsubscribe(); }; }, [refreshXp, refreshCloudStreak]);

  const levelState = useMemo(() => levelFromXP(xp), [xp]);
  const markTodayActive = useCallback(() => { void refreshCloudStreak(true); }, [refreshCloudStreak]);

  const awardXp = useCallback(async (amount: number, source: string, referenceId: string, description: string) => {
    const safeAmount = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0));
    if (!safeAmount) return 0;
    const { data, error } = await supabase.rpc("award_xp", { p_amount: safeAmount, p_source: source, p_reference_id: referenceId, p_description: description });
    if (error) return 0;
    const granted = Number(data?.[0]?.granted) || 0;
    if (data?.[0]?.total_xp != null) setXp(Number(data[0].total_xp) || 0);
    return granted;
  }, []);

  const recordOutstand = (title: string, xpReward: number) => { const cleanTitle = title.trim(); if (!cleanTitle) return; const safeXp = Number.isFinite(xpReward) ? Math.max(0, Math.round(xpReward)) : 0; const id = safeUuid(); setOutstand(prev => [{ id, title: cleanTitle, xp: safeXp, completedAt: new Date().toISOString() }, ...(Array.isArray(prev) ? prev : [])].slice(0, 200)); void awardXp(safeXp, "outstand", id, cleanTitle); markTodayActive(); };

  const toggleToday = (id: string) => { const today = todayISO(); let newlyCompleted = false; setHabits(prev => (Array.isArray(prev) ? prev : []).map(habit => { if (habit.id !== id) return habit; const history = Array.isArray(habit.history) ? habit.history : []; const alreadyDone = history.includes(today); newlyCompleted = !alreadyDone; return { ...habit, history: alreadyDone ? history.filter(day => day !== today) : [...history, today] }; })); if (newlyCompleted) void awardXp(10, "habit", `${id}:${today}`, "Daily habit completed"); markTodayActive(); };
  const addHabit = (data: { name: string; emoji: string; color: string }) => { const name = data.name.trim(); const normalized = normalizeHabitName(name); if (!normalized) return; setHabits(prev => { const current = Array.isArray(prev) ? prev : []; if (current.some(habit => normalizeHabitName(habit.name) === normalized)) return current; return [...current, { id: safeUuid(), name, emoji: data.emoji || "✨", color: data.color || "primary", createdAt: new Date().toISOString(), history: [] }]; }); };
  const setInitialHabits = (chosenHabits: Array<{ name: string; emoji: string; color: string }>) => { const seen = new Set<string>(); const unique = chosenHabits.map(item => ({ ...item, name: item.name.trim() })).filter(item => { const normalized = normalizeHabitName(item.name); if (!normalized || seen.has(normalized)) return false; seen.add(normalized); return true; }).map(item => ({ id: safeUuid(), name: item.name, emoji: item.emoji || "✨", color: item.color || "primary", createdAt: new Date().toISOString(), history: [] })); setHabits(unique); };
  const updateHabit = (id: string, data: Partial<Pick<Habit, "name" | "emoji" | "color">>) => setHabits(prev => { const current = Array.isArray(prev) ? prev : []; const nextName = typeof data.name === "string" ? data.name.trim() : undefined; if (nextName !== undefined && !nextName) return current; if (nextName !== undefined) { const normalized = normalizeHabitName(nextName); if (current.some(habit => habit.id !== id && normalizeHabitName(habit.name) === normalized)) return current; } return current.map(habit => habit.id === id ? { ...habit, ...data, name: nextName ?? habit.name } : habit); });
  const deleteHabit = (id: string) => setHabits(prev => (Array.isArray(prev) ? prev : []).filter(habit => habit.id !== id));
  const recordSession = (durationMin: number, completed: boolean) => { const safeDuration = Math.min(240, Math.max(0, Math.round(Number.isFinite(durationMin) ? durationMin : 0))); if (completed && safeDuration <= 0) return; setSessions(prev => [{ id: safeUuid(), startedAt: new Date().toISOString(), durationMin: safeDuration, completed: Boolean(completed) }, ...(Array.isArray(prev) ? prev : [])].slice(0, 500)); if (completed) markTodayActive(); };
  const streaks = useMemo(() => habits.map(habit => ({ id: habit.id, streak: computeStreak(Array.isArray(habit.history) ? habit.history : []) })), [habits]);
  const bestStreak = Math.max(cloudBestStreak, streaks.reduce((best, current) => Math.max(best, current.streak || 0), 0));
  return { habits, sessions, outstand, xp, xpLoading, level: levelState.level, progressToNextLevel: levelState.progressPct, streaks, bestStreak, currentStreak, toggleToday, addHabit, setInitialHabits, updateHabit, deleteHabit, recordSession, recordOutstand, refreshCloudStreak, refreshXp, awardXp };
}
