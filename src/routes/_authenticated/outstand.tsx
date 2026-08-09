import { createFileRoute, useSearch } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import React, { useEffect, useState, memo } from "react";
import { useOutstand } from "@/hooks/use-outstand";
import { FocusEngine } from "@/components/outstand/FocusEngine";

// ============================================================================
// ROUTING & TYPES
// ============================================================================

type OutstandSearch = { challengeId?: string };

export const Route = createFileRoute("/_authenticated/outstand")({
  validateSearch: (search: Record<string, unknown>): OutstandSearch => ({
    challengeId: search.challengeId as string | undefined,
  }),
  component: OutstandPage,
});

const cinematicEase = [0.16, 1, 0.3, 1];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function OutstandPage() {
  const searchParams = useSearch({ strict: false }) as OutstandSearch;
  const challengeId = searchParams?.challengeId;

  // Real Supabase-backed state hooked directly to your backend logic
  const {
    challenge, running, setRunning, setRemaining, isShuffling,
    shuffleDisplay, completionStage, generate, complete, mins, secs, loadChallenge,
  } = useOutstand();
  
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Deep Link Auto-loader for specific challenges
  useEffect(() => {
    if (challengeId && loadChallenge) {
      const timer = setTimeout(() => loadChallenge(challengeId), 150);
      return () => clearTimeout(timer);
    }
  }, [challengeId, loadChallenge]);

  // Network Listeners for seamless offline degradation
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-8 bg-[#02040a] text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* 3D Environment & Background Nebulas */}
      <EnvironmentEffects completionStage={completionStage} isShuffling={isShuffling} />
      
      {/* Network Alert (Only visible when offline) */}
      <OfflineBanner isOnline={isOnline} />

      {/* Main Focus Engine Injection */}
      <main className="w-full max-w-4xl z-20 flex flex-col items-center justify-center relative perspective-[1200px] flex-grow">
        <FocusEngine 
          challenge={challenge}
          isShuffling={isShuffling}
          shuffleDisplay={shuffleDisplay}
          completionStage={completionStage}
          running={running}
          mins={mins}
          secs={secs}
          setRunning={setRunning}
          setRemaining={setRemaining}
          generate={generate}
          complete={complete}
        />
      </main>
    </div>
  );
}

// ============================================================================
// BACKGROUND SUB-COMPONENTS
// ============================================================================

const EnvironmentEffects = memo(({ completionStage, isShuffling }: { completionStage: number, isShuffling: boolean }) => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    {/* Cinematic Vignette/Blur Overlay (Activates during challenge completion) */}
    <motion.div 
      animate={{ opacity: completionStage === 1 ? 1 : 0, backdropFilter: completionStage === 1 ? "blur(40px)" : "blur(0px)" }}
      transition={{ duration: 1.5, ease: cinematicEase }}
      className="absolute inset-0 z-30 bg-black/80 transform-gpu" 
    />
    
    {/* 3D Perspective Grid */}
    <div className="absolute inset-0 z-0 opacity-20" style={{ perspective: "1000px" }}>
      <motion.div 
        animate={{ rotateX: isShuffling ? 65 : 60, y: isShuffling ? "-10%" : "0%" }}
        transition={{ duration: 2, ease: cinematicEase }}
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] transform-gpu origin-bottom [mask-image:linear-gradient(to_bottom,transparent_10%,black_80%)]" 
      />
    </div>

    {/* Volumetric Nebulas (Accelerate during calculation phase) */}
    <motion.div 
      animate={{ scale: isShuffling ? [1, 1.2, 1] : [1, 1.1, 1], opacity: isShuffling ? [0.6, 0.8, 0.6] : [0.2, 0.3, 0.2] }} 
      transition={{ duration: isShuffling ? 2 : 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/40 blur-[150px] mix-blend-screen transform-gpu" 
    />
    <motion.div 
      animate={{ scale: isShuffling ? [1, 1.3, 1] : [1, 1.05, 1], opacity: isShuffling ? [0.5, 0.7, 0.5] : [0.15, 0.25, 0.15] }} 
      transition={{ duration: isShuffling ? 1.5 : 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      className="absolute bottom-[10%] right-[20%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/30 blur-[160px] mix-blend-screen transform-gpu" 
    />
  </div>
));
EnvironmentEffects.displayName = "EnvironmentEffects";

const OfflineBanner = memo(({ isOnline }: { isOnline: boolean }) => (
  <AnimatePresence>
    {!isOnline && (
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        className="fixed top-6 z-50 w-auto px-6 py-3 rounded-full bg-red-500/10 backdrop-blur-xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center gap-3 text-xs uppercase tracking-widest font-bold text-red-400 transform-gpu"
      >
        <WifiOff className="h-4 w-4 animate-pulse" />
        Network Disconnected — Local Mode Active
      </motion.div>
    )}
  </AnimatePresence>
));
OfflineBanner.displayName = "OfflineBanner";
    
