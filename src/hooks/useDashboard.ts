import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QUOTES } from "@/lib/quotes";

export type DashboardMission = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  xpReward: number;
  completed: boolean;
  mutating: boolean;
};

export type RoadmapProgress = {
  roadmapId: string;
  day: number;
  total: number;
  completed: number;
  completionPct: number;
};

export type DashboardSnapshot = {
  userName: string;
  totalXp: number;
  level: number;
  streak: number;
  xpPct: number;
  missions: DashboardMission[];
  completedCount: number;
  completionPct: number;
  quote: { quote: string; author: string };
  roadmapProgress: RoadmapProgress | null;
};

type Stats = { total_xp?: number; level?: number; streak_days?: number };
type Quest = { id: string; title: string; category: string; difficulty: string; xp_reward: number };
type QuestRow = { id: string; completed: boolean | null; quests: Quest | Quest[] | null };
type ProgressRow = { roadmapId: string; day: number; total: number; completed: number; completionPct: number };

const fallbackMissions: Omit<DashboardMission, "completed" | "mutating">[] = [
  { id: "fallback-focus", title: "Start a 25-minute focus session", category: "Focus", difficulty: "medium", xpReward: 50 },
  { id: "fallback-read", title: "Read for 20 minutes", category: "Growth", difficulty: "easy", xpReward: 25 },
  { id: "fallback-move", title: "Move or stretch for 10 minutes", category: "Health", difficulty: "easy", xpReward: 25 },
  { id: "fallback-plan", title: "Plan your top 3 priorities", category: "Planning", difficulty: "medium", xpReward: 30 },
];

function quoteOfTheDay() {
  if (Array.isArray(QUOTES) && QUOTES.length) {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return { quote: q.quote, author: q.author };
  }
  return { quote: "Small actions, repeated daily, create extraordinary change.", author: "Outstand" };
}

export function useDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>({ userName: "there", totalXp: 0, level: 1, streak: 0, xpPct: 0, missions: fallbackMissions.map((m) => ({ ...m, completed: false, mutating: false })), completedCount: 0, completionPct: 0, quote: quoteOfTheDay(), roadmapProgress: null });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [fallbackCompleted, setFallbackCompleted] = useState<Set<string>>(new Set());

  const applyStats = useCallback((data: Stats | null) => {
    const xp = Math.max(0, Number(data?.total_xp ?? 0));
    const level = Math.max(1, Number(data?.level ?? Math.floor(xp / 500) + 1));
    setSnapshot((prev) => ({ ...prev, totalXp: xp, level, streak: Math.max(0, Number(data?.streak_days ?? 0)), xpPct: Math.min(100, Math.max(0, ((xp % 500) / 500) * 100)) }));
  }, []);

  const ensureStats = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from("user_stats").select("total_xp, level, streak_days").eq("user_id", uid).maybeSingle();
    if (error) throw error;
    if (data) return data as Stats;
    const { data: created, error: createError } = await supabase.from("user_stats").upsert({ user_id: uid, total_xp: 0, level: 1, streak_days: 0 }, { onConflict: "user_id" }).select("total_xp, level, streak_days").single();
    if (createError) throw createError;
    return created as Stats;
  }, []);

  const loadRoadmapProgress = useCallback(async () => {
    const { data, error } = await supabase.rpc("refresh_ai_roadmap_progress" as never);
    if (error || !data || typeof data !== "object") return null;
    const value = data as Record<string, unknown>;
    if (!value.roadmapId) return null;
    return { roadmapId: String(value.roadmapId), day: Number(value.day) || 1, total: Number(value.total) || 0, completed: Number(value.completed) || 0, completionPct: Number(value.completionPct) || 0 };
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (signal?.aborted) return;
    if (error) throw error;
    if (!session) throw new Error("Your session has expired. Please sign in again.");
    setUserId(session.user.id);
    const meta = session.user.user_metadata || {};
    const rawName = meta.display_name || meta.full_name || meta.first_name || meta.username || session.user.email?.split("@")[0] || "there";
    setSnapshot((prev) => ({ ...prev, userName: String(rawName).trim().split(/\s+/)[0] || "there" }));

    await supabase.rpc("sync_ai_roadmap_today_missions" as never);
    if (signal?.aborted) return;

    const localDate = new Date().toISOString().slice(0, 10);
    const [statsResult, questsResult, progressResult] = await Promise.allSettled([
      ensureStats(session.user.id),
      supabase.from("daily_quests").select("id, completed, quests(id, title, category, difficulty, xp_reward)").eq("user_id", session.user.id).eq("assigned_date", localDate),
      loadRoadmapProgress(),
    ]);
    if (signal?.aborted) return;
    if (statsResult.status === "fulfilled") applyStats(statsResult.value);
    const quests = questsResult.status === "fulfilled" && !questsResult.value.error ? (questsResult.value.data ?? []) as QuestRow[] : [];
    const mapped = quests.map((row) => { const q = Array.isArray(row.quests) ? row.quests[0] : row.quests; if (!q || q.category === "Outstand") return null; return { id: row.id, title: q.title, category: q.category, difficulty: q.difficulty, xpReward: Number(q.xp_reward) || 0, completed: Boolean(row.completed), mutating: false }; }).filter(Boolean) as DashboardMission[];
    setSnapshot((prev) => ({ ...prev, missions: mapped.length ? mapped : fallbackMissions.map((m) => ({ ...m, completed: fallbackCompleted.has(m.id), mutating: false })), roadmapProgress: progressResult.status === "fulfilled" ? progressResult.value : null }));
  }, [applyStats, ensureStats, fallbackCompleted, loadRoadmapProgress]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true); setLoadError(null);
    load(controller.signal).catch((error) => { if (!controller.signal.aborted) { console.error("Dashboard load failed", error); setLoadError(error instanceof Error ? error.message : "We couldn't load your dashboard data."); } }).finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => { const { data, error } = await supabase.from("user_stats").select("total_xp, level, streak_days").eq("user_id", userId).maybeSingle(); if (!error) applyStats(data as Stats | null); };
    const channel = supabase.channel(`dashboard_${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${userId}` }, refresh).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [applyStats, userId]);

  const completeMission = useCallback(async (missionId: string) => {
    const mission = snapshot.missions.find((item) => item.id === missionId);
    if (!mission || mission.completed || mission.mutating) return;
    if (missionId.startsWith("fallback-")) {
      setFallbackCompleted((prev) => new Set(prev).add(missionId));
      setSnapshot((prev) => ({ ...prev, totalXp: prev.totalXp + mission.xpReward }));
      toast.success("Mission complete", { description: `+${mission.xpReward} XP added.` });
      return;
    }
    setSnapshot((prev) => ({ ...prev, missions: prev.missions.map((item) => item.id === missionId ? { ...item, completed: true, mutating: true } : item) }));
    const { error } = await supabase.rpc("complete_daily_quest", { p_daily_quest_id: missionId });
    if (error) {
      setSnapshot((prev) => ({ ...prev, missions: prev.missions.map((item) => item.id === missionId ? { ...item, completed: false, mutating: false } : item) }));
      toast.error("Could not verify that mission.");
      return;
    }
    const progress = await loadRoadmapProgress();
    setSnapshot((prev) => ({ ...prev, missions: prev.missions.map((item) => item.id === missionId ? { ...item, mutating: false } : item), roadmapProgress: progress }));
    toast.success("Mission complete", { description: `+${mission.xpReward} XP added.` });
    await load();
  }, [load, loadRoadmapProgress, snapshot.missions]);

  const derived = useMemo(() => {
    const completedCount = snapshot.missions.filter((m) => m.completed).length;
    const completionPct = snapshot.missions.length ? Math.round((completedCount / snapshot.missions.length) * 100) : 0;
    return { ...snapshot, completedCount, completionPct, missions: snapshot.missions };
  }, [snapshot]);

  return { snapshot: derived, isLoading, loadError, completeMission };
}
