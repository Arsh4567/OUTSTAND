import React, { useEffect, useRef } from "react";
import { motion, animate } from "framer-motion";

export function CoreReactor({ score, color, label }: { score: number; color: string; label: string }) {
  const radius = 90;
  const stroke = 16;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(parseInt(node.textContent || "50", 10), score, {
      duration: 1.2,
      ease: "circOut",
      onUpdate(value) {
        node.textContent = Math.round(value).toString();
      },
    });

    return () => controls.stop();
  }, [score]);

  return (
    <div className="relative flex h-full min-h-[350px] w-full flex-col items-center justify-center">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[42px] mix-blend-screen"
        style={{ backgroundColor: color, opacity: 0.18 }}
      />

      <div className="relative z-10 flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] transform-gpu">
          <circle
            stroke="rgba(255,255,255,0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.15 }}
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ filter: `drop-shadow(0 0 8px ${color}70)` }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span
            ref={nodeRef}
            className="text-7xl font-black tracking-tighter text-white"
            style={{ textShadow: `0 0 24px ${color}70` }}
          >
            {score}
          </span>
        </div>
      </div>

      <motion.div
        animate={{ borderColor: `${color}30`, color, backgroundColor: `${color}10` }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mt-8 flex items-center gap-3 rounded-2xl border px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
        {label}
      </motion.div>
    </div>
  );
}
