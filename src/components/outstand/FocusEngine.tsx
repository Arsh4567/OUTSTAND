import React, { useRef, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Zap, Sparkles, Crosshair } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { OutstandChallenge } from "@/lib/challenges.types";

const cinematicEase = [0.16, 1, 0.3, 1];
const explosiveEase = [0.19, 1, 0.22, 1];

interface FocusEngineProps {
  challenge: OutstandChallenge | null;
  isShuffling: boolean; // We still use this state, but treat it as "isCalculating"
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
          initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          transition={{ duration: 1, ease: cinematicEase }}
          className="flex flex-col items-center text-center space-y-12 w-full"
        >
          <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" /> Initialize Protocol
            </motion.div>
            
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] pb-2">
              Outstand.
            </h1>
          </div>

          <MagneticCore generate={generate} isShuffling={isShuffling} />
        </motion.div>

      /* ==========================================
         STATE 2: AAA TARGETING HUD (Calculation Phase)
         ========================================== */
      ) : isShuffling ? (
        <motion.div
          key="shuffling"
          initial={{ opacity: 0, scale: 0.5 }} 
          animate={{ opacity: 1, scale: 1 }} 
          // The Supernova Exit: Massive scale up, blinding brightness, huge blur
          exit={{ opacity: 0, scale: 5, filter: "brightness(10) blur(40px)" }}
          transition={{ duration: 0.5, ease: explosiveEase }}
          className="relative flex flex-col items-center justify-center z-40 w-full max-w-lg h-[500px]"
        >
          {/* CAMERA SHAKE RIG - Vibrates the entire HUD violently */}
          <motion.div
            animate={{ x: [-2, 3, -1, 2, -3, 0], y: [1, -2, 3, -1, 2, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Core Energy Flare */}
            <motion.div 
              animate={{ scale: [0.8, 1.2, 0.9], opacity: [0.6, 1, 0.6] }} 
              transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-32 h-32 bg-cyan-400 rounded-full blur-[60px] mix-blend-screen pointer-events-none transform-gpu"
            />

            {/* Radar Scanner Sweep */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute w-80 h-80 rounded-full overflow-hidden border border-cyan-500/20"
            >
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-cyan-400/40 origin-right backdrop-blur-sm" />
            </motion.div>

            {/* Outer Targeting Hexagon (3D Rotation) */}
            <motion.div 
              animate={{ rotateZ: -360, rotateX: [20, -20, 20], rotateY: [-20, 20, -20] }} 
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute w-96 h-96 border-[1px] border-cyan-500/30 transform-gpu"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            />

            {/* Inner Precision Crosshairs */}
            <div className="absolute w-full h-full flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-[120%] h-[1px] bg-cyan-400/50 absolute" />
              <div className="h-[120%] w-[1px] bg-cyan-400/50 absolute" />
              <Crosshair className="w-24 h-24 text-cyan-300 animate-[spin_4s_linear_infinite]" strokeWidth={0.5} />
            </div>

            {/* High-Tech Glitch Text Data Stream */}
            <div className="absolute flex flex-col items-center justify-center z-10 w-full max-w-xs">
              <motion.div 
                animate={{ opacity: [1, 0.2, 1, 0.8, 1], x: [-1, 1, -2, 0] }} 
                transition={{ duration: 0.2, repeat: Infinity }}
                className="text-red-500 font-mono text-[10px] tracking-[0.5em] mb-4 bg-black/60 px-4 py-1 border border-red-500/30"
              >
                SYSTEM OVERRIDE ACTIVE
              </motion.div>
              
              <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-xl border border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)] w-full text-center">
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }} 
                  transition={{ duration: 0.1, repeat: Infinity }} 
                  className="text-2xl font-black text-white font-mono uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                >
                  CALCULATING
                </motion.div>
                <div className="mt-2 h-1 w-full bg-cyan-950 overflow-hidden rounded-full">
                  <motion.div 
                    initial={{ x: "-100%" }} 
                    animate={{ x: "100%" }} 
                    transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/2 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" 
                  />
                </div>
                <div className="mt-3 text-[8px] text-cyan-400/60 font-mono tracking-widest text-left space-y-1">
                  <motion.p animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.2 }}>&gt; LOCATING HIGH-YIELD TARGET...</motion.p>
                  <motion.p animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.3, delay: 0.1 }}>&gt; CALIBRATING FOCUS VECTORS...</motion.p>
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
          initial={{ opacity: 0, y: 150, scale: 0.7, rotateX: 40 }} 
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} 
          // Delay covers the flashbang exit of the calculating state
          transition={{ delay: 0.15, type: "spring", damping: 25, stiffness: 120, mass: 1 }} 
          className="w-full relative z-30 perspective-[1500px]"
        >
          {/* Intense Ground Reflection below the card */}
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none transform-gpu" />
          
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
    x.set((clientX - (left + width / 2)) * 0.4);
    y.set((clientY - (top + height / 2)) * 0.4);
  };

  return (
    <motion.div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: springX, y: springY }}
      className="relative flex items-center justify-center p-16 cursor-pointer touch-none z-30"
    >
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }} 
        className="absolute inset-4 rounded-full border border-white/5 border-t-cyan-500/40 border-b-cyan-500/40 transform-gpu" 
      />
      <motion.div 
        animate={{ rotate: -360 }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
        className="absolute inset-8 rounded-full border border-dashed border-indigo-400/20 border-l-indigo-400/50 transform-gpu" 
      />

      <motion.button 
        onClick={() => { generate(); x.set(0); y.set(0); }}
        disabled={isShuffling}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative h-36 w-36 sm:h-44 sm:w-44 rounded-full bg-[#070b14] border border-white/10 overflow-hidden group shadow-[0_0_50px_rgba(34,211,238,0.15)] hover:shadow-[0_0_100px_rgba(34,211,238,0.4)] transition-all duration-500 flex items-center justify-center transform-gpu"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-indigo-600/10 opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.3)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <Zap className="h-16 w-16 sm:h-20 sm:w-20 text-cyan-400/80 group-hover:text-cyan-300 relative z-20 group-hover:scale-110 transition-all duration-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" fill="currentColor" />
      </motion.button>
    </motion.div>
  );
});
MagneticCore.displayName = "MagneticCore";
                  
