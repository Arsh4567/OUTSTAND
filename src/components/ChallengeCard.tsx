import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { CheckCircle2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRarityStyle, type OutstandChallenge } from "@/lib/Index";
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
      className="absolute inset-0 flex items-center justify-center font-black text-5xl tracking-tighter z-50 drop-shadow-2xl"
      style={{ color: color || "#ffffff", textShadow: `0px 0px 30px ${color || '#ffffff'}80` }}
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
  const rarityTheme = getRarityStyle(challenge.rarity);

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
      className="w-full flex justify-center perspective-[1000px]"
    >
      <motion.div
        key="active"
        // 3. Spring Entrance & Implosion Physics
        initial={{ opacity: 0, scale: 0.3, y: 100 }}
        animate={
          completionStage === 1
            ? {
                scale: 0.8, // Sucks in (Implosion)
                y: 0,
                rotateZ: [0, -3, 3, -3, 3, 0], // Aggressive shake
                borderRadius: "100px",
                filter: "brightness(1.5)", // Charges up
              }
            : completionStage === 2
            ? {
                scale: [0.8, 1.2, 0], // Bursts out then vanishes
                y: [0, -20, -1000], // Shoots into space
                opacity: [1, 1, 0],
                filter: "brightness(2)",
              }
            : {
                opacity: 1,
                scale: 1,
                y: 0,
                borderRadius: "24px",
                boxShadow: `0px 10px 40px -10px ${challenge.color || '#4f46e5'}40`, // Ambient breathing shadow
              }
        }
        transition={
          completionStage === 1
            ? { duration: 1.2, ease: "easeInOut" }
            : completionStage === 2
            ? { duration: 0.8, ease: "easeIn" }
            : { type: "spring", stiffness: 200, damping: 20 }
        }
        className={cn(
          "relative flex flex-col items-center justify-center overflow-visible p-8 backdrop-blur-2xl border-2 transition-colors mx-auto",
          rarityTheme.bg,
          rarityTheme.border,
          completionStage > 0 ? "w-[240px] h-[80px] !p-0" : "w-full min-h-[400px]"
        )}
      >
        {/* 4. Upgraded Explosion Particles */}
        {completionStage === 2 && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            {/* The Shockwave */}
            <motion.div
              initial={{ scale: 0.5, opacity: 1, borderWidth: "40px" }}
              animate={{ scale: 4, opacity: 0, borderWidth: "0px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute rounded-full"
              style={{ borderColor: challenge.color || "#ffffff", borderStyle: "solid", width: "150px", height: "150px" }}
            />
            
            {/* Flying Sparks */}
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, Math.random() * 2 + 1, 0],
                  opacity: [1, 1, 0],
                  x: Math.cos((i * 22.5 * Math.PI) / 180) * (Math.random() * 400 + 200),
                  y: Math.sin((i * 22.5 * Math.PI) / 180) * (Math.random() * 400 + 200),
                }}
                transition={{ duration: 1 + Math.random() * 0.5, ease: "easeOut" }}
                className="absolute w-3 h-3 rounded-full"
                style={{ backgroundColor: challenge.color || "#fff", boxShadow: `0 0 20px ${challenge.color}` }}
              />
            ))}
          </div>
        )}

        <motion.div
          animate={completionStage > 0 ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
          style={completionStage === 0 ? { transform: "translateZ(50px)" } : {}} // Pushes text closer to user in 3D
          className="w-full text-center space-y-6 relative z-10"
        >
          {/* Internal content remains identical, just wrapped in the 3D context */}
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
            <span className={cn("px-3 py-1 rounded-full bg-black/40", rarityTheme.text)}>
              {challenge.rarity}
            </span>
            <span className="text-slate-400">{challenge.category}</span>
          </div>

          <motion.div 
            animate={{ y: [0, -10, 0] }} // Ambient floating emoji
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-7xl drop-shadow-2xl pt-2"
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

          {/* 5. Tactile Squish Buttons */}
          <div className="flex gap-3 justify-center">
            <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }}>
              <Button variant="secondary" onClick={() => setRunning(!running)} className="rounded-full w-14 h-14 bg-white/10 hover:bg-white/20 border-white/5">
                {running ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }}>
              <Button variant="outline" onClick={() => { setRemaining(challenge.minutes * 60); setRunning(false); }} className="rounded-full w-14 h-14 bg-black/40 border-white/10 hover:bg-white/10 text-white">
                <RotateCcw size={20} />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }}>
              <Button variant="ghost" onClick={generate} className="rounded-full w-14 h-14 text-slate-400 hover:text-white hover:bg-white/10">
                <SkipForward size={20} />
              </Button>
            </motion.div>
          </div>

          <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}>
            <Button 
              onClick={complete}
              className={cn(
                "w-full h-14 rounded-2xl font-bold text-lg text-black transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]", 
                rarityTheme ? rarityTheme.bg.replace('/10', '/90') : "bg-white/90"
              )}
              style={{ backgroundColor: challenge.color }}
            >
              <span className="flex items-center"><CheckCircle2 className="mr-2 h-5 w-5" /> COMPLETE (+{challenge.xp} XP)</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* 6. Slot Machine Roll Up */}
        {completionStage > 0 && <XPCounter xp={challenge.xp} color={challenge.color} />}
      </motion.div>
    </motion.div>
  );
            }
