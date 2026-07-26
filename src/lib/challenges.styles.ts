import { OutstandChallenge } from "./challenges.types";

// --- PREMIUM GAME VISUALS ---
export function getRarityStyle(rarity: OutstandChallenge["rarity"]) {
  switch (rarity) {
    case "Legendary":
      return {
        border: "border-yellow-500/80 hover:border-yellow-300 transition-colors duration-500",
        shadow: "shadow-[0_0_50px_rgba(234,179,8,0.6)] hover:shadow-[0_0_100px_rgba(253,224,71,1)] animate-pulse",
        text: "text-yellow-400 drop-shadow-[0_0_15px_rgba(253,224,71,0.9)] font-bold",
        bg: "bg-gradient-to-br from-yellow-500/20 to-black/80 hover:from-yellow-400/30 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out",
      };
    case "Epic":
      return {
        border: "border-purple-500/70 hover:border-purple-300 transition-colors duration-500",
        shadow: "shadow-[0_0_35px_rgba(168,85,247,0.4)] hover:shadow-[0_0_70px_rgba(216,180,254,0.9)]",
        text: "text-purple-400 drop-shadow-[0_0_10px_rgba(216,180,254,0.8)]",
        bg: "bg-gradient-to-br from-purple-600/20 to-black/80 hover:from-purple-500/30 transform hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 ease-out",
      };
    case "Rare":
      return {
        border: "border-blue-500/60 hover:border-blue-400 transition-colors duration-500",
        shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_45px_rgba(96,165,250,0.7)]",
        text: "text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]",
        bg: "bg-blue-500/10 hover:bg-blue-400/20 transform hover:scale-[1.02] transition-all duration-300 ease-out",
      };
    case "Uncommon":
      return {
        border: "border-emerald-500/50 hover:border-emerald-400 transition-colors duration-300",
        shadow: "shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10 hover:bg-emerald-400/15 transform hover:scale-[1.01] transition-all duration-300",
      };
    case "Common":
    default:
      return {
        border: "border-white/10 hover:border-white/30 transition-colors duration-300",
        shadow: "shadow-none hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        text: "text-slate-300",
        bg: "bg-white/5 hover:bg-white/10 transition-all duration-300",
      };
  }
}
