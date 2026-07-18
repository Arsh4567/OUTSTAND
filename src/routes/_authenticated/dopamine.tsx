import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, TrendingUp, Activity, Share2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <div className="min-h-screen bg-[#050508] p-6 flex flex-col items-center justify-center font-mono text-center">
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl max-w-md w-full">
        <Activity className="h-10 w-10 text-rose-500 mx-auto mb-4 animate-pulse" />
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
  const [activeTab, setActiveTab] = useState<"positives" | "negatives">("positives");
  
  const insights = useMemo(
    () => generateInsights(positives, negatives, score),
    [positives, negatives, score],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050508]">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
          <span className="font-bold tracking-widest uppercase text-xs text-indigo-400">Calibrating Matrix...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 overflow-hidden bg-[#050508] font-sans selection:bg-indigo-500/30">
      {/* PREMIUM DYNAMIC AURA */}
      <motion.div 
        className="fixed inset-0 -z-20 opacity-40 pointer-events-none blur-[120px]"
        animate={{ 
          background: `radial-gradient(circle at 50% -10%, ${color.hex}50, transparent 70%)` 
        }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />
      
      {/* NOISE OVERLAY FOR TEXTURE */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-[-10]" />

      {/* FLOW STATE BADGE */}
      <AnimatePresence>
        {score >= 85 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-3xl border border-emerald-500/50 px-6 py-2 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center gap-3"
          >
            <Sparkles className="text-emerald-400 h-4 w-4 animate-pulse" />
            <span className="text-emerald-50 font-bold tracking-[0.2em] uppercase text-[10px]">
              Peak Flow State
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-12 p-4 pt-12 relative z-10">
        {/* HEADER */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center sm:text-left flex flex-col items-center sm:items-start"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-300 shadow-inner">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
            Daily Diagnostics
          </div>
          <h1 className="mt-6 text-5xl font-black tracking-tighter text-white md:text-7xl font-display">
            Build your <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">momentum.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-400 font-medium leading-relaxed">
            Log the actions that drive you forward. Eliminate the friction that holds you back.
          </p>
        </motion.header>

        {/* TOP METRICS GRID */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* SCORE CARD & SHARE ENGINE */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <ScoreRing score={score} color={color.hex} />
              
              <div className="mt-8 flex flex-col items-center gap-4 relative z-10">
                <motion.div
                  animate={{ 
                    borderColor: `${color.hex}40`, 
                    color: color.hex, 
                    backgroundColor: `${color.hex}10` 
                  }}
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md shadow-sm"
                >
                  <motion.span 
                    animate={{ backgroundColor: color.hex, boxShadow: `0 0 15px ${color.hex}` }}
                    className="h-2 w-2 rounded-full" 
                  />
                  {color.label}
                </motion.div>
              </div>
            </div>

            {/* THE VIRAL FLEX BUTTON */}
            <ShareBaselineDialog score={score} color={color.hex} />
          </motion.div>

          {/* AI INSIGHTS CARD */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-white font-display tracking-tight">AI Tactical Breakdown</h2>
            </div>
            
            <ul className="space-y-4 flex-1 flex flex-col justify-center">
              {insights.length === 0 ? (
                <li className="text-sm text-slate-500 font-medium italic p-6 rounded-3xl bg-black/20 border border-white/5 text-center">
                  Initialize your matrix below to generate real-time behavioral insights.
                </li>
              ) : (
                insights.map((insight, idx) => (
                  <motion.li
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1), type: "spring" }}
                    key={idx}
                    className="flex gap-4 rounded-2xl border border-white/5 bg-gradient-to-r from-white/[0.04] to-transparent p-5 text-sm text-slate-200 shadow-sm hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                    <span className="leading-relaxed font-medium">{insight}</span>
                  </motion.li>
                ))
              )}
            </ul>
          </motion.div>
        </section>

        {/* LOGGING SECTION WITH HAPTIC TABS */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="pt-8"
        >
          <div className="flex justify-center w-full mb-10">
            <div className="flex p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl relative">
              {(["positives", "negatives"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative px-8 py-3 text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-colors z-10",
                    activeTab === tab ? (tab === "positives" ? "text-emerald-400" : "text-rose-400") : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className={cn(
                        "absolute inset-0 rounded-xl shadow-inner -z-10",
                        tab === "positives" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
                      )}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {tab === "positives" ? "Accelerators" : "Friction"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {(activeTab === "positives" ? POSITIVES : NEGATIVES).map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, delay: i * 0.05, type: "spring" }}
                >
                  <ActionCard
                    active={activeTab === "positives" ? positives.includes(item.key as PositiveKey) : negatives.includes(item.key as NegativeKey)}
                    emoji={item.emoji}
                    label={item.label}
                    description={item.description}
                    points={item.points}
                    tone={activeTab === "positives" ? "good" : "bad"}
                    onClick={() => activeTab === "positives" ? togglePositive(item.key as PositiveKey) : toggleNegative(item.key as NegativeKey)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* WEEKLY CHART */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <WeeklySection />
        </motion.div>

        {/* FOOTER ACTION */}
        <div className="flex justify-center sm:justify-end pt-8 pb-4">
          <Button asChild variant="ghost" className="rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 px-6 py-6 font-bold tracking-wide">
            <Link to="/profile">
              Explore Timeline Matrix <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- STOP HERE FOR PART 1 ---
        // --- VIRAL SHARE ENGINE ---
function ShareBaselineDialog({ score, color }: { score: number; color: string }) {
  const [isReady, setIsReady] = useState(false);
  
  // Triggers native share on mobile if available, else lets them screenshot
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Outstand Baseline",
          text: `I just logged a ${score} Dopamine Score on Outstand. Build your momentum today.`,
          url: "https://outstand.app",
        });
      } catch (err) {
        console.log("Share cancelled", err);
      }
    }
  };

  return (
    <Dialog onOpenChange={(open) => { if(open) setTimeout(() => setIsReady(true), 300) }}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="w-full relative overflow-hidden group rounded-2xl p-[1px]"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center gap-2 bg-black/90 px-6 py-4 rounded-2xl backdrop-blur-xl">
            <Share2 className="w-5 h-5 text-white" />
            <span className="font-black tracking-[0.1em] text-white uppercase text-sm">
              Share My Baseline
            </span>
          </div>
        </motion.button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-transparent border-none shadow-none p-0 overflow-hidden">
        <DialogTitle className="sr-only">Share Your Proof of Work</DialogTitle>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative flex flex-col items-center"
        >
          {/* THE FLEX CARD (Screenshot Target) */}
          <div id="flex-card" className="w-[340px] h-[440px] bg-[#050508] rounded-[2.5rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-between p-8">
            {/* Background Glow */}
            <div 
              className="absolute inset-0 opacity-30 blur-[60px]" 
              style={{ background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` }}
            />
            {/* Grain */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />

            {/* Header */}
            <div className="w-full flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <img src="/outstand-logo.png" alt="Outstand" className="h-6 w-6 rounded-md" onError={(e) => e.currentTarget.style.display = 'none'} />
                <span className="text-white font-display font-bold tracking-tight text-lg">Outstand</span>
              </div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-white/10 rounded-full px-3 py-1 bg-white/5">
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Massive Score */}
            <div className="z-10 flex flex-col items-center relative">
              <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl" />
              <ScoreRing score={score} color={color} size={160} />
            </div>

            {/* Footer */}
            <div className="z-10 w-full flex flex-col items-center gap-1">
              <div className="text-[10px] text-slate-400 font-bold tracking-[0.3em] uppercase">Status Logged</div>
              <div className="text-white font-black tracking-widest text-sm bg-white/10 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                outstand.app
              </div>
            </div>
          </div>

          {/* Action Buttons below card */}
          <div className="flex gap-4 mt-8 w-full max-w-[340px]">
            <Button onClick={handleNativeShare} className="flex-1 rounded-xl h-12 bg-white text-black hover:bg-slate-200 font-bold uppercase tracking-wide gap-2">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <div className="flex-1 rounded-xl h-12 bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wide gap-2 flex items-center justify-center backdrop-blur-md">
              <ScanLine className="w-4 h-4" /> Screenshot
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// --- PREMIUM SCORE RING ---
function ScoreRing({ score, color, size = 180 }: { score: number; color: string, size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-2xl overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={stroke} />
        {/* Glow Layer */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} 
          initial={{ strokeDashoffset: c }} 
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 16px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="text-6xl font-black tabular-nums tracking-tighter font-display drop-shadow-lg" 
          style={{ color }}
        >
          {score}
        </motion.div>
      </div>
    </div>
  );
}

// --- GLASSMORPHIC ACTION CARDS (HAPTIC) ---
function ActionCard({ active, emoji, label, description, points, tone, onClick }: any) {
  const handleTactileClick = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      tone === "good" ? navigator.vibrate(30) : navigator.vibrate([20, 40, 20]); 
    }
    onClick();
  };

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={handleTactileClick}
      className={cn(
        "group relative flex w-full flex-col text-left rounded-[2rem] border p-6 transition-all duration-300 outline-none",
        active && tone === "good" 
          ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_10px_40px_rgba(16,185,129,0.15)]" 
        : active && tone === "bad" 
          ? "border-rose-500/50 bg-rose-500/10 shadow-[0_10px_40px_rgba(244,63,94,0.15)]"
        : "border-white/5 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 shadow-lg"
      )}
    >
      <div className="flex w-full items-start justify-between gap-3 relative z-10 mb-5">
        <div className="relative">
          <div className={cn(
            "absolute inset-0 blur-lg rounded-full transition-opacity duration-500",
            tone === "good" ? "bg-emerald-400" : "bg-rose-400",
            active ? "opacity-60" : "opacity-0 group-hover:opacity-20"
          )} />
          <motion.span 
            className="relative text-4xl drop-shadow-2xl z-10 block"
            animate={active ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {emoji}
          </motion.span>
        </div>
        
        <span className={cn(
          "rounded-full px-3 py-1 text-[11px] font-black tracking-widest uppercase transition-all duration-300 border shadow-inner",
          tone === "good" 
            ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300" 
            : "border-rose-500/30 bg-rose-500/20 text-rose-300",
          !active && "opacity-40 border-white/5 bg-white/5 text-slate-400"
        )}>
          {points > 0 ? `+${points}` : points}
        </span>
      </div>

      <div className="text-lg font-bold text-white relative z-10 tracking-tight">{label}</div>
      <div className="mt-2 text-xs text-slate-400/90 leading-relaxed relative z-10 font-medium">{description}</div>
      
      {active && (
        <motion.div 
          layoutId={`indicator-${label}`}
          className={cn(
            "absolute right-6 bottom-6 h-2 w-2 rounded-full",
            tone === "good" ? "bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,1)]" : "bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,1)]"
          )} 
        />
      )}
    </motion.button>
  );
}

// --- UPGRADED WEEKLY SECTION ---
function WeeklySection() {
  const { logs } = useWeeklyLogs(7);
  const max = 100;
  
  return (
    <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl mt-8">
      <div className="flex items-center justify-between gap-4 mb-10">
        <h2 className="text-2xl font-black text-white font-display tracking-tight">Momentum Trajectory</h2>
        <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-black tracking-[0.2em] text-slate-300 shadow-inner">
          AVG: {logs.length ? Math.round(logs.reduce((a, b) => a + b.score, 0) / logs.length) : 0}
        </div>
      </div>
      
      <div className="grid grid-cols-7 items-end gap-3 sm:gap-6 h-56">
        {logs.map((l, i) => {
          const color = scoreColor(l.score);
          const h = Math.max(8, (l.score / max) * 100); 
          const d = new Date(l.log_date + "T00:00");
          
          return (
            <div key={l.log_date} className="flex flex-col items-center gap-4 h-full justify-end group">
              <div className="relative w-full flex justify-center items-end h-[85%]">
                {/* Custom Tooltip */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2 bg-white text-black font-bold text-xs py-2 px-4 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap z-20">
                  {l.score} pts
                </div>
                
                {/* 3D Glass Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: i * 0.1, type: "spring", damping: 20 }}
                  className="w-full sm:w-12 rounded-t-2xl shadow-2xl relative overflow-hidden border-x border-t border-white/10"
                  style={{ background: `linear-gradient(180deg, ${color.hex}90, ${color.hex}10)` }}
                >
                  {/* Glass Reflection */}
                  <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-white/10" />
                  {/* Neon Top Edge */}
                  <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: color.hex, boxShadow: `0 0 15px ${color.hex}` }} />
                </motion.div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">
                {d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
