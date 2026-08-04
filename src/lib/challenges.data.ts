// src/lib/challenges.data.ts

import type { 
  OutstandChallenge, 
  ChallengeTheme, 
  ChallengeId, 
  ThemeName 
} from "./challenges.types";

/**
 * ===========================================================================
 * TYPE-SAFE ID FACTORY
 * ===========================================================================
 * Utility to safely cast standard strings into our strict Branded Type
 * without polluting the data structures with "as ChallengeId" everywhere.
 */
const createId = (id: string): ChallengeId => id as ChallengeId;

/**
 * ===========================================================================
 * 1. THE DICTIONARY OF THEMES (VFX & DESIGN TOKENS)
 * ===========================================================================
 * Apple-grade gradients, volumetric glows, and particle arrays.
 */
export const CHALLENGE_THEMES: Record<ThemeName, ChallengeTheme> = {
  Ocean: {
    name: "Ocean",
    bgGradient: "bg-gradient-to-br from-blue-950 via-slate-900 to-[#020617]",
    borderGlow: "hover:shadow-[0_0_40px_rgba(56,189,248,0.2)]",
    iconContainer: "bg-sky-500/10 border-sky-500/20",
    badgeColor: "text-sky-400",
    particleColors: ["#38bdf8", "#0ea5e9", "#ffffff"],
    cinematicVFX: "none",
  },
  Forest: {
    name: "Forest",
    bgGradient: "bg-gradient-to-br from-emerald-950 via-slate-900 to-[#020617]",
    borderGlow: "hover:shadow-[0_0_40px_rgba(52,211,153,0.2)]",
    iconContainer: "bg-emerald-500/10 border-emerald-500/20",
    badgeColor: "text-emerald-400",
    particleColors: ["#34d399", "#10b981", "#ffffff"],
    cinematicVFX: "none",
  },
  Galaxy: {
    name: "Galaxy",
    bgGradient: "bg-gradient-to-br from-indigo-950 via-purple-900/30 to-[#020617]",
    borderGlow: "hover:shadow-[0_0_50px_rgba(129,140,248,0.25)]",
    iconContainer: "bg-indigo-500/15 border-indigo-500/30",
    badgeColor: "text-indigo-400",
    particleColors: ["#818cf8", "#c084fc", "#ffffff"],
    cinematicVFX: "aurora_burst",
  },
  Sunset: {
    name: "Sunset",
    bgGradient: "bg-gradient-to-br from-rose-950 via-orange-900/20 to-[#020617]",
    borderGlow: "hover:shadow-[0_0_40px_rgba(251,146,60,0.2)]",
    iconContainer: "bg-orange-500/10 border-orange-500/20",
    badgeColor: "text-orange-400",
    particleColors: ["#fb923c", "#f43f5e", "#ffffff"],
    cinematicVFX: "none",
  },
  Volcano: {
    name: "Volcano",
    bgGradient: "bg-gradient-to-br from-red-950 via-stone-900 to-[#020617]",
    borderGlow: "hover:shadow-[0_0_50px_rgba(248,113,113,0.25)]",
    iconContainer: "bg-red-500/15 border-red-500/30",
    badgeColor: "text-red-400",
    particleColors: ["#f87171", "#dc2626", "#ffffff"],
    cinematicVFX: "cosmic_shockwave",
  },
  Royal: {
    name: "Royal",
    bgGradient: "bg-gradient-to-br from-amber-950/60 via-slate-900 to-[#020617]",
    borderGlow: "hover:shadow-[0_0_60px_rgba(251,191,36,0.3)]",
    iconContainer: "bg-amber-500/15 border-amber-500/30",
    badgeColor: "text-amber-400",
    particleColors: ["#fbbf24", "#f59e0b", "#ffffff"],
    cinematicVFX: "divine_light",
  },
  Ice: {
    name: "Ice",
    bgGradient: "bg-gradient-to-br from-cyan-950 via-slate-900 to-[#020617]",
    borderGlow: "hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]",
    iconContainer: "bg-cyan-500/10 border-cyan-500/20",
    badgeColor: "text-cyan-400",
    particleColors: ["#22d3ee", "#06b6d4", "#ffffff"],
    cinematicVFX: "none",
  },
  Neon: {
    name: "Neon",
    bgGradient: "bg-gradient-to-br from-fuchsia-950 via-slate-900 to-[#020617]",
    borderGlow: "hover:shadow-[0_0_50px_rgba(232,121,249,0.25)]",
    iconContainer: "bg-fuchsia-500/15 border-fuchsia-500/30",
    badgeColor: "text-fuchsia-400",
    particleColors: ["#e879f9", "#d946ef", "#ffffff"],
    cinematicVFX: "aurora_burst",
  },
  Void: {
    name: "Void",
    bgGradient: "bg-gradient-to-br from-zinc-900/60 via-black to-[#000000]",
    borderGlow: "hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]",
    iconContainer: "bg-zinc-800/50 border-zinc-700/50",
    badgeColor: "text-zinc-300",
    particleColors: ["#a1a1aa", "#71717a", "#ffffff"],
    cinematicVFX: "none",
  }
};

/**
 * ===========================================================================
 * 2. THE MASTER CHALLENGE MATRIX (CLASS 10 EDITION - PART 1)
 * ===========================================================================
 * The first 10 hyper-optimized challenges tailored for Board Exam students.
 */
export const CHALLENGES: OutstandChallenge[] = [
  {
    // CORE
    id: createId("focus_deep_work_01"),
    title: "The Deep Trench",
    description: "Execute a continuous deep work session for Maths or Science. Zero interruptions, tab switching, or screen wakes.",
    emoji: "🧠",
    category: "Focus",
    difficulty: "Hard",
    rarity: "Epic",
    // RULES
    durationMinutes: 90,
    timeWindow: "Anytime",
    actionType: "ZenMode",
    // GAMIFICATION
    xpReward: 400,
    coinsReward: 100,
    psychologicalProfile: {
      dopamineYield: "Low",
      flavorText: "Depth is a superpower in a distracted world.",
      cognitiveLoad: 5,
    },
    // PRESENTATION
    theme: CHALLENGE_THEMES.Ocean,
    audio: { onStart: "deep_hum", onComplete: "heavy_bass_drop" },
    haptics: { onStart: "medium", onTick: "light", onComplete: "cinematic_rumble" }
  },
  {
    id: createId("detox_morning_monk_01"),
    title: "Monk Mode Morning",
    description: "Do not unlock your phone for the first 60 minutes after waking up. Reclaim your baseline dopamine.",
    emoji: "🌅",
    category: "Phone Detox",
    difficulty: "Medium",
    rarity: "Rare",
    durationMinutes: 60,
    timeWindow: "Morning",
    actionType: "Toggle",
    xpReward: 150,
    coinsReward: 25,
    psychologicalProfile: {
      dopamineYield: "Reset",
      flavorText: "Win the morning, win the board exams.",
      cognitiveLoad: 2,
    },
    theme: CHALLENGE_THEMES.Volcano,
    audio: { onStart: "digital_boot", onComplete: "ethereal_ping" },
    haptics: { onStart: "light", onComplete: "success" }
  },
  {
    id: createId("knowledge_board_sim_01"),
    title: "Board Exam Simulator",
    description: "Sit for a full 3-hour past-year question paper. No music, no breaks, no looking at answers until the timer ends.",
    emoji: "🏛️",
    category: "Knowledge",
    difficulty: "Master",
    rarity: "Divine",
    durationMinutes: 180,
    timeWindow: "Anytime",
    actionType: "Timer",
    xpReward: 1500,
    coinsReward: 500,
    psychologicalProfile: {
      dopamineYield: "Surge",
      flavorText: "Sweat in practice, bleed less in battle.",
      cognitiveLoad: 5,
    },
    requirements: { minLevel: 5 }, // Unlockable content
    theme: CHALLENGE_THEMES.Royal,
    audio: { onStart: "chime", onComplete: "mythic_choir" },
    haptics: { onStart: "heavy", onTick: "light", onComplete: "cinematic_rumble" }
  },
  {
    id: createId("mindset_the_resistance_01"),
    title: "The Resistance",
    description: "Take your phone, put it on silent, and leave it in another room entirely for the next 2 hours of study.",
    emoji: "🛡️",
    category: "Mindset",
    difficulty: "Easy",
    rarity: "Uncommon",
    durationMinutes: 120,
    timeWindow: "Anytime",
    actionType: "Toggle",
    xpReward: 75,
    coinsReward: 10,
    psychologicalProfile: {
      dopamineYield: "Reset",
      flavorText: "Out of sight, out of mind.",
      cognitiveLoad: 1,
    },
    theme: CHALLENGE_THEMES.Forest,
    audio: { onComplete: "success_chime" },
    haptics: { onComplete: "success" }
  },
  {
    id: createId("prod_pomodoro_ascendant_01"),
    title: "Pomodoro Ascendant",
    description: "Complete four perfect 25-minute study intervals with strict 5-minute breaks. Do not touch social media during breaks.",
    emoji: "⏳",
    category: "Productivity",
    difficulty: "Hard",
    rarity: "Legendary",
    durationMinutes: 120, // (25+5) * 4
    timeWindow: "Anytime",
    actionType: "Timer",
    xpReward: 600,
    coinsReward: 150,
    psychologicalProfile: {
      dopamineYield: "High",
      flavorText: "Rhythm is the ultimate weapon against procrastination.",
      cognitiveLoad: 4,
    },
    theme: CHALLENGE_THEMES.Galaxy,
    audio: { onStart: "digital_boot", onComplete: "level_up" },
    haptics: { onStart: "light", onTick: "light", onComplete: "heavy" }
  },
  {
    id: createId("fitness_desk_detox_01"),
    title: "Desk Detox",
    description: "Stand up. Stretch your neck, shoulders, and lower back for 10 minutes. Hydrate immediately.",
    emoji: "🧘‍♂️",
    category: "Fitness",
    difficulty: "Easy",
    rarity: "Common",
    durationMinutes: 10,
    timeWindow: "Anytime",
    actionType: "Toggle",
    xpReward: 50,
    coinsReward: 5,
    psychologicalProfile: {
      dopamineYield: "Low",
      flavorText: "Your brain needs blood flow to retain formulas.",
      cognitiveLoad: 1,
    },
    theme: CHALLENGE_THEMES.Ice,
    audio: { onComplete: "success_chime" },
    haptics: { onComplete: "light" }
  },
  {
    id: createId("detox_the_void_01"),
    title: "The Void",
    description: "A 4-hour absolute digital blackout. Read NCERT books, write notes physically. Turn Wi-Fi and Data off completely.",
    emoji: "🕳️",
    category: "Phone Detox",
    difficulty: "Extreme",
    rarity: "Mythic",
    durationMinutes: 240,
    timeWindow: "Anytime",
    actionType: "ZenMode",
    xpReward: 1000,
    coinsReward: 300,
    psychologicalProfile: {
      dopamineYield: "Surge",
      flavorText: "In the silence of the Void, top percentiles are forged.",
      cognitiveLoad: 4,
    },
    requirements: { minStreak: 3 }, // Requires a 3-day app streak
    theme: CHALLENGE_THEMES.Void,
    audio: { onStart: "deep_hum", onComplete: "mythic_choir" },
    haptics: { onStart: "heavy", onComplete: "cinematic_rumble" }
  },
  {
    id: createId("mindset_exam_autopsy_01"),
    title: "Post-Test Autopsy",
    description: "Analyze a recent mock test. Write down 3 silly mistakes and exactly how you will prevent them next time.",
    emoji: "✍️",
    category: "Mindset",
    difficulty: "Medium",
    rarity: "Rare",
    durationMinutes: 20,
    timeWindow: "Afternoon",
    actionType: "Reflection",
    xpReward: 200,
    coinsReward: 50,
    psychologicalProfile: {
      dopamineYield: "Medium",
      flavorText: "Failure is just data collection.",
      cognitiveLoad: 3,
    },
    theme: CHALLENGE_THEMES.Neon,
    audio: { onStart: "whoosh", onComplete: "ethereal_ping" },
    haptics: { onStart: "light", onComplete: "success" }
  },
  {
    id: createId("discipline_zero_notif_01"),
    title: "Do Not Disturb",
    description: "Keep your phone on DND (Do Not Disturb) mode for a 2-hour study block. No exceptions.",
    emoji: "🔕",
    category: "Discipline",
    difficulty: "Medium",
    rarity: "Epic",
    durationMinutes: 120,
    timeWindow: "Anytime",
    actionType: "ZenMode",
    xpReward: 350,
    coinsReward: 80,
    psychologicalProfile: {
      dopamineYield: "Medium",
      flavorText: "Protect your attention like it's your most valuable asset.",
      cognitiveLoad: 2,
    },
    theme: CHALLENGE_THEMES.Sunset,
    audio: { onStart: "chime", onComplete: "heavy_bass_drop" },
    haptics: { onStart: "medium", onComplete: "heavy" }
  },
  {
    id: createId("knowledge_syllabus_deconstruct_01"),
    title: "Syllabus Deconstruction",
    description: "Stop blindly studying. Spend 30 minutes mapping out exactly what chapters are left for your weakest subject.",
    emoji: "🗺️",
    category: "Productivity",
    difficulty: "Medium",
    rarity: "Legendary",
    durationMinutes: 30,
    timeWindow: "Morning",
    actionType: "Timer",
    xpReward: 450,
    coinsReward: 100,
    psychologicalProfile: {
      dopamineYield: "High",
      flavorText: "A plan violently executed today is better than a perfect plan next week.",
      cognitiveLoad: 4,
    },
    theme: CHALLENGE_THEMES.Ocean,
    audio: { onStart: "digital_boot", onComplete: "level_up" },
    haptics: { onStart: "medium", onComplete: "success" }
  }
];
