import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Brain, Flame, Play, Sparkles, TimerReset, Trophy } from "lucide-react";

interface DashboardCommandCenterProps {
  name: string;
  level: number;
  xp: number;
  streak: number;
  focusMinutes: number;
  completedHabits: number;
  habitCount: number;
}

export function DashboardCommandCenter({
  name,
  level,
  xp,
  streak,
  focusMinutes,
  completedHabits,
  habitCount,
}: DashboardCommandCenterProps) {
  const completion = habitCount ? Math.round((completedHabits / habitCount) * 100) : 0;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/95 via-[#07121b]/95 to-[#0d0b1a]/95 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-7">
      <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/[0.10] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/[0.08] blur-[100px]" />
      <div className="relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" /> Personal operating system
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
              Make today count, {name}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Your command center is ready. Choose one meaningful action and let momentum compound.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
            <Link to="/focus" className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-3 text-xs font-black text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.12]">
              <Play className="h-4 w-4" /> Start focus
            </Link>
            <Link to="/outstand" className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xs font-black text-white transition hover:border-white/20 hover:bg-white/[0.08]">
              <Flame className="h-4 w-4 text-fuchsia-300" /> Outstand
            </Link>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Trophy className="h-4 w-4" />} label="Current level" value={`Level ${level}`} detail={`${xp.toLocaleString()} XP`} />
          <Metric icon={<Flame className="h-4 w-4" />} label="Momentum" value={`${streak} day${streak === 1 ? "" : "s"}`} detail="Best active streak" />
          <Metric icon={<TimerReset className="h-4 w-4" />} label="Focus bank" value={`${focusMinutes} min`} detail="Completed sessions" />
          <Metric icon={<Brain className="h-4 w-4" />} label="Today's habits" value={`${completion}%`} detail={`${completedHabits}/${habitCount || 0} complete`} />
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/7 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">One rule for today</div>
            <p className="mt-1 text-sm font-semibold text-slate-200">Protect the next 10 minutes before optimizing the next 10 hours.</p>
          </div>
          <Link to="/intelligence" className="inline-flex shrink-0 items-center justify-center gap-1.5 text-xs font-bold text-cyan-200 transition hover:text-cyan-100">
            Ask Intelligence <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4 transition hover:border-cyan-300/15 hover:bg-white/[0.04]">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">{icon}{label}</div>
      <div className="mt-2 text-xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-1 text-[11px] font-medium text-slate-500">{detail}</div>
    </div>
  );
}
