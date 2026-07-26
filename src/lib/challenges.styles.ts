import { OutstandChallenge } from "./challenges.types";

// --- PREMIUM GAME VISUALS ---
export function getRarityStyle(rarity: OutstandChallenge["rarity"]) {
  switch (rarity) {
    case "Legendary":
      return {
        border: "border-amber-400/40 hover:border-amber-300/80 transition-colors duration-700",
        shadow: "shadow-[0_0_40px_-10px_rgba(251,191,36,0.25)] hover:shadow-[0_0_80px_-15px_rgba(251,191,36,0.6)]",
        // Shimmering gold gradient text
        text: "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 font-extrabold drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]",
        // Rich, deep glassmorphism
        bg: "bg-gradient-to-br from-amber-500/10 via-black/40 to-black/80 backdrop-blur-xl hover:from-amber-400/20 transform hover:-translate-y-1.5 hover:scale-[1.01] transition-all duration-500 ease-out",
      };
    case "Epic":
      return {
        border: "border-fuchsia-500/40 hover:border-fuchsia-400/70 transition-colors duration-700",
        shadow: "shadow-[0_0_30px_-10px_rgba(217,70,239,0.2)] hover:shadow-[0_0_60px_-15px_rgba(217,70,239,0.5)]",
        // Liquid purple gradient text
        text: "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-purple-500 font-bold drop-shadow-[0_2px_10px_rgba(217,70,239,0.4)]",
        bg: "bg-gradient-to-br from-fuchsia-500/10 via-black/40 to-black/80 backdrop-blur-xl hover:from-fuchsia-400/20 transform hover:-translate-y-1 hover:scale-[1.01] transition-all duration-500 ease-out",
      };
    case "Rare":
      return {
        border: "border-cyan-500/30 hover:border-cyan-400/60 transition-colors duration-500",
        shadow: "shadow-[0_0_20px_-10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_40px_-15px_rgba(6,182,212,0.4)]",
        text: "text-cyan-300 font-semibold drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]",
        bg: "bg-gradient-to-br from-cyan-500/10 to-black/60 backdrop-blur-lg hover:from-cyan-400/15 transform hover:-translate-y-0.5 transition-all duration-500 ease-out",
      };
    case "Uncommon":
      return {
        border: "border-emerald-500/20 hover:border-emerald-400/50 transition-colors duration-500",
        shadow: "shadow-[0_0_15px_-10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_-15px_rgba(16,185,129,0.3)]",
        text: "text-emerald-400 font-medium",
        bg: "bg-emerald-500/5 hover:bg-emerald-400/10 backdrop-blur-md transition-all duration-500",
      };
    case "Common":
    default:
      return {
        border: "border-white/5 hover:border-white/20 transition-colors duration-500",
        shadow: "shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        text: "text-zinc-400 font-medium",
        bg: "bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-sm transition-all duration-500",
      };
  }
}
