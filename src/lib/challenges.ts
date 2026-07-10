export type OutstandChallenge = {
  id: number;
  title: string;
  description: string;
  emoji: string;
  minutes: number;

  category:
    | "Focus"
    | "Knowledge"
    | "Fitness"
    | "Mindset"
    | "Phone Detox"
    | "Productivity"
    | "Discipline"
    | "Social";

  difficulty: "Easy" | "Medium" | "Hard";

  rarity:
    | "Common"
    | "Uncommon"
    | "Rare"
    | "Epic"
    | "Legendary";

  xp: number;

  theme:
    | "Ocean"
    | "Forest"
    | "Galaxy"
    | "Sunset"
    | "Volcano"
    | "Royal"
    | "Ice"
    | "Neon";

  color: string;
};

export const CHALLENGES: OutstandChallenge[] = [
  {
    id: 1,
    title: "Deep Dive",
    description:
      "Study one subject with complete focus for 10 minutes. No phone. No distractions.",
    emoji: "📚",
    minutes: 10,
    category: "Focus",
    difficulty: "Easy",
    rarity: "Common",
    xp: 20,
    theme: "Ocean",
    color: "#FFFFFF",
  },

  {
    id: 2,
    title: "Ghost Mode",
    description:
      "Put your phone in another room and don't touch it for the next 10 minutes.",
    emoji: "📵",
    minutes: 10,
    category: "Phone Detox",
    difficulty: "Easy",
    rarity: "Common",
    xp: 25,
    theme: "Ice",
    color: "#FFFFFF",
  },

  {
    id: 3,
    title: "Iron Legs",
    description:
      "Complete 40 bodyweight squats with good form.",
    emoji: "💪",
    minutes: 10,
    category: "Fitness",
    difficulty: "Easy",
    rarity: "Common",
    xp: 25,
    theme: "Forest",
    color: "#FFFFFF",
  },

  {
    id: 4,
    title: "Mind Reset",
    description:
      "Meditate in complete silence for 10 minutes. Focus only on your breathing.",
    emoji: "🧠",
    minutes: 10,
    category: "Mindset",
    difficulty: "Easy",
    rarity: "Uncommon",
    xp: 40,
    theme: "Galaxy",
    color: "#A855F7",
  },

  {
    id: 5,
    title: "Mission Clean",
    description:
      "Completely clean and organize your study desk before continuing your work.",
    emoji: "🧹",
    minutes: 10,
    category: "Productivity",
    difficulty: "Easy",
    rarity: "Common",
    xp: 20,
    theme: "Sunset",
    color: "#FFFFFF",
  },
];
export function randomChallenge(exclude?: string): OutstandChallenge {
  const pool = exclude
    ? CHALLENGES.filter((c) => c.title !== exclude)
    : CHALLENGES;

  return pool[Math.floor(Math.random() * pool.length)];
}

// Deterministic daily pick so everyone sees the same challenge today
export function dailyChallenge(dateISO: string): OutstandChallenge {
  let h = 0;

  for (let i = 0; i < dateISO.length; i++) {
    h = (h * 31 + dateISO.charCodeAt(i)) >>> 0;
  }

  return CHALLENGES[h % CHALLENGES.length];
}
