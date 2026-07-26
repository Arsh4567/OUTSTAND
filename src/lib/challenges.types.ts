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
  theme: "Ocean" | "Forest" | "Galaxy" | "Sunset" | "Volcano" | "Royal" | "Ice" | "Neon" | "Sky";
  color: string;
};
