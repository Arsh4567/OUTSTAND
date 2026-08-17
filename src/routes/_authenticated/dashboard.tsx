import { createFileRoute } from "@tanstack/react-router";
import { motion, MotionConfig } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { DashboardWelcome, DashboardMomentum, DashboardHabits, DashboardRoadmap, DashboardActivity } from "@/components/dashboard/DashboardSections";
import { DashboardAISection } from "@/components/dashboard/DashboardAISection";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { snapshot, isLoading, loadError, completeMission } = useDashboard();
  const { user, profile } = useAuth();
  const { habits, sessions, outstand, toggleToday, bestStreak, xp } = useAppState();
  const { log } = useDailyLog();

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-[#05070d] text-white"><div className="flex flex-col items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.05]"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Building your day</p></div></div>;
  if (loadError) return <div className="grid min-h-screen place-items-center bg-[#05070d] px-4 text-white"><div className="max-w-md rounded-3xl border border-red-400/15 bg-white/[0.04] p-7 text-center backdrop-blur-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Something went wrong</p><p className="mt-3 text-sm leading-6 text-slate-300">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950"><RefreshCw className="h-4 w-4" /> Try again</button></div></div>;

  const name = displayNameOf(user, profile) || snapshot.userName || "there";
  const today = new Date().toISOString().slice(0, 10);
  const completedHabits = habits.filter((habit) => habit.history?.includes(today)).length;
  const focusMinutes = sessions.filter((session) => session.completed).reduce((sum, session) => sum + Math.max(0, session.durationMin || 0), 0);
  const nextMission = snapshot.missions.find((mission) => !mission.completed);

  return <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070d] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute left-[12%] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-cyan-500/[0.055] blur-[130px]" /><div className="absolute right-[-14rem] top-[28%] h-[34rem] w-[34rem] rounded-full bg-violet-500/[0.045] blur-[130px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" /></div>
      <main className="relative z-10 mx-auto w-full max-w-none space-y-5 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-9 xl:px-0">
        <DashboardWelcome name={name} quote={snapshot.quote} />
        <DashboardAISection habits={habits} sessions={sessions} completedHabits={completedHabits} focusMinutes={focusMinutes} bestStreak={bestStreak} nextMission={nextMission} name={name} level={snapshot.level} xp={Math.max(xp, snapshot.totalXp)} />
        <DashboardMomentum xp={Math.max(xp, snapshot.totalXp)} level={snapshot.level} xpPct={snapshot.xpPct} streak={Math.max(bestStreak, snapshot.streak)} completedHabits={completedHabits} habitCount={habits.length} focusMinutes={focusMinutes} />
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-[1.08fr_0.92fr]">
          <DashboardHabits habits={habits} onToggle={toggleToday} />
          <DashboardRoadmap habits={habits} missions={snapshot.missions} nextMission={nextMission} onCompleteMission={completeMission} />
        </div>
        <DashboardActivity sessions={sessions} outstand={outstand} dailyScore={log?.score ?? null} />
      </main>
    </div>
  </MotionConfig>;
}
