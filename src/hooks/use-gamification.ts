import { useState, useCallback, useMemo } from 'react';
import type { UserGamificationState, LevelData, Activity } from '../types/dashboard';

const XP_PER_LEVEL = 1000;

export function calculateLevelData(totalXP: number): LevelData {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const currentLevelXP = totalXP % XP_PER_LEVEL;
  const xpRequiredForNextLevel = XP_PER_LEVEL;
  const progressPercentage = Math.min(Math.max((currentLevelXP / xpRequiredForNextLevel) * 100, 0), 100);
  return { level, currentLevelXP, xpRequiredForNextLevel, progressPercentage };
}

export function useGamification() {
  const [gameState, setGamificationState] = useState<UserGamificationState>({ totalXP: 11450, streakDays: 14, focusMinutesToday: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);

  const logActivity = useCallback((type: Activity['type'], description: string, xpAwarded: number) => {
    setActivities((prev) => [
      { id: crypto.randomUUID(), type, description, xp_awarded: xpAwarded, created_at: new Date().toISOString() },
      ...prev,
    ].slice(0, 20));
  }, []);

  const awardXP = useCallback((amount: number, source: Activity['type'], description: string) => {
    setGamificationState((prev) => {
      const newTotal = prev.totalXP + amount;
      const currentLevel = calculateLevelData(prev.totalXP).level;
      const newLevel = calculateLevelData(newTotal).level;
      if (newLevel > currentLevel) logActivity('level_up', `Reached Level ${newLevel}!`, 0);
      return { ...prev, totalXP: newTotal };
    });
    logActivity(source, description, amount);
  }, [logActivity]);

  const addFocusMinutes = useCallback((minutes: number) => {
    setGamificationState((prev) => ({ ...prev, focusMinutesToday: prev.focusMinutesToday + minutes }));
    awardXP(minutes * 5, 'focus_session', `Completed ${minutes}m Focus Session`);
  }, [awardXP]);

  const levelData = useMemo(() => calculateLevelData(gameState.totalXP), [gameState.totalXP]);
  return { gameState, levelData, activities, awardXP, addFocusMinutes };
}
