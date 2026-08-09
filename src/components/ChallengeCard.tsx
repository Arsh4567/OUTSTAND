import { useEffect, useRef, useMemo } from "react";
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
  mins: number | string;
  secs: number | string;
  setRunning: (running: boolean) => void;
  setRemaining: (remaining: number) => void;
  generate: () => void;
  complete: () => void;
}

// --- 1. Rolling Number Component for the Dopamine Hit ---
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
      className="absolute inset-0 flex items-center justify-center font-black text-6xl md:text-8xl tracking-tighter z-50 drop-shadow-2xl pointer-events-none"
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
  const primaryColor = styles.particleColors[0] || "#6366f1";
  
  const xpValue = (challenge as any).xp || challenge.xpReward || 50;
  const durationFallback = challenge.duration_minutes || (challenge as any).durationMinutes || 10;
  
  const totalMinsInt = typeof mins === "number" ? mins : parseInt(mins as string) || 0;
  const secsInt = typeof secs === "number" ? secs : parseInt(secs as string) || 0;

  // --- 2. PER-SECOND FLUID COLOR CALCULATION ---
  const totalSecondsRemaining = totalMinsInt * 60 + secsInt;
  const maxSeconds = durationFallback * 60;
  
  const timerColor = useMemo(() => {
    // Calculates a hue between 220 (Neon Blue) and 0 (Bright Red) dynamically every second
    const hue = Math.max(0, Math.min(220, (totalSecondsRemaining / maxSeconds) * 220));
    return `hsl(${hue}, 100%, 60%)`;
  }, [totalSecondsRemaining, maxSeconds]);

  const isUrgent = totalSecondsRemaining > 0 && totalSecondsRemaining <= 60;
  const isFinished = totalSecondsRemaining === 0;

  // --- 3. 3D PARALLAX TILT PHYSICS ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

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

  const formatTime = () => {
    const hours = Math.floor(totalMinsInt / 60);
    const remainingMins = totalMinsInt % 60;
    const hStr = hours > 0 ? `${hours}:` : "";
    const mStr = hours > 0 ? remainingMins.toString().padStart(2, "0") : remainingMins.toString().padStart(2, "0");
    const sStr = secsInt.toString().padStart(2, "0");
    return `${hStr}${mStr}:${sStr}`;
  };

  return (
    <motion.div
      style={
        completionStage === 0
          ? { rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1500 }
          : {}
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex justify-center group z-10 relative"
    >
      <motion.div
        key="active"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={
          completionStage === 1
            ? { scale: 0.8, y: 0, rotateZ: [0, -2, 2, -2, 2, 0], filter: "brightness(1.5)" }
            : completionStage === 2
            ? { scale: [0.8, 1.1, 0], y: [0, -20, -800], opacity: [1, 1, 0], filter: "brightness(2)" }
            : { opacity: 1, scale: 1, y: [-3, 3, -3] }
        }
        transition={
          completionStage === 1 ? { duration: 1.2, ease: "easeInOut" }
          : completionStage === 2 ? { duration: 0.8, ease: "easeIn" }
          : { y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, default: { type: "spring", stiffness: 200, damping: 25 } }
        }
        className={cn(
          "relative flex flex-col items-center justify-center transition-all",
          completionStage > 0 ? "w-[240px] h-[80px] md:w-[320px] md:h-[100px]" : "w-full min-h-[440px] md:min-h-[560px] lg:min-h-[640px]"
        )}
      >
        {/* Layer 1: Atmospheric Background Spot */}
        {completionStage === 0 && (
          <div 
            className="absolute inset-0 -z-10 blur-[100px] md:blur-[140px] opacity-30 rounded-[3rem] scale-105 pointer-events-none transition-all duration-1000"
            style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${timerColor}, transparent 70%)` }}
          />
        )}

        {/* Layer 2: Deep Glassmorphism Card */}
        <div 
           className={cn(
             "absolute inset-0 transition-all duration-500 overflow-hidden", 
             "bg-[#0a0f1a]/80 backdrop-blur-3xl",
             "border border-white/10", 
             completionStage > 0 ? "rounded-full" : "rounded-[2.5rem] lg:rounded-[3.5rem]",
             completionStage === 0 && `shadow-[0_40px_80px_rgba(0,0,0,0.6)]`
           )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Layer 3: Explosion Particles (Unchanged) */}
        {completionStage === 2 && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 1, borderWidth: "40px" }}
              animate={{ scale: 6, opacity: 0, borderWidth: "0px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute rounded-full"
              style={{ borderColor: timerColor, borderStyle: "solid", width: "150px", height: "150px" }}
            />
            {[...Array(20)].map((_, i) => {
              const sparkColor = styles.particleColors[i % styles.particleColors.length];
              return (
                <motion.div
                  key={`spark-${i}`}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, Math.random() * 2 + 1.5, 0], opacity: [1, 1, 0],
                    x: Math.cos((i * 18 * Math.PI) / 180) * (Math.random() * 600 + 300),
                    y: Math.sin((i * 18 * Math.PI) / 180) * (Math.random() * 600 + 300),
                  }}
                  transition={{ duration: 1 + Math.random() * 0.5, ease: "easeOut" }}
                  className="absolute w-4 h-4 rounded-full"
                  style={{ backgroundColor: sparkColor, boxShadow: `0 0 30px ${sparkColor}` }}
                />
              );
            })}
          </div>
        )}

        {/* Layer 4: The Content */}
        <motion.div
          animate={completionStage > 0 ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
          style={completionStage === 0 ? { transform: "translateZ(60px)" } : {}} 
          className={cn("w-full flex flex-col items-center text-center relative z-10", completionStage === 0 ? "p-8 md:p-12 lg:p-16" : "p-0")}
        >
          {/* Header Tags */}
          <div className="flex justify-between items-center w-full px-2 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-4 md:mb-8">
            <motion.span 
              animate={{ color: timerColor, backgroundColor: `${timerColor}15`, borderColor: `${timerColor}40` }}
              className="px-4 py-1.5 md:px-5 md:py-2 rounded-full border shadow-lg backdrop-blur-md transition-colors duration-1000"
            >
              {challenge.rarity}
            </motion.span>
            <span className="text-zinc-500">{challenge.category}</span>
          </div>

          <div className="relative mt-2 mb-4 md:mb-6">
            <motion.div animate={{ backgroundColor: timerColor }} className="absolute inset-0 blur-[40px] md:blur-[60px] opacity-20 scale-150 rounded-full transition-colors duration-1000" />
            <div className="text-7xl sm:text-8xl md:text-[120px] lg:text-[140px] drop-shadow-2xl relative z-10">{challenge.emoji}</div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mt-2">{challenge.title}</h2>
          <p className="text-zinc-400 mt-3 md:mt-5 text-sm md:text-base lg:text-lg font-medium leading-relaxed max-w-[280px] md:max-w-md lg:max-w-xl">{challenge.description}</p>

          {/* DYNAMIC COLOR SHIFTING TIMER */}
          <div className="flex justify-center w-full my-8 md:my-12">
            <div className="relative group">
              <motion.div 
                className="absolute inset-0 blur-2xl md:blur-3xl opacity-20 transition-colors duration-1000" 
                animate={{ backgroundColor: running ? timerColor : 'transparent' }} 
              />
              <div className="relative px-8 py-3 md:px-12 md:py-5 bg-white/[0.02] border border-white/5 rounded-3xl md:rounded-[2rem] backdrop-blur-md">
                <motion.span 
                  animate={isUrgent && running ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : { scale: 1, opacity: 1 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block font-mono text-5xl sm:text-6xl md:text-8xl font-light tracking-tighter tabular-nums drop-shadow-md transition-colors duration-1000"
                  style={{ color: timerColor, textShadow: `0 0 20px ${timerColor}40` }}
                >
                  {formatTime()}
                </motion.span>
              </div>
            </div>
          </div>

          {/* HYPER-ALIVE TACTILE CONTROLS */}
          <div className="flex gap-6 md:gap-10 justify-center items-center w-full mb-8 md:mb-12">
            
            {/* Reset Button */}
            <motion.button 
              whileHover={{ scale: 1.15, filter: "brightness(1.3)" }}
              whileTap={{ scale: 0.8, rotate: -30 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              onClick={() => { setRemaining(durationFallback * 60); setRunning(false); }} 
              className="rounded-full w-12 h-12 md:w-16 md:h-16 bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shadow-md"
            >
              <RotateCcw className="w-4 h-4 md:w-6 md:h-6" />
            </motion.button>
            
            {/* Main Play/Pause (Dynamic Breathing & Coloring) */}
            <motion.button 
              animate={!running && !isFinished ? { 
                scale: [1, 1.05, 1], 
                boxShadow: [`0 0 20px ${timerColor}20`, `0 0 40px ${timerColor}40`, `0 0 20px ${timerColor}20`] 
              } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85, rotate: running ? -10 : 10 }}
              onClick={() => setRunning(!running)} 
              className="rounded-full w-20 h-20 md:w-28 md:h-28 shadow-xl border backdrop-blur-md relative overflow-hidden flex items-center justify-center"
              style={{ 
                backgroundColor: running ? 'rgba(255,255,255,0.1)' : `${timerColor}25`,
                borderColor: running ? 'rgba(255,255,255,0.2)' : `${timerColor}60`,
                color: running ? '#ffffff' : timerColor,
              }}
            >
              <motion.div animate={{ rotate: running ? 0 : 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 opacity-20 bg-[conic-gradient(from_0deg,transparent,white)] pointer-events-none" />
              {running ? (
                <Pause className="w-8 h-8 md:w-12 md:h-12 fill-current relative z-10" />
              ) : (
                <Play className="w-8 h-8 md:w-12 md:h-12 fill-current ml-1 md:ml-2 relative z-10" />
              )}
            </motion.button>

            {/* Skip Button */}
            <motion.button 
              whileHover={{ scale: 1.15, filter: "brightness(1.3)" }}
              whileTap={{ scale: 0.8, rotate: 30 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              onClick={generate} 
              className="rounded-full w-12 h-12 md:w-16 md:h-16 bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shadow-md"
            >
              <SkipForward className="w-4 h-4 md:w-6 md:h-6" />
            </motion.button>
          </div>

          {/* EPIC COMPLETE BUTTON UNLOCK */}
          <motion.div whileTap={isFinished ? { scale: 0.95 } : {}} className="w-full">
            <Button 
              onClick={complete}
              disabled={!isFinished}
              className={cn(
                "relative w-full h-14 md:h-20 md:text-lg rounded-full font-bold text-sm uppercase tracking-[0.15em] overflow-hidden transition-all duration-500",
                isFinished 
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-black shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:shadow-[0_0_70px_rgba(16,185,129,0.7)] hover:scale-[1.02]" 
                  : "bg-white/5 text-zinc-500 border border-white/10 shadow-none cursor-not-allowed opacity-50"
              )}
            >
              <span className="relative flex items-center justify-center z-10 w-full">
                <CheckCircle2 className="mr-2 h-5 w-5 md:h-7 md:w-7" /> 
                Complete 
                <span className={cn("font-medium ml-1 md:ml-2", isFinished ? "text-emerald-950" : "text-zinc-600")}>
                  (+{xpValue} XP)
                </span>
              </span>
              {isFinished && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
              )}
            </Button>
          </motion.div>
        </motion.div>

        {completionStage > 0 && <XPCounter xp={xpValue} color={primaryColor} />}
      </motion.div>
    </motion.div>
  );
    }
                               
