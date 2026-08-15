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
      { title: "Focus — Outstand" },
      { name: "description", content: "Run focused Pomodoro sessions, track breaks, and build attention consistency." },
    ],
  }),
  component: FocusPage,
});

type Mode = "focus" | "short" | "long";
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS: Record<Mode, string> = { focus: "Deep Focus", short: "Short Break", long: "Deep Rest" };

const THEMES: Record<Mode, { color: string; bg: string; border: string; glow: string; aura: string; hex: string; icon: React.ReactNode }> = {
  focus: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-[0_0_40px_rgba(251,191,36,0.15)]", aura: "bg-amber-500/20", hex: "251, 191, 36", icon: <Flame size={14} className="text-amber-400" /> },
  short: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", glow: "shadow-[0_0_40px_rgba(6,182,212,0.15)]", aura: "bg-cyan-500/20", hex: "34, 211, 238", icon: <Zap size={14} className="text-cyan-400" /> },
  long: { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", glow: "shadow-[0_0_40px_rgba(99,102,241,0.15)]", aura: "bg-indigo-500/20", hex: "129, 140, 248", icon: <Moon size={14} className="text-indigo-400" /> },
};

function FocusPage() {
  const { sessions, recordSession } = useAppState();
  const { addPositive, addNegative } = useDailyLog();
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [intent, setIntent] = useState("");
  const [zenMode, setZenMode] = useState(false);
  const [shake, setShake] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const activeTheme = THEMES[mode];

  useEffect(() => {
    if (!running) return;
    const intervalId = window.setInterval(() => {
      setRemaining((current) => {
        if (current > 1) return current - 1;
        setRunning(false);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        if (mode === "focus") {
          recordSession(DURATIONS.focus / 60, true);
          addPositive("pomodoro");
          toast.success("Focus session complete", { description: "+25 XP · nice work." });
          setZenMode(false);
        } else {
          toast("Break over", { description: "Back to work." });
        }
        intervalRef.current = null;
        return 0;
      });
    }, 1000);
    intervalRef.current = intervalId;
    return () => {
      window.clearInterval(intervalId);
      if (intervalRef.current === intervalId) intervalRef.current = null;
    };
  }, [running, mode, recordSession, addPositive]);

  useEffect(() => () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
  }, []);

  const switchMode = (nextMode: Mode) => {
    if (running) {
      toast.error("Pause the timer first", { description: "Pause before switching modes." });
      return;
    }
    setMode(nextMode);
    setRemaining(DURATIONS[nextMode]);
    startedAtRef.current = null;
  };

  const toggle = () => {
    if (!running && startedAtRef.current == null) startedAtRef.current = Date.now();
    setRunning((current) => !current);
  };

  const reset = () => {
    if (running && mode === "focus" && remaining < DURATIONS.focus) {
      setShake(true);
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = window.setTimeout(() => setShake(false), 500);
      recordSession(Math.round((DURATIONS.focus - remaining) / 60), false);
      addNegative("broke_focus");
      toast.error("Focus session reset", { description: "Your partial session was saved." });
    }
    setRunning(false);
    setRemaining(DURATIONS[mode]);
    startedAtRef.current = null;
  };

  const total = DURATIONS[mode];
  const progress = 1 - remaining / total;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const completedFocus = sessions.filter((session) => session.completed).length;
  const totalMinutes = sessions.filter((session) => session.completed).reduce((sum, session) => sum + session.durationMin, 0);
  const CIRCUMFERENCE = 289.026;
  const strokeDashoffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  return (
    <>
      <WarpSpeedCanvas isActive={running} colorRgb={activeTheme.hex} />
      <AnimatePresence>
        {zenMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="fixed inset-0 z-40 pointer-events-none bg-[#030712]/70 backdrop-blur-sm" aria-hidden="true" />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, x: shake ? [-15, 15, -10, 10, -5, 5, 0] : 0 }}
        transition={{ duration: shake ? 0.4 : 0.7 }}
        className={cn("relative mx-auto max-w-5xl space-y-8 px-4 pb-20 sm:px-6", zenMode ? "z-50 mt-12" : "z-10")}
      >
        <AnimatePresence>
          {!zenMode && (
            <motion.div initial={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, overflow: "hidden" }} className="pt-8 text-center">
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-gradient-to-br from-white to-zinc-500 bg-clip-text md:text-5xl">Pomodoro</h1>
              <p className="mt-2 text-sm text-zinc-400 md:text-base">Master your attention. Conquer your tasks.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("relative mx-auto w-full max-w-xl rounded-[2.5rem] border p-4 backdrop-blur-2xl transition-all duration-700 sm:p-8", running ? "bg-black/60 shadow-2xl" : "bg-zinc-900/50", activeTheme.border, running ? activeTheme.glow : "", zenMode && "border-transparent bg-transparent shadow-none")}>
          <button aria-label={zenMode ? "Exit zen mode" : "Enter zen mode"} onClick={() => setZenMode((current) => !current)} className="absolute right-6 top-6 z-20 rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
            {zenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <div className="relative z-10 mx-auto flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-white/5 bg-black/40 p-1.5 no-scrollbar">
            {(["focus", "short", "long"] as Mode[]).map((currentMode) => (
              <button key={currentMode} type="button" aria-pressed={mode === currentMode} onClick={() => switchMode(currentMode)} className="relative shrink-0 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:px-5 sm:text-xs">
                {mode === currentMode && <motion.div layoutId="active-mode" className={cn("absolute inset-0 rounded-full", THEMES[currentMode].bg)} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <span className={cn("relative z-20 flex items-center gap-1.5 sm:gap-2", mode === currentMode ? THEMES[currentMode].color : "text-zinc-500 hover:text-zinc-300")}>{mode === currentMode && THEMES[currentMode].icon}{LABELS[currentMode]}</span>
              </button>
            ))}
          </div>

          <div className="relative z-10 mx-auto mt-8 max-w-xs">
            {running && intent ? (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={cn("text-center font-medium tracking-wide drop-shadow-md", activeTheme.color)}>Target: {intent}</motion.div>
            ) : (
              <div className="group relative">
                <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-indigo-400" aria-hidden="true" />
                <input type="text" maxLength={120} placeholder="What is your mission?" aria-label="Focus mission" value={intent} onChange={(event) => setIntent(event.target.value)} disabled={running} className="w-full rounded-xl border border-white/5 bg-black/20 py-2 pl-10 pr-4 text-center text-sm text-white placeholder:text-zinc-600 transition-all focus:border-indigo-500/50 focus:bg-black/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            )}
          </div>

          <div className="relative mx-auto mt-8 flex h-[260px] w-[260px] items-center justify-center sm:h-[320px] sm:w-[320px]">
            <AnimatePresence>{running && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: [1, 1.2, 1] }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className={cn("absolute inset-0 -z-10 rounded-full blur-[60px]", activeTheme.aura)} aria-hidden="true" />}</AnimatePresence>
            <svg viewBox="0 0 100 100" className="absolute inset-0 z-10 h-full w-full -rotate-90 drop-shadow-2xl" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="none" className="stroke-white/5" strokeWidth="2" />
              <circle cx="50" cy="50" r="46" fill="none" stroke={`url(#${mode}Grad)`} strokeWidth="3" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} style={{ transition: "stroke-dashoffset 1s linear" }} />
              <defs>
                <linearGradient id="focusGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ea580c" /></linearGradient>
                <linearGradient id="shortGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#2dd4bf" /><stop offset="100%" stopColor="#0891b2" /></linearGradient>
                <linearGradient id="longGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient>
              </defs>
            </svg>

            <motion.div animate={running ? { scale: [1, 1.03, 1] } : { scale: 1 }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} className={cn("z-20 flex h-[210px] w-[210px] flex-col items-center justify-center rounded-full border bg-black/50 shadow-inner backdrop-blur-md transition-colors duration-500 sm:h-[260px] sm:w-[260px]", running ? activeTheme.border : "border-white/5")} role="timer" aria-live="off" aria-label={`${LABELS[mode]} ${mins} minutes ${secs} seconds remaining`}>
              <div className={cn("font-mono text-6xl font-black tabular-nums tracking-tighter transition-all duration-500 sm:text-7xl", activeTheme.color)} style={{ textShadow: running ? `0 0 30px rgba(${activeTheme.hex}, 0.6)` : "none" }}>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">{LABELS[mode]}</div>
            </motion.div>
          </div>

          <div className="relative z-20 mt-10 flex items-center justify-center gap-4 sm:mt-12">
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button onClick={toggle} aria-label={running ? "Pause focus timer" : "Start focus timer"} className={cn("h-14 rounded-2xl border px-8 text-lg font-bold transition-all", activeTheme.bg, activeTheme.border, activeTheme.color, "shadow-lg hover:bg-opacity-20")}>{running ? <><Pause className="mr-2 h-5 w-5" /> Pause</> : <><Play className="mr-2 h-5 w-5" /> Start</>}</Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}><Button variant="ghost" onClick={reset} aria-label="Reset focus timer" className="h-14 rounded-2xl px-4 text-zinc-500 transition hover:bg-white/5 hover:text-white"><RotateCcw className="h-5 w-5" /></Button></motion.div>
          </div>
        </div>

        <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={<Timer />} label="Sessions" value={completedFocus.toString()} />
          <StatCard icon={<Clock3Icon />} label="Focus time" value={`${totalMinutes}m`} />
          <StatCard icon={<Flame />} label="Status" value={running ? "Active" : "Ready"} />
        </div>
      </motion.div>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center"><div className="mx-auto mb-2 flex w-fit text-zinc-500" aria-hidden="true">{icon}</div><div className="text-lg font-black text-white">{value}</div><div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</div></div>;
}

function Clock3Icon() { return <Timer className="h-4 w-4" />; }

function WarpSpeedCanvas({ isActive, colorRgb }: { isActive: boolean; colorRgb: string }) {
  return <div aria-hidden="true" className={cn("fixed inset-0 -z-20 pointer-events-none transition-opacity duration-700", isActive ? "opacity-100" : "opacity-40")} style={{ background: `radial-gradient(circle at center, rgba(${colorRgb}, 0.06), transparent 48%)` }} />;
}
