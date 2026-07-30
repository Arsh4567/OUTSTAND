// src/lib/challenges.data.ts

import type { OutstandChallenge, ChallengeTheme } from "./challenges.types";

/**
 * ---------------------------------------------------------------------------
 * THEME DICTIONARY
 * Pre-configured design tokens for canvas particles and Tailwind CSS.
 * ---------------------------------------------------------------------------
 */
export const CHALLENGE_THEMES: Record<string, ChallengeTheme> = {
  Ocean: {
    name: "Ocean",
    bgGradient: "from-blue-950 via-slate-900 to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]",
    iconContainer: "bg-sky-500/10 border-sky-500/20",
    badgeColor: "text-sky-400",
    particleColors: ["#38bdf8", "#0ea5e9", "#ffffff"],
  },
  Forest: {
    name: "Forest",
    bgGradient: "from-emerald-950 via-slate-900 to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]",
    iconContainer: "bg-emerald-500/10 border-emerald-500/20",
    badgeColor: "text-emerald-400",
    particleColors: ["#34d399", "#10b981", "#ffffff"],
  },
  Galaxy: {
    name: "Galaxy",
    bgGradient: "from-indigo-950 via-purple-900/20 to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(129,140,248,0.15)]",
    iconContainer: "bg-indigo-500/10 border-indigo-500/20",
    badgeColor: "text-indigo-400",
    particleColors: ["#818cf8", "#c084fc", "#ffffff"],
  },
  Sunset: {
    name: "Sunset",
    bgGradient: "from-rose-950 via-orange-900/20 to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(251,146,60,0.15)]",
    iconContainer: "bg-orange-500/10 border-orange-500/20",
    badgeColor: "text-orange-400",
    particleColors: ["#fb923c", "#f43f5e", "#ffffff"],
  },
  Volcano: {
    name: "Volcano",
    bgGradient: "from-red-950 via-stone-900 to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(248,113,113,0.15)]",
    iconContainer: "bg-red-500/10 border-red-500/20",
    badgeColor: "text-red-400",
    particleColors: ["#f87171", "#dc2626", "#ffffff"],
  },
  Royal: {
    name: "Royal",
    bgGradient: "from-amber-950/50 via-slate-900 to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]",
    iconContainer: "bg-amber-500/10 border-amber-500/20",
    badgeColor: "text-amber-400",
    particleColors: ["#fbbf24", "#f59e0b", "#ffffff"],
  },
  Ice: {
    name: "Ice",
    bgGradient: "from-cyan-950 via-slate-900 to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]",
    iconContainer: "bg-cyan-500/10 border-cyan-500/20",
    badgeColor: "text-cyan-400",
    particleColors: ["#22d3ee", "#06b6d4", "#ffffff"],
  },
  Neon: {
    name: "Neon",
    bgGradient: "from-fuchsia-950 via-slate-900 to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(232,121,249,0.15)]",
    iconContainer: "bg-fuchsia-500/10 border-fuchsia-500/20",
    badgeColor: "text-fuchsia-400",
    particleColors: ["#e879f9", "#d946ef", "#ffffff"],
  },
  Void: {
    name: "Void",
    bgGradient: "from-zinc-900/50 via-black to-[#050505]",
    borderGlow: "hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]",
    iconContainer: "bg-zinc-800/50 border-zinc-700/50",
    badgeColor: "text-zinc-400",
    particleColors: ["#a1a1aa", "#71717a", "#ffffff"],
  }
};

/**
 * ---------------------------------------------------------------------------
 * THE MASTER CHALLENGE MATRIX (V1)
 * ---------------------------------------------------------------------------
 */
export const OUTSTAND_CHALLENGES: OutstandChallenge[] = [
  {
    id: "focus_deep_work_01",
    title: "The Deep Trench",
    description: "Execute a continuous deep work session. Zero interruptions, tab switching, or screen wakes.",
    emoji: "🧠",
    durationMinutes: 120,
    category: "Focus",
    difficulty: "Hard",
    rarity: "Epic",
    timeWindow: "Anytime",
    actionType: "Timer",
    xpReward: 400,
    coinsReward: 100,
    dopamineYield: "Low",
    flavorText: "Depth is a superpower in a shallow world.",
    theme: CHALLENGE_THEMES.Ocean,
    audio: {
      onStart: "whoosh",
      onComplete: "ethereal_ping",
    }
  },
  {
    id: "detox_morning_monk_01",
    title: "Monk Mode Morning",
    description: "Do not unlock your phone for the first 60 minutes after waking up. Reclaim your baseline.",
    emoji: "🌅",
    durationMinutes: 60,
    category: "Phone Detox",
    difficulty: "Medium",
    rarity: "Rare",
    timeWindow: "Morning",
    actionType: "Toggle",
    xpReward: 150,
    coinsReward: 25,
    dopamineYield: "Reset",
    flavorText: "Win the morning, win the war.",
    theme: CHALLENGE_THEMES.Volcano,
    audio: {
      onStart: "digital_boot",
      onComplete: "heavy_bass_drop",
    }
  },
  {
    id: "discipline_gray_area_01",
    title: "The Gray Area",
    description: "Switch your phone's display to Grayscale mode for the entire day. Watch the urge to scroll fade.",
    emoji: "👁️",
    durationMinutes: 1440,
    category: "Discipline",
    difficulty: "Medium",
    rarity: "Uncommon",
    timeWindow: "Anytime",
    actionType: "Toggle",
    xpReward: 200,
    coinsReward: 50,
    dopamineYield: "Reset",
    flavorText: "Starve the algorithm of its colors.",
    theme: CHALLENGE_THEMES.Void,
    audio: {
      onComplete: "success_chime",
    }
  },
  {
    id: "mindset_unplugged_wander_01",
    title: "Unplugged Wander",
    description: "Go for a 30-minute walk outside without your phone. Listen to the environment, not a podcast.",
    emoji: "🌲",
    durationMinutes: 30,
    category: "Mindset",
    difficulty: "Easy",
    rarity: "Common",
    timeWindow: "Anytime",
    actionType: "Timer",
    xpReward: 100,
    coinsReward: 15,
    dopamineYield: "Medium",
    flavorText: "Silence is where you hear yourself think.",
    theme: CHALLENGE_THEMES.Forest,
    audio: {
      onComplete: "ethereal_ping",
    }
  },
  {
    id: "detox_digital_fast_01",
    title: "The 24H Reset",
    description: "A complete digital fast. No social media, no endless scrolling. Just you and reality.",
    emoji: "🛡️",
    durationMinutes: 1440,
    category: "Phone Detox",
    difficulty: "Master",
    rarity: "Legendary",
    timeWindow: "Anytime",
    actionType: "Reflection",
    xpReward: 1500,
    coinsReward: 500,
    dopamineYield: "Reset",
    flavorText: "The ultimate test of digital sovereignty.",
    theme: CHALLENGE_THEMES.Neon,
    audio: {
      onStart: "digital_boot",
      onComplete: "level_up",
    },
    requirements: {
      minLevel: 5,
      completedChallengeIds: ["detox_morning_monk_01"],
    }
  }
];
      
