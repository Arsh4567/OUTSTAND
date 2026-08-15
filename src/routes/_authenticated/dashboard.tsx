import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Flame,
  Focus,
  Loader2,
  Quote,
  Sparkles,
  Target,
  Trophy,
  Zap,
  X,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { OutstandPage } from "./outstand";
import { XpBadge } from "../../components/xp-badge";
import { QUOTES } from "../../lib/quotes";
import type { DailyQuest } from "../../types/dashboard";
import { PortalEngine, Quality } from "../../lib/portal-effect";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardHQ,
});

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

function DashboardHQ() {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("there");
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpPct, setXpPct] = useState(0);
  const [streak, setStreak] = useState(0);
  const [habits, setHabits] = useState<DailyQuest[]>([]);
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());
  const [isPortalActive, setIsPortalActive] = useState(false);
  const [isPortalFullyOpen, setIsPortalFullyOpen] = useState(false);
  const portalRef = useRef<PortalEngine | null>(null);
  const portalContainerRef = useRef<HTMLDivElement>(null);

  const applyStats = (data: any) => {
    if (!data) return;
    setTotalXp(data.total_xp || 0);
    setLevel(data.level || 1);
    setStreak(data.streak_days || 0);
    const next = data.next_level_xp || 1000;
    setXpPct(Math.min(100, Math.max(0, ((data.current_level_xp || 0) / next) * 100)));
  };

  const loadDashboard = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const uid = session.user.id;
    setUserId(uid);

    const meta = session.user.user_metadata || {};
    const rawName =
      meta.display_name ||
      meta.full_name ||
      meta.first_name ||
      meta.username ||
      session.user.email?.split("@")[0] ||
      "there";

    setUserName(String(rawName).trim().split(/\s+/)[0] || "there");

    const localDate = new Date().toLocaleDateString("en-CA");
    const [statsRes, habitsRes] = await Promise.all([
      supabase.from("user_stats").select("*").eq("user_id", uid).single(),
      supabase
        .from("daily_quests")
        .select("id, completed, quests(id, title, category, difficulty, xp_reward)")
        .eq("user_id", uid)
        .eq("assigned_date", localDate),
    ]);

    applyStats(statsRes.data);

    if (habitsRes.data) {
      const mapped: DailyQuest[] = habitsRes.data
        .map((row) => {
          const qData = Array.isArray(row.quests) ? row.quests[0] : row.quests;
          if (!qData) return null;
          return {
            id: row.id,
            completed: row.completed || false,
            quest: {
              id: qData.id,
              title: qData.title,
              category: qData.category as any,
              difficulty: qData.difficulty as any,
              xp_reward: qData.xp_reward,
            },
          };
        })
        .filter((q): q is DailyQuest => q !== null && q.quest.category !== "Outstand");
      setHabits(mapped);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadDashboard()
      .catch((error) => console.error("Dashboard load failed", error))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const refreshStats = async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("total_xp, level, streak_days, current_level_xp, next_level_xp")
        .eq("user_id", userId)
        .single();
      applyStats(data);
    };

    const channel = supabase
      .channel(`dashboard_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${userId}` },
        refreshStats,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!isPortalActive || !portalContainerRef.current || portalRef.current) return;

    const engine = new PortalEngine({
      container: portalContainerRef.current,
      quality: Quality.HIGH,
      onOpen: () => setIsPortalFullyOpen(true),
      onClose: () => setIsPortalFullyOpen(false),
    });

    portalRef.current = engine;
    engine.open();

    return () => {
      engine.dispose();
      if (portalRef.current === engine) portalRef.current = null;
      setIsPortalFullyOpen(false);
    };
  }, [isPortalActive]);

  const dailyQuote = useMemo(() => {
    if (Array.isArray(QUOTES) && QUOTES.length > 0) {
      return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }
    return {
      quote: "Small actions, repeated daily, create extraordinary change.",
      author: "Outstand",
      application: "Protect the next hour.",
    };
  }, []);

  const completedCount = habits.filter((habit) => habit.completed).length;
  const completionPct = habits.length ? Math.round((completedCount / habits.length) * 100) : 0;
  const nextHabit = habits.find((habit) => !habit.completed) || habits[0];

  const handleCompleteHabit = async (habitId: string) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit || habit.completed || mutatingIds.has(habitId)) return;

    setMutatingIds((prev) => new Set(prev).add(habitId));
    setHabits((prev) => prev.map((item) => (item.id === habitId ? { ...item, completed: true } : item)));

    const { error } = await supabase.rpc("complete_daily_quest", { p_daily_quest_id: habitId });

    if (error) {
      setHabits((prev) => prev.map((item) => (item.id === habitId ? { ...item, completed: false } : item)));
      toast.error("Could not verify that mission.");
    } else {
      toast.success("Mission complete", { description: `+${habit.quest.xp_reward} XP added.` });
      setTotalXp((prev) => prev + habit.quest.xp_reward);
    }

    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.delete(habitId);
      return next;
    });
  };

  const closePortal = () => {
    setIsPortalActive(false);
    setIsPortalFullyOpen(false);
    portalRef.current?.dispose();
    portalRef.current = null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050816] text-white grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(59,130,246,0.18)]">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Preparing your command center</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-20%] h-[55rem] w-[55rem] -translate-x-1/2 rounded-full bg-cyan-500/[0.045] blur-[120px]" />
        <div className="absolute right-[-10%] top-[15%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/[0.045] blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      {isPortalActive && (
        <div className="fixed inset-0 z-[10000] flex flex-col bg-black/80 backdrop-blur-sm">
          <div ref={portalContainerRef} className="absolute inset-0 z-0 overflow-hidden" />
          <button
            onClick={closePortal}
            className="absolute right-5 top-5 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/40 text-white shadow-2xl backdrop-blur-xl transition hover:scale-105 hover:bg-red-500/20"
            aria-label="Close focus portal"
          >
            <X className="h-5 w-5" />
          </button>
          <AnimatePresence>
            {isPortalFullyOpen && (
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.45, ease }}
                className="relative z-10 flex-1 overflow-y-auto px-4 pb-20 pt-20 md:px-8"
              >
                <OutstandPage />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <motion.section variants={fadeUp} initial="hidden" animate="show" className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">
              <Sparkles className="h-3.5 w-3.5" /> Personal command center
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Welcome back, <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">{userName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Your day is already in motion. Pick one meaningful action, complete it, and let the momentum stack.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm shadow-lg backdrop-blur-xl">
              <Flame className="h-4 w-4 text-amber-300" />
              <span className="font-black text-white">{streak}</span>
              <span className="text-slate-500">day streak</span>
            </div>
            <XpBadge xp={totalXp} level={level} pct={xpPct} variantId="dash-redesign" />
          </div>
        </motion.section>

        <motion.section variants={fadeUp} initial="hidden" animate="show" className="mb-6 grid gap-4 lg:grid-cols-[1.45fr_0.8fr_0.8fr]">
          <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/[0.10] via-white/[0.035] to-fuchsia-500/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-7">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl transition duration-500 group-hover:bg-cyan-400/20" />
            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80"><Target className="h-4 w-4" /> Today’s focus</div>
                <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200">{completionPct}% complete</span>
              </div>
              <h2 className="max-w-xl text-2xl font-black tracking-tight text-white sm:text-3xl">Make progress feel visible.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">You have {habits.length} missions in today’s queue. The next small win is enough to start the chain.</p>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.9, ease }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsPortalActive(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-cyan-500/10"
                >
                  <Focus className="h-4 w-4" /> Enter focus mode
                </button>
                {nextHabit && !nextHabit.completed && (
                  <button
                    onClick={() => handleCompleteHabit(nextHabit.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-bold text-white transition hover:border-cyan-400/30 hover:bg-white/5"
                  >
                    <Zap className="h-4 w-4 text-amber-300" /> Complete next mission
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl backdrop-blur-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-300"><Flame className="h-4 w-4 text-amber-300" /> Rhythm</div>
              <Activity className="h-4 w-4 text-slate-600" />
            </div>
            <div className="mt-6 flex items-end gap-1.5">
              {[32, 54, 42, 72, 58, 86, Math.max(18, completionPct)].map((height, index) => (
                <motion.div key={index} initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: 0.55 + index * 0.05, delay: index * 0.04 }} className="w-full rounded-full bg-gradient-to-t from-cyan-400/25 to-cyan-300/75" />
              ))}
            </div>
            <p className="mt-5 text-sm font-semibold text-white">{streak} day{streak === 1 ? "" : "s"} in a row</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Consistency compounds faster than intensity.</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl backdrop-blur-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-300"><Trophy className="h-4 w-4 text-fuchsia-300" /> Level path</div>
              <span className="text-xs font-black text-fuchsia-200">Lv {level}</span>
            </div>
            <p className="mt-6 text-3xl font-black tracking-tight text-white">{Math.round(xpPct)}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8, ease }} className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400" />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Keep stacking completed missions to reach the next level.</p>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 shadow-xl backdrop-blur-2xl sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80"><CheckCircle2 className="h-4 w-4" /> Daily missions</div>
                <h2 className="mt-2 text-2xl font-black text-white">Finish strong.</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">{completedCount}/{habits.length || 0} complete</span>
            </div>

            <div className="space-y-3">
              {habits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center">
                  <Compass className="mx-auto h-7 w-7 text-slate-600" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No missions assigned yet.</p>
                  <p className="mt-1 text-xs text-slate-600">Your next session will populate this queue.</p>
                </div>
              ) : (
                habits.map((habit) => {
                  const isMutating = mutatingIds.has(habit.id);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleCompleteHabit(habit.id)}
                      disabled={habit.completed || isMutating}
                      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-200 ${habit.completed ? "border-emerald-400/10 bg-emerald-400/[0.04]" : "border-white/10 bg-black/10 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-white/[0.045]"}`}
                    >
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${habit.completed ? "bg-emerald-400/10 text-emerald-300" : "bg-cyan-400/10 text-cyan-300"}`}>
                        {habit.completed ? <CheckCircle2 className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${habit.completed ? "text-emerald-100/80 line-through" : "text-white"}`}>{habit.quest.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                          <span>{habit.quest.category}</span>
                          <span>•</span>
                          <span>+{habit.quest.xp_reward} XP</span>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-700 transition group-hover:text-cyan-300" />
                    </button>
                  );
                })
              )}
            </div>
          </motion.section>

          <div className="space-y-6">
            <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-xl backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-200/80"><Quote className="h-4 w-4" /> Signal</div>
              <p className="mt-5 text-xl font-bold leading-8 text-white">“{dailyQuote.quote}”</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-full border border-fuchsia-400/15 bg-fuchsia-400/10 px-3 py-1.5 font-black uppercase tracking-widest text-fuchsia-200">{dailyQuote.author}</span>
                {dailyQuote.application && <span className="text-slate-500">{dailyQuote.application}</span>}
              </div>
            </motion.section>

            <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/[0.07] to-cyan-400/[0.03] p-6 shadow-xl backdrop-blur-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/80"><ShieldCheck className="h-4 w-4" /> Quick launch</div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setIsPortalActive(true)} className="rounded-2xl border border-white/10 bg-black/15 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/25">
                  <Focus className="h-5 w-5 text-cyan-300" />
                  <p className="mt-3 text-sm font-black text-white">Focus portal</p>
                  <p className="mt-1 text-xs text-slate-600">Start a deep session</p>
                </button>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-left">
                  <Clock3 className="h-5 w-5 text-fuchsia-300" />
                  <p className="mt-3 text-sm font-black text-white">Today</p>
                  <p className="mt-1 text-xs text-slate-600">{completedCount} missions cleared</p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>

        <motion.section variants={fadeUp} initial="hidden" animate="show" className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.035] to-cyan-500/[0.025] p-6 shadow-xl backdrop-blur-2xl sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-300"><Activity className="h-4 w-4 text-cyan-300" /> Momentum</div>
              <h2 className="mt-2 text-2xl font-black text-white">Your dashboard should feel alive.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Everything here is designed to reduce friction: fewer decisions, stronger feedback, and a clear next action.</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-3 text-sm">
              <p className="font-black text-emerald-200">Keep the chain going.</p>
              <p className="mt-1 text-xs text-emerald-200/40">One completed action is enough for the next step.</p>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
