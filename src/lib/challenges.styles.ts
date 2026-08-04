import { Variants } from "framer-motion";
import { OutstandChallenge } from "./challenges.types";

/**
 * ===========================================================================
 * 1. CORE PHYSICS & TIMING ENGINE
 * ===========================================================================
 * Master configurations for Apple/Linear-style motion.
 * Reusable constants ensure the entire app feels unified, physics-based, and premium.
 */

export const EASING = {
  cinematic: [0.19, 1, 0.22, 1], // Unforgivingly smooth (Apple's fluid ease)
  expoOut: [0.16, 1, 0.3, 1],    // Snappy entrance
  smooth: [0.4, 0, 0.2, 1],      // Standard UI transitions
};

export const SPRINGS = {
  snappy: { type: "spring", damping: 20, stiffness: 400, mass: 0.8 },
  bouncy: { type: "spring", damping: 15, stiffness: 350, mass: 0.6 },
  heavy: { type: "spring", damping: 30, stiffness: 200, mass: 1.2 }, // Good for 3D tilts
};

/**
 * ===========================================================================
 * 2. FRAMER MOTION VARIANTS (UI COMPONENT MOTION)
 * ===========================================================================
 */

export const challengeListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
      ease: EASING.cinematic,
    },
  },
};

export const challengeCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    z: -50,
    scale: 0.9,
    rotateX: 10,
    filter: "blur(16px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    z: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      ...SPRINGS.snappy,
      opacity: { duration: 0.4, ease: EASING.cinematic },
      filter: { duration: 0.4, ease: EASING.cinematic },
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    // Note: To utilize full 3D tilt, pair this with useMotionValue on the consumer side
    // updating --mouse-x and --mouse-y CSS variables.
    rotateX: "var(--card-rotate-x, 0deg)",
    rotateY: "var(--card-rotate-y, 0deg)",
    z: 20, 
    transition: SPRINGS.bouncy,
  },
  tap: {
    y: -2,
    scale: 0.98,
    z: -10,
    transition: { ...SPRINGS.snappy, stiffness: 500 },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    filter: "blur(12px)",
    transition: { duration: 0.3, ease: EASING.expoOut },
  },
};

export const iconPulseAnimation: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.8, 1, 0.8],
    filter: [
      "brightness(1) drop-shadow(0px 0px 0px rgba(255,255,255,0))", 
      "brightness(1.3) drop-shadow(0px 0px 12px rgba(255,255,255,0.5))", 
      "brightness(1) drop-shadow(0px 0px 0px rgba(255,255,255,0))"
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * ===========================================================================
 * 3. CINEMATIC VFX SEQUENCES (MILESTONES & REWARDS)
 * ===========================================================================
 * Use these variants for full-screen takeovers when unlocking Mythic/Divine.
 */

export const cinematicUnlockVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, filter: "blur(40px) brightness(0)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px) brightness(1)",
    transition: { duration: 1.2, ease: EASING.cinematic },
  },
  shockwave: {
    scale: [1, 3],
    opacity: [1, 0],
    borderWidth: ["10px", "0px"],
    transition: { duration: 0.8, ease: "easeOut" },
  }
};

/**
 * ===========================================================================
 * 4. PREMIUM VISUAL ENGINE (TAILWIND V4 CLASS MAP)
 * ===========================================================================
 * Modularized to ensure DRY principles. Uses transform-gpu, will-change, 
 * layered box-shadows, and motion-safe fallbacks for accessibility.
 */

const BASE_STYLES = {
  // Hardware accelerated, isolating paint contexts, 3D transform ready
  card: "relative isolate rounded-3xl overflow-hidden backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu will-change-transform motion-reduce:transition-none motion-reduce:transform-none",
  // Standard specular highlight (top edge light simulation)
  specularLight: "border-t border-t-white/20 border-x border-x-white/5 border-b border-b-white/5",
  // Inner glow base for volumetric depth
  innerDepth: "absolute inset-0 pointer-events-none transition-all duration-700",
};

export function getChallengeStyles(challenge: OutstandChallenge) {
  const { rarity, theme } = challenge;

  const safeTheme = theme || {
    bgGradient: "bg-zinc-900/50",
    borderGlow: "hover:shadow-none",
    iconContainer: "bg-zinc-800/80 border-zinc-700",
    badgeColor: "text-zinc-400",
    particleColors: ["#ffffff", "#a1a1aa"],
  };

  switch (rarity) {
    case "Divine":
      return {
        // Aurora mesh gradient bleed
        ambientBleed: `absolute -inset-4 ${safeTheme.bgGradient} rounded-[3rem] blur-[60px] opacity-60 group-hover:opacity-100 mix-blend-screen transition-opacity duration-1000 will-change-[opacity] animate-[pulse_4s_ease-in-out_infinite]`,
        
        cardBase: `${BASE_STYLES.card} ${safeTheme.bgGradient} ${BASE_STYLES.specularLight} border-t-white/60 border-x-white/30 border-b-white/10 ${safeTheme.borderGlow} shadow-[0_20px_80px_-20px_rgba(255,255,255,0.2)] group-hover:shadow-[0_30px_100px_-20px_rgba(255,255,255,0.4)]`,
        
        innerGlow: `${BASE_STYLES.innerDepth} shadow-[inset_0_0_80px_rgba(255,255,255,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] group-hover:shadow-[inset_0_0_120px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,1)]`,
        
        text: `${safeTheme.badgeColor} font-black tracking-tighter drop-shadow-[0_0_24px_rgba(255,255,255,1)]`,
        
        // Realistic glass reflection flare + animated shimmer
        flare: "absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none mix-blend-overlay",
        
        iconBg: `${safeTheme.iconContainer} shadow-[0_0_40px_rgba(255,255,255,0.8)] border-white/50 ring-1 ring-white/20`,
        
        particleColors: safeTheme.particleColors,
      };

    case "Mythic":
      return {
        ambientBleed: `absolute -inset-2 ${safeTheme.bgGradient} rounded-[2.5rem] blur-[40px] opacity-40 group-hover:opacity-70 transition-opacity duration-700`,
        
        cardBase: `${BASE_STYLES.card} ${safeTheme.bgGradient} ${BASE_STYLES.specularLight} border-t-white/40 border-x-white/15 ${safeTheme.borderGlow} shadow-[0_15px_60px_-15px_rgba(255,255,255,0.15)] group-hover:shadow-[0_20px_80px_-15px_rgba(255,255,255,0.25)]`,
        
        innerGlow: `${BASE_STYLES.innerDepth} shadow-[inset_0_1px_40px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.5)] group-hover:shadow-[inset_0_1px_60px_rgba(255,255,255,0.2)]`,
        
        text: `${safeTheme.badgeColor} font-extrabold tracking-tight drop-shadow-[0_2px_20px_rgba(255,255,255,0.6)]`,
        
        flare: "absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay",
        
        iconBg: `${safeTheme.iconContainer} shadow-[0_0_25px_rgba(255,255,255,0.5)] border-white/30`,
        
        particleColors: safeTheme.particleColors,
      };

    case "Legendary":
      return {
        ambientBleed: `absolute -inset-1 ${safeTheme.bgGradient} rounded-3xl blur-2xl opacity-25 group-hover:opacity-50 transition-opacity duration-700`,
        
        cardBase: `${BASE_STYLES.card} ${safeTheme.bgGradient} ${BASE_STYLES.specularLight} border-t-white/25 ${safeTheme.borderGlow} shadow-2xl`,
        
        innerGlow: `${BASE_STYLES.innerDepth} shadow-[inset_0_1px_20px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)] group-hover:shadow-[inset_0_1px_35px_rgba(255,255,255,0.12)]`,
        
        text: `${safeTheme.badgeColor} font-bold drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]`,
        
        flare: "absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none",
        
        iconBg: `${safeTheme.iconContainer} shadow-[0_0_15px_rgba(255,255,255,0.2)] border-white/20`,
        
        particleColors: safeTheme.particleColors,
      };

    case "Epic":
      return {
        ambientBleed: `absolute -inset-0.5 ${safeTheme.bgGradient} rounded-3xl blur-xl opacity-15 group-hover:opacity-35 transition-opacity duration-500`,
        
        cardBase: `${BASE_STYLES.card} ${safeTheme.bgGradient} border border-white/10 border-t-white/20 ${safeTheme.borderGlow} shadow-xl`,
        
        innerGlow: `${BASE_STYLES.innerDepth} shadow-[inset_0_1px_10px_rgba(255,255,255,0.05)] group-hover:shadow-[inset_0_1px_20px_rgba(255,255,255,0.08)]`,
        
        text: `${safeTheme.badgeColor} font-semibold drop-shadow-md`,
        
        flare: "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        
        iconBg: `${safeTheme.iconContainer} border-white/10`,
        
        particleColors: safeTheme.particleColors,
      };

    case "Rare":
      return {
        ambientBleed: `absolute inset-0 ${safeTheme.bgGradient} rounded-3xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500`,
        
        cardBase: `${BASE_STYLES.card} ${safeTheme.bgGradient} border border-white/5 border-t-white/15 ${safeTheme.borderGlow} shadow-lg`,
        
        innerGlow: `${BASE_STYLES.innerDepth} group-hover:shadow-[inset_0_1px_15px_rgba(255,255,255,0.05)]`,
        
        text: `${safeTheme.badgeColor} font-semibold`,
        
        flare: "hidden",
        
        iconBg: safeTheme.iconContainer,
        
        particleColors: safeTheme.particleColors,
      };

    case "Uncommon":
      return {
        ambientBleed: "hidden",
        
        cardBase: `${BASE_STYLES.card} ${safeTheme.bgGradient} border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-colors duration-300 shadow-md`,
        
        innerGlow: "hidden",
        
        text: `${safeTheme.badgeColor} font-medium`,
        
        flare: "hidden",
        
        iconBg: safeTheme.iconContainer,
        
        particleColors: safeTheme.particleColors,
      };

    case "Common":
    default:
      return {
        ambientBleed: "hidden",
        
        cardBase: `${BASE_STYLES.card} bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/10 transition-colors duration-300 shadow-sm`,
        
        innerGlow: "hidden",
        
        text: "text-zinc-400 font-medium",
        
        flare: "hidden",
        
        iconBg: "bg-white/[0.03] border border-white/5 text-zinc-400",
        
        particleColors: ["#3f3f46", "#71717a"], // Deep zinc
      };
  }
}
