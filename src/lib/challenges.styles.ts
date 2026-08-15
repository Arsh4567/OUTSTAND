import type { Variants } from "framer-motion";
import type { OutstandChallenge } from "./challenges.types";

export const EASING = {
  cinematic: [0.19, 1, 0.22, 1],
  expoOut: [0.16, 1, 0.3, 1],
  smooth: [0.4, 0, 0.2, 1],
} as const;

export const SPRINGS = {
  snappy: { type: "spring", damping: 22, stiffness: 360, mass: 0.72 },
  bouncy: { type: "spring", damping: 18, stiffness: 300, mass: 0.65 },
  heavy: { type: "spring", damping: 30, stiffness: 190, mass: 1.15 },
} as const;

export const challengeListVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.045, delayChildren: 0.03 },
  },
};

export const challengeCardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...SPRINGS.snappy, opacity: { duration: 0.28 } },
  },
  hover: {
    y: -5,
    scale: 1.012,
    transition: SPRINGS.bouncy,
  },
  tap: {
    y: -1,
    scale: 0.992,
    transition: { ...SPRINGS.snappy, stiffness: 450 },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: { duration: 0.22, ease: EASING.expoOut },
  },
};

export const iconPulseAnimation: Variants = {
  animate: {
    scale: [1, 1.045, 1],
    opacity: [0.86, 1, 0.86],
    transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
  },
};

export const cinematicUnlockVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(18px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASING.cinematic },
  },
  shockwave: {
    scale: [1, 2.3],
    opacity: [1, 0],
    borderWidth: ["8px", "0px"],
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

const BASE = {
  card: "relative isolate overflow-hidden rounded-[2rem] border backdrop-blur-2xl transform-gpu transition-[transform,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform motion-reduce:transition-none motion-reduce:transform-none",
  specular: "border-t-white/20 border-x-white/10 border-b-white/[0.06]",
  inner: "pointer-events-none absolute inset-0 rounded-[2rem]",
};

export function getChallengeStyles(challenge: OutstandChallenge) {
  const { rarity, theme } = challenge;
  const safeTheme = theme ?? {
    bgGradient: "bg-slate-950",
    borderGlow: "hover:shadow-none",
    iconContainer: "bg-white/5 border-white/10",
    badgeColor: "text-zinc-300",
    particleColors: ["#e4e4e7", "#71717a"],
  };

  const shared = {
    particleColors: safeTheme.particleColors,
    iconBg: `${safeTheme.iconContainer} transition-colors duration-500`,
  };

  switch (rarity) {
    case "Divine":
      return {
        ...shared,
        ambientBleed: `absolute -inset-3 ${safeTheme.bgGradient} rounded-[2.5rem] blur-3xl opacity-45 group-hover:opacity-75 transition-opacity duration-700 motion-reduce:transition-none`,
        cardBase: `${BASE.card} ${safeTheme.bgGradient} ${BASE.specular} border-white/20 shadow-[0_24px_80px_-25px_rgba(255,255,255,0.35)] group-hover:shadow-[0_30px_100px_-22px_rgba(255,255,255,0.48)]`,
        innerGlow: `${BASE.inner} shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_0_70px_rgba(255,255,255,0.14)] group-hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),inset_0_0_100px_rgba(255,255,255,0.22)]`,
        text: `${safeTheme.badgeColor} font-black tracking-tight drop-shadow-[0_0_18px_rgba(255,255,255,0.45)]`,
        flare: "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1.8s_infinite] motion-reduce:group-hover:animate-none",
      };
    case "Mythic":
      return {
        ...shared,
        ambientBleed: `absolute -inset-2 ${safeTheme.bgGradient} rounded-[2.3rem] blur-2xl opacity-30 group-hover:opacity-55 transition-opacity duration-700 motion-reduce:transition-none`,
        cardBase: `${BASE.card} ${safeTheme.bgGradient} ${BASE.specular} border-white/15 shadow-[0_18px_65px_-24px_rgba(255,255,255,0.24)] group-hover:shadow-[0_22px_80px_-20px_rgba(255,255,255,0.32)]`,
        innerGlow: `${BASE.inner} shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_0_50px_rgba(255,255,255,0.08)]`,
        text: `${safeTheme.badgeColor} font-extrabold tracking-tight drop-shadow-[0_2px_16px_rgba(255,255,255,0.4)]`,
        flare: "pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 motion-reduce:transition-none",
      };
    case "Legendary":
      return {
        ...shared,
        ambientBleed: `absolute -inset-1 ${safeTheme.bgGradient} rounded-[2.2rem] blur-xl opacity-20 group-hover:opacity-35 transition-opacity duration-500`,
        cardBase: `${BASE.card} ${safeTheme.bgGradient} ${BASE.specular} border-white/12 shadow-[0_14px_42px_-18px_rgba(0,0,0,0.65)] group-hover:shadow-[0_20px_56px_-18px_rgba(0,0,0,0.7)]`,
        innerGlow: `${BASE.inner} shadow-[inset_0_1px_18px_rgba(255,255,255,0.07)] group-hover:shadow-[inset_0_1px_26px_rgba(255,255,255,0.1)]`,
        text: `${safeTheme.badgeColor} font-bold drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]`,
        flare: "pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500",
      };
    case "Epic":
      return {
        ...shared,
        ambientBleed: `absolute -inset-0.5 ${safeTheme.bgGradient} rounded-[2.1rem] blur-lg opacity-10 group-hover:opacity-20 transition-opacity duration-500`,
        cardBase: `${BASE.card} ${safeTheme.bgGradient} border border-white/10 ${safeTheme.borderGlow} shadow-[0_10px_30px_-16px_rgba(0,0,0,0.7)] group-hover:shadow-[0_15px_40px_-14px_rgba(0,0,0,0.72)]`,
        innerGlow: `${BASE.inner} shadow-[inset_0_1px_12px_rgba(255,255,255,0.045)]`,
        text: `${safeTheme.badgeColor} font-semibold`,
        flare: "pointer-events-none absolute inset-0 bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400",
      };
    case "Rare":
      return {
        ...shared,
        ambientBleed: `absolute inset-0 ${safeTheme.bgGradient} rounded-[2rem] blur-lg opacity-0 group-hover:opacity-12 transition-opacity duration-400`,
        cardBase: `${BASE.card} ${safeTheme.bgGradient} border border-white/[0.07] border-t-white/12 ${safeTheme.borderGlow} shadow-[0_8px_24px_-16px_rgba(0,0,0,0.75)]`,
        innerGlow: `${BASE.inner} group-hover:shadow-[inset_0_1px_14px_rgba(255,255,255,0.04)]`,
        text: `${safeTheme.badgeColor} font-semibold`,
        flare: "hidden",
      };
    case "Uncommon":
      return {
        ...shared,
        ambientBleed: "hidden",
        cardBase: `${BASE.card} ${safeTheme.bgGradient} border border-white/[0.06] hover:border-white/12 hover:bg-white/[0.035] shadow-sm`,
        innerGlow: "hidden",
        text: `${safeTheme.badgeColor} font-medium`,
        flare: "hidden",
      };
    case "Common":
    default:
      return {
        ...shared,
        ambientBleed: "hidden",
        cardBase: `${BASE.card} bg-white/[0.018] hover:bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] shadow-none`,
        innerGlow: "hidden",
        text: "text-zinc-400 font-medium",
        flare: "hidden",
        iconBg: "bg-white/[0.03] border border-white/5 text-zinc-400",
        particleColors: ["#52525b", "#71717a"],
      };
  }
}
