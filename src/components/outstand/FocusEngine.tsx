import React, { memo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Zap, Sparkles, Crosshair } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { OutstandChallenge } from "@/lib/challenges.types";

const cinematicEase = [0.16, 1, 0.3, 1];
const explosiveEase = [0.19, 1, 0.22, 1];
const TRANSFORM_OPT = { transform: "translateZ(0)" } as const;

interface FocusEngineProps {
  challenge: OutstandChallenge | null;
  isShuffling: boolean;
  shuffleDisplay: { emoji: string; title: string };
  completionStage: number;
  running: boolean;
  mins: string;
  secs: string;
  setRunning: (state: boolean) => void;
  setRemaining: (time: number) => void;
  generate: () => void;
  complete: () => void;
}

export const FocusEngine = memo((props: FocusEngineProps) => {
  const { challenge, isShuffling, running, mins, secs, setRunning, setRemaining, generate, complete, completionStage } = props;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!challenge && !isShuffling ? (
        <motion.div
          key="idle"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.45, ease: cinematicEase }}
          className="flex w-full flex-col items-center gap-12 text-center will-change-transform"
          style={TRANSFORM_OPT}
        >
          <div className="relative z-10 flex w-full flex-col items-center gap-5">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.45, ease: cinematicEase }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200/90 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5" /> Initialize protocol
            </motion.div>
            <h1 className="bg-gradient-to-b from-white to-white/40 bg-clip-text pb-2 text-6xl font-black tracking-tighter text-transparent sm:text-7xl md:text-8xl">Outstand.</h1>
          </div>
          <MagneticCore generate={generate} disabled={isShuffling} />
        </motion.div>
      ) : isShuffling ? (
        <motion.div
          key="shuffling"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.3, ease: explosiveEase }}
          className="relative z-40 flex h-[440px] w-full max-w-lg items-center justify-center will-change-transform"
          style={TRANSFORM_OPT}
        >
          <motion.div initial={{ opacity: 0 }} exit={{ opacity: 1 }} transition={{ duration: 0.14 }} className="pointer-events-none absolute inset-[-40%] z-50 rounded-full bg-white" />
          <motion.div
            animate={{ x: [-1, 2, -1, 1, 0], y: [0, -1, 1, 0, 0] }}
            transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center will-change-transform"
            style={TRANSFORM_OPT}
          >
            <motion.div
              animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.28, 0.5, 0.28] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute h-64 w-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(34,211,238,0.45) 0%, transparent 68%)", ...TRANSFORM_OPT }}
            />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }} className="absolute h-72 w-72 rounded-full border border-cyan-500/20 will-change-transform sm:h-80 sm:w-80">
              <div className="h-1/2 w-1/2 origin-bottom-right bg-gradient-to-r from-transparent to-cyan-400/20" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360, scale: [1, 1.025, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
              className="absolute h-80 w-80 border border-cyan-500/20 will-change-transform sm:h-96 sm:w-96"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", ...TRANSFORM_OPT }}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
              <div className="absolute h-px w-[110%] bg-cyan-400/40" />
              <div className="absolute h-[110%] w-px bg-cyan-400/40" />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }}>
                <Crosshair className="h-20 w-20 text-cyan-300" strokeWidth={0.5} />
              </motion.div>
            </div>
            <div className="relative z-10 w-full max-w-xs">
              <div className="mb-3 text-center font-mono text-[10px] tracking-[0.45em] text-cyan-300/70">TARGET ACQUISITION</div>
              <div className="rounded-2xl border border-cyan-500/25 bg-black/75 px-6 py-5 text-center backdrop-blur-md">
                <div className="font-mono text-2xl font-black uppercase tracking-[0.18em] text-white">CALCULATING</div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-cyan-950">
                  <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} className="h-full w-1/2 bg-cyan-400 will-change-transform" />
                </div>
                <div className="mt-3 font-mono text-[8px] tracking-widest text-cyan-400/60">VECTORS CALIBRATED · SELECTING MISSION</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : challenge ? (
        <motion.div key="active" initial={{ opacity: 0, y: 32, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: cinematicEase }} className="relative z-30 w-full will-change-transform" style={TRANSFORM_OPT}>
          <div className="pointer-events-none absolute -bottom-20 left-1/2 h-28 w-full -translate-x-1/2" style={{ background: "radial-gradient(ellipse at center, rgba(34,211,238,0.12) 0%, transparent 70%)" }} />
          <ChallengeCard challenge={challenge} completionStage={completionStage} running={running} mins={mins} secs={secs} setRunning={setRunning} setRemaining={setRemaining} generate={generate} complete={complete} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
FocusEngine.displayName = "FocusEngine";

const MagneticCore = memo(({ generate, disabled }: { generate: () => void; disabled: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.5 });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
    const py = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
    x.set(px * 18);
    y.set(py * 18);
  };

  return (
    <motion.div ref={ref} onPointerMove={handlePointerMove} onPointerLeave={() => { x.set(0); y.set(0); }} style={{ x: springX, y: springY, ...TRANSFORM_OPT }} className="relative flex cursor-pointer touch-none items-center justify-center p-16">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} className="absolute inset-4 rounded-full border border-white/5 border-t-cyan-500/40 border-b-cyan-500/40 will-change-transform" />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="absolute inset-8 rounded-full border border-dashed border-indigo-400/20 border-l-indigo-400/50 will-change-transform" />
      <motion.button
        type="button"
        onClick={() => { generate(); x.set(0); y.set(0); }}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.035 }}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 22, mass: 0.45 }}
        className="group relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#070b14] shadow-[0_0_40px_rgba(34,211,238,0.08)] sm:h-44 sm:w-44"
      >
        <span className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-indigo-600/10 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        <Zap className="relative z-10 h-16 w-16 text-cyan-400/80 transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan-300 sm:h-20 sm:w-20" fill="currentColor" />
      </motion.button>
    </motion.div>
  );
});
MagneticCore.displayName = "MagneticCore";
