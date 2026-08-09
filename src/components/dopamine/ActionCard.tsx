import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  active: boolean;
  emoji: string;
  label: string;
  description: string;
  points: number;
  tone: "good" | "bad";
  onClick: () => void;
}

export function ActionCard({ active, emoji, label, description, points, tone, onClick }: ActionCardProps) {
  const isGood = tone === "good";
  const [particles, setParticles] = useState<{ id: number }[]>([]);

  const handleClick = () => {
    // 1. Fire Native Haptics
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(isGood ? [15, 30, 20] : [40]);
    }
    
    // 2. Spawn Particle
    const newParticle = { id: Date.now() };
    setParticles((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1000);

    // 3. Trigger actual function
    onClick();
  };

  return (
    <motion.button 
      whileHover={{ y: -4, scale: 1.02 }} 
      whileTap={{ scale: 0.95 }} 
      onClick={handleClick} 
      className={cn(
        "w-full text-left p-4 rounded-[1.5rem] border transition-all duration-300 relative group outline-none select-none",
        active 
          ? (isGood ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : "bg-rose-500/10 border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.15)]") 
          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
      )}
    >
      {/* Floating Particles Container */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, scale: 0.5, x: "-50%" }}
            animate={{ opacity: 0, y: -60, scale: 1.2, x: "-50%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "absolute left-1/2 top-4 z-50 font-black text-lg pointer-events-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]",
              isGood ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {points > 0 ? `+${points}` : points}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[1.5rem]" 
           style={{ background: `radial-gradient(circle 100px at 80% 20%, ${isGood ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)'}, transparent)` }} 
      />
      
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className={cn(
          "flex items-center justify-center h-12 w-12 rounded-xl text-2xl shadow-inner border transition-all duration-500",
          active 
            ? (isGood ? 'bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-rose-500/20 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.4)]') 
            : 'bg-black/40 border-white/5'
        )}>
          {emoji}
        </div>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-colors",
          active 
            ? (isGood ? 'text-emerald-300 bg-emerald-500/20' : 'text-rose-300 bg-rose-500/20') 
            : 'text-slate-500 bg-black/40'
        )}>
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
      
      <div className="relative z-10 mt-4">
        <h4 className={cn("font-bold tracking-tight text-sm mb-1 transition-colors", active ? 'text-white' : 'text-slate-300')}>{label}</h4>
        <p className={cn("text-xs font-medium leading-relaxed line-clamp-2 transition-colors", active ? (isGood ? 'text-emerald-200/80' : 'text-rose-200/80') : 'text-slate-500')}>{description}</p>
      </div>
    </motion.button>
  );
}
