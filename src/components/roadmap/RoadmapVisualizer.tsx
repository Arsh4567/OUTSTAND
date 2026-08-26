import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle, LockKeyhole, ArrowUpRight } from "lucide-react";
import type { RoadmapMilestone } from "@/hooks/use-roadmap";

function milestoneState(todayIndex: number, milestone: RoadmapMilestone) {
  if (todayIndex > milestone.day_end) return "complete" as const;
  if (todayIndex >= milestone.day_start) return "current" as const;
  return "upcoming" as const;
}

export function RoadmapVisualizer({ milestones, todayIndex }: { milestones: RoadmapMilestone[]; todayIndex: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="roadmap-path-title" className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-slate-950/70 p-5 shadow-[0_32px_90px_-72px_rgba(34,211,238,.5)] backdrop-blur-xl sm:p-7">
      <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/[0.045] blur-3xl" />
      <div className="relative flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-slate-500">The path</p>
          <h2 id="roadmap-path-title" className="mt-2 text-2xl font-black tracking-tight text-white">From today to the outcome</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">A milestone is a proof point. The work underneath it is only valuable when it moves you toward that proof.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-slate-400" aria-label={`Current roadmap day ${todayIndex}`}>Day {todayIndex}</span>
      </div>

      <div className="relative mt-8">
        <div aria-hidden="true" className="absolute bottom-5 left-[1.05rem] top-5 w-px bg-gradient-to-b from-cyan-300/45 via-violet-300/20 to-white/[0.04]" />
        <div className="space-y-3">
          {milestones.map((milestone, index) => {
            const state = milestoneState(todayIndex, milestone);
            const progress = milestone.tasks.length ? Math.round((milestone.tasks.filter((task) => task.progress === "completed").length / milestone.tasks.length) * 100) : 0;
            const isExpanded = state === "current";
            return (
              <motion.article
                key={milestone.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={reduceMotion ? undefined : { duration: 0.32, delay: Math.min(index * 0.025, 0.18), ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                className={`relative flex gap-4 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none ${state === "current" ? "border-cyan-300/20 bg-cyan-300/[0.05] shadow-[0_16px_50px_-40px_rgba(34,211,238,.7)]" : state === "complete" ? "border-emerald-300/12 bg-emerald-300/[0.02]" : "border-white/[0.07] bg-white/[0.015]"}`}
              >
                <div className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${state === "current" ? "border-cyan-300/30 bg-slate-950 text-cyan-300" : state === "complete" ? "border-emerald-300/22 bg-slate-950 text-emerald-300" : "border-white/10 bg-slate-950 text-slate-500"}`}>
                  {state === "complete" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : state === "current" ? <Circle className="h-4 w-4 fill-cyan-300 text-cyan-300" aria-hidden="true" /> : <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Stage {index + 1} · Days {milestone.day_start}–{milestone.day_end}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] ${state === "complete" ? "bg-emerald-300/10 text-emerald-200" : state === "current" ? "bg-cyan-300/10 text-cyan-200" : "bg-white/[0.06] text-slate-400"}`}>{state === "complete" ? "Shipped" : state === "current" ? "In progress" : "Planned"}</span>
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-white">{milestone.title}</h3>
                      {milestone.outcome && <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">{milestone.outcome}</p>}
                    </div>
                    <ArrowUpRight className="mt-0.5 hidden h-4 w-4 shrink-0 text-slate-600 sm:block" aria-hidden="true" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[8px] font-bold text-slate-400">{milestone.tasks.length} work blocks</span>
                    <span className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[8px] font-bold text-slate-400">{progress}% complete</span>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label={`${milestone.title} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                      <motion.div initial={reduceMotion ? false : { width: 0 }} whileInView={{ width: `${progress}%` }} viewport={{ once: true }} transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300" />
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
