import { createFileRoute } from "@tanstack/react-router";
import { motion, MotionConfig } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { DashboardWelcome, DashboardHabits, DashboardActivity } from "@/components/dashboard/DashboardSections";
import { DashboardAISection } from "@/components/dashboard/DashboardAISection";
import { todayISO } from "@/lib/habits";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { snapshot, isLoading, loadError, completeMission } = useDashboard();
  const { user, profile } = useAuth();
  const { habits, sessions, outstand, toggleToday, bestStreak, xp } = useAppState();
  const { log } = useDailyLog();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05070d] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.05]">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Building your day</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05070d] px-4 text-white">
        <div className="max-w-md rounded-3xl border border-red-400/15 bg-white/[0.04] p-7 text-center backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Something went wrong</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{loadError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const name = displayNameOf(user, profile) || snapshot.userName || "there";
  const today = todayISO();
  const completedHabits = habits.filter((habit) => habit.history?.includes(today)).length;
  const focusMinutes = sessions.filter((session) => session.completed).reduce((sum, session) => sum + Math.max(0, session.durationMin || 0), 0);
  const remaining = snapshot.missions.length - snapshot.completedCount;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-hidden bg-[#05070d] text-slate-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-cyan-500/[0.045] blur-[130px]" />
          <div className="absolute right-[-14rem] top-[34%] h-[34rem] w-[34rem] rounded-full bg-violet-500/[0.035] blur-[130px]" />
        </div>

        <main className="relative z-10 mx-auto w-full max-w-7xl space-y-5 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-9">
          <DashboardWelcome name={name} quote={snapshot.quote} />

          <section className="rounded-[30px] border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.065] via-white/[0.02] to-violet-300/[0.04] p-5 shadow-[0_30px_90px_-60px_rgba(34,211,238,.35)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Today</p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">One day. One clear plan.</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Start with the next action. Everything else stays secondary until it is time to act.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 sm:min-w-[170px]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Today's missions</p>
                <p className="mt-1 text-2xl font-black text-white">{snapshot.completedCount}/{snapshot.missions.length}</p>
                <p className="mt-1 text-[10px] text-slate-500">{remaining > 0 ? `${remaining} left to finish` : "Day complete"}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              <QuickStat label="Habits" value={`${completedHabits}/${habits.length}`} detail="done today" />
              <QuickStat label="Focus" value={`${focusMinutes}m`} detail="completed" />
              <QuickStat label="Score" value={log?.score != null ? String(log.score) : "—"} detail="latest check-in" />
            </div>
          </section>

          <DashboardAISection
            habits={habits}
            sessions={sessions}
            completedHabits={completedHabits}
            focusMinutes={focusMinutes}
            bestStreak={bestStreak}
            nextMission={snapshot.missions[0]}
            name={name}
            level={profile?.current_level ?? 1}
            xp={xp}
            roadmapProgress={snapshot.roadmapProgress}
            missions={snapshot.missions}
            onCompleteMission={completeMission}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <DashboardHabits habits={habits} onToggle={toggleToday} />
            <DashboardActivity sessions={sessions} outstand={outstand} dailyScore={log?.score ?? null} />
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

function QuickStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-3.5">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">{label}</p>
      <p className="mt-1.5 text-xl font-black text-white">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}
