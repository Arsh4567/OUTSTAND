import { useEffect, useState } from "react";
import { Brain, CalendarDays, CheckCircle2, Clock3, ListChecks, Sparkles, Target } from "lucide-react";
import type { Habit, FocusSession } from "@/lib/habits";
import type { DashboardMission } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { AIRoadmapBuilderV2, type AIRoadmapPlan } from "./AIRoadmapBuilderV2";

const panel = "rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_80px_-56px_rgba(34,211,238,.45)] backdrop-blur-xl";

export function DashboardAISection({ habits, sessions, completedHabits, focusMinutes, bestStreak, nextMission, name, level, xp }: { habits: Habit[]; sessions: FocusSession[]; completedHabits: number; focusMinutes: number; bestStreak: number; nextMission?: DashboardMission; name: string; level: number; xp: number }) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [plan, setPlan] = useState<AIRoadmapPlan | null>(null);
  const [loadingSavedPlan, setLoadingSavedPlan] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadSavedRoadmap() {
      setLoadingSavedPlan(true);
      const { data, error } = await supabase
        .from("ai_roadmaps")
        .select("plan")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        if (error) console.warn("[OUTSTAND] Could not load saved AI roadmap:", error.message);
        const savedPlan = data?.plan;
        if (savedPlan && typeof savedPlan === "object" && !Array.isArray(savedPlan)) {
          setPlan(savedPlan as unknown as AIRoadmapPlan);
        }
        setLoadingSavedPlan(false);
      }
    }
    void loadSavedRoadmap();
    return () => { cancelled = true; };
  }, []);

  function handlePlanCreated(next: AIRoadmapPlan) {
    setPlan(next);
  }

  return <>
    <section className={`${panel} relative overflow-hidden p-5 sm:p-7`}>
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><span className="grid h-7 w-7 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07]"><Brain className="h-3.5 w-3.5" /></span> OUTSTAND Intelligence</div><h2 className="mt-4 text-2xl font-black tracking-tight text-white">Your plan should be built around you.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your selected habits are signals, not a generic checklist. Build a roadmap and the AI will interview you about the goal, timeline, difficulty and the details that determine the right plan.</p></div>
          <button type="button" onClick={() => setBuilderOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-[0_16px_40px_-18px_rgba(255,255,255,.45)] transition hover:-translate-y-0.5 hover:bg-cyan-50"><Sparkles className="h-4 w-4" /> {plan ? "Refine my roadmap" : "Build your roadmap"}</button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Signal icon={<ListChecks />} label="Selected habits" value={String(habits.length)} detail={habits.length ? habits.slice(0, 2).map((h) => h.name).join(" · ") : "Choose habits to give the AI context"} />
          <Signal icon={<CheckCircle2 />} label="Today" value={`${completedHabits}/${habits.length}`} detail="Selected habits completed" />
          <Signal icon={<Clock3 />} label="Focus" value={`${focusMinutes} min`} detail={`${sessions.filter((s) => s.completed).length} completed sessions`} />
          <Signal icon={<Target />} label="Momentum" value={`${bestStreak}d`} detail={nextMission ? nextMission.title : `${xp.toLocaleString()} XP · Level ${level}`} />
        </div>

        {habits.length > 0 && <div className="mt-5 border-t border-white/[0.07] pt-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Habits you selected</p><div className="mt-3 flex flex-wrap gap-2">{habits.map((habit) => <span key={habit.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-black/10 px-3 py-1.5 text-xs font-bold text-slate-300">{habit.emoji} {habit.name}</span>)}</div></div>}

        {loadingSavedPlan && <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/10 p-4"><p className="text-xs text-slate-500">Loading your saved roadmap…</p></div>}
        {!loadingSavedPlan && plan && <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.025] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-300" /><p className="text-sm font-black text-white">{plan.title}</p></div><p className="mt-1 text-xs leading-5 text-slate-500">{plan.durationDays} days · {plan.difficulty} · {plan.milestones.length} milestones · saved to your account</p></div><button type="button" onClick={() => setBuilderOpen(true)} className="text-left text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300 hover:text-cyan-200">Open & refine →</button></div></div>}
      </div>
    </section>

    {builderOpen && <AIRoadmapBuilderV2 habits={habits} name={name} level={level} xp={xp} streak={bestStreak} onClose={() => setBuilderOpen(false)} onPlanCreated={handlePlanCreated} />}
  </>;
}

function Signal({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-3.5"><div className="flex items-center gap-2 text-slate-500"><span className="text-cyan-300">{icon}</span><span className="text-[9px] font-black uppercase tracking-[0.16em]">{label}</span></div><p className="mt-2 truncate text-lg font-black text-white">{value}</p><p className="mt-1 truncate text-[10px] font-medium text-slate-600">{detail}</p></div>;
}
