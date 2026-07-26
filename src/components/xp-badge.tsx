import { motion } from "framer-motion";

interface XpBadgeProps {
  xp: number;
  level: number;
  pct: number;
  variantId: string;
}

export function XpBadge({ xp, level, pct, variantId }: XpBadgeProps) {
  const safeLevel = level || 1;
  const safeXp = xp || 0;
  const safePct = pct || 0;
  const gradientId = `lvl-grad-${variantId}`;

  return (
    <div className="flex items-center gap-3 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 shadow-inner">
      <div className="relative flex h-7 w-7 items-center justify-center">
        <motion.div 
          key={`shockwave-${variantId}-${safeLevel}`} 
          initial={{ scale: 0.8, opacity: 1, borderWidth: "4px" }} 
          animate={{ scale: 2.5, opacity: 0, borderWidth: "0px" }} 
          transition={{ duration: 1, ease: "easeOut" }} 
          className="pointer-events-none absolute inset-0 z-0 rounded-full border-indigo-400" 
        />
        <svg viewBox="0 0 36 36" className="relative z-10 h-7 w-7 -rotate-90 overflow-visible">
          <circle cx="18" cy="18" r="15" fill="none" className="stroke-slate-800" strokeWidth="4" />
          <motion.circle 
            cx="18" cy="18" r="15" 
            fill="none" 
            stroke={`url(#${gradientId})`} 
            strokeWidth="4" 
            strokeLinecap="round" 
            initial={{ strokeDasharray: "0 94.25", filter: "drop-shadow(0px 0px 0px rgba(99,102,241,0))" }} 
            animate={{ strokeDasharray: `${(safePct / 100) * 94.25} 94.25`, filter: "drop-shadow(0px 0px 6px rgba(99,102,241,0.8))" }} 
            transition={{ type: "spring", bounce: 0.4, duration: 1.5 }} 
          />
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
        <motion.span 
          key={`lvl-${variantId}-${safeLevel}`} 
          initial={{ scale: 1.8, opacity: 0, rotate: -15 }} 
          animate={{ scale: 1, opacity: 1, rotate: 0 }} 
          transition={{ type: "spring", bounce: 0.6, duration: 0.8 }} 
          className="absolute inset-0 z-20 grid place-items-center text-[11px] font-black text-indigo-100"
        >
          {safeLevel}
        </motion.span>
      </div>
      
      <div className="hidden text-xs sm:block">
        <motion.div 
          key={`xp-${variantId}-${safeXp}`} 
          initial={{ color: "#4ade80", scale: 1.3, textShadow: "0px 0px 20px rgba(74,222,128,1)" }} 
          animate={{ color: "#ffffff", scale: 1, textShadow: "0px 0px 0px rgba(74,222,128,0)" }} 
          transition={{ type: "spring", stiffness: 300, damping: 15 }} 
          className="origin-left tabular-nums tracking-tight font-black"
        >
          {safeXp} XP
        </motion.div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          Lv {safeLevel}
        </div>
      </div>
    </div>
  );
}
