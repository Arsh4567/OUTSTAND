/**
 * ===========================================================================
 * OUTSTAND ENGINE: CORE DOMAIN TYPES
 * ===========================================================================
 * Precision-engineered types for the gamification and challenge system.
 * Built for zero-runtime-cost type safety and deep UI/UX integration.
 */

// ---------------------------------------------------------------------------
// 1. BRANDED TYPES (Strict ID verification)
// ---------------------------------------------------------------------------
export type ChallengeId = string & { readonly __brand: unique symbol };
export type UserId = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// 2. RUNTIME CONSTANTS & LITERALS
// ---------------------------------------------------------------------------
// Exporting as const arrays allows us to derive types AND use them in UI dropdowns/filters.

export const CHALLENGE_CATEGORIES = [
  "Focus", "Knowledge", "Fitness", "Mindset", 
  "Phone Detox", "Productivity", "Discipline", "Social"
] as const;
export type ChallengeCategory = typeof CHALLENGE_CATEGORIES[number];

export const CHALLENGE_DIFFICULTIES = ["Easy", "Medium", "Hard", "Extreme", "Master"] as const;
export type ChallengeDifficulty = typeof CHALLENGE_DIFFICULTIES[number];

export const CHALLENGE_RARITIES = [
  "Common", "Uncommon", "Rare", "Epic", 
  "Legendary", "Mythic", "Divine"
] as const;
export type ChallengeRarity = typeof CHALLENGE_RARITIES[number];

export const TIME_WINDOWS = ["Morning", "Afternoon", "Evening", "Anytime"] as const;
export type ChallengeTimeWindow = typeof TIME_WINDOWS[number];

export const ACTION_TYPES = [
  "Timer",      // Strict Pomodoro/Countdown
  "Toggle",     // Instant tap-to-complete
  "Reflection", // Deep journal/text entry
  "ZenMode"     // Lock-screen mode requiring device inactivity
] as const;
export type ChallengeActionType = typeof ACTION_TYPES[number];

export const DOPAMINE_YIELDS = ["Low", "Medium", "High", "Reset", "Surge"] as const;
export type DopamineYield = typeof DOPAMINE_YIELDS[number];


// ---------------------------------------------------------------------------
// 3. DESIGN SYSTEM & VFX TOKENS
// ---------------------------------------------------------------------------

export type ThemeName = "Ocean" | "Forest" | "Galaxy" | "Sunset" | "Volcano" | "Royal" | "Ice" | "Neon" | "Void";

export interface ChallengeTheme {
  name: ThemeName;
  
  /** Tailwind v4 Utility Classes */
  bgGradient: string;     // Outer card gradient (e.g., 'from-indigo-950 via-slate-900 to-slate-950')
  borderGlow: string;     // Hover state shadow (e.g., 'hover:shadow-[0_0_30px_var(--color-primary)]')
  iconContainer: string;  // Background/border for the emoji (e.g., 'bg-indigo-500/10 border-indigo-500/20')
  badgeColor: string;     // Rarity text color (e.g., 'text-indigo-400')
  
  /** Framer Motion / Canvas VFX Engine Cues */
  particleColors: string[]; // Hex codes for confetti/sparks (e.g., ['#6366f1', '#a855f7'])
  
  /** Determines if a full-screen cinematic sequence plays on unlock/completion */
  cinematicVFX?: "none" | "aurora_burst" | "cosmic_shockwave" | "divine_light";
}

export interface AudioEngineCues {
  onStart?: "whoosh" | "digital_boot" | "chime" | "deep_hum";
  onComplete: "success_chime" | "heavy_bass_drop" | "ethereal_ping" | "level_up" | "mythic_choir";
}

export interface HapticEngineCues {
  onStart?: "light" | "medium";
  onTick?: "light"; // For timers (e.g., every 5 minutes)
  onComplete: "success" | "heavy" | "cinematic_rumble";
}


// ---------------------------------------------------------------------------
// 4. MODULAR CHALLENGE DOMAIN COMPOSITION
// ---------------------------------------------------------------------------

export interface ChallengeCore {
  id: ChallengeId | string; // Fallback to string for literal initialization, but strict when passing state
  title: string;
  description: string;
  emoji: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  rarity: ChallengeRarity;
}

export interface ChallengeRules {
  durationMinutes: number;
  timeWindow: ChallengeTimeWindow;
  actionType: ChallengeActionType;
  /** Optional progression locks */
  requirements?: {
    minLevel?: number;
    minStreak?: number;
    prerequisiteIds?: (ChallengeId | string)[];
  };
}

export interface ChallengeGamification {
  xpReward: number;
  coinsReward: number;
  /** Psychological profiling for algorithm sorting */
  psychologicalProfile: {
    dopamineYield: DopamineYield;
    flavorText: string; // E.g., "Do not flinch. Do not look away."
    cognitiveLoad: 1 | 2 | 3 | 4 | 5; // 1 = mindless, 5 = deep focus required
  };
}

export interface ChallengePresentation {
  theme: ChallengeTheme;
  audio: AudioEngineCues;
  haptics: HapticEngineCues;
}

/**
 * @interface OutstandChallenge
 * @description The master entity representing a gamified task within the Outstand ecosystem.
 * Composed of modular interfaces for strict separation of concerns.
 */
export interface OutstandChallenge extends 
  ChallengeCore, 
  ChallengeRules, 
  ChallengeGamification, 
  ChallengePresentation {}


// ---------------------------------------------------------------------------
// 5. USER PROGRESSION & TELEMETRY
// ---------------------------------------------------------------------------

export type ChallengeStatus = "locked" | "available" | "active" | "completed" | "skipped" | "failed";

export interface UserChallengeProgress {
  challengeId: ChallengeId | string;
  status: ChallengeStatus;
  
  /** 
   * High-fidelity Telemetry 
   * Essential for ML/Algorithm tracking to know what users actually engage with.
   */
  startedAt?: string;   // ISO 8601
  completedAt?: string; // ISO 8601
  actualTimeSpentSeconds?: number; // How long it *actually* took them
  interruptionCount?: number;      // How many times they left the app during a timer
  
  /** Progression & Anti-Repetition */
  timesCompleted: number;
  lastSeenAt: string;   // ISO 8601
}
