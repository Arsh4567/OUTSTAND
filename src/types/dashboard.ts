export type TabId = 'overview' | 'focus' | 'protocols';

export interface UserStats {
  total_xp: number;
  level: number;
  current_level_xp: number;
  streak_days: number;
  focus_minutes_today: number;
}

export interface DailyQuest {
  id: string;
  completed: boolean;
  quests: {
    id: string;
    title: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    xp_reward: number;
  };
}

export interface Activity {
  id: string;
  type: 'quest_completed' | 'focus_session' | 'protocol_completed' | 'level_up';
  description: string;
  xp_awarded: number;
  created_at: string;
}
