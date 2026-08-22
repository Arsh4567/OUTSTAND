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
  const { toggleToday } = useAppState();
  const { log } = useDailyLog();

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-[#05070d] text-white"><div className="flex flex-col items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /><p className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-500">Building your day</p></div></div>;

  if (loadError) return <div className="grid min-h-screen place-items-center bg-[#05070d] px-4 text-white"><div className="max-w-md rounded-2xl border border-red-400/15 bg-white/[0.03] p-6 text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">Something went wrong</p><p className="mt-2 text-sm leading-6 text-slate-300">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-slate-950"><RefreshCw className="h-3.5 w-3.5" /> Try again</button></div></div>;

  const name = displayNameOf(user, profile) || snapshot.userName || "there";
  const today = todayISO();
  const productivity = snapshot.productivity;
  const completedHabits = productivity?.habits.filter((habit) => habit.history?.includes(today)).length ?? 0;
  const habitCount = productivity?.habits.length ?? 0;
  const focusMinutes = productivity?.sessions.filter((session) => session.completed).reduce((sum, session) => sum + Math.max(0, session.durationMin || 0), 0) ?? 0;
  const remaining = snapshot.missions.length - snapshot.completedCount;

  return <MotionConfig reducedMotion="user"><div className="min-h-screen overflow-x-hidden bg-[#05070d] text-slate-100"><main className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pt-7"><DashboardWelcome name={name} quote={snapshot.quote} />
    <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Today</p><h1 className="mt-1.5 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">One clear plan.</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">Start with the next action. Everything else stays secondary until it is time to act.</p></div><div className="rounded-xl border border-white/[0.06] bg-black/10 px-3.5 py-2.5 sm:min-w-[150px]"><p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-600">Today's missions</p><p className="mt-1 text-xl font-black text-white">{snapshot.completedCount}/{snapshot.missions.length}</p><p className="mt-0.5 text-[9px] text-slate-500">{remaining > 0 ? `${remaining} left` : "Day complete"}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><QuickStat label="Habits" value={productivity ? `${completedHabits}/${habitCount}` : "—"} detail="done today" /><QuickStat label="Focus" value={productivity ? `${focusMinutes}m` : "—"} detail="completed" /><QuickStat label="Score" value={log?.score != null ? String(log.score) : "—"} detail="latest check-in" /></div></section>
    <DashboardAISection habits={productivity?.habits ?? []} sessions={productivity?.sessions ?? []} completedHabits={completedHabits} focusMinutes={focusMinutes} bestStreak={snapshot.streak} nextMission={snapshot.missions[0]} name={name} level={profile?.current_level ?? snapshot.level} xp={snapshot.totalXp} roadmapProgress={snapshot.roadmapProgress} missions={snapshot.missions} onCompleteMission={completeMission} />
    <div className="grid gap-4 lg:grid-cols-2"><DashboardHabits habits={productivity?.habits ?? []} onToggle={toggleToday} /><DashboardActivity sessions={productivity?.sessions ?? []} outstand={productivity?.outstand ?? []} dailyScore={log?.score ?? null} /></div>
  </main></div></MotionConfig>;
}

function QuickStat({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3"><p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-1 text-lg font-black text-white">{value}</p><p className="mt-0.5 text-[9px] text-slate-500">{detail}</p></div>; }
