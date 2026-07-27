import { Variants } from "framer-motion";
import { OutstandChallenge } from "./challenges.types";

/**
 * ---------------------------------------------------------------------------
 * 1. FRAMER MOTION PHYSICS & ANIMATIONS
 * ---------------------------------------------------------------------------
 */

export const challengeListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

export const challengeCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40, 
    scale: 0.9,
    rotateX: -15, 
    filter: "blur(10px)" 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 200, damping: 20, mass: 1 }
  },
  hover: { 
    y: -8,
    scale: 1.02,
    rotateX: 2,
    rotateY: 2,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  tap: { 
    y: 0, 
    scale: 0.97, 
    rotateX: 0,
    rotateY: 0,
    transition: { type: "spring", stiffness: 500, damping: 15 }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    filter: "blur(10px)",
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

export const iconPulseAnimation: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
};

/**
 * ---------------------------------------------------------------------------
 * 2. PREMIUM VISUAL ENGINE (TAILWIND)
 * ---------------------------------------------------------------------------
 * Dynamically merges the new `ChallengeTheme` colors with `Rarity` intensity.
 */

export function getChallengeStyles(challenge: OutstandChallenge) {
  const { rarity, theme } = challenge;

  // Defensive fallback in case data is missing during a hot reload
  const safeTheme = theme || {
    bgGradient: "bg-zinc-900",
    borderGlow: "hover:shadow-none",
    iconContainer: "bg-zinc-800 border-zinc-700",
    badgeColor: "text-zinc-400",
    particleColors: ["#ffffff", "#a1a1aa"],
  };

  switch (rarity) {
    case "Divine":
      return {
        ambientBleed: `absolute -inset-1 ${safeTheme.bgGradient} rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition duration-700`,
        cardBase: `relative ${safeTheme.bgGradient} backdrop-blur-2xl border-[0.5px] border-white/40 overflow-hidden ${safeTheme.borderGlow}`,
        innerGlow: "shadow-[inset_0_0_40px_rgba(255,255,255,0.2)] group-hover:shadow-[inset_0_0_60px_rgba(255,255,255,0.4)] transition-all duration-700",
        text: `${safeTheme.badgeColor} font-extrabold drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] tracking-tight`,
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]",
        iconBg: `${safeTheme.iconContainer} shadow-[0_0_20px_rgba(255,255,255,0.6)]`,
        particleColors: safeTheme.particleColors,
      };

    case "Mythic":
      return {
        ambientBleed: `absolute -inset-1 ${safeTheme.bgGradient} rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition duration-700 animate-pulse`,
        cardBase: `relative ${safeTheme.bgGradient} backdrop-blur-xl border-[0.5px] border-white/20 overflow-hidden ${safeTheme.borderGlow}`,
        innerGlow: "shadow-[inset_0_1px_30px_rgba(255,255,255,0.1)] group-hover:shadow-[inset_0_1px_40px_rgba(255,255,255,0.2)] transition-all duration-500",
        text: `${safeTheme.badgeColor} font-black drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]`,
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        iconBg: `${safeTheme.iconContainer} shadow-[0_0_15px_rgba(255,255,255,0.3)]`,
        particleColors: safeTheme.particleColors,
      };

    case "Legendary":
      return {
        ambientBleed: `absolute -inset-1 ${safeTheme.bgGradient} rounded-3xl blur-xl opacity-20 group-hover:opacity-50 transition duration-700`,
        cardBase: `relative ${safeTheme.bgGradient} backdrop-blur-lg border border-white/10 overflow-hidden ${safeTheme.borderGlow}`,
        innerGlow: "shadow-[inset_0_1px_15px_rgba(255,255,255,0.05)] group-hover:shadow-[inset_0_1px_25px_rgba(255,255,255,0.15)] transition-all duration-500",
        text: `${safeTheme.badgeColor} font-extrabold drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]`,
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2.5s_infinite]",
        iconBg: `${safeTheme.iconContainer} shadow-lg`,
        particleColors: safeTheme.particleColors,
      };

    case "Epic":
      return {
        ambientBleed: `absolute -inset-0.5 ${safeTheme.bgGradient} rounded-3xl blur-lg opacity-15 group-hover:opacity-40 transition duration-500`,
        cardBase: `relative ${safeTheme.bgGradient} backdrop-blur-lg border border-white/5 overflow-hidden ${safeTheme.borderGlow}`,
        innerGlow: "shadow-[inset_0_1px_10px_rgba(255,255,255,0.05)] group-hover:shadow-[inset_0_1px_20px_rgba(255,255,255,0.1)] transition-all duration-500",
        text: `${safeTheme.badgeColor} font-bold drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]`,
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
        iconBg: safeTheme.iconContainer,
        particleColors: safeTheme.particleColors,
      };

    case "Rare":
      return {
        ambientBleed: `absolute -inset-0.5 ${safeTheme.bgGradient} rounded-3xl blur-md opacity-0 group-hover:opacity-20 transition duration-500`,
        cardBase: `relative ${safeTheme.bgGradient} backdrop-blur-md border border-white/5 ${safeTheme.borderGlow}`,
        innerGlow: "shadow-none group-hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] transition-all",
        text: `${safeTheme.badgeColor} font-semibold drop-shadow-md`,
        flare: "hidden",
        iconBg: safeTheme.iconContainer,
        particleColors: safeTheme.particleColors,
      };

    case "Uncommon":
      return {
        ambientBleed: "hidden",
        cardBase: `relative ${safeTheme.bgGradient} backdrop-blur-md border border-white/5 transition-colors duration-300`,
        innerGlow: "none",
        text: `${safeTheme.badgeColor} font-medium`,
        flare: "hidden",
        iconBg: safeTheme.iconContainer,
        particleColors: safeTheme.particleColors,
      };

    case "Common":
    default:
      return {
        ambientBleed: "hidden",
        cardBase: "relative bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-sm border border-white/5 hover:border-white/10 transition-colors duration-300",
        innerGlow: "none",
        text: "text-zinc-400 font-medium",
        flare: "hidden",
        iconBg: "bg-white/5 border border-white/10 text-zinc-400",
        particleColors: ["#a1a1aa", "#71717a"],
      };
  }
}
