import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, MotionConfig } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Flame, Focus, Loader2, Sparkles, Target, Trophy, Zap, Compass } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { XpBadge } from "../../components/xp-badge";
import { QUOTES } from "../../lib/quotes";
import type { DailyQuest } from "../../types/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardHQ });
const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } };
const fallbackMissions = [
  { id: "fallback-focus", title: "Start a 25-minute focus session", category: "Focus", difficulty: "medium", xp_reward: 50 },
  { id: "fallback-read", title: "Read for 20 minutes", category: "Growth", difficulty: "easy", xp_reward: 25 },
  { id: "fallback-move", title: "Move or stretch for 10 minutes", category: "Health", difficulty: "easy", xp_reward: 25 },
  { id: "fallback-plan", title: "Plan your top 3 priorities", category: "Planning", difficulty: "medium", xp_reward: 30 },
] as const;

type Stats = { total_xp?: number; level?: number; streak_days?: number };
type QuestRow = { id: string; completed: boolean | null; quests: { id: string; title: string; category: string; difficulty: string; xp_reward: number } | { id: string; title: string; category: string; difficulty: string; xp_reward: number }[] | null };

function DashboardHQ() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("there");
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpPct, setXpPct] = useState(0);
  const [streak, setStreak] = useState(0);
  const [habits, setHabits] = useState<DailyQuest[]>([]);
  const [fallbackCompleted, setFallbackCompleted] = useState<Set<string>>(new Set());
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());

  const applyStats = (data: Stats | null) => {
    const xp = Math.max(0, Number(data?.total_xp ?? 0));
    const safeLevel = Math.max(1, Number(data?.level ?? Math.floor(xp / 500) + 1));
    setTotalXp(xp);
    setLevel(safeLevel);
    setStreak(Math.max(0, Number(data?.streak_days ?? 0)));
    // Keep the dashboard independent from optional schema columns. The real
    // Supabase table has historically differed from generated client types.
    setXpPct(Math.min(100, Math.max(0, ((xp % 500) / 500) * 100)));
  };

  const ensureUserStats = async (uid: string) => {
    const { data: existing, error: readError } = await supabase
      .from("user_stats")
      .select("total_xp, level, streak_days")
      .eq("user_id", uid)
      .maybeSingle();

    if (readError) throw readError;
    if (existing) return existing as Stats;

    const { data: created, error: createError } = await supabase
      .from("user_stats")
      .upsert({ user_id: uid, total_xp: 0, level: 1, streak_days: 0 }, { onConflict: "user_id" })
      .select("total_xp, level, streak_days")
      .single();

    if (createError) throw createError;
    return created as Stats;
  };

  const loadDashboard = async (signal?: AbortSignal) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (signal?.aborted) return;
    if (sessionError) throw sessionError;
    if (!session) {
      setLoadError("Your session has expired. Please sign in again.");
      return;
    }

    setUserId(session.user.id);
    const meta = session.user.user_metadata || {};
    const rawName = meta.display_name || meta.full_name || meta.first_name || meta.username || session.user.email?.split("@")[0] || "there";
    setUserName(String(rawName).trim().split(/\s+/)[0] || "there");

    const localDate = new Date().toISOString().slice(0, 10);
    const [statsResult, habitsRes] = await Promise.allSettled([
      ensureUserStats(session.user.id),
      supabase
        .from("daily_quests")
        .select("id, completed, quests(id, title, category, difficulty, xp_reward)")
        .eq("user_id", session.user.id)
        .eq("assigned_date", localDate),
    ]);

    if (signal?.aborted) return;

    if (statsResult.status === "fulfilled") applyStats(statsResult.value);
    else {
      console.error("Stats load failed", statsResult.reason);
      applyStats(null);
    }

    if (habitsRes.status === "fulfilled") {
      const { data, error } = habitsRes.value;
      if (error) {
        console.error("Daily missions load failed", error);
        setHabits([]);
      } else {
        const rows = (data ?? []) as QuestRow[];
        const mapped: DailyQuest[] = rows.map((row) => {
          const qData = Array.isArray(row.quests) ? row.quests[0] : row.quests;
          if (!qData) return null;
          return {
            id: row.id,
            completed: row.completed ?? false,
            quest: {
              id: qData.id,
              title: qData.title,
              category: qData.category as DailyQuest["quest"]["category"],
              difficulty: qData.difficulty as DailyQuest["quest"]["difficulty"],
              xp_reward: qData.xp_reward,
            },
          } as DailyQuest;
        }).filter((q): q is DailyQuest => q !== null && q.quest.category !== "Outstand");
        setHabits(mapped);
      }
    } else {
      console.error("Daily missions request failed", habitsRes.reason);
      setHabits([]);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(null);
    setIsLoading(true);
    loadDashboard(controller.signal)
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Dashboard load failed", error);
          setLoadError("We couldn't load your dashboard data.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const refreshStats = async () => {
      try {
        const { data, error } = await supabase
          .from("user_stats")
          .select("total_xp, level, streak_days")
          .eq("user_id", userId)
          .maybeSingle();
        if (!error) applyStats(data as Stats | null);
      } catch (error) {
        console.error("Realtime stats refresh failed", error);
      }
    };
    const channel = supabase
      .channel(`dashboard_${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${userId}` }, refreshStats)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  const dailyQuote = useMemo(() => {
    if (Array.isArray(QUOTES) && QUOTES.length > 0) return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return { quote: "Small actions, repeated daily, create extraordinary change.", author: "Outstand", application: "Protect the next hour." };
  }, []);

  const missionSource: DailyQuest[] = habits.length > 0
    ? habits
    : fallbackMissions.map((mission) => ({ id: mission.id, completed: fallbackCompleted.has(mission.id), quest: mission as unknown as DailyQuest["quest"] }));
  const completedCount = missionSource.filter((mission) => mission.completed).length;
  const completionPct = missionSource.length ? Math.round((completedCount / missionSource.length) * 100) : 0;
  const nextMission = missionSource.find((mission) => !mission.completed) || missionSource[0];

  const handleCompleteMission = async (missionId: string) => {
    const mission = missionSource.find((item) => item.id === missionId);
    if (!mission || mission.completed || mutatingIds.has(missionId)) return;
    if (habits.length === 0) {
      setFallbackCompleted((prev) => new Set(prev).add(missionId));
      setTotalXp((prev) => prev + mission.quest.xp_reward);
      toast.success("Mission complete", { description: `+${mission.quest.xp_reward} XP added.` });
      return;
    }
    setMutatingIds((prev) => new Set(prev).add(missionId));
    setHabits((prev) => prev.map((item) => item.id === missionId ? { ...item, completed: true } : item));
    const { error } = await supabase.rpc("complete_daily_quest", { p_daily_quest_id: missionId });
    if (error) {
      setHabits((prev) => prev.map((item) => item.id === missionId ? { ...item, completed: false } : item));
      toast.error("Could not verify that mission.");
    } else {
      toast.success("Mission complete", { description: `+${mission.quest.xp_reward} XP added.` });
    }
    setMutatingIds((prev) => { const next = new Set(prev); next.delete(missionId); return next; });
  };

  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (isLoading) return <div className="min-h-screen bg-[#050816] text-white grid place-items-center"><div className="flex flex-col items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Preparing your command center</p></div></div>;

  if (loadError) return <div className="min-h-screen bg-[#050816] text-white grid place-items-center px-4"><div className="max-w-md rounded-3xl border border-red-400/15 bg-white/[0.04] p-6 text-center"><p className="text-sm text-red-200">{loadError}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Reload dashboard</button></div></div>;

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      <div className="relative min-h-screen overflow-x-hidden bg-[#050816] text-slate-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute left-1/2 top-[-20%] h-[55rem] w-[55rem] -translate-x-1/2 rounded-full bg-cyan-500/[0.045] blur-[120px]" /><div className="absolute right-[-10%] top-[15%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/[0.045] blur-[110px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" /></div>
        <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
          <motion.section variants={fadeUp} initial="hidden" animate="show" className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80"><Sparkles className="h-3.5 w-3.5" /> Personal command center</div><h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">Welcome back, <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">{userName}</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Your day is already in motion. Pick one meaningful action, complete it, and let the momentum stack.</p></div></motion.section>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={<Zap />} label="Total XP" value={totalXp.toLocaleString()} /><Stat icon={<Trophy />} label="Level" value={String(level)} /><Stat icon={<Flame />} label="Streak" value={`${streak}d`} /><Stat icon={<Target />} label="Today's missions" value={`${completedCount}/${missionSource.length}`} /></section>
          <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]"><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Level progress</p><p className="mt-2 text-2xl font-black">Level {level}</p></div><XpBadge xp={totalXp} /></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8, ease }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" /></div><p className="mt-2 text-xs text-slate-500">{Math.round(xpPct)}% toward the next level</p></div><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Today</p><p className="mt-3 text-lg font-bold">{dailyQuote.quote}</p><p className="mt-2 text-xs text-slate-500">— {dailyQuote.author}</p></div></section>
          <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">Daily missions</p><h2 className="mt-2 text-2xl font-black">Build momentum</h2></div><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">{completionPct}% complete</span></div><div className="mt-5 space-y-2">{missionSource.map((mission) => <button key={mission.id} onClick={() => handleCompleteMission(mission.id)} disabled={mission.completed || mutatingIds.has(mission.id)} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 text-left transition hover:border-cyan-300/20 hover:bg-white/[0.06] disabled:cursor-default disabled:opacity-70"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5">{mission.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Compass className="h-5 w-5 text-cyan-300" />}</div><div className="min-w-0 flex-1"><p className={mission.completed ? "text-sm font-semibold text-slate-500 line-through" : "text-sm font-semibold text-white"}>{mission.quest.title}</p><p className="mt-1 text-xs text-slate-500">{mission.quest.category} · +{mission.quest.xp_reward} XP</p></div>{mutatingIds.has(mission.id) && <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />}</button>)}</div></div><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.22em] text-fuchsia-300/80">Next action</p><h2 className="mt-2 text-2xl font-black">{nextMission?.quest.title || "You're all caught up"}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{nextMission?.completed ? "Excellent work. Keep the streak alive with another focused session." : "One small win is enough to change the direction of your day."}</p><button onClick={() => navigate("/focus")} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">Open Focus <Focus className="h-4 w-4" /></button></div></section>
        </main>
      </div>
    </MotionConfig>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center gap-3"><div className="text-cyan-300">{icon}</div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div></div></div>;
}
