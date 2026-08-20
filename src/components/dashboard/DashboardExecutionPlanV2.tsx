import { Check, Clock3, Sparkles } from "lucide-react";
import type { DashboardMission, RoadmapProgress } from "@/hooks/useDashboard";

type Block = { startTime?: string; endTime?: string; label?: string; durationMinutes: number; task: string; why?: string };

const FALLBACK_BLOCKS: Block[] = [
  { label: "Focus", durationMinutes: 45, task: "Work on your highest-priority goal", why: "Start with the task that moves your goal most." },
  { label: "Break", durationMinutes: 15, task: "Walk, hydrate, reset", why: "Take a real break instead of opening another feed." },
  { label: "Practice", durationMinutes: 45, task: "Practice what you learned", why: "Turn knowledge into performance." },
  { label: "Review", durationMinutes: 30, task: "Review mistakes and choose tomorrow's first move", why: "Finish with clarity." },
];

export function DashboardExecutionPlanV2({ missions, roadmapProgress, timetable, onCompleteMission }: { missions: DashboardMission[]; roadmapProgress: RoadmapProgress | null; timetable?: Block[]; onCompleteMission: (id: string) => void }) {
  const tasks = missions.slice(0, 3);
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const blocks = timetable?.length ? timetable.slice(0, 6) : FALLBACK_BLOCKS;
  const day = roadmapProgress?.day ? `Day ${roadmapProgress.day}` : "Today";

  return <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><span className="grid h-7 w-7 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07]"><Sparkles className="h-3.5 w-3.5" /></span>Today's execution</div><h2 className="mt-3 text-2xl font-black tracking-tight text-white">Just do the next thing.</h2><p className="mt-1 text-sm text-slate-500">{day} · {total ? `${completed}/${total} tasks complete` : "No tasks yet"}</p></div>
      <div className="w-full max-w-xs"><div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-slate-600"><span>Progress</span><span>{pct}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all" style={{ width: `${pct}%` }} /></div></div>
    </div>

    <div className="mt-5 grid gap-3 lg:grid-cols-[1.05fr_.95fr]">
      <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Top 3</p><p className="mt-1 text-xs text-slate-500">Only the tasks worth finishing today.</p></div><Clock3 className="h-4 w-4 text-slate-600" /></div>
        {tasks.length ? <div className="mt-4 space-y-2">{tasks.map((task, index) => <div key={task.id} className={`flex items-center gap-3 rounded-xl border p-3 ${task.completed ? "border-emerald-300/10 bg-emerald-300/[0.03]" : "border-white/[0.06] bg-white/[0.02]"}`}><button type="button" onClick={() => onCompleteMission(task.id)} disabled={task.completed || task.mutating} aria-label={task.completed ? `${task.title} completed` : `Complete ${task.title}`} className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${task.completed ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300" : "border-white/10 text-slate-600 hover:border-cyan-300/20 hover:text-cyan-300"}`}>{task.completed ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-black">{index + 1}</span>}</button><div className="min-w-0 flex-1"><p className={`text-sm font-bold ${task.completed ? "text-slate-500 line-through" : "text-white"}`}>{task.title}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">{task.category} · +{task.xpReward} XP</p></div>{task.mutating ? <span className="text-[9px] font-bold text-cyan-300">Saving</span> : null}</div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-cyan-300/10 bg-cyan-300/[0.025] p-4 text-sm text-slate-500">Your AI plan will place today's first tasks here.</div>}
      </div>

      <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/70">Hour-by-hour timetable</p><p className="mt-1 text-xs text-slate-500">Built around your availability and goal.</p></div><div className="mt-4 space-y-2">{blocks.map((block, index) => { const label = block.startTime && block.endTime ? `${block.startTime}–${block.endTime}` : block.label ?? `Block ${index + 1}`; return <div key={`${label}-${index}`} className="grid grid-cols-[92px_1fr] gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-3"><div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-2 text-center"><p className="text-[10px] font-black text-cyan-200">{label}</p><p className="mt-0.5 text-[9px] text-slate-600">{block.durationMinutes}m</p></div><div className="min-w-0"><p className="text-sm font-bold text-white">{block.task}</p>{block.why ? <p className="mt-1 text-[10px] leading-4 text-slate-600">{block.why}</p> : null}</div></div>; })}</div></div>
    </div>
  </section>;
}
