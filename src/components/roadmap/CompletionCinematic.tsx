import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Volume2, VolumeX, SkipForward, RotateCcw, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCinematicAudio } from "@/hooks/use-cinematic-audio";
import {
  CINEMATIC_BEATS,
  CINEMATIC_DURATION,
  type RoadmapProgress,
} from "@/lib/roadmap";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Props {
  progress: RoadmapProgress;
  onFinish?: () => void;
  onContinue?: () => void;
}

export function CompletionCinematic({ progress, onFinish, onContinue }: Props) {
  const reduceMotion = useReducedMotion();
  const audio = useCinematicAudio();

  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [runId, setRunId] = useState(0);
  const rafRef = useRef<number | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const beats = useMemo(() => CINEMATIC_BEATS, []);

  const finish = useCallback(() => {
    setDone(true);
    setElapsed(CINEMATIC_DURATION);
    onFinish?.();
  }, [onFinish]);

  const replay = useCallback(() => {
    firedRef.current = new Set();
    setDone(false);
    setElapsed(0);
    setRunId((r) => r + 1);
  }, []);

  // Timeline driver (rAF, single source of truth — no per-beat timers).
  useEffect(() => {
    if (done) return;
    if (reduceMotion) {
      // Reduced motion: skip the animated timeline, show the final lockup.
      finish();
      return;
    }
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const secs = (t - start) / 1000;
      setElapsed(secs);
      if (secs >= CINEMATIC_DURATION) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [done, reduceMotion, finish, runId]);

  // Sound cues, driven off the same clock.
  const activeIndex = useMemo(() => {
    let idx = -1;
    beats.forEach((b, i) => {
      if (elapsed >= b.at) idx = i;
    });
    return idx;
  }, [beats, elapsed]);

  useEffect(() => {
    const beat = beats[activeIndex];
    if (!beat?.cue) return;
    if (firedRef.current.has(beat.id)) return;
    firedRef.current.add(beat.id);
    audio.play(beat.cue);
  }, [activeIndex, beats, audio]);

  const active = activeIndex >= 0 ? beats[activeIndex] : null;
  const intensity = done ? 1 : (active?.intensity ?? 0);
  const timelinePct = done ? 100 : Math.min(100, (elapsed / CINEMATIC_DURATION) * 100);

  // Keyboard access: S = skip, R = replay, M = mute toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "s" && !done) { e.preventDefault(); finish(); }
      if (k === "r") { e.preventDefault(); replay(); }
      if (k === "m") { e.preventDefault(); audio.enabled ? audio.disable() : void audio.enable(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, finish, replay, audio]);

  useEffect(() => {
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  const pctComplete = Math.round(Math.max(0, Math.min(1, progress.ratio)) * 100);

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-label="Roadmap completion scene"
      className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#03060d] outline-none"
    >
      {/* Ambient light — intensity-driven, GPU-only properties */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(96,165,250,0.30), rgba(37,99,235,0.10) 35%, transparent 68%)",
          willChange: "opacity, transform",
        }}
        animate={{ opacity: 0.12 + intensity * 0.7, scale: 0.7 + intensity * 0.45 }}
        transition={{ duration: 1.8, ease: EASE }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(circle at 50% 50%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black, transparent 72%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent"
        animate={{ opacity: 0.15 + intensity * 0.85 }}
        transition={{ duration: 1.2, ease: EASE }}
      />

      {/* Controls */}
      <header className="relative z-20 flex items-center justify-between gap-2 px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          Outstand Roadmap
        </div>
        <div className="flex items-center gap-2">
          <CtrlButton
            label={audio.enabled ? "Mute sound" : "Enable sound"}
            onClick={() => (audio.enabled ? audio.disable() : void audio.enable())}
          >
            {audio.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{audio.enabled ? "Sound on" : "Sound off"}</span>
          </CtrlButton>
          {done ? (
            <CtrlButton label="Replay scene" onClick={replay}>
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Replay</span>
            </CtrlButton>
          ) : (
            <CtrlButton label="Skip scene" onClick={finish}>
              <SkipForward className="h-4 w-4" />
              <span className="hidden sm:inline">Skip</span>
            </CtrlButton>
          )}
        </div>
      </header>

      {/* Stage — fixed min-height prevents any layout jank between beats */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl text-center">
          <div className="grid min-h-[13rem] place-items-center sm:min-h-[15rem]">
            <AnimatePresence mode="wait" initial={false}>
              {!done && active ? (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                  transition={{ duration: 0.9, ease: EASE }}
                  className="space-y-4"
                >
                  {active.kicker && (
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-300/80">
                      {active.kicker}
                    </div>
                  )}
                  <p className="text-balance font-display text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
                    {active.line}
                  </p>
                </motion.div>
              ) : done ? (
                <FinalLockup
                  key="lockup"
                  pctComplete={pctComplete}
                  progress={progress}
                  onContinue={onContinue}
                  onReplay={replay}
                  reduceMotion={!!reduceMotion}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <footer className="relative z-20 px-4 pb-8 sm:px-8">
        <div
          role="progressbar"
          aria-label="Scene progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(timelinePct)}
          className="mx-auto h-[3px] w-full max-w-2xl overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-white"
            animate={{ width: `${timelinePct}%` }}
            transition={{ duration: 0.2, ease: "linear" }}
          />
        </div>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[10px] uppercase tracking-[0.24em] text-slate-600">
          Press S to skip · R to replay · M for sound
        </p>
      </footer>
    </section>
  );
}

function CtrlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-bold text-slate-300 backdrop-blur-md transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      {children}
    </button>
  );
}

function FinalLockup({
  pctComplete,
  progress,
  onContinue,
  onReplay,
  reduceMotion,
}: {
  pctComplete: number;
  progress: RoadmapProgress;
  onContinue?: () => void;
  onReplay: () => void;
  reduceMotion: boolean;
}) {
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: reduceMotion ? 0 : 1.1, ease: EASE }}
      className="flex flex-col items-center gap-7"
    >
      <div className="relative grid h-32 w-32 place-items-center">
        <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
          <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke="url(#outstandRing)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: reduceMotion ? C * (1 - pctComplete / 100) : C }}
            animate={{ strokeDashoffset: C * (1 - pctComplete / 100) }}
            transition={{ duration: reduceMotion ? 0 : 1.6, ease: EASE, delay: reduceMotion ? 0 : 0.2 }}
          />
          <defs>
            <linearGradient id="outstandRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute grid place-items-center">
          <Check className="h-8 w-8 text-white" strokeWidth={3} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-300/80">
          Roadmap complete
        </div>
        <h1 className="text-balance font-display text-4xl font-black leading-[1.02] tracking-tighter text-white sm:text-6xl">
          You Outstand{progress.name ? `, ${progress.name}` : ""}.
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
          {progress.completedModules} of {progress.totalModules} modules finished. The habits stay
          with you — the roadmap just made them visible.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={onContinue}
          className={cn(
            "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 text-sm font-black tracking-tight text-slate-950 transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:w-auto",
          )}
        >
          Continue to your roadmap <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" /> Replay scene
        </button>
      </div>
    </motion.div>
  );
}
