import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { CHALLENGES, randomChallenge, type OutstandChallenge } from "@/lib/Index";

export function useOutstand() {
  const { recordOutstand } = useAppState();
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
        
        // BUG FIXED: Migrated from next.minutes to next.durationMinutes
        // Providing a fallback of 10 minutes (600 seconds) just in case a malformed challenge slips through
        const duration = next.durationMinutes ? next.durationMinutes * 60 : 600;
        setRemaining(duration);
        
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
    
    const xpEarned = challenge.xpReward || 50; // Fallback added for safety
    const challengeEmoji = challenge.emoji;
    
    // Safely mapping the old color schema to the new dynamic themes if required
    // Defaulting to the Outstand Indigo hex if the color prop is missing
    const challengeColor = challenge.theme?.particleColors?.[0] || '#4f46e5'; 
    
    setRunning(false);
    setCompletionStage(1); 
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 100, 30, 80, 50, 50, 100]); 
    }
    
    setTimeout(() => {
      setCompletionStage(2);
    }, 1500);

    setTimeout(() => {
      recordOutstand(challenge.title, xpEarned);
      addPositive("outstand");
      
      toast.custom((t) => (
        <div 
          className="relative overflow-hidden w-full max-w-[360px] mx-auto rounded-2xl border border-white/10 bg-slate-950 p-4 flex items-center gap-4"
          style={{ boxShadow: `0 20px 40px -10px ${challengeColor}60` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center text-3xl bg-black/50 rounded-xl border border-white/10 shadow-inner z-10">
            {challengeEmoji}
          </div>
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

  return {
    challenge,
    remaining,
    running,
    setRunning,
    setRemaining,
    isShuffling,
    shuffleDisplay,
    completionStage,
    generate,
    complete,
    mins: Math.floor(remaining / 60),
    secs: remaining % 60,
  };
                }
