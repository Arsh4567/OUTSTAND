import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, BrainCircuit, ChevronRight, Shield, Swords, Skull, Check, Award, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { cn } from "@/lib/utils";
import confetti from 'canvas-confetti';

import { supabase } from "@/integrations/supabase/client";
import { useDpps } from "@/hooks/useDpps";
import { useQueryClient } from '@tanstack/react-query';
import { CombatZone } from "@/components/CombatZone"; 
import HighYieldBank from "@/components/HighYieldBank";

export const Route = createFileRoute("/_authenticated/study")({
  component: StudyHubPage,
});

type Difficulty = "Easy" | "Medium" | "Hard";

interface DPP {
  id: string;
  subject: string;
  topic: string;
  xp: number;
  difficulty: Difficulty;
  estimatedTime: string;
}

const DIFFICULTY_CONFIG = {
  Easy: { icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "group-hover:shadow-[0_0_15px_rgba(52,211,153,0.15)]" },
  Medium: { icon: Swords, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "group-hover:shadow-[0_0_15px_rgba(251,191,36,0.15)]" },
  Hard: { icon: Skull, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", glow: "group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]" },
};

const triggerXpConfetti = () => {
  const duration = 2500;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: ReturnType<typeof setInterval> = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
};

function StudyHubPage() {
  const { xp } = useAppState(); 
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"directives" | "bank">("directives");
  const [activeFilter, setActiveFilter] = useState<"All" | Difficulty>("All");
  
  const { data: activeDPPs = [], isLoading } = useDpps();
  const [activeQuizDpp, setActiveQuizDpp] = useState<DPP | null>(null);

  const filteredDPPs = useMemo(() => {
    if (activeFilter === "All") return activeDPPs;
    return activeDPPs.filter((dpp: DPP) => dpp.difficulty === activeFilter);
  }, [activeFilter, activeDPPs]);

  const handleQuizCompletion = async () => {
    if (!activeQuizDpp) return;
    try {
      triggerXpConfetti();
      const { error } = await supabase.rpc('complete_dpp_and_award_xp', { p_dpp_id: activeQuizDpp.id });
      if (error) await supabase.from('dpps').update({ is_completed: true }).eq('id', activeQuizDpp.id);
      queryClient.invalidateQueries({ queryKey: ['dpps'] });
      setActiveQuizDpp(null); 
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

  return (
    <>
      {/* 
        FIXED: Removed the strict padding on the parent container. 
        Padding and max-width are now dynamically applied ONLY when in Directives mode.
      */}
      <div className="min-h-[calc(100vh-4rem)] w-full font-sans flex flex-col items-center">
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className={cn(
            "w-full transition-all duration-300 pb-20",
            activeTab === "directives" 
              ? "max-w-4xl space-y-8 lg:space-y-10 px-4 sm:px-6 lg:px-8 py-8 lg:py-12" 
              : "max-w-full px-0 py-0" // Drops padding to 0 for Edge-to-Edge Question Bank
          )}
        >
          
          {/* HEADER & TABS WRAPPER: Keeps the top area constrained and nice even in full-screen mode */}
          <div className={cn(
            "w-full mx-auto",
            activeTab === "bank" ? "max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8 lg:space-y-10" : ""
          )}>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="h-10 w-10 lg:h-12 lg:w-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                  <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-500 tracking-tight">
                    Command Center
                  </h1>
                </div>
                <p className="text-slate-400 text-sm lg:text-lg font-medium tracking-wide">
                  Execute your daily CBSE directives and climb the ranks.
                </p>
              </div>
              
              <div className="flex items-center gap-3 bg-[#0a0f1a]/80 border border-blue-500/30 px-5 py-3 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <Zap className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Total XP</span>
                  <span className="text-white font-black text-lg leading-none tracking-wide">{xp?.toLocaleString() || 0}</span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="flex justify-center w-full relative z-20 mt-8">
              <div className="flex p-1.5 bg-[#050810]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <button
                  onClick={() => setActiveTab("directives")}
                  className={cn("relative flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold transition-all duration-300 rounded-xl", activeTab === "directives" ? "text-white" : "text-slate-500 hover:text-slate-300")}
                >
                  {activeTab === "directives" && <motion.div layoutId="studyMainTab" className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/50 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.25)]" />}
                  <Target className={cn("relative z-10 w-5 h-5 transition-colors", activeTab === "directives" ? "text-blue-400" : "")} />
                  <span className="relative z-10 tracking-wide">Active Directives</span>
                </button>
                <button
                  onClick={() => setActiveTab("bank")}
                  className={cn("relative flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold transition-all duration-300 rounded-xl", activeTab === "bank" ? "text-white" : "text-slate-500 hover:text-slate-300")}
                >
                  {activeTab === "bank" && <motion.div layoutId="studyMainTab" className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border border-purple-400/50 rounded-xl shadow-[0_0_20px_rgba(192,132,252,0.25)]" />}
                  <Award className={cn("relative z-10 w-5 h-5 transition-colors", activeTab === "bank" ? "text-purple-400" : "")} />
                  <span className="relative z-10 tracking-wide flex items-center gap-1.5">
                    High-Yield Bank 
                    {activeTab === "bank" && <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>

          <div className="relative w-full">
            <AnimatePresence mode="wait">
              {/* DIRECTIVES VIEW */}
              {activeTab === "directives" && (
                <motion.div key="directives" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="space-y-6">
                  {/* Filter Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                      <Target className="text-blue-400 h-6 w-6 drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]" /> Daily Missions
                    </h2>
                    <div className="flex p-1 bg-[#050810] border border-white/10 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
                      {(["All", "Easy", "Medium", "Hard"] as const).map((tab) => (
                        <button
                          key={tab} onClick={() => setActiveFilter(tab)}
                          className={cn("relative px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap rounded-lg flex-1 sm:flex-none", activeFilter === tab ? "text-white" : "text-slate-500 hover:text-slate-300")}
                        >
                          {activeFilter === tab && <motion.div layoutId="activeFilterTab" className="absolute inset-0 bg-blue-600/20 border border-blue-500/50 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.2)]" />}
                          <span className="relative z-10">{tab}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {isLoading ? (
                         <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-12"><BrainCircuit className="h-8 w-8 text-blue-500 animate-spin" /></motion.div>
                      ) : filteredDPPs.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                          <div className="bg-emerald-500/10 p-4 rounded-full mb-4 border border-emerald-500/20"><Check className="h-8 w-8 text-emerald-400" /></div>
                          <h3 className="text-xl font-black text-white mb-2">Sector Cleared!</h3>
                        </motion.div>
                      ) : (
                        filteredDPPs.map((dpp: DPP) => {
                          const config = DIFFICULTY_CONFIG[dpp.difficulty];
                          const DiffIcon = config.icon;
                          return (
                            <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }} key={dpp.id} className={cn("group relative overflow-hidden rounded-2xl bg-[#0a0f1a] border border-white/5 hover:bg-[#0c121e] transition-all duration-300 p-5 lg:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6", config.glow)}>
                              <div className="flex-1 relative z-10 w-full">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-950/40 px-3 py-1 rounded-md border border-blue-900/50">{dpp.subject}</span>
                                  <span className={cn("flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border", config.color, config.bg, config.border)}>
                                    <DiffIcon className="h-3.5 w-3.5" /> {dpp.difficulty}
                                  </span>
                                </div>
                                <h3 className="text-lg lg:text-xl font-bold text-slate-200 group-hover:text-white transition-colors">{dpp.topic}</h3>
                              </div>
                              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                <div className={cn("text-base lg:text-lg font-black", config.color)}>+{dpp.xp} <span className="text-xs text-slate-500 font-sans">XP</span></div>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveQuizDpp(dpp)} className="flex items-center justify-center gap-2 h-10 lg:h-12 px-5 lg:px-6 rounded-xl font-bold bg-white text-black hover:bg-slate-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all">
                                  <span>Execute</span> <ChevronRight className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* HIGH-YIELD BANK VIEW */}
              {activeTab === "bank" && (
                <motion.div key="bank" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="w-full">
                  {/* FIX: Removed the restrictive p-1 bg-gradient wrapper that was preventing edge-to-edge layout */}
                  <HighYieldBank />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeQuizDpp && <CombatZone dppId={activeQuizDpp.id} onClose={() => setActiveQuizDpp(null)} onComplete={handleQuizCompletion} />}
      </AnimatePresence>
    </>
  );
}
