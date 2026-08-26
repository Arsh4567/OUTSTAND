import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle, LockKeyhole, Sparkles } from "lucide-react";
import type { RoadmapMilestone } from "@/hooks/use-roadmap";

function milestoneState(todayIndex: number, milestone: RoadmapMilestone) {
  if (todayIndex > milestone.day_end) return "complete" as const;
  if (todayIndex >= milestone.day_start) return "current" as const;
  return "upcoming" as const;
}

export function RoadmapVisualizer({ milestones, todayIndex }: { milestones: RoadmapMilestone[]; todayIndex: number }) {
  const reduceMotion = useReducedMotion();
  const completedCount = milestones.filter((milestone) => milestoneState(todayIndex, milestone) === "complete").length;
  const current = milestones.find((milestone) => milestoneState(todayIndex, milestone) === "current");

  return (
    <section aria-labelledby="roadmap-path-title" className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1528]/90 shadow-[0_35px_110px_-80px_rgba(34,211,238,.65)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="relative border-b border-white/10 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200"><Sparkles className="h-4 w-4" aria-hidden="true" /> The route</div>
            <h2 id="roadmap-path-title" className="mt-2 text-[clamp(1.7rem,4vw,2.5rem)] font-black tracking-[-.04em] text-white">See how today's work moves the plan forward.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Milestones are checkpoints built from your saved roadmap—not extra goals layered on top.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Stage</span><span className="text-sm font-black text-white">{Math.min(completedCount + (current ? 1 : 0), milestones.length)}/{milestones.length}</span></div>
        </div>
      </div>

      <div className="relative p-5 sm:p-7">
        <div aria-hidden="true" className="absolute bottom-8 left-[2rem] top-8 w-px bg-gradient-to-b from-cyan-300/45 via-violet-300/25 to-white/[0.04] sm:left-[2.15rem]" />
        <div className="space-y-3">
          {milestones.map((milestone, index) => {
            const state = milestoneState(todayIndex, milestone);
            const completed = milestone.tasks.filter((task) => task.progress === "completed").length;
            const progress = milestone.tasks.length ? Math.round((completed / milestone.tasks.length) * 100) : 0;
            const isCurrent = state === "current";
            return (
              <motion.article key={milestone.id} initial={reduceMotion ? false : { opacity: 0, y: 7 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .18 }} transition={reduceMotion ? undefined : { duration: .3, delay: Math.min(index * .025, .14), ease: [0.22, 1, .36, 1] }} className={`relative flex gap-4 rounded-[1.5rem] border p-4 sm:p-5 transition-[border-color,background-color,box-shadow,transform] duration-200 ${isCurrent ? "border-cyan-300/25 bg-gradient-to-br from-cyan-300/[0.08] via-white/[0.02] to-violet-400/[0.06] shadow-[0_18px_60px_-48px_rgba(34,211,238,.9)]" : state === "complete" ? "border-emerald-300/12 bg-emerald-300/[0.018]" : "border-white/[0.07] bg-white/[0.012] hover:-translate-y-px hover:border-white/[0.12]"}`}>
                <div className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${isCurrent ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-200 shadow-[0_0_22px_-8px_rgba(34,211,238,.9)]" : state === "complete" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-[#0a1120] text-slate-500"}`}>
                  {state === "complete" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : isCurrent ? <Circle className="h-4 w-4 fill-cyan-300 text-cyan-300" aria-hidden="true" /> : <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Stage {index + 1} · Days {milestone.day_start}–{milestone.day_end}</span><span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] ${state === "complete" ? "bg-emerald-300/10 text-emerald-200" : isCurrent ? "bg-cyan-300/10 text-cyan-200" : "bg-white/[0.06] text-slate-400"}`}>{state === "complete" ? "Complete" : isCurrent ? "Current" : "Upcoming"}</span></div>
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-base font-black leading-5 text-white">{milestone.title}</h3>{milestone.outcome && <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">{milestone.outcome}</p>}</div><div className="shrink-0 text-left sm:text-right"><div className="text-sm font-black tabular-nums text-white">{progress}%</div><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">task completion</div></div></div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label={`${milestone.title} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><motion.div initial={reduceMotion ? false : { width: 0 }} whileInView={{ width: `${progress}%` }} viewport={{ once: true }} transition={reduceMotion ? { duration: 0 } : { duration: .55, ease: "easeOut" }} className={`h-full rounded-full ${state === "complete" ? "bg-emerald-300" : isCurrent ? "bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300" : "bg-white/20"}`} /></div>
                  <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-white/[0.07] bg-black/10 px-2.5 py-1 text-[8px] font-bold text-slate-400">{milestone.tasks.length} work blocks</span>{milestone.methodology_tags?.slice(0, 2).map((tag) => <span key={tag} className="rounded-full border border-white/[0.07] bg-black/10 px-2.5 py-1 text-[8px] font-bold text-slate-500">{tag.replace(/_/g, " ")}</span>)}</div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
