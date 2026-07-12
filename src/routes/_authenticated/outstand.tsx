import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Pause, Play, RotateCcw, Sparkles, Zap, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHALLENGES, randomChallenge, type OutstandChallenge } from "@/lib/challenges";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/outstand")({
  component: OutstandPage,
});

function OutstandPage() {
  const { outstand, recordOutstand } = useAppState();
  const { addPositive } = useDailyLog();
  const [challenge, setChallenge] = useState<OutstandChallenge | null>(null);
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const generate = () => {
    const next = randomChallenge(challenge?.title);
    setChallenge(next);
    setRemaining(next.minutes * 60);
    setRunning(false);
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          toast.success("Time's up! Mission complete.");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [running]);

  const complete = () => {
    if (!challenge) return;
    recordOutstand(challenge.title);
    addPositive("outstand");
    toast.success("Mission Accomplished", { description: `+${challenge.xp} XP added to your baseline.` });
    setChallenge(null);
    setRunning(false);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-slate-950 -z-10" />
      <motion.div 
        className="absolute inset-0 opacity-20"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ backgroundImage: "radial-gradient(circle at center, #4f46e5, transparent 70%)" }}
      />

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {!challenge ? (
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
                className="h-20 w-20 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all hover:scale-105"
              >
                <Zap className="h-8 w-8 text-white" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl"
            >
              <div className="text-center space-y-6">
                <div className="text-6xl">{challenge.emoji}</div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{challenge.title}</h2>
                  <p className="text-slate-400 mt-2 text-sm">{challenge.description}</p>
                </div>

                <div className="text-5xl font-mono font-bold text-white tabular-nums tracking-widest py-4">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>

                <div className="flex gap-2 justify-center">
                  <Button variant="secondary" onClick={() => setRunning(!running)} className="rounded-full w-12 h-12">
                    {running ? <Pause size={20} /> : <Play size={20} />}
                  </Button>
                  <Button variant="outline" onClick={() => setRemaining(challenge.minutes * 60)} className="rounded-full w-12 h-12">
                    <RotateCcw size={20} />
                  </Button>
                  <Button variant="ghost" onClick={generate} className="rounded-full w-12 h-12">
                    <SkipForward size={20} />
                  </Button>
                </div>

                <Button onClick={complete} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Complete
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
