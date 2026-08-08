import { useState, useCallback, useEffect } from 'react';
import type { Quest, UserStats, Activity, Achievement } from '../types/dashboard';

// Formula: Level N requires (N * 500) XP
const calculateLevelThreshold = (level: number) => level * 500;

export function useGamification() {
  // In a real app, this initializes from your Supabase/API
  const [stats, setStats] = useState<UserStats>({
    level: 12,
    totalXP: 32850,
    currentLevelXP: 350,
    nextLevelXP: calculateLevelThreshold(12),
    streakDays: 14,
    bestStreak: 21,
    focusMinutesToday: 135, // 2h 15m
    questsCompletedToday: 0,
  });

  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Deep Work Block (60m)', category: 'Productivity', xpReward: 150, completed: false, difficulty: 'medium' },
    { id: 'q2', title: 'Energy System Audit', category: 'Mindset', xpReward: 100, completed: false, difficulty: 'easy' },
    { id: 'q3', title: 'Zero-Distraction Execution', category: 'Execution', xpReward: 250, completed: false, difficulty: 'hard' },
  ]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const logActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    setActivities(prev => [{
      ...activity,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }, ...prev].slice(0, 10)); // Keep last 10
  }, []);

  const completeQuest = useCallback((questId: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed) {
        // 1. Grant XP
        setStats(current => {
          let newXP = current.currentLevelXP + q.xpReward;
          let newLevel = current.level;
          let newNextLevelXP = current.nextLevelXP;
          let leveledUp = false;

          // 2. Handle Level Up
          if (newXP >= newNextLevelXP) {
            newXP = newXP - newNextLevelXP;
            newLevel += 1;
            newNextLevelXP = calculateLevelThreshold(newLevel);
            leveledUp = true;
          }

          if (leveledUp) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 4000);
            logActivity({ type: 'level_up', description: `Reached Level ${newLevel}!` });
          }

          return {
            ...current,
            level: newLevel,
            currentLevelXP: newXP,
            nextLevelXP: newNextLevelXP,
            totalXP: current.totalXP + q.xpReward,
            questsCompletedToday: current.questsCompletedToday + 1
          };
        });

        // 3. Log Activity
        logActivity({ type: 'quest_completed', description: q.title, xpGained: q.xpReward });
        
        // INTEGRATION POINT: supabase.from('quests').update({ completed: true }).eq('id', questId)
        return { ...q, completed: true };
      }
      return q;
    }));
  }, [logActivity]);

  const addFocusTime = useCallback((minutes: number) => {
    setStats(prev => ({ ...prev, focusMinutesToday: prev.focusMinutesToday + minutes }));
    logActivity({ type: 'focus_session', description: `Completed ${minutes}m focus block`, xpGained: minutes * 2 });
    // INTEGRATION POINT: Sync focus time to backend
  }, [logActivity]);

  return { stats, quests, activities, showLevelUp, completeQuest, addFocusTime };
          }
