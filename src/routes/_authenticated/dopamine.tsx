import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDailyLog, useWeeklyLogs } from "@/hooks/use-dopamine";
import {
  POSITIVES,
  NEGATIVES,
  scoreColor,
  generateInsights,
  type PositiveKey,
  type NegativeKey,
} from "@/lib/dopamine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dopamine")({
  head: () => ({
    meta: [
      { title: "Momentum — Outstand" },
      { name: "description", content: "Track your daily momentum and build unstoppable focus." },
    ],
  }),
  component: MomentumPage,
});

function MomentumPage() {
  const { log, togglePositive, toggleNegative } = useDailyLog();
  const score = log?.score ?? 50;
  const color = scoreColor(score);
  
  const insights = useMemo(
    () => (log ? generateInsights(log.positives, log.negatives, score) : []),
    [log, score],
  );

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {/* Header Section with smooth slide-in */}
      <header className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
          <TrendingUp className="h-3.5 w-3.5" />
          Daily Momentum
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Build your <span className="text-indigo-400">momentum.</span>
        </h1>
        <p className="mt-3 max-w-xl text-lg text-slate-400">
          Track the actions that drive you forward and the distractions that pull you back.
        </p>
      </header>

      {/* Main Stats & Insights Grid */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-8 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <ScoreRing score={score} color={color.hex} />
          <div className="mt-6 text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm"
              style={{ borderColor: color.hex, color: color.hex, backgroundColor: `${color.hex}15` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: color.hex }} />
              {color.label}
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {log ? `${log.positives.length} accelerators · ${log.negatives.length} drains today` : "Loading your state…"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-8 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          <h2 className="text-xl font-bold text-white">Momentum Insights</h2>
          <p className="mt-1 text-sm text-slate-400">Your personalized focus analysis.</p>
          
          <ul className="mt-6 space-y-3">
            {insights.length === 0 ? (
              <li className="text-sm text-slate-500 italic">Log an action below to unlock your insights.</li>
            ) : (
              insights.map((i, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${400 + idx * 100}ms` }}
                >
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                  <span className="leading-relaxed">{i}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Interactive Logging Section */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
        <Tabs defaultValue="positives" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 rounded-full bg-slate-900/80 p-1">
            <TabsTrigger value="positives" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
              Accelerators
            </TabsTrigger>
            <TabsTrigger value="negatives" className="rounded-full data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all">
              Friction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positives">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {POSITIVES.map((p) => {
                const active = log?.positives.includes(p.key) ?? false;
                return (
                  <ActionCard
                    key={p.key}
                    active={active}
                    emoji={p.emoji}
                    label={p.label}
                    description={p.description}
                    points={p.points}
                    tone="good"
                    onClick={() => togglePositive(p.key as PositiveKey)}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="negatives">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {NEGATIVES.map((n) => {
                const active = log?.negatives.includes(n.key) ?? false;
                return (
                  <ActionCard
                    key={n.key}
                    active={active}
                    emoji={n.emoji}
                    label={n.label}
                    description={n.description}
                    points={n.points}
                    tone="bad"
                    onClick={() => toggleNegative(n.key as NegativeKey)}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <div className="animate-in fade-in duration-1000 delay-700 fill-mode-both">
        <WeeklySection />
      </div>

      <div className="flex justify-end pt-4">
        <Button asChild variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <Link to="/profile">
            View full history <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    const start = display;
    const delta = score - start;
    const duration = 1200; // Slower, more premium animation
    const t0 = performance.now();
    let raf = 0;
    
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      // Custom easing function for a very smooth deceleration
      const eased = 1 - Math.pow(1 - p, 4); 
      setDisplay(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const size = 220;
  const stroke = 14; // Slightly thinner for a sleek look
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (display / 100) * c;

  return (
    <div className="mx-auto grid place-items-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1200ms cubic-bezier(0.16, 1, 0.3, 1), stroke 500ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-6xl font-black tabular-nums tracking-tighter" style={{ color }}>
          {display}
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          State
        </div>
      </div>
    </div>
  );
}

function ActionCard({ active, emoji, label, description, points, tone, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col text-left rounded-xl border p-5 transition-all duration-300",
        "hover:scale-[1.02] active:scale-[0.98]", // Premium tactile interaction
        active && tone === "good" ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
        : active && tone === "bad" ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
        : "border-white/5 bg-slate-900/50 hover:bg-slate-800/80 hover:border-white/10"
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="text-3xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">{emoji}</div>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-bold tracking-wider",
            tone === "good" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
          )}
        >
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
      <div className="mt-4 text-base font-bold text-slate-200">{label}</div>
      <div className="mt-1 text-xs text-slate-400 leading-relaxed">{description}</div>
      
      {/* Active Indicator Dot */}
      {active && (
        <div className={cn(
          "absolute right-4 bottom-4 h-2 w-2 rounded-full animate-pulse",
          tone === "good" ? "bg-emerald-400" : "bg-rose-400"
        )} />
      )}
    </button>
  );
}

function WeeklySection() {
  const { logs } = useWeeklyLogs(7);
  const max = 100;
  return (
    <section className="rounded-2xl border border-white/5 bg-slate-900/50 p-8 shadow-xl mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold text-white">7-Day Trend</h2>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
          Avg: {logs.length ? Math.round(logs.reduce((a, b) => a + b.score, 0) / logs.length) : 0}
        </span>
      </div>
      <div className="mt-8 grid grid-cols-7 items-end gap-3 h-40">
        {logs.map((l, i) => {
          const color = scoreColor(l.score);
          const h = Math.max(6, (l.score / max) * 100);
          const d = new Date(l.log_date + "T00:00");
          return (
            <div 
              key={l.log_date} 
              className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className="w-full rounded-md shadow-sm transition-all duration-500 hover:opacity-80 cursor-pointer"
                style={{ height: `${h}%`, background: `linear-gradient(180deg, ${color.hex}, ${color.hex}22)` }}
                title={`${l.log_date}: ${l.score}`}
              />
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
      }
    
