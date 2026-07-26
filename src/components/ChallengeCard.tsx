import { motion } from "framer-motion";
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

  return (
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
  );
}
