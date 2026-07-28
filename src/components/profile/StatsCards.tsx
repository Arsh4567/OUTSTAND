import React from "react";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "./SpotlightCard";

interface BigStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  glowColor: string;
}

export function BigStat({ icon, label, value, color, glowColor }: BigStatProps) {
  return (
    <SpotlightCard glowColor={glowColor} className="p-6">
      <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 mb-4", color)}>
        <span className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">{icon}</span>
        {label}
      </div>
      <div className="font-mono text-4xl lg:text-5xl font-black text-white relative z-10 tracking-tighter drop-shadow-lg">{value}</div>
    </SpotlightCard>
  );
}

interface MiniCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export function MiniCard({ icon, label, value }: MiniCardProps) {
  return (
    <SpotlightCard className="p-5 text-center flex flex-col items-center justify-center min-h-[140px]">
      <div className="text-zinc-500 mb-3 bg-white/5 p-2 rounded-xl border border-white/5">{icon}</div>
      <div className="font-mono text-3xl font-black text-white tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">{label}</div>
    </SpotlightCard>
  );
}
