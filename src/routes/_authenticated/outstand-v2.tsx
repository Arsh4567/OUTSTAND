import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Sparkles, Zap, CheckCircle2, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { randomChallenge, type OutstandChallenge } from "@/lib/challenges";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/outstand-v2")({
  component: OutstandV2,
});

function OutstandV2() {
  const [challenge, setChallenge] = useState<OutstandChallenge | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(600); // 10 minutes in seconds
  const intervalRef = useRef<number | null>(null);

  // Timer Logic
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          toast.success("Time's up!", { description: "Mark it complete!" });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const generate = () => {
    const next = randomChallenge(challenge?.title);
    setPortalOpen(true);

    // Wait for the portal animation to peak, then load the challenge
    setTimeout(() => {
      setChallenge(next);
      setRemaining(next.minutes * 60);
      setRunning(false);
    }, 1500);

    // Close portal
    setTimeout(() => {
      setPortalOpen(false);
    }, 2600);
  };

  const complete = () => {
    toast.success("Outstanding.", {
      description: `Mission accomplished: ${challenge?.title}`,
    });
    setChallenge(null);
    setRunning(false);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Optimized Animated Background */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 3, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at center,#2563eb55,transparent 65%)" }}
      />
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        
        <AnimatePresence mode="wait">
          {!challenge ? (
            <motion.div 
              key="generator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-300">
                  <Sparkles size={16} />
                  OUTSTAND V2
                </div>
                <h1 className="mt-6 text-6xl font-black text-white">Outstand</h1>
                <p className="mt-4 max-w-lg text-slate-400">
                  One button. One mission. Ten minutes. Become better.
                </p>
              </div>

              <Button
                onClick={generate}
                className="h-24 w-72 rounded-full bg-blue-600 text-2xl hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)]"
              >
                <Zap className="mr-3" />
                Generate Mission
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="mission"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                  {challenge.category}
                </span>
                <span className="text-yellow-400 font-bold text-sm">⭐ {challenge.xp} XP</span>
              </div>

              <div className="mt-6 text-center">
                <span className="text-6xl drop-shadow-lg">{challenge.emoji}</span>
                <h2 className="mt-4 text-2xl font-bold text-white">{challenge.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{challenge.description}</p>
              </div>

              {/* Timer Display */}
              <div className="mt-8 flex justify-center">
                <div className={`flex h-32 w-32 items-center justify-center rounded-full border-4 ${running ? 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'border-slate-700'}`}>
                  <span className="text-3xl font-mono text-white font-bold">
                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-8 flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-500" 
                    onClick={() => setRunning(!running)}
                  >
                    {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {running ? "Pause" : "Start"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => { setRemaining(challenge.minutes * 60); setRunning(false); }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" 
                  onClick={complete}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Complete
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-500 hover:text-slate-300"
                  onClick={() => setChallenge(null)}
                >
                  Cancel Mission
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <MissionReveal open={portalOpen} color={challenge?.color ?? "#3b82f6"} />
      </div>
    </div>
  );
}
