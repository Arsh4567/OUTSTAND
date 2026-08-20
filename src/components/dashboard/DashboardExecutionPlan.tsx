import { useMemo } from "react";
import { Check, Clock3, Sparkles } from "lucide-react";
import type { DashboardMission, RoadmapProgress } from "@/hooks/useDashboard";

const panel = "rounded-[24px] border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl";

type Block = { label: string; durationMinutes: number; task: string; why?: string };

const FALLBACK_BLOCKS: Block[] = [
  { label: "Focus 1", durationMinutes: 45, task: "Study your highest-priority subject", why: "Start with the hardest thing while your attention is fresh." },
  { label: "Break", durationMinutes: 15, task: "Walk, hydrate, reset", why: "Recover without getting pulled into your phone." },
  { label: "Focus 2", durationMinutes: 45, task: "Practice questions from today's topic", why: "Turn learning into exam-ready recall." },
  { label: "Review", durationMinutes: 30, task: "Review mistakes + quick revision", why: "Lock in what you learned before the day ends." },
];

export function DashboardExecutionPlan({ missions, roadmapProgress, timetable, onCompleteMission }: { missions: DashboardMission[]; roadmapProgress: RoadmapProgress | null; timetable?: Block[]; onCompleteMission: (id: string) => void }) {
  const visibleMissions = missions.filter(Boolean).slice(0, 3);
  const blocks = useMemo(() => {
    const custom = timetable?.filter((item) => item?.task).slice(0, 4) as Block[] | undefined;
    return custom?.length ? custom : FALLBACK_BLOCKS;
  }, [timetable]);
  const completed = visibleMissions.filter((mission) => mission.completed).length;
  const total = visibleMissions.length;
  const planProgress = total ? Math.round((completed / total) * 100) : 0;
  const dayLabel = roadmapProgress?.day ? `Day ${roadmapProgress.day}` : "Today";

  return <section className={`${panel} overflow-hidden p-5 sm:p-6`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><span className="grid h-7 w-7 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07]"><Sparkles className="h-3.5 w-3.5" /></span>Your day</div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Simple plan. One step at a time.</h2>
        <p className="mt-1 text-sm text-slate-500">{dayLabel} · {total ? `${completed}/${total} tasks done` : "No tasks yet"}</p>
      </div>
      <div className="w-full max-w-xs"><div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-slate-600"><span>Today</span><span>{planProgress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all" style={{ width: `${planProgress}%` }} /></div></div>
    </div>

    <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
        <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Do this first</p><p className="mt-1 text-xs text-slate-500">Maximum 3 meaningful tasks.</p></div><Clock3 className="h-4 w-4 text-slate-600" /></div>
        {visibleMissions.length ? <div className="mt-4 space-y-2">{visibleMissions.map((mission, index) => <div key={mission.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${mission.completed ? "border-emerald-300/10 bg-emerald-300/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`}>
          <button type="button" onClick={() => onCompleteMission(mission.id)} disabled={mission.completed || mission.mutating} aria-label={mission.completed ? `${mission.title} completed` : `Complete ${mission.title}`} className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition ${mission.completed ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300" : "border-white/10 text-slate-600 hover:border-cyan-300/20 hover:text-cyan-300"}`}>{mission.completed ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-black">{index + 1}</span>}</button>
          <div className="min-w-0 flex-1"><p className={`text-sm font-bold leading-5 ${mission.completed ? "text-slate-500 line-through" : "text-white"}`}>{mission.title}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">{mission.category} · +{mission.xpReward} XP</p></div>
          {mission.mutating ? <span className="text-[9px] font-bold text-cyan-300">Saving</span> : null}
        </div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-cyan-300/10 bg-cyan-300/[0.025] p-4 text-sm text-slate-500">Your AI plan is ready to generate today's first task.</div>}
      </div>

      <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4">
        <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/70">Time blocks</p><p className="mt-1 text-xs text-slate-500">A realistic rhythm, not an endless checklist.</p></div><Clock3 className="h-4 w-4 text-violet-200/50" /></div>
        <div className="mt-4 space-y-2">{blocks.map((block, index) => <div key={`${block.label}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-3">
          <div className="min-w-[56px] rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-center"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">{block.label}</p><p className="mt-0.5 text-[10px] font-black text-cyan-200">{block.durationMinutes}m</p></div>
          <div className="min-w-0"><p className="text-sm font-bold text-white">{block.task}</p>{block.why ? <p className="mt-1 text-[10px] leading-4 text-slate-600">{block.why}</p> : null}</div>
        </div>)}</div>
      </div>
    </div>
  </section>;
}
