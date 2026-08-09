import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Activity, ArrowRight, TrendingUp, Zap, Flame, AlertCircle, Share, Brain
} from "lucide-react";

import { useDailyLog } from "@/hooks/use-dopamine";
import { scoreColor, generateInsights } from "@/lib/dopamine";
import { Button } from "@/components/ui/button";

// Components
import { ActionCard } from "@/components/dopamine/ActionCard";
import { CoreReactor } from "@/components/dopamine/CoreReactor";
import { NeuralChart } from "@/components/dopamine/NeuralChart";

export const Route = createFileRoute("/_authenticated/dopamine")({
  component: MomentumPage,
});

const POSITIVES = [
  { key: "workout", emoji: "🏃", label: "Intense Workout", description: "Pushed physical limits", points: 15 },
  { key: "deep_work", emoji: "🧠", label: "Deep Work", description: "90m+ of uninterrupted focus", points: 20 },
  { key: "cold_plunge", emoji: "🧊", label: "Cold Exposure", description: "Voluntary discomfort", points: 10 },
  { key: "reading", emoji: "📚", label: "Reading", description: "Absorbed new knowledge", points: 10 },
];

const NEGATIVES = [
  { key: "doom_scroll", emoji: "📱", label: "Doomscrolling", description: "Mindless social media consumption", points: -15 },
  { key: "junk_food", emoji: "🍔", label: "Processed Food", description: "Compromised physical baseline", points: -10 },
  { key: "snooze", emoji: "⏰", label: "Hit Snooze", description: "Lost the morning battle", points: -10 },
  { key: "alcohol", emoji: "🍷", label: "Alcohol", description: "Borrowed happiness from tomorrow", points: -20 },
];

const smoothEase = [0.16, 1, 0.3, 1];

function MomentumPage() {
  const { log, loading, togglePositive, toggleNegative } = useDailyLog() ?? { 
    log: null, loading: false, togglePositive: () => {}, toggleNegative: () => {} 
  };
  
  const score = log?.score ?? 50;
  const color = scoreColor(score) || { hex: "#818cf8", label: "Balanced" };
  const positives = log?.positives ?? [];
  const negatives = log?.negatives ?? [];
  
  const insights = useMemo(
    () => generateInsights(positives, negatives, score) || ["Awaiting matrix input..."],
    [positives, negatives, score],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#02040a]">
        <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
            <Zap className="h-5 w-5 text-indigo-400 animate-pulse" />
          </div>
          <span className="font-bold tracking-[0.3em] uppercase text-[10px] text-indigo-400/80">Calibrating Matrix</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden bg-[#02040a] font-sans selection:bg-indigo-500/30 text-white">
      
      {/* ADAPTIVE BACKGROUND PHYSICS */}
      <motion.div 
        className="fixed inset-0 -z-20 opacity-30 pointer-events-none blur-[150px] transform-gpu"
        animate={{ background: `radial-gradient(circle 800px at 50% -20%, ${color.hex}40, transparent 80%)` }}
        transition={{ duration: 2, ease: smoothEase }}
      />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none -z-10" />

      {/* PEAK STATE BADGE */}
      <AnimatePresence>
        {score >= 85 && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -40, scale: 0.9 }} transition={{ type: "spring", bounce: 0.4 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/80 backdrop-blur-3xl border border-emerald-500/40 px-6 py-2.5 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.3)] flex items-center gap-3 overflow-hidden transform-gpu"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-400/20 to-emerald-500/0 animate-[shimmer_2s_infinite]" />
            <Sparkles className="text-emerald-400 h-4 w-4 relative z-10 animate-pulse" />
            <span className="text-emerald-50 font-black tracking-[0.25em] uppercase text-[10px] relative z-10">Peak Flow State Active</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-12 sm:pt-20 relative z-10">
        
        {/* HERO HEADER */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: smoothEase }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 shadow-inner">
              <Activity className="h-3.5 w-3.5 text-indigo-400" /> Neural Uplink
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white md:text-7xl font-display leading-[1.1]">
              Momentum <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-[length:200%_auto] animate-[gradient_8s_linear_infinite]">
                Matrix.
              </span>
            </h1>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-3">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(`My current Momentum Score is ${score}. Join me on Outstand.`)} className="flex-1 md:flex-none h-12 rounded-2xl border-white/10 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-all border border-indigo-500/30">
              <Share className="w-4 h-4 mr-2" /> Share State
            </Button>
            <Button asChild variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 text-white transition-all">
              <Link to="/profile">Timeline <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </motion.header>

        {/* BENTO BOX GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. THE CORE REACTOR */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: smoothEase, delay: 0.1 }}
            className="lg:col-span-4 rounded-[2.5rem] border border-white/5 bg-[#0a0f1a]/60 backdrop-blur-3xl p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <CoreReactor score={score} color={color.hex} label={color.label} />
          </motion.div>

          {/* 2. DATA & AI INTELLIGENCE */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: smoothEase, delay: 0.2 }}
            className="lg:col-span-8 rounded-[2.5rem] border border-white/5 bg-[#0a0f1a]/60 backdrop-blur-3xl p-6 sm:p-8 shadow-2xl flex flex-col h-full relative overflow-hidden"
          >
             <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white font-display tracking-tight">Trajectory & Tactics</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Real-time matrix analysis</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
              {/* AI Insight Feed */}
              <div className="flex flex-col space-y-5 bg-black/40 p-6 rounded-[2rem] border border-white/5 h-full relative overflow-hidden shadow-inner">
                {insights.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 space-y-3">
                    <Brain className="h-8 w-8" />
                    <p className="text-sm font-medium italic">Awaiting matrix input...</p>
                  </div>
                ) : (
                  insights.map((insight, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (idx * 0.1) }} className="flex gap-4 items-start group">
                      <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.8)] group-hover:scale-150 transition-transform" />
                      <span className="text-sm md:text-base text-slate-300 font-medium leading-relaxed group-hover:text-white transition-colors">{insight}</span>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Weekly Sci-Fi Chart Area */}
              <div className="h-full min-h-[250px] bg-black/20 rounded-[2rem] border border-white/5 p-6 flex flex-col justify-between shadow-inner">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Past 7 Days</h4>
                 <NeuralChart color={color.hex} />
              </div>
            </div>
          </motion.div>

          {/* 3. ACCELERATORS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: smoothEase, delay: 0.3 }} 
            className="lg:col-span-6 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-emerald-400 font-black tracking-[0.2em] uppercase text-xs flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><Flame className="w-4 h-4" /></div> Accelerators
              </h3>
              <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">Growth</span>
            </div>
            
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 relative z-10">
              {POSITIVES.map((item) => (
                <ActionCard key={item.key} active={positives.includes(item.key)} emoji={item.emoji} label={item.label} description={item.description} points={item.points} tone="good" onClick={() => togglePositive(item.key)} />
              ))}
            </div>
          </motion.div>

          {/* 4. FRICTION */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: smoothEase, delay: 0.4 }} 
            className="lg:col-span-6 rounded-[2.5rem] border border-rose-500/20 bg-rose-950/10 backdrop-blur-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-rose-400 font-black tracking-[0.2em] uppercase text-xs flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20"><AlertCircle className="w-4 h-4" /></div> Friction
              </h3>
              <span className="text-[10px] font-bold text-rose-500/50 uppercase tracking-widest bg-rose-500/5 px-3 py-1 rounded-full border border-rose-500/10">Drain</span>
            </div>
            
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 relative z-10">
              {NEGATIVES.map((item) => (
                <ActionCard key={item.key} active={negatives.includes(item.key)} emoji={item.emoji} label={item.label} description={item.description} points={item.points} tone="bad" onClick={() => toggleNegative(item.key)} />
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
