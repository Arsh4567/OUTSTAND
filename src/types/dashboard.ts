export type TabId = 'overview' | 'protocols' | 'outstand';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestCategory = 'Productivity' | 'Mindset' | 'Execution';

export interface UserStats {
  total_xp: number;
  level: number;
  current_level_xp: number;
  next_level_xp: number;
  streak_days: number;
}

export interface QuestData {
  id: string;
  title: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xp_reward: number;
}

export interface DailyQuest {
  id: string;
  completed: boolean;
  quest: QuestData;
}

export interface ProtocolStep {
  id: string;
  label: string;
  completed: boolean;
}

export interface Protocol {
  id: string;
  title: string;
  xp_reward: number;
  steps: ProtocolStep[];
  isFullyCompleted: boolean;
}

export interface Activity {
  id: string;
  type: 'quest_completed' | 'protocol_completed' | 'level_up' | 'outstand_challenge';
  description: string;
  xp_awarded: number;
  created_at: string;
}
