import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Target, 
  Zap, 
  BrainCircuit, 
  CheckCircle2, 
  ChevronRight,
  Shield,
  Swords,
  Skull
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { cn } from "@/lib/utils";
// import { supabase } from "@/integrations/supabase/client";

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

// Officially aligned CBSE Class 10 Mock Data
const ACTIVE_DPPS: DPP[] = [
  { id: "dpp_1", subject: "Science (Physics)", topic: "Light: Reflection & Refraction", xp: 50, difficulty: "Easy", estimatedTime: "15m" },
  { id: "dpp_2", subject: "Mathematics", topic: "Real Numbers: Irrationality Proofs", xp: 50, difficulty: "Easy", estimatedTime: "20m" },
  { id: "dpp_3", subject: "Social Science", topic: "The Rise of Nationalism in Europe", xp: 100, difficulty: "Medium", estimatedTime: "30m" },
  { id: "dpp_4", subject: "Mathematics", topic: "Quadratic Equations: Word Problems", xp: 150, difficulty: "Medium", estimatedTime: "35m" },
  { id: "dpp_5", subject: "Science (Chemistry)", topic: "Carbon & Its Compounds: Nomenclature", xp: 250, difficulty: "Hard", estimatedTime: "45m" },
  { id: "dpp_6", subject: "Mathematics", topic: "Trigonometric Identities (Proofs)", xp: 300, difficulty: "Hard", estimatedTime: "50m" },
];

const CBSE_SYLLABUS = [
  { name: "Mathematics", progress: 45, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", bar: "bg-blue-500" },
  { name: "Science", progress: 38, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", bar: "bg-cyan-500" },
  { name: "Social Science", progress: 60, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", bar: "bg-amber-500" },
  { name: "English", progress: 75, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "bg-emerald-500" },
];

const DIFFICULTY_CONFIG = {
  Easy: { icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "group-hover:shadow-[0_0_15px_rgba(52,211,153,0.15)]" },
  Medium: { icon: Swords, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "group-hover:shadow-[0_0_15px_rgba(251,191,36,0.15)]" },
  Hard: { icon: Skull, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", glow: "group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]" },
};

function StudyHubPage() {
  const { xp } = useAppState(); 
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"All" | Difficulty>("All");

  const filteredDPPs = useMemo(() => {
    if (activeFilter === "All") return ACTIVE_DPPS;
    return ACTIVE_DPPS.filter(dpp => dpp.difficulty === activeFilter);
  }, [activeFilter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const handleCompleteDPP = async (dppId: string, rewardXp: number) => {
    setCompletingId(dppId);
    try {
      // Supabase execution logic will go here
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log(`Awarded ${rewardXp} XP for completing ${dppId}`);
    } catch (error) {
      console.error("Failed to complete DPP:", error);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full py-8 px-4 sm:px-6 lg:py-12 lg:px-8 font-sans flex flex-col items-center">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-7xl space-y-8 lg:space-y-12 pb-20"
      >
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          
          {/* Active DPPs - Main Focus Area (Spans 2 columns) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                <Target className="text-blue-400 h-6 w-6 drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]" /> 
                Active Directives
              </h2>

              {/* Tactical Filter Tabs */}
              <div className="flex p-1 bg-[#050810] border border-white/10 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
                {(["All", "Easy", "Medium", "Hard"] as const).map((tab) => {
                  const isActive = activeFilter === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={cn(
                        "relative px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap rounded-lg flex-1 sm:flex-none",
                        isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeFilterTab"
                          className="absolute inset-0 bg-blue-600/20 border border-blue-500/50 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{tab}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 min-h-[400px]">
              <AnimatePresence mode="popLayout">
                {filteredDPPs.map((dpp) => {
                  const isCompleting = completingId === dpp.id;
                  const config = DIFFICULTY_CONFIG[dpp.difficulty];
                  const DiffIcon = config.icon;
                  
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      key={dpp.id} 
                      className={cn(
                        "group relative overflow-hidden rounded-2xl bg-[#0a0f1a] border transition-all duration-300 p-5 lg:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6",
                        "border-white/5 hover:bg-[#0c121e]",
                        config.glow
                      )}
                    >
                      <div className="flex-1 relative z-10 w-full">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-950/40 px-3 py-1 rounded-md border border-blue-900/50">
                            {dpp.subject}
                          </span>
                          <span className={cn("flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border", config.color, config.bg, config.border)}>
                            <DiffIcon className="h-3.5 w-3.5" /> {dpp.difficulty}
                          </span>
                          <span className="text-slate-500 text-xs font-medium font-mono ml-auto sm:ml-0">
                            ~{dpp.estimatedTime}
                          </span>
                        </div>
                        <h3 className="text-lg lg:text-xl font-bold text-slate-200 group-hover:text-white transition-colors">
                          {dpp.topic}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end relative z-10 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0 mt-2 sm:mt-0">
                        <div className="text-left sm:text-right">
                          <div className={cn("text-base lg:text-lg font-black", config.color)}>
                            +{dpp.xp} <span className="text-xs text-slate-500 font-sans tracking-wide">XP</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCompleteDPP(dpp.id, dpp.xp)}
                          disabled={isCompleting}
                          className={cn(
                            "relative overflow-hidden flex items-center justify-center gap-2 h-10 lg:h-12 px-5 lg:px-6 rounded-xl font-bold transition-all duration-300",
                            isCompleting 
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-white text-black hover:bg-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-105"
                          )}
                        >
                          {isCompleting ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 animate-pulse" />
                              <span className="hidden sm:inline">Verifying...</span>
                            </>
                          ) : (
                            <>
                              <span>Execute</span>
                              <ChevronRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                
                {filteredDPPs.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col items-center justify-center py-20 text-center opacity-50"
                  >
                    <Target className="h-16 w-16 text-slate-600 mb-4" />
                    <p className="text-slate-400 font-medium">No active directives found for this classification.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Syllabus Burn-down - Side Panel */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-1 bg-[#050810] border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] h-fit lg:sticky lg:top-24"
          >
            <h3 className="text-xs lg:text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center justify-center gap-3">
              <span className="w-6 h-px bg-gradient-to-r from-transparent to-slate-700" />
              <BookOpen className="h-4 w-4" />
              CBSE Status
              <span className="w-6 h-px bg-gradient-to-l from-transparent to-slate-700" />
            </h3>
            
            <div className="space-y-7">
              {CBSE_SYLLABUS.map((subject) => (
                <div key={subject.name} className="space-y-2.5">
                  <div className="flex justify-between items-end">
                    <span className={cn("font-bold text-sm lg:text-base tracking-wide", subject.color)}>
                      {subject.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      {subject.progress}%
                    </span>
                  </div>
                  <div className={cn("h-2.5 w-full rounded-full bg-black/60 overflow-hidden border", subject.border)}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.progress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      className={cn("h-full shadow-[0_0_10px_currentColor]", subject.bar)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-10 py-3.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold tracking-wide hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-300">
              Access Full Syllabus Grid
            </button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
                               }
            
