import { Brain, Crosshair, Moon, Smartphone, Zap } from "lucide-react";
import { motion } from "framer-motion";

export type BrainState = {
  overall: number;
  label: string;
  focus: number;
  digital: number;
  execution: number;
  recovery: number;
};

const metrics = [
  { key: "focus", label: "Focus", icon: Crosshair },
  { key: "digital", label: "Digital control", icon: Smartphone },
  { key: "recovery", label: "Recovery", icon: Moon },
  { key: "execution", label: "Execution", icon: Zap },
] as const;

export function BrainStateCard({ state }: { state: BrainState }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/15 bg-[#08131d]/80 p-6 shadow-2xl backdrop-blur-3xl sm:p-8">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-[80px]" />
      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
            <Brain className="h-4 w-4" /> Daily brain state
          </div>
          <div className="flex items-end gap-4">
            <motion.span key={state.overall} initial={{ opacity: 0.4, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-6xl font-black tracking-tighter text-white sm:text-7xl">
              {state.overall}
            </motion.span>
            <div className="pb-2">
              <p className="text-xl font-black text-white">{state.label}</p>
              <p className="mt-1 text-sm text-slate-400">An execution signal, not a medical or dopamine measurement.</p>
            </div>
          </div>
        </div>

        <div className="grid w-full max-w-2xl grid-cols-2 gap-3">
          {metrics.map(({ key, label, icon: Icon }) => {
            const value = state[key];
            return (
              <div key={key} className="rounded-2xl border border-white/7 bg-black/25 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-300"><Icon className="h-3.5 w-3.5 text-cyan-300" /> {label}</span>
                  <span className="text-xs font-black text-white">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/7">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
