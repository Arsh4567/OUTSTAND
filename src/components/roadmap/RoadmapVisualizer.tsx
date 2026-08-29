import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle, LockKeyhole, Sparkles, MapPin } from "lucide-react";
import type { RoadmapMilestone } from "@/hooks/use-roadmap";

function milestoneState(todayIndex: number, milestone: RoadmapMilestone) {
  if (todayIndex > milestone.day_end) return "complete" as const;
  if (todayIndex >= milestone.day_start) return "current" as const;
  return "upcoming" as const;
}

export function RoadmapVisualizer({ milestones, todayIndex }: { milestones: RoadmapMilestone[]; todayIndex: number }) {
  const reduceMotion = useReducedMotion();
  const currentIndex = milestones.findIndex((milestone) => milestoneState(todayIndex, milestone) === "current");

  return (
    <section aria-labelledby="roadmap-path-title" className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07101d]/92 shadow-[0_30px_100px_-68px_rgba(34,211,238,.45)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.08),transparent_65%)]" />
      <div className="relative border-b border-white/[0.07] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200"><MapPin className="h-4 w-4" aria-hidden="true" /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">Your route</div>
            <h2 id="roadmap-path-title" className="mt-1 text-[clamp(1.7rem,4vw,2.5rem)] font-black tracking-[-.04em] text-white">Small steps. Bigger destination.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Each milestone is a checkpoint on the way to your goal. Today’s work lights up the next part of the route.</p>
          </div>
        </div>
      </div>
      <div className="relative p-5 sm:p-7">
        <div aria-hidden="true" className="absolute bottom-10 left-[2.2rem] top-10 hidden w-0.5 bg-gradient-to-b from-cyan-300/45 via-violet-300/25 to-white/[0.06] sm:block" />
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const state = milestoneState(todayIndex, milestone);
            const completed = milestone.tasks.filter((task) => task.progress === "completed").length;
            const isCurrent = state === "current";
            const isPast = state === "complete";
            const isNext = index === currentIndex + 1;
            return (
              <motion.article key={milestone.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .18 }} transition={reduceMotion ? undefined : { duration: .28, delay: Math.min(index * .025, .12) }} className={`relative flex gap-4 rounded-[1.5rem] border p-4 sm:p-5 transition-[border-color,background-color,box-shadow,transform] duration-200 ${isCurrent ? "border-cyan-300/25 bg-gradient-to-br from-cyan-300/[.07] via-white/[.02] to-violet-400/[.06] shadow-[0_20px_70px_-48px_rgba(34,211,238,.95)]" : isPast ? "border-emerald-300/10 bg-emerald-300/[.015]" : "border-white/[.07] bg-white/[.012] hover:border-cyan-300/12 hover:bg-white/[.02]"}`}>
                <div className={`relative z-10 mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${isCurrent ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-200 shadow-[0_0_26px_-9px_rgba(34,211,238,.95)]" : isPast ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-[#081321] text-slate-400"}`}>
                  {isPast ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : isCurrent ? <Circle className="h-4 w-4 fill-cyan-300 text-cyan-300" aria-hidden="true" /> : <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Checkpoint {index + 1}</span><span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] ${isPast ? "bg-emerald-300/10 text-emerald-200" : isCurrent ? "bg-cyan-300/10 text-cyan-100" : isNext ? "bg-violet-300/10 text-violet-200" : "bg-white/[.05] text-slate-500"}`}>{isPast ? "Reached" : isCurrent ? "You are here" : isNext ? "Next stop" : "Ahead"}</span></div>
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-base font-black leading-5 text-white">{milestone.title}</h3>{milestone.outcome && <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">{milestone.outcome}</p>}</div><div className="shrink-0 rounded-xl border border-white/[0.07] bg-black/10 px-2.5 py-2 text-left sm:text-right"><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">Work blocks</div><div className="mt-0.5 text-sm font-black tabular-nums text-white">{completed}/{milestone.tasks.length}</div></div></div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label={`${milestone.title} progress`} aria-valuenow={completed} aria-valuemin={0} aria-valuemax={milestone.tasks.length || 1}><motion.div initial={reduceMotion ? false : { width: 0 }} whileInView={{ width: `${milestone.tasks.length ? (completed / milestone.tasks.length) * 100 : 0}%` }} viewport={{ once: true }} transition={reduceMotion ? { duration: 0 } : { duration: .5, ease: "easeOut" }} className={`h-full rounded-full ${isPast ? "bg-emerald-300" : isCurrent ? "bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300" : "bg-white/15"}`} /></div>
                  <div className="mt-3 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-600">Days {milestone.day_start}–{milestone.day_end}</div>
                </div>
              </motion.article>
            );
          })}
          {!milestones.length && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">Your route will appear here as milestones are added.</div>}
        </div>
      </div>
    </section>
  );
}
