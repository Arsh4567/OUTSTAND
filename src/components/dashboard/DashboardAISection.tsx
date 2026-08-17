import { useEffect, useState } from "react";
import { Brain, CalendarDays, CheckCircle2, Clock3, ListChecks, Sparkles, Target, TrendingUp, BookOpen, ArrowRight } from "lucide-react";
import type { Habit, FocusSession } from "@/lib/habits";
import type { DashboardMission, RoadmapProgress } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { AIRoadmapBuilderV2, type AIRoadmapPlan } from "./AIRoadmapBuilderV2";

const panel = "rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_80px_-56px_rgba(34,211,238,.45)] backdrop-blur-xl";

export function DashboardAISection({ habits, sessions, completedHabits, focusMinutes, bestStreak, nextMission, name, level, xp, roadmapProgress }: { habits: Habit[]; sessions: FocusSession[]; completedHabits: number; focusMinutes: number; bestStreak: number; nextMission?: DashboardMission; name: string; level: number; xp: number; roadmapProgress: RoadmapProgress | null }) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [plan, setPlan] = useState<AIRoadmapPlan | null>(null);
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
      if (savedPlan && typeof savedPlan === "object" && !Array.isArray(savedPlan)) setPlan(savedPlan as unknown as AIRoadmapPlan);
      setLoadingSavedPlan(false);

      if (!savedPlan) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      setAdapting(true);
      try {
        const response = await fetch("/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mode: "adapt", category: "custom", answers: {}, habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji })), context: { name, level, xp, streak: bestStreak } }),
        });
        const result = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && result.plan && typeof result.plan === "object") {
          setPlan(result.plan as AIRoadmapPlan);
          if (result.changed && result.reason) setAdaptationNote(result.reason);
        }
      } catch (adaptError) {
        console.warn("[OUTSTAND] Roadmap adaptation check failed:", adaptError);
      } finally {
        if (!cancelled) setAdapting(false);
      }
    }
    void loadSavedRoadmap();
    return () => { cancelled = true; };
  }, [bestStreak, habits, level, name, xp]);

  const todayActions = plan?.today?.filter(Boolean).slice(0, 8) ?? [];
  const dayOneActions = plan?.milestones?.find((m) => m.day === (roadmapProgress?.day ?? 1))?.actions?.filter(Boolean).slice(0, 8) ?? [];
  const actionableToday = todayActions.length ? todayActions : dayOneActions;

  return <>
    <section className={`${panel} relative overflow-hidden p-5 sm:p-7`}>
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><span className="grid h-7 w-7 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07]"><Brain className="h-3.5 w-3.5" /></span> OUTSTAND Intelligence</div><h2 className="mt-4 text-2xl font-black tracking-tight text-white">Your plan should be built around you.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your habits are signals, not a generic checklist. OUTSTAND builds around your goal, timeline, ability and real constraints.</p></div>
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
        {!loadingSavedPlan && !plan && <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.025] p-5"><div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><div><p className="text-sm font-black text-white">Nothing generic. Build the plan first.</p><p className="mt-1 text-xs leading-5 text-slate-500">Tell the AI your exact target, timeline, level and available time. Your dashboard will then turn the plan into concrete daily missions.</p></div></div></div>}

        {!loadingSavedPlan && plan && <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.025] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-300" /><p className="text-sm font-black text-white">{plan.title}</p></div><p className="mt-1 text-xs leading-5 text-slate-500">{plan.durationDays} days · {plan.difficulty} · personalized from your AI interview</p></div>
              <div className="flex items-center gap-3"><div className="min-w-[150px]"><div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-slate-600"><span>{roadmapProgress ? `Day ${roadmapProgress.day}` : "Day 1"}</span><span>{Math.round(roadmapProgress?.completionPct ?? 0)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all" style={{ width: `${Math.min(100, Math.max(0, roadmapProgress?.completionPct ?? 0))}%` }} /></div></div><button type="button" onClick={() => setBuilderOpen(true)} className="inline-flex items-center gap-1 text-left text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300 hover:text-cyan-200">Refine <TrendingUp className="h-3.5 w-3.5" /></button></div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">AI execution plan</p><h3 className="mt-1 text-lg font-black text-white">Do these today</h3></div><span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[9px] font-black text-slate-500">{actionableToday.length} actions</span></div>
              {actionableToday.length ? <div className="mt-4 space-y-2">{actionableToday.map((action, index) => <div key={`${action}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-cyan-300/[0.08] text-[10px] font-black text-cyan-200">{index + 1}</span><p className="text-sm leading-6 text-slate-200">{action}</p></div>)}</div> : <div className="mt-4 rounded-xl border border-amber-300/10 bg-amber-300/[0.03] p-4 text-xs leading-5 text-amber-100/80">Your saved roadmap has no actionable Day {roadmapProgress?.day ?? 1} tasks. Open <button type="button" onClick={() => setBuilderOpen(true)} className="font-black underline">Refine my roadmap</button> and the AI will rebuild the missing execution layer.</div>}
            </section>
            <section className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/70">AI checkpoint</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{plan.summary}</p>
              <div className="mt-4 grid grid-cols-2 gap-2"><MiniStat label="Duration" value={`${plan.durationDays}d`} /><MiniStat label="Day" value={String(roadmapProgress?.day ?? 1)} /><MiniStat label="Done" value={String(roadmapProgress?.completed ?? 0)} /><MiniStat label="Missions" value={String(roadmapProgress?.total ?? actionableToday.length)} /></div>
            </section>
          </div>

          {adapting || adaptationNote ? <div className="rounded-xl border border-violet-300/10 bg-violet-300/[0.035] px-3 py-2 text-[10px] font-semibold text-violet-200/80">{adapting ? "AI is checking your recent performance and adjusting future work…" : `Adaptive update: ${adaptationNote}`}</div> : null}
        </div>}
      </div>
    </section>

    {builderOpen && <AIRoadmapBuilderV2 habits={habits} name={name} level={level} xp={xp} streak={bestStreak} onClose={() => setBuilderOpen(false)} onPlanCreated={(next) => { setPlan(next); /* Keep the builder open so the user immediately sees the complete AI roadmap. */ }} />}
  </>;
}

function Signal({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-3.5"><div className="flex items-center gap-2 text-slate-500"><span className="text-cyan-300">{icon}</span><span className="text-[9px] font-black uppercase tracking-[0.16em]">{label}</span></div><p className="mt-2 truncate text-lg font-black text-white">{value}</p><p className="mt-1 truncate text-[10px] font-medium text-slate-600">{detail}</p></div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2"><p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-600">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>;
}
