import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Play, Zap, ChevronDown, ChevronUp, Droplets, BookOpen, Brain } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Components
import { AddHabitDialog, HabitCard } from "@/components/habit-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Hooks & Libs
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useDailyLog } from "@/hooks/use-dopamine";
import { todayISO } from "@/lib/habits";
import { dailyChallenge } from "@/lib/Index";
import { scoreColor } from "@/lib/dopamine";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

// Premium easing curve
const smoothEase = [0.22, 1, 0.36, 1];

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

  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const challenge = dailyChallenge(today) ?? { title: "Stay Consistent", description: "Complete all your daily tasks." };

  const displayedHabits = showAllHabits ? habits : habits.slice(0, 3);
  
  // Triggers the wizard if the user has 0 habits and hasn't manually dismissed it
  const showWizard = habits.length === 0 && !dismissedWizard;

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, ease: smoothEase } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: smoothEase } }
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
        className="mx-auto max-w-7xl space-y-10 pb-20 pt-4"
      >
        {/* Header Section */}
        <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black tracking-tight text-white">
              Welcome back, <span className="text-indigo-400">{name}.</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              {stats.pct >= 80 
                ? "You're on a roll! Keep that momentum going." 
                : "Let's turn your intentions into action today."}
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" className="rounded-xl transition-transform active:scale-95" onClick={() => navigate({ to: "/dopamine" })}>
               Log Dopamine
             </Button>
             <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95" onClick={() => navigate({ to: "/focus" })}>
               <Play className="mr-2 h-4 w-4 fill-current" /> Start Focus
             </Button>
          </div>
        </motion.header>

        {/* Hero Stats Grid */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today" value={`${stats.completed}/${stats.total}`} sub={`${stats.pct}% Complete`} />
          <StatCard label="Streak" value={String(bestStreak)} sub="Best active" />
          <StatCard label="Total XP" value={String(xp)} sub="Lifetime growth" />
          <StatCard label="Dopamine" value={String(score)} sub={(color as any)?.label || "Balanced"} accent={(color as any)?.hex || "#818cf8"} />
        </motion.section>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-white">Today's Habits</h2>
              <AddHabitDialog
                onAdd={(d) => { addHabit(d); toast.success("Habit created"); }}
                trigger={<Button variant="outline" size="sm" className="rounded-lg hover:text-indigo-400 transition-colors"><Plus className="mr-2 h-4 w-4" /> Add Habit</Button>}
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {displayedHabits.map((h, i) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: smoothEase }}
                  >
                    <HabitCard 
                      habit={h} 
                      onToggle={() => toggleToday(h.id)} 
                      onEdit={(d) => updateHabit(h.id, d)} 
                      onDelete={() => deleteHabit(h.id)} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {habits.length > 3 && (
              <Button 
                variant="ghost" 
                className="w-full text-slate-400 hover:text-white rounded-xl transition-colors" 
                onClick={() => setShowAllHabits(!showAllHabits)}
              >
                {showAllHabits ? (
                  <><ChevronUp className="mr-2 h-4 w-4" /> Show less</>
                ) : (
                  <><ChevronDown className="mr-2 h-4 w-4" /> View all {habits.length} habits</>
                )}
              </Button>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.aside variants={itemVariants} className="space-y-6">
            <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 p-6 md:p-8 shadow-xl backdrop-blur-xl group hover:bg-slate-900/60 transition-colors">
               <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                  <Zap className="h-4 w-4" /> Daily Challenge
               </div>
               <h3 className="text-xl font-display font-bold text-white group-hover:text-indigo-100 transition-colors">{challenge.title}</h3>
               <p className="text-sm font-medium text-slate-500 my-4 leading-relaxed">{challenge.description}</p>
               <Button className="w-full rounded-xl active:scale-95 transition-transform bg-white/5 hover:bg-white/10 text-white" variant="ghost" onClick={() => navigate({ to: "/outstand" })}>
                 View Challenge
               </Button>
            </div>
          </motion.aside>
        </div>
      </motion.div>

      {/* ONBOARDING WIZARD OVERLAY */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.7 }}
              className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-slate-950 p-8 md:p-10 shadow-[0_0_80px_rgba(59,130,246,0.15)] relative overflow-hidden"
            >
               {/* Ambient Glow */}
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />
               <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none" />

               <div className="relative z-10">
                 <h2 className="text-3xl font-display font-black tracking-tight text-white mb-3">Establish your baseline.</h2>
                 <p className="text-slate-400 mb-8 text-sm md:text-base leading-relaxed">
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
                       className="w-full flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:border-blue-500/30 group"
                     >
                       <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-white/5 shadow-inner group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all text-slate-300 group-hover:text-blue-400">
                         {habit.icon}
                       </div>
                       <div>
                         <div className="font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">{habit.name}</div>
                         <div className="text-xs text-slate-500 mt-0.5">{habit.reason}</div>
                       </div>
                       <Plus className="ml-auto h-5 w-5 text-slate-600 group-hover:text-blue-500 transition-colors" />
                     </motion.button>
                   ))}
                 </div>

                 <Button 
                   variant="ghost" 
                   onClick={() => setDismissedWizard(true)} 
                   className="w-full mt-6 text-slate-500 hover:text-white rounded-xl tracking-wide text-sm"
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

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.04)" }}
      className="rounded-[1.5rem] border border-white/5 bg-slate-900/40 p-5 backdrop-blur-xl transition-all duration-300 relative overflow-hidden group"
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
        style={{ background: `radial-gradient(circle 100px at center, ${accent ? accent + '20' : 'rgba(255,255,255,0.05)'}, transparent)` }} 
      />
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold relative z-10">{label}</div>
      <div className="font-display text-3xl font-black tracking-tight mt-2 relative z-10" style={{ color: accent || 'white' }}>{value}</div>
      <div className="text-xs font-medium text-slate-500 mt-1 relative z-10">{sub}</div>
    </motion.div>
  );
  }
