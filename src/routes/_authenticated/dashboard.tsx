import { createFileRoute } from "@tanstack/react-router";
import { motion, MotionConfig } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { DashboardWelcome, DashboardMomentum, DashboardHabits, DashboardActivity } from "@/components/dashboard/DashboardSections";
import { DashboardAISection } from "@/components/dashboard/DashboardAISection";
import { OutstandMotionCore } from "@/components/outstand/OutstandMotionCore";
import { todayISO, levelFromXP } from "@/lib/habits";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { snapshot, isLoading, loadError, completeMission } = useDashboard();
  const { user, profile } = useAuth();
  const { habits, sessions, outstand, toggleToday, bestStreak, xp } = useAppState();
  const { log } = useDailyLog();

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-[#05070d] text-white"><div className="flex flex-col items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.05]"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Building your day</p></div></div>;
  if (loadError) return <div className="grid min-h-screen place-items-center bg-[#05070d] px-4 text-white"><div className="max-w-md rounded-3xl border border-red-400/15 bg-white/[0.04] p-7 text-center backdrop-blur-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Something went wrong</p><p className="mt-3 text-sm leading-6 text-slate-300">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950"><RefreshCw className="h-4 w-4" /> Try again</button></div></div>;

  const name = displayNameOf(user, profile) || snapshot.userName || "there";
  const today = todayISO();
  const completedHabits = habits.filter((habit) => habit.history?.includes(today)).length;
  const focusMinutes = sessions.filter((session) => session.completed).reduce((sum, session) => sum + Math.max(0, session.durationMin || 0), 0);
  const progress = levelFromXP(xp);

  return <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070d] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute left-[10%] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-cyan-500/[0.055] blur-[130px]" /><div className="absolute right-[-14rem] top-[34%] h-[34rem] w-[34rem] rounded-full bg-violet-500/[0.045] blur-[130px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" /></div>
      <div className="pointer-events-none fixed right-6 top-24 z-[1] hidden opacity-55 lg:block"><OutstandMotionCore size="lg" /></div>

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-5 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-9">
        <DashboardWelcome name={name} quote={snapshot.quote} />
        <section className="rounded-[30px] border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.07] via-white/[0.025] to-violet-300/[0.05] p-5 shadow-[0_30px_90px_-60px_rgba(34,211,238,.45)] sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Today</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Know exactly what to do.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Your dashboard is an execution command center: real priorities, real times and a few tasks you can actually finish.</p></div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 lg:min-w-[200px]"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Today's execution</p><p className="mt-1 text-2xl font-black text-white">{snapshot.completedCount}/{snapshot.missions.length || 0}</p><p className="mt-1 text-[10px] text-slate-500">{snapshot.missions.length ? `${snapshot.completionPct}% complete` : "Build your AI plan"}</p></div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Habits</p><p className="mt-2 text-2xl font-black text-white">{completedHabits}/{habits.length || 0}</p><p className="mt-1 text-[10px] text-slate-500">completed today</p></div><div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Focus</p><p className="mt-2 text-2xl font-black text-white">{focusMinutes}m</p><p className="mt-1 text-[10px] text-slate-500">completed focus time</p></div><div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Daily score</p><p className="mt-2 text-2xl font-black text-white">{log?.score ?? "—"}</p><p className="mt-1 text-[10px] text-slate-500">latest check-in</p></div></div>
        </section>
        <DashboardAISection habits={habits} sessions={sessions} completedHabits={completedHabits} focusMinutes={focusMinutes} bestStreak={bestStreak} nextMission={snapshot.missions[0]} name={name} level={progress.level} xp={xp} roadmapProgress={snapshot.roadmapProgress} missions={snapshot.missions} onCompleteMission={completeMission} />
        <DashboardMomentum xp={xp} level={progress.level} xpPct={progress.progressPct} streak={bestStreak} completedHabits={completedHabits} habitCount={habits.length} focusMinutes={focusMinutes} />
        <div className="grid gap-5 lg:grid-cols-2"><DashboardHabits habits={habits} onToggle={toggleToday} /><DashboardActivity sessions={sessions} outstand={outstand} dailyScore={log?.score ?? null} /></div>
      </main>
    </div>
  </MotionConfig>;
}
