import { createFileRoute } from "@tanstack/react-router";
import { motion, MotionConfig } from "framer-motion";
import { Loader2, RefreshCw, ArrowRight, Timer, CheckCircle2, SlidersHorizontal } from "lucide-react";
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
  if (loadError) return <div className="grid min-h-screen bg-background px-4 text-foreground place-items-center"><div className="max-w-md rounded-2xl border border-destructive/20 bg-card p-6 text-center shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Something went wrong</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><RefreshCw className="h-3.5 w-3.5" /> Try again</button></div></div>;

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

  return <MotionConfig reducedMotion="user"><div className="outstand-dashboard min-h-screen overflow-x-hidden bg-background text-foreground"><main className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-20 pt-4 sm:space-y-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-7">
    <DashboardWelcome name={name} quote={snapshot.quote} />
    <DashboardIntelligence habits={habits} sessions={sessions} completedHabits={completedHabits} focusMinutes={focusMinutes} bestStreak={snapshot.productivity?.bestStreak ?? 0} />
    <DashboardMomentum xp={snapshot.productivity?.xp ?? 0} level={snapshot.productivity?.level ?? 1} xpPct={snapshot.productivity?.xpPct ?? 0} streak={snapshot.productivity?.streak ?? 0} completedHabits={completedHabits} habitCount={habitCount} focusMinutes={focusMinutes} />

    <section className="rounded-[22px] border border-primary/15 bg-primary/[0.035] p-4 shadow-sm sm:rounded-[24px] sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Right now</p><h2 className="mt-1.5 break-words text-xl font-black tracking-tight text-foreground">{!hasHabits ? "Build your habit system" : nextHabit ? `Complete ${nextHabit.name}` : !hasFocus ? "Start a focus session" : "Review your roadmap"}</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{!hasHabits ? "Pick the habits that actually matter to you. You can choose up to 7, or start with none." : nextHabit ? "One unfinished habit is your clearest next move today." : !hasFocus ? "Your habits are covered. Protect the momentum with one focused block." : "Your routine is moving. Use the roadmap for the next meaningful milestone."}</p></div><a href={!hasHabits ? "/habits" : nextHabit ? "#habits" : !hasFocus ? "/focus" : "/roadmap"} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">{!hasHabits ? <SlidersHorizontal className="h-4 w-4" /> : nextHabit ? <CheckCircle2 className="h-4 w-4" /> : <Timer className="h-4 w-4" />}{!hasHabits ? "Select habits" : nextHabit ? "Go to habits" : !hasFocus ? "Start focus" : "Open roadmap"}<ArrowRight className="h-3.5 w-3.5" /></a></div>{scoreValue && <p className="mt-4 border-t border-border pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Latest daily score · <span className="text-foreground">{scoreValue}</span></p>}</section>

    <div id="habits" className="grid gap-4 lg:grid-cols-2"><DashboardHabits habits={habits} onToggle={toggleToday} /><RecentActivityPanel habits={habits} sessions={sessions} outstand={productivity?.outstand ?? []} dailyScore={log?.score ?? null} /></div>
  </main></div></MotionConfig>;
}
