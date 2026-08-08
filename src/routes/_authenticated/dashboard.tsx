import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '../../integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Your existing components & files
import { XpBadge } from '../../components/xp-badge';
import { QUOTES } from '../../lib/quotes';
import { PortalEngine, Quality } from '../../lib/portal-effect';

// Safely grabbing the Outstand route component
// @ts-ignore
import { Route as OutstandRoute } from './outstand';

import { 
  Flame, CheckCircle2, Quote, Zap, X, Loader2, 
  Sword, Shield, Crosshair, Target
} from 'lucide-react';

import type { DailyQuest } from '../../types/dashboard';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardHQ,
});

// Smooth animations
const ease = [0.22, 1, 0.36, 1];

function DashboardHQ() {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Commander");
  
  // Stats & Habits
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpPct, setXpPct] = useState(0);
  const [streak, setStreak] = useState(0);
  const [habits, setHabits] = useState<DailyQuest[]>([]);
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());

  // Portal State
  const [isPortalActive, setIsPortalActive] = useState(false);
  const [isPortalFullyOpen, setIsPortalFullyOpen] = useState(false);
  const portalRef = useRef<any>(null);
  
  // NEW: Ref to mount the WebGL Canvas
  const portalContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Real User Data & Name
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;
        setUserId(uid);

        // Fetch REAL name from onboarding
        const rawName = session.user.user_metadata?.full_name || session.user.user_metadata?.first_name || session.user.user_metadata?.username;
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

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`dashboard_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${userId}` }, () => { /* re-fetch logic here if needed */ })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // 2. Random Daily Quote
  const dailyQuote = useMemo(() => {
    if (Array.isArray(QUOTES) && QUOTES.length > 0) {
      return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }
    return { quote: "Discipline equals freedom.", author: "Jocko Willink", application: "Execute." };
  }, []);

  // 3. Mark Habit Complete
  const handleCompleteHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.completed || mutatingIds.has(habitId)) return;

    setMutatingIds(prev => new Set(prev).add(habitId));

    // Optimistic UI Update
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: true } : h));

    const { error } = await supabase.rpc('complete_daily_quest', { p_daily_quest_id: habitId });
    
    if (error) {
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: false } : h));
      toast.error("Execution verification failed.");
    } else {
      toast.success("Habit Executed! XP Awarded.");
      setTotalXp(prev => prev + habit.quest.xp_reward);
    }
    setMutatingIds(prev => { const next = new Set(prev); next.delete(habitId); return next; });
  };

  // 4. Portal Engine Lifecycle
  useEffect(() => {
    // Only initialize if the portal is active AND the container DOM element exists
    if (isPortalActive && portalContainerRef.current) {
      portalRef.current = new PortalEngine({
        container: portalContainerRef.current, // <-- Hooking up the DOM element
        quality: Quality.ULTRA,
        onOpen: () => {
          // Triggered when cinematic tear finishes
          setIsPortalFullyOpen(true);
        }
      });
      portalRef.current.open();
    }

    return () => {
      // Cleanup WebGL on close
      if (portalRef.current) {
        portalRef.current.dispose();
        portalRef.current = null;
      }
    };
  }, [isPortalActive]);

  const closePortal = () => {
    setIsPortalActive(false);
    setIsPortalFullyOpen(false);
    if (portalRef.current) {
      portalRef.current.dispose();
      portalRef.current = null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin" />
      </div>
    );
  }

  const getIconForHabit = (difficulty: string) => {
    switch(difficulty) {
      case 'hard': return <Sword className="w-8 h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />;
      case 'medium': return <Shield className="w-8 h-8 text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.6)]" />;
      default: return <Crosshair className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050012] text-slate-100 p-4 md:p-8 font-sans overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 3D PORTAL OVERLAY */}
      {/* ========================================================================= */}
      {isPortalActive && (
        <div className="fixed inset-0 z-[10000] flex flex-col bg-black/90">
          
          {/* NEW: Canvas Container for PortalEngine */}
          <div 
            ref={portalContainerRef} 
            className="absolute inset-0 z-[10000] pointer-events-none overflow-hidden" 
          />

          {/* Close Button (z-index higher than the WebGL canvas) */}
          <div className="absolute top-6 right-6 z-[10002]">
            <button 
              onClick={closePortal}
              className="bg-black/60 backdrop-blur-xl border border-white/20 p-3 rounded-full hover:bg-red-500/20 hover:border-red-500 transition-all focus:outline-none shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Render Outstand Component Once Portal is Open */}
          <AnimatePresence>
            {isPortalFullyOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.8, ease }}
                className="relative z-[10001] flex-1 overflow-y-auto px-4 md:px-8 pb-20 pt-24"
              >
                {OutstandRoute.options.component ? (
                  <OutstandRoute.options.component />
                ) : (
                  <div className="text-center text-violet-400 font-black tracking-widest text-2xl mt-32 drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]">
                    MODULE LOADING...
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN DASHBOARD */}
      {/* ========================================================================= */}
      <div className="max-w-5xl mx-auto space-y-12 pb-24 relative z-10">
        
        {/* 1. HEADER (Welcome Left, XP/Streak Top Right) */}
        <header className="flex justify-between items-start animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="pt-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-400 tracking-tight">
              Welcome to Outstand,
            </h1>
            <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 drop-shadow-[0_0_20px_rgba(217,70,239,0.3)] leading-tight mt-1">
              {userName}
            </h2>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-xl hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
              <span className="text-xl font-black text-white">{streak}</span>
            </div>

            <div className="hover:scale-105 transition-transform">
              <XpBadge xp={totalXp} level={level} pct={xpPct} variantId="dash-header" />
            </div>
          </div>
        </header>

        {/* 2. ENERGETIC DAILY QUOTE */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
          className="relative px-8 py-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-950/40 to-[#0a0020] border border-cyan-500/20 shadow-[0_20px_50px_-20px_rgba(34,211,238,0.2)] group"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-400 to-fuchsia-500 rounded-l-[2.5rem] shadow-[0_0_30px_rgba(34,211,238,0.6)]" />
          <Quote className="absolute -top-6 right-6 w-24 h-24 text-cyan-400/10 transform -rotate-12 group-hover:rotate-0 group-hover:text-cyan-400/20 transition-all duration-700" />
          
          <div>
            <p className="text-xl md:text-2xl font-bold text-slate-200 italic tracking-wide leading-relaxed drop-shadow-md">
              "{dailyQuote.quote}"
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400 bg-cyan-950/50 px-4 py-1.5 rounded-full border border-cyan-500/30">
                {dailyQuote.author}
              </span>
              {dailyQuote.application && (
                <span className="text-sm font-medium text-slate-400">
                  {dailyQuote.application}
                </span>
              )}
            </div>
          </div>
        </motion.section>

        {/* 3. YOUR HABITS (With Energetic Icons & Micro-transitions) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="space-y-6"
        >
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
            <Target className="w-8 h-8 text-fuchsia-500" /> 
            Daily Execution
          </h2>

          <div className="grid gap-4">
            {habits.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm font-black uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/20">
                Grid clear. No active missions.
              </div>
            ) : (
              habits.map((habit) => {
                const isMutating = mutatingIds.has(habit.id);
                
                return (
                  <button
                    key={habit.id}
                    disabled={habit.completed || isMutating}
                    onClick={() => handleCompleteHabit(habit.id)}
                    className={`w-full text-left p-6 md:p-8 rounded-[2rem] border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500 focus-visible:ring-offset-4 focus-visible:ring-offset-black ${
                      habit.completed
                        ? 'bg-slate-950/40 border-slate-800/50 text-slate-600 cursor-default'
                        : `bg-slate-900/60 backdrop-blur-xl border-white/10 hover:border-cyan-500/40 hover:bg-slate-800 hover:shadow-[0_15px_40px_-10px_rgba(34,211,238,0.25)] cursor-pointer active:scale-95`
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="shrink-0 transition-transform duration-500 group-hover:scale-110 group-active:scale-90">
                        {isMutating ? (
                          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                        ) : habit.completed ? (
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                        ) : (
                          getIconForHabit(habit.quest.difficulty)
                        )}
                      </div>
                      <div>
                        <p className={`font-black text-2xl tracking-tight transition-colors duration-300 ${habit.completed ? 'line-through opacity-50 text-slate-600' : 'text-white group-hover:text-cyan-50'}`}>
                          {habit.quest.title}
                        </p>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                          {habit.quest.category} <span className="mx-2">•</span> {habit.quest.difficulty}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`text-lg font-black px-6 py-3 rounded-2xl border shrink-0 transition-all duration-300 ${
                      habit.completed 
                        ? 'bg-slate-950 border-slate-800 text-slate-700' 
                        : `bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] group-hover:bg-cyan-500/20`
                    }`}>
                      +{habit.quest.xp_reward} XP
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </motion.section>

        {/* 4. THE PORTAL BUTTON */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="pt-10 pb-20"
        >
          <button
            onClick={() => setIsPortalActive(true)}
            className="w-full relative overflow-hidden rounded-[3rem] bg-slate-950 border border-violet-500/30 p-1 shadow-[0_0_50px_rgba(139,92,246,0.15)] group transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 opacity-30 group-hover:opacity-60 transition-opacity duration-700 blur-2xl" />
            
            <div className="bg-[#050012]/90 backdrop-blur-3xl rounded-[2.8rem] p-12 flex flex-col items-center justify-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-6 group-hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all duration-500">
                <Zap className="w-12 h-12 text-violet-400 group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
              </div>
              <h3 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-[0.2em] mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                Enter Portal
              </h3>
              <p className="text-violet-300/80 font-black tracking-widest text-sm uppercase">
                Initialize Outstand Sequence
              </p>
            </div>
          </button>
        </motion.section>

      </div>
    </div>
  );
                            }
                                     
