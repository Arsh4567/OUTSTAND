import React, { useState, useRef, KeyboardEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  Trophy, Flame, Zap, Target, Activity, ShieldCheck, 
  Sparkles, Play, CheckCircle2, Circle, Clock, History, 
  Square, RotateCcw, AlertCircle
} from 'lucide-react';

import { useGamification } from '../../hooks/use-gamification';
import { useFocusTimer } from '../../hooks/use-focus-timer';
import type { TabId, Quest, Protocol } from '../../types/dashboard';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardOverview,
});

// --- STATIC TAILWIND DICTIONARY ---
// Prevents dynamic class generation issues in production builds
const TAB_STYLES: Record<TabId, { active: string; focus: string }> = {
  overview: { active: 'border-indigo-500 text-indigo-400 bg-indigo-500/10', focus: 'focus-visible:ring-indigo-500' },
  focus: { active: 'border-cyan-500 text-cyan-400 bg-cyan-500/10', focus: 'focus-visible:ring-cyan-500' },
  protocols: { active: 'border-violet-500 text-violet-400 bg-violet-500/10', focus: 'focus-visible:ring-violet-500' },
};

function DashboardOverview() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  
  // Core Gamification Engine
  const { gameState, levelData, activities, awardXP, addFocusMinutes } = useGamification();

  // Mocked Domain Data (Replace with API hooks)
  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Plan Tomorrow', category: 'Productivity', xpReward: 150, completed: false, difficulty: 'medium' },
    { id: 'q2', title: 'Inbox Zero', category: 'Execution', xpReward: 100, completed: false, difficulty: 'easy' },
  ]);

  const [protocols, setProtocols] = useState<Protocol[]>([
    {
      id: 'p1', title: 'Morning Optimization', xpReward: 200, completed: false,
      steps: [
        { id: 's1', label: 'Hydrate (500ml)', completed: false },
        { id: 's2', label: 'Review Daily Goals', completed: false }
      ]
    }
  ]);

  // Derived Statistics
  const completedQuestsCount = quests.filter(q => q.completed).length;
  const questCompletionPercentage = quests.length === 0 ? 0 : Math.round((completedQuestsCount / quests.length) * 100);

  // Actions
  const handleCompleteQuest = (questId: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed) {
        awardXP(q.xpReward, 'quest_completed', `Completed Mission: ${q.title}`);
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  const handleToggleProtocolStep = (protocolId: string, stepId: string) => {
    setProtocols(prev => prev.map(p => {
      if (p.id !== protocolId || p.completed) return p;
      
      const newSteps = p.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
      const allDone = newSteps.every(s => s.completed);
      
      if (allDone) {
        awardXP(p.xpReward, 'protocol_completed', `Completed Protocol: ${p.title}`);
      }
      
      return { ...p, steps: newSteps, completed: allDone };
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER: Command Center Overview */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                <Trophy className="w-8 h-8 text-indigo-400" aria-hidden="true" />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-indigo-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full border-2 border-slate-950">
                Lvl {levelData.level}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Commander</h1>
              <p className="text-slate-400 text-sm mt-1">Ready for execution.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3">
              <Flame className="w-5 h-5 text-amber-500" aria-hidden="true" />
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Streak</div>
                <div className="text-lg font-bold text-white">{gameState.streakDays} Days</div>
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3">
              <Zap className="w-5 h-5 text-indigo-400" aria-hidden="true" />
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total XP</div>
                <div className="text-lg font-bold text-white">{gameState.totalXP.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </header>

        {/* ACCESSIBLE TAB NAVIGATION */}
        <AccessibleTabList activeTab={activeTab} onTabChange={setActiveTab} />

        {/* MAIN CONTENT PANELS */}
        <main>
          {activeTab === 'overview' && (
            <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Daily Progress & Quests */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Real Productivity Data */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">Today's Progress</h2>
                    </div>
                    <span className="text-3xl font-black text-indigo-400 tabular-nums">{questCompletionPercentage}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-950 rounded-full h-3 mb-5 border border-slate-800 overflow-hidden" role="progressbar" aria-valuenow={questCompletionPercentage} aria-valuemin={0} aria-valuemax={100}>
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${questCompletionPercentage}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-t border-slate-800/80 pt-5">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Missions Completed</div>
                      <div className="text-white font-bold">{completedQuestsCount} / {quests.length}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Focus Time</div>
                      <div className="text-white font-bold">{gameState.focusMinutesToday} mins</div>
                    </div>
                  </div>
                </section>

                {/* Interactive Quests */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                    <Target className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                    Daily Missions
                  </h2>
                  <div className="space-y-3">
                    {quests.map((quest) => (
                      <button
                        key={quest.id}
                        disabled={quest.completed}
                        onClick={() => handleCompleteQuest(quest.id)}
                        aria-label={quest.completed ? `${quest.title} (Completed)` : `Complete ${quest.title}`}
                        className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          quest.completed
                            ? 'bg-slate-950 border-slate-800 text-slate-500 opacity-60 cursor-default'
                            : 'bg-slate-900 border-slate-700 hover:border-indigo-500 text-slate-200 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="shrink-0" aria-hidden="true">
                            {quest.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{quest.title}</p>
                            <span className="text-xs text-slate-500">{quest.category} • {quest.difficulty}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          +{quest.xpReward} XP
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column: Level Progress & Activity */}
              <div className="space-y-6">
                
                {/* Mathematical XP Progression */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                    Level Progression
                  </h2>
                  <p className="text-sm text-slate-400 mb-6">
                    <span className="text-white font-bold">{levelData.xpRequiredForNextLevel - levelData.currentLevelXP} XP</span> required for Level {levelData.level + 1}
                  </p>
                  
                  <div className="w-full bg-slate-950 rounded-full h-2.5 mb-3 border border-slate-800 overflow-hidden" role="progressbar" aria-valuenow={levelData.progressPercentage} aria-valuemin={0} aria-valuemax={100}>
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${levelData.progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span className="tabular-nums">{levelData.currentLevelXP} XP</span>
                    <span className="tabular-nums">{levelData.xpRequiredForNextLevel} XP</span>
                  </div>
                </section>

                {/* Activity Feed */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-slate-400" aria-hidden="true" />
                    Action Ledger
                  </h2>
                  
                  {activities.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No recent activity.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {activities.map((act) => (
                        <div key={act.id} className="flex gap-3">
                          <div className="w-1.5 h-1.5 mt-2 rounded-full bg-slate-600 shrink-0" />
                          <div>
                            <p className="text-sm text-slate-300">{act.description}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                              {act.xpAwarded > 0 && <span className="text-indigo-400 font-bold">+{act.xpAwarded} XP</span>}
                              <span className="text-slate-500">
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
            <div id="focus-panel" role="tabpanel" aria-labelledby="focus-tab">
              <FocusCenterPanel onComplete={addFocusMinutes} />
            </div>
          )}

          {activeTab === 'protocols' && (
            <div id="protocols-panel" role="tabpanel" aria-labelledby="protocols-tab" className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">Active Protocols</h2>
              <p className="text-slate-400 text-sm mb-6">Complete standardized behavioral routines.</p>
              
              <div className="space-y-4">
                {protocols.map(protocol => (
                  <div key={protocol.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">{protocol.title}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded border ${
                        protocol.completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {protocol.completed ? 'Completed' : `+${protocol.xpReward} XP`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {protocol.steps.map(step => (
                        <button
                          key={step.id}
                          disabled={protocol.completed}
                          onClick={() => handleToggleProtocolStep(protocol.id, step.id)}
                          className="w-full flex items-center gap-3 text-left p-2 rounded hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors disabled:opacity-50"
                        >
                          {step.completed ? <CheckCircle2 className="w-5 h-5 text-violet-400" /> : <Circle className="w-5 h-5 text-slate-600" />}
                          <span className={`text-sm ${step.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{step.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: ACCESSIBLE TABS ---
function AccessibleTabList({ activeTab, onTabChange }: { activeTab: TabId, onTabChange: (id: TabId) => void }) {
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'focus', label: 'Focus Center', icon: Clock },
    { id: 'protocols', label: 'Protocols', icon: Target }
  ];

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== index) {
      e.preventDefault();
      tabRefs.current[nextIndex]?.focus();
      onTabChange(tabs[nextIndex].id);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-px overflow-x-auto" role="tablist" aria-label="Dashboard Views">
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
              isActive
                ? styles.active
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

// --- SUB-COMPONENT: REAL FOCUS TIMER ---
function FocusCenterPanel({ onComplete }: { onComplete: (mins: number) => void }) {
  const timer = useFocusTimer(onComplete);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-black text-white mb-2">Deep Work Session</h2>
      <p className="text-slate-400 text-sm mb-8">Maintain unbroken focus. Minimize context switching.</p>
      
      {/* Duration Selectors */}
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

      {/* Timer Display */}
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
          {timer.state}
        </div>
     {/* Timer Controls */}
      <div className="flex items-center justify-center gap-4">
        {timer.state === 'idle' || timer.state === 'paused' ? (
          <button 
            onClick={timer.start}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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
            onClick={timer.reset}
            aria-label="Reset Timer"
            className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold p-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
      } 
