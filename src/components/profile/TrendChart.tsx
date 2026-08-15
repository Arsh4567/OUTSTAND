import { motion } from "framer-motion";
import { scoreColor } from "@/lib/dopamine";

const smoothEase = [0.22, 1, 0.36, 1] as const;

interface TrendChartProps {
  logs: { log_date: string; score: number }[];
}

export function TrendChart({ logs }: TrendChartProps) {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-center text-sm font-medium text-zinc-500">
        Awaiting daily log data.
      </div>
    );
  }
  
  const w = 800; 
  const h = 240; 
  const step = w / Math.max(1, logs.length - 1);
  const points = logs.map((l, i) => [i * step, h - ((l?.score || 0) / 100) * h]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${(logs.length - 1) * step},${h} L0,${h} Z`;
  
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible preserve-3d">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.5)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0.0)" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {[0, 25, 50, 75, 100].map((v) => (
        <line key={v} x1={0} x2={w} y1={h - (v / 100) * h} y2={h - (v / 100) * h} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 6" />
      ))}
          
      <motion.path 
        initial={{ opacity: 0, d: `M0,${h} L${w},${h} Z` }} 
        animate={{ opacity: 1, d: area }} 
        transition={{ duration: 1.5, ease: smoothEase }} 
        fill="url(#trendFill)" 
      />
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }} 
        animate={{ pathLength: 1, opacity: 1 }} 
        transition={{ duration: 2, ease: "easeInOut" }} 
        d={path} 
        fill="none" 
        stroke="#818cf8" 
        strokeWidth={5} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        filter="url(#glow)"
      />
      
      {points.map((p, i) => {
        let hex = "#818cf8";
        try {
          const l = logs[i];
          const c = scoreColor(l?.score || 0);
          hex = (c as any)?.hex || c || "#818cf8";
        } catch (e) {}
        
        return (
          <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + (i * 0.1), type: "spring" }}>
            <circle cx={p[0]} cy={p[1]} r={14} fill="transparent" className="cursor-crosshair" />
            <circle 
              cx={p[0]} 
              cy={p[1]} 
              r={6} 
              fill={hex as string} 
              stroke="#09090b" 
              strokeWidth={4} 
              style={{ filter: `drop-shadow(0 0 12px ${hex})` }} 
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
