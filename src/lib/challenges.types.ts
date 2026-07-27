// src/lib/challenges.types.ts

/**
 * ---------------------------------------------------------------------------
 * CORE ENUMS & LITERALS
 * ---------------------------------------------------------------------------
 */
export type ChallengeCategory =
  | "Focus"
  | "Knowledge"
  | "Fitness"
  | "Mindset"
  | "Phone Detox"
  | "Productivity"
  | "Discipline"
  | "Social";

export type ChallengeDifficulty = "Easy" | "Medium" | "Hard" | "Extreme" | "Master";

export type ChallengeRarity = 
  | "Common" 
  | "Uncommon" 
  | "Rare" 
  | "Epic" 
  | "Legendary" 
  | "Mythic" 
  | "Divine"; // Reserved for multi-day ultimate challenges

export type ChallengeTimeWindow = 
  | "Morning"    // 5:00 AM - 11:59 AM
  | "Afternoon"  // 12:00 PM - 5:00 PM
  | "Evening"    // 5:00 PM - 11:59 PM
  | "Anytime";   // No restriction

export type ChallengeActionType = 
  | "Timer"      // Opens a Pomodoro/Countdown timer
  | "Toggle"     // A simple tap-to-complete button
  | "Reflection"; // Requires a text input/journal entry to complete

/**
 * ---------------------------------------------------------------------------
 * DESIGN SYSTEM & THEMING TOKENS
 * ---------------------------------------------------------------------------
 */
export type ChallengeTheme = {
  name: "Ocean" | "Forest" | "Galaxy" | "Sunset" | "Volcano" | "Royal" | "Ice" | "Neon" | "Void";
  
  // Tailwind Utility Classes
  bgGradient: string;     // Outer card gradient (e.g., 'from-indigo-950 via-slate-900 to-slate-950')
  borderGlow: string;     // Hover state shadow (e.g., 'hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]')
  iconContainer: string;  // Background/border for the emoji (e.g., 'bg-indigo-500/10 border-indigo-500/20')
  badgeColor: string;     // Rarity text color (e.g., 'text-indigo-400')
  
  // Canvas/Framer Motion visual effects
  particleColors: string[]; // Hex codes for completion confetti (e.g., ['#6366f1', '#a855f7'])
};

/**
 * ---------------------------------------------------------------------------
 * MAIN CHALLENGE SCHEMA
 * ---------------------------------------------------------------------------
 */
export type OutstandChallenge = {
  // Identity
  id: string; // e.g., 'focus_deep_work_01'
  title: string;
  description: string;
  emoji: string;
  
  // Execution parameters
  durationMinutes: number;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  rarity: ChallengeRarity;
  timeWindow: ChallengeTimeWindow;
  actionType: ChallengeActionType;
  
  // Gamification & Rewards
  xpReward: number;
  coinsReward: number; // Secondary currency for an in-app store/cosmetics
  
  // Psychological Hooks
  dopamineYield: "Low" | "Medium" | "High" | "Reset";
  flavorText: string; // Motivational one-liner for the UI
  
  // Presentation Engine
  theme: ChallengeTheme;
  
  // Audio Engine Cues
  audio: {
    onStart?: "whoosh" | "digital_boot" | "chime";
    onComplete: "success_chime" | "heavy_bass_drop" | "ethereal_ping" | "level_up";
  };
  
  // Progression Locks (Optional)
  requirements?: {
    minLevel?: number;        // User must be level X to see this
    minStreak?: number;       // Requires a hot streak
    completedChallengeIds?: string[]; // Prerequisite challenges
  };
};

/**
 * ---------------------------------------------------------------------------
 * USER PROGRESSION & HISTORY TRACKING
 * ---------------------------------------------------------------------------
 */
export type UserChallengeProgress = {
  challengeId: string;
  status: "active" | "completed" | "skipped" | "failed";
  
  // Telemetry (helps algorithms know what the user likes)
  startedAt?: string;   // ISO 8601 Date String
  completedAt?: string; // ISO 8601 Date String
  
  // Anti-Repetition Tracking
  timesCompleted: number;
  lastSeenAt: string;   // ISO 8601 Date String
};
