import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '../../integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Your existing components & files
import { XpBadge } from '../../components/xp-badge';
import { QUOTES } from '../../lib/quotes';
import { Quality } from '../../lib/portal-effect'; // Importing your portal types
import { NeonCity } from '../../components/dashboard/NeonCity';

// @ts-ignore - Safely grabbing the Outstand route component
import { Route as OutstandRoute } from './outstand';

import { Flame, Target, CheckCircle2, Circle, Quote, Zap, X, Loader2 } from 'lucide-react';
import type { DailyQuest } from '../../types/dashboard';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardHQ,
});

function DashboardHQ() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Commander");
  const [habits, setHabits] = useState<DailyQuest[]>([]);
  
  // Real stats mapped directly to your XpBadge and Streak
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpPct, setXpPct] = useState(0);
  const [streak, setStreak] = useState(0);

  // Portal State
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const portalCanvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Fetch Real User Data & Habits
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;

        // Get Real Name from Onboarding
        const rawName = session.user.user_metadata?.full_name || session.user.user_metadata?.first_name;
        if (rawName) setUserName(rawName.split(' ')[0]);

        const localDate = new Date().toLocaleDateString('en-CA');

        const [statsRes, habitsRes] = await Promise.all([
          supabase.from('user_stats').select('*').eq('user_id', uid).single(),
          supabase.from('daily_quests').select('id, completed, quests(id, title, category, difficulty, xp_reward)').eq('user_id', uid).eq('assigned_date', localDate),
        ]);

        if (statsRes.data) {
          setTotalXp(statsRes.data.total_xp || 0);
          setLevel(statsRes.data.level || 1);
          setStreak(statsRes.data.streak_days || 0);
          
          // Math for your XpBadge pct prop
          const currentLevelXp = statsRes.data.current_level_xp || 0;
          const nextLevelXp = statsRes.data.next_level_xp || 1000;
          setXpPct(Math.min(100, Math.max(0, (currentLevelXp / nextLevelXp) * 100)));
        }

        if (habitsRes.data) {
          const mappedHabits: DailyQuest[] = habitsRes.data.map((row) => {
            const qData = Array.isArray(row.quests) ? row.quests[0] : row.quests;
            if (!qData) return null;
            return {
              id: row.id,
              completed: row.completed || false,
              quest: {
                id: qData.id,
                title: qData.title,
                category: qData.category as any,
                difficulty: qData.difficulty as any,
                xp_reward: qData.xp_reward
              }
            };
          }).filter((q): q is DailyQuest => q !== null && q.quest.category !== 'Outstand');
          setHabits(mappedHabits);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // 2. Random Daily Quote
  const dailyQuote = useMemo(() => {
    if (Array.isArray(QUOTES) && QUOTES.length > 0) {
      return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }
    return { quote: "Discipline equals freedom.", author: "Jocko Willink", application: "Keep executing." };
  }, []);

  // 3. Mark Habit Complete
  const handleCompleteHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.completed) return;

    // Optimistic UI Update
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: true } : h));

    const { error } = await supabase.rpc('complete_daily_quest', { p_daily_quest_id: habitId });
    if (error) {
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: false } : h));
      toast.error("Execution verification failed.");
    } else {
      toast.success("Habit Executed!");
      // Briefly boost local XP for UI feel (real refresh will happen via realtime)
      setTotalXp(prev => prev + habit.quest.xp_reward);
    }
  };

  // 4. Portal Initialization Hook
  useEffect(() => {
    if (isPortalOpen && portalCanvasRef.current) {
      // @TODO: Initialize your THREE.js portal effect here
      // Example: 
      // const portal = new PortalEffect(portalCanvasRef.current, { quality: Quality.ULTRA });
      // return () => portal.dispose();
    }
  }, [isPortalOpen]);

  if (isLoading) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans overflow-x-hidden">
      
      {/* --- PORTAL OVERLAY (Activates on "Enter Portal" click) --- */}
      <AnimatePresence>
        {isPortalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto"
          >
            {/* The Canvas for src/lib/portal-effect.ts */}
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none mix-blend-screen">
              <canvas ref={portalCanvasRef} className="w-full h-full" />
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="p-6 flex justify-end">
                <button 
                  onClick={() => setIsPortalOpen(false)}
                  className="bg-slate-900/80 border border-white/10 p-3 rounded-full hover:bg-red-500/20 hover:border-red-500 hover:text-red-400 transition-all focus:outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 p-4 md:p-8">
                {OutstandRoute.options.component ? (
                  <OutstandRoute.options.component />
                ) : (
                  <div className="text-center text-violet-400 font-black tracking-widest mt-20">
                    OUTSTAND MODULE LOADING...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-12 pb-24">
        
        {/* 1. HEADER: Real Name & Top-Right Streak/XP */}
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome to Outstand,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                {userName}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak */}
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl">
              <Flame className="w-6 h-6 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
              <span className="text-xl font-black text-white">{streak}</span>
            </div>

            {/* YOUR XpBadge EXACTLY AS REQUESTED */}
            <XpBadge xp={totalXp} level={level} pct={xpPct} variantId="dash-header" />
          </div>
        </header>

        {/* 2. DAILY QUOTES */}
        <section className="relative px-8 py-10 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center gap-8 group animate-in fade-in zoom-in-95 duration-700 delay-100 ease-out">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-400 to-fuchsia-500 rounded-l-[2rem] shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
          <Quote className="w-16 h-16 text-cyan-400/20 shrink-0 transform -rotate-12 group-hover:rotate-0 group-hover:text-cyan-400/40 transition-all duration-500" />
          <div>
            <p className="text-xl md:text-2xl font-bold text-slate-200 italic tracking-wide leading-relaxed drop-shadow-md">
              "{dailyQuote.quote}"
            </p>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-sm font-black uppercase tracking-[0.3em] text-fuchsia-400">
                — {dailyQuote.author}
              </span>
              <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-700" />
              <span className="text-xs font-bold text-slate-400 tracking-wide">
                {dailyQuote.application}
              </span>
            </div>
          </div>
        </section>

        {/* 3. CITY */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 ease-out">
          <NeonCity level={level} completionPercent={habits.length > 0 ? (habits.filter(h => h.completed).length / habits.length) * 100 : 0} />
        </section>

        {/* 4. ENERGETIC HABITS */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 ease-out">
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
            <Target className="w-8 h-8 text-cyan-400" /> 
            Your Habits
          </h2>

          <div className="grid gap-4">
            {habits.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm font-black uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-900/20">
                No habits assigned.
              </div>
            ) : (
              habits.map((habit, idx) => {
                // Vibrant alternating colors
                const accent = idx % 2 === 0 ? 'cyan' : 'fuchsia';
                
                return (
                  <button
                    key={habit.id}
                    disabled={habit.completed}
                    onClick={() => handleCompleteHabit(habit.id)}
                    className={`w-full text-left p-6 sm:p-8 rounded-[2rem] border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group focus-visible:outline-none ${
                      habit.completed
                        ? 'bg-slate-950/40 border-slate-800/50 text-slate-600 cursor-default'
                        : `bg-slate-900/60 backdrop-blur-xl border-white/10 hover:border-${accent}-400/50 hover:bg-slate-800 hover:shadow-[0_10px_40px_-15px_rgba(var(--tw-color-${accent}-400),0.3)] cursor-pointer active:scale-95`
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="shrink-0 transition-transform duration-500 group-hover:scale-110">
                        {habit.completed ? (
                          <CheckCircle2 className="w-9 h-9 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        ) : (
                          <Circle className={`w-9 h-9 text-slate-600 group-hover:text-${accent}-400 transition-colors duration-300`} />
                        )}
                      </div>
                      <div>
                        <p className={`font-black text-2xl tracking-tight transition-colors duration-300 ${habit.completed ? 'line-through opacity-50 text-slate-600' : 'text-white'}`}>
                          {habit.quest.title}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
                          {habit.quest.category}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`text-lg font-black px-6 py-3 rounded-2xl border shrink-0 transition-all duration-300 ${
                      habit.completed 
                        ? 'bg-slate-950 border-slate-800 text-slate-700' 
                        : `bg-${accent}-500/10 border-${accent}-500/30 text-${accent}-400 shadow-[0_0_20px_rgba(var(--tw-color-${accent}-400),0.15)] group-hover:shadow-[0_0_30px_rgba(var(--tw-color-${accent}-400),0.4)]`
                    }`}>
                      +{habit.quest.xp_reward} XP
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* 5. OUTSTAND PORTAL BUTTON */}
        <section className="pt-10 pb-20 animate-in fade-in duration-1000 delay-500">
          <button
            onClick={() => setIsPortalOpen(true)}
            className="w-full relative overflow-hidden rounded-[2.5rem] bg-slate-950 border border-violet-500/30 p-1 shadow-[0_0_50px_rgba(139,92,246,0.2)] group transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 opacity-30 group-hover:opacity-60 transition-opacity duration-700 blur-xl" />
            <div className="bg-black/90 backdrop-blur-2xl rounded-[2.3rem] p-12 flex flex-col items-center justify-center relative z-10">
              <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-6 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all duration-500">
                <Zap className="w-10 h-10 text-violet-400 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-[0.2em] mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Enter Portal</h3>
              <p className="text-slate-400 font-bold tracking-widest text-sm uppercase">Initialize Outstand Sequence</p>
            </div>
          </button>
        </section>

      </div>
    </div>
  );
                      }
