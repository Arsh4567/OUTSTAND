import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// 🚨 CRASH REPORTER 🚨
export const Route = createFileRoute("/_authenticated/dopamine")({
  head: () => ({
    meta: [
      { title: "Momentum — Outstand" },
      { name: "description", content: "Track your daily momentum and build unstoppable focus." },
    ],
  }),
  component: MomentumPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center font-mono text-center">
      <div className="text-4xl mb-4">🚨</div>
      <h1 className="text-2xl font-bold text-white mb-4">Crash Report</h1>
      <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/50 text-rose-400 text-sm mb-4 w-full max-w-md break-words text-left">
        <strong>Error Message:</strong> <br /><br />
        {error?.message || "Unknown error occurred"}
      </div>
      <p className="text-slate-400 text-xs mb-2">Please copy this text or screenshot it and send it to me!</p>
    </div>
  ),
});

function MomentumPage() {
  const { log, loading, togglePositive, toggleNegative } = useDailyLog();
  
  // 1. ALL HOOKS MUST GO HERE (Before any early returns)
  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const positives = log?.positives ?? [];
  const negatives = log?.negatives ?? [];
  
  const insights = useMemo(
    () => generateInsights(positives, negatives, score),
    [positives, negatives, score],
  );

  // 2. SAFEGUARD: Clean Loading State (Now safely below the hooks!)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-indigo-400">
        <div className="animate-pulse font-bold tracking-widest uppercase text-sm">
          Loading Momentum...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 overflow-hidden">
      {/* DYNAMIC AURA BACKGROUND (Safe CSS transition) */}
      <motion.div 
        className="fixed inset-0 -z-20 opacity-20 pointer-events-none blur-3xl"
        animate={{ 
          background: `radial-gradient(circle at 50% 10%, ${color.hex}, transparent 70%)` 
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-slate-950/50 -z-10 pointer-events-none" />

      {/* FLOW STATE TRIGGER BADGE */}
      <AnimatePresence>
        {score >= 85 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 px-6 py-2 rounded-full shadow-lg flex items-center gap-3"
          >
            <Sparkles className="text-emerald-400 h-5 w-5 animate-pulse" />
            <span className="text-white font-bold tracking-widest uppercase text-sm">
              Flow State Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-10 p-4 pt-10">
        {/* Header Section */}
        <header className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <TrendingUp className="h-3.5 w-3.5" />
            Daily Momentum
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            Build your <span className="text-indigo-400">momentum.</span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-slate-400">
            Track the actions that drive you forward and the distractions that pull you back.
          </p>
        </header>

        {/* Main Stats & Insights Grid */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 shadow-xl animate-in fade-in duration-500 delay-150 fill-mode-both">
            <ScoreRing score={score} color={color.hex} />
            <div className="mt-6 text-center">
              <motion.div
                animate={{ borderColor: color.hex, color: color.hex, backgroundColor: `${color.hex}15` }}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
              >
                <motion.span 
                  animate={{ backgroundColor: color.hex }}
                  className="h-2 w-2 rounded-full" 
                />
                {color.label}
              </motion.div>
              <p className="mt-4 text-sm text-slate-400">
                {positives.length} accelerators · {negatives.length} drains today
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 shadow-xl animate-in fade-in duration-500 delay-300 fill-mode-both">
            <h2 className="text-xl font-bold text-white">Momentum Insights</h2>
            <p className="mt-1 text-sm text-slate-400">Your personalized focus analysis.</p>
            
            <ul className="mt-6 space-y-3">
              {insights.length === 0 ? (
                <li className="text-sm text-slate-500 italic">Log an action below to unlock your insights.</li>
              ) : (
                insights.map((i, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-200 shadow-sm"
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
        <section className="animate-in fade-in duration-500 delay-500 fill-mode-both">
          <Tabs defaultValue="positives" className="w-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 rounded-full bg-slate-900/80 p-1 border border-white/5">
              <TabsTrigger value="positives" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                Accelerators
              </TabsTrigger>
              <TabsTrigger value="negatives" className="rounded-full data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                Friction
              </TabsTrigger>
            </TabsList>

            <TabsContent value="positives">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {POSITIVES.map((p) => {
                  const active = positives.includes(p.key);
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
                  const active = negatives.includes(n.key);
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
          <Button asChild variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
            <Link to="/profile">
              View full history <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// 1. SAFE SCORE RING
function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="mx-auto grid place-items-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div 
          className="text-7xl font-black tabular-nums tracking-tighter" 
          animate={{ color }}
        >
          {score}
        </motion.div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          State
        </div>
      </div>
    </div>
  );
}

// 2. SAFE & TACTILE ACTION CARDS (Optimized for Mobile)
function ActionCard({ active, emoji, label, description, points, tone, onClick }: any) {
  
  const handleTactileClick = () => {
    // Haptic Feedback for Mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (tone === "good") {
        navigator.vibrate(40); 
      } else {
        navigator.vibrate([30, 50, 30]); 
      }
    }
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleTactileClick}
      role="checkbox"
      aria-checked={!!active} 
      aria-label={`${label}, ${points > 0 ? '+' : ''}${points} points, ${active ? 'Selected' : 'Not selected'}`}
      className={cn(
        "group relative flex w-full flex-col text-left rounded-2xl border p-5 transition-colors duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
        active && tone === "good" ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
        : active && tone === "bad" ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
        : "border-white/5 bg-slate-900/40 hover:bg-slate-800/80"
      )}
    >
      <div className="flex w-full items-start justify-between gap-3 relative z-10">
        <div className="text-3xl drop-shadow-sm" aria-hidden="true">
          {emoji}
        </div>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-bold tracking-wider transition-colors",
            tone === "good" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400",
            !active && "opacity-50"
          )}
        >
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
      <div className="mt-4 text-base font-bold text-slate-200 relative z-10">{label}</div>
      <div className="mt-1 text-xs text-slate-400 leading-relaxed relative z-10">{description}</div>
      
      {active && (
        <div 
          className={cn(
            "absolute right-4 bottom-4 h-2 w-2 rounded-full",
            tone === "good" ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
          )} 
        />
      )}
    </motion.button>
  );
}

// 3. SAFE WEEKLY SECTION
function WeeklySection() {
  const { logs } = useWeeklyLogs(7);
  const max = 100;
  return (
    <section className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 shadow-xl mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold text-white">7-Day Trend</h2>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
          Avg: {logs.length ? Math.round(logs.reduce((a, b) => a + b.score, 0) / logs.length) : 0}
        </span>
      </div>
      <div className="mt-8 grid grid-cols-7 items-end gap-3 h-40">
        {logs.map((l) => {
          const color = scoreColor(l.score);
          const h = Math.max(6, (l.score / max) * 100);
          const d = new Date(l.log_date + "T00:00");
          return (
            <div 
              key={l.log_date} 
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full rounded-md shadow-sm relative group"
                style={{ background: `linear-gradient(180deg, ${color.hex}, ${color.hex}22)` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                  {l.score} pts
                </div>
              </motion.div>
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
                                      
