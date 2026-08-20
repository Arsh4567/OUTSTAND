import { useEffect, useState } from "react";
import { Brain, CalendarDays, CheckCircle2, Clock3, ListChecks, Sparkles, Target, TrendingUp, BookOpen } from "lucide-react";
import type { Habit, FocusSession } from "@/lib/habits";
import type { DashboardMission, RoadmapProgress } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { AIRoadmapBuilderV2, type AIRoadmapPlan } from "./AIRoadmapBuilderV2";
import { DashboardExecutionPlan, type DashboardScheduleBlock } from "./DashboardExecutionPlan";

const panel = "rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_80px_-56px_rgba(34,211,238,.45)] backdrop-blur-xl";
type DashboardRoadmapPlan = AIRoadmapPlan & { dailySchedule?: Array<DashboardScheduleBlock> };
function localDateKey() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }

export function DashboardAISection({ habits, sessions, completedHabits, focusMinutes, bestStreak, nextMission, name, level, xp, roadmapProgress, missions, onCompleteMission }: { habits: Habit[]; sessions: FocusSession[]; completedHabits: number; focusMinutes: number; bestStreak: number; nextMission?: DashboardMission; name: string; level: number; xp: number; roadmapProgress: RoadmapProgress | null; missions: DashboardMission[]; onCompleteMission: (id: string) => void }) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [plan, setPlan] = useState<DashboardRoadmapPlan | null>(null);
  const [loadingSavedPlan, setLoadingSavedPlan] = useState(true);
  const [adapting, setAdapting] = useState(false);
  const [adaptationNote, setAdaptationNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadSavedRoadmap() {
      setLoadingSavedPlan(true);
      const { data, error } = await supabase.from("ai_roadmaps").select("plan").eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (cancelled) return;
      if (error) console.warn("[OUTSTAND] Could not load saved AI roadmap:", error.message);
      const savedPlan = data?.plan;
      if (savedPlan && typeof savedPlan === "object" && !Array.isArray(savedPlan)) setPlan(savedPlan as unknown as DashboardRoadmapPlan);
      setLoadingSavedPlan(false);
      if (!savedPlan) return;

      const adaptationKey = `outstand-roadmap-adapted:${localDateKey()}`;
      if (localStorage.getItem(adaptationKey) === "1") return;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      localStorage.setItem(adaptationKey, "1");
      setAdapting(true);
      try {
        const response = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ mode: "adapt", category: "custom", answers: {}, habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji })), context: { name, level, xp, streak: bestStreak, focusMinutes, completedHabits, today: localDateKey() } }) });
        const result = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && result.plan && typeof result.plan === "object") {
          setPlan(result.plan as DashboardRoadmapPlan);
          if (result.changed && result.reason) setAdaptationNote(result.reason);
        }
        if (!response.ok) localStorage.removeItem(adaptationKey);
      } catch (adaptError) {
        localStorage.removeItem(adaptationKey);
        console.warn("[OUTSTAND] Roadmap adaptation check failed:", adaptError);
      } finally {
        if (!cancelled) setAdapting(false);
      }
    }
    void loadSavedRoadmap();
    return () => { cancelled = true; };
  }, [bestStreak, habits, level, name, xp, focusMinutes, completedHabits]);

  const timetable = plan?.dailySchedule?.filter((block) => block?.title && block?.instructions).slice(0, 6).map((block) => ({ startTime: block.startTime, endTime: block.endTime, durationMinutes: block.estimatedMinutes, task: block.title, why: block.instructions })) ?? [];
  const completion = Math.round(roadmapProgress?.completionPct ?? 0);

  return <>
    <section className={`${panel} relative overflow-hidden p-5 sm:p-7`}>
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div className="max-w-2xl"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><span className="grid h-7 w-7 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07]"><Brain className="h-3.5 w-3.5" /></span>OUTSTAND Intelligence</div><h2 className="mt-4 text-2xl font-black tracking-tight text-white">Your plan, hour by hour.</h2><p className="mt-2 text-sm leading-6 text-slate-400">Your goal, availability and progress become a short list of actions with real times — not a giant roadmap.</p></div><button type="button" onClick={() => setBuilderOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950"><Sparkles className="h-4 w-4" />{plan ? "Adjust schedule" : "Build my plan"}</button></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Signal icon={<ListChecks />} label="Tasks" value={`${missions.length}`} detail="Only today's top priorities" /><Signal icon={<CheckCircle2 />} label="Done" value={`${completedHabits}/${habits.length}`} detail="Habits completed" /><Signal icon={<Clock3 />} label="Focus" value={`${focusMinutes} min`} detail={`${sessions.filter((s) => s.completed).length} sessions`} /><Signal icon={<Target />} label="Progress" value={`${completion}%`} detail={`${xp.toLocaleString()} XP · Level ${level}`} /></div>
        {loadingSavedPlan && <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/10 p-4"><p className="text-xs text-slate-500">Loading your plan…</p></div>}
        {!loadingSavedPlan && !plan && <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.025] p-5"><div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><div><p className="text-sm font-black text-white">No daily plan yet.</p><p className="mt-1 text-xs leading-5 text-slate-500">Tell the AI your goal, deadline and available hours. It will turn them into a practical timetable and a few finishable tasks.</p></div></div></div>}
        {!loadingSavedPlan && plan && <div className="mt-5 space-y-4"><div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.025] p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-300" /><p className="text-sm font-black text-white">{plan.title}</p></div><p className="mt-1 text-xs leading-5 text-slate-500">Day {roadmapProgress?.day ?? 1} of {plan.durationDays} · {completion}% complete</p></div><button type="button" onClick={() => setBuilderOpen(true)} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">Adjust <TrendingUp className="h-3.5 w-3.5" /></button></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-transform duration-700 ease-out will-change-transform" style={{ transform: `scaleX(${Math.min(1, Math.max(0, completion / 100))})` }} /></div></div><DashboardExecutionPlan missions={missions} roadmapProgress={roadmapProgress} timetable={timetable} onCompleteMission={onCompleteMission} />{adapting || adaptationNote ? <div className="rounded-xl border border-violet-300/10 bg-violet-300/[0.035] px-3 py-2 text-[10px] font-semibold text-violet-200/80">{adapting ? "AI is tuning your next schedule from today's progress…" : `Updated: ${adaptationNote}`}</div> : null}</div>}
      </div>
    </section>
    {builderOpen && <AIRoadmapBuilderV2 habits={habits} name={name} level={level} xp={xp} streak={bestStreak} onClose={() => setBuilderOpen(false)} onPlanCreated={(next) => setPlan(next as DashboardRoadmapPlan)} />}
  </>;
}
function Signal({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-3.5"><div className="flex items-center gap-2 text-slate-500"><span className="text-cyan-300">{icon}</span><span className="text-[9px] font-black uppercase tracking-[0.16em]">{label}</span></div><p className="mt-2 truncate text-lg font-black text-white">{value}</p><p className="mt-1 truncate text-[10px] font-medium text-slate-600">{detail}</p></div>; }
