import React, { useRef, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Zap, Sparkles, Crosshair } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { OutstandChallenge } from "@/lib/challenges.types";

const cinematicEase = [0.16, 1, 0.3, 1];
const explosiveEase = [0.19, 1, 0.22, 1];

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

export const FocusEngine = memo(({ 
  challenge, isShuffling, running, mins, secs, setRunning, setRemaining, generate, complete, completionStage 
}: FocusEngineProps) => {
  return (
    <AnimatePresence mode="wait">
      
      {/* ==========================================
          STATE 1: IDLE PROTOCOL
          ========================================== */}
      {!challenge && !isShuffling ? (
        <motion.div
          key="idle"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6, ease: cinematicEase }}
          className="flex flex-col items-center text-center space-y-12 w-full transform-gpu will-change-transform"
        >
          <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-[0.25em] shadow-lg backdrop-blur-md transform-gpu"
            >
              <Sparkles className="h-4 w-4 animate-pulse" /> Initialize Protocol
            </motion.div>
            
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 pb-2 transform-gpu">
              Outstand.
            </h1>
          </div>

          <MagneticCore generate={generate} isShuffling={isShuffling} />
        </motion.div>

      /* ==========================================
         STATE 2: AAA TARGETING HUD (60 FPS OPTIMIZED)
         ========================================== */
      ) : isShuffling ? (
        <motion.div
          key="shuffling"
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.4, ease: explosiveEase }}
          className="relative flex flex-col items-center justify-center z-40 w-full max-w-lg h-[500px] transform-gpu will-change-transform"
        >
          {/* THE FLASHBANG HACK: A pure white div that fades in on exit instead of using expensive blur/brightness filters */}
          <motion.div 
            initial={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-[-50%] bg-white rounded-full z-50 pointer-events-none transform-gpu"
          />

          {/* CAMERA SHAKE RIG - Translated on GPU */}
          <motion.div
            animate={{ x: [-2, 3, -1, 2, -3, 0], y: [1, -2, 3, -1, 2, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center transform-gpu will-change-transform"
          >
            {/* Core Energy Flare (Pre-baked radial gradient instead of box-shadow/blur) */}
            <motion.div 
              animate={{ scale: [0.8, 1.2, 0.9], opacity: [0.4, 0.8, 0.4] }} 
              transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-64 h-64 rounded-full pointer-events-none transform-gpu mix-blend-screen"
              style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.8) 0%, transparent 70%)' }}
            />

            {/* Radar Scanner Sweep */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute w-80 h-80 rounded-full overflow-hidden border border-cyan-500/20 transform-gpu will-change-transform"
            >
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-cyan-400/30 origin-right" />
            </motion.div>

            {/* Outer Targeting Hexagon */}
            <motion.div 
              animate={{ rotateZ: -360, scale: [1, 1.05, 1] }} 
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute w-96 h-96 border border-cyan-500/30 transform-gpu will-change-transform"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            />

            {/* Inner Precision Crosshairs */}
            <div className="absolute w-full h-full flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-[120%] h-[1px] bg-cyan-400/50 absolute transform-gpu" />
              <div className="h-[120%] w-[1px] bg-cyan-400/50 absolute transform-gpu" />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="transform-gpu will-change-transform">
                <Crosshair className="w-24 h-24 text-cyan-300" strokeWidth={0.5} />
              </motion.div>
            </div>

            {/* High-Tech Glitch Text Data Stream */}
            <div className="absolute flex flex-col items-center justify-center z-10 w-full max-w-xs">
              <motion.div 
                animate={{ opacity: [1, 0.4, 1, 0.8, 1], x: [-1, 1, -2, 0] }} 
                transition={{ duration: 0.2, repeat: Infinity }}
                className="text-red-500 font-mono text-[10px] tracking-[0.5em] mb-4 bg-black/80 px-4 py-1 border border-red-500/30 transform-gpu will-change-transform"
              >
                SYSTEM OVERRIDE ACTIVE
              </motion.div>
              
              <div className="bg-black/90 px-6 py-4 rounded-xl border border-cyan-500/50 w-full text-center">
                <motion.div 
                  animate={{ opacity: [0.6, 1, 0.6] }} 
                  transition={{ duration: 0.15, repeat: Infinity }} 
                  className="text-2xl font-black text-white font-mono uppercase tracking-[0.2em]"
                >
                  CALCULATING
                </motion.div>
                <div className="mt-2 h-1 w-full bg-cyan-950 overflow-hidden rounded-full">
                  <motion.div 
                    initial={{ x: "-100%" }} 
                    animate={{ x: "100%" }} 
                    transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/2 bg-cyan-400 transform-gpu will-change-transform" 
                  />
                </div>
                <div className="mt-3 text-[8px] text-cyan-400/80 font-mono tracking-widest text-left space-y-1">
                  <motion.p animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.2 }}>&gt; LOCATING TARGET...</motion.p>
                  <motion.p animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.3, delay: 0.1 }}>&gt; CALIBRATING VECTORS...</motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

      /* ==========================================
         STATE 3: ACTIVE CARD DEPLOYMENT
         ========================================== */
      ) : challenge ? (
        <motion.div 
          key="active" 
          initial={{ opacity: 0, y: 100, scale: 0.8 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ delay: 0.1, type: "spring", damping: 20, stiffness: 100, mass: 1 }} 
          className="w-full relative z-30 perspective-[1500px] transform-gpu will-change-transform"
        >
          {/* Ground Reflection using a baked radial gradient instead of blur */}
          <div 
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[100%] h-32 pointer-events-none transform-gpu" 
            style={{ background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.15) 0%, transparent 70%)' }}
          />
          
          <ChallengeCard 
            challenge={challenge} 
            completionStage={completionStage} 
            running={running} mins={mins} secs={secs} 
            setRunning={setRunning} setRemaining={setRemaining} 
            generate={generate} complete={complete} 
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
FocusEngine.displayName = "FocusEngine";

// ==========================================
// SUB-COMPONENT: The Idle Magnetic Core
// ==========================================
const MagneticCore = memo(({ generate, isShuffling }: { generate: () => void, isShuffling: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 400, damping: 25, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 400, damping: 25, mass: 0.5 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || isShuffling) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((clientX - (left + width / 2)) * 0.3);
    y.set((clientY - (top + height / 2)) * 0.3);
  };

  return (
    <motion.div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: springX, y: springY }}
      className="relative flex items-center justify-center p-16 cursor-pointer touch-none z-30 transform-gpu will-change-transform"
    >
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }} 
        className="absolute inset-4 rounded-full border border-white/5 border-t-cyan-500/40 border-b-cyan-500/40 transform-gpu will-change-transform" 
      />
      <motion.div 
        animate={{ rotate: -360 }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
        className="absolute inset-8 rounded-full border border-dashed border-indigo-400/20 border-l-indigo-400/50 transform-gpu will-change-transform" 
      />

      <motion.button 
        onClick={() => { generate(); x.set(0); y.set(0); }}
        disabled={isShuffling}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative h-36 w-36 sm:h-44 sm:w-44 rounded-full bg-[#070b14] border border-white/10 overflow-hidden group shadow-lg transition-all flex items-center justify-center transform-gpu"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-indigo-600/10 opacity-50 group-hover:opacity-100 transition-opacity" />
        <Zap className="h-16 w-16 sm:h-20 sm:w-20 text-cyan-400/80 group-hover:text-cyan-300 relative z-20 group-hover:scale-110 transition-transform duration-300" fill="currentColor" />
      </motion.button>
    </motion.div>
  );
});
MagneticCore.displayName = "MagneticCore";
