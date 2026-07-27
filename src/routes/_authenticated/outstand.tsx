import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
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
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#030712]">
      
      {/* Epic Cinematic Backgrounds */}
      <motion.div 
        animate={completionStage === 1 ? { opacity: 0.9, backdropFilter: "blur(20px)" } : completionStage === 2 ? { opacity: 0 } : { opacity: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-black z-10 pointer-events-none" 
      />
      
      <motion.div 
        className="absolute inset-0 opacity-30 -z-10"
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%"],
          scale: [1, 1.05, 1] 
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ 
          backgroundImage: "radial-gradient(circle 800px at center, rgba(79,70,229,0.15), transparent 80%)",
        }}
      />

      <div className="w-full max-w-xl z-20 relative">
        <AnimatePresence mode="wait">
          {!challenge && !isShuffling ? (
             <motion.div
             key="generator"
             initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
             animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
             exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
             transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
             className="text-center space-y-10"
           >
             <div className="space-y-4 relative">
               {/* Ambient text glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />
               
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md"
               >
                 <Sparkles className="h-3 w-3" /> Initialize Protocol
               </motion.div>
               <h1 className="text-5xl sm:text-7xl font-display font-black tracking-tighter text-white drop-shadow-2xl">
                 Outstand.
               </h1>
               <p className="text-slate-400 text-lg sm:text-xl font-medium tracking-wide">
                 Ten minutes. Total focus. A better you.
               </p>
             </div>

             <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative inline-block"
             >
                {/* Button aura ring */}
                <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-[spin_4s_linear_infinite]" />
                <Button 
                  onClick={generate}
                  className="relative h-24 w-24 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_60px_rgba(79,70,229,0.5)] transition-all overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Zap className="h-10 w-10 text-white fill-current drop-shadow-md z-10" />
                </Button>
             </motion.div>
           </motion.div>
          ) : isShuffling ? (
             <motion.div
             key="shuffling"
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, y: 20 }}
             className="bg-slate-900/40 border border-indigo-500/30 p-16 rounded-[2.5rem] shadow-[0_0_80px_rgba(79,70,229,0.15)] backdrop-blur-3xl flex flex-col items-center justify-center space-y-8 relative overflow-hidden"
           >
              {/* Shuffling scanner line */}
              <motion.div 
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-full h-[2px] bg-indigo-500/50 blur-[2px]"
              />

              <motion.div 
                animate={{ scale: [1, 1.1, 1], filter: ["blur(0px)", "blur(4px)", "blur(0px)"] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="text-8xl drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                {shuffleDisplay.emoji}
              </motion.div>
              
              <div className="text-xl font-bold text-indigo-300 font-mono uppercase tracking-[0.3em]">
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
