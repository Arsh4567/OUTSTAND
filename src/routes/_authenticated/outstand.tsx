import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHALLENGES, randomChallenge, type OutstandChallenge } from "@/lib/challenges";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/outstand")({
  head: () => ({
    meta: [
      { title: "Outstand — 10 minute self-improvement challenge" },
      { name: "description", content: "Get a random 10-minute self-improvement challenge and outstand today." },
      { property: "og:title", content: "Outstand — 10 minute challenge" },
      { property: "og:description", content: "One button. Ten minutes. A better you." },
    ],
  }),
  component: OutstandPage,
});

// Animation variants for the staggered text reveal
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

function OutstandPage() {
  const { outstand, recordOutstand } = useAppState();
  const { addPositive } = useDailyLog();
  const [challenge, setChallenge] = useState<OutstandChallenge | null>(null);
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  const [bg, setBg] = useState("linear-gradient(135deg,#0f172a,#111827)");
  const intervalRef = useRef<number | null>(null);

  const generate = () => {
    const next = randomChallenge(challenge?.title);

    setChallenge(next);
    setRemaining(next.minutes * 60);
    setRunning(false);

    switch (next.theme) {
      case "Ocean": setBg("linear-gradient(135deg,#0ea5e9,#1e3a8a)"); break;
      case "Galaxy": setBg("linear-gradient(135deg,#6d28d9,#312e81)"); break;
      case "Forest": setBg("linear-gradient(135deg,#15803d,#14532d)"); break;
      case "Sunset": setBg("linear-gradient(135deg,#f97316,#b91c1c)"); break;
      case "Ice": setBg("linear-gradient(135deg,#38bdf8,#0f172a)"); break;
      case "Volcano": setBg("linear-gradient(135deg,#dc2626,#7f1d1d)"); break;
      case "Royal": setBg("linear-gradient(135deg,#7c3aed,#facc15)"); break;
      case "Neon": setBg("linear-gradient(135deg,#22d3ee,#a855f7)"); break;
      default: setBg("linear-gradient(135deg,#0f172a,#111827)"); break;
    }
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          toast.success("Time's up!", { description: "Mark it complete to lock in your XP." });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const complete = () => {
    if (!challenge) return;

    recordOutstand(challenge.title);
    addPositive("outstand");

    toast.success("Outstanding.", {
      description: `+15 dopamine · +${challenge.xp} XP · ${challenge.title}`,
    });

    setChallenge(null);
    setRemaining(600);
    setRunning(false);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // SVG Ring calculation
  const totalTime = challenge ? challenge.minutes * 60 : 600;
  const progress = totalTime > 0 ? remaining / totalTime : 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <motion.div className="relative min-h-screen overflow-hidden rounded-3xl p-6">
      {/* Animated Background */}
      <motion.div
        key={bg}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="absolute inset-0 -z-10"
        style={{ background: bg, filter: "blur(35px)" }}
      />

      {/* Glow Layer */}
      <motion.div
        animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 -z-10"
        style={{ background: bg, mixBlendMode: "screen", filter: "blur(120px)" }}
      />

      <div className="space-y-10">
        <div className="text-center">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            One button. Ten minutes. A better you.
          </motion.div>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            <span className="gradient-text">Outstand</span> today.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Feeling stuck? Tap the button. You'll get a random, doable 10-minute challenge to shake off the drift and reclaim momentum.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!challenge ? (
            <motion.div
              key="generator"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mx-auto grid max-w-2xl place-items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generate}
                className="btn-outstand pulse-ring group relative grid h-56 w-56 place-items-center rounded-full font-display text-xl font-bold md:h-64 md:w-64 md:text-2xl"
              >
                <div className="text-center">
                  <Zap className="mx-auto mb-2 h-8 w-8" />
                  Give me a<br />challenge
                </div>
              </motion.button>
              <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
                {CHALLENGES.length} unique challenges · always 10 minutes
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="challenge"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card mx-auto max-w-3xl overflow-hidden p-6 md:p-10"
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="min-w-0 flex-1">
                  <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold shadow-sm"
                      style={{
                        background: challenge.color,
                        color: challenge.rarity === "Common" ? "#000" : "#fff",
                      }}
                    >
                      {challenge.rarity}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      {challenge.category}
                    </span>
                  </motion.div>

                  <motion.div variants={itemVariants} className="mt-3 text-xs font-semibold tracking-widest text-muted-foreground">
                    Mission #{challenge.id.toString().padStart(3, "0")}
                  </motion.div>

                  <motion.h2 variants={itemVariants} className="mt-2 flex items-center gap-3 font-display text-2xl font-bold md:text-3xl">
                    <motion.span 
                      initial={{ rotate: -20, scale: 0.5 }} 
                      animate={{ rotate: 0, scale: 1 }} 
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="text-3xl drop-shadow-md"
                    >
                      {challenge.emoji}
                    </motion.span>
                    <span>{challenge.title}</span>
                  </motion.h2>

                  <motion.p variants={itemVariants} className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {challenge.description}
                  </motion.p>

                  <motion.div variants={itemVariants} className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-600/20 border border-blue-500/30 px-3 py-1 text-sm font-medium">
                      🎯 {challenge.difficulty}
                    </span>
                    <span className="rounded-full bg-purple-600/20 border border-purple-500/30 px-3 py-1 text-sm font-medium">
                      🌍 {challenge.theme}
                    </span>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="w-full md:w-auto shrink-0 rounded-2xl border border-border/60 bg-secondary/30 backdrop-blur-sm px-6 py-4 text-center space-y-2 shadow-lg">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Duration
                    </div>
                    <div className="font-display text-2xl font-bold tracking-tight">
                      {challenge.minutes} min
                    </div>
                  </div>
                  <div className="h-px w-full bg-border/50 my-2" />
                  <div className="font-bold text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">
                    ⭐ {challenge.xp} XP
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center gap-6">
                
                {/* Animated SVG Timer Ring */}
                <div className="relative grid h-48 w-48 place-items-center">
                  <svg className="absolute inset-0 h-full w-full -rotate-90 transform drop-shadow-lg">
                    {/* Background Track */}
                    <circle 
                      cx="96" cy="96" r={radius} 
                      stroke="currentColor" strokeWidth="6" fill="transparent" 
                      className="text-secondary/50" 
                    />
                    {/* Active Progress */}
                    <motion.circle
                      cx="96" cy="96" r={radius}
                      stroke="currentColor" strokeWidth="6" fill="transparent"
                      strokeLinecap="round"
                      className={cn("transition-colors duration-300", running ? "text-primary" : "text-primary/50")}
                      style={{ strokeDasharray: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <div className="text-center absolute z-10">
                    <div className="font-mono text-4xl font-bold tracking-tighter">
                      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">remaining</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button className="btn-primary gap-2 shadow-lg" onClick={() => setRunning((r) => !r)}>
                      {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start timer</>}
                    </Button>
                  </motion.div>

                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button variant="secondary" className="gap-2" onClick={() => { setRemaining(challenge.minutes * 60); setRunning(false); }}>
                      <RotateCcw className="h-4 w-4" /> Reset
                    </Button>
                  </motion.div>
                  
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" onClick={generate}>Skip · new one</Button>
                  </motion.div>

                  <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
                    <Button className="gap-2 bg-success text-success-foreground hover:bg-success/90 shadow-lg shadow-success/20" onClick={complete}>
                      <CheckCircle2 className="h-4 w-4" /> Mark complete
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-card p-6">
          <h3 className="font-display text-lg font-semibold">Recently outstood</h3>
          {outstand.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No completed challenges yet. Your first one is one tap away.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border/50">
              {outstand.slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {o.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.completedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
              }
                      
