import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { CheckCircle2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChallengeStyles } from "@/lib/challenges.styles";
import { type OutstandChallenge } from "@/lib/challenges.types";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  challenge: OutstandChallenge;
  completionStage: 0 | 1 | 2;
  running: boolean;
  mins: number;
  secs: number;
  setRunning: (running: boolean) => void;
  setRemaining: (remaining: number) => void;
  generate: () => void;
  complete: () => void;
}

// 1. Rolling Number Component for the Dopamine Hit
function XPCounter({ xp, color }: { xp: number; color?: string }) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, xp, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate(value) {
          node.textContent = `+${Math.floor(value)} XP`;
        },
      });
      return () => controls.stop();
    }
  }, [xp]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
      className="absolute inset-0 flex items-center justify-center font-black text-6xl tracking-tighter z-50 drop-shadow-2xl"
      style={{ color: color || "#ffffff", textShadow: `0px 0px 40px ${color || '#ffffff'}` }}
      ref={nodeRef}
    />
  );
}

export function ChallengeCard({
  challenge,
  completionStage,
  running,
  mins,
  secs,
  setRunning,
  setRemaining,
  generate,
  complete,
}: ChallengeCardProps) {
  const styles = getChallengeStyles(challenge);
  const primaryColor = styles.particleColors[0] || "#6366f1"; // Fallback to Indigo
  
  // Safe XP fallback in case of schema mismatches
  const xpValue = (challenge as any).xp || challenge.xpReward || 50;
  const durationFallback = (challenge as any).durationMinutes || 10;

  // 2. 3D Parallax Tilt Physics Setup (Slightly dampened for a heavier, premium feel)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 25 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (completionStage !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Safe time formatting to prevent layout overflow on 60+ min challenges
  const formatTime = () => {
    const totalMinutes = typeof mins === "number" ? mins : parseInt(mins) || 0;
    const hours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;
    
    const hStr = hours > 0 ? `${hours}:` : "";
    const mStr = hours > 0 ? remainingMins.toString().padStart(2, "0") : remainingMins.toString().padStart(2, "0");
    const sStr = secs.toString().padStart(2, "0");

    return `${hStr}${mStr}:${sStr}`;
  };

  return (
    <motion.div
      style={
        completionStage === 0
          ? { rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }
          : {}
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full max-w-md mx-auto flex justify-center group z-10 relative"
    >
      <motion.div
        key="active"
        // 3. Levitation & Entrance Physics
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={
          completionStage === 1
            ? {
                scale: 0.8, 
                y: 0,
                rotateZ: [0, -2, 2, -2, 2, 0], 
                filter: "brightness(1.5)", 
              }
            : completionStage === 2
            ? {
                scale: [0.8, 1.1, 0], 
                y: [0, -20, -800], 
                opacity: [1, 1, 0],
                filter: "brightness(2)",
              }
            : {
                opacity: 1,
                scale: 1,
                y: [-3, 3, -3], // Smooth subtle levitation
              }
        }
        transition={
          completionStage === 1
            ? { duration: 1.2, ease: "easeInOut" }
            : completionStage === 2
            ? { duration: 0.8, ease: "easeIn" }
            : { 
                y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                default: { type: "spring", stiffness: 200, damping: 25 }
              }
        }
        className={cn(
          "relative flex flex-col items-center justify-center transition-all",
          completionStage > 0 ? "w-[240px] h-[80px]" : "w-full min-h-[440px]"
        )}
      >
        {/* Layer 1: Atmospheric Background Spot */}
        {completionStage === 0 && (
          <div 
            className="absolute inset-0 -z-10 blur-[100px] opacity-30 rounded-[3rem] scale-105 pointer-events-none"
            style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${primaryColor}, transparent 70%)` }}
          />
        )}

        {/* Layer 2: Deep Glassmorphism Card (Refined Borders) */}
        <div 
           className={cn(
             "absolute inset-0 transition-all duration-500 overflow-hidden", 
             "bg-zinc-900/40 backdrop-blur-2xl",
             "border border-white/10", 
             completionStage > 0 ? "rounded-full" : "rounded-[2.5rem]",
             completionStage === 0 && `shadow-2xl`
           )}
        >
          {/* Subtle top-down inner highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Layer 3: Explosion Particles (Unchanged, excellent effect) */}
        {completionStage === 2 && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 1, borderWidth: "40px" }}
              animate={{ scale: 4, opacity: 0, borderWidth: "0px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute rounded-full"
              style={{ borderColor: primaryColor, borderStyle: "solid", width: "150px", height: "150px" }}
            />
            {[...Array(20)].map((_, i) => {
              const sparkColor = styles.particleColors[i % styles.particleColors.length];
              return (
                <motion.div
                  key={`spark-${i}`}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, Math.random() * 2 + 1, 0],
                    opacity: [1, 1, 0],
                    x: Math.cos((i * 18 * Math.PI) / 180) * (Math.random() * 400 + 200),
                    y: Math.sin((i * 18 * Math.PI) / 180) * (Math.random() * 400 + 200),
                  }}
                  transition={{ duration: 1 + Math.random() * 0.5, ease: "easeOut" }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{ backgroundColor: sparkColor, boxShadow: `0 0 20px ${sparkColor}` }}
                />
              );
            })}
          </div>
        )}

        {/* Layer 4: The Content (Pushed out in 3D) */}
        <motion.div
          animate={completionStage > 0 ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
          style={completionStage === 0 ? { transform: "translateZ(50px)" } : {}} 
          className={cn("w-full flex flex-col items-center text-center relative z-10", completionStage === 0 ? "p-8" : "p-0")}
        >
          {/* Header Tags */}
          <div className="flex justify-between items-center w-full px-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-4">
            <span 
              className="px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-md"
              style={{ 
                color: primaryColor, 
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`,
              }}
            >
              {challenge.rarity}
            </span>
            <span className="text-zinc-500">{challenge.category}</span>
          </div>

          {/* Holographic Emoji */}
          <div className="relative mt-2 mb-4">
            <div className="absolute inset-0 blur-[40px] opacity-30 scale-150 rounded-full" style={{ backgroundColor: primaryColor }} />
            <motion.div 
              className="text-7xl sm:text-8xl drop-shadow-2xl relative z-10"
            >
              {challenge.emoji}
            </motion.div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">{challenge.title}</h2>
          <p className="text-zinc-400 mt-3 text-sm font-medium leading-relaxed max-w-[280px]">{challenge.description}</p>

          {/* Clean, Minimal Timer track */}
          <div className="flex justify-center w-full my-8">
            <div className="relative group">
              <div 
                className="absolute inset-0 blur-2xl opacity-10 transition-opacity duration-1000" 
                style={{ backgroundColor: running ? primaryColor : 'transparent' }} 
              />
              <div className="relative px-8 py-3 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-md">
                <span className="font-mono text-5xl sm:text-6xl font-light text-white tracking-tighter tabular-nums drop-shadow-md">
                  {formatTime()}
                </span>
              </div>
            </div>
          </div>

          {/* Tactile Controls (Now perfectly round and sleek) */}
          <div className="flex gap-6 justify-center items-center w-full mb-8">
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button 
                variant="ghost" 
                onClick={() => { setRemaining(durationFallback * 60); setRunning(false); }} 
                className="rounded-full w-12 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <RotateCcw size={18} />
              </Button>
            </motion.div>
            
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button 
                onClick={() => setRunning(!running)} 
                className="rounded-full w-20 h-20 shadow-xl border backdrop-blur-md transition-all relative overflow-hidden flex items-center justify-center"
                style={{ 
                  backgroundColor: running ? 'rgba(255,255,255,0.1)' : `${primaryColor}20`,
                  borderColor: running ? 'rgba(255,255,255,0.2)' : `${primaryColor}50`,
                  color: running ? '#ffffff' : primaryColor
                }}
              >
                {running ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
              <Button 
                variant="ghost" 
                onClick={generate} 
                className="rounded-full w-12 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <SkipForward size={18} />
              </Button>
            </motion.div>
          </div>

          {/* High Contrast Apple-Style Complete Button */}
          <motion.div whileTap={{ scale: 0.98 }} className="w-full">
            <Button 
              onClick={complete}
              disabled={mins > 0 || secs > 0}
              className="relative w-full h-14 rounded-full font-bold text-sm uppercase tracking-[0.15em] overflow-hidden group transition-all bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:bg-white/10 disabled:text-zinc-500 shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:shadow-none"
            >
              <span className="relative flex items-center justify-center z-10 w-full">
                <CheckCircle2 className="mr-2 h-5 w-5" /> 
                Complete 
                <span className="text-zinc-500 font-medium ml-1">
                  (+{xpValue} XP)
                </span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
            </Button>
          </motion.div>
        </motion.div>

        {/* 5. Slot Machine Roll Up */}
        {completionStage > 0 && <XPCounter xp={xpValue} color={primaryColor} />}
      </motion.div>
    </motion.div>
  );
              }
          
