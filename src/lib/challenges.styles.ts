import { Variants } from "framer-motion";
import { OutstandChallenge } from "./challenges.types";

/**
 * ---------------------------------------------------------------------------
 * 1. FRAMER MOTION PHYSICS & ANIMATIONS
 * ---------------------------------------------------------------------------
 * Tuned for a premium, heavy, and precise feel. Less "floaty", more "snappy".
 */

export const challengeListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.08, 
      delayChildren: 0.1,
      ease: [0.25, 0.1, 0.25, 1], // Cinematic ease-in-out
    },
  },
};

export const challengeCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    scale: 0.95,
    filter: "blur(12px)" 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: { 
      type: "spring", 
      damping: 24, 
      stiffness: 250, 
      mass: 0.8 
    } // Snappy, Apple-like spring
  },
  hover: { 
    y: -6,
    scale: 1.015,
    transition: { 
      type: "spring", 
      damping: 20, 
      stiffness: 400 
    }
  },
  tap: { 
    y: -2, 
    scale: 0.985, 
    transition: { 
      type: "spring", 
      damping: 15, 
      stiffness: 500 
    }
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    filter: "blur(8px)",
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

export const iconPulseAnimation: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.85, 1, 0.85],
    filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
    transition: { 
      duration: 3, 
      repeat: Infinity, 
      ease: "easeInOut" 
    },
  },
};

/**
 * ---------------------------------------------------------------------------
 * 2. PREMIUM VISUAL ENGINE (TAILWIND)
 * ---------------------------------------------------------------------------
 * Features multi-layered glassmorphism, overhead light simulation (top borders),
 * and dynamic ambient bleeds that scale intensely with Rarity.
 */

export function getChallengeStyles(challenge: OutstandChallenge) {
  const { rarity, theme } = challenge;

  // Defensive fallback
  const safeTheme = theme || {
    bgGradient: "bg-zinc-900/50",
    borderGlow: "hover:shadow-none",
    iconContainer: "bg-zinc-800/80 border-zinc-700",
    badgeColor: "text-zinc-400",
    particleColors: ["#ffffff", "#a1a1aa"],
  };

  // Base card styles applied to all rarities for consistent layout and glass effects
  const baseCard = "relative rounded-2xl overflow-hidden backdrop-blur-3xl shadow-2xl transition-all duration-500 ease-out";

  switch (rarity) {
    case "Divine":
      return {
        ambientBleed: `absolute -inset-2 ${safeTheme.bgGradient} rounded-[2rem] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700`,
        cardBase: `${baseCard} ${safeTheme.bgGradient} border-t-[1px] border-l-[1px] border-r-[1px] border-b-[0.5px] border-t-white/50 border-x-white/20 border-b-white/10 ${safeTheme.borderGlow}`,
        innerGlow: "absolute inset-0 shadow-[inset_0_0_60px_rgba(255,255,255,0.15)] group-hover:shadow-[inset_0_0_80px_rgba(255,255,255,0.25)] transition-all duration-700 pointer-events-none",
        text: `${safeTheme.badgeColor} font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] tracking-tight`,
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none",
        iconBg: `${safeTheme.iconContainer} shadow-[0_0_30px_rgba(255,255,255,0.8)] border-white/40`,
        particleColors: safeTheme.particleColors,
      };

    case "Mythic":
      return {
        ambientBleed: `absolute -inset-1.5 ${safeTheme.bgGradient} rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 animate-pulse`,
        cardBase: `${baseCard} ${safeTheme.bgGradient} border-t-[1px] border-x-[0.5px] border-b-[0.5px] border-t-white/30 border-white/10 ${safeTheme.borderGlow}`,
        innerGlow: "absolute inset-0 shadow-[inset_0_1px_40px_rgba(255,255,255,0.1)] group-hover:shadow-[inset_0_1px_60px_rgba(255,255,255,0.15)] transition-all duration-500 pointer-events-none",
        text: `${safeTheme.badgeColor} font-extrabold drop-shadow-[0_2px_15px_rgba(255,255,255,0.5)]`,
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
        iconBg: `${safeTheme.iconContainer} shadow-[0_0_20px_rgba(255,255,255,0.4)] border-white/20`,
        particleColors: safeTheme.particleColors,
      };

    case "Legendary":
      return {
        ambientBleed: `absolute -inset-1 ${safeTheme.bgGradient} rounded-3xl blur-xl opacity-25 group-hover:opacity-45 transition-opacity duration-700`,
        cardBase: `${baseCard} ${safeTheme.bgGradient} border-t-[1px] border-white/20 border-x-white/5 border-b-white/5 ${safeTheme.borderGlow}`,
        innerGlow: "absolute inset-0 shadow-[inset_0_1px_20px_rgba(255,255,255,0.05)] group-hover:shadow-[inset_0_1px_35px_rgba(255,255,255,0.1)] transition-all duration-500 pointer-events-none",
        text: `${safeTheme.badgeColor} font-bold drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]`,
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2.5s_infinite] pointer-events-none",
        iconBg: `${safeTheme.iconContainer} shadow-lg border-white/10`,
        particleColors: safeTheme.particleColors,
      };

    case "Epic":
      return {
        ambientBleed: `absolute -inset-0.5 ${safeTheme.bgGradient} rounded-3xl blur-lg opacity-15 group-hover:opacity-30 transition-opacity duration-500`,
        cardBase: `${baseCard} ${safeTheme.bgGradient} border-t-[1px] border-white/15 border-x-white/[0.03] border-b-white/[0.03] ${safeTheme.borderGlow}`,
        innerGlow: "absolute inset-0 shadow-[inset_0_1px_10px_rgba(255,255,255,0.03)] group-hover:shadow-[inset_0_1px_20px_rgba(255,255,255,0.08)] transition-all duration-500 pointer-events-none",
        text: `${safeTheme.badgeColor} font-semibold drop-shadow-md`,
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        iconBg: `${safeTheme.iconContainer} border-white/5`,
        particleColors: safeTheme.particleColors,
      };

    case "Rare":
      return {
        ambientBleed: `absolute -inset-0.5 ${safeTheme.bgGradient} rounded-3xl blur-md opacity-0 group-hover:opacity-15 transition-opacity duration-500`,
        cardBase: `${baseCard} ${safeTheme.bgGradient} border-t-[1px] border-white/10 border-x-white/[0.02] border-b-transparent ${safeTheme.borderGlow}`,
        innerGlow: "absolute inset-0 shadow-none group-hover:shadow-[inset_0_1px_15px_rgba(255,255,255,0.05)] transition-all duration-500 pointer-events-none",
        text: `${safeTheme.badgeColor} font-semibold`,
        flare: "hidden",
        iconBg: safeTheme.iconContainer,
        particleColors: safeTheme.particleColors,
      };

    case "Uncommon":
      return {
        ambientBleed: "hidden",
        cardBase: `${baseCard} ${safeTheme.bgGradient} border-t-[1px] border-white/5 border-x-transparent border-b-transparent hover:border-white/10 transition-colors duration-300`,
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
        cardBase: `${baseCard} bg-white/[0.02] hover:bg-white/[0.04] border-t-[1px] border-white/[0.03] hover:border-white/10 border-x-transparent border-b-transparent transition-colors duration-300`,
        innerGlow: "hidden",
        text: "text-zinc-400 font-medium",
        flare: "hidden",
        iconBg: "bg-white/[0.03] border border-white/5 text-zinc-400",
        particleColors: ["#3f3f46", "#71717a"], // Deep zinc particles for common
      };
  }
}
