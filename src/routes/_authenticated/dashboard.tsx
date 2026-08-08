import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

import { XpBadge } from '../../components/xp-badge';
import { NeonCity } from '../../components/dashboard/NeonCity';
import { QUOTES } from '../../lib/quotes';

import { Flame, Loader2, AlertCircle, Wifi, WifiOff, CheckCircle2, Circle, Target, ChevronRight } from 'lucide-react';
import type { UserStats, DailyQuest } from '../../types/dashboard';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardHQ,
});

function DashboardHQ() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Commander");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [habits, setHabits] = useState<DailyQuest[]>([]);
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());

  // Random Daily Quote
  const dailyQuote = useMemo(() => {
    if (Array.isArray(QUOTES) && QUOTES.length > 0) {
      return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }
    return { quote: "Discipline equals freedom.", author: "Jocko Willink" };
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required.");
      const uid = session.user.id;
      setUserId(uid);

      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.username || "Commander";
      setUserName(name.split(' ')[0]);

      const localDate = new Date().toLocaleDateString('en-CA');

      const [statsRes, habitsRes] = await Promise.all([
        supabase.from('user_stats').select('*').eq('user_id', uid).single(),
        supabase.from('daily_quests').select('id, completed, quests(id, title, category, difficulty, xp_reward)').eq('user_id', uid).eq('assigned_date', localDate),
      ]);

      if (statsRes.error && statsRes.error.code !== 'PGRST116') throw new Error(statsRes.error.message);

      setStats({
        total_xp: statsRes.data?.total_xp ?? 0,
        level: statsRes.data?.level ?? 1,
        current_level_xp: statsRes.data?.current_level_xp ?? 0,
        next_level_xp: statsRes.data?.next_level_xp ?? 1000,
        streak_days: statsRes.data?.streak_days ?? 0,
      });

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
              category: qData.category,
              difficulty: qData.difficulty,
              xp_reward: qData.xp_reward
            }
          };
        }).filter((q): q is DailyQuest => q !== null && q.quest.category !== 'Outstand');
        setHabits(mappedHabits);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    if (!userId) return;

    const channel = supabase.channel(`dashboard_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${userId}` }, loadDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_quests', filter: `user_id=eq.${userId}` }, loadDashboardData);

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') setConnectionStatus('connected');
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnectionStatus('disconnected');
    });

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleCompleteHabit = async (habitId: string) => {
    if (mutatingIds.has(habitId)) return;
    setMutatingIds(prev => new Set(prev).add(habitId));

    toast.promise(
      supabase.rpc('complete_daily_quest', { p_daily_quest_id: habitId }).then(({ data, error }) => {
        if (error) throw new Error(error.message);
        if (data === false) throw new Error("ALREADY_DONE");
        return data;
      }),
      {
        loading: 'Verifying execution...',
        success: 'Habit Executed! XP Awarded.',
        error: (err) => err.message === "ALREADY_DONE" ? "Already verified." : "Decryption failed."
      }
    );

    setMutatingIds(prev => { const next = new Set(prev); next.delete(habitId); return next; });
  };

  const completedCount = habits.filter(h => h.completed).length;
  const completionPercent = habits.length === 0 ? 0 : Math.round((completedCount / habits.length) * 100);
  const xpProgressPercent = stats ? Math.min(100, Math.max(0, (stats.current_level_xp / stats.next_level_xp) * 100)) : 0;

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 space-y-5">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="text-xs font-black tracking-widest uppercase text-cyan-300">Initializing Grid...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-red-500/30 p-10 rounded-3xl max-w-md text-center shadow-[0_0_40px_rgba(239,68,68,0.15)]">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-5 animate-pulse" />
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Network Severed</h2>
          <p className="text-slate-400 text-sm mb-8">{error || "Unable to connect to Outstand servers."}</p>
          <button onClick={loadDashboardData} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]">
            Reboot Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-12 pb-24">
        
        {/* 1. WELCOME HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome to Outstand,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                {userName}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-900/50 border border-white/5 px-3 py-2 rounded-xl" aria-live="polite">
              {connectionStatus === 'connected' ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5">
              <Flame className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="text-lg font-black text-white">{stats.streak_days}</span>
            </div>

            <div className="transition-transform hover:-translate-y-0.5">
              <XpBadge xp={stats.total_xp} level={stats.level} pct={xpProgressPercent} variantId="dash-header" />
            </div>
          </div>
        </header>

        {/* 2. DAILY QUOTE */}
        <section className="relative px-6 py-8 rounded-3xl bg-slate-900/30 border border-white/5 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-700 delay-100 ease-out">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-500 to-indigo-500 rounded-l-3xl shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          <blockquote className="text-center">
            <p className="text-lg md:text-xl font-semibold text-slate-200 italic tracking-wide leading-relaxed drop-shadow-md">
              "{dailyQuote.quote}"
            </p>
            <footer className="mt-4 text-xs font-black uppercase tracking-widest text-cyan-400">
              — {dailyQuote.author}
            </footer>
          </blockquote>
        </section>

        {/* 3. NEON CITY */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 ease-out">
          <NeonCity level={stats.level} completionPercent={completionPercent} />
        </section>

        {/* 4. HABITS / EXECUTION LIST */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 ease-out">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white tracking-tight">Daily Execution</h2>
            <span className="text-sm font-bold text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              {completionPercent}%
            </span>
          </div>

          <div className="grid gap-4">
            {habits.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm font-medium border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                Grid clear. No habits assigned for today.
              </div>
            ) : (
              habits.map((habit) => {
                const isMutating = mutatingIds.has(habit.id);
                return (
                  <button
                    key={habit.id}
                    disabled={habit.completed || isMutating}
                    onClick={() => handleCompleteHabit(habit.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ease-out flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 group ${
                      habit.completed
                        ? 'bg-slate-950/50 border-slate-800/50 text-slate-500 cursor-default'
                        : 'bg-slate-900/50 backdrop-blur-md border-white/5 hover:border-cyan-500/40 hover:bg-slate-800/80 hover:shadow-[0_8px_30px_-10px_rgba(34,211,238,0.2)] hover:-translate-y-1 active:scale-[0.98] cursor-pointer disabled:opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                        {isMutating ? (
                          <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                        ) : habit.completed ? (
                          <CheckCircle2 className="w-7 h-7 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        ) : (
                          <Circle className="w-7 h-7 text-slate-600 transition-colors group-hover:text-cyan-400/50" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold text-lg tracking-tight transition-colors duration-300 ${habit.completed ? 'line-through opacity-50' : 'text-slate-100 group-hover:text-white'}`}>
                          {habit.quest.title}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {habit.quest.category}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`text-sm font-black px-4 py-2 rounded-xl border shrink-0 transition-all duration-300 ${habit.completed ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:bg-cyan-500/20'}`}>
                      +{habit.quest.xp_reward} XP
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* 5. OUTSTAND GATEWAY (Router-Safe Integration) */}
        <section className="pt-8 animate-in fade-in duration-1000 delay-500">
          <div className="mb-6 flex items-center gap-3">
             <div className="w-2 h-8 bg-violet-500 rounded-full shadow-[0_0_10px_#8b5cf6]" />
             <h2 className="text-2xl font-black text-white tracking-tight">Outstand Mastery</h2>
          </div>
          
          <Link 
            to="/outstand"
            className="group relative block w-full overflow-hidden rounded-3xl bg-slate-900/40 border border-violet-500/20 hover:border-violet-500/50 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)] group-hover:scale-110 transition-transform duration-500">
                     <Target className="w-8 h-8 text-violet-400" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-white tracking-tight mb-1 group-hover:text-violet-300 transition-colors">Elite Challenges</h3>
                     <p className="text-sm text-slate-400 font-medium">Access high-yield assignments to accelerate your progression.</p>
                  </div>
               </div>
               <div className="shrink-0 bg-violet-600 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 group-hover:bg-violet-500 transition-colors shadow-[0_0_20px_rgba(139,92,246,0.4)] group-active:scale-[0.98]">
                  Enter Portal <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </Link>
        </section>

      </div>
    </div>
  );
}
