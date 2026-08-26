import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, ListChecks, Target, TrendingUp, BookOpen } from "lucide-react";
import type { Habit, FocusSession } from "@/lib/habits";
import type { DashboardMission, RoadmapProgress } from "@/hooks/useDashboard";
import { useRoadmap } from "@/hooks/use-roadmap";
import { AIRoadmapBuilderV2 } from "./AIRoadmapBuilderV2";
import { DashboardExecutionPlan } from "./DashboardExecutionPlan";

const panel = "rounded-[24px] border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_60px_-48px_rgba(34,211,238,.35)] backdrop-blur-xl";

export function DashboardAISection({ habits, sessions, completedHabits, focusMinutes, bestStreak, name, level, xp, roadmapProgress, missions, onCompleteMission }: { habits: Habit[]; sessions: FocusSession[]; completedHabits: number; focusMinutes: number; bestStreak: number; nextMission?: DashboardMission; name: string; level: number; xp: number; roadmapProgress: RoadmapProgress | null; missions: DashboardMission[]; onCompleteMission: (id: string) => void }) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const { roadmap, tasks, loading: roadmapLoading, generating } = useRoadmap();

  const currentDay = roadmapProgress?.day ?? 1;
  const timetable = tasks.filter((task) => task.day_number === currentDay && task.title && task.instructions && task.start_time && task.end_time).slice(0, 3).map((task) => ({
    startTime: task.start_time!,
    endTime: task.end_time!,
    durationMinutes: task.estimated_minutes ?? 30,
    task: task.title,
    why: task.instructions,
  }));
  const completion = Math.round(roadmapProgress?.completionPct ?? 0);

  return <>
    <section className={`${panel} p-5 sm:p-6`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div className="max-w-2xl"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300"><span className="grid h-6 w-6 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.05]"><ListChecks className="h-3 w-3" /></span>DAILY EXECUTION</div><h2 className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl">Your next moves.</h2><p className="mt-1.5 text-sm leading-6 text-slate-400">A focused plan built around your goal, time and progress—not a giant checklist.</p></div><button type="button" onClick={() => setBuilderOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">{roadmap ? "Adjust plan" : "Build my plan"}</button></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><Signal icon={<ListChecks />} label="Tasks" value={`${missions.length}`} detail="Today's priorities" /><Signal icon={<CheckCircle2 />} label="Done" value={`${completedHabits}/${habits.length}`} detail="Habits completed" /><Signal icon={<Clock3 />} label="Focus" value={`${focusMinutes} min`} detail={`${sessions.filter((s) => s.completed).length} sessions`} /><Signal icon={<Target />} label="Progress" value={`${completion}%`} detail={`${xp.toLocaleString()} XP · Level ${level}`} /></div>
      {roadmapLoading && <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 p-3"><p className="text-xs text-slate-500">Loading your roadmap…</p></div>}
      {!roadmapLoading && !roadmap && <div className="mt-4 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.02] p-4"><div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><div><p className="text-sm font-black text-white">No roadmap yet.</p><p className="mt-1 text-xs leading-5 text-slate-500">Build your roadmap to turn your goal into a few actions you can actually finish.</p></div></div></div>}
      {!roadmapLoading && roadmap && <div className="mt-4 space-y-3"><div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.02] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-300" /><p className="text-sm font-black text-white">{roadmap.title}</p></div><p className="mt-1 text-xs leading-5 text-slate-500">Day {currentDay} of {roadmap.duration_days} · {completion}% complete</p></div><button type="button" onClick={() => setBuilderOpen(true)} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300 hover:text-cyan-200">Adjust <TrendingUp className="h-3 w-3" /></button></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-300 transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, completion))}%` }} /></div></div><DashboardExecutionPlan missions={missions} roadmapProgress={roadmapProgress} timetable={timetable} onCompleteMission={onCompleteMission} /></div>}
    </section>
    {builderOpen && <AIRoadmapBuilderV2 habits={habits} name={name} level={level} xp={xp} streak={bestStreak} onClose={() => setBuilderOpen(false)} onPlanCreated={() => { setBuilderOpen(false); }} />}
  </>;
}
function Signal({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3"><div className="flex items-center gap-2 text-slate-500"><span className="text-cyan-300">{icon}</span><span className="text-[8px] font-black uppercase tracking-[0.14em]">{label}</span></div><p className="mt-1.5 truncate text-lg font-black text-white">{value}</p><p className="mt-0.5 truncate text-[9px] font-medium text-slate-500">{detail}</p></div>; }
