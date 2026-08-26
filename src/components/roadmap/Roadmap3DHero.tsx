import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, Pencil, Target } from "lucide-react";

export type Roadmap3DHeroProps = {
  title: string;
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

export function Roadmap3DHero({ title, day, durationDays, daysLeft, overallProgress, completedCount, requiredCount, todayCompleted, todayRequired, milestoneLabel, onEdit, onReview }: Roadmap3DHeroProps) {
  const reduceMotion = useReducedMotion();
  const progress = Math.max(0, Math.min(100, overallProgress));
  return (
    <section className="relative isolate overflow-hidden rounded-[2.4rem] border border-amber-200/15 bg-[#17120d] shadow-[0_55px_180px_-95px_rgba(234,179,8,.32)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(234,179,8,.16),transparent_27%),radial-gradient(circle_at_88%_22%,rgba(239,68,68,.12),transparent_26%),radial-gradient(circle_at_52%_100%,rgba(245,158,11,.08),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,.035),transparent_38%,rgba(245,158,11,.025))]" />

      <div className="relative grid min-h-[500px] gap-7 px-6 py-7 sm:px-9 sm:py-10 lg:grid-cols-[.95fr_1.05fr] lg:px-11 lg:py-11">
        <div className="relative z-20 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-stone-300">
            <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-amber-100">Day {day}</span>
            <span className="text-stone-600">of {durationDays}</span>
            <span className="h-1 w-1 rounded-full bg-stone-600" />
            <span className="text-stone-400">{daysLeft} days left</span>
          </div>

          <p className="mt-8 text-sm font-bold text-stone-400">The destination</p>
          <h1 className="mt-2 max-w-3xl text-[clamp(3.35rem,8.6vw,6.8rem)] font-black leading-[.84] tracking-[-.075em] text-[#fffaf0]">{title}</h1>
          <p className="mt-4 max-w-xl text-sm font-medium text-stone-400">Your full goal is saved safely inside Edit roadmap.</p>

          <div className="mt-7 flex flex-wrap gap-2">
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-[#fff7e6] px-4 py-2.5 text-xs font-black text-[#1b140b] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">
              <Pencil className="h-4 w-4" /> Edit roadmap
            </button>
            <button type="button" onClick={onReview} className="inline-flex items-center gap-2 rounded-xl border border-stone-500/35 bg-stone-200/[0.06] px-4 py-2.5 text-xs font-black text-stone-100 transition-colors hover:bg-stone-200/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">
              Review <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-7 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-stone-500/25 bg-black/15">
            <HeroStat icon={<CheckCircle2 className="h-4 w-4" />} label="Today" value={`${todayCompleted}/${todayRequired}`} />
            <HeroStat icon={<CalendarDays className="h-4 w-4" />} label="Days left" value={String(daysLeft)} />
            <HeroStat icon={<Target className="h-4 w-4" />} label="Stage" value={milestoneLabel} />
          </div>
        </div>

        <div className="relative min-h-[370px]" aria-hidden="true">
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,.14),transparent_62%)]" />
          <div className="absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2 rounded-full bg-amber-100/20 blur-2xl" />
          <div className="absolute left-1/2 top-1/2 h-[430px] w-[440px] -translate-x-1/2 -translate-y-[33%] rotate-[4deg] rounded-[40%] bg-gradient-to-b from-stone-500/35 via-stone-800/75 to-[#090806] [clip-path:polygon(43%_0,57%_0,100%_100%,0_100%)]" />
          <div className="absolute left-1/2 top-1/2 h-[430px] w-[370px] -translate-x-1/2 -translate-y-[33%] rotate-[4deg] bg-[linear-gradient(180deg,rgba(234,179,8,.11),rgba(239,68,68,.08)_54%,rgba(245,158,11,.06))] [clip-path:polygon(47%_0,53%_0,100%_100%,0_100%)]" />
          <div className="absolute left-1/2 top-1/2 h-[430px] w-[5px] -translate-x-1/2 -translate-y-[33%] rotate-[4deg] bg-[repeating-linear-gradient(to_bottom,rgba(255,244,214,.9)_0_24px,transparent_24px_50px)] [clip-path:polygon(35%_0,65%_0,100%_100%,0_100%)] opacity-80" />
          <motion.div initial={false} animate={reduceMotion ? undefined : { y: [0, -8, 0], opacity: [0.75, 1, 0.75] }} transition={reduceMotion ? undefined : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-14 left-1/2 z-20 h-3 w-3 -translate-x-1/2 rounded-full bg-[#fff3cd] shadow-[0_0_28px_10px_rgba(234,179,8,.34)]" />
          <div className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl border border-stone-500/25 bg-[#120f0b]/85 p-4 shadow-2xl backdrop-blur-md sm:left-auto sm:w-56">
            <div className="flex items-end justify-between gap-3">
              <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-stone-500">Plan completion</p><p className="mt-1 text-3xl font-black tabular-nums text-stone-100">{progress}%</p></div>
              <span className="mb-1 rounded-full bg-amber-200/10 px-2 py-1 text-[9px] font-black text-amber-100">{completedCount}/{requiredCount}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-500/20"><motion.div initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${progress}%` }} transition={reduceMotion ? { duration: 0 } : { duration: .75, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="min-w-0 border-r border-stone-500/20 px-3 py-3 last:border-r-0 sm:px-4"><div className="flex items-center gap-1.5 text-amber-100"><span className="grid h-7 w-7 place-items-center rounded-lg bg-stone-200/[0.05]">{icon}</span><span className="text-[8px] font-black uppercase tracking-[.14em] text-stone-500">{label}</span></div><p className="mt-1 truncate text-sm font-black tabular-nums text-stone-100">{value}</p></div>;
}
