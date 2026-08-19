import { CheckCircle2, Circle, LockKeyhole } from "lucide-react";
import type { RoadmapMilestone } from "@/hooks/use-roadmap";

export function RoadmapVisualizer({ milestones, todayIndex }: { milestones: RoadmapMilestone[]; todayIndex: number }) {
  return (
    <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-7">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300/70">Roadmap</p><h2 className="mt-1 text-2xl font-black text-white">Your progression path</h2></div>
        <span className="text-xs font-bold text-slate-500">Day {todayIndex}</span>
      </div>
      <div className="relative mt-7 space-y-4">
        <div className="absolute bottom-6 left-5 top-6 w-px bg-gradient-to-b from-cyan-300/40 via-violet-300/20 to-white/[0.04]" />
        {milestones.map((milestone) => {
          const reached = todayIndex >= milestone.day_start;
          const complete = todayIndex > milestone.day_end;
          return (
            <div key={milestone.id} className={`relative flex gap-4 rounded-2xl border p-4 transition ${reached ? "border-cyan-300/15 bg-cyan-300/[0.035]" : "border-white/[0.06] bg-black/10"}`}>
              <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-slate-950">
                {complete ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : reached ? <Circle className="h-5 w-5 fill-cyan-300 text-cyan-300" /> : <LockKeyhole className="h-4 w-4 text-slate-600" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Days {milestone.day_start}–{milestone.day_end}</span>{reached && <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] text-cyan-200">Current</span>}</div>
                <h3 className="mt-1 text-base font-black text-white">{milestone.title}</h3>
                {milestone.outcome && <p className="mt-1 text-sm leading-5 text-slate-500">{milestone.outcome}</p>}
                {!!milestone.methodology_tags?.length && <div className="mt-3 flex flex-wrap gap-1.5">{milestone.methodology_tags.map((tag) => <span key={tag} className="rounded-full border border-white/[0.06] px-2 py-1 text-[8px] font-bold text-slate-500">{tag.replaceAll("_", " ")}</span>)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
