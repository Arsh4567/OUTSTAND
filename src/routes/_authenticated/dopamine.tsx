import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
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

// Animation variants for the staggered grid
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
};

function MomentumPage() {
  const { log, loading, togglePositive, toggleNegative } = useDailyLog();
  
  // 1. SAFEGUARD: If still loading from Supabase, show a simple loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-indigo-400">
        <div className="animate-pulse font-bold tracking-widest uppercase">Loading Momentum...</div>
      </div>
    );
  }

  // 2. SAFEGUARD: If log is null, use a fallback to prevent crashes
  const score = log?.score ?? 50;
  const color = scoreColor(score);
  
  const insights = useMemo(
    () => (log ? generateInsights(log.positives, log.negatives, score) : []),
    [log, score],
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 overflow-hidden">
      {/* ... keep the rest of your JSX exactly as it was ... */}
      

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 overflow-hidden">
      {/* DYNAMIC AURA BACKGROUND */}
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
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 px-6 py-2 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-3"
          >
            <Sparkles className="text-emerald-400 h-5 w-5 animate-pulse" />
            <span className="text-white font-bold tracking-widest uppercase text-sm drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
              Flow State Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-10 p-4 pt-10">
        {/* Header Section */}
        <header className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
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
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
            <ScoreRing score={score} color={color.hex} />
            <div className="mt-6 text-center">
              <motion.div
                animate={{ borderColor: color.hex, color: color.hex, backgroundColor: `${color.hex}15` }}
                transition={{ duration: 1 }}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm"
              >
                <motion.span 
                  animate={{ backgroundColor: color.hex }}
                  className="h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]" 
                />
                {color.label}
              </motion.div>
              <p className="mt-4 text-sm text-slate-400">
                {log ? `${log.positives.length} accelerators · ${log.negatives.length} drains today` : "Loading your state…"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            <h2 className="text-xl font-bold text-white">Momentum Insights</h2>
            <p className="mt-1 text-sm text-slate-400">Your personalized focus analysis.</p>
            
            <ul className="mt-6 space-y-3">
              {insights.length === 0 ? (
                <li className="text-sm text-slate-500 italic">Log an action below to unlock your insights.</li>
              ) : (
                insights.map((i, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1, duration: 0.5, type: "spring", bounce: 0.3 }}
                    className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-200 shadow-sm"
                  >
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                    <span className="leading-relaxed">{i}</span>
                  </motion.li>
                ))
              )}
            </ul>
          </div>
        </section>

        {/* Interactive Logging Section */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
          <Tabs defaultValue="positives" className="w-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 rounded-full bg-slate-900/80 p-1 border border-white/5">
              <TabsTrigger value="positives" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                Accelerators
              </TabsTrigger>
              <TabsTrigger value="negatives" className="rounded-full data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all">
                Friction
              </TabsTrigger>
            </TabsList>

            <TabsContent value="positives">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
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
              </motion.div>
            </TabsContent>

            <TabsContent value="negatives">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
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
              </motion.div>
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
    </div>
  );
}

// 1. PHYSICS-BASED RING ANIMATION
function ScoreRing({ score, color }: { score: number; color: string }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    // We use a safe ref or simple timeout if 'animate' is being finicky in your build
    setDisplay(score); 
  }, [score]);

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
          transition={{ type: "spring", bounce: 0, duration: 1.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-7xl font-black tabular-nums tracking-tighter" style={{ color }}>
          {score}
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          State
        </div>
      </div>
    </div>
  );
}


// 2. ACCESSIBLE & TACTILE ACTION CARDS
function ActionCard({ active, emoji, label, description, points, tone, onClick }: any) {
  
  const handleTactileClick = () => {
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
      variants={itemVariants}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleTactileClick}
      // Accessibility (A11y) Implementation
      role="checkbox"
      aria-checked={active}
      aria-label={`${label}, ${points > 0 ? '+' : ''}${points} points, ${active ? 'Selected' : 'Not selected'}`}
      className={cn(
        "group relative flex w-full flex-col text-left rounded-2xl border p-5 transition-colors duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        active && tone === "good" ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] focus-visible:ring-emerald-500" 
        : active && tone === "bad" ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.15)] focus-visible:ring-rose-500"
        : "border-white/5 bg-slate-900/40 hover:bg-slate-800/80 hover:border-white/10 focus-visible:ring-slate-400"
      )}
    >
      <div className="flex w-full items-start justify-between gap-3 relative z-10">
        <div className="text-3xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
          {emoji}
        </div>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-bold tracking-wider transition-colors",
            tone === "good" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400",
            !active && "opacity-50 group-hover:opacity-100"
          )}
        >
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
      <div className="mt-4 text-base font-bold text-slate-200 relative z-10">{label}</div>
      <div className="mt-1 text-xs text-slate-400 leading-relaxed relative z-10">{description}</div>
      
      {/* Active Indicator Flare */}
      <AnimatePresence>
        {active && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className={cn(
              "absolute right-4 bottom-4 h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]",
              tone === "good" ? "bg-emerald-400 text-emerald-400" : "bg-rose-400 text-rose-400"
            )} 
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function WeeklySection() {
  const { logs } = useWeeklyLogs(7);
  const max = 100;
  return (
    <section className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 shadow-xl backdrop-blur-md mt-8">
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
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                whileHover={{ filter: "brightness(1.3)", scale: 1.05 }} // Added hover pop to the graph
                transition={{ type: "spring", bounce: 0.2, duration: 1, delay: i * 0.1 }}
                className="w-full rounded-md shadow-sm cursor-pointer relative group"
                style={{ background: `linear-gradient(180deg, ${color.hex}, ${color.hex}22)` }}
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
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
