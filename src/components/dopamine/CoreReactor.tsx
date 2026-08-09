import React, { useEffect, useRef } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";

export function CoreReactor({ score, color, label }: { score: number, color: string, label: string }) {
  const radius = 90;
  const stroke = 16;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Rolling Number Logic
  const nodeRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(parseInt(node.textContent || "50"), score, {
        duration: 1.5,
        ease: "circOut",
        onUpdate(value) {
          node.textContent = Math.round(value).toString();
        },
      });
      return () => controls.stop();
    }
  }, [score]);

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-full min-h-[350px]">
      {/* Background Breathing Glow */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] pointer-events-none mix-blend-screen"
        style={{ backgroundColor: color }}
      />

      <div className="relative flex items-center justify-center z-10 drop-shadow-2xl">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] transform-gpu">
          <circle 
            stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={stroke} 
            r={normalizedRadius} cx={radius} cy={radius} 
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference + ' ' + circumference}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ filter: `drop-shadow(0 0 16px ${color}80)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span 
            ref={nodeRef}
            className="text-7xl font-black text-white tracking-tighter" 
            style={{ textShadow: `0 0 40px ${color}80` }}
          >
            {score}
          </span>
        </div>
      </div>

      <motion.div
        animate={{ borderColor: `${color}30`, color: color, backgroundColor: `${color}10` }}
        transition={{ duration: 1 }}
        className="mt-8 flex items-center gap-3 rounded-2xl border px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md relative z-10 shadow-lg"
      >
        <motion.span 
          animate={{ backgroundColor: color, boxShadow: `0 0 20px ${color}` }} 
          className="h-2 w-2 rounded-full animate-pulse" 
        />
        {label}
      </motion.div>
    </div>
  );
}
