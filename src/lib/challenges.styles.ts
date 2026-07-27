import { Variants } from "framer-motion";
import { OutstandChallenge } from "./challenges.types";

/**
 * ---------------------------------------------------------------------------
 * 1. FRAMER MOTION PHYSICS & ANIMATIONS
 * ---------------------------------------------------------------------------
 * Export these to wrap your Challenge cards for world-class micro-interactions.
 */

// Staggered list loading (Use on the parent container)
export const challengeListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Advanced 3D-like Card Physics
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
    transition: { 
      type: "spring", 
      stiffness: 200, 
      damping: 20, 
      mass: 1 
    }
  },
  hover: { 
    y: -8,
    scale: 1.02,
    rotateX: 2,
    rotateY: 2,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 25 
    }
  },
  tap: { 
    y: 0, 
    scale: 0.97, 
    rotateX: 0,
    rotateY: 0,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 15 
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    filter: "blur(10px)",
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

// Infinite breathing effect for the challenge icons
export const iconPulseAnimation: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};


/**
 * ---------------------------------------------------------------------------
 * 2. PREMIUM VISUAL ENGINE (TAILWIND)
 * ---------------------------------------------------------------------------
 * Multi-layered design tokens for absolute perfection in rendering.
 */

export function getRarityStyle(rarity: OutstandChallenge["rarity"]) {
  switch (rarity) {
    case "Divine":
      return {
        // Outer ambient glow bleeding behind the card
        ambientBleed: "absolute -inset-1 bg-gradient-to-r from-white via-cyan-200 to-amber-200 rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition duration-700",
        // The actual card border and glass background
        cardBase: "relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border-[0.5px] border-white/40 overflow-hidden",
        // Inner shadow for 3D depth
        innerGlow: "shadow-[inset_0_0_40px_rgba(255,255,255,0.2)] group-hover:shadow-[inset_0_0_60px_rgba(255,255,255,0.4)] transition-all duration-700",
        // Text styling
        text: "text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-amber-100 font-extrabold drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] tracking-tight",
        // Moving light sweep effect (add an empty div with this class inside your card)
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]",
        iconBg: "bg-white/20 border border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.6)] text-white",
        particleColors: ["#ffffff", "#cffafe", "#fef08a"], // White, Cyan-100, Amber-100
      };

    case "Mythic":
      return {
        ambientBleed: "absolute -inset-1 bg-gradient-to-r from-purple-600 via-rose-600 to-blue-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition duration-700 animate-pulse",
        cardBase: "relative bg-gradient-to-b from-purple-950/80 via-black to-black backdrop-blur-xl border-[0.5px] border-purple-500/30 overflow-hidden",
        innerGlow: "shadow-[inset_0_1px_20px_rgba(168,85,247,0.15)] group-hover:shadow-[inset_0_1px_30px_rgba(168,85,247,0.3)] transition-all duration-500",
        text: "text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-rose-300 to-blue-300 font-black drop-shadow-[0_2px_20px_rgba(168,85,247,0.5)]",
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        iconBg: "bg-purple-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-purple-200",
        particleColors: ["#a855f7", "#e11d48", "#2563eb"], 
      };

    case "Legendary":
      return {
        ambientBleed: "absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-50 transition duration-700",
        cardBase: "relative bg-gradient-to-br from-amber-500/10 via-black/60 to-black backdrop-blur-lg border border-amber-500/30 overflow-hidden",
        innerGlow: "shadow-[inset_0_1px_15px_rgba(251,191,36,0.1)] group-hover:shadow-[inset_0_1px_25px_rgba(251,191,36,0.25)] transition-all duration-500",
        text: "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 font-extrabold drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]",
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2.5s_infinite]",
        iconBg: "bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.25)] text-amber-300",
        particleColors: ["#fde68a", "#fbbf24", "#f97316"],
      };

    case "Epic":
      return {
        ambientBleed: "absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-3xl blur-lg opacity-15 group-hover:opacity-40 transition duration-500",
        cardBase: "relative bg-gradient-to-br from-fuchsia-500/10 via-zinc-950 to-black backdrop-blur-lg border border-fuchsia-500/20 overflow-hidden",
        innerGlow: "shadow-[inset_0_1px_10px_rgba(217,70,239,0.1)] group-hover:shadow-[inset_0_1px_20px_rgba(217,70,239,0.2)] transition-all duration-500",
        text: "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-purple-400 font-bold drop-shadow-[0_2px_8px_rgba(217,70,239,0.4)]",
        flare: "absolute inset-0 bg-gradient-to-tr from-transparent via-fuchsia-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
        iconBg: "bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300",
        particleColors: ["#f0abfc", "#d946ef", "#a855f7"],
      };

    case "Rare":
      return {
        ambientBleed: "absolute -inset-0.5 bg-cyan-500 rounded-3xl blur-md opacity-0 group-hover:opacity-20 transition duration-500",
        cardBase: "relative bg-gradient-to-br from-cyan-500/5 to-zinc-950 backdrop-blur-md border border-cyan-500/20",
        innerGlow: "shadow-none group-hover:shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] transition-all",
        text: "text-cyan-300 font-semibold drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]",
        flare: "hidden",
        iconBg: "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
        particleColors: ["#67e8f9", "#06b6d4"],
      };

    case "Uncommon":
      return {
        ambientBleed: "hidden",
        cardBase: "relative bg-emerald-500/5 hover:bg-emerald-500/10 backdrop-blur-md border border-emerald-500/15 transition-colors duration-300",
        innerGlow: "none",
        text: "text-emerald-400 font-medium",
        flare: "hidden",
        iconBg: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
        particleColors: ["#34d399", "#10b981"],
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
