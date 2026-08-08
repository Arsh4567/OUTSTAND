export type TabType = 'overview' | 'focus' | 'protocols';

export type QuestCategory = 'Productivity' | 'Mindset' | 'Execution' | 'Health';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  category: QuestCategory;
  xpReward: number;
  completed: boolean;
  difficulty: Difficulty;
}

export interface Activity {
  id: string;
  timestamp: number;
  type: 'quest_completed' | 'level_up' | 'focus_session' | 'achievement';
  description: string;
  xpGained?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  totalRequired: number;
}

export interface UserStats {
  level: number;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  streakDays: number;
  bestStreak: number;
  focusMinutesToday: number;
  questsCompletedToday: number;
}
