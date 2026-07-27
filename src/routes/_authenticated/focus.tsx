import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Pause, Play, RotateCcw, Timer, Flame, Zap, Moon, Target, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({
    meta: [
      { title: "Focus — Pomodoro sessions" },
      { name: "description", content: "Run focused 25-minute Pomodoro sessions with break tracking." },
    ],
  }),
  component: FocusPage,
});

type Mode = "focus" | "short" | "long";
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS: Record<Mode, string> = { focus: "Deep Focus", short: "Short Break", long: "Deep Rest" };

// Theme engine for the Pomodoro timer
const THEMES: Record<Mode, { color: string; bg: string; border: string; glow: string; aura: string; icon: React.ReactNode }> = {
  focus: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.15)]",
    aura: "bg-amber-500/20",
    icon: <Flame size={14} className="text-amber-400" />
  },
  short: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-[0_0_40px_rgba(6,182,212,0.15)]",
    aura: "bg-cyan-500/20",
    icon: <Zap size={14} className="text-cyan-400" />
  },
  long: {
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    glow: "shadow-[0_0_40px_rgba(99,102,241,0.15)]",
    aura: "bg-indigo-500/20",
    icon: <Moon size={14} className="text-indigo-400" />
  }
};

function FocusPage() {
  const { sessions, recordSession } = useAppState();
  const { addPositive, addNegative } = useDailyLog();
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  
  // New Features State
  const [intent, setIntent] = useState("");
  const [zenMode, setZenMode] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const activeTheme = THEMES[mode];

  // 1. The Core Timer Engine
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]);

          if (mode === "focus") {
            recordSession(DURATIONS.focus / 60, true);
            addPositive("pomodoro");
            toast.success("Focus session complete", { description: "+20 dopamine · +25 XP" });
            if (zenMode) setZenMode(false); // Auto-exit zen mode on completion
          } else {
            toast("Break over", { description: "Back to work." });
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, mode, recordSession, addPositive, zenMode]);

  const switchMode = (m: Mode) => {
    if (running) {
      toast.error("Pause the timer first", { description: "You must pause before switching modes." });
      return;
    }
    setMode(m);
    setRemaining(DURATIONS[m]);
    startedAtRef.current = null;
  };

  const toggle = () => {
    if (!running && startedAtRef.current == null) startedAtRef.current = Date.now();
    setRunning((r) => !r);
  };

  const reset = () => {
    if (running && mode === "focus" && remaining < DURATIONS.focus) {
      recordSession(Math.round((DURATIONS.focus - remaining) / 60), false);
      addNegative("broke_focus");
    }
    setRunning(false);
    setRemaining(DURATIONS[mode]);
    startedAtRef.current = null;
  };

  const total = DURATIONS[mode];
  const progress = 1 - remaining / total;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const completedFocus = sessions.filter((s) => s.completed).length;
  const totalMinutes = sessions.filter((s) => s.completed).reduce((a, b) => a + b.durationMin, 0);

  // Circumference for the SVG circle (2 * Math.PI * 46)
  const CIRCUMFERENCE = 289.026;
  const strokeDashoffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  return (
    <>
      {/* Zen Mode Cinematic Background */}
      <AnimatePresence>
        {zenMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 bg-[#030712] z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "space-y-8 pb-20 max-w-5xl mx-auto px-4 sm:px-6 relative transition-all duration-700",
          zenMode ? "z-50 mt-12" : "z-10"
        )}
      >
        {/* Header - Hides in Zen Mode */}
        <AnimatePresence>
          {!zenMode && (
            <motion.div 
              initial={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              className="text-center pt-8"
            >
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tracking-tight">
                Pomodoro
              </h1>
              <p className="mt-2 text-sm md:text-base text-zinc-400">Master your attention. Conquer your tasks.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Timer Glass Card */}
        <div className={cn(
          "relative mx-auto w-full max-w-xl p-4 sm:p-8 rounded-[2.5rem] backdrop-blur-2xl border transition-all duration-700",
          "bg-zinc-900/50", 
          activeTheme.border,
          activeTheme.glow,
          zenMode && "bg-transparent border-transparent shadow-none"
        )}>
          
          {/* Zen Mode Toggle */}
          <button 
            onClick={() => setZenMode(!zenMode)}
            className="absolute top-6 right-6 z-20 text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
          >
            {zenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Mode Switcher */}
          <div className="flex justify-center gap-1 sm:gap-2 p-1.5 bg-black/40 rounded-full border border-white/5 w-fit mx-auto max-w-full overflow-x-auto no-scrollbar relative z-10">
            {(["focus", "short", "long"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="relative px-3 sm:px-5 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-colors z-10 shrink-0"
              >
                {mode === m && (
                  <motion.div
                    layoutId="active-mode"
                    className={cn("absolute inset-0 rounded-full", THEMES[m].bg)}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={cn("relative z-20 flex items-center gap-1.5 sm:gap-2", mode === m ? THEMES[m].color : "text-zinc-500 hover:text-zinc-300")}>
                  {mode === m && THEMES[m].icon}
                  {LABELS[m]}
                </span>
              </button>
            ))}
          </div>

          {/* Feature: Mission Intent Input */}
          <div className="mt-8 max-w-xs mx-auto relative z-10">
            {running && intent ? (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("text-center font-medium tracking-wide", activeTheme.color)}
              >
                Target: {intent}
              </motion.div>
            ) : (
              <div className="relative group">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="What is your mission?" 
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  disabled={running}
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-center text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all"
                />
              </div>
            )}
          </div>

          {/* Circular Timer Display */}
          <div className="relative mx-auto mt-8 flex h-[260px] w-[260px] sm:h-[320px] sm:w-[320px] items-center justify-center">
            
            {/* Feature: Ambient Breathing Aura */}
            <AnimatePresence>
              {running && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: [1, 1.15, 1] }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className={cn("absolute inset-0 rounded-full blur-[60px] -z-10", activeTheme.aura)}
                />
              )}
            </AnimatePresence>

            {/* SVG Progress Ring */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90 drop-shadow-2xl z-10">
              {/* Background Track */}
              <circle cx="50" cy="50" r="46" fill="none" className="stroke-white/5" strokeWidth="2" />
              {/* Progress Track */}
              <circle
                cx="50" cy="50" r="46" fill="none"
                stroke={`url(#${mode}Grad)`} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
              <defs>
                <linearGradient id="focusGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id="shortGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="longGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>

            {/* Time Text */}
            <motion.div 
              animate={running ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "z-20 flex flex-col items-center justify-center h-[210px] w-[210px] sm:h-[260px] sm:w-[260px] rounded-full border border-white/5 bg-black/40 backdrop-blur-md shadow-inner",
                running && activeTheme.glow
              )}
            >
              <div className={cn("font-mono text-6xl sm:text-7xl font-black tabular-nums tracking-tighter drop-shadow-lg", activeTheme.color)}>
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
              <div className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">{LABELS[mode]}</div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="mt-10 sm:mt-12 flex items-center justify-center gap-4 relative z-20">
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button 
                onClick={toggle} 
                className={cn("h-14 px-8 rounded-2xl font-bold text-lg border transition-all", activeTheme.bg, activeTheme.border, activeTheme.color, "hover:bg-opacity-20 shadow-lg")}
              >
                {running ? <><Pause className="mr-2 h-5 w-5" /> PAUSE</> : <><Play className="mr-2 h-5 w-5" /> START</>}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button 
                variant="outline" 
                onClick={reset} 
                className="h-14 w-14 rounded-2xl bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 shadow-lg"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Stats & History - Hides in Zen Mode */}
        <AnimatePresence>
          {!zenMode && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-8"
            >
              {/* Stats Row */}
              <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
                <StatBig icon={<Timer className="text-amber-400"/>} label="Sessions" value={String(completedFocus)} />
                <StatBig icon={<Coffee className="text-cyan-400"/>} label="Deep Work" value={`${totalMinutes} min`} />
                <StatBig icon={<Play className="text-indigo-400"/>} label="Current Mode" value={LABELS[mode]} />
              </div>

              {/* History Log */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 max-w-3xl mx-auto">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Recent Sessions</h3>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
                    No sessions logged yet. Time to get to work.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    <AnimatePresence>
                      {sessions.slice(0, 5).map((s) => (
                        <motion.li 
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                          <span className="flex items-center gap-3 text-sm font-medium text-zinc-200">
                            <span className={cn(
                              "h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]", 
                              s.completed ? "bg-emerald-400 text-emerald-400" : "bg-rose-500 text-rose-500"
                            )} />
                            {s.durationMin} min {s.completed ? "Focus Block" : "Interrupted"}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            {new Date(s.startedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

function StatBig({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 flex items-center gap-4 p-5 rounded-3xl transition-all shadow-lg"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/5 border border-white/10 shadow-inner">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">{label}</div>
        <div className="truncate text-xl sm:text-2xl font-black text-white tracking-tight">{value}</div>
      </div>
    </motion.div>
  );
        }
            
