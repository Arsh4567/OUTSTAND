import { createFileRoute } from "@tanstack/react-router";
import { motion, MotionConfig, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Activity, Flame, Target, Timer, Trophy, TrendingUp, UserRound, Zap, ArrowUpRight, CalendarDays } from "lucide-react";

import { useProfileState } from "@/hooks/use-profile-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Outstand" },
      { name: "description", content: "Your Outstand identity, progress, momentum, habits, and achievements." },
    ],
  }),
  component: ProfilePage,
});

const ease = [0.22, 1, 0.36, 1] as const;
const card = "rounded-[2rem] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl";

function ProfilePage() {
  const state = useProfileState();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 160, damping: 18 });
  const springY = useSpring(y, { stiffness: 160, damping: 18 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-10deg", "10deg"]);

  const onBadgeMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetBadge = () => { x.set(0); y.set(0); };
  const completion = state.stats.productivity;
  const initial = (state.name || "U").charAt(0).toUpperCase();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-2 sm:px-6 lg:space-y-8 lg:px-8"
      >
        <motion.section
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.035] to-fuchsia-500/[0.06] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:32px_32px]" />
          </div>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <div className="absolute -inset-2 rounded-[1.8rem] border border-cyan-300/20 bg-cyan-300/[0.03] blur-[1px]" />
                <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950 shadow-2xl sm:h-28 sm:w-28">
                  {state.isUploading ? (
                    <Activity className="h-8 w-8 animate-pulse text-cyan-300" />
                  ) : state.profile?.avatar_url ? (
                    <img src={state.profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="bg-gradient-to-br from-cyan-200 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent">{initial}</span>
                  )}
                </div>
                <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Outstand profile</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{state.getRankTitle(state.level)}</span>
                </div>
                <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{state.name || "Your profile"}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your personal operating record — momentum, habits, focus, and the consistency you are building.</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300"><UserRound className="h-3.5 w-3.5 text-cyan-300" /> ID {(state.user?.id || "unknown").slice(0, 8)}</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300"><CalendarDays className="h-3.5 w-3.5 text-fuchsia-300" /> {state.bestStreak} day best streak</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-center sm:min-w-32">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Level</div>
                <div className="mt-1 text-2xl font-black text-white">{state.level}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-center sm:min-w-32">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">XP</div>
                <div className="mt-1 text-2xl font-black text-cyan-200">{state.xp}</div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <motion.section
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }}
            className={cn(card, "relative overflow-hidden p-7 sm:p-8")}
            onMouseMove={onBadgeMove}
            onMouseLeave={resetBadge}
          >
            <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="relative flex min-h-[360px] flex-col justify-between">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300/80">Current level</div>
                <div className="mt-2 text-7xl font-black tracking-tighter text-white">{state.level}</div>
                <p className="mt-1 text-sm text-slate-500">{state.getRankTitle(state.level)} class</p>
              </div>

              <div className="relative z-10" style={{ transform: "translateZ(35px)" }}>
                <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>Progress to next level</span>
                  <span className="text-white">{state.into} / {state.need}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/40">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${state.pct}%` }} transition={{ duration: 1.2, ease }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-300 shadow-[0_0_24px_rgba(34,211,238,0.45)]" />
                </div>
                <div className="mt-3 text-xs text-slate-500">{state.need - state.into > 0 ? `${state.need - state.into} XP until the next level.` : "Level complete — keep the momentum moving."}</div>
              </div>
            </motion.div>
          </motion.section>

          <section className="grid gap-4 sm:grid-cols-2">
            <StatCard icon={<Zap className="text-cyan-300" />} label="Total XP" value={String(state.xp)} note="Lifetime progress" />
            <StatCard icon={<Activity className="text-emerald-300" />} label="Productivity" value={`${completion}%`} note="Current momentum" />
            <StatCard icon={<Flame className="text-orange-300" />} label="Best streak" value={`${state.bestStreak}d`} note="Consistency peak" />
            <StatCard icon={<Target className="text-fuchsia-300" />} label="Habit completions" value={String(state.stats.totalCompletions)} note="Actions completed" />
          </section>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <motion.section variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }} className={cn(card, "p-6 sm:p-8")}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300/80"><TrendingUp className="h-4 w-4" /> Momentum</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Dopamine velocity</h2>
                <p className="mt-1 text-sm text-slate-500">Your recent consistency signal over the last 7 days.</p>
              </div>
              <div className="text-right"><div className="text-3xl font-black text-white">{state.stats.avg}</div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Avg score</div></div>
            </div>
            <div className="mt-8 h-64 w-full overflow-hidden rounded-2xl border border-white/5 bg-black/15 p-3">
              <SimpleTrend logs={state.logs} />
            </div>
          </motion.section>

          <motion.section variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }} className={cn(card, "p-6 sm:p-8")}>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-orange-300/80"><Flame className="h-4 w-4" /> Active fire</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Your strongest habits</h2>
            <div className="mt-6 space-y-3">
              {state.habits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-center text-sm text-slate-500">Your first completed habit will appear here.</div>
              ) : state.habits.slice(0, 5).map((habit) => {
                const streak = state.streaks.find((item) => item?.id === habit.id)?.streak ?? 0;
                return <div key={habit.id} className="flex items-center justify-between rounded-2xl border border-white/7 bg-black/15 px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="text-xl">{habit.emoji}</span><span className="truncate text-sm font-bold text-slate-200">{habit.name}</span></div><span className="rounded-full border border-orange-400/15 bg-orange-400/10 px-2.5 py-1 text-xs font-black text-orange-200">{streak}d</span></div>;
              })}
            </div>
          </motion.section>
        </section>

        <section className={cn(card, "p-6 sm:p-8")}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300/80"><TrendingUp className="h-4 w-4" /> Consistency</div><h2 className="mt-2 text-2xl font-black tracking-tight text-white">30-day action map</h2><p className="mt-1 text-sm text-slate-500">A visual record of how often your habits were completed.</p></div>
            <div className="text-xs font-semibold text-slate-500">{state.stats.habitPct}% today</div>
          </div>
          <div className="mt-8 flex h-44 items-end gap-1 overflow-x-auto">
            {state.stats.dayStats.map((item) => (
              <div key={item.d} className="group relative flex h-full min-w-[8px] flex-1 items-end rounded-lg bg-white/[0.015]">
                <div className={cn("w-full rounded-md transition-all duration-300", item.ratio === 0 ? "bg-white/5" : item.ratio < 0.5 ? "bg-indigo-900" : item.ratio < 1 ? "bg-indigo-500" : "bg-emerald-400") } style={{ height: `${Math.max(10, item.ratio * 100)}%` }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-[10px] font-bold text-white opacity-0 shadow-xl transition-all group-hover:translate-y-0 group-hover:opacity-100">{item.done}/{item.total} habits</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniMetric icon={<Timer className="text-indigo-300" />} label="Focus sessions" value={String(state.stats.focusCompleted)} />
          <MiniMetric icon={<Activity className="text-emerald-300" />} label="Focus minutes" value={String(state.stats.focusMinutes)} />
          <MiniMetric icon={<Zap className="text-yellow-300" />} label="Challenges" value={String(state.outstand.length)} />
          <MiniMetric icon={<Trophy className="text-purple-300" />} label="Habits built" value={String(state.habits.length)} />
        </section>

        <motion.section variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }} className="flex flex-col gap-4 rounded-[2rem] border border-white/[0.08] bg-gradient-to-r from-white/[0.04] to-transparent p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div><div className="text-sm font-black text-white">Keep building the system.</div><div className="mt-1 text-sm text-slate-500">Your profile is a record of what you repeat — not just what you plan.</div></div>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-white transition hover:border-cyan-300/20 hover:bg-white/[0.08]">Back to top <ArrowUpRight className="h-4 w-4" /></button>
        </motion.section>
      </motion.div>
    </MotionConfig>
  );
}

function StatCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <motion.div whileHover={{ y: -3 }} className={cn(card, "p-6 transition-all hover:border-white/[0.14]")}><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl border border-white/8 bg-white/[0.04]">{icon}</div><ArrowUpRight className="h-4 w-4 text-slate-700" /></div><div className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</div><div className="mt-1 text-3xl font-black tracking-tight text-white">{value}</div><div className="mt-1 text-xs text-slate-600">{note}</div></motion.div>;
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><div className="flex items-center gap-2">{icon}<span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span></div><div className="mt-3 text-2xl font-black text-white">{value}</div></div>;
}

function SimpleTrend({ logs }: { logs: Array<{ date?: string; score?: number }> }) {
  const values = logs.map((item) => Math.max(0, Math.min(100, item.score ?? 0)));
  const points = values.length ? values : [0];
  const maxX = Math.max(1, points.length - 1);
  const d = points.map((value, index) => {
    const x = (index / maxX) * 100;
    const y = 100 - value;
    return `${x},${y}`;
  }).join(" ");

  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full"><defs><linearGradient id="profileTrendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgba(34,211,238,0.32)" /><stop offset="100%" stopColor="rgba(34,211,238,0)" /></linearGradient></defs><polyline points={`0,100 ${d} 100,100`} fill="url(#profileTrendFill)" stroke="none" /><polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.7" vectorEffect="non-scaling-stroke" className="text-cyan-300" /></svg>;
}
