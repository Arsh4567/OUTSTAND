import React from "react";
import { motion } from "framer-motion";

export function NeuralChart({ color }: { color: string }) {
  // Example data (In real life, map this to user history)
  const data = [30, 45, 80, 50, 75, 95, 85];
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="w-full h-full flex flex-col justify-end gap-2 relative overflow-hidden group">
      
      {/* Sci-Fi Scanning Laser Line */}
      <motion.div 
        animate={{ y: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] z-20 pointer-events-none opacity-50"
        style={{ backgroundColor: color, boxShadow: `0 0 20px 2px ${color}` }}
      />

      <div className="flex items-end justify-between gap-3 h-40 relative z-10 px-2">
        {data.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-3 w-full h-full justify-end">
            <div className="w-full bg-white/5 rounded-full relative flex items-end overflow-hidden shadow-inner h-full">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                transition={{ duration: 1, delay: i * 0.1, type: "spring", damping: 15 }}
                className="w-full rounded-full relative overflow-hidden"
                style={{ backgroundColor: color, opacity: val > 60 ? 1 : 0.4 }}
              >
                {/* Glowing top cap */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/40 mix-blend-overlay rounded-full" />
              </motion.div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
