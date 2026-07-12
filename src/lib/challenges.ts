export type OutstandChallenge = {
  id: number;
  title: string;
  description: string;
  emoji: string;
  minutes: number;
  category: "Focus" | "Knowledge" | "Fitness" | "Mindset" | "Phone Detox" | "Productivity" | "Discipline" | "Social";
  difficulty: "Easy" | "Medium" | "Hard";
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  xp: number;
  theme: "Ocean" | "Forest" | "Galaxy" | "Sunset" | "Volcano" | "Royal" | "Ice" | "Neon";
  color: string;
};

// --- PREMIUM GAME VISUALS ---
// This helper dictates how a card glows and looks based on its rarity
export function getRarityStyle(rarity: OutstandChallenge["rarity"]) {
  switch (rarity) {
    case "Legendary":
      return {
        border: "border-yellow-500/60",
        shadow: "shadow-[0_0_40px_rgba(234,179,8,0.4)]",
        text: "text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]",
        bg: "bg-yellow-500/10",
      };
    case "Epic":
      return {
        border: "border-purple-500/60",
        shadow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
        text: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]",
        bg: "bg-purple-500/10",
      };
    case "Rare":
      return {
        border: "border-blue-500/50",
        shadow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]",
        text: "text-blue-400",
        bg: "bg-blue-500/10",
      };
    case "Uncommon":
      return {
        border: "border-emerald-500/40",
        shadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    case "Common":
    default:
      return {
        border: "border-white/10",
        shadow: "shadow-none",
        text: "text-slate-300",
        bg: "bg-white/5",
      };
  }
}

// --- BATCH 1: 30 CHALLENGES ---
export const CHALLENGES: OutstandChallenge[] = [
  // Legendary (Massive XP, Hard)
  { id: 1, title: "Absolute Zero", description: "Turn your phone completely off. Put it in a drawer. Sit in silence and plan your next 5 years.", emoji: "🧊", minutes: 10, category: "Phone Detox", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Ice", color: "#38bdf8" },
  { id: 2, title: "The Spartan", description: "Hold a wall sit for as long as possible, then do pushups until the timer ends. No resting.", emoji: "⚔️", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Volcano", color: "#ef4444" },
  { id: 3, title: "Deep Architecture", description: "Write out the exact step-by-step roadmap for the biggest goal in your life right now.", emoji: "🏛️", minutes: 10, category: "Focus", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Royal", color: "#eab308" },
  
  // Epic (High XP, Medium/Hard)
  { id: 4, title: "Digital Purge", description: "Delete 5 apps you waste time on, then clear your recent photos of junk.", emoji: "🗑️", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 5, title: "Cold Exposure", description: "Wash your face with freezing cold water for 60 seconds, then meditate for the remaining 9 minutes.", emoji: "🥶", minutes: 10, category: "Mindset", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Ice", color: "#38bdf8" },
  { id: 6, title: "Velocity Reading", description: "Pick up a non-fiction book and read as fast as you can without losing comprehension.", emoji: "📖", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Galaxy", color: "#a855f7" },
  { id: 7, title: "Chaos Control", description: "Find the messiest room or area in your house. Clean it aggressively until the timer stops.", emoji: "🌪️", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Sunset", color: "#f97316" },

  // Rare (Solid XP, Medium)
  { id: 8, title: "Core Crusher", description: "Alternate between 30 seconds of planks and 30 seconds of crunches.", emoji: "🔥", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Volcano", color: "#ef4444" },
  { id: 9, title: "Inbox Zero", description: "Clear out your unread emails. Unsubscribe from newsletters you never read.", emoji: "📬", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Ocean", color: "#0ea5e9" },
  { id: 10, title: "Future Self Journal", description: "Write a letter to yourself exactly 6 months from today. What do you hope you've achieved?", emoji: "✍️", minutes: 10, category: "Mindset", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Galaxy", color: "#a855f7" },
  { id: 11, title: "The Purge", description: "Find 3 items in your room to throw away or donate. Declutter your physical space.", emoji: "📦", minutes: 10, category: "Discipline", difficulty: "Easy", rarity: "Rare", xp: 60, theme: "Forest", color: "#22c55e" },
  { id: 12, title: "Brain Dump", description: "Write down every single task, worry, or idea in your head on a piece of paper.", emoji: "🧠", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Rare", xp: 60, theme: "Neon", color: "#c084fc" },
  { id: 13, title: "Blind Flight", description: "Turn on airplane mode. Do not turn it off until the 10 minutes are up.", emoji: "✈️", minutes: 10, category: "Phone Detox", difficulty: "Easy", rarity: "Rare", xp: 60, theme: "Sky", color: "#38bdf8" },

  // Uncommon (Good XP, Easy/Medium)
  { id: 14, title: "Iron Legs", description: "Complete 40 bodyweight squats with perfect form, then stretch.", emoji: "🦵", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Forest", color: "#22c55e" },
  { id: 15, title: "Hydration Protocol", description: "Drink a large glass of water. Spend the rest of the time stretching your neck and back.", emoji: "💧", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Ocean", color: "#0ea5e9" },
  { id: 16, title: "Gratitude Log", description: "Write down 5 things you are genuinely grateful for right now.", emoji: "🙏", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Sunset", color: "#f97316" },
  { id: 17, title: "Desktop Sweep", description: "Clean up your computer's desktop and empty the trash/recycle bin.", emoji: "💻", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Neon", color: "#c084fc" },
  { id: 18, title: "Stair Climber", description: "Find a staircase and walk up and down continuously.", emoji: "🪜", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Volcano", color: "#ef4444" },
  { id: 19, title: "Text a Mentor", description: "Send a message to someone you look up to, thanking them or asking a smart question.", emoji: "📱", minutes: 10, category: "Social", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Royal", color: "#eab308" },
  { id: 20, title: "Language Sprint", description: "Spend 10 minutes learning 5 new words in a foreign language.", emoji: "🌍", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Galaxy", color: "#a855f7" },
  
  // Common (Base XP, Easy)
  { id: 21, title: "Deep Dive", description: "Study or work on one specific task. No tabs. No music with lyrics.", emoji: "🎯", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ocean", color: "#0ea5e9" },
  { id: 22, title: "Ghost Mode", description: "Put your phone out of sight and do not touch it.", emoji: "📵", minutes: 10, category: "Phone Detox", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ice", color: "#38bdf8" },
  { id: 23, title: "Mission Clean", description: "Organize your immediate workspace.", emoji: "🧹", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sunset", color: "#f97316" },
  { id: 24, title: "Mind Reset", description: "Sit still and focus only on the sensation of breathing.", emoji: "🧘", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Forest", color: "#22c55e" },
  { id: 25, title: "Sunlight Walk", description: "Walk outside without your phone. Just look at the horizon.", emoji: "☀️", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sunset", color: "#f97316" },
  { id: 26, title: "Posture Fix", description: "Do chest openers and touch your toes. Correct your posture.", emoji: "🧍", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ocean", color: "#0ea5e9" },
  { id: 27, title: "Podcast Snippet", description: "Listen to exactly 10 minutes of an educational podcast. Take one note.", emoji: "🎧", minutes: 10, category: "Knowledge", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Neon", color: "#c084fc" },
  { id: 28, title: "Wallet Audit", description: "Clean out your physical wallet or purse of old receipts.", emoji: "💳", minutes: 10, category: "Discipline", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Royal", color: "#eab308" },
  { id: 29, title: "Eye Rest", description: "Look at something at least 20 feet away to rest your eyes from screens.", emoji: "👁️", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Galaxy", color: "#a855f7" },
  { id: 30, title: "Quick Read", description: "Read a few pages of a book you've been putting off.", emoji: "📚", minutes: 10, category: "Knowledge", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Forest", color: "#22c55e" },
];

// --- LOGIC ---
export function randomChallenge(excludeTitle?: string): OutstandChallenge {
  const pool = excludeTitle
    ? CHALLENGES.filter((c) => c.title !== excludeTitle)
    : CHALLENGES;
  return pool[Math.floor(Math.random() * pool.length)];
}
export function dailyChallenge(dateISO: string): OutstandChallenge {
  let h = 0;
  for (let i = 0; i < dateISO.length; i++) {
    h = (h * 31 + dateISO.charCodeAt(i)) >>> 0;
  }
  return CHALLENGES[h % CHALLENGES.length];
}

