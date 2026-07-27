import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
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

  // 2. 3D Parallax Tilt Physics Setup
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

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

  return (
    <motion.div
      style={
        completionStage === 0
          ? { rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }
          : {}
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full max-w-md mx-auto flex justify-center perspective-[1000px] group z-10 relative"
    >
      <motion.div
        key="active"
        // 3. Levitation & Entrance Physics
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={
          completionStage === 1
            ? {
                scale: 0.8, 
                y: 0,
                rotateZ: [0, -3, 3, -3, 3, 0], 
                filter: "brightness(1.5)", 
              }
            : completionStage === 2
            ? {
                scale: [0.8, 1.2, 0], 
                y: [0, -20, -1000], 
                opacity: [1, 1, 0],
                filter: "brightness(2)",
              }
            : {
                opacity: 1,
                scale: 1,
                y: [-5, 5, -5], // Continuous Levitation
              }
        }
        transition={
          completionStage === 1
            ? { duration: 1.2, ease: "easeInOut" }
            : completionStage === 2
            ? { duration: 0.8, ease: "easeIn" }
            : { 
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                default: { type: "spring", stiffness: 200, damping: 20 }
              }
        }
        className={cn(
          "relative flex flex-col items-center justify-center transition-all",
          completionStage > 0 ? "w-[240px] h-[80px]" : "w-full min-h-[440px]"
        )}
      >
        {/* Layer 1: Massive Ambient Glow Background */}
        {completionStage === 0 && (
          <div 
            className="absolute inset-0 -z-10 blur-[80px] opacity-40 rounded-full scale-110"
            style={{ backgroundColor: primaryColor }}
          />
        )}

        {/* Layer 2: Deep Glassmorphism Card */}
        <div 
           className={cn(
             "absolute inset-0 transition-all duration-500 overflow-hidden", 
             "bg-zinc-950/60 backdrop-blur-3xl",
             "border-t border-l border-white/20 border-r border-b border-white/5", // 3D glassy border
             completionStage > 0 ? "rounded-full" : "rounded-[2.5rem]",
             completionStage === 0 && `shadow-[0_20px_60px_-15px_${primaryColor}60]` // Inner shadow
           )}
        >
          {/* Subtle top-down inner gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
        </div>

        {/* Layer 3: Explosion Particles */}
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
          style={completionStage === 0 ? { transform: "translateZ(60px)" } : {}} 
          className={cn("w-full flex flex-col items-center text-center relative z-10", completionStage === 0 ? "p-8" : "p-0")}
        >
          {/* Header Tags */}
          <div className="flex justify-between items-center w-full px-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
            <span 
              className="px-4 py-1.5 rounded-full border shadow-lg"
              style={{ 
                color: primaryColor, 
                backgroundColor: `${primaryColor}15`,
                borderColor: `${primaryColor}40`,
                textShadow: `0 0 10px ${primaryColor}`
              }}
            >
              {challenge.rarity}
            </span>
            <span className="text-zinc-500">{challenge.category}</span>
          </div>

          {/* Holographic Emoji */}
          <div className="relative mt-8 mb-4">
            <div className="absolute inset-0 blur-[30px] opacity-50 scale-150 rounded-full" style={{ backgroundColor: primaryColor }} />
            <motion.div 
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl sm:text-8xl drop-shadow-2xl relative z-10"
            >
              {challenge.emoji}
            </motion.div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">{challenge.title}</h2>
          <p className="text-zinc-400 mt-3 text-sm leading-relaxed max-w-[280px]">{challenge.description}</p>

          {/* Heavy Glowing Timer */}
          <motion.div 
            animate={running ? { scale: [1, 1.03, 1], filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-full my-8 bg-black/20 rounded-3xl py-4 border border-white/5 shadow-inner"
          >
            <div 
              className="text-6xl sm:text-7xl font-mono font-black tabular-nums tracking-widest"
              style={{ 
                color: primaryColor,
                textShadow: `0 0 20px ${primaryColor}80, 0 0 60px ${primaryColor}60` 
              }}
            >
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
          </motion.div>

          {/* Tactile Controls */}
          <div className="flex gap-4 justify-center items-center w-full mb-6">
            <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }}>
              <Button 
                variant="outline" 
                onClick={() => { setRemaining(durationFallback * 60); setRunning(false); }} 
                className="rounded-2xl w-14 h-14 bg-black/40 border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <RotateCcw size={22} />
              </Button>
            </motion.div>
            
            <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }}>
              <Button 
                onClick={() => setRunning(!running)} 
                className="rounded-2xl w-20 h-20 shadow-2xl border border-white/20 transition-all relative overflow-hidden group"
                style={{ backgroundColor: running ? '#ef4444' : primaryColor }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {running ? <Pause size={32} className="text-white relative z-10" /> : <Play size={32} className="text-white ml-1 relative z-10" />}
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.05 }}>
              <Button 
                variant="ghost" 
                onClick={generate} 
                className="rounded-2xl w-14 h-14 text-zinc-500 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/5"
              >
                <SkipForward size={22} />
              </Button>
            </motion.div>
          </div>

          {/* Premium Complete Button with Sweeping Glare */}
          <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} className="w-full">
            <Button 
              onClick={complete}
              className="relative w-full h-16 rounded-2xl font-black text-lg overflow-hidden group border-t border-l border-white/30 border-b border-r border-black/50 shadow-2xl transition-all"
              style={{ 
                backgroundColor: primaryColor,
                boxShadow: `0 10px 30px -10px ${primaryColor}` 
              }}
            >
              {/* Cinematic Sweeping Glare Animation */}
              <motion.div
                animate={{ x: ["-200%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-0"
              />
              
              <span className="relative flex items-center text-white drop-shadow-md z-10 tracking-widest">
                <CheckCircle2 className="mr-3 h-6 w-6" /> 
                COMPLETE (+{xpValue} XP)
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* 5. Slot Machine Roll Up */}
        {completionStage > 0 && <XPCounter xp={xpValue} color={primaryColor} />}
      </motion.div>
    </motion.div>
  );
}
