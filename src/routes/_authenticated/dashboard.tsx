import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, MotionConfig } from "framer-motion";
import { Loader2, RefreshCw, ArrowRight, Target, Timer, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { DashboardWelcome, DashboardHabits, DashboardIntelligence, DashboardMomentum } from "@/components/dashboard/DashboardSections";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { todayISO } from "@/lib/habits";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { snapshot, isLoading, loadError } = useDashboard();
  const { user, profile } = useAuth();
  const { toggleToday } = useAppState();
  const { log } = useDailyLog();

  if (isLoading) return <div className="grid min-h-screen bg-background text-foreground place-items-center"><div className="flex flex-col items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /><p className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Building your day</p></div></div>;
  if (loadError) return <div className="grid min-h-screen bg-background px-4 text-foreground place-items-center"><div className="max-w-md rounded-2xl border border-destructive/20 bg-card p-6 text-center shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Something went wrong</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 text-xs font-bold text-background transition hover:opacity-90"><RefreshCw className="h-3.5 w-3.5" /> Try again</button></div></div>;

  const name = displayNameOf(user, profile) || snapshot.userName || "there";
  const today = todayISO();
  const productivity = snapshot.productivity;
  const habits = productivity?.habits ?? [];
  const sessions = productivity?.sessions ?? [];
  const completedHabits = habits.filter((habit) => habit.history?.includes(today)).length;
  const habitCount = habits.length;
  const focusMinutes = sessions.filter((session) => session.completed).reduce((sum, session) => sum + Math.max(0, session.durationMin || 0), 0);
  const hasHabits = habitCount > 0;
  const hasFocus = sessions.some((session) => session.completed);
  const scoreValue = log?.score != null ? String(log.score) : null;
  const nextHabit = habits.find((habit) => !habit.history?.includes(today));

  const fallbackAction = !hasHabits
    ? { label: "Build your system", href: "/onboarding", icon: <Target className="h-4 w-4" />, text: "Choose a few habits so OUTSTAND can give you meaningful daily actions." }
    : nextHabit
      ? { label: `Complete ${nextHabit.name}`, href: "/dashboard", icon: <CheckCircle2 className="h-4 w-4" />, text: "One unfinished habit is your clearest next move today." }
      : !hasFocus
        ? { label: "Start a focus session", href: "/focus", icon: <Timer className="h-4 w-4" />, text: "Your habits are covered. Protect the momentum with one focused block." }
        : { label: "Review your roadmap", href: "/roadmap", icon: <ArrowRight className="h-4 w-4" />, text: "Your routine is moving. Use the roadmap for the next meaningful milestone." };

  return <MotionConfig reducedMotion="user"><div className="outstand-dashboard min-h-screen overflow-x-hidden bg-[#05070d] text-slate-100"><main className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pt-7">
    <DashboardWelcome name={name} quote={snapshot.quote} />

    <DashboardIntelligence habits={habits} sessions={sessions} completedHabits={completedHabits} focusMinutes={focusMinutes} bestStreak={snapshot.productivity?.bestStreak ?? 0} />

    <DashboardMomentum xp={snapshot.productivity?.xp ?? 0} level={snapshot.productivity?.level ?? 1} xpPct={snapshot.productivity?.xpPct ?? 0} streak={snapshot.productivity?.streak ?? 0} completedHabits={completedHabits} habitCount={habitCount} focusMinutes={focusMinutes} />

    <section className="rounded-[24px] border border-cyan-300/10 bg-cyan-300/[0.025] p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Right now</p><h2 className="mt-1.5 text-xl font-black tracking-tight text-white">{fallbackAction.label}</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">{fallbackAction.text}</p></div><Link to={fallbackAction.href as any} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200">{fallbackAction.icon}{fallbackAction.href === "/dashboard" ? "Go to habits" : fallbackAction.label}<ArrowRight className="h-3.5 w-3.5" /></Link></div>{scoreValue && <p className="mt-4 border-t border-white/[0.07] pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Latest daily score · <span className="text-slate-300">{scoreValue}</span></p>}</section>

    <div className="grid gap-4 lg:grid-cols-2"><DashboardHabits habits={habits} onToggle={toggleToday} /><RecentActivityPanel habits={habits} sessions={sessions} outstand={productivity?.outstand ?? []} dailyScore={log?.score ?? null} /></div>
  </main></div></MotionConfig>;
}
