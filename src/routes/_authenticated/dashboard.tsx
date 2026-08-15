import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '../../integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { XpBadge } from '../../components/xp-badge';
import { QUOTES } from '../../lib/quotes';
import { PortalEngine, Quality } from '../../lib/portal-effect';
import { CityEngine } from "@/components/city/CityEngine";
import { OutstandPage } from './outstand';
import { Flame, CheckCircle2, Quote, Zap, X, Loader2, Sword, Shield, Crosshair, Target } from 'lucide-react';
import type { DailyQuest } from '../../types/dashboard';

export const Route = createFileRoute('/_authenticated/dashboard')({ component: DashboardHQ });
const ease = [0.22, 1, 0.36, 1];

function DashboardHQ() {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Commander");
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpPct, setXpPct] = useState(0);
  const [streak, setStreak] = useState(0);
  const [habits, setHabits] = useState<DailyQuest[]>([]);
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());
  const [isPortalActive, setIsPortalActive] = useState(false);
  const [isPortalFullyOpen, setIsPortalFullyOpen] = useState(false);
  const portalRef = useRef<PortalEngine | null>(null);
  const portalContainerRef = useRef<HTMLDivElement>(null);

  const applyStats = (data: any) => {
    if (!data) return;
    setTotalXp(data.total_xp || 0);
    setLevel(data.level || 1);
    setStreak(data.streak_days || 0);
    const nextLevelXp = data.next_level_xp || 1000;
    setXpPct(Math.min(100, Math.max(0, ((data.current_level_xp || 0) / nextLevelXp) * 100)));
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;
        setUserId(uid);
        const rawName = session.user.user_metadata?.full_name || session.user.user_metadata?.first_name || session.user.user_metadata?.username;
        if (rawName) setUserName(rawName.split(' ')[0]);
        const localDate = new Date().toLocaleDateString('en-CA');
        const [statsRes, habitsRes] = await Promise.all([
          supabase.from('user_stats').select('*').eq('user_id', uid).single(),
          supabase.from('daily_quests').select('id, completed, quests(id, title, category, difficulty, xp_reward)').eq('user_id', uid).eq('assigned_date', localDate),
        ]);
        applyStats(statsRes.data);
        if (habitsRes.data) {
          const mappedHabits: DailyQuest[] = habitsRes.data.map((row) => {
            const qData = Array.isArray(row.quests) ? row.quests[0] : row.quests;
            if (!qData) return null;
            return { id: row.id, completed: row.completed || false, quest: { id: qData.id, title: qData.title, category: qData.category as any, difficulty: qData.difficulty as any, xp_reward: qData.xp_reward } };
          }).filter((q): q is DailyQuest => q !== null && q.quest.category !== 'Outstand');
          setHabits(mappedHabits);
        }
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const refreshStats = async () => {
      const { data } = await supabase.from('user_stats').select('total_xp, level, streak_days, current_level_xp, next_level_xp').eq('user_id', userId).single();
      applyStats(data);
    };
    const channel = supabase.channel(`dashboard_${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${userId}` }, refreshStats).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  const dailyQuote = useMemo(() => {
    if (Array.isArray(QUOTES) && QUOTES.length > 0) return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return { quote: "Discipline equals freedom.", author: "Jocko Willink", application: "Execute." };
  }, []);

  const handleCompleteHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.completed || mutatingIds.has(habitId)) return;
    setMutatingIds(prev => new Set(prev).add(habitId));
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

  useEffect(() => {
    if (!isPortalActive || !portalContainerRef.current || portalRef.current) return;
    const engine = new PortalEngine({ container: portalContainerRef.current, quality: Quality.ULTRA, onOpen: () => setIsPortalFullyOpen(true), onClose: () => setIsPortalFullyOpen(false) });
    portalRef.current = engine;
    engine.open();
    return () => { engine.dispose(); if (portalRef.current === engine) portalRef.current = null; setIsPortalFullyOpen(false); };
  }, [isPortalActive]);

  const closePortal = () => { setIsPortalActive(false); setIsPortalFullyOpen(false); portalRef.current?.dispose(); portalRef.current = null; };
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center"><Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin" /></div>;

  const getIconForHabit = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return <Sword className="w-8 h-8 text-amber-500" />;
      case 'medium': return <Shield className="w-8 h-8 text-fuchsia-500" />;
      default: return <Crosshair className="w-8 h-8 text-cyan-400" />;
    }
  };

  return <div className="min-h-screen bg-[#050012] text-slate-100 p-4 md:p-8 font-sans overflow-x-hidden">
    {isPortalActive && <div className="fixed inset-0 z-[10000] flex flex-col bg-black/90">
      <div ref={portalContainerRef} className="absolute inset-0 z-0 overflow-hidden" />
      <div className="absolute top-6 right-6 z-50"><button onClick={closePortal} className="bg-black/60 backdrop-blur-xl border border-white/20 p-3 rounded-full hover:bg-red-500/20 transition-all"><X className="w-6 h-6 text-white" /></button></div>
      <AnimatePresence>{isPortalFullyOpen && <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.8, ease }} className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 pb-20 pt-24"><OutstandPage /></motion.div>}</AnimatePresence>
    </div>}

    <div className="max-w-5xl mx-auto space-y-12 pb-24 relative z-10">
      <header className="flex justify-between items-start"><div className="pt-2"><h1 className="text-2xl md:text-3xl font-bold text-slate-400">Welcome to Outstand,</h1><h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 leading-tight mt-1">{userName}</h2></div><div className="flex flex-col items-end gap-3"><div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 px-4 py-2 rounded-2xl"><Flame className="w-5 h-5 text-amber-500" /><span className="text-xl font-black">{streak}</span></div><XpBadge xp={totalXp} level={level} pct={xpPct} variantId="dash-header" /></div></header>
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden bg-black"><div className="absolute top-6 left-8 z-10 pointer-events-none"><h2 className="text-3xl font-black">My City</h2><p className="text-slate-400 text-sm mt-1">Your progress visualizer</p></div><CityEngine /></motion.section>
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative px-8 py-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-950/40 to-[#0a0020] border border-cyan-500/20"><Quote className="absolute -top-6 right-6 w-24 h-24 text-cyan-400/10" /><p className="text-xl md:text-2xl font-bold text-slate-200 italic">"{dailyQuote.quote}"</p><div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4"><span className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">{dailyQuote.author}</span>{dailyQuote.application && <span className="text-sm text-slate-400">{dailyQuote.application}</span>}</div></motion.section>
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6"><h2 className="text-3xl font-black flex items-center gap-4"><Target className="w-8 h-8 text-fuchsia-500" />Daily Execution</h2><div className="grid gap-4">{habits.length === 0 ? <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-[2.5rem]">Grid clear. No active missions.</div> : habits.map(habit => { const isMutating = mutatingIds.has(habit.id); return <button key={habit.id} disabled={habit.completed || isMutating} onClick={() => handleCompleteHabit(habit.id)} className={`w-full flex items-center gap-4 p-5 rounded-3xl border text-left transition-all ${habit.completed ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80' : 'border-white/10 bg-slate-900/50 hover:border-cyan-400/30'}`}><div>{getIconForHabit(habit.quest.difficulty)}</div><div className="min-w-0 flex-1"><p className="font-bold truncate">{habit.quest.title}</p><p className="text-xs uppercase tracking-[0.2em] text-slate-500 mt-1">{habit.quest.category} • +{habit.quest.xp_reward} XP</p></div>{habit.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Zap className="w-5 h-5 text-slate-600" />}</button>; })}</div></motion.section>
    </div>
  </div>;
}
