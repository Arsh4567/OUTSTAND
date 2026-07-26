import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOutstand } from "@/hooks/use-outstand";
import { ChallengeCard } from "@/components/ChallengeCard";

export const Route = createFileRoute("/_authenticated/outstand")({
  component: OutstandPage,
});

function OutstandPage() {
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
  } = useOutstand();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 overflow-hidden">
      
      <motion.div 
        animate={completionStage === 1 ? { opacity: 0.7 } : completionStage === 2 ? { opacity: 0 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-black z-10 pointer-events-none" 
      />
      
      <div className="absolute inset-0 bg-slate-950 -z-10" />
      <motion.div 
        className="absolute inset-0 opacity-20 -z-10"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ backgroundImage: "radial-gradient(circle at center, #4f46e5, transparent 70%)" }}
      />

      <div className="w-full max-w-lg z-20 relative">
        <AnimatePresence mode="wait">
          {!challenge && !isShuffling ? (
             <motion.div
             key="generator"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="text-center space-y-8"
           >
             <div className="space-y-2">
               <h1 className="text-4xl font-black tracking-tight text-white">Outstand</h1>
               <p className="text-slate-400">Ten minutes. Total focus. A better you.</p>
             </div>
             <Button 
               onClick={generate}
               className="h-20 w-20 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95"
             >
               <Zap className="h-8 w-8 text-white" />
             </Button>
           </motion.div>
          ) : isShuffling ? (
             <motion.div
             key="shuffling"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="bg-slate-900/50 border border-white/10 p-12 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center space-y-6"
           >
              <div className="text-7xl animate-pulse blur-[1px]">{shuffleDisplay.emoji}</div>
              <div className="text-xl font-bold text-slate-400 font-mono uppercase tracking-widest animate-pulse">
                {shuffleDisplay.title}
              </div>
           </motion.div>
          ) : challenge ? (
            <ChallengeCard 
              challenge={challenge}
              completionStage={completionStage}
              running={running}
              mins={mins}
              secs={secs}
              setRunning={setRunning}
              setRemaining={setRemaining}
              generate={generate}
              complete={complete}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
              }
