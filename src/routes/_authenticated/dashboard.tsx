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

type Stats = { total_xp?: number; level?: number; streak_days?: number; current_level_xp?: number; next_level_xp?: number };
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
    if (!data) return;
    setTotalXp(data.total_xp ?? 0);
    setLevel(data.level ?? 1);
    setStreak(data.streak_days ?? 0);
    const next = data.next_level_xp ?? 1000;
    setXpPct(Math.min(100, Math.max(0, ((data.current_level_xp ?? 0) / next) * 100)));
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
    const localDate = new Date().toLocaleDateString("en-CA");
    const [statsRes, habitsRes] = await Promise.all([
      supabase.from("user_stats").select("total_xp, level, streak_days, current_level_xp, next_level_xp").eq("user_id", session.user.id).single(),
      supabase.from("daily_quests").select("id, completed, quests(id, title, category, difficulty, xp_reward)").eq("user_id", session.user.id).eq("assigned_date", localDate),
    ]);
    if (signal?.aborted) return;
    if (statsRes.error && statsRes.error.code !== "PGRST116") throw statsRes.error;
    if (habitsRes.error) throw habitsRes.error;
    applyStats(statsRes.data as Stats | null);
    const rows = (habitsRes.data ?? []) as QuestRow[];
    const mapped: DailyQuest[] = rows.map((row) => {
      const qData = Array.isArray(row.quests) ? row.quests[0] : row.quests;
      if (!qData) return null;
      return {
        id: row.id,
        completed: row.completed ?? false,
        quest: { id: qData.id, title: qData.title, category: qData.category as DailyQuest["quest"]["category"], difficulty: qData.difficulty as DailyQuest["quest"]["difficulty"], xp_reward: qData.xp_reward },
      } as DailyQuest;
    }).filter((q): q is DailyQuest => q !== null && q.quest.category !== "Outstand");
    setHabits(mapped);
  };

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal).catch((error) => {
      if (!controller.signal.aborted) {
        console.error("Dashboard load failed", error);
        setLoadError("We couldn't load your dashboard data.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const refreshStats = async () => {
      const { data, error } = await supabase.from("user_stats").select("total_xp, level, streak_days, current_level_xp, next_level_xp").eq("user_id", userId).single();
      if (!error) applyStats(data as Stats | null);
    };
    const channel = supabase.channel(`dashboard_${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${userId}` }, refreshStats).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  const dailyQuote = useMemo(() => {
    if (Array.isArray(QUOTES) && QUOTES.length > 0) return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return { quote: "Small actions, repeated daily, create extraordinary change.", author: "Outstand", application: "Protect the next hour." };
  }, []);

  const missionSource: DailyQuest[] = habits.length > 0 ? habits : fallbackMissions.map((mission) => ({ id: mission.id, completed: fallbackCompleted.has(mission.id), quest: mission as unknown as DailyQuest["quest"] }));
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
      setTotalXp((prev) => prev + mission.quest.xp_reward);
    }
    setMutatingIds((prev) => { const next = new Set(prev); next.delete(missionId); return next; });
  };

  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isLoading) return <div className="min-h-screen bg-[#050816] text-white grid place-items-center"><div className="flex flex-col items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Preparing your command center</p></div></div>;
  if (loadError) return <div className="min-h-screen bg-[#050816] text-white grid place-items-center px-4"><div className="max-w-md rounded-3xl border border-red-400/15 bg-white/[0.04] p-6 text-center"><p className="text-sm text-red-200">{loadError}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Reload dashboard</button></div></div>;

  return <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
    <div className="relative min-h-screen overflow-x-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute left-1/2 top-[-20%] h-[55rem] w-[55rem] -translate-x-1/2 rounded-full bg-cyan-500/[0.045] blur-[120px]" /><div className="absolute right-[-10%] top-[15%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/[0.045] blur-[110px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" /></div>
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <motion.section variants={fadeUp} initial="hidden" animate="show" className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80"><Sparkles className="h-3.5 w-3.5" /> Personal command center</div><h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">Welcome back, <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">{userName}</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Your day is already in motion. Pick one meaningful action, complete it, and let the momentum stack.</p></div><div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm"><Flame className="h-4 w-4 text-amber-300" /><span className="font-black text-white">{streak}</span><span className="text-slate-500">day streak</span></div><XpBadge xp={totalXp} level={level} pct={xpPct} variantId="dash-redesign" /></div></motion.section>
        <motion.section variants={fadeUp} initial="hidden" animate="show" className="mb-6 grid gap-4 lg:grid-cols-[1.45fr_0.8fr_0.8fr]"><div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/[0.10] via-white/[0.035] to-fuchsia-500/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-7"><div className="relative"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80"><Target className="h-4 w-4" /> Today’s focus</div><span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200">{completionPct}% complete</span></div><h2 className="max-w-xl text-2xl font-black tracking-tight text-white sm:text-3xl">Make progress feel visible.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">You have {missionSource.length} daily missions in today’s queue. The next small win is enough to start the chain.</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.9, ease }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" /></div><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => navigate({ to: "/focus" })} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><Focus className="h-4 w-4" /> Enter focus mode</button>{nextMission && !nextMission.completed && <button onClick={() => handleCompleteMission(nextMission.id)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-bold text-white transition hover:border-cyan-400/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><Zap className="h-4 w-4 text-amber-300" /> Complete next mission</button>}</div></div></div><div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-xl"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/80"><Flame className="h-4 w-4" /> Daily rhythm</div><div className="mt-6 flex items-end gap-1.5">{[38,55,44,70,62,78,Math.max(18,completionPct)].map((height,index)=><motion.div key={index} initial={{height:0}} animate={{height:`${height}%`}} transition={{delay:index*0.05,duration:0.45,ease}} className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan-500/30 to-cyan-300/80" />)}</div><p className="mt-4 text-sm text-slate-400">Consistency beats intensity. Keep the streak alive.</p></div><div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-xl"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-200/80"><Trophy className="h-4 w-4" /> Progress level</div><div className="mt-5 text-3xl font-black text-white">Level {level}</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><motion.div initial={{width:0}} animate={{width:`${xpPct}%`}} transition={{duration:0.9,ease}} className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" /></div><p className="mt-3 text-sm text-slate-400">{totalXp.toLocaleString()} XP earned. Keep stacking small wins.</p></div></motion.section>
        <motion.section variants={fadeUp} initial="hidden" animate="show" className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-6"><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80"><Compass className="h-4 w-4" /> Daily missions</div><h2 className="mt-2 text-2xl font-black text-white">Your next wins</h2></div><div className="text-xs font-semibold uppercase tracking-widest text-slate-500">{completedCount}/{missionSource.length} complete</div></div><div className="grid gap-3 md:grid-cols-2">{missionSource.map((mission)=><motion.button key={mission.id} whileHover={{y:-2}} whileTap={{scale:0.99}} disabled={mission.completed || mutatingIds.has(mission.id)} onClick={()=>handleCompleteMission(mission.id)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${mission.completed?"border-emerald-500/20 bg-emerald-500/[0.06]":"border-white/10 bg-black/10 hover:border-cyan-400/25"}`}><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${mission.completed?"bg-emerald-400/10 text-emerald-300":"bg-cyan-400/10 text-cyan-300"}`}>{mission.completed?<CheckCircle2 className="h-5 w-5"/>:<Target className="h-5 w-5"/>}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-white">{mission.quest.title}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{mission.quest.category} · +{mission.quest.xp_reward} XP</p></div></motion.button>)}</div></motion.section>
        <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-200/80">Daily signal</div><p className="mt-3 max-w-3xl text-lg font-semibold text-slate-200">“{dailyQuote.quote}”</p><p className="mt-2 text-sm text-slate-500">{dailyQuote.author}{dailyQuote.application ? ` · ${dailyQuote.application}` : ""}</p></div><button onClick={() => navigate({ to: "/focus" })} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Start a session <Focus className="h-4 w-4" /></button></div></motion.section>
      </main>
    </div>
  </MotionConfig>;
}
