import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '../../integrations/supabase/client';
import { useFocusTimer } from '../../hooks/use-focus-timer';
import type { TabId, UserStats, DailyQuest, Activity } from '../../types/dashboard';
import { 
  Trophy, Flame, Zap, Target, Activity as ActivityIcon, ShieldCheck, 
  Sparkles, Play, CheckCircle2, Circle, Clock, History, 
  Square, RotateCcw, AlertCircle, Loader2
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardOverview,
});

// STRIcT STATIC STYLING (No dynamic template strings for Tailwind)
const TAB_STYLES: Record<TabId, { active: string; focus: string }> = {
  overview: { active: 'border-indigo-500 text-indigo-400 bg-indigo-500/10', focus: 'focus-visible:ring-indigo-500' },
  focus: { active: 'border-cyan-500 text-cyan-400 bg-cyan-500/10', focus: 'focus-visible:ring-cyan-500' },
  protocols: { active: 'border-violet-500 text-violet-400 bg-violet-500/10', focus: 'focus-visible:ring-violet-500' },
};

function DashboardOverview() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  
  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // 1. DATA FETCHING (Authoritative Source of Truth)
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session found.");

      // Run parallel requests
      const [statsRes, questsRes, activitiesRes] = await Promise.all([
        supabase.from('user_stats').select('*').eq('user_id', session.user.id).single(),
        supabase.from('daily_quests').select('id, completed, quests(id, title, category, difficulty, xp_reward)').eq('user_id', session.user.id).eq('assigned_date', new Date().toISOString().split('T')[0]),
        supabase.from('activity_log').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10)
      ]);

      if (statsRes.error && statsRes.error.code !== 'PGRST116') throw statsRes.error;
      if (questsRes.error) throw questsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      // Handle new user case (PGRST116 = no rows found)
      setStats(statsRes.data || { total_xp: 0, level: 1, current_level_xp: 0, streak_days: 0, focus_minutes_today: 0 });
      setQuests(questsRes.data as unknown as DailyQuest[]);
      setActivities(activitiesRes.data as Activity[]);
    } catch (err: any) {
      console.error("Dashboard Load Error:", err);
      setError(err.message || "Failed to sync command center data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Set up Realtime Subscription for Live Updates
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats' }, loadDashboardData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, loadDashboardData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. SECURE MUTATIONS
  const handleCompleteQuest = async (dailyQuestId: string) => {
    // Optimistic UI Update
    setQuests(prev => prev.map(q => q.id === dailyQuestId ? { ...q, completed: true } : q));
    
    // Secure RPC Call
    const { error, data } = await supabase.rpc('complete_daily_quest', { p_daily_quest_id: dailyQuestId });
    
    if (error || !data) {
      // Rollback on failure
      setQuests(prev => prev.map(q => q.id === dailyQuestId ? { ...q, completed: false } : q));
      alert("Failed to complete quest securely. Please try again.");
    }
  };

  // 3. DERIVED METRICS
  const completedCount = quests.filter(q => q.completed).length;
  const completionPercent = quests.length === 0 ? 0 : Math.round((completedCount / quests.length) * 100);
  const xpForNextLevel = 1000; // Based on our SQL formula
  const levelProgressPercent = stats ? Math.min(100, Math.max(0, (stats.current_level_xp / xpForNextLevel) * 100)) : 0;

  // 4. LOADING & ERROR STATES
  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium tracking-wide">Synchronizing Neural Data...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-red-500/20 p-8 rounded-2xl max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
          <p className="text-slate-400 text-sm mb-6">{error || "Unable to load dashboard data."}</p>
          <button onClick={loadDashboardData} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                <Trophy className="w-8 h-8 text-indigo-400" aria-hidden="true" />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-indigo-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full border-2 border-slate-950">
                Lvl {stats.level}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Commander</h1>
              <p className="text-slate-400 text-sm mt-1">Data synchronized. Ready for execution.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3">
              <Flame className="w-5 h-5 text-amber-500" aria-hidden="true" />
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Streak</div>
                <div className="text-lg font-bold text-white">{stats.streak_days} Days</div>
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3">
              <Zap className="w-5 h-5 text-indigo-400" aria-hidden="true" />
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total XP</div>
                <div className="text-lg font-bold text-white">{stats.total_xp.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </header>

        {/* ARIA COMPLIANT TABS */}
        <AccessibleTabList activeTab={activeTab} onTabChange={setActiveTab} />

        {/* MAIN CONTENT PANELS */}
        <main>
          {activeTab === 'overview' && (
            <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              
              {/* LEFT COLUMN */}
              <div className="lg:col-span-2 space-y-6">
                
                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Today's Progress</h2>
                    <span className="text-3xl font-black text-indigo-400 tabular-nums">{completionPercent}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-950 rounded-full h-3 mb-5 border border-slate-800 overflow-hidden" role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${completionPercent}%` }} />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-t border-slate-800/80 pt-5">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Missions Completed</div>
                      <div className="text-white font-bold">{completedCount} / {quests.length}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Focus Time</div>
                      <div className="text-white font-bold">{Math.floor(stats.focus_minutes_today / 60)}h {stats.focus_minutes_today % 60}m</div>
                    </div>
                  </div>
                </section>

                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                    <Target className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                    Daily Missions
                  </h2>
                  {quests.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">No missions assigned today.</div>
                  ) : (
                    <div className="space-y-3">
                      {quests.map((q) => (
                        <button
                          key={q.id}
                          disabled={q.completed}
                          onClick={() => handleCompleteQuest(q.id)}
                          aria-label={q.completed ? `${q.quests.title} (Completed)` : `Complete ${q.quests.title}`}
                          className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            q.completed
                              ? 'bg-slate-950 border-slate-800 text-slate-500 cursor-default'
                              : 'bg-slate-900 border-slate-700 hover:border-indigo-500 text-slate-200 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="shrink-0" aria-hidden="true">
                              {q.completed ? <CheckCircle2 className="w-6 h-6 text-indigo-500" /> : <Circle className="w-6 h-6 text-slate-600" />}
                            </div>
                            <div>
                              <p className={`font-semibold text-sm ${q.completed ? 'line-through opacity-70' : ''}`}>{q.quests.title}</p>
                              <span className="text-xs text-slate-500 capitalize">{q.quests.category} • {q.quests.difficulty}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                            +{q.quests.xp_reward} XP
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                
                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                  <h2 className="text-lg font-bold text-white mb-1">Level Progression</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    <span className="text-white font-bold">{xpForNextLevel - stats.current_level_xp} XP</span> required for Level {stats.level + 1}
                  </p>
                  
                  <div className="w-full bg-slate-950 rounded-full h-2.5 mb-3 border border-slate-800 overflow-hidden" role="progressbar" aria-valuenow={levelProgressPercent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${levelProgressPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span className="tabular-nums">{stats.current_level_xp} XP</span>
                    <span className="tabular-nums">{xpForNextLevel} XP</span>
                  </div>
                </section>

                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-slate-400" aria-hidden="true" />
                    Action Ledger
                  </h2>
                  {activities.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">No recent activity.</div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((act) => (
                        <div key={act.id} className="flex gap-3">
                          <div className="w-1.5 h-1.5 mt-2 rounded-full bg-slate-600 shrink-0" />
                          <div>
                            <p className="text-sm text-slate-300">{act.description}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                              {act.xp_awarded > 0 && <span className="text-indigo-400 font-bold">+{act.xp_awarded} XP</span>}
                              <span className="text-slate-500">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </div>
            </div>
          )}

          {activeTab === 'focus' && (
            <div id="focus-panel" role="tabpanel" aria-labelledby="focus-tab" className="animate-in fade-in duration-300">
              <FocusCenterPanel onSuccessSync={loadDashboardData} />
            </div>
          )}

          {activeTab === 'protocols' && (
            <div id="protocols-panel" role="tabpanel" aria-labelledby="protocols-tab" className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center animate-in fade-in duration-300">
               <Target className="w-12 h-12 text-violet-500 mx-auto mb-4" />
               <h2 className="text-2xl font-bold text-white mb-2">Protocol Engine</h2>
               <p className="text-slate-400 text-sm">System infrastructure ready. Awaiting protocol definitions from database.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AccessibleTabList({ activeTab, onTabChange }: { activeTab: TabId, onTabChange: (id: TabId) => void }) {
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: ActivityIcon },
    { id: 'focus', label: 'Focus Center', icon: Clock },
    { id: 'protocols', label: 'Protocols', icon: Target }
  ];

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex !== index) {
      e.preventDefault();
      tabRefs.current[nextIndex]?.focus();
      onTabChange(tabs[nextIndex].id);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-px overflow-x-auto custom-scrollbar" role="tablist" aria-label="Dashboard Views">
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const styles = TAB_STYLES[tab.id];

        return (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[index] = el; }}
            role="tab"
            id={`${tab.id}-tab`}
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap focus:outline-none ${styles.focus} ${
              isActive ? styles.active : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function FocusCenterPanel({ onSuccessSync }: { onSuccessSync: () => void }) {
  const timer = useFocusTimer(onSuccessSync);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-black text-white mb-2">Focus Session</h2>
      <p className="text-slate-400 text-sm mb-8">Maintain unbroken focus. Minimize context switching.</p>
      
      {timer.state === 'idle' && (
        <div className="flex justify-center gap-3 mb-8">
          {[15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              onClick={() => timer.setDuration(mins)}
              className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              {mins}m
            </button>
          ))}
        </div>
      )}

      <div className="relative w-64 h-64 mx-auto mb-8 flex flex-col items-center justify-center">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" aria-hidden="true">
          <circle cx="128" cy="128" r="120" className="stroke-slate-800" strokeWidth="6" fill="none" />
          <circle 
            cx="128" cy="128" r="120" 
            className="stroke-cyan-500 transition-all duration-200 ease-linear" 
            strokeWidth="6" fill="none" 
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - timer.progressPercent / 100)}
          />
        </svg>
        <div 
      className="text-6xl font-black text-white font-mono tabular-nums tracking-tighter"
          aria-label={`Time remaining: ${timer.minutes} minutes and ${timer.seconds} seconds`}
          role="timer"
          aria-live="polite"
        >
          {timer.minutes}:{timer.seconds}
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-bold">
          {timer.isSaving ? 'Synchronizing...' : timer.state}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        {timer.state === 'idle' || timer.state === 'paused' ? (
          <button 
            disabled={timer.isSaving}
            onClick={timer.start}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            {timer.state === 'paused' ? 'Resume' : 'Start Focus'}
          </button>
        ) : timer.state === 'running' ? (
          <button 
            onClick={timer.pause}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Square className="w-5 h-5 fill-current" aria-hidden="true" />
            Pause
          </button>
        ) : null}

        {timer.state !== 'idle' && (
          <button 
            disabled={timer.isSaving}
            onClick={timer.reset}
            aria-label="Reset Timer"
            className="bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-50 text-slate-300 font-bold p-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}    
