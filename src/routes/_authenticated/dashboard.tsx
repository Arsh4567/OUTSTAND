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
import { CityEngine } from "@/components/city/CityEngine";
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

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400"><Activity className="h-4 w-4 text-emerald-300" /> Rhythm</div>
            <div className="mt-7 flex items-end gap-2"><span className="text-5xl font-black tracking-tight text-white">{completedCount}</span><span className="pb-1 text-sm text-slate-500">done today</span></div>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }).map((_, index) => (
                <motion.div key={index} initial={{ opacity: 0, scaleY: 0.5 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: index * 0.04 }} className={`h-14 origin-bottom rounded-md ${index < Math.max(2, Math.min(7, completedCount + 2)) ? "bg-gradient-to-t from-cyan-500/50 to-cyan-300/80" : "bg-white/5"}`} />
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Consistency beats intensity. Keep the streak alive.</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400"><Trophy className="h-4 w-4 text-amber-300" /> Level progress</div>
            <div className="mt-6 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl border border-amber-300/15 bg-amber-300/5 text-2xl font-black text-amber-100">{level}</div><div><div className="text-lg font-black text-white">Level {level}</div><div className="text-xs text-slate-500">Keep stacking XP</div></div></div>
            <div className="mt-7 h-2 rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8, ease }} className="h-full rounded-full bg-gradient-to-r from-amber-300 to-fuchsia-400" /></div>
            <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-widest text-slate-500"><span>Current</span><span>{Math.round(xpPct)}%</span></div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <motion.section variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-7">
              <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-fuchsia-200/80"><ShieldCheck className="h-4 w-4" /> Daily missions</div><h2 className="mt-2 text-xl font-black text-white">Your execution queue</h2></div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">{completedCount}/{habits.length}</span>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {habits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center"><Compass className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-400">No missions assigned yet.</p><p className="mt-1 text-xs text-slate-600">Your next sync will populate today’s queue.</p></div>
              ) : (
                habits.map((habit, index) => {
                  const isMutating = mutatingIds.has(habit.id);
                  return (
                    <motion.button
                      key={habit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      disabled={habit.completed || isMutating}
                      onClick={() => handleCompleteHabit(habit.id)}
                      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-200 ${habit.completed ? "border-emerald-400/15 bg-emerald-400/[0.04]" : "border-white/8 bg-white/[0.02] hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.045]"}`}
                    >
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${habit.completed ? "border-emerald-300/20 bg-emerald-300/10" : "border-white/10 bg-black/20"}`}><CheckCircle2 className={`h-5 w-5 ${habit.completed ? "text-emerald-300" : "text-slate-500"}`} /></div>
                      <div className="min-w-0 flex-1"><p className={`truncate text-sm font-bold ${habit.completed ? "text-slate-400 line-through" : "text-white"}`}>{habit.quest.title}</p><div className="mt-1 flex items-center gap-3 text-[11px] uppercase tracking-widest text-slate-500"><span>{habit.quest.category}</span><span>+{habit.quest.xp_reward} XP</span></div></div>
                      {!habit.completed && <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-300" />}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.section>

          <div className="space-y-6">
            <motion.section variants={fadeUp} initial="hidden" animate="show" className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950/95 to-cyan-950/20 p-6 shadow-2xl">
              <Quote className="absolute right-4 top-4 h-20 w-20 text-cyan-300/[0.07]" />
              <div className="relative"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200/75"><Quote className="h-4 w-4" /> Signal</div><p className="mt-5 text-lg font-bold leading-7 text-slate-100">“{dailyQuote.quote}”</p><div className="mt-4 flex flex-wrap items-center gap-3"><span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200">{dailyQuote.author}</span><span className="text-xs text-slate-500">{dailyQuote.application}</span></div></div>
            </motion.section>

            <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-200/80"><Clock3 className="h-4 w-4" /> Quick launch</div><h3 className="mt-2 text-lg font-black text-white">Start without thinking</h3></div><Sparkles className="h-5 w-5 text-amber-300/80" /></div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setIsPortalActive(true)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04]"><Focus className="h-5 w-5 text-cyan-300" /><div className="mt-3 text-sm font-bold text-white">Deep focus</div><div className="mt-1 text-[11px] text-slate-500">Open your focus space</div></button>
                <button onClick={() => document.getElementById("daily-city")?.scrollIntoView({ behavior: "smooth" })} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-fuchsia-300/20 hover:bg-fuchsia-300/[0.04]"><Compass className="h-5 w-5 text-fuchsia-300" /><div className="mt-3 text-sm font-bold text-white">Open city</div><div className="mt-1 text-[11px] text-slate-500">See your progress world</div></button>
              </div>
            </motion.section>
          </div>
        </div>

        <motion.section id="daily-city" variants={fadeUp} initial="hidden" animate="show" className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.02] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-200/80"><Compass className="h-4 w-4" /> Your world</div><h2 className="mt-2 text-xl font-black text-white">My City</h2><p className="mt-1 text-sm text-slate-500">A visual layer for the work you’re actually doing.</p></div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" /> Live progress</div>
          </div>
          <div className="min-h-[360px]"><CityEngine /></div>
        </motion.section>

        <motion.footer variants={fadeUp} initial="hidden" animate="show" className="pt-3 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">Build momentum • protect your attention • outstand the ordinary</motion.footer>
      </main>
    </div>
  );
}
