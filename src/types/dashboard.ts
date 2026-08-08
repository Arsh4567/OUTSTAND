export type TabId = 'overview' | 'focus' | 'protocols';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestCategory = 'Productivity' | 'Mindset' | 'Execution';

export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xpReward: number;
  completed: boolean;
}

export interface Activity {
  id: string;
  timestamp: number;
  type: 'quest_completed' | 'focus_session' | 'protocol_completed' | 'level_up';
  description: string;
  xpAwarded: number;
}

export interface Protocol {
  id: string;
  title: string;
  steps: { id: string; label: string; completed: boolean }[];
  completed: boolean;
  xpReward: number;
}

export interface UserGamificationState {
  totalXP: number;
  streakDays: number;
  focusMinutesToday: number;
}

export interface LevelData {
  level: number;
  currentLevelXP: number;
  xpRequiredForNextLevel: number;
  progressPercentage: number;
}
