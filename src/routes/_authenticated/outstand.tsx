import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Pause, Play, RotateCcw, Zap, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHALLENGES, randomChallenge, getRarityStyle, type OutstandChallenge } from "@/lib/challenges";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/outstand")({
  component: OutstandPage,
});

function OutstandPage() {
  const { outstand, recordOutstand } = useAppState();
  const { addPositive } = useDailyLog();
  
  const [challenge, setChallenge] = useState<OutstandChallenge | null>(null);
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  
  // existing states
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleDisplay, setShuffleDisplay] = useState({ emoji: "⚡", title: "Locating Mission..." });
  
  // NEW: Premium Animation State
  const [isCompleting, setIsCompleting] = useState(false);
  
  const intervalRef = useRef<number | null>(null);

  const generate = () => {
    setIsShuffling(true);
    setChallenge(null); 
    
    let ticks = 0;
    const shuffleInterval = setInterval(() => {
      const temp = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      setShuffleDisplay({ emoji: temp.emoji, title: temp.title });
      ticks++;
      
      if (ticks > 12) {
        clearInterval(shuffleInterval);
        const next = randomChallenge(challenge?.title);
        setChallenge(next);
        setRemaining(next.minutes * 60);
        setRunning(false);
        setIsShuffling(false);
      }
    }, 80); 
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]);
          toast.success("Time's up! Mission complete.");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [running]);

  // NEW: Orchestrated Completion Logic
  const complete = () => {
    if (!challenge || isCompleting) return;
    
    setRunning(false);
    setIsCompleting(true); // 1. Trigger the animation lock
    
    // Haptic success snap (Apple-style triple tap)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
    
    // 2. Wait exactly 1.2 seconds for the animation to play, then clear state
    setTimeout(() => {
      recordOutstand(challenge.title);
      addPositive("outstand");
      toast.success("Mission Accomplished", { description: `+${challenge.xp} XP added to your baseline.` });
      setChallenge(null);
      setIsCompleting(false);
    }, 1200);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  
  const rarityTheme = challenge ? getRarityStyle(challenge.rarity) : null;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* Background that flashes intensely upon completion */}
      <motion.div 
        animate={isCompleting ? { backgroundColor: challenge?.color || "#ffffff", opacity: [0, 0.15, 0] } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 z-0 pointer-events-none" 
      />
      
      <div className="absolute inset-0 bg-slate-950 -z-10" />
      <motion.div 
        className="absolute inset-0 opacity-20 -z-10"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ backgroundImage: "radial-gradient(circle at center, #4f46e5, transparent 70%)" }}
      />

      <div className="w-full max-w-lg z-10 relative">
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
          ) : challenge && rarityTheme ? (
            
            // NEW: The dynamic card that orchestrates the completion animation
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.8 }}
              // If completing: Scale up slightly to "absorb" energy, then shoot up and disappear
              animate={isCompleting ? { 
                scale: [1, 1.05, 0], 
                y: [0, -10, -300],
                opacity: [1, 1, 0],
                filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
              } : { 
                opacity: 1, scale: 1, y: 0, filter: "brightness(1)" 
              }}
              exit={{ opacity: 0, y: -20 }}
              transition={isCompleting 
                ? { duration: 1, times: [0, 0.4, 1], ease: "easeInOut" } 
                : { type: "spring", bounce: 0.4, duration: 0.6 }
              }
              className={cn(
                "relative overflow-hidden p-8 rounded-3xl backdrop-blur-xl border-2 transition-colors duration-700",
                rarityTheme.bg,
                rarityTheme.border,
                rarityTheme.shadow
              )}
            >
              
              {/* NEW: The Confetti / Sparkle Burst layer. Only visible when completing */}
              {isCompleting && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={`spark-${i}`}
                      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                      animate={{
                        scale: [0, 1.5, 0],
                        opacity: [1, 1, 0],
                        // Math to shoot particles in a 360 degree circle
                        x: Math.cos((i * 30 * Math.PI) / 180) * 200,
                        y: Math.sin((i * 30 * Math.PI) / 180) * 200,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute w-3 h-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                      style={{ backgroundColor: challenge.color || "#fff" }}
                    />
                  ))}
                </div>
              )}

              <motion.div 
                initial={{ opacity: 0.8, x: "-100%" }}
                animate={{ opacity: 0, x: "100%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 bg-white/20 skew-x-12 pointer-events-none"
              />

              <div className="text-center space-y-6 relative z-10">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className={cn("px-3 py-1 rounded-full bg-black/40", rarityTheme.text)}>
                    {challenge.rarity}
                  </span>
                  <span className="text-slate-400">{challenge.category}</span>
                </div>

                <motion.div 
                  animate={isCompleting ? { scale: [1, 1.5], rotate: [0, 10] } : {}}
                  transition={{ duration: 0.5 }}
                  className="text-6xl drop-shadow-2xl pt-2"
                >
                  {challenge.emoji}
                </motion.div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white">{challenge.title}</h2>
                  <p className="text-slate-300 mt-2 text-sm leading-relaxed">{challenge.description}</p>
                </div>

                <div className={cn("text-6xl font-mono font-black tabular-nums tracking-widest py-6", rarityTheme.text)}>
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => setRunning(!running)} disabled={isCompleting} className="rounded-full w-14 h-14 bg-white/10 hover:bg-white/20 border-white/5 disabled:opacity-50">
                    {running ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
                  </Button>
                  <Button variant="outline" onClick={() => { setRemaining(challenge.minutes * 60); setRunning(false); }} disabled={isCompleting} className="rounded-full w-14 h-14 bg-black/40 border-white/10 hover:bg-white/10 text-white disabled:opacity-50">
                    <RotateCcw size={20} />
                  </Button>
                  <Button variant="ghost" onClick={generate} disabled={isCompleting} className="rounded-full w-14 h-14 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50">
                    <SkipForward size={20} />
                  </Button>
                </div>

                <Button 
                  onClick={complete}
                  disabled={isCompleting} 
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-lg text-black transition-all shadow-xl relative overflow-hidden", 
                    rarityTheme ? rarityTheme.bg.replace('/10', '/90') : "bg-white/90",
                    isCompleting ? "scale-95 opacity-90" : "active:scale-95"
                  )}
                  style={{ backgroundColor: challenge.color }}
                >
                  {isCompleting ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="flex items-center">
                      <Zap className="mr-2 h-5 w-5 animate-pulse" /> ACCUMULATING XP...
                    </motion.div>
                  ) : (
                    <span className="flex items-center"><CheckCircle2 className="mr-2 h-5 w-5" /> COMPLETE (+{challenge.xp} XP)</span>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
