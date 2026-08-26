import { ArrowRight, CalendarDays, CheckCircle2, Pencil, Target } from "lucide-react";
import { Roadmap3DScene } from "@/components/roadmap/Roadmap3DScene";

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
  const progress = Math.max(0, Math.min(100, overallProgress));
  return (
    <section className="relative isolate overflow-hidden rounded-[2.5rem] border border-cyan-300/10 bg-[#06101f] shadow-[0_60px_180px_-95px_rgba(34,211,238,.65)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,.13),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(139,92,246,.14),transparent_28%),linear-gradient(135deg,#06101f_0%,#071529_55%,#0a1024_100%)]" />
      <div className="relative grid min-h-[620px] gap-8 p-6 sm:p-8 lg:grid-cols-[.82fr_1.18fr] lg:p-10">
        <div className="relative z-30 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-300">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-cyan-100">Day {day}</span>
            <span className="text-slate-600">of {durationDays}</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="text-slate-400">{daysLeft} days left</span>
          </div>
          <p className="mt-8 text-sm font-semibold text-slate-400">Your destination</p>
          <h1 className="mt-2 max-w-2xl text-[clamp(3.25rem,8vw,6.8rem)] font-black leading-[.85] tracking-[-.075em] text-white">{title}</h1>
          <p className="mt-4 max-w-lg text-sm font-medium text-slate-500">The full goal stays inside Edit roadmap. The hero stays focused on the destination.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#07101d] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><Pencil className="h-4 w-4" /> Edit roadmap</button>
            <button type="button" onClick={onReview} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Review <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-7 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-black/15">
            <HeroStat icon={<CheckCircle2 className="h-4 w-4" />} label="Today" value={`${todayCompleted}/${todayRequired}`} />
            <HeroStat icon={<CalendarDays className="h-4 w-4" />} label="Days left" value={String(daysLeft)} />
            <HeroStat icon={<Target className="h-4 w-4" />} label="Stage" value={milestoneLabel} />
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[#050d18]" aria-label="Interactive 3D roadmap journey">
          <Roadmap3DScene progress={progress} />
          <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-white/10 bg-[#081321]/70 px-3 py-2 backdrop-blur-md">
            <p className="text-[8px] font-black uppercase tracking-[.18em] text-slate-500">Journey</p>
            <p className="mt-1 text-xs font-black text-cyan-100">{progress}% complete</p>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-cyan-300/10 bg-[#07101d]/78 p-4 shadow-2xl backdrop-blur-md sm:left-auto sm:w-64">
            <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Plan completion</p><p className="mt-1 text-3xl font-black tabular-nums text-white">{progress}%</p></div><span className="mb-1 rounded-full bg-violet-300/10 px-2 py-1 text-[9px] font-black text-violet-100">{completedCount}/{requiredCount}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="min-w-0 border-r border-white/10 px-3 py-3 last:border-r-0 sm:px-4"><div className="flex items-center gap-1.5 text-cyan-200"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06]">{icon}</span><span className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">{label}</span></div><p className="mt-1 truncate text-sm font-black tabular-nums text-white">{value}</p></div>;
}
