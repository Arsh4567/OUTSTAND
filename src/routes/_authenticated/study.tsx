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
  Skull,
  X,
  LayoutGrid,
  Check
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { cn } from "@/lib/utils";
import { CBSE_CLASS_10_SYLLABUS } from "@/lib/cbse-data";
import confetti from 'canvas-confetti';

// --- NEW SUPABASE IMPORT ---
import { supabase } from "@/integrations/supabase/client";

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

// --- CONFETTI UTILITY ---
const triggerXpConfetti = () => {
  const duration = 2500;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
};

function StudyHubPage() {
  const { xp } = useAppState(); 
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"All" | Difficulty>("All");
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  
  // --- REAL DATA STATES ---
  const [activeDPPs, setActiveDPPs] = useState<DPP[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DIRECTIVES ON MOUNT ---
  useEffect(() => {
    const fetchDirectives = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('dpps')
          .select('*')
          .order('xp', { ascending: true }); 

        if (error) throw error;
        
        if (data) {
          setActiveDPPs(data as DPP[]);
        }
      } catch (error) {
        console.error("Comm-link failed. Could not fetch directives:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectives();
  }, []);

  useEffect(() => {
    if (isSyllabusModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSyllabusModalOpen]);

  const filteredDPPs = useMemo(() => {
    if (activeFilter === "All") return activeDPPs;
    return activeDPPs.filter(dpp => dpp.difficulty === activeFilter);
  }, [activeFilter, activeDPPs]);

  const subjectProgress = useMemo(() => {
    return CBSE_CLASS_10_SYLLABUS.map(subject => {
      const totalChapters = subject.chapters.length;
      const completedScore = subject.chapters.reduce((acc, chap) => acc + chap.progress, 0);
      const overallProgress = Math.round(completedScore / totalChapters);
      return { ...subject, overallProgress };
    });
  }, []);

  // --- EXECUTE SECURE RPC FUNCTION ---
  const handleCompleteDPP = async (dppId: string, rewardXp: number) => {
    setCompletingId(dppId);
    
    try {
      const { error } = await supabase.rpc('complete_dpp_and_award_xp', { 
        p_dpp_id: dppId 
      });

      if (error) throw error;
      
      triggerXpConfetti();
      setActiveDPPs(prev => prev.filter(dpp => dpp.id !== dppId));
      console.log(`Secured ${rewardXp} XP!`);
      
    } catch (error) {
      console.error("Mission failed during execution:", error);
    } finally {
      setCompletingId(null);
    }
  };
  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] w-full py-8 px-4 sm:px-6 lg:py-12 lg:px-8 font-sans flex flex-col items-center">
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="w-full max-w-7xl space-y-8 lg:space-y-12 pb-20"
        >
          {/* Header Section */}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Active DPPs - Main Focus Area */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                  <Target className="text-blue-400 h-6 w-6 drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]" /> 
                  Active Directives
                </h2>
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
                  {/* --- NEW LOADING STATE --- */}
                  {isLoading ? (
                    <motion.div 
                      key="loading-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center p-12 text-center"
                    >
                      <BrainCircuit className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-slate-400 font-medium">Decrypting directives from command...</p>
                    </motion.div>
                  ) : filteredDPPs.length === 0 ? (
                    <motion.div 
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]"
                    >
                      <div className="bg-emerald-500/10 p-4 rounded-full mb-4 border border-emerald-500/20">
                        <Check className="h-8 w-8 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-2">Sector Cleared!</h3>
                      <p className="text-slate-400 font-medium">All directives in this sector are complete. Great work, commander.</p>
                    </motion.div>
                  ) : (
                    filteredDPPs.map((dpp) => {
                      const isCompleting = completingId === dpp.id;
                      const config = DIFFICULTY_CONFIG[dpp.difficulty];
                      const DiffIcon = config.icon;
                      
                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                          key={dpp.id} 
                          className={cn(
                            "group relative overflow-hidden rounded-2xl bg-[#0a0f1a] border transition-all duration-300 p-5 lg:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6",
                            isCompleting ? "border-emerald-500/50 bg-emerald-950/20" : "border-white/5 hover:bg-[#0c121e]",
                            !isCompleting && config.glow
                          )}
                        >
                          {isCompleting && (
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 animate-pulse" />
                          )}

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
                            <motion.button 
                              whileHover={!isCompleting ? { scale: 1.05 } : {}}
                              whileTap={!isCompleting ? { scale: 0.95 } : {}}
                              onClick={() => handleCompleteDPP(dpp.id, dpp.xp)}
                              disabled={isCompleting}
                              className={cn(
                                "relative overflow-hidden flex items-center justify-center gap-2 h-10 lg:h-12 px-5 lg:px-6 rounded-xl font-bold transition-all duration-300",
                                isCompleting 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                                  : "bg-white text-black hover:bg-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                              )}
                            >
                              {isCompleting ? (
                                <>
                                  <CheckCircle2 className="h-5 w-5 animate-pulse" />
                                  <span className="hidden sm:inline">Securing...</span>
                                </>
                              ) : (
                                <>
                                  <span>Execute</span>
                                  <ChevronRight className="h-4 w-4" />
                                </>
                              )}
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Syllabus Burn-down - Side Panel */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="lg:col-span-1 bg-[#050810] border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] h-fit lg:sticky lg:top-24">
              <h3 className="text-xs lg:text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center justify-center gap-3">
                <span className="w-6 h-px bg-gradient-to-r from-transparent to-slate-700" />
                <BookOpen className="h-4 w-4" />
                CBSE Status
                <span className="w-6 h-px bg-gradient-to-l from-transparent to-slate-700" />
              </h3>
              
              <div className="space-y-7">
                {subjectProgress.map((subject) => (
                  <div key={subject.subject} className="space-y-2.5">
                    <div className="flex justify-between items-end">
                      <span className={cn("font-bold text-sm lg:text-base tracking-wide", subject.color)}>
                        {subject.subject}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {subject.overallProgress}%
                      </span>
                    </div>
                    <div className={cn("h-2.5 w-full rounded-full bg-black/60 overflow-hidden border", subject.border)}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.overallProgress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        className={cn("h-full shadow-[0_0_10px_currentColor]", subject.subject === "Mathematics" ? "bg-blue-500" : subject.subject === "Science" ? "bg-cyan-500" : subject.subject === "Social Science" ? "bg-amber-500" : "bg-emerald-500")}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsSyllabusModalOpen(true)}
                className="w-full mt-10 py-3.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold tracking-wide hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <LayoutGrid className="h-4 w-4" /> Access Full Syllabus Grid
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* FULL SYLLABUS OVERLAY MODAL */}
      <AnimatePresence>
        {isSyllabusModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-6xl max-h-[90vh] bg-[#050810] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 lg:p-8 border-b border-slate-800 bg-[#0a0f1a]">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                  <h2 className="text-2xl font-black text-white tracking-tight">Official CBSE Syllabus Grid</h2>
                </div>
                <button 
                  onClick={() => setIsSyllabusModalOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-hide space-y-12">
                {subjectProgress.map((subject) => (
                  <div key={subject.subject} className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <h3 className={cn("text-xl font-bold tracking-wide", subject.color)}>{subject.subject}</h3>
                      <span className="text-sm font-mono font-bold text-slate-400">{subject.overallProgress}% Complete</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {subject.chapters.map((chapter, idx) => (
                        <div 
                          key={chapter.id}
                          className={cn(
                            "p-4 rounded-xl border flex flex-col gap-3 transition-colors",
                            chapter.status === "completed" ? "bg-green-500/5 border-green-500/20" :
                            chapter.status === "in-progress" ? "bg-blue-500/5 border-blue-500/20" :
                            "bg-white/[0.02] border-white/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-slate-500 font-mono text-xs font-bold shrink-0">CH {idx + 1}</span>
                            <span className={cn(
                              "text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                              chapter.status === "completed" ? "text-green-400 border-green-500/30 bg-green-500/10" :
                              chapter.status === "in-progress" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" :
                              "text-slate-500 border-slate-700 bg-slate-800/50"
                            )}>
                              {chapter.status.replace("-", " ")}
                            </span>
                          </div>
                          <h4 className={cn(
                            "font-semibold text-sm lg:text-base leading-snug",
                            chapter.status === "completed" ? "text-slate-200" :
                            chapter.status === "in-progress" ? "text-white" :
                            "text-slate-400"
                          )}>
                            {chapter.title}
                          </h4>
                          
                          <div className="mt-auto pt-2">
                            <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/5">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000", 
                                  chapter.status === "completed" ? "bg-green-500" :
                                  chapter.status === "in-progress" ? "bg-blue-500" :
                                  "bg-transparent"
                                )}
                                style={{ width: `${chapter.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}  
