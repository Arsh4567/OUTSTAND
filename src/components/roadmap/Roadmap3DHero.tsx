import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, Pencil, Target } from "lucide-react";

export type Roadmap3DHeroProps = {
  title: string;
  goal: string;
  day: number;
  durationDays: number;
  daysLeft: number;
  overallProgress: number;
  completedCount: number;
  requiredCount: number;
  todayCompleted: number;
  todayRequired: number;
  milestoneLabel: string;
  onEdit?: () => void;
  onReview?: () => void;
};

export function Roadmap3DHero({ title, goal, day, durationDays, daysLeft, overallProgress, completedCount, requiredCount, todayCompleted, todayRequired, milestoneLabel, onEdit, onReview }: Roadmap3DHeroProps) {
  const reduceMotion = useReducedMotion();
  const progress = Math.max(0, Math.min(100, overallProgress));

  return (
    <section className="relative isolate overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#0b1222] shadow-[0_50px_160px_-90px_rgba(34,211,238,.65)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(217,70,239,.17),transparent_26%),radial-gradient(circle_at_52%_100%,rgba(59,130,246,.12),transparent_36%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.04),transparent_32%,rgba(255,255,255,.015))]" />

      <div className="relative grid min-h-[540px] gap-8 px-6 py-7 sm:px-9 sm:py-10 lg:grid-cols-[1.05fr_.95fr] lg:px-11 lg:py-12">
        <div className="relative z-20 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-300">
            <span className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-cyan-100">Day {day}</span>
            <span className="text-slate-500">of {durationDays}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-slate-400">{daysLeft} days left</span>
          </div>

          <p className="mt-8 text-sm font-bold text-slate-400">Your destination</p>
          <h1 className="mt-2 max-w-3xl text-[clamp(3.5rem,9vw,7rem)] font-black leading-[.86] tracking-[-.075em] text-white">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{goal}</p>

          <div className="mt-7 flex flex-wrap gap-2">
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Pencil className="h-4 w-4" /> Edit roadmap
            </button>
            <button type="button" onClick={onReview} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">
              Review <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-7 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <HeroStat icon={<CheckCircle2 className="h-4 w-4" />} label="Today" value={`${todayCompleted}/${todayRequired}`} />
            <HeroStat icon={<CalendarDays className="h-4 w-4" />} label="Days left" value={String(daysLeft)} />
            <HeroStat icon={<Target className="h-4 w-4" />} label="Stage" value={milestoneLabel} />
          </div>
        </div>

        <div className="relative hidden min-h-[430px] lg:block" aria-hidden="true">
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,.16),transparent_62%)]" />
          <div className="absolute left-1/2 top-7 h-24 w-24 -translate-x-1/2 rounded-full bg-cyan-200/25 blur-2xl" />
          <div className="absolute left-1/2 top-1/2 h-[440px] w-[420px] -translate-x-1/2 -translate-y-[35%] rotate-[-3deg] rounded-[40%] bg-gradient-to-b from-slate-500/35 via-slate-700/65 to-slate-950/95 [clip-path:polygon(43%_0,57%_0,100%_100%,0_100%)]" />
          <div className="absolute left-1/2 top-1/2 h-[440px] w-[360px] -translate-x-1/2 -translate-y-[35%] rotate-[-3deg] bg-[linear-gradient(180deg,rgba(34,211,238,.12),rgba(139,92,246,.12)_52%,rgba(217,70,239,.12))] [clip-path:polygon(47%_0,53%_0,100%_100%,0_100%)]" />
          <div className="absolute left-1/2 top-1/2 h-[440px] w-[5px] -translate-x-1/2 -translate-y-[35%] rotate-[-3deg] bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,.95)_0_24px,transparent_24px_50px)] [clip-path:polygon(35%_0,65%_0,100%_100%,0_100%)] opacity-85" />
          <motion.div
            initial={false}
            animate={reduceMotion ? undefined : { y: [0, -10, 0], opacity: [0.85, 1, 0.85] }}
            transition={reduceMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-16 left-1/2 z-20 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_26px_10px_rgba(34,211,238,.55)]"
          />
          <div className="absolute bottom-5 right-0 z-30 w-56 rounded-2xl border border-white/10 bg-[#07101f]/80 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Plan completion</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-white">{progress}%</p>
              </div>
              <span className="mb-1 rounded-full bg-cyan-300/10 px-2 py-1 text-[9px] font-black text-cyan-100">{completedCount}/{requiredCount}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${progress}%` }} transition={reduceMotion ? { duration: 0 } : { duration: .75, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-white/10 px-3 py-3 last:border-r-0 sm:px-4">
      <div className="flex items-center gap-1.5 text-cyan-200"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06]">{icon}</span><span className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">{label}</span></div>
      <p className="mt-1 truncate text-sm font-black tabular-nums text-white">{value}</p>
    </div>
  );
}
