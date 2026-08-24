import { CheckCircle2, Circle, LockKeyhole, Target } from "lucide-react";
import type { RoadmapMilestone } from "@/hooks/use-roadmap";

function milestoneState(todayIndex: number, milestone: RoadmapMilestone) {
  if (todayIndex > milestone.day_end) return "complete" as const;
  if (todayIndex >= milestone.day_start) return "current" as const;
  return "upcoming" as const;
}

export function RoadmapVisualizer({ milestones, todayIndex }: { milestones: RoadmapMilestone[]; todayIndex: number }) {
  const current = milestones.find((milestone) => milestoneState(todayIndex, milestone) === "current") || milestones[milestones.length - 1];

  return (
    <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300/70">Execution map</p>
          <h2 className="mt-1 text-2xl font-black text-white">Build → prove → advance</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Each stage has an outcome, not just a list of tasks. Move forward when the evidence says you are ready.</p>
        </div>
        <span className="shrink-0 text-xs font-bold text-slate-500">Day {todayIndex}</span>
      </div>

      {current && (
        <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/70"><Target className="h-3.5 w-3.5" />Current stage</div>
          <div className="mt-1 text-base font-black text-white">{current.title}</div>
          {current.outcome && <p className="mt-1 text-xs leading-5 text-slate-400">Proof target: {current.outcome}</p>}
        </div>
      )}

      <div className="relative mt-7 space-y-4">
        <div className="absolute bottom-6 left-5 top-6 w-px bg-gradient-to-b from-cyan-300/40 via-violet-300/20 to-white/[0.04]" />
        {milestones.map((milestone, index) => {
          const state = milestoneState(todayIndex, milestone);
          const label = state === "complete" ? "Completed" : state === "current" ? "In progress" : "Upcoming";
          return (
            <div key={milestone.id} className={`relative flex gap-4 rounded-2xl border p-4 transition ${state === "current" ? "border-cyan-300/15 bg-cyan-300/[0.035]" : state === "complete" ? "border-emerald-300/10 bg-emerald-300/[0.02]" : "border-white/[0.06] bg-black/10"}`}>
              <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-slate-950">
                {state === "complete" ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : state === "current" ? <Circle className="h-5 w-5 fill-cyan-300 text-cyan-300" /> : <LockKeyhole className="h-4 w-4 text-slate-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Stage {index + 1} · Days {milestone.day_start}–{milestone.day_end}</span><span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] ${state === "complete" ? "bg-emerald-300/10 text-emerald-200" : state === "current" ? "bg-cyan-300/10 text-cyan-200" : "bg-white/[0.05] text-slate-500"}`}>{label}</span></div>
                <h3 className="mt-1 text-base font-black text-white">{milestone.title}</h3>
                {milestone.outcome && <p className="mt-1 text-sm leading-5 text-slate-500">{milestone.outcome}</p>}
                {!!milestone.tasks?.length && <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full border border-white/[0.06] px-2 py-1 text-[8px] font-bold text-slate-500">{milestone.tasks.length} execution blocks</span><span className="rounded-full border border-white/[0.06] px-2 py-1 text-[8px] font-bold text-slate-500">{milestone.tasks.filter((task) => task.progress === "completed").length} complete</span></div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
