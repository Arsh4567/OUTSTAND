import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Pause, Play, RotateCcw, Zap, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
// 👇 FIX: Explicitly pointing to the index file here
import { CHALLENGES, randomChallenge, getRarityStyle, type OutstandChallenge } from "@/lib/challenges/index";
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
  
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleDisplay, setShuffleDisplay] = useState({ emoji: "⚡", title: "Locating Mission..." });
  
  const [completionStage, setCompletionStage] = useState<0 | 1 | 2>(0);
  
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

  const complete = () => {
    if (!challenge || completionStage !== 0) return;
    
    // 1. Capture the exact challenge data BEFORE it gets deleted
    const xpEarned = challenge.xp;
    const challengeEmoji = challenge.emoji;
    const challengeColor = challenge.color;
    
    setRunning(false);
    setCompletionStage(1); 
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 100, 30, 80, 50, 50, 100]); 
    }
    
    setTimeout(() => {
      setCompletionStage(2);
    }, 1500);

    setTimeout(() => {
      // 2. Database calls (We will upgrade this logic next)
    recordOutstand(challenge.title, challenge.xp);
      
      addPositive("outstand");
      
      // 3. THE PREMIUM CUSTOM TOAST
      toast.custom((t) => (
        <div 
          className="relative overflow-hidden w-full max-w-[360px] mx-auto rounded-2xl border border-white/10 bg-slate-950 p-4 flex items-center gap-4"
          // Creates a massive, soft glowing shadow using the specific color of the challenge
          style={{ boxShadow: `0 20px 40px -10px ${challengeColor || '#4f46e5'}60` }}
        >
          {/* Glassmorphism background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          
          {/* Custom Emoji Icon Box */}
          <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center text-3xl bg-black/50 rounded-xl border border-white/10 shadow-inner z-10">
            {challengeEmoji}
          </div>
          
          {/* Text and XP UI */}
          <div className="relative flex-1 z-10">
            <h3 className="text-white font-black text-xs tracking-[0.2em] uppercase opacity-70">Mission Cleared</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white font-black font-mono text-2xl leading-none">
                +{xpEarned} <span className="text-sm opacity-50">XP</span>
              </span>
            </div>
          </div>
        </div>
      ), { duration: 4000 });

      setChallenge(null);
      setCompletionStage(0);
    }, 2800);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const rarityTheme = challenge ? getRarityStyle(challenge.rarity) : null;

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
          ) : challenge && rarityTheme ? (
            
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                completionStage === 1 ? { 
                  scale: 0.4, 
                  y: 0,
                  rotateZ: [0, -1, 1, -1, 1, 0], 
                  borderRadius: "100px", 
                } : completionStage === 2 ? {
                  scale: [0.4, 0.2, 0], 
                  y: [0, 50, -800], 
                  opacity: [1, 1, 0],
                } : { 
                  opacity: 1, scale: 1, y: 0, borderRadius: "24px"
                }
              }
              transition={
                completionStage === 1 ? { duration: 1.2, ease: "backInOut" } 
                : completionStage === 2 ? { duration: 1.0, ease: [0.87, 0, 0.13, 1] } 
                : { type: "spring", bounce: 0.4, duration: 0.6 }
              }
              className={cn(
                "relative flex flex-col items-center justify-center overflow-visible p-8 backdrop-blur-xl border-2 shadow-2xl transition-colors mx-auto",
                "duration-1000",
                rarityTheme.bg,
                rarityTheme.border,
                completionStage > 0 ? "w-[240px] h-[80px] !p-0" : "w-full min-h-[400px]"
              )}
            >
              
              {completionStage === 2 && (
                <>
                  <motion.div
                    initial={{ scale: 0.2, opacity: 1, borderWidth: "20px" }}
                    animate={{ scale: 3, opacity: 0, borderWidth: "0px" }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="absolute rounded-full z-0 pointer-events-none"
                    style={{ borderColor: challenge.color || "#ffffff", borderStyle: "solid", width: "150px", height: "150px" }}
                  />

                  <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={`dot-${i}`}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{
                          scale: [0, 1.5, 0],
                          opacity: [1, 1, 0],
                          x: Math.cos((i * 30 * Math.PI) / 180) * 300,
                          y: Math.sin((i * 30 * Math.PI) / 180) * 300,
                        }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute w-4 h-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,1)]"
                        style={{ backgroundColor: challenge.color || "#fff" }}
                      />
                    ))}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`streak-${i}`}
                        initial={{ scaleX: 0, x: 0, y: 0, opacity: 1, rotate: i * 45 }}
                        animate={{
                          scaleX: [0, 4, 0],
                          opacity: [1, 1, 0],
                          x: Math.cos((i * 45 * Math.PI) / 180) * 400,
                          y: Math.sin((i * 45 * Math.PI) / 180) * 400,
                        }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="absolute w-8 h-1 rounded-full origin-left shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                        style={{ backgroundColor: "#ffffff" }}
                      />
                    ))}
                  </div>
                </>
              )}

              <motion.div 
                animate={completionStage > 0 ? { opacity: 0, scale: 0.5, display: "none" } : { opacity: 1, scale: 1, display: "block" }}
                transition={{ duration: 0.5 }}
                className="w-full text-center space-y-6 relative z-10"
              >
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className={cn("px-3 py-1 rounded-full bg-black/40", rarityTheme.text)}>
                    {challenge.rarity}
                  </span>
                  <span className="text-slate-400">{challenge.category}</span>
                </div>

                <div className="text-6xl drop-shadow-2xl pt-2">{challenge.emoji}</div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white">{challenge.title}</h2>
                  <p className="text-slate-300 mt-2 text-sm leading-relaxed">{challenge.description}</p>
                </div>

                <div className={cn("text-6xl font-mono font-black tabular-nums tracking-widest py-6", rarityTheme.text)}>
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => setRunning(!running)} className="rounded-full w-14 h-14 bg-white/10 hover:bg-white/20 border-white/5">
                    {running ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
                  </Button>
                  <Button variant="outline" onClick={() => { setRemaining(challenge.minutes * 60); setRunning(false); }} className="rounded-full w-14 h-14 bg-black/40 border-white/10 hover:bg-white/10 text-white">
                    <RotateCcw size={20} />
                  </Button>
                  <Button variant="ghost" onClick={generate} className="rounded-full w-14 h-14 text-slate-400 hover:text-white hover:bg-white/10">
                    <SkipForward size={20} />
                  </Button>
                </div>

                <Button 
                  onClick={complete}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-lg text-black transition-all shadow-xl active:scale-95", 
                    rarityTheme ? rarityTheme.bg.replace('/10', '/90') : "bg-white/90"
                  )}
                  style={{ backgroundColor: challenge.color }}
                >
                  <span className="flex items-center"><CheckCircle2 className="mr-2 h-5 w-5" /> COMPLETE (+{challenge.xp} XP)</span>
                </Button>
              </motion.div>

              {completionStage > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 flex items-center justify-center font-black text-3xl tracking-tighter"
                  style={{ color: challenge.color || "#ffffff", textShadow: "0px 0px 20px rgba(255,255,255,0.5)" }}
                >
                  +{challenge.xp} XP
                </motion.div>
              )}

            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}                                                                }
