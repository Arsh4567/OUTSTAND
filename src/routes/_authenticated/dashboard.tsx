import React, { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  Trophy, Flame, Zap, Target, Activity, ShieldCheck, 
  Sparkles, ChevronRight, Play, CheckCircle2, 
  TrendingUp, Clock, History, CircleDashed, Square
} from 'lucide-react';
import { useGamification } from '../../hooks/use-gamification';
import type { TabType, Quest, UserStats, Activity as ActivityType } from '../../types/dashboard';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: UnifiedDashboard,
});

// --- COMPONENT: HEADER ---
function DashboardHeader({ stats }: { stats: UserStats }) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
            <Trophy className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 text-xs font-extrabold px-2 py-0.5 rounded-full border-2 border-slate-900">
            Lvl {stats.level}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">Commander</h1>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Elite Tier
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">System operational. Ready for execution.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="bg-slate-950/80 border border-slate-800/80 px-4 py-3 rounded-xl flex items-center gap-3 min-w-[140px]">
          <Flame className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Streak</div>
            <div className="text-lg font-bold text-white">{stats.streakDays} Days</div>
          </div>
        </div>
        <div className="bg-slate-950/80 border border-slate-800/80 px-4 py-3 rounded-xl flex items-center gap-3 min-w-[140px]">
          <Zap className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total XP</div>
            <div className="text-lg font-bold text-white">{stats.totalXP.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// --- COMPONENT: TABS ---
function DashboardTabs({ activeTab, onTabChange }: { activeTab: TabType, onTabChange: (t: TabType) => void }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity, color: 'indigo' },
    { id: 'focus', label: 'Focus Center', icon: Sparkles, color: 'cyan' },
    { id: 'protocols', label: 'Protocols', icon: Target, color: 'violet' }
  ] as const;

  return (
    <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-px overflow-x-auto" role="tablist" aria-label="Dashboard Views">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            onClick={() => onTabChange(tab.id as TabType)}
            className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-${tab.color}-500 ${
              isActive
                ? `border-${tab.color}-500 text-${tab.color}-400 bg-${tab.color}-500/10`
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
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

// --- COMPONENT: QUEST PANEL ---
function DailyQuestPanel({ quests, onComplete }: { quests: Quest[], onComplete: (id: string) => void }) {
  const completed = quests.filter(q => q.completed).length;
  
  return (
    <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          Daily Missions
        </h2>
        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 font-medium">
          {completed}/{quests.length} Completed
        </span>
      </div>

      <div className="space-y-3 flex-grow">
        {quests.map((quest) => (
          <button
            key={quest.id}
            disabled={quest.completed}
            onClick={() => onComplete(quest.id)}
            className={`w-full text-left group p-4 rounded-xl border transition-all flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              quest.completed
                ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300 opacity-75 cursor-default'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 text-slate-200 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                quest.completed ? 'bg-emerald-500 text-slate-950' : 'border-2 border-slate-700 group-hover:border-indigo-500'
              }`} aria-hidden="true">
                {quest.completed && <CheckCircle2 className="w-4 h-4 font-bold" />}
              </div>
              <div>
                <p className={`font-semibold text-sm ${quest.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                  {quest.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{quest.category}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-xs text-slate-400 capitalize">{quest.difficulty}</span>
                </div>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ml-4 ${
              quest.completed ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
            }`}>
              +{quest.xpReward} XP
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// --- COMPONENT: REAL FOCUS TIMER ---
function FocusCenter({ onComplete }: { onComplete: (mins: number) => void }) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      onComplete(25);
      setTimeLeft(25 * 60); // reset
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(25 * 60); };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-md max-w-2xl mx-auto text-center">
      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
        Deep Work Protocol
      </span>
      <h2 className="text-3xl font-black text-white mt-6 mb-2">Eliminate Distraction</h2>
      <p className="text-slate-400 text-sm mb-8">Maintain unbroken focus. Minimize context switching.</p>
      
      <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
        {/* SVG Progress Circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="128" cy="128" r="120" className="stroke-slate-800" strokeWidth="8" fill="none" />
          <circle 
            cx="128" cy="128" r="120" 
            className="stroke-cyan-400 transition-all duration-1000 ease-linear" 
            strokeWidth="8" fill="none" 
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
          />
        </svg>
        <div className="text-6xl font-black text-white font-mono tabular-nums tracking-tighter">
          {mins}:{secs}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={toggleTimer}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-3 rounded-xl text-lg transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          {isActive ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          {isActive ? 'Pause' : 'Commence'}
        </button>
        <button 
          onClick={resetTimer}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// --- MAIN DASHBOARD ROUTE COMPONENT ---
function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Custom Hook replaces static state
  const { stats, quests, activities, showLevelUp, completeQuest, addFocusTime } = useGamification();

  // Derived Progress Calculations
  const progressPercent = useMemo(() => {
    return Math.min(Math.max((stats.currentLevelXP / stats.nextLevelXP) * 100, 0), 100);
  }, [stats.currentLevelXP, stats.nextLevelXP]);

  const dailyCompletion = useMemo(() => {
    if (quests.length === 0) return 0;
    const done = quests.filter(q => q.completed).length;
    return Math.round((done / quests.length) * 100);
  }, [quests]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Level Up Overlay (Micro-interaction) */}
      <div 
        aria-live="polite"
        className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-500 ${showLevelUp ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
        <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 p-8 rounded-3xl text-center transform transition-transform duration-500 scale-100 shadow-2xl shadow-indigo-500/50 border border-white/20">
          <Sparkles className="w-16 h-16 text-yellow-300 mx-auto mb-4 animate-bounce" />
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">LEVEL UP!</h2>
          <p className="text-indigo-100 text-lg font-medium">You are now Level {stats.level}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <DashboardHeader stats={stats} />
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <main>
          {activeTab === 'overview' && (
            <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* LEFT COLUMN */}
              <div className="lg:col-span-2 space-y-6 flex flex-col">
                
                {/* Analytics / Today's Progress */}
                <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Today's Protocol</span>
                      <h2 className="text-lg font-bold text-white mt-1">Execution Velocity</h2>
                    </div>
                    <span className="text-3xl font-black text-emerald-400 tabular-nums">{dailyCompletion}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-4 mb-5 border border-slate-800 overflow-hidden" role="progressbar" aria-valuenow={dailyCompletion} aria-valuemin={0} aria-valuemax={100}>
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${dailyCompletion}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm border-t border-slate-800/80 pt-5">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Missions</div>
                      <div className="text-white font-bold">{stats.questsCompletedToday} / {quests.length}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Focus Time</div>
                      <div className="text-white font-bold">{Math.floor(stats.focusMinutesToday / 60)}h {stats.focusMinutesToday % 60}m</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Productivity Score</div>
                      <div className="text-emerald-400 font-bold">A+</div>
                    </div>
                  </div>
                </section>

                <DailyQuestPanel quests={quests} onComplete={completeQuest} />
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                
                {/* XP Progression Card */}
                <section className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="w-24 h-24" />
                  </div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1 relative z-10">
                    Next Level Target
                  </h2>
                  <p className="text-sm text-slate-400 mb-6 relative z-10">
                    <span className="text-white font-bold">{stats.nextLevelXP - stats.currentLevelXP} XP</span> required for Level {stats.level + 1}
                  </p>
                  
                  <div className="w-full bg-slate-950 rounded-full h-3 mb-3 border border-slate-800 overflow-hidden relative z-10" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-400 relative z-10">
                    <span className="tabular-nums">{stats.currentLevelXP.toLocaleString()} XP</span>
                    <span className="tabular-nums">{stats.nextLevelXP.toLocaleString()} XP</span>
                  </div>
                </section>

                {/* Activity Feed */}
                <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex-grow">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-slate-400" />
                    Action Ledger
                  </h2>
                  
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      <CircleDashed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No recent activity.<br/>Start executing protocols.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((act) => (
                        <div key={act.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <div>
                            <p className="text-sm text-slate-300">{act.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              {act.xpGained && <span className="text-indigo-400 font-bold">+{act.xpGained} XP</span>}
                              <span className="text-slate-600">
                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
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
            <div id="focus-panel" role="tabpanel" aria-labelledby="focus-tab" className="animate-in fade-in duration-500">
              <FocusCenter onComplete={addFocusTime} />
            </div>
          )}

          {activeTab === 'protocols' && (
            <div id="protocols-panel" role="tabpanel" aria-labelledby="protocols-tab" className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-md animate-in fade-in duration-500 text-center">
              <Target className="w-12 h-12 text-violet-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white mb-2">Protocol Architecture</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                Define your foundational habits and high-stakes routines here. 
                <br/>(Integration ready for backend Protocol schema)
              </p>
              <button disabled className="bg-slate-800 text-slate-500 px-6 py-3 rounded-xl font-bold cursor-not-allowed border border-slate-700">
                System Offline (Awaiting Database Sync)
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
  }
                                                   
