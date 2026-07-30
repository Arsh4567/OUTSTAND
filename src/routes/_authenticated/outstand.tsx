import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useOutstand } from "@/hooks/use-outstand";
import { ChallengeCard } from "@/components/ChallengeCard";

// 1. Define the expected search parameters for deep linking
type OutstandSearch = {
  challengeId?: string;
};

// 2. Add validateSearch to the route definition
export const Route = createFileRoute("/_authenticated/outstand")({
  validateSearch: (search: Record<string, unknown>): OutstandSearch => {
    return {
      challengeId: search.challengeId as string | undefined,
    };
  },
  component: OutstandPage,
});

// Premium Cinematic Easing (Apple/Linear style)
const cinematicEase = [0.19, 1, 0.22, 1];

function OutstandPage() {
  // 3. Extract the challengeId from the URL search params
  const { challengeId } = Route.useSearch();

  const {
    challenge,
    running,
    setRunning,
    setRemaining,
    isShuffling,
    shuffleDisplay,
    completionStage,
    generate,
    complete,
    mins,
    secs,
    loadChallenge, // <-- Make sure to export this from useOutstand!
  } = useOutstand();

  // 4. Auto-load the specific challenge if the ID exists in the URL
  useEffect(() => {
    if (challengeId && loadChallenge) {
      // Slight delay ensures the page transition finishes before the card glides in,
      // creating a premium staggered cinematic effect.
      const timer = setTimeout(() => {
        loadChallenge(challengeId);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [challengeId, loadChallenge]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-zinc-950 font-sans">
      
      {/* ========================================================= */}
      {/* 1. CINEMATIC ENVIRONMENT & LIGHTING                         */}
      {/* ========================================================= */}
      
      {/* Completion Blackout / Blur Overlay */}
      <motion.div 
        animate={
          completionStage === 1 
            ? { opacity: 1, backdropFilter: "blur(40px)", backgroundColor: "rgba(0,0,0,0.85)" } 
            : completionStage === 2 
            ? { opacity: 0, backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" } 
            : { opacity: 0, backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" }
        }
        transition={{ duration: 1.5, ease: cinematicEase }}
        className="absolute inset-0 z-30 pointer-events-none" 
      />
      
      {/* Deep Space Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Rotating Ambient Reactor Orbs */}
      <motion.div 
        className="absolute inset-0 opacity-40 z-0 pointer-events-none mix-blend-screen"
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ 
          backgroundImage: "radial-gradient(circle 60vw at 50% 20%, rgba(79,70,229,0.15), transparent 60%), radial-gradient(circle 50vw at 80% 80%, rgba(124,58,237,0.1), transparent 50%)",
        }}
      />

      {/* ========================================================= */}
      {/* 2. FOREGROUND UI ENGINE                                     */}
      {/* ========================================================= */}
      
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl z-20 relative perspective-[1000px]">
        <AnimatePresence mode="wait">
          
          {/* STATE A: GENERATOR PROTOCOL (IDLE) */}
          {!challenge && !isShuffling ? (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 40, rotateX: 10, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.85, y: -20, filter: "blur(12px)" }}
              transition={{ duration: 1, ease: cinematicEase }}
              className="text-center space-y-16"
            >
              <div className="space-y-6 relative">
                {/* Core Glow behind text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: cinematicEase }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-xl"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" /> 
                  Initialize Protocol
                </motion.div>
                
                <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30 drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  Outstand.
                </h1>
                
                <p className="text-zinc-400 text-lg sm:text-xl font-medium tracking-wide max-w-md mx-auto">
                  Ten minutes. Total focus. A better you.
                </p>
              </div>

              {/* The Reactor Button */}
              <motion.div
                whileHover="hover"
                whileTap="tap"
                initial="idle"
                className="relative inline-flex items-center justify-center mt-12"
              >
                {/* Outer slow-spinning structural ring */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-20px] rounded-full border border-indigo-500/10 border-t-indigo-500/40" 
                />
                
                {/* Inner fast-spinning energetic ring */}
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-10px] rounded-full border border-dashed border-indigo-400/20" 
                />

                <motion.div
                  variants={{
                    idle: { scale: 1, boxShadow: "0 0 40px rgba(79,70,229,0.3)" },
                    hover: { scale: 1.05, boxShadow: "0 0 80px rgba(79,70,229,0.6)" },
                    tap: { scale: 0.95, boxShadow: "0 0 20px rgba(79,70,229,0.4)" }
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Button 
                    onClick={() => generate()}
                    className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-white/20 transition-colors overflow-hidden group z-10 flex items-center justify-center"
                  >
                    {/* Inner flare sweep */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <Zap className="h-12 w-12 sm:h-14 sm:w-14 text-white fill-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] relative z-20" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

          /* STATE B: QUANTUM SHUFFLE */
          ) : isShuffling ? (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(15px)", transition: { duration: 0.4 } }}
              transition={{ duration: 0.6, ease: cinematicEase }}
              className="bg-zinc-900/40 border-[0.5px] border-indigo-500/30 p-16 rounded-[3rem] shadow-[inset_0_0_80px_rgba(79,70,229,0.1),0_0_100px_rgba(79,70,229,0.15)] backdrop-blur-3xl flex flex-col items-center justify-center space-y-10 relative overflow-hidden"
            >
              {/* High-speed vertical scanner line */}
              <motion.div 
                animate={{ y: ["-100%", "200%"] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-indigo-400/80 blur-[2px] shadow-[0_0_20px_rgba(129,140,248,1)]"
              />

              {/* Slot machine motion blur effect on emoji */}
              <motion.div 
                animate={{ 
                  y: [-10, 10, -10], 
                  scale: [1, 1.1, 1],
                  filter: ["blur(2px) brightness(1)", "blur(8px) brightness(1.5)", "blur(2px) brightness(1)"] 
                }}
                transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
                className="text-8xl sm:text-9xl drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]"
              >
                {shuffleDisplay.emoji}
              </motion.div>
              
              {/* Glitching Text Reveal */}
              <motion.div 
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="text-xl sm:text-2xl font-black text-indigo-300 font-mono uppercase tracking-[0.4em] drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] text-center"
              >
                {shuffleDisplay.title}
              </motion.div>
            </motion.div>

          /* STATE C: ACTIVE CHALLENGE (Uses your external component) */
          ) : challenge ? (
            <motion.div
              key="active-challenge"
              initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(15px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", damping: 25, stiffness: 200, mass: 1 }}
            >
              <ChallengeCard 
                challenge={challenge}
                completionStage={completionStage}
                running={running}
                mins={mins}
                secs={secs}
                setRunning={setRunning}
                setRemaining={setRemaining}
                generate={() => generate()}
                complete={complete}
              />
            </motion.div>
          ) : null}
          
        </AnimatePresence>
      </div>
    </div>
  );
                    }
