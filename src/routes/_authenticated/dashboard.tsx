import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Play, Zap, ChevronDown, ChevronUp, Droplets, BookOpen, Brain, Activity, Flame, Trophy, Target, Quote } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { AddHabitDialog, HabitCard } from "@/components/habit-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Hooks & Libs
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useDailyLog } from "@/hooks/use-dopamine";
import { todayISO } from "@/lib/habits";
import { dailyChallenge } from "@/lib/Index";
import { scoreColor } from "@/lib/dopamine";
import { QUOTES } from "@/lib/quotes"; // Imported our new matrix

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

// Premium easing curve for buttery smooth animations
const smoothEase = [0.16, 1, 0.3, 1] as const;

function Dashboard() {
  const { habits = [], toggleToday, addHabit, updateHabit, deleteHabit, xp = 0, bestStreak = 0 } = useAppState() ?? {};
  const { user, profile } = useAuth() ?? {};
  const { log } = useDailyLog() ?? {};
  const navigate = useNavigate();

  const [showAllHabits, setShowAllHabits] = useState(false);
  const [dismissedWizard, setDismissedWizard] = useState(false);

  const today = todayISO();
  const name = user ? displayNameOf(user, profile) : "Hustler";

  // Memoized stats
  const stats = useMemo(() => {
    const completed = habits.filter((h) => h?.history?.includes(today)).length;
    const total = habits.length;
    return { completed, total, pct: total ? Math.round((completed / total) * 100) : 0 };
  }, [habits, today]);

  // Determine today's quote based on a simple date hash so it stays consistent all day
  const dailyQuote = useMemo(() => {
    if (!QUOTES || QUOTES.length === 0) return null;
    const hash = today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
    return QUOTES[hash % QUOTES.length];
  }, [today]);

  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const challenge = dailyChallenge() ?? { title: "Stay Consistent", description: "Complete all your daily tasks." };

  const displayedHabits = showAllHabits ? habits : habits.slice(0, 4);
  const showWizard = habits.length === 0 && !dismissedWizard;

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, ease: smoothEase } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: smoothEase } }
  };

  const quickStartHabits = [
    { name: "Hydrate (3L)", emoji: "💧", icon: <Droplets className="h-5 w-5" />, reason: "Baseline energy and cognitive function.", color: "primary" },
    { name: "Deep Work (60m)", emoji: "🧠", icon: <Brain className="h-5 w-5" />, reason: "Uninterrupted focus for maximum output.", color: "accent" },
    { name: "Read 10 Pages", emoji: "📚", icon: <BookOpen className="h-5 w-5" />, reason: "Continuous learning and mental clarity.", color: "success" }
  ];

  return (
    <>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-7xl space-y-6 pb-24 pt-6 px-4 sm:px-6"
      >
        {/* HERO SECTION */}
        <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white">
              Welcome back,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
                {name}.
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-md leading-relaxed pt-2">
              {stats.pct >= 80 
                ? "Incredible momentum today. Let's finish strong." 
                : "Your potential is waiting. Turn your intentions into action."}
            </p>
          </div>
          <div className="flex w-full md:w-auto gap-3">
             <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white transition-all active:scale-95" onClick={() => navigate({ to: "/dopamine" })}>
               <Activity className="mr-2 h-4 w-4 text-slate-400" /> Log Dopamine
             </Button>
             <Button className="flex-1 md:flex-none h-12 bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] text-white transition-all active:scale-95 border border-indigo-500/50" onClick={() => navigate({ to: "/focus" })}>
               <Play className="mr-2 h-4 w-4 fill-current" /> Start Focus
             </Button>
          </div>
        </motion.header>

        {/* BENTO BOX GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* STATS BENTO ROW (Spans full width, internal grid) */}
          <motion.div variants={itemVariants} className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
              icon={<Target className="text-blue-400 h-5 w-5" />}
              label="Today's Progress" 
              value={`${stats.completed}/${stats.total}`} 
              sub={`${stats.pct}% Completion Rate`} 
            />
            <StatCard 
              icon={<Flame className="text-orange-400 h-5 w-5" />}
              label="Active Streak" 
              value={`${bestStreak} Days`} 
              sub="Personal Best" 
            />
            <StatCard 
              icon={<Trophy className="text-amber-400 h-5 w-5" />}
              label="Lifetime XP" 
              value={String(xp)} 
              sub="Growth metric" 
            />
            <StatCard 
              icon={<Zap className="text-indigo-400 h-5 w-5" />}
              label="Dopamine Score" 
              value={String(score)} 
              sub={(color as any)?.label || "Balanced"} 
              accent={(color as any)?.hex || "#818cf8"} 
            />
          </motion.div>

          {/* MAIN HABITS BENTO (Spans 8 columns on large screens) */}
          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-8 rounded-[2rem] border border-white/5 bg-slate-900/20 backdrop-blur-3xl p-6 sm:p-8 shadow-2xl flex flex-col h-full relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Daily Matrix</h2>
                <p className="text-slate-400 text-sm mt-1">Consistency compounds. Tick them off.</p>
              </div>
              <AddHabitDialog
                onAdd={(d) => { addHabit(d); toast.success("Habit initialized in the matrix."); }}
                trigger={
                  <Button variant="outline" size="sm" className="h-10 rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white transition-all text-slate-300 backdrop-blur-md">
                    <Plus className="mr-2 h-4 w-4" /> Add Habit
                  </Button>
                }
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 flex-grow">
              <AnimatePresence mode="popLayout">
                {displayedHabits.length > 0 ? (
                  displayedHabits.map((h, i) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: smoothEase }}
                    >
                      <HabitCard 
                        habit={h} 
                        onToggle={() => toggleToday(h.id)} 
                        onEdit={(d) => updateHabit(h.id, d)} 
                        onDelete={() => deleteHabit(h.id)} 
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                    <Target className="h-10 w-10 text-slate-600 mb-3" />
                    <p className="text-slate-400 text-sm">Your matrix is empty.</p>
                    <p className="text-slate-500 text-xs mt-1">Add a habit to start building momentum.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {habits.length > 4 && (
              <motion.div className="mt-8 pt-4 border-t border-white/5 relative z-10" layout>
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all h-12" 
                  onClick={() => setShowAllHabits(!showAllHabits)}
                >
                  {showAllHabits ? (
                    <><ChevronUp className="mr-2 h-4 w-4" /> Collapse Matrix</>
                  ) : (
                    <><ChevronDown className="mr-2 h-4 w-4" /> Reveal all {habits.length} habits</>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* SIDEBAR BENTO (Spans 4 columns on large screens) */}
          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            {/* Quote of the Day Card */}
            {dailyQuote && (
              <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                {/* Large Background Quote Icon */}
                <div className="absolute -top-6 -right-6 text-white/[0.02] group-hover:text-white/[0.04] transition-colors duration-500 pointer-events-none">
                  <Quote className="w-32 h-32 rotate-12" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
                    <Quote className="h-3 w-3" /> Daily Insight
                  </div>
                  
                  <blockquote className="text-[1.05rem] font-medium text-slate-200 leading-relaxed mb-6 flex-grow">
                    "{dailyQuote.quote}"
                  </blockquote>
                  
                  <div className="flex flex-col border-t border-white/10 pt-4 mt-auto">
                    <span className="text-sm font-bold text-white tracking-tight">{dailyQuote.author}</span>
                    <span className="text-xs text-slate-400 mt-1 line-clamp-2">
                      <span className="font-semibold text-indigo-400">Action: </span> 
                      {dailyQuote.application}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Challenge Card */}
            <div className="rounded-[2rem] border border-indigo-500/20 bg-indigo-950/20 p-6 sm:p-7 shadow-2xl backdrop-blur-3xl group transition-all relative overflow-hidden flex flex-col">
               {/* Decorative Gradient */}
               <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
               <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-600/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700" />

               <div className="relative z-10">
                 <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                   <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.25em] bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                      <Zap className="h-3 w-3" /> Daily Challenge
                   </div>
                   <span className="text-xs font-mono text-indigo-300/50">OUTSTAND</span>
                 </div>
                 
                 <h3 className="text-2xl font-display font-bold text-white group-hover:text-indigo-100 transition-colors leading-tight">
                   {challenge.title}
                 </h3>
                 <p className="text-sm font-medium text-indigo-200/60 mt-3 leading-relaxed line-clamp-3">
                   {challenge.description}
                 </p>
               </div>

               <div className="relative z-10 mt-6 pt-2">
                 <Button 
                    className="w-full h-12 rounded-xl transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] active:scale-95 border border-indigo-400/30" 
                    onClick={() => navigate({ to: "/outstand" })}
                  >
                   Accept Challenge
                 </Button>
               </div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* ONBOARDING WIZARD OVERLAY (Enhanced Glassmorphism) */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.4 } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.7 }}
              className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-8 md:p-10 shadow-[0_0_80px_rgba(79,70,229,0.2)] backdrop-blur-2xl relative overflow-hidden"
            >
               <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />
               <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none" />

               <div className="relative z-10">
                 <h2 className="text-3xl font-display font-black tracking-tight text-white mb-2">Establish your baseline.</h2>
                 <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                   Your dashboard is empty. Select a high-leverage habit below to initialize your tracking matrix and build immediate momentum.
                 </p>

                 <div className="space-y-3">
                   {quickStartHabits.map((habit) => (
                     <motion.button
                       key={habit.name}
                       whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => {
                         addHabit({ name: habit.name, emoji: habit.emoji, color: habit.color as any });
                         toast.success(`${habit.name} initialized.`);
                       }}
                       className="w-full flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left transition-all hover:border-indigo-500/30 group shadow-lg"
                     >
                       <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950/50 border border-white/5 shadow-inner group-hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all text-slate-300 group-hover:text-indigo-400">
                         {habit.icon}
                       </div>
                       <div>
                         <div className="font-bold text-white group-hover:text-indigo-400 transition-colors tracking-tight text-sm md:text-base">{habit.name}</div>
                         <div className="text-xs text-slate-500 mt-0.5">{habit.reason}</div>
                       </div>
                       <Plus className="ml-auto h-5 w-5 text-slate-600 group-hover:text-indigo-500 transition-colors" />
                     </motion.button>
                   ))}
                 </div>

                 <Button 
                   variant="ghost" 
                   onClick={() => setDismissedWizard(true)} 
                   className="w-full mt-6 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl tracking-wide text-sm h-12"
                 >
                   Skip and build my own
                 </Button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Updated StatCard for the Bento Layout
function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.04)" }}
      className="rounded-[1.5rem] border border-white/5 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between h-full shadow-lg"
    >
      {/* Interactive Radial Hover Gradient */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
        style={{ background: `radial-gradient(circle 120px at top right, ${accent ? accent + '15' : 'rgba(255,255,255,0.03)'}, transparent)` }} 
      />
      
      <div className="relative z-10 flex items-start justify-between w-full mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
          {icon}
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">{label}</div>
        <div className="font-display text-2xl sm:text-3xl font-black tracking-tight mt-1" style={{ color: accent || 'white' }}>{value}</div>
        <div className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1">{sub}</div>
      </div>
    </motion.div>
  );
}
