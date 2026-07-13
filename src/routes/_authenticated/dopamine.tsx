import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, TrendingUp, Activity } from "lucide-react";
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

// --- SLEEK ERROR BOUNDARY ---
export const Route = createFileRoute("/_authenticated/dopamine")({
  head: () => ({
    meta: [
      { title: "Momentum — Outstand" },
      { name: "description", content: "Track your daily momentum and build unstoppable focus." },
    ],
  }),
  component: MomentumPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-[#0a0a0f] p-6 flex flex-col items-center justify-center font-mono text-center">
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl max-w-md w-full">
        <Activity className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">System Interruption</h1>
        <p className="text-slate-400 text-sm mb-4">A glitch disrupted your flow.</p>
        <div className="bg-black/50 p-4 rounded-xl border border-rose-500/20 text-rose-400 text-xs text-left break-words">
          {error?.message || "Unknown anomaly detected"}
        </div>
      </div>
    </div>
  ),
});

function MomentumPage() {
  const { log, loading, togglePositive, toggleNegative } = useDailyLog();
  
  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const positives = log?.positives ?? [];
  const negatives = log?.negatives ?? [];
  
  const insights = useMemo(
    () => generateInsights(positives, negatives, score),
    [positives, negatives, score],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500" />
          <span className="font-bold tracking-widest uppercase text-xs text-indigo-400">Syncing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 overflow-hidden bg-[#050508]">
      {/* PREMIUM DYNAMIC AURA */}
      <motion.div 
        className="fixed inset-0 -z-20 opacity-30 pointer-events-none blur-[100px]"
        animate={{ 
          background: `radial-gradient(circle at 50% 0%, ${color.hex}60, transparent 60%)` 
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      {/* NOISE OVERLAY FOR TEXTURE */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-[-10]"></div>

      {/* FLOW STATE BADGE */}
      <AnimatePresence>
        {score >= 85 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-2xl border border-emerald-500/40 px-5 py-2 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-2"
          >
            <Sparkles className="text-emerald-400 h-4 w-4 animate-pulse" />
            <span className="text-emerald-50 font-bold tracking-widest uppercase text-[10px]">
              Flow State
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-12 p-4 pt-12">
        {/* HEADER */}
        <header className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-slate-300">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
            Daily Analysis
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-6xl">
            Build your <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">momentum.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-400 mx-auto sm:mx-0">
            Log the actions that drive you forward. Eliminate the friction that holds you back.
          </p>
        </header>

        {/* TOP METRICS GRID */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* SCORE CARD */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group animate-in fade-in duration-700 delay-150 fill-mode-both">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <ScoreRing score={score} color={color.hex} />
            
            <div className="mt-8 flex flex-col items-center">
              <motion.div
                animate={{ 
                  borderColor: `${color.hex}40`, 
                  color: color.hex, 
                  backgroundColor: `${color.hex}10` 
                }}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm"
              >
                <motion.span 
                  animate={{ backgroundColor: color.hex, boxShadow: `0 0 10px ${color.hex}` }}
                  className="h-2 w-2 rounded-full" 
                />
                {color.label}
              </motion.div>
            </div>
          </div>

          {/* INSIGHTS CARD */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl flex flex-col justify-center animate-in fade-in duration-700 delay-300 fill-mode-both">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">AI Insights</h2>
            </div>
            
            <ul className="space-y-3">
              {insights.length === 0 ? (
                <li className="text-sm text-slate-500 italic p-4 rounded-2xl bg-black/20 border border-white/5">
                  Log a habit below to generate your daily tactical breakdown.
                </li>
              ) : (
                insights.map((insight, idx) => (
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className="flex gap-4 rounded-2xl border border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent p-4 text-sm text-slate-200 shadow-sm"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    <span className="leading-relaxed">{insight}</span>
                  </motion.li>
                ))
              )}
            </ul>
          </div>
        </section>

        {/* LOGGING SECTION */}
        <section className="animate-in fade-in duration-700 delay-500 fill-mode-both">
          <Tabs defaultValue="positives" className="w-full">
            <TabsList className="mb-8 flex w-full max-w-sm mx-auto sm:mx-0 rounded-2xl bg-black/40 p-1 border border-white/5 backdrop-blur-xl shadow-inner">
              <TabsTrigger 
                value="positives" 
                className="w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all"
              >
                Accelerators
              </TabsTrigger>
              <TabsTrigger 
                value="negatives" 
                className="w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 data-[state=active]:shadow-sm transition-all"
              >
                Friction
              </TabsTrigger>
            </TabsList>

            <TabsContent value="positives">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {POSITIVES.map((p) => (
                  <ActionCard
                    key={p.key}
                    active={positives.includes(p.key)}
                    emoji={p.emoji}
                    label={p.label}
                    description={p.description}
                    points={p.points}
                    tone="good"
                    onClick={() => togglePositive(p.key as PositiveKey)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="negatives">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {NEGATIVES.map((n) => (
                  <ActionCard
                    key={n.key}
                    active={negatives.includes(n.key)}
                    emoji={n.emoji}
                    label={n.label}
                    description={n.description}
                    points={n.points}
                    tone="bad"
                    onClick={() => toggleNegative(n.key as NegativeKey)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* WEEKLY CHART */}
        <div className="animate-in fade-in duration-1000 delay-700 fill-mode-both">
          <WeeklySection />
        </div>

        {/* FOOTER ACTION */}
        <div className="flex justify-center sm:justify-end pt-8 pb-4">
          <Button asChild variant="ghost" className="rounded-full text-slate-400 hover:text-white hover:bg-white/5 px-6">
            <Link to="/profile">
              Explore History <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- PREMIUM SCORE RING ---
function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 180;
  const stroke = 8; // Thinner, more elegant stroke
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="mx-auto grid place-items-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-2xl overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={stroke} />
        {/* Glow Layer */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 12px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div 
          className="text-6xl font-black tabular-nums tracking-tighter drop-shadow-md" 
          animate={{ color }}
        >
          {score}
        </motion.div>
      </div>
    </div>
  );
}

// --- GLASSMORPHIC ACTION CARDS ---
function ActionCard({ active, emoji, label, description, points, tone, onClick }: any) {
  const handleTactileClick = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      tone === "good" ? navigator.vibrate(30) : navigator.vibrate([20, 40, 20]); 
    }
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleTactileClick}
      className={cn(
        "group relative flex w-full flex-col text-left rounded-3xl border p-5 transition-all duration-300 overflow-hidden outline-none",
        active && tone === "good" 
          ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-[0_0_30px_rgba(16,185,129,0.1)]" 
        : active && tone === "bad" 
          ? "border-rose-500/40 bg-gradient-to-b from-rose-500/10 to-transparent shadow-[0_0_30px_rgba(244,63,94,0.1)]"
        : "border-white/5 bg-white/[0.02] backdrop-blur-lg hover:bg-white/[0.04] hover:border-white/10 shadow-lg"
      )}
    >
      {/* Premium Emoji Container */}
      <div className="flex w-full items-start justify-between gap-3 relative z-10 mb-4">
        <div className="relative">
          <div className={cn(
            "absolute inset-0 blur-md opacity-50 rounded-full",
            tone === "good" ? "bg-emerald-400" : "bg-rose-400",
            !active && "opacity-0 group-hover:opacity-20 transition-opacity"
          )} />
          <span className="relative text-3xl drop-shadow-xl z-10">{emoji}</span>
        </div>
        
        <span className={cn(
          "rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase transition-colors border",
          tone === "good" 
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
            : "border-rose-500/20 bg-rose-500/10 text-rose-400",
          !active && "opacity-30 border-transparent bg-transparent"
        )}>
          {points > 0 ? `+${points}` : points}
        </span>
      </div>

      <div className="text-base font-bold text-white relative z-10">{label}</div>
      <div className="mt-1.5 text-xs text-slate-400/80 leading-relaxed relative z-10 font-medium">{description}</div>
      
      {/* Subtle indicator dot */}
      {active && (
        <div className={cn(
          "absolute right-5 bottom-5 h-2 w-2 rounded-full",
          tone === "good" ? "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)]" : "bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,1)]"
        )} />
      )}
    </motion.button>
  );
}

// --- UPGRADED WEEKLY SECTION ---
function WeeklySection() {
  const { logs } = useWeeklyLogs(7);
  const max = 100;
  
  return (
    <section className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl mt-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <h2 className="text-xl font-bold text-white">Momentum Trend</h2>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-wider text-slate-300">
          AVG: {logs.length ? Math.round(logs.reduce((a, b) => a + b.score, 0) / logs.length) : 0}
        </div>
      </div>
      
      <div className="grid grid-cols-7 items-end gap-2 sm:gap-4 h-48">
        {logs.map((l, i) => {
          const color = scoreColor(l.score);
          const h = Math.max(10, (l.score / max) * 100); // Give a min-height so 0 isn't invisible
          const d = new Date(l.log_date + "T00:00");
          
          return (
            <div key={l.log_date} className="flex flex-col items-center gap-4 h-full justify-end group">
              <div className="relative w-full flex justify-center items-end h-[85%]">
                {/* Custom Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md text-white text-xs py-1.5 px-3 rounded-lg border border-white/10 pointer-events-none whitespace-nowrap z-10 shadow-xl">
                  {l.score} pts
                </div>
                
                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                  className="w-full sm:w-10 rounded-t-xl shadow-lg relative overflow-hidden"
                  style={{ background: `linear-gradient(180deg, ${color.hex}90, transparent)` }}
                >
                  {/* Neon Top Edge */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color.hex, boxShadow: `0 0 10px ${color.hex}` }} />
                </motion.div>
              </div>
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
        
